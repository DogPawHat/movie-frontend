import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
  routerWithApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-tanstack-start";
import { HttpLink } from "@apollo/client/index.js";
import { routeTree } from "./routeTree.gen";
import { DefaultCatchBoundary } from "./components/default-catch-boundary";
import { NotFound } from "./components/not-found";
import { env } from "./env";
import { createServerFn } from "@tanstack/react-start";
import * as v from "valibot";
import { getCookie, setCookie } from "@tanstack/react-start/server";

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
  const tokenPromise = getAuthToken();

  // can't make createRouter async as my build complains about not having top level await
  // hence the custom fetch
  const customFetch = (async (uri, options) => {
    const token = await tokenPromise;
    return fetch(uri, {
      ...options,
      headers: { ...options?.headers, Authorization: "Bearer " + token },
    });
  }) satisfies typeof fetch;

  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: env.VITE_PUBLIC_API_URL + "/graphql",
      fetch: customFetch,
    }),
  });
  const router = createTanStackRouter({
    routeTree,
    // the context properties `apolloClient` and `preloadQuery`
    // will be filled in by calling `routerWithApolloClient` later
    // you should omit them here, which means you have to
    // `as any` this context object
    context: {} as any,
    defaultPreload: "intent",
    defaultErrorComponent: DefaultCatchBoundary,
    defaultNotFoundComponent: () => <NotFound />,
    scrollRestoration: true,
  });

  return routerWithApolloClient(router, apolloClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
