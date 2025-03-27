import { Suspense, useCallback, useState } from "react";
import { Search } from "lucide-react";
import * as v from "valibot";
import { graphql, type ResultOf, type VariablesOf } from "gql.tada";
import {
  QueryClient,
  queryOptions,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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

const PER_PAGE = 10;

const GET_MOVIES_SEARCH = graphql(
  `
    query GetMoviesSearch($search: String!, $page: Int! = 0) {
      movies(
        where: { search: $search }
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
  `
);

const GET_GENRES = graphql(`
  query GetGenres {
    genres {
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
  page: v.optional(v.number(), 0),
});

export const Route = createFileRoute("/")({
  validateSearch: queryParamsSchema,
  beforeLoad: ({ context: { graphqlClient } }) => {
    const getMovieFetchOptions = ({
      query,
      page,
    }: {
      query: string;
      page: number;
    }) =>
      queryOptions({
        queryKey: ["movies", { query, page }],
        queryFn: () =>
          graphqlClient.request({
            document: GET_MOVIES_SEARCH,
            variables: {
              search: query,
              page,
            },
          }),
      });

    const genreFetchOptions = queryOptions({
      queryKey: ["genres"],
      queryFn: () => graphqlClient.request(GET_GENRES),
    });

    return { getMovieFetchOptions, genreFetchOptions };
  },
  loaderDeps: ({ search }) => ({
    query: search.query,
    page: search.page,
  }),
  loader: async ({
    context: { getMovieFetchOptions, genreFetchOptions, queryClient },
    deps: { query, page },
  }) => {
    queryClient.prefetchQuery(getMovieFetchOptions({ query, page }));
    // await queryClient.ensureQueryData(genreFetchOptions);
  },
  component: Movies,
});

function MovieSearchBar() {
  const { query } = Route.useSearch();
  const navigate = Route.useNavigate();

  const handleSearch = (searchTerm: string) => {
    navigate({ search: { query: searchTerm, page: 0 } });
  };

  const handleReset = () => {
    navigate({ search: { query: "", page: 0 } });
  };

  return (
    <BaseMovieSearchBar
      key={query}
      query={query}
      updateQuery={handleSearch}
      resetQuery={handleReset}
    />
  );
}

function BaseMovieSearchBar(props: {
  query: string;
  updateQuery: (query: string) => void;
  resetQuery: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState(props.query);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    props.updateQuery(searchTerm);
  };

  const handleReset = () => {
    props.resetQuery();
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2 mb-8 max-w-md mx-auto">
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
      <Button
        variant="outline"
        onClick={handleReset}
        disabled={!searchTerm && !props.query}
      >
        Reset
      </Button>
    </form>
  );
}

function MoviesTable() {
  const navigate = Route.useNavigate();
  const { query, page } = Route.useSearch();
  const { getMovieFetchOptions } = Route.useRouteContext();
  const { data } = useSuspenseQuery(getMovieFetchOptions({ query, page }));

  const movies = data.movies?.nodes ?? [];

  const pagination = {
    pageIndex: page,
    pageSize: PER_PAGE,
  } satisfies PaginationState;

  const handlePageChange = (updater: Updater<PaginationState>) => {
    const newPagination =
      typeof updater === "function" ? updater(pagination) : updater;

    if (newPagination.pageIndex !== pagination.pageIndex) {
      navigate({ search: { query, page: newPagination.pageIndex } });
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
