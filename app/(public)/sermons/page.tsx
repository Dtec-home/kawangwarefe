"use client";

import { useQuery } from "@apollo/client/react";
import { GET_ALL_VIDEOS } from "@/lib/graphql/public-content-queries";
import { Navigation } from "@/components/landing/navigation";
import { YouTubeSection } from "@/components/landing/youtube-section";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VideosData {
  youtubeVideos: any[];
}

export default function SermonsPage() {
  const { loading, data } = useQuery<VideosData>(GET_ALL_VIDEOS);

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <div className="container mx-auto px-4 pt-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <YouTubeSection videos={data?.youtubeVideos || []} />
        )}
      </main>
    </div>
  );
}
