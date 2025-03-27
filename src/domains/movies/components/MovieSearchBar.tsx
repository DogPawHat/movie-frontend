import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

const routeApi = getRouteApi("/");

function MovieFilterInput({
	query,
	updateQuery,
}: {
	query: string;
	updateQuery: (query: string) => void;
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
				onChange={(e) => setSearchTerm(e.target.value)}
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
}: {
	genre: string;
	genres: Array<{ id: string; title: string }>;
	updateGenre: (genre: string) => void;
}) {
	return (
		<div className="flex items-center gap-2">
			<span className="text-sm font-medium">Genre:</span>
			<Select value={genre} onValueChange={updateGenre}>
				<SelectTrigger className="flex-1">
					<SelectValue placeholder="All Genres" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">All Genres</SelectItem>
					{genres.map((genre) => (
						<SelectItem key={genre.id} value={genre.title}>
							{genre.title}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

export function MovieSearchBar() {
	const { query, genre } = routeApi.useSearch();
	const navigate = routeApi.useNavigate();
	const {
		queryOptions: { getGenreFetchOptions },
	} = routeApi.useRouteContext();

	const { data: genreData } = useQuery(getGenreFetchOptions());
	const genres = genreData?.genres?.nodes || [];

	const updateQuery = (newQuery: string) => {
		navigate({ search: { query: newQuery, genre, page: 0 } });
	};

	const updateGenre = (newGenre: string) => {
		if (newGenre === "all") {
			navigate({ search: { query, genre: "", page: 0 } });
			return;
		}

		navigate({ search: { query, genre: newGenre, page: 0 } });
	};

	const resetFilters = () => {
		navigate({ search: { query: "", genre: "", page: 0 } });
	};

	return (
		<div className="flex flex-col gap-4 mb-8 max-w-md mx-auto">
			<MovieFilterInput query={query} updateQuery={updateQuery} />

			<GenreSelector
				genre={genre || ""}
				genres={genres.map((genre) => ({
					id: genre.id || "",
					title: genre.title || "",
				}))}
				updateGenre={updateGenre}
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
