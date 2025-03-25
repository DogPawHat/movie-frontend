import { useReadQuery } from "@apollo/client/index.js";
import { GET_FIRST_MOVIE } from "~/graphql/queries/get-first-movie";
import { Route } from "~/routes/index";

export function GetFirstMovie() {
  const { movieQueryRef } = Route.useLoaderData();
  const { data } = useReadQuery(movieQueryRef);

  return <div>{data?.movie?.title}</div>;
}
