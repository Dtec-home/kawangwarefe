/**
 * "Post update" form on the Updates tab (Fundraising S2, lane S2-UI-D, ticket 2.12).
 *
 * Title and message are required; the image is an optional URL (decision 9:
 * no upload endpoint). Staff can also SMS everyone who has given; the backend
 * builds that audience and audit-logs the post.
 */

"use client";

import { useId, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  POST_CAMPAIGN_UPDATE,
  type PostCampaignUpdateData,
  type PostCampaignUpdateVars,
} from "@/lib/graphql/fundraising/updates";

const POST_FAILED = "Could not post the update";

export interface UpdateDraft {
  title: string;
  body: string;
  imageUrl: string;
  smsDonors: boolean;
}

export const EMPTY_DRAFT: UpdateDraft = { title: "", body: "", imageUrl: "", smsDonors: false };

type DraftErrors = Partial<Record<"title" | "body" | "imageUrl", string>>;

/** Field errors for a draft; empty when it can be posted. */
export function validateDraft(draft: UpdateDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.title.trim()) errors.title = "Give the update a title.";
  if (!draft.body.trim()) errors.body = "Write the update.";
  const image = draft.imageUrl.trim();
  if (image && !/^https?:\/\/\S+$/i.test(image)) errors.imageUrl = "Use a full web address starting with https://";
  return errors;
}

interface UpdateFormProps {
  campaignId: string;
  onPosted: () => void;
}

export function UpdateForm({ campaignId, onPosted }: UpdateFormProps) {
  const id = useId();
  const [draft, setDraft] = useState<UpdateDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<DraftErrors>({});
  const [postUpdate, { loading }] = useMutation<PostCampaignUpdateData, PostCampaignUpdateVars>(
    POST_CAMPAIGN_UPDATE
  );

  const set = <K extends keyof UpdateDraft>(key: K, value: UpdateDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    try {
      const { data } = await postUpdate({
        variables: {
          campaignId,
          title: draft.title.trim(),
          body: draft.body.trim(),
          imageUrl: draft.imageUrl.trim(),
          smsDonors: draft.smsDonors,
        },
      });
      const result = data?.postCampaignUpdate;
      if (result?.success) {
        toast.success(result.message || "Update posted");
        setDraft(EMPTY_DRAFT);
        onPosted();
      } else {
        toast.error(result?.message || POST_FAILED);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : POST_FAILED);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Post an update</CardTitle>
        <CardDescription>Updates show on the public campaign page, newest first.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit} noValidate>
          <div className="space-y-2">
            <Label htmlFor={`${id}-title`}>Title</Label>
            <Input
              id={`${id}-title`}
              value={draft.title}
              maxLength={200}
              placeholder="e.g. The roof is on"
              onChange={(e) => set("title", e.target.value)}
              aria-invalid={errors.title ? true : undefined}
            />
            {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-body`}>Message</Label>
            <Textarea
              id={`${id}-body`}
              rows={5}
              value={draft.body}
              placeholder="What happened, and thank you to everyone who gave. Leave a blank line between paragraphs."
              onChange={(e) => set("body", e.target.value)}
              aria-invalid={errors.body ? true : undefined}
            />
            {errors.body ? <p className="text-sm text-destructive">{errors.body}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${id}-image`}>Image URL (optional)</Label>
            <Input
              id={`${id}-image`}
              type="url"
              inputMode="url"
              value={draft.imageUrl}
              placeholder="https://"
              onChange={(e) => set("imageUrl", e.target.value)}
              aria-invalid={errors.imageUrl ? true : undefined}
            />
            {errors.imageUrl ? <p className="text-sm text-destructive">{errors.imageUrl}</p> : null}
          </div>

          <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-3">
            <Checkbox
              id={`${id}-sms`}
              checked={draft.smsDonors}
              onCheckedChange={(checked) => set("smsDonors", checked === true)}
              aria-describedby={`${id}-sms-help`}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor={`${id}-sms`}>Also SMS everyone who has given</Label>
              <p id={`${id}-sms-help`} className="text-xs text-muted-foreground">
                Each person who has given to this campaign gets one SMS, however many times they gave. Every
                message is paid for from the church&rsquo;s SMS credit, so keep this for important news rather
                than every post.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Post update
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
