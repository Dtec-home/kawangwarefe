/**
 * The champion's share kit (Fundraising S5, lane S5-UI-J, ticket 5.9): their
 * personal link with the shared ShareBar, the Pay Bill line and a ready-to-send
 * WhatsApp message.
 */

"use client";

import { MessageCircle } from "lucide-react";

import { ShareBar } from "@/components/campaigns/shared/share-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { whatsappTextUrl } from "@/lib/fundraising/share-links";
import type { Champion } from "@/lib/types/fundraising";

import { championPaybillText, championWhatsappMessage } from "./champion-display";
import { CopyTextButton } from "./copy-text-button";

type ShareKitChampion = Pick<Champion, "campaignTitle" | "publicUrl" | "paymentInstructions">;

export function ChampionShareKit({ champion }: { champion: ShareKitChampion }) {
  const paybill = championPaybillText(champion.paymentInstructions);
  const message = championWhatsappMessage(champion);

  return (
    <Card role="region" aria-label="Share kit">
      <CardHeader>
        <CardTitle>Share kit</CardTitle>
        <CardDescription>
          Every gift through your link or your account number is counted for you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-2" aria-label="Your link">
          <h3 className="text-sm font-medium">Your link</h3>
          <p data-testid="champion-link" className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-sm">
            {champion.publicUrl}
          </p>
          <ShareBar
            url={champion.publicUrl}
            text={`Support ${champion.campaignTitle} through my champion page`}
            title={champion.campaignTitle}
          />
        </section>

        <section className="space-y-2" aria-label="M-Pesa Pay Bill">
          <h3 className="text-sm font-medium">M-Pesa Pay Bill</h3>
          <p data-testid="champion-paybill" className="rounded-lg bg-muted px-3 py-2 font-mono text-sm">
            {paybill}
          </p>
          <CopyTextButton text={paybill} label="Copy Pay Bill details" what="Pay Bill details" />
        </section>

        <section className="space-y-2" aria-label="WhatsApp message">
          <h3 className="text-sm font-medium">WhatsApp message</h3>
          <p data-testid="champion-message" className="whitespace-pre-line rounded-lg bg-muted px-3 py-2 text-sm">
            {message}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href={whatsappTextUrl(message)} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" />
                Send on WhatsApp
              </a>
            </Button>
            <CopyTextButton text={message} label="Copy message" what="Message" />
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
