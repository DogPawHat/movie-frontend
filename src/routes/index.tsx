import { useReadQuery, type PreloadedQueryRef } from "@apollo/client/index.js";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import {
  type PaginationState,
  createColumnHelper,
  useReactTable,
  flexRender,
  getCoreRowModel,
  type Updater,
} from "@tanstack/react-table";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Search } from "lucide-react";
import * as v from "valibot";
import {
  graphql,
  readFragment,
  type ResultOf,
  type VariablesOf,
} from "gql.tada";
import { MOVIE_BASIC } from "~/fragments/movie";

const PER_PAGE = 10;

const GET_MOVIES_SEARCH = graphql(
  `
    query GetMoviesSearch($search: String!, $page: Int! = 0) {
      movies(
        where: { search: $search }
        pagination: { perPage: 10, page: $page }
      ) {
        nodes {
          ...BasicMovie
        }
        pagination {
          perPage
          page
          totalPages
        }
      }
    }
  `,
  [MOVIE_BASIC]
);

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
  page: v.optional(v.number(), 0),
});

export const Route = createFileRoute("/")({
  validateSearch: queryParamsSchema,
  loaderDeps: ({ search }) => ({
    query: search.query,
    page: search.page,
  }),
  loader: async ({ context: { preloadQuery }, deps: { query, page } }) => {
    const movieQueryRef = preloadQuery(GET_MOVIES_SEARCH, {
      variables: {
        search: query,
        page,
      },
    });
    return { movieQueryRef };
  },
  component: Movies,
});

function MovieSearchBar(props: {
  query: string;
  updateQuery: (query: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState(props.query);

  const handleSearch = () => {
    props.updateQuery(searchTerm);
  };

  const handleReset = () => {
    setSearchTerm("");
    props.updateQuery("");
  };

  return (
    <div className="flex gap-2 mb-8 max-w-md mx-auto">
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
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={!searchTerm && !props.query}
      >
        Reset
      </Button>
    </div>
  );
}

function MoviesTable(props: {
  queryRef: PreloadedQueryRef<
    ResultOf<typeof GET_MOVIES_SEARCH>,
    VariablesOf<typeof GET_MOVIES_SEARCH>
  >;
  page: number;
  sendNewPage: (page: number) => void;
}) {
  const { data } = useReadQuery(props.queryRef);

  const movies =
    data.movies?.nodes?.map((node) => readFragment(MOVIE_BASIC, node)) ?? [];

  const pagination = {
    pageIndex: props.page,
    pageSize: PER_PAGE,
  } satisfies PaginationState;

  const handlePageChange = (updater: Updater<PaginationState>) => {
    const newPagination =
      typeof updater === "function" ? updater(pagination) : updater;

    if (newPagination.pageIndex !== pagination.pageIndex) {
      props.sendNewPage(newPagination.pageIndex);
    }
  };

  const table = useReactTable({
    data: movies,
    pageCount: data.movies?.pagination?.totalPages ?? -1,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
    },
    onPaginationChange: handlePageChange,
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
                  header.getContext()
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
                Page {pagination.pageIndex + 1} of {table.getPageCount() || 1}
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

function Movies() {
  const { query, page } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { movieQueryRef } = Route.useLoaderData();

  const updateQuery = useCallback(
    (query: string) => {
      navigate({ search: { query, page: 0 } });
    },
    [navigate]
  );

  const updatePage = useCallback(
    (page: number) => {
      navigate({ search: { query, page } });
    },
    [navigate, query]
  );

  const movieTableKey = `table=${query}-${page}`;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Movie Search</h1>

      <MovieSearchBar query={query} updateQuery={updateQuery} />

      <div className="rounded-md border">
        <Suspense fallback={<div>Loading...</div>}>
          {/* TODO: key={search} is needed to trigger a re-render when the search term changes, why is that? */}
          <MoviesTable
            queryRef={movieQueryRef}
            page={page}
            sendNewPage={updatePage}
            key={movieTableKey}
          />
        </Suspense>
      </div>
    </div>
  );
}
