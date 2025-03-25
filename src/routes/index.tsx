import { createFileRoute } from "@tanstack/react-router";
import { GetFirstMovie } from "~/components/get-first-movie";
import { GET_FIRST_MOVIE } from "~/graphql/queries/get-first-movie";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({ context: { preloadQuery } }) => {
    const movieQueryRef = await preloadQuery(GET_FIRST_MOVIE, {
      variables: {
        movieId: "7GQMaTpw7B0MInjOHis5yu",
      },
    });
    return { movieQueryRef };
  },
});

function Home() {
  return (
    <div className="p-2">
      <h3>Welcome Home!!!</h3>
      <GetFirstMovie />
    </div>
  );
}
