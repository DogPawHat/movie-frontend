import { useReadQuery } from "@apollo/client/index.js";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { GET_MOVIES_SEARCH } from "~/graphql/queries/get-movies-search";
import * as v from "valibot";

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
  component: Home,
});

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <Suspense fallback={<div>Loading...</div>}>
        <ShowMovies search="batman" />
      </Suspense>
    </div>
  );
}

function ShowMovies(props: { search: string }) {
  const { movieQueryRef } = Route.useLoaderData();
  const { data } = useReadQuery(movieQueryRef);

  return (
    <div className="p-2">
      {data.movies?.nodes?.map((movie) => (
        <div key={movie.id}>{movie.title}</div>
      ))}
    </div>
  );
}
