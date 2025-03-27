import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import {
	type PaginationState,
	type Updater,
	createColumnHelper,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";

import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { MovieType } from "~/types/movie-types";

const PER_PAGE = 10;

const columnHelper = createColumnHelper<MovieType>();

const routeApi = getRouteApi("/");

// Export columns for use in MoviesTable
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

// Internal component for table display logic
function BasicMoviesTable({
	movies,
	pagination,
	pageCount,
	onPaginationChange,
}: {
	movies: MovieType[];
	pagination: PaginationState;
	pageCount: number;
	onPaginationChange: (updater: Updater<PaginationState>) => void;
}) {
	const table = useReactTable({
		pageCount,
		columns,
		data: movies,
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

export function MoviesTable() {
	const navigate = routeApi.useNavigate();
	const { query, genre, page } = routeApi.useSearch();
	const {
		queryOptions: { getMovieFetchOptions },
	} = routeApi.useRouteContext();

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
