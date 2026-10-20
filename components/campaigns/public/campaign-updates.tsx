/**
 * CampaignUpdates — the news staff post about the campaign, newest first.
 * Plain text only; the poster's name is not shown.
 */

import type { PublicCampaignPageUpdate } from "@/lib/graphql/fundraising/public";
import { formatUpdateDate, newestFirst, safeHttpUrl, storyParagraphs } from "./campaign-format";

export function CampaignUpdates({ updates }: { updates: readonly PublicCampaignPageUpdate[] }) {
  if (updates.length === 0) return null;
  return (
    <section data-slot="campaign-updates" aria-labelledby="campaign-updates-heading" className="space-y-5">
      <h2 id="campaign-updates-heading" className="text-xl font-semibold tracking-tight">
        Updates
      </h2>
      <ol className="relative space-y-8 border-l-2 border-primary/20 pl-6">
        {newestFirst(updates).map((update) => {
          const date = formatUpdateDate(update.publishedAt);
          const image = safeHttpUrl(update.imageUrl);
          return (
            <li key={update.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute top-1.5 -left-[calc(1.5rem+7px)] size-3 rounded-full border-2 border-background bg-primary"
              />
              {date && update.publishedAt ? (
                <time dateTime={update.publishedAt} className="text-sm text-muted-foreground">
                  {date}
                </time>
              ) : null}
              <h3 className="mt-0.5 font-semibold">{update.title}</h3>
              <div className="mt-2 max-w-prose space-y-3 text-sm leading-relaxed text-foreground/85">
                {storyParagraphs(update.body).map((text, i) => (
                  <p key={i} className="whitespace-pre-line">
                    {text}
                  </p>
                ))}
              </div>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="" loading="lazy" className="mt-3 max-h-80 w-full rounded-xl object-cover" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
