import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { type FragmentOf, readFragment } from "gql.tada";
import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { funnel } from "remeda";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { GenreFields } from "~/domains/movies/fragments/genre";

const routeApi = getRouteApi("/");

function MovieFilterInput({
	query,
	updateQuery,
	preloadQuery,
}: {
	query: string;
	updateQuery: (query: string) => void;
	preloadQuery: (query: string) => void;
}) {
	const [searchTerm, setSearchTerm] = useState(query);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		updateQuery(searchTerm);
	};

	return (
		<form onSubmit={handleSearch} className="flex gap-2">
			<Input
				type="text"
				placeholder="Search for movies..."
				value={searchTerm}
				onChange={(e) => {
					setSearchTerm(e.target.value);
					preloadQuery(e.target.value);
				}}
				className="flex-1"
			/>
			<Button type="submit">
				<Search className="h-4 w-4 mr-2" />
				Search
			</Button>
		</form>
	);
}

function GenreSelector({
	genre,
	genres,
	updateGenre,
	preloadGenre,
}: {
	genre: string;
	genres: Array<FragmentOf<typeof GenreFields>>;
	updateGenre: (genre: string) => void;
	preloadGenre: (genre: string) => void;
}) {
	// using the readFragment function to get the genres from the query data
	// see https://gql-tada.0no.co/guides/fragment-colocation for more details
	// find it a bit complex myself
	// oh GraphQL
	const mappedGenres = readFragment(GenreFields, genres);

	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium">Genre:</span>
			<Select value={genre} onValueChange={updateGenre}>
				<SelectTrigger className="flex-1">
					<SelectValue placeholder="All Genres" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Genres</SelectItem>
					{mappedGenres.map((genre) => {
						if (!genre.title) return null;

						return (
							<SelectItem
								key={genre.id}
								value={genre.title}
								onMouseOver={() =>
									genre.title != null && preloadGenre(genre.title)
								}
							>
								{genre.title}
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>
		</div>
	);
}

export function MovieSearchBar() {
	const queryClient = useQueryClient();
	const { query, genre } = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const { getGenreFetchOptions, getMovieFetchOptions } =
		routeApi.useRouteContext();

	// Suspend on cricital data
	const { data } = useSuspenseQuery(getGenreFetchOptions());

	// as an aside, this GraphQL schema has way too many nullable fields
	// I'd like to see a more strict schema for this API
	const genres = data.genres?.nodes || [];

	const updateQuery = useCallback(
		(newQuery: string) => {
			// Per Tanner, query params are the OG global state manager
			navigate({ search: { query: newQuery, genre, page: 1 } });
		},
		[navigate, genre],
	);

	const updateGenre = useCallback(
		(newGenre: string) => {
			navigate({ search: { query, genre: newGenre, page: 1 } });
		},
		[navigate, query],
	);

	// Debounce the prefetching of queries to avoid overwhelming the server
	const preloadQueryDebouncer = useMemo(() => {
		return funnel(
			(newQuery: string) => {
				queryClient.prefetchQuery({
					...getMovieFetchOptions({ query: newQuery, genre, page: 1 }),
					// want this to be short since you can have a lot of cache entries that are not used
					gcTime: 15 * 1000, // 15 seconds
				});
			},
			{ minQuietPeriodMs: 300, reducer: (_acc, curr: string) => curr },
		);
	}, [queryClient, getMovieFetchOptions, genre]);

	const preloadQuery = useCallback(
		(newQuery: string) => {
			preloadQueryDebouncer.call(newQuery);
		},
		[preloadQueryDebouncer],
	);

	// Debounce the prefetching of genres to avoid overwhelming the server
	const preloadGenereDebouncer = useMemo(() => {
		return funnel(
			(newGenre: string) => {
				queryClient.prefetchQuery({
					...getMovieFetchOptions({
						query,
						genre: newGenre,
						page: 1,
					}),
					// want this to be short since you can have a lot of cache entries that are not used
					gcTime: 15 * 1000, // 15 seconds
				});
			},
			{ minQuietPeriodMs: 100, reducer: (_acc, curr: string) => curr },
		);
	}, [queryClient, getMovieFetchOptions, query]);

	const preloadGenre = useCallback(
		(newGenre: string) => {
			if (newGenre === "all") {
				return;
			}

			preloadGenereDebouncer.call(newGenre);
		},
		[preloadGenereDebouncer],
	);

	const resetFilters = useCallback(() => {
		navigate({ search: { query: "", genre: "", page: 0 } });
	}, [navigate]);

	return (
		<div className="flex flex-col gap-4 mb-8 max-w-md mx-auto">
			<MovieFilterInput
				query={query}
				updateQuery={updateQuery}
				preloadQuery={preloadQuery}
			/>

			<GenreSelector
				genre={genre || ""}
				genres={genres}
				updateGenre={updateGenre}
				preloadGenre={preloadGenre}
			/>

			<div className="flex justify-end">
				<Button
					type="button"
					variant="outline"
					onClick={resetFilters}
					disabled={!query && !genre}
				>
					Reset All Filters
				</Button>
			</div>
		</div>
	);
}
