import { useReadQuery, type PreloadedQueryRef } from "@apollo/client/index.js";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useCallback, useState } from "react";
import {
  createColumnHelper,
  useReactTable,
  flexRender,
  getCoreRowModel,
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

const GET_MOVIES_SEARCH = graphql(
  `
    query GetMoviesSearch($search: String!) {
      movies(where: { search: $search }) {
        nodes {
          ...BasicMovie
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
  search: v.optional(v.string(), ""),
});

export const Route = createFileRoute("/")({
  validateSearch: queryParamsSchema,
  loaderDeps: ({ search }) => ({ search: search.search }),
  loader: async ({ context: { preloadQuery }, deps: { search } }) => {
    const movieQueryRef = preloadQuery(GET_MOVIES_SEARCH, {
      variables: {
        search,
      },
    });
    return { movieQueryRef };
  },
  component: Movies,
});

function MovieSearchBar(props: {
  search: string;
  updateSearch: (search: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState(props.search);

  const handleSearch = () => {
    props.updateSearch(searchTerm);
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
    </div>
  );
}

function MoviesTable(props: {
  queryRef: PreloadedQueryRef<
    ResultOf<typeof GET_MOVIES_SEARCH>,
    VariablesOf<typeof GET_MOVIES_SEARCH>
  >;
}) {
  const { data } = useReadQuery(props.queryRef);

  const movies =
    data.movies?.nodes?.map((node) => readFragment(MOVIE_BASIC, node)) ?? [];

  const table = useReactTable({
    data: movies,
    columns,
    getCoreRowModel: getCoreRowModel(),
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
    </Table>
  );
}

function Movies() {
  const { search } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { movieQueryRef } = Route.useLoaderData();

  const updateSearch = useCallback(
    (search: string) => {
      navigate({ search: { search } });
    },
    [navigate]
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Movie Search</h1>

      <MovieSearchBar search={search} updateSearch={updateSearch} />

      <div className="rounded-md border">
        <Suspense fallback={<div>Loading...</div>}>
          <MoviesTable queryRef={movieQueryRef} />
        </Suspense>
      </div>
    </div>
  );
}
