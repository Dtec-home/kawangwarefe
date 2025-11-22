"use client";

/**
 * Apollo Client Setup for Next.js 14+
 * Following DRY: Centralized GraphQL client configuration
 * Using @apollo/client-integration-nextjs for Next.js optimization
 */

import { ApolloLink, HttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
  SSRMultipartLink,
} from "@apollo/client-integration-nextjs";

/**
 * Create Apollo Client instance
 * Following SRP: Only responsible for client creation
 */
function makeClient() {
  const httpLink = new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
    fetchOptions: { cache: "no-store" },
  });

  // Auth link to add JWT token to requests
  const authLink = setContext((_, { headers }) => {
    // Get token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link:
      typeof window === "undefined"
        ? ApolloLink.from([
            new SSRMultipartLink({
              stripDefer: true,
            }),
            httpLink,
          ])
        : ApolloLink.from([authLink, httpLink]),
  });
}

/**
 * Apollo Provider Wrapper
 * Use this to wrap your app in layout.tsx
 */
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}