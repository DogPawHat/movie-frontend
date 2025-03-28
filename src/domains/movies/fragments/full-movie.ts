import { graphql } from "gql.tada";

export const FullMovieFields = graphql(
	`
  fragment FullMovieFields on Movie {
    summary
    directors
    mainActors
    writers
    genres {
      id
      title
    }
  }
`,
);
