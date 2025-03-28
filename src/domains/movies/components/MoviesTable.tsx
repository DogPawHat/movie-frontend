import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
	type PaginationState,
	type Updater,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { type FragmentOf, type ResultOf, readFragment } from "gql.tada";
import { cn } from "~/lib/utils";

import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { BaseMovieFields } from "~/domains/movies/fragments/base-movie";
import { MoviePaginationFields } from "~/domains/movies/fragments/movie-pagination";
import { PER_PAGE, formatDuration } from "~/lib/utils";

type MovieFieldsFragment = FragmentOf<typeof BaseMovieFields>;
type MovieFieldsData = ResultOf<typeof BaseMovieFields>;

const columnHelper = createColumnHelper<MovieFieldsData>();

const routeApi = getRouteApi("/");

const columns = [
	columnHelper.accessor("title", {
		header: "Title",
		cell: ({ row }) => {
			const title = row.getValue("title") as string | null;

			if (!title) return null;

			return (
				<Link
					to="/movie/$movieId"
					params={{ movieId: row.original.id as string }}
					className="font-medium text-blue-600 hover:underline"
				>
					{title}
				</Link>
			);
		},
	}),
	columnHelper.accessor("rating", {
		header: "Age Rating",
		cell: ({ cell }) => {
			const value = cell.getValue();
			// assume film is unrated if rating is not available
			if (!value) return "NR";
			return value;
		},
	}),
	columnHelper.accessor("ratingValue", {
		header: "Review Rating",
	}),
	columnHelper.accessor("duration", {
		header: "Duration",
		cell: ({ cell }) => {
			const value = cell.getValue();
			if (!value) return null;
			return formatDuration(value);
		},
	}),
	columnHelper.accessor("datePublished", {
		header: "Date Published",
	}),
	columnHelper.accessor("posterUrl", {
		header: "Poster",
		cell: ({ row }) => {
			const posterUrl = row.getValue("posterUrl") as string | null;
			const [errorState, setErrorState] = useState<
				"none" | "loading" | "error"
			>("loading");

			return (
				<Link
					to="/movie/$movieId"
					params={{ movieId: row.original.id as string }}
					className="hover:opacity-80 transition-opacity"
				>
					{/* Some of the posterurl 404, so we need a fallback */}
					{posterUrl && errorState !== "error" ? (
						<img
							src={posterUrl}
							alt={`${row.getValue("title") || "Movie"} poster`}
							className="w-16 h-auto rounded"
							onError={(e) => {
								setErrorState("error");
							}}
							onLoad={() => {
								setErrorState("none");
							}}
						/>
					) : (
						<div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center">
							<span className="text-xs text-gray-500">No image</span>
						</div>
					)}
				</Link>
			);
		},
	}),
];

