import { useReadQuery } from "@apollo/client/index.js";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";
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
import { Router, Search } from "lucide-react";
import { GET_MOVIES_SEARCH } from "~/graphql/queries/get-movies-search";
import * as v from "valibot";

type Movie = {
  id: string;
  title: string;
  datePublished: string;
  posterUrl: string;
};

const columnHelper = createColumnHelper<Movie>();

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
      return (
        <img
          src={row.original.posterUrl}
          alt={row.original.title}
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

function MovieSearchBar() {
  const { search } = Route.useSearch();
  const navigate = Route.useNavigate();

  const [searchTerm, setSearchTerm] = useState(search);

  const handleSearch = () => {
    navigate({ search: { search: searchTerm } });
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

function MoviesTable() {
  const { movieQueryRef } = Route.useLoaderData();
  const { data } = useReadQuery(movieQueryRef);

  const table = useReactTable({
    data: (data?.movies?.nodes as Movie[]) ?? [],
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
