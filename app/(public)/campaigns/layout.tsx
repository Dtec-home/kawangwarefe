/**
 * Campaigns layout — shared campaign links (the public campaign page, the
 * champion page and the campaign list) render without the site navigation,
 * bottom-nav bar or footer so visitors see a clean, focused experience.
 *
 * The `<HideGlobalFooter>` component sets a data attribute on `<body>` that
 * a CSS rule in globals.css uses to hide the root-layout footer.
 */

import { HideGlobalFooter } from "@/components/layouts/hide-global-footer";

export default function CampaignsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HideGlobalFooter />
      {children}
    </>
  );
}
