/**
 * Submit a prayer request (Sprint 7 / Epic E5).
 *
 * Available to authenticated members via the dashboard. Supports
 * opt-in anonymity: the submitter remains linked server-side for audit,
 * but the UI / team view suppresses identity.
 */

"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Heart } from "lucide-react";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { MemberLayout } from "@/components/layouts/member-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SUBMIT_PRAYER_REQUEST,
  GET_MY_PRAYER_REQUESTS,
} from "@/lib/graphql/prayer-mutations";
import { Empty } from "@/components/ui/empty";
import { StatusBadge, statusToVariant } from "@/components/ui/status-badge";

type Visibility = "team" | "public" | "private";

interface SubmitData {
  submitPrayerRequest: {
    success: boolean;
    message: string;
    request: { id: string } | null;
  };
}

interface MyPrayerRequest {
  id: string;
  title: string;
  status: string;
  visibility: string;
  createdAt: string;
}

interface MyData {
  myPrayerRequests: MyPrayerRequest[];
}

function NewPrayerContent() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("team");
  const [error, setError] = useState<string | null>(null);

  const [submit, { loading }] = useMutation<SubmitData>(SUBMIT_PRAYER_REQUEST);
  const { data, refetch } = useQuery<MyData>(GET_MY_PRAYER_REQUESTS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || !body.trim()) {
      setError("Title and body are required.");
      return;
    }
    try {
      const { data } = await submit({
        variables: {
          title: title.trim(),
          body: body.trim(),
          isAnonymous,
          visibility,
        },
      });
      const res = data?.submitPrayerRequest;
      if (res?.success) {
        toast.success(res.message || "Submitted");
        setTitle("");
        setBody("");
        setIsAnonymous(false);
        setVisibility("team");
        await refetch();
      } else {
        setError(res?.message || "Could not submit");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    }
  };

  const mine = data?.myPrayerRequests ?? [];

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Prayer Request</CardTitle>
          <CardDescription>
            Your pastors and prayer team will lift up your request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="prayer-title">Title</Label>
              <Input
                id="prayer-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={120}
                required
              />
            </div>
            <div>
              <Label htmlFor="prayer-body">Details</Label>
              <Textarea
                id="prayer-body"
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
                required
              />
            </div>
            <div>
              <Label htmlFor="prayer-visibility">Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v: Visibility) => setVisibility(v)}
              >
                <SelectTrigger id="prayer-visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="team">Prayer team only</SelectItem>
                  <SelectItem value="private">Just my pastor</SelectItem>
                  <SelectItem value="public">Public wall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isAnonymous}
                onCheckedChange={(v) => setIsAnonymous(Boolean(v))}
              />
              Submit anonymously (hide my name from the team)
            </label>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {mine.length === 0 ? (
            <Empty
              icon={Heart}
              title="No requests yet"
              description="You haven't submitted any requests yet."
            />
          ) : (
            <ul className="divide-y divide-border">
              {mine.map((r) => (
                <li key={r.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.visibility} · {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <StatusBadge variant={statusToVariant(r.status)}>
                    {r.status}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewPrayerPage() {
  return (
    <ProtectedRoute>
      <MemberLayout>
        <NewPrayerContent />
      </MemberLayout>
    </ProtectedRoute>
  );
}
