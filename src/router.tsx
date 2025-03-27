import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { GraphQLClient, type RequestMiddleware } from "graphql-request";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { env } from "./env";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { QueryClient } from "@tanstack/react-query";
import { routerWithQueryClient } from "@tanstack/react-router-with-query";

const TokenReturnSchema = v.object({
  token: v.string(),
});

// Fetch and store the auth token on server and return to client
const getAuthToken = createServerFn({ method: "GET" }).handler(async () => {
  const maybeToken = getCookie("api-auth-token");

  if (!maybeToken) {
    console.log("No token found, fetching new one");
    const newToken = await fetch(env.VITE_PUBLIC_API_URL + "/auth/token", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!newToken.ok) {
      throw new Error("Failed to fetch auth token");
    }

    const { token } = v.parse(TokenReturnSchema, await newToken.json());

    setCookie("api-auth-token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    console.log("New token fetched, returning");
    return token;
  }

  console.log("Token found, returning");
  return maybeToken;
});

export function createRouter() {
  const queryClient = new QueryClient();
  const tokenPromise = getAuthToken();

  const requestMiddleware: RequestMiddleware = async (request) => {
    return {
      ...request,
      headers: {
        ...request.headers,
        "Content-Type": "application/json",
        Authorization: "Bearer " + (await tokenPromise),
      },
    };
  };

  const graphqlClient = new GraphQLClient(
    env.VITE_PUBLIC_API_URL + "/graphql",
    {
      requestMiddleware,
    },
  );

  const router = createTanStackRouter({
    routeTree,
    // the context properties `apolloClient` and `preloadQuery`
    // will be filled in by calling `routerWithApolloClient` later
    // you should omit them here, which means you have to
    // `as any` this context object
    context: {
      queryClient,
      graphqlClient,
    },
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });

  return routerWithQueryClient(router, queryClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
