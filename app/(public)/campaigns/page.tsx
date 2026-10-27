/**
 * /campaigns — the church's active public fundraising campaigns
 * (lane S2-UI-C, ticket 2.7). Totals only; never donor names.
 */

import type { Metadata } from "next";
import { CampaignListView } from "@/components/campaigns/public/campaign-list-view";

export const metadata: Metadata = {
  title: "Campaigns",
  description:
    "Give towards a specific project at SDA Church Kawangware and see how close each campaign is to its goal.",
  alternates: { canonical: "/campaigns" },
  openGraph: {
    title: "Campaigns | SDA Church Kawangware",
    description: "Give towards a specific project at SDA Church Kawangware.",
    url: "/campaigns",
  },
};

export default function CampaignsPage() {
  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="max-w-2xl space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Campaigns</h1>
            <p className="text-lg text-muted-foreground">
              Give towards a specific project in the life of the church, and see how close each one is to
              its goal.
            </p>
          </header>
          <CampaignListView />
        </div>
      </main>
    </div>
  );
}
