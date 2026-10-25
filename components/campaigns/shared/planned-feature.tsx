/**
 * PlannedFeature — placeholder body for a fundraising route whose lane has
 * not landed yet (Fundraising S0 scaffolding). Each lane replaces the page
 * that renders it; delete this file once no page uses it.
 */

import { Target } from "lucide-react";
import { Empty } from "@/components/ui/empty";

export function PlannedFeature({ title, sprint }: { title: string; sprint: string }) {
  return (
    <Empty
      icon={Target}
      title={title}
      description={`This part of fundraising campaigns is planned for ${sprint}.`}
    />
  );
}
