import {
	queryOptions,
	useQuery,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
	type PaginationState,
	type Updater,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { graphql } from "gql.tada";
import { Search } from "lucide-react";
import { Suspense, useMemo, useState } from "react";
import * as v from "valibot";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
const PER_PAGE = 10;

const GET_MOVIES_SEARCH = graphql(`
  query GetMoviesSearch($search: String!, $genre: String, $page: Int! = 0) {
    movies(
      where: { search: $search, genre: $genre }
      pagination: { perPage: 10, page: $page }
    ) {
      nodes {
        id
        title
        posterUrl
        datePublished
      }
      pagination {
        perPage
        page
        totalPages
      }
    }
  }
`);

const GET_GENRES = graphql(`
  query GetGenres {
    genres(pagination: { perPage: 100 }) {
      nodes {
        id
        title
      }
    }
  }
`);

const columnHelper = createColumnHelper<{
	id: string | null;
	title: string | null;
	datePublished: string | null;
	posterUrl: string | null;
}>();

const columns = [
	columnHelper.accessor("title", {
		header: "Title",
	}),
	columnHelper.accessor("datePublished", {
		header: "Year",
	}),
	columnHelper.display({
		id: "poster",
		header: "Poster",
		cell: ({ row }) => {
			if (!row.original.posterUrl) return null;

			return (
				<img
					src={row.original?.posterUrl}
					alt={row.original?.title ?? ""}
					className="w-16 h-24"
				/>
			);
		},
	}),
];

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
							genreId: variables.genre || undefined,
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

function MovieSearchBar() {
	const { query, genre } = Route.useSearch();
	const navigate = Route.useNavigate();
	const {
		queryOptions: { getGenreFetchOptions },
	} = Route.useRouteContext();

	const { data: genreData } = useQuery(getGenreFetchOptions());
	const genres = genreData?.genres?.nodes || [];

	const updateQuery = (newQuery: string) => {
		navigate({ search: { query: newQuery, genre, page: 0 } });
	};

	const updateGenre = (newGenre: string) => {
		navigate({ search: { query, genre: newGenre, page: 0 } });
	};

	const resetFilters = () => {
		navigate({ search: { query: "", genre: "", page: 0 } });
	};

	return (
		<div className="flex flex-col gap-4 mb-8 max-w-md mx-auto">
			<MovieFilterInput query={query} updateQuery={updateQuery} />

			<GenreSelector
				genre={genre}
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

function MovieFilterInput({
	query,
	updateQuery,
}: {
	query: string;
	updateQuery: (query: string) => void;
}) {
	const [searchTerm, setSearchTerm] = useState(query);

	const handleSearch = () => {
		updateQuery(searchTerm);
	};

	return (
		<div className="flex gap-2">
			<Input
				type="text"
				placeholder="Search for movies..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				onKeyDown={(e) => e.key === "Enter" && handleSearch()}
				className="flex-1"
			/>
			<Button onClick={handleSearch}>
				<Search className="h-4 w-4 mr-2" />
				Search
			</Button>
		</div>
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
					{genres.map((genre) => (
						<SelectItem key={genre.id} value={genre.id}>
							{genre.title}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

function BasicMoviesTable({
	movies,
	pagination,
	pageCount,
	onPaginationChange,
}: {
	movies: Array<{
		id: string | null;
		title: string | null;
		datePublished: string | null;
		posterUrl: string | null;
	}>;
	pagination: PaginationState;
	pageCount: number;
	onPaginationChange: (updater: Updater<PaginationState>) => void;
}) {
	const table = useReactTable({
		data: movies,
		pageCount,
		columns,
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination,
		},
		onPaginationChange,
		manualPagination: true,
	});

	return (
		<Table>
			<TableHeader>
				{table.getHeaderGroups().map((headerGroup) => (
					<TableRow key={headerGroup.id}>
						{headerGroup.headers.map((header) => (
							<TableHead key={header.id}>
								{flexRender(
									header.column.columnDef.header,
									header.getContext(),
								)}
							</TableHead>
						))}
					</TableRow>
				))}
			</TableHeader>
			<TableBody>
				{table.getRowModel().rows.map((row) => (
					<TableRow key={row.id}>
						{row.getVisibleCells().map((cell) => (
							<TableCell key={cell.id}>
								{flexRender(cell.column.columnDef.cell, cell.getContext())}
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
			<tfoot>
				<tr>
					<td colSpan={columns.length} className="py-4">
						<div className="flex items-center justify-center gap-2">
							<Button
								variant="outline"
								onClick={() => table.previousPage()}
								disabled={!table.getCanPreviousPage()}
								className="px-2 py-1"
							>
								← Previous
							</Button>
							<span className="text-sm text-muted-foreground">
								Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}{" "}
								(approx. {(pageCount * PER_PAGE).toLocaleString()} results)
							</span>
							<Button
								variant="outline"
								onClick={() => table.nextPage()}
								disabled={!table.getCanNextPage()}
								className="px-2 py-1"
							>
								Next →
							</Button>
						</div>
					</td>
				</tr>
			</tfoot>
		</Table>
	);
}

function MoviesTable() {
	const navigate = Route.useNavigate();
	const { query, genre, page } = Route.useSearch();
	const {
		queryOptions: { getMovieFetchOptions },
	} = Route.useRouteContext();

	const { data } = useSuspenseQuery(
		getMovieFetchOptions({ query, genre: genre || "", page }),
	);
	const movies = useMemo(() => data.movies?.nodes ?? [], [data.movies]);

	const pagination = {
		pageIndex: page,
		pageSize: PER_PAGE,
	} satisfies PaginationState;

	const handlePageChange = (updater: Updater<PaginationState>) => {
		const newPagination =
			typeof updater === "function" ? updater(pagination) : updater;

		if (newPagination.pageIndex !== pagination.pageIndex) {
			navigate({ search: { query, genre, page: newPagination.pageIndex } });
		}
	};

	return (
		<BasicMoviesTable
			movies={movies}
			pagination={pagination}
			pageCount={data.movies?.pagination?.totalPages ?? -1}
			onPaginationChange={handlePageChange}
		/>
	);
}

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
