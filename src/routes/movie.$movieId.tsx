import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { graphql, readFragment } from "gql.tada";
import { Suspense, useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { BaseMovieFields } from "~/domains/movies/fragments/base-movie";
import { FullMovieFields } from "~/domains/movies/fragments/full-movie";
import { formatDuration } from "~/lib/utils";

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
		<div className="container mx-auto py-4 px-4">
			<div className="mb-4">
				<div className="w-28 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Skeleton poster */}
				<div className="flex justify-center md:justify-start">
					<div className="h-80 w-56 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
				</div>

				{/* Skeleton details */}
				<div className="md:col-span-2">
					{/* Title */}
					<div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />

					{/* Genres */}
					<div className="flex flex-wrap gap-2 mb-4">
						{[1, 2, 3].map((i) => (
							<div
								key={`skeleton-genre-${i}`}
								className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
							/>
						))}
					</div>

					{/* Movie details grid */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
						{[
							{
								id: "release-date",
								label: "Release Date",
								value: "September 15, 2023",
							},
							{ id: "duration", label: "Duration", value: "2h 30m" },
							{ id: "age-rating", label: "Age Rating", value: "PG-13" },
							{ id: "viewer-rating", label: "Viewer Rating", value: "8.5/10" },
						].map((item) => (
							<div key={`skeleton-detail-${item.id}`}>
								<div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-1 animate-pulse" />
								<div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							</div>
						))}
					</div>

					{/* Summary */}
					<div className="mb-6">
						<div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
						<div className="space-y-1">
							<div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							<div className="h-3 w-11/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							<div className="h-3 w-10/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
							<div className="h-3 w-9/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
						</div>
					</div>

					{/* Credits sections */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{[
							{ id: "directors", name: "Directors", count: 2 },
							{ id: "writers", name: "Writers", count: 2 },
							{ id: "cast", name: "Cast", count: 4 },
						].map((section) => (
							<div key={`skeleton-credits-${section.id}`}>
								<div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse" />
								<ul className="space-y-1">
									{Array.from({ length: section.count }).map((_, j) => (
										<li
											key={`skeleton-credit-item-${section.id}-${j}`}
											className="h-4 w-11/12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
										/>
									))}
								</ul>
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
	const [posterErrorState, setPosterErrorState] = useState<
		"error" | "loading" | "success"
	>("loading");

	const baseMovie = readFragment(BaseMovieFields, data.movie);
	const fullMovie = readFragment(FullMovieFields, data.movie);

	if (!baseMovie || !fullMovie) {
		return (
			<div className="container mx-auto py-8 px-4">Movie details not found</div>
		);
	}

	return (
		<div className="container mx-auto py-4 px-4">
			<div className="mb-4">
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

			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Movie poster column */}
				<div className="flex justify-center md:justify-start">
					{baseMovie.posterUrl && posterErrorState !== "error" ? (
						<img
							src={baseMovie.posterUrl}
							alt={baseMovie.title ?? "Movie poster"}
							className="rounded-lg shadow-lg h-auto max-w-full md:max-w-xs"
							onError={() => setPosterErrorState("error")}
							onLoad={() => setPosterErrorState("success")}
						/>
					) : (
						<div className="flex h-80 w-56 items-center justify-center rounded-lg bg-muted">
							<span className="text-muted-foreground">No poster available</span>
						</div>
					)}
				</div>

				{/* Movie details column */}
				<div className="md:col-span-2">
					<h1 className="text-2xl font-bold mb-2">{baseMovie.title}</h1>

					<div className="flex flex-wrap gap-1 mb-3">
						{fullMovie.genres?.map(
							(genre) =>
								genre && (
									<Badge key={`genre-${genre.id}`} variant="secondary">
										{genre.title}
									</Badge>
								),
						)}
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
						<div>
							<p className="text-xs text-muted-foreground">Release Date</p>
							<p className="text-sm">{formatDate(baseMovie.datePublished)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Duration</p>
							<p className="text-sm">{formatDuration(baseMovie.duration)}</p>
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Age Rating</p>
							<p className="text-sm">{baseMovie.rating ?? "Not Rated"}</p>
						</div>
						{baseMovie.ratingValue && (
							<div>
								<p className="text-xs text-muted-foreground">Viewer Rating</p>
								<p className="text-sm">{baseMovie.ratingValue}/10</p>
							</div>
						)}
					</div>

					{fullMovie.summary && (
						<div className="mb-4">
							<h2 className="text-lg font-semibold mb-1">Summary</h2>
							<p className="text-sm text-gray-700 dark:text-gray-300">
								{fullMovie.summary}
							</p>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
						{fullMovie.directors && fullMovie.directors.length > 0 && (
							<div>
								<h2 className="text-base font-semibold mb-1">Directors</h2>
								<ul className="list-disc list-inside text-sm">
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
								<h2 className="text-base font-semibold mb-1">Writers</h2>
								<ul className="list-disc list-inside text-sm">
									{fullMovie.writers.map(
										(writer) =>
											writer && <li key={`writer-${writer}`}>{writer}</li>,
									)}
								</ul>
							</div>
						)}

						{fullMovie.mainActors && fullMovie.mainActors.length > 0 && (
							<div>
								<h2 className="text-base font-semibold mb-1">Cast</h2>
								<ul className="list-disc list-inside text-sm">
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