// Internal component for table display logic
function BasicMoviesTable({
	movies,
	pagination,
	pageCount,
	onPaginationChange,
	isLoading,
	preloadPreviousPage,
	preloadNextPage,
	preloadFirstPage,
	preloadLastPage,
}: {
	movies: MovieFieldsFragment[];
	pagination: PaginationState;
	pageCount: number;
	onPaginationChange: (updater: Updater<PaginationState>) => void;
	preloadPreviousPage: () => void;
	preloadNextPage: () => void;
	preloadFirstPage: () => void;
	preloadLastPage: () => void;
	isLoading?: boolean;
}) {
	const table = useReactTable({
		pageCount,
		rowCount: 10,
		columns,
		data: movies.map((movie) => readFragment(BaseMovieFields, movie)),
		getCoreRowModel: getCoreRowModel(),
		state: {
			pagination,
		},
		onPaginationChange,
		manualPagination: true,
	});

	// prefetch the next/previous page if the table has the ability to paginate
	if (table.getCanPreviousPage()) {
		preloadPreviousPage();
	}

	if (table.getCanNextPage()) {
		preloadNextPage();
	}

	// Prefetch the first and last pages if we're not on those pages
	if (pagination.pageIndex > 0) {
		preloadFirstPage();
	}

	if (pagination.pageIndex < pageCount - 1 && pageCount > 1) {
		preloadLastPage();
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="rounded-md border">
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
						{isLoading
							? // Display skeleton rows when loading
								Array.from({ length: PER_PAGE }).map((_, index) => {
									const rowId = `skeleton-row-${pagination.pageIndex}-${index}`;
									return (
										<TableRow key={rowId} className="animate-pulse">
											{columns.map((column, colIndex) => {
												const cellId = `${rowId}-cell-${column.id || `col-${colIndex}`}`;
												return (
													<TableCell
														key={cellId}
														className={cn("py-2", colIndex === 5 && "py-4")}
													>
														{colIndex === 5 ? (
															// Poster column
															<div className="w-16 h-24 bg-gray-200 dark:bg-gray-700 rounded" />
														) : colIndex === 0 ? (
															// Title column
															<div className="w-40 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
														) : colIndex === 3 ? (
															// Duration column
															<div className="w-14 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
														) : colIndex === 4 ? (
															// Date column
															<div className="w-28 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
														) : (
															// Other columns
															<div className="w-10 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
														)}
													</TableCell>
												);
											})}
										</TableRow>
									);
								})
							: table.getRowModel().rows.map((row) => (
									<TableRow key={row.id}>
										{row.getVisibleCells().map((cell) => (
											<TableCell
												key={cell.id}
												className={cn(
													"py-2",
													cell.column.id === "posterUrl" && "py-4",
												)}
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination controls  */}
			<div className="flex items-center justify-center gap-2 py-4">
				<Button
					variant="outline"
					onClick={() => table.firstPage()}
					disabled={isLoading || !table.getCanPreviousPage()}
					className="px-2 py-1"
					title="First Page"
				>
					<ChevronsLeft className="h-4 w-4 mr-1" />
					<span className="hidden sm:inline">First</span>
				</Button>
				<Button
					variant="outline"
					onClick={() => table.previousPage()}
					disabled={isLoading || !table.getCanPreviousPage()}
					className="px-2 py-1"
				>
					<ChevronLeft className="h-4 w-4 mr-1" />
					<span className="hidden sm:inline">Previous</span>
				</Button>
				<span className="text-sm text-muted-foreground">
					<span className="hidden sm:inline">Page</span>{" "}
					{pagination.pageIndex + 1} / {table.getPageCount() || 1}{" "}
					{!isLoading && (
						<span className="hidden sm:inline">
							(approx. {(pageCount * PER_PAGE).toLocaleString()} results)
						</span>
					)}
				</span>
				<Button
					variant="outline"
					onClick={() => table.nextPage()}
					disabled={isLoading || !table.getCanNextPage()}
					className="px-2 py-1"
				>
					<span className="hidden sm:inline">Next</span>
					<ChevronRight className="h-4 w-4 ml-1" />
				</Button>
				<Button
					variant="outline"
					onClick={() => table.lastPage()}
					disabled={isLoading || !table.getCanNextPage()}
					className="px-2 py-1"
					title="Last Page"
				>
					<span className="hidden sm:inline">Last</span>
					<ChevronsRight className="h-4 w-4 ml-1" />
				</Button>
			</div>
		</div>
	);
}

export function MoviesTable() {
	const navigate = routeApi.useNavigate();
	const queryClient = useQueryClient();
	const { query, genre, page } = routeApi.useSearch();
	const { getMovieFetchOptions } = routeApi.useRouteContext();

	const { data, isLoading } = useQuery(
		getMovieFetchOptions({ query, genre: genre || "", page }),
	);

	const movies = data?.movies?.nodes ?? [];
	const paginationInfo = readFragment(
		MoviePaginationFields,
		data?.movies?.pagination,
	);

	const pagination = useMemo(() => {
		return {
			pageIndex: page - 1,
			pageSize: PER_PAGE,
		};
	}, [page]);

	const handlePageChange = useCallback(
		(updater: Updater<PaginationState>) => {
			const newPagination =
				typeof updater === "function" ? updater(pagination) : updater;

			if (newPagination.pageIndex !== pagination.pageIndex) {
				navigate({
					search: { query, genre, page: newPagination.pageIndex + 1 },
				});
			}
		},
		[navigate, query, genre, pagination],
	);

	const preloadPreviousPage = useCallback(async () => {
		await queryClient.prefetchQuery({
			...getMovieFetchOptions({
				query,
				genre,
				page: page - 1,
			}),
		});
	}, [queryClient, getMovieFetchOptions, query, genre, page]);

	const preloadNextPage = useCallback(async () => {
		await queryClient.prefetchQuery(
			getMovieFetchOptions({
				query,
				genre,
				page: page + 1,
			}),
		);
	}, [queryClient, getMovieFetchOptions, query, genre, page]);

	const preloadFirstPage = useCallback(async () => {
		if (page > 1) {
			await queryClient.prefetchQuery(
				getMovieFetchOptions({
					query,
					genre,
					page: 1,
				}),
			);
		}
	}, [queryClient, getMovieFetchOptions, query, genre, page]);

	const preloadLastPage = useCallback(async () => {
		if (paginationInfo?.totalPages && page < paginationInfo.totalPages) {
			await queryClient.prefetchQuery(
				getMovieFetchOptions({
					query,
					genre,
					page: paginationInfo.totalPages,
				}),
			);
		}
	}, [
		queryClient,
		getMovieFetchOptions,
		query,
		genre,
		page,
		paginationInfo?.totalPages,
	]);

	return (
		<BasicMoviesTable
			movies={movies}
			pagination={pagination}
			pageCount={paginationInfo?.totalPages ?? -1}
			onPaginationChange={handlePageChange}
			isLoading={isLoading}
			preloadPreviousPage={preloadPreviousPage}
			preloadNextPage={preloadNextPage}
			preloadFirstPage={preloadFirstPage}
			preloadLastPage={preloadLastPage}
		/>
	);
}
