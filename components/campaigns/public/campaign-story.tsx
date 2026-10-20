/**
 * CampaignStory — the campaign's story as plain text paragraphs. Staff write
 * it as plain text; it is rendered as text (React escapes it), never as HTML.
 */

import { storyParagraphs } from "./campaign-format";

export function CampaignStory({ story }: { story: string }) {
  const paragraphs = storyParagraphs(story);
  if (paragraphs.length === 0) return null;
  return (
    <section aria-labelledby="campaign-story-heading" className="space-y-4">
      <h2 id="campaign-story-heading" className="text-xl font-semibold tracking-tight">
        About this campaign
      </h2>
      <div data-slot="campaign-story" className="max-w-prose space-y-4 text-base leading-relaxed text-foreground/90">
        {paragraphs.map((text, i) => (
          <p key={i} className="whitespace-pre-line">
            {text}
          </p>
        ))}
      </div>
    </section>
  );
}
