/**
 * The member's own "Tag me in WhatsApp group thank-yous" switch (WA-2, US-21, E2).
 * On by default; saved on the server at once (`setWhatsappTagging`).
 */

"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  GET_MY_WHATSAPP_TAGGING,
  SET_WHATSAPP_TAGGING,
  type MyWhatsappTaggingData,
  type SetWhatsappTaggingData,
} from "@/lib/graphql/whatsapp-posts";

export function WhatsAppTaggingCard() {
  const { data } = useQuery<MyWhatsappTaggingData>(GET_MY_WHATSAPP_TAGGING, { errorPolicy: "ignore" });
  const [setTagging, { loading }] = useMutation<SetWhatsappTaggingData, { enabled: boolean }>(SET_WHATSAPP_TAGGING);
  const me = data?.me;
  if (!me) return null;

  const change = async (enabled: boolean) => {
    try {
      const { data: result } = await setTagging({
        variables: { enabled },
        // Show the new value straight away; a refusal writes the old one back.
        optimisticResponse: { setWhatsappTagging: { __typename: "MutationResult", success: true, message: "" } },
        update(cache, { data: answer }) {
          const ok = answer?.setWhatsappTagging.success;
          cache.writeQuery<MyWhatsappTaggingData>({
            query: GET_MY_WHATSAPP_TAGGING,
            data: { me: { ...me, whatsappTagging: ok ? enabled : me.whatsappTagging } },
          });
        },
      });
      const answer = result?.setWhatsappTagging;
      if (answer?.success) toast.success(answer.message);
      else toast.error(answer?.message || "Could not change the setting");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not change the setting");
    }
  };

  return (
    <Card data-testid="whatsapp-tagging-card">
      <CardHeader>
        <CardTitle>WhatsApp group posts</CardTitle>
        <CardDescription>How the church&apos;s WhatsApp group thanks you for your giving.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor="whatsapp-tagging">Tag me in WhatsApp group thank-yous</Label>
            <p className="text-sm text-muted-foreground">
              Tagging puts @your name in the group post that lists your gift, so WhatsApp notifies you. Off: you are
              listed by name only.
            </p>
          </div>
          <Switch id="whatsapp-tagging" checked={me.whatsappTagging} disabled={loading}
            onCheckedChange={(on) => void change(on)} />
        </div>
      </CardContent>
    </Card>
  );
}
