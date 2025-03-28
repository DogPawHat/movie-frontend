import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { graphql, readFragment } from "gql.tada";
import { Suspense } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
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

function formatDuration(duration: string | null) {
	if (!duration) return "Unknown duration";

	// Parse ISO 8601 duration format (e.g., PT2H14M)
	const hoursMatch = duration.match(/(\d+)H/);
	const minutesMatch = duration.match(/(\d+)M/);

	const hours = hoursMatch ? Number.parseInt(hoursMatch[1] || "0", 10) : 0;
	const minutes = minutesMatch
		? Number.parseInt(minutesMatch[1] || "0", 10)
		: 0;

	return `${hours}h ${minutes}m`;
}

function formatDate(dateStr: string | null) {
	if (!dateStr) return "Unknown date";

	const date = new Date(dateStr);
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(date);
}

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
		queryClient.prefetchQuery(getFullMovieOptions(movieId));
	},
	component: MovieDetail,
});

// Skeleton loader for movie details
function MovieDetailSkeleton() {
	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<div className="w-24 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Skeleton poster */}
				<div className="flex justify-center md:justify-start">
					<div className="h-96 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
				</div>

				{/* Skeleton details */}
				<div className="md:col-span-2">
					<div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-4 animate-pulse" />

					<div className="flex flex-wrap gap-2 mb-4">
						{[1, 2, 3].map((i) => (
							<div
								key={`skeleton-genre-${i}`}
								className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
							/>
						))}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						{[1, 2, 3, 4].map((i) => (
							<div key={`skeleton-detail-${i}`}>
								<div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
								<div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							</div>
						))}
					</div>

					<div className="mb-6">
						<div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
						<div className="h-24 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[1, 2, 3].map((i) => (
							<div key={`skeleton-credits-${i}`}>
								<div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
								<div className="space-y-2">
									{[1, 2, 3].map((j) => (
										<div
											key={`skeleton-credit-item-${i}-${j}`}
											className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
										/>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

function MovieDetail() {
	return (
		<Suspense fallback={<MovieDetailSkeleton />}>
			<MovieDetailContent />
		</Suspense>
	);
}

function MovieDetailContent() {
	const { movieId } = Route.useParams();
	const { getFullMovieOptions } = Route.useRouteContext();
	const { data } = useSuspenseQuery(getFullMovieOptions(movieId));

	const baseMovie = readFragment(BaseMovieFields, data.movie);
	const fullMovie = readFragment(FullMovieFields, data.movie);

	if (!baseMovie || !fullMovie) {
		return (
			<div className="container mx-auto py-8 px-4">Movie details not found</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="mb-6">
				<Link
					to="/"
					search={{
						query: "",
						genre: "",
						page: 1,
					}}
					className="text-blue-500 hover:underline"
				>
					<Button variant="outline" size="sm">
						← Back to search
					</Button>
				</Link>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Movie poster column */}
				<div className="flex justify-center md:justify-start">
					{baseMovie.posterUrl ? (
						<img
							src={baseMovie.posterUrl}
							alt={baseMovie.title ?? "Movie poster"}
							className="rounded-lg shadow-lg h-auto max-w-full md:max-w-xs"
						/>
					) : (
						<div className="flex h-96 w-64 items-center justify-center rounded-lg bg-muted">
							<span className="text-muted-foreground">No poster available</span>
						</div>
					)}
				</div>

				{/* Movie details column */}
				<div className="md:col-span-2">
					<h1 className="text-3xl font-bold mb-2">{baseMovie.title}</h1>

					<div className="flex flex-wrap gap-2 mb-4">
						{fullMovie.genres?.map(
							(genre) =>
								genre && (
									<Badge key={`genre-${genre.id}`} variant="secondary">
										{genre.title}
									</Badge>
								),
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div>
							<p className="text-sm text-muted-foreground">Release Date</p>
							<p>{formatDate(baseMovie.datePublished)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Duration</p>
							<p>{formatDuration(baseMovie.duration)}</p>
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Age Rating</p>
							<p>{baseMovie.rating ?? "Not Rated"}</p>
						</div>
						{baseMovie.ratingValue && (
							<div>
								<p className="text-sm text-muted-foreground">Viewer Rating</p>
								<p>{baseMovie.ratingValue}/10</p>
							</div>
						)}
					</div>

					{fullMovie.summary && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold mb-2">Summary</h2>
							<p className="text-gray-700 dark:text-gray-300">
								{fullMovie.summary}
							</p>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{fullMovie.directors && fullMovie.directors.length > 0 && (
							<div>
								<h2 className="text-lg font-semibold mb-1">Directors</h2>
								<ul className="list-disc list-inside">
									{fullMovie.directors.map(
										(director) =>
											director && (
												<li key={`director-${director}`}>{director}</li>
											),
									)}
								</ul>
							</div>
						)}

						{fullMovie.writers && fullMovie.writers.length > 0 && (
							<div>
								<h2 className="text-lg font-semibold mb-1">Writers</h2>
								<ul className="list-disc list-inside">
									{fullMovie.writers.map(
										(writer) =>
											writer && <li key={`writer-${writer}`}>{writer}</li>,
									)}
								</ul>
							</div>
						)}

						{fullMovie.mainActors && fullMovie.mainActors.length > 0 && (
							<div>
								<h2 className="text-lg font-semibold mb-1">Cast</h2>
								<ul className="list-disc list-inside">
									{fullMovie.mainActors.map(
										(actor) => actor && <li key={`actor-${actor}`}>{actor}</li>,
									)}
								</ul>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
