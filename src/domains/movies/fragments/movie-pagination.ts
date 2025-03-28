import { graphql } from "gql.tada";

export const MoviePaginationFields = graphql(
	`
  fragment MoviePaginationFields on Pagination {
    perPage
    page
    totalPages
  }
`,
);
