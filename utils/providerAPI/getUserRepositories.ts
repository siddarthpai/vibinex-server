import axios from "axios";
import type { Session } from "next-auth";
import { baseURL, supportedProviders } from ".";
import type { RepoIdentifier } from "../../types/repository";
import { bitbucketAccessToken } from "./auth";
import { Bitbucket } from "./Bitbucket";

type GithubRepoObj = {
	name: string;
	owner: {
		login: string;
	};
}

type BitbucketWorkspaceObj = {
	type: string,
	user: {
		display_name: string,
		links: object[],
		type: 'user',
		uuid: string,
		account_id: string,
		nickname: string
	},
	workspace: {
		type: 'workspace',
		uuid: string,
		name: string,
		slug: string,
		links: object[]
	},
	links: { self: object[] },
	added_on: string,
	permission: string,
	last_accessed: string
}

type BitbucketRepoObj = {
	type: 'repository',
	full_name: string,
	links: object[],
	name: string,
	slug: string,
	description: string,
	scm: 'git',
	owner: object,
	workspace: {
		type: 'workspace',
		uuid: string,
		name: string,
		slug: string,
		links: object[]
	},
	is_private: boolean,
	project: object,
	uuid: string,
}

// type GitlabRepoObj = {
// }
const getUserRepositoriesForGitHub = async (access_token: string, authId?: string) => {
	const perPage = 100;
	let endCursor = null;
	let hasNextPage = true;
	const allGitHubRepositories: RepoIdentifier[] = [];

	do {
		const query: string = `
			query GetUserRepositories {
				viewer {
					repositories(
						first: ${perPage}
						after: ${endCursor ? `"${endCursor}"` : null}
						affiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
						ownerAffiliations: [OWNER, ORGANIZATION_MEMBER, COLLABORATOR]
					) {
						totalCount
						pageInfo {
							endCursor
							hasNextPage
						}
						nodes {
							name
							owner {
								login
							}
						}
					}
				}
			}
		`;

		try {
			const response = await axios.post(
				'https://api.github.com/graphql',
				{ query },
				{
					headers: {
						Authorization: `Bearer ${access_token}`,
					},
				}
			);

			const data = response.data.data;
			const repos: GithubRepoObj[] = data.viewer.repositories.nodes;

			if (repos.length === 0) {
				console.warn(`[getUserRepositories] No repositories received from GitHub API (provider-assigned id: ${authId}).`);
				break;
			}

			const allGitHubRepoIdentifiers = repos.map(repo => ({
				repo_provider: supportedProviders[0],
				repo_owner: repo.owner.login,
				repo_name: repo.name,
			}));

			allGitHubRepositories.push(...allGitHubRepoIdentifiers);

			hasNextPage = data.viewer.repositories.pageInfo.hasNextPage;
			endCursor = data.viewer.repositories.pageInfo.endCursor;
		} catch (err) {
			console.error(`[getUserRepositories] Error occurred while getting user repositories from GitHub GraphQL API (provider-assigned id: ${authId}).`, err);
			throw err;
		}
	} while (hasNextPage);

	// Sort repositories by repo_owner and then by repo_name
	allGitHubRepositories.sort((a , b) => {
		if (a.repo_owner === b.repo_owner) {
			return a.repo_name.localeCompare(b.repo_name);
		}
		return a.repo_owner.localeCompare(b.repo_owner);
	});

	return allGitHubRepositories;
}

export const getUserRepositoriesForBitbucket = async (access_key: string, authId?: string): Promise<RepoIdentifier[]> => {
	const workspacesData = await Bitbucket.retrieveAllPages<BitbucketWorkspaceObj>(`/user/permissions/workspaces`, access_key, authId);
	const workspaces = workspacesData.map((workspaceObj) => workspaceObj.workspace.slug);

	const repositories: RepoIdentifier[] = [];
	for (const workspace of workspaces) {
		const repositoriesData = await Bitbucket.retrieveAllPages<BitbucketRepoObj>(`/repositories/${workspace}`, access_key, authId);
		const allBitbucketRepoIdentifiers = repositoriesData.map(repoObj => ({
			repo_provider: supportedProviders[1],
			repo_owner: repoObj.workspace.slug,
			repo_name: repoObj.slug
		}));
		repositories.push(...allBitbucketRepoIdentifiers);
	}
	return repositories;
}

export const getUserRepositories = async (session: Session) => {
	const allUserReposPromises = [];
	for (const repoProvider of supportedProviders) {
		if (!Object.keys(session.user.auth_info!).includes(repoProvider)) {
			console.warn(`[getUserRepositories] ${repoProvider} provider not present`);
			continue;
		}
		for (const [authId, providerAuthInfo] of Object.entries(session.user.auth_info![repoProvider])) {
			if (!providerAuthInfo) {
				console.error("[getUserRepositories] Unable to deserialize providerAuthInfo ", providerAuthInfo);
				continue;
			}
			switch (repoProvider) {
				case 'github': {
					const userReposPromiseGitHub = getUserRepositoriesForGitHub(providerAuthInfo['access_token'], authId)
					allUserReposPromises.push(userReposPromiseGitHub);
					break;
				}
				case 'bitbucket': {
					const access_key_refreshed: string | null = await bitbucketAccessToken(authId, session.user.id!);
					const access_key = access_key_refreshed ?? providerAuthInfo['access_token']; // decision: continue with old access key if the refresh operation fails
					const userReposPromiseBitbucket = getUserRepositoriesForBitbucket(access_key, authId);
					allUserReposPromises.push(userReposPromiseBitbucket);
					break;
				}
				default:
					break;
			}
		}
	}

	const allRepos: Set<RepoIdentifier> = new Set();
	await Promise.allSettled(allUserReposPromises).then((results) => {
		results.forEach((result) => {
			if (result.status !== 'fulfilled') {
				console.error(`[getUserRepositories] Failed to get repositories of the user (id: ${session.user.id}, name: ${session.user.name}) from one of the providers`, result.reason);
				return;
			}
			const providerRepos = result.value;
			providerRepos.forEach((repo: RepoIdentifier) => allRepos.add(repo));
		})
	})
	return Array.from(allRepos);
}