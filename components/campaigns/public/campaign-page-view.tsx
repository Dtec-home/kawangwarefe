/**
 * CampaignPageView — the public page of one campaign (lane S2-UI-C, 2.7–2.9):
 * hero, totals-only progress, story, gallery and updates, with the give panel
 * and share bar alongside. Never names a donor.
 *
 * The query uses `no-cache`: `publicCampaign(slug)` has no id, so this
 * page's selection and the give panel's would overwrite each other in the
 * shared cache and refetch in turn.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { HeartHandshake, PauseCircle, RefreshCw, SearchX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import {
  PUBLIC_CAMPAIGN_PAGE,
  type PublicCampaignPageCampaign,
  type PublicCampaignPageData,
} from "@/lib/graphql/fundraising/public";
import { cn } from "@/lib/utils";
import { CampaignCover } from "./campaign-cover";
import { CampaignGallery } from "./campaign-gallery";
import { CampaignGiveSection } from "./campaign-give-section";
import { CampaignShareCard } from "./campaign-share-card";
import { CampaignStory } from "./campaign-story";
import { CampaignUpdates } from "./campaign-updates";
import { DaysLeft } from "./days-left";
import { LeaderboardSlot } from "@/components/champions/public/leaderboard-slot";
import { PublicPledgeSlot } from "@/components/pledges/public/public-pledge-slot";

export function CampaignPageView({ slug }: { slug: string }) {
  const { data, loading, error, refetch } = useQuery<PublicCampaignPageData>(PUBLIC_CAMPAIGN_PAGE, {
    variables: { slug },
    fetchPolicy: "no-cache",
  });

  if (loading && !data) return <CampaignPageSkeleton />;

  if (error && !data) {
    return (
      <Empty
        icon={RefreshCw}
        title="This campaign could not be loaded"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const campaign = data?.publicCampaign;
  if (!campaign) {
    return (
      <Empty
        icon={SearchX}
        title="We couldn't find that campaign"
        description="The link may be mistyped, or the campaign is no longer public."
        action={
          <Link href="/campaigns" className={buttonVariants({ variant: "outline" })}>
            See all campaigns
          </Link>
        }
      />
    );
  }

  return <CampaignPageBody campaign={campaign} />;
}

function CampaignPageBody({ campaign }: { campaign: PublicCampaignPageCampaign }) {
  const accepting = campaign.isAcceptingGifts;
  return (
    <article className="space-y-8 lg:space-y-10">
      <CampaignHero campaign={campaign} />

      {!accepting ? <NotTakingGifts /> : null}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <div className="space-y-10">
          {/* On wide screens the give panel beside the story shows the
              progress, so this band is for phones (and closed campaigns). */}
          <section
            aria-label="Progress"
            className={cn("rounded-2xl border bg-card p-5 shadow-sm sm:p-6", accepting && "lg:hidden")}
          >
            <CampaignProgress progress={campaign.progress} />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <DaysLeft daysLeft={campaign.daysLeft} />
              {accepting ? (
                <a href="#give" className={buttonVariants({ size: "sm" })}>
                  <HeartHandshake className="size-4" aria-hidden="true" />
                  Give now
                </a>
              ) : null}
            </div>
          </section>

          <CampaignStory story={campaign.story} />
          <CampaignGallery items={campaign.gallery} title={campaign.title} />
          <CampaignUpdates updates={campaign.updates} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24" aria-label="Give and share">
          {accepting ? <CampaignGiveSection slug={campaign.slug} /> : null}
          {/* fundraising-hook: pledges (S3-UI-E) and champion leaderboard (S5-UI-I) */}
          <PublicPledgeSlot campaign={campaign} />
          <LeaderboardSlot campaign={campaign} />
          <CampaignShareCard campaign={campaign} />
        </aside>
      </div>
    </article>
  );
}

function CampaignHero({ campaign }: { campaign: PublicCampaignPageCampaign }) {
  return (
    <header className="relative isolate overflow-hidden rounded-3xl bg-muted shadow-sm">
      <div className="aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]">
        <CampaignCover url={campaign.coverImageUrl} priority />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
      />
      <div className="absolute inset-x-0 bottom-0 space-y-3 p-5 text-white sm:p-8 lg:p-10">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {campaign.title}
        </h1>
        {campaign.summary ? (
          <p className="max-w-2xl text-base text-pretty text-white/85 sm:text-lg">{campaign.summary}</p>
        ) : null}
        <DaysLeft daysLeft={campaign.daysLeft} className="text-white/85" />
      </div>
    </header>
  );
}

function NotTakingGifts() {
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex items-start gap-3">
        <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden="true" />
        <div>
          <p className="font-semibold">This campaign is not taking gifts right now</p>
          <p className="text-sm text-muted-foreground">
            It may be paused or finished. You can still give to the church.
          </p>
        </div>
      </div>
      <Link href="/contribute" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Give to the church
      </Link>
    </div>
  );
}

function CampaignPageSkeleton() {
  return (
    <div className="space-y-8" data-testid="campaign-page-loading">
      <Skeleton className="aspect-[4/5] w-full rounded-3xl sm:aspect-[16/9] lg:aspect-[21/9]" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
