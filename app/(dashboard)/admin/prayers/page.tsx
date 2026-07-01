/**
 * Admin prayer review (Sprint 7 / Epic E5).
 *
 * Staff-only page listing all prayer requests with status controls.
 * Shows requester display name when not anonymous; suppresses otherwise.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, type StatusVariant } from "@/components/ui/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GET_PRAYER_REQUESTS,
  UPDATE_PRAYER_REQUEST_STATUS,
} from "@/lib/graphql/prayer-mutations";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty } from "@/components/ui/empty";
import { Heart } from "lucide-react";

type PrayerStatus = "open" | "praying" | "answered" | "archived";

interface PrayerRow {
  id: string;
  title: string;
  body: string;
  status: string;
  visibility: string;
  isAnonymous: boolean;
  createdAt: string;
  requesterDisplayName: string | null;
}

interface GetRowsData { prayerRequests: PrayerRow[] }
interface UpdateStatusData {
  updatePrayerRequestStatus: { success: boolean; message: string };
}

const STATUS_VARIANT: Record<string, StatusVariant> = {
  open: "warning",
  praying: "info",
  answered: "success",
  archived: "neutral",
};

function AdminPrayersContent() {
  const [filter, setFilter] = useState<PrayerStatus | "">("");
  const { data, loading, refetch } = useQuery<GetRowsData>(GET_PRAYER_REQUESTS, {
    variables: { status: filter || null },
    fetchPolicy: "cache-and-network",
  });
  const [updateStatus] = useMutation<UpdateStatusData>(
    UPDATE_PRAYER_REQUEST_STATUS
  );

  const rows = data?.prayerRequests ?? [];

  const handleStatusChange = async (id: string, newStatus: PrayerStatus) => {
    try {
      const { data } = await updateStatus({
        variables: { requestId: id, newStatus },
      });
      const res = data?.updatePrayerRequestStatus;
      if (res?.success) {
        toast.success(res.message || "Status updated");
        await refetch();
      } else {
        toast.error(res?.message || "Could not update");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Prayer Requests" />

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={filter || "all"}
            onValueChange={(v) => setFilter(v === "all" ? "" : (v as PrayerStatus))}
          >
            <SelectTrigger aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="praying">Praying</SelectItem>
              <SelectItem value="answered">Answered</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Requests ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="space-y-4" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <Empty
              icon={Heart}
              title="No prayer requests"
              description="There are no prayer requests matching this filter."
            />
          ) : (
            <ul className="divide-y divide-border" aria-label="Prayer requests">
              {rows.map((r) => (
                <li key={r.id} className="py-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.isAnonymous || !r.requesterDisplayName
                          ? "Anonymous"
                          : r.requesterDisplayName}
                        {" · "}
                        {r.visibility}
                        {" · "}
                        {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge variant={STATUS_VARIANT[r.status] ?? "neutral"}>
                      {r.status}
                    </StatusBadge>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.body}</p>
                  <div className="flex gap-2 flex-wrap">
                    {(["praying", "answered", "archived"] as PrayerStatus[]).map(
                      (s) => (
                        <Button
                          key={s}
                          variant="outline"
                          size="sm"
                          disabled={r.status === s}
                          onClick={() => handleStatusChange(r.id, s)}
                        >
                          Mark {s}
                        </Button>
                      )
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPrayersPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout>
        <AdminPrayersContent />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
