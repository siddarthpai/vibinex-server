import Link from "next/link";
import Button from "../components/Button";

export default function Auth() {

  const handleAuthorize = () => {
    // Construct the URL to the Bitbucket authorization page
    const baseUrl = 'https://bitbucket.org/site/oauth2/authorize';
    const redirectUri = 'https://gcscruncsql-k7jns52mtq-el.a.run.app/authorise_bitbucket_consumer'; // Change this to the orginal redirecturi
    const scopes = 'repository';
    const clientId = process.env.NEXT_PUBLIC_BITBUCKET_OAUTH_CLIENT_ID;

    const url = `${baseUrl}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;

    window.location.href = url;
  };

  return (
    <div className="container mx-auto px-4 py-8">
		<div className="mb-12">
			<h1 className="text-4xl font-bold mb-4">Setup Instructions - Github</h1>
			<ol className="list-decimal pl-4 text-lg">
				<li className="mb-4">Log in/Sign up with Vibinex chrome-extension</li>
				<li className="mb-4">Install <Link href="https://github.com/apps/repoprofiler" className="text-blue-500">Repo Profiler Github App</Link> from Github Marketplace in your org/personal account. Make sure you have the permissions required to install the app.</li>
				<li className="mb-4">For each repository, add the following Github Workflow code to use our Github Action:</li>
				<pre className="bg-gray-100 rounded-md p-4 mb-4" style={{ whiteSpace: 'pre-wrap' }}>
					<code>
					on:< br/>
					repository_dispatch:< br/>
						types: repo_profile_execution< br/>
					jobs:< br/>
					profile:< br/>
						runs-on: ubuntu-22.04< br/>
						steps:< br/>
						- name: Checkout< br/>
						uses: actions/checkout@v3< br/>
						with:< br/>
						fetch-depth: 0< br/>
						- name: Repository Profiler< br/>
						uses: Alokit-Innovations/repo-profiler@v0< br/>
					</code>
				</pre>
				<p className="mb-4">The code should be added in a file named &quot;repo-profiler.yml&quot; present on the following path - &quot;.github/workflows/repo-profiler.yml&quot; inside the repository.</p>
				<li className="mb-4">After installing Github app and adding Github Action to a repository, you should be able to see the Vibinex icon beside the name of the repository. This means your repository is all set up!</li>
				<li className="mb-4">Go to the list of open Pull Requests in your repository. Relevant pull requests will be highlighted in yellow or red.</li>
				<li>Go to the &quot;Files&quot; tab in a pull request. Files relevant to you will be highlighted in yellow or red.</li>
			</ol>
		</div>
		<div className="mb-12">
			<h1 className="text-4xl font-bold mb-4">Setup Instructions - Bitbucket</h1>
			<ol className="list-decimal pl-4 text-lg">
				<li className="mb-4">Log in/Sign up with Vibinex chrome-extension</li>
				<li className="mb-4">Install Vibinex OAuth Consumer in your personal/organization workspace. Make sure you have the permissions required to install oauth consumer.</li>
				<li className="mb-4">Authorize Bitbucket OAuth Consumer:</li>
				<li>
					<Button
					variant="contained"
					className="text-secondary-main"
					onClick={handleAuthorize}
					>
					Authorize Bitbucket OAuth Consumer
					</Button>
				</li>
				<li>For each repository, add the following Bitbucket pipeline code to use our Bitbucket pipe - 
					<pre  className="bg-gray-100 p-2 rounded-md" style={{ whiteSpace: 'pre-wrap' }}>
						<code>
							image: atlassian/default-image:4 < br/>
							pipelines:< br/>
								branches< br/>
								&apos;**&apos;:< br/>
									- step:< br/>
										name: &apos;Run devprofiler&apos;< br/>
										script:< br/>
											- pipe: docker://tapish303/repo-profiler-pipe:latest< br/> 
						</code>
					</pre>
					If this is your first pipeline, you may need to enable pipelines in your workspace.
				</li>
				<li>Add this code in &quot;bitbucket-pipelines.yml&quot;.</li>
				<li>Go to the list of open Pull Requests in your repository. Relevant pull requests will be highlighted in yellowor red.</li>
				<li>Within a pull request, files relevant to you will be highlighted in yellow or red.</li>
			</ol>
		</div>
	</div>
  );
}
