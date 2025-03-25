import { useQuery } from "@apollo/client/index.js";
import { GET_FIRST_MOVIE } from "~/graphql/queries/get-first-movie";

export function GetFirstMovie() {
  const { data } = useQuery(GET_FIRST_MOVIE, {
    variables: {
      movieId: "7GQMaTpw7B0MInjOHis5yu",
    },
  });

  return <div>{data?.movie?.title}</div>;
}
