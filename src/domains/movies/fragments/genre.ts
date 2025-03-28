import { graphql } from "gql.tada";

export const GenreFields = graphql(
	`
  fragment GenreFields on Genre {
    id
    title
  }
`,
);
