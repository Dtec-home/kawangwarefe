"use client";

import { useQuery } from "@apollo/client/react";
import { GET_LANDING_PAGE_CONTENT } from "@/lib/graphql/content-queries";
import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { AnnouncementsSection } from "@/components/landing/announcements-section";
import { DevotionalsSection } from "@/components/landing/devotionals-section";
import { EventsSection } from "@/components/landing/events-section";
import { YouTubeSection } from "@/components/landing/youtube-section";
import { Loader2 } from "lucide-react";

interface LandingPageData {
  announcements: any[];
  devotionals: any[];
  events: any[];
  youtubeVideos: any[];
}

export default function Home() {
  const { loading, error, data } = useQuery<LandingPageData>(GET_LANDING_PAGE_CONTENT);



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    console.error("Error loading landing page content:", error);
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <AnnouncementsSection announcements={data?.announcements || []} />
        <DevotionalsSection devotionals={data?.devotionals || []} />
        <EventsSection events={data?.events || []} />
        <YouTubeSection videos={data?.youtubeVideos || []} />
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Seventh-Day Adventist Church</h3>
              <p className="text-sm text-muted-foreground">
                Kawangware - A community of faith, hope, and love. Join us as we worship together and grow in Christ.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground">About Us</a></li>
                <li><a href="#events" className="text-muted-foreground hover:text-foreground">Events</a></li>
                <li><a href="/contribute" className="text-muted-foreground hover:text-foreground">Give Online</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Kawangware, Nairobi</li>
                <li>Kenya</li>
                <li>Email: info@sdakawangware.org</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Seventh-Day Adventist Church Kawangware. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
