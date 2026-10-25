/**
 * ChampionPageView — a champion's public page, /campaigns/[slug]/c/[code]
 * (lane S5-UI-I, ticket 5.7): "Raised by <champion> for <campaign>", the
 * champion's totals and personal target, the whole campaign's progress, and
 * a give card that carries the champion's code. Totals only, never donor
 * names; givers are told the champion sees theirs (decision 4).
 *
 * `publicChampion` has no id, so the query uses `no-cache`.
 */

"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft, PauseCircle, RefreshCw, UserX } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { CampaignProgress } from "@/components/campaigns/shared/campaign-progress";
import { CampaignClosedNotice } from "@/components/campaigns/public/campaign-closed-notice";
import { CampaignCover } from "@/components/campaigns/public/campaign-cover";
import { DaysLeft } from "@/components/campaigns/public/days-left";
import {
  PUBLIC_CHAMPION_PAGE,
  type PublicChampionPageChampion,
  type PublicChampionPageData,
  type PublicChampionPageVars,
} from "@/lib/graphql/fundraising/public-champions";
import { ChampionGiveCard } from "./champion-give-card";
import { ChampionShareCard } from "./champion-share-card";
import { ChampionTotals } from "./champion-totals";
import { firstName, initials } from "./champion-format";

const campaignHref = (slug: string) => `/campaigns/${encodeURIComponent(slug)}`;

export function ChampionPageView({ slug, code }: { slug: string; code: string }) {
  const { data, loading, error, refetch } = useQuery<PublicChampionPageData, PublicChampionPageVars>(
    PUBLIC_CHAMPION_PAGE,
    { variables: { slug, code }, fetchPolicy: "no-cache" },
  );

  if (loading && !data) return <ChampionPageSkeleton />;

  if (error && !data) {
    return (
      <Empty
        icon={RefreshCw}
        title="This page could not be loaded"
        description="Check your connection and try again."
        action={
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const champion = data?.publicChampion;
  if (!champion) {
    return (
      <Empty
        icon={UserX}
        title="We couldn't find that champion"
        description="The link may be mistyped, or this champion is no longer raising funds for the campaign. You can still give to the campaign itself."
        action={
          <Link href={campaignHref(slug)} className={buttonVariants({ variant: "outline" })}>
            Go to the campaign
          </Link>
        }
      />
    );
  }

  return <ChampionPageBody champion={champion} />;
}

function ChampionPageBody({ champion }: { champion: PublicChampionPageChampion }) {
  const { campaign } = champion;
  const accepting = campaign.isAcceptingGifts;
  const closed = campaign.isClosed;
  return (
    <article className="space-y-8 lg:space-y-10">
      <ChampionHero champion={champion} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
        <div className="space-y-6">
          <ChampionTotals
            championName={champion.championName}
            raised={champion.raised}
            donorCount={champion.donorCount}
            personalTarget={champion.personalTarget}
          />

          <section
            aria-labelledby="whole-campaign-heading"
            data-testid="champion-campaign-progress"
            className="space-y-4 rounded-2xl bg-muted/50 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="whole-campaign-heading" className="font-semibold">
                The whole campaign
              </h2>
              <DaysLeft daysLeft={closed ? null : campaign.daysLeft} />
            </div>
            {campaign.summary ? <p className="text-sm text-muted-foreground">{campaign.summary}</p> : null}
            <CampaignProgress progress={campaign.progress} className="[&_.text-2xl]:text-lg" />
            <Link href={campaignHref(campaign.slug)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              See the campaign page
            </Link>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24" aria-label="Give and share">
          {accepting ? (
            <ChampionGiveCard champion={champion} />
          ) : closed ? (
            <CampaignClosedNotice className="sm:flex-col sm:items-start" />
          ) : (
            <NotTakingGifts slug={campaign.slug} />
          )}
          {closed ? null : <ChampionShareCard champion={champion} />}
        </aside>
      </div>
    </article>
  );
}

function ChampionHero({ champion }: { champion: PublicChampionPageChampion }) {
  const { campaign } = champion;
  return (
    <header className="space-y-5">
      <Link
        href={campaignHref(campaign.slug)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to the campaign
      </Link>
      <div className="relative">
        <div className="aspect-[16/7] overflow-hidden rounded-3xl bg-muted shadow-sm sm:aspect-[21/7]">
          <CampaignCover url={campaign.coverImageUrl} priority />
        </div>
        <div
          aria-hidden="true"
          className="absolute -bottom-8 left-5 flex size-20 items-center justify-center rounded-full border-4 border-background bg-primary text-2xl font-bold text-primary-foreground shadow-md sm:left-8 sm:size-24 sm:text-3xl"
        >
          {initials(champion.championName)}
        </div>
      </div>
      <div className="space-y-2 pt-8">
        <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Raised by {champion.championName} for {campaign.title}
        </h1>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
          {firstName(champion.championName)} is asking friends and family to give towards {campaign.title}.
        </p>
      </div>
    </header>
  );
}

function NotTakingGifts({ slug }: { slug: string }) {
  return (
    <div role="status" className="space-y-3 rounded-2xl border border-warning/40 bg-warning/10 p-5">
      <div className="flex items-start gap-3">
        <PauseCircle className="mt-0.5 size-5 shrink-0 text-warning-foreground" aria-hidden="true" />
        <div>
          <p className="font-semibold">This campaign is not taking gifts right now</p>
          <p className="text-sm text-muted-foreground">It may be paused or finished.</p>
        </div>
      </div>
      <Link href={campaignHref(slug)} className={buttonVariants({ variant: "outline", size: "sm" })}>
        Go to the campaign
      </Link>
    </div>
  );
}

function ChampionPageSkeleton() {
  return (
    <div className="space-y-8" data-testid="champion-page-loading">
      <Skeleton className="aspect-[16/7] w-full rounded-3xl sm:aspect-[21/7]" />
      <Skeleton className="h-10 w-3/4" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    </div>
  );
}
