import type { HelpArticle } from "../../types";

export const FUNDRAISING_RECORDER_TAG_CAMPAIGN_ARTICLE: HelpArticle = {
  slug: "fundraising-recorder-tag-campaign",
  title: "Putting a desk gift towards a campaign",
  category: "Fundraising",
  roles: ["recorder"],
  relatedRoute: "/record",
  body: `When someone gives cash or an envelope for a fundraising campaign, such as the building fund, tag the line with the campaign so it counts towards the campaign's target.

**1. Record the gift as usual**
On Record giving (/record), look up the giver, then add a line for the department the campaign belongs to (for example Building) with the amount.

**2. Choose the campaign**
If that department has an active campaign, a "Fundraising campaign (optional)" box appears under the lines, with one row per eligible line ("Line 1 · Building"). Pick the campaign for that line. Leave it on "No campaign" for an ordinary gift.
- Only campaigns of the line's own department are offered, so each campaign appears only on lines for its department.
- If you change the line's department, its campaign is cleared.
- Paused, closed and unapproved campaigns are not listed.

**3. Review & save**
The gift is recorded in the department as normal, tagged with the campaign. The giver's SMS receipt adds "Towards: <campaign>" and a note that contributors are listed by name and amount in the church WhatsApp group.

**Giving through a champion?**
Champion codes can't be entered at the desk yet. Tag the campaign as above; the gift counts for the campaign, but not for the champion.

**Tagged the wrong campaign?**
You can't edit an entry. Ask for it to be voided and record it again (see "Reprinting, resending and requesting a void").

Admins see the same "Fundraising campaign" box on Admin → Manual entry.`,
};
