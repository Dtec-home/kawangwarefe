/**
 * CampaignGallery — the campaign's pictures and YouTube videos. Every link is
 * validated first: pictures must be http(s), videos must carry a real
 * YouTube id and are embedded from youtube-nocookie.com. Anything else is
 * left out.
 */

import type { GalleryItem } from "@/lib/types/fundraising";
import { safeHttpUrl, youtubeEmbedUrl, youtubeId } from "./campaign-format";

/** `n` numbers the photos and the videos separately, for their labels. */
type Shown = { kind: "image"; src: string; n: number } | { kind: "youtube"; id: string; n: number };

export function galleryToShow(items: readonly GalleryItem[]): Shown[] {
  const shown: Shown[] = [];
  for (const item of items) {
    if (item.kind === "youtube") {
      const id = youtubeId(item.url);
      if (id) shown.push({ kind: "youtube", id, n: shown.filter((s) => s.kind === "youtube").length + 1 });
    } else if (item.kind === "image") {
      const src = safeHttpUrl(item.url);
      if (src) shown.push({ kind: "image", src, n: shown.filter((s) => s.kind === "image").length + 1 });
    }
  }
  return shown;
}

export function CampaignGallery({ items, title }: { items: readonly GalleryItem[]; title: string }) {
  const shown = galleryToShow(items);
  if (shown.length === 0) return null;
  return (
    <section aria-labelledby="campaign-gallery-heading" className="space-y-4">
      <h2 id="campaign-gallery-heading" className="text-xl font-semibold tracking-tight">
        Photos and videos
      </h2>
      <div data-slot="campaign-gallery" className="grid grid-cols-2 gap-3">
        {shown.map((item, i) =>
          item.kind === "youtube" ? (
            <div key={i} className="col-span-2 aspect-video overflow-hidden rounded-xl bg-muted">
              <iframe
                src={youtubeEmbedUrl(item.id)}
                title={`Video ${item.n} about ${title}`}
                className="size-full"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <a
              key={i}
              href={item.src}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-[4/3] overflow-hidden rounded-xl bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {/* Free-form image URLs (decision 9) cannot be listed for next/image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.src} alt={`Photo ${item.n} of ${title}`} loading="lazy" className="size-full object-cover" />
            </a>
          ),
        )}
      </div>
    </section>
  );
}
