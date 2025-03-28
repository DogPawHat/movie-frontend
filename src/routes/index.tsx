import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { graphql } from "gql.tada";
import * as v from "valibot";

import { MovieSearchBar } from "~/domains/movies/components/MovieSearchBar";
import { MoviesTable } from "~/domains/movies/components/MoviesTable";
import { BaseMovieFields } from "~/domains/movies/fragments/base-movie";
import { GenreFields } from "~/domains/movies/fragments/genre";
import { MoviePaginationFields } from "~/domains/movies/fragments/movie-pagination";
import { PER_PAGE } from "~/lib/utils";
export const GetGenres = graphql(
	`
  query GetGenres {
    genres(pagination: { perPage: 100 }) {
      nodes {
        ...GenreFields
      }
    }
  }
`,
	[GenreFields],
);

export const GetMoviesSearch = graphql(
	`
  query GetMoviesSearch($search: String!, $genre: String, $page: Int! = 0) {
    movies(
      where: { search: $search, genre: $genre }
      pagination: { perPage: ${PER_PAGE}, page: $page }
    ) {
      nodes {
        ...BaseMovieFields
      }
      pagination {
        ...MoviePaginationFields
      }
    }
  }
`,
	[BaseMovieFields, MoviePaginationFields],
);

// using valibot to validate the search params
const queryParamsSchema = v.object({
	query: v.optional(v.fallback(v.string(), ""), ""),
	genre: v.optional(v.fallback(v.string(), ""), ""),
	page: v.optional(v.fallback(v.pipe(v.number(), v.minValue(1)), 1), 1),
});

export const Route = createFileRoute("/")({
	validateSearch: queryParamsSchema,
	loaderDeps: ({ search }) => ({
		/** Search term used to narrow down the movies */
		query: search.query,
		/** Page number used to paginate the movies */
		page: search.page,
		/** Genre used to filter the movies (exact match) */
		genre: search.genre,
	}),
	context: ({ context: { graphqlClient } }) => {
		// Need to create the query options here were we have access to the graphql client
		// We'll access this in the loader and also in the components via 'useRouteContext'
		const getMovieFetchOptions = (variables: {
			query: string;
			genre: string;
			page: number;
		}) =>
			queryOptions({
				queryKey: ["movies", variables] as const,
				queryFn: ({ queryKey }) =>
					graphqlClient.request({
						document: GetMoviesSearch,
						variables: {
							search: queryKey[1].query,
							genre: queryKey[1].genre || undefined,
							page: queryKey[1].page,
						},
					}),
			});

		const getGenreFetchOptions = () =>
			queryOptions({
				queryKey: ["genres"],
				queryFn: () => graphqlClient.request(GetGenres),
				// We never make changes to this query and the list wil alway be the same
				staleTime: 60 * 60 * 1, // 1 hours
				gcTime: 60 * 60 * 1, // 1 hours
			});

		return { getMovieFetchOptions, getGenreFetchOptions };
	},
	loader: async ({
		context: { getMovieFetchOptions, getGenreFetchOptions, queryClient },
		deps: { query, page, genre },
	}) => {
		// Moves are non critical data so we'll fetch them in a non blocking way
		queryClient.prefetchQuery(getMovieFetchOptions({ query, page, genre }));

		// Genres are critical data so we'll fetch them in a blocking way
		await queryClient.ensureQueryData(getGenreFetchOptions());
	},
	component: Movies,
});

function Movies() {
	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8 text-center">Movie Search</h1>

			<MovieSearchBar />

			<MoviesTable />
		</div>
	);
}
