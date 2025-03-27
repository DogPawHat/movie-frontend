import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import * as v from "valibot";

import { MovieSearchBar } from "~/domains/movies/components/MovieSearchBar";
import { MoviesTable } from "~/domains/movies/components/MoviesTable";
import { GET_GENRES } from "~/domains/movies/queries/genre";
import { GET_MOVIES_SEARCH } from "~/domains/movies/queries/movies";

const queryParamsSchema = v.object({
	query: v.optional(v.string(), ""),
	genre: v.optional(v.string(), ""),
	page: v.optional(v.number(), 0),
});

export const Route = createFileRoute("/")({
	validateSearch: queryParamsSchema,
	loaderDeps: ({ search }) => ({
		query: search.query,
		page: search.page,
		genre: search.genre,
	}),
	context: ({ context: { graphqlClient } }) => {
		const getMovieFetchOptions = (variables: {
			query: string;
			genre: string;
			page: number;
		}) =>
			queryOptions({
				queryKey: ["movies", variables],
				queryFn: () =>
					graphqlClient.request({
						document: GET_MOVIES_SEARCH,
						variables: {
							search: variables.query,
							genre: variables.genre || undefined,
							page: variables.page,
						},
					}),
			});

		const getGenreFetchOptions = () =>
			queryOptions({
				queryKey: ["genres"],
				queryFn: () => graphqlClient.request(GET_GENRES),
			});

		return { queryOptions: { getMovieFetchOptions, getGenreFetchOptions } };
	},
	loader: async ({
		context: {
			queryOptions: { getMovieFetchOptions, getGenreFetchOptions },
			queryClient,
		},
		deps: { query, page, genre },
	}) => {
		queryClient.prefetchQuery(getMovieFetchOptions({ query, page, genre }));
		await queryClient.ensureQueryData(getGenreFetchOptions());
	},
	component: Movies,
});

function Movies() {
	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8 text-center">Movie Search</h1>

			<MovieSearchBar />

			<div className="rounded-md border">
				<Suspense fallback={<div>Loading...</div>}>
					<MoviesTable />
				</Suspense>
			</div>
		</div>
	);
}
