/**
 * Link previews (DEPARTMENT_CAMPAIGNS DC-7, D14): fetched as WhatsApp's crawler
 * does, by reading the page's HTML meta tags, then the image they point to.
 */

import type { APIRequestContext } from "@playwright/test";
import { Then, When, expect } from "../support/fixtures";
import { knownCampaign, tokenOf } from "../support/campaigns";
import type { World } from "../support/fixtures";

interface Preview {
  description: string;
  image: string;
  shareLink: string;
}

type PreviewWorld = World & { previews?: Preview[] };

function meta(html: string, property: string): string {
  const tag = html.match(new RegExp(`<meta[^>]+(?:property|name)="${property}"[^>]*>`))?.[0] ?? "";
  return (tag.match(/content="([^"]*)"/)?.[1] ?? "").replace(/&amp;/g, "&").replace(/&#x27;/g, "'");
}

async function fetchPreview(request: APIRequestContext, slug: string): Promise<Pick<Preview, "description" | "image">> {
  const response = await request.get(`/campaigns/${slug}`, { headers: { "User-Agent": "WhatsApp/2.23" } });
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  return { description: meta(html, "og:description"), image: meta(html, "og:image") };
}

async function capture(request: APIRequestContext, backend: Parameters<typeof tokenOf>[0], world: World, title: string) {
  const campaign = knownCampaign(world, title);
  const preview = await fetchPreview(request, campaign.slug);
  const result = await backend.graphql(
    `query($slug: String!) { publicCampaign(slug: $slug) { publicUrl previewVersion } }`,
    { slug: campaign.slug },
  );
  const w = world as PreviewWorld;
  w.previews = [...(w.previews ?? []), { ...preview, shareLink: result.data.publicCampaign.publicUrl }];
  expect(preview.image).toContain(`/campaigns/${campaign.slug}/og?v=${result.data.publicCampaign.previewVersion}`);
}

When("WhatsApp fetches the link preview of {string}", async ({ request, backend, world }, title: string) => {
  await capture(request, backend, world, title);
});

When("WhatsApp fetches the link preview of {string} again", async ({ request, backend, world }, title: string) => {
  await capture(request, backend, world, title);
});

function latest(world: World): Preview {
  const previews = (world as PreviewWorld).previews ?? [];
  return previews[previews.length - 1];
}

Then("the preview says {string}", async ({ world }, text: string) => {
  expect(latest(world).description).toContain(text);
});

Then("the preview image is served fresh", async ({ request, world }) => {
  // og:image is absolute on the production domain (metadataBase); fetch the same path locally.
  const image = new URL(latest(world).image);
  const response = await request.get(`${image.pathname}${image.search}`);
  expect(response.ok(), `${image.pathname}${image.search} -> ${response.status()}`).toBeTruthy();
  expect(response.headers()["content-type"]).toContain("image/png");
  expect(response.headers()["cache-control"]).toContain("no-store");
});

Then("the shared link and the preview image both carry a new version", async ({ world }) => {
  const [before, after] = ((world as PreviewWorld).previews ?? []).slice(-2);
  expect(after.shareLink).toMatch(/\?v=[0-9a-f]{8}$/);
  expect(after.shareLink).not.toBe(before.shareLink);
  expect(after.image).not.toBe(before.image);
});
