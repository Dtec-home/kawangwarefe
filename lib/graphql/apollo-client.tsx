"use client";

/**
 * Apollo Client Setup for Next.js 14+
 * Following DRY: Centralized GraphQL client configuration
 * Using @apollo/client-integration-nextjs for Next.js optimization
 */

import { ApolloLink, HttpLink, Observable } from "@apollo/client";
import { ErrorLink } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
  SSRMultipartLink,
} from "@apollo/client-integration-nextjs";

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns the new access token or null if refresh fails.
 * Uses a singleton promise to prevent concurrent refresh attempts.
 */
let pendingRefresh: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // Deduplicate: if a refresh is already in-flight, reuse it
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    if (!refreshToken) return null;

    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_GRAPHQL_URL || "http://localhost:8000/graphql",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `mutation RefreshToken($refreshToken: String!) {
              refreshToken(refreshToken: $refreshToken) {
                success
                accessToken
              }
            }`,
            variables: { refreshToken },
          }),
        }
      );
      const data = await response.json();
      const result = data?.data?.refreshToken;
      if (result?.success && result?.accessToken) {
        localStorage.setItem("access_token", result.accessToken);
        return result.accessToken;
      }
    } catch {
      // Refresh failed
    }
    return null;
  })();

  try {
    return await pendingRefresh;
  } finally {
    pendingRefresh = null;
  }
}

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

  // Error link to handle auth errors and auto-refresh tokens
  const errorLink = new ErrorLink(({ error, operation, forward }) => {
    // Check if this is a GraphQL error with the errors array
    if (CombinedGraphQLErrors.is(error)) {
      for (const err of error.errors) {
        if (
          err.message?.includes("Authentication required") ||
          err.message?.includes("permission")
        ) {
          // Try to refresh the token
          return new Observable((observer) => {
            refreshAccessToken()
              .then((newToken) => {
                if (newToken) {
                  // Retry the failed request with the new token
                  const oldHeaders = operation.getContext().headers;
                  operation.setContext({
                    headers: {
                      ...oldHeaders,
                      authorization: `Bearer ${newToken}`,
                    },
                  });
                  forward(operation).subscribe(observer);
                } else {
                  // Refresh failed, clear session and redirect to login
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    localStorage.removeItem("user");
                    document.cookie = "has_session=; path=/; max-age=0; SameSite=Lax";
                    window.location.href = "/login";
                  }
                  observer.error(err);
                }
              })
              .catch(() => observer.error(err));
          });
        }
      }
    }
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
        : ApolloLink.from([errorLink, authLink, httpLink]),
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