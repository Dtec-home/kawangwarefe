/**
 * usePendingVoidRequestCount — pending receipt void requests (T2.6).
 *
 * Drives the nav badge on "Receipts". Only treasurers and admins may read
 * void requests, so the query is skipped unless `enabled`, and polls
 * modestly (60 s) so the badge stays roughly current.
 */

"use client";

import { useQuery } from "@apollo/client/react";
import {
  GET_PENDING_VOID_REQUEST_COUNT,
  type PendingVoidRequestCountData,
} from "@/lib/graphql/receipt-queries";

export const VOID_REQUEST_POLL_MS = 60_000;

export function usePendingVoidRequestCount({ enabled }: { enabled: boolean }): number {
  const { data } = useQuery<PendingVoidRequestCountData>(GET_PENDING_VOID_REQUEST_COUNT, {
    skip: !enabled,
    pollInterval: enabled ? VOID_REQUEST_POLL_MS : undefined,
    fetchPolicy: "cache-and-network",
    errorPolicy: "ignore",
  });
  return enabled ? data?.voidRequests?.length ?? 0 : 0;
}
