"use client";

import { useQuery } from "@apollo/client/react";
import { GET_LANDING_PAGE_CONTENT } from "@/lib/graphql/content-queries";
import { GET_LEADERS, type Leader } from "@/lib/graphql/leaders";
import { AnnouncementsSection } from "@/components/landing/announcements-section";
import { DevotionalsSection } from "@/components/landing/devotionals-section";
import { EventsSection } from "@/components/landing/events-section";
import { YouTubeSection } from "@/components/landing/youtube-section";
import { LeadersSection } from "@/components/landing/leaders-section";
import { Loader2 } from "lucide-react";

interface LandingPageData {
  announcements: any[];
  devotionals: any[];
  events: any[];
  youtubeVideos: any[];
}

interface LeadersData {
  leaders: Leader[];
}

export function HomeContent() {
  const { loading, error, data } = useQuery<LandingPageData>(GET_LANDING_PAGE_CONTENT);
  const { data: leadersData } = useQuery<LeadersData>(GET_LEADERS, {
    variables: { activeOnly: true },
  });

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error("Error loading landing page content:", error);
  }

  return (
    <>
      <AnnouncementsSection announcements={data?.announcements || []} />
      <DevotionalsSection devotionals={data?.devotionals || []} />
      <EventsSection events={data?.events || []} />
      <LeadersSection leaders={leadersData?.leaders || []} />
      <YouTubeSection videos={data?.youtubeVideos || []} />
    </>
  );
}
