"use client";
import { NextPage } from "next";
import { useState, useEffect, useCallback } from "react";
import Loader from "../../components/blog/Loader";
import PageHeader from "../../components/blog/PageHeader";
import PostList, { Article } from "../../components/blog/PostList";
import Footer from "../../components/Footer";
import { fetchAPI } from "../../utils/blog/fetch-api";
import Navbar from "../../views/Navbar";


interface Meta {
	pagination: {
		start: number;
		limit: number;
		total: number;
	};
}
const Profile: NextPage = () => {
	const [meta, setMeta] = useState<Meta | undefined>();
	const [data, setData] = useState<Article[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchData = useCallback(async (start: number, limit: number) => {
		setIsLoading(true);
		try {
			const token = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;
			const path = `/articles`;
			const urlParamsObject = {
				sort: { createdAt: "desc" },
				populate: {
					cover: { fields: ["url"] },
					category: { populate: "*" },
					authorsBio: {
						populate: "*",
					},
				},
				pagination: {
					start: start,
					limit: limit,
				},
			};
			const options = { headers: { Authorization: `Bearer ${token}` } };
			const responseData = await fetchAPI(path, urlParamsObject, options);

			if (start === 0) {
				setData(responseData.data);
			} else {
				setData((prevData: Article[] ) => [...prevData, ...responseData.data]);
			}

			setMeta(responseData.meta);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	function loadMorePosts(): void {
		const nextPosts = meta!.pagination.start + meta!.pagination.limit;
		fetchData(nextPosts, Number(process.env.NEXT_PUBLIC_PAGE_LIMIT));
	}

	useEffect(() => {
		fetchData(0, Number(process.env.NEXT_PUBLIC_PAGE_LIMIT));
	}, [fetchData]);

	if (isLoading) return <Loader />;

	return (
		<div>
			<Navbar transparent={true} />
			<PageHeader heading="Our Blog" text="Checkout Something Cool" />
			<PostList data={data}>
				{meta!.pagination.start + meta!.pagination.limit <
					meta!.pagination.total && (
					<div className="flex justify-center">
						<button
							type="button"
							className="px-6 py-3 text-sm rounded-lg hover:underline dark:bg-gray-900 dark:text-gray-400"
							onClick={loadMorePosts}
						>
							Load more posts...
						</button>
					</div>
				)}
			</PostList>
			<Footer />
		</div>
	);
}

export default Profile;