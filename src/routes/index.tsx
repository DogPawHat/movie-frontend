import { queryOptions } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { graphql } from "gql.tada";
import * as v from "valibot";

import { MovieSearchBar } from "~/domains/movies/components/MovieSearchBar";
import { MoviesTable } from "~/domains/movies/components/MoviesTable";
import { BaseMovieFields } from "~/domains/movies/fragments/base-movie";
import { GenreFields } from "~/domains/movies/fragments/genre";
import { MoviePaginationFields } from "~/domains/movies/fragments/movie-pagination";

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
      pagination: { perPage: 7, page: $page }
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

const queryParamsSchema = v.object({
	query: v.optional(v.fallback(v.string(), ""), ""),
	genre: v.optional(v.fallback(v.string(), ""), ""),
	page: v.optional(v.fallback(v.pipe(v.number(), v.minValue(1)), 1), 1),
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
			});

		return { getMovieFetchOptions, getGenreFetchOptions };
	},
	loader: async ({
		context: { getMovieFetchOptions, getGenreFetchOptions, queryClient },
		deps: { query, page, genre },
	}) => {
		queryClient.fetchQuery(getMovieFetchOptions({ query, page, genre }));
		// await queryClient.ensureQueryData(getGenreFetchOptions());
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
