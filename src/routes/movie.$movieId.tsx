import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { graphql, readFragment } from "gql.tada";
import { BaseMovieFields } from "~/domains/movies/fragments/base-movie";
import { FullMovieFields } from "~/domains/movies/fragments/full-movie";

const GetFullMovie = graphql(
	`
  query GetFullMovie($id: ID!) {
    movie(id: $id) {
      ...BaseMovieFields
      ...FullMovieFields
    }
  }
`,
	[BaseMovieFields, FullMovieFields],
);

export const Route = createFileRoute("/movie/$movieId")({
	context: ({ context: { graphqlClient } }) => {
		const getFullMovieOptions = (movieId: string) =>
			queryOptions({
				queryKey: ["movie", movieId],
				queryFn: () =>
					graphqlClient.request({
						document: GetFullMovie,
						variables: {
							id: movieId,
						},
					}),
			});

		return {
			getFullMovieOptions,
		};
	},
	loader: async ({
		context: { getFullMovieOptions, queryClient },
		params: { movieId },
	}) => {
		await queryClient.ensureQueryData(getFullMovieOptions(movieId));
	},
	component: MovieRouteComponent,
});

function MovieRouteComponent() {
	const { movieId } = Route.useParams();
	const { getFullMovieOptions } = Route.useRouteContext();
	const { data } = useSuspenseQuery(getFullMovieOptions(movieId));

	const basicMovieFields = readFragment(BaseMovieFields, data.movie);

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8 text-center">
				{basicMovieFields?.title}
			</h1>
		</div>
	);
}
