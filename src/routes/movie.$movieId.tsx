import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { readFragment } from "gql.tada";
import {
	BASE_MOVIE_FIELDS,
	GET_FULL_MOVIE,
} from "~/domains/movies/data/movies";

export const Route = createFileRoute("/movie/$movieId")({
	context: ({ context: { graphqlClient } }) => {
		const getFullMovieOptions = (movieId: string) =>
			queryOptions({
				queryKey: ["movie", movieId],
				queryFn: () =>
					graphqlClient.request({
						document: GET_FULL_MOVIE,
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

	const basicMovieFields = readFragment(BASE_MOVIE_FIELDS, data.movie);

	return (
		<div className="container mx-auto py-8 px-4">
			<h1 className="text-3xl font-bold mb-8 text-center">
				{basicMovieFields?.title}
			</h1>
		</div>
	);
}
