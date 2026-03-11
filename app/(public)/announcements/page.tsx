"use client";

import { useQuery } from "@apollo/client/react";
import { GET_ALL_ANNOUNCEMENTS } from "@/lib/graphql/public-content-queries";
import { Navigation } from "@/components/landing/navigation";
import { AnnouncementsSection } from "@/components/landing/announcements-section";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AnnouncementsData {
  announcements: any[];
}

export default function AnnouncementsPage() {
  const { loading, data } = useQuery<AnnouncementsData>(GET_ALL_ANNOUNCEMENTS);

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
          <AnnouncementsSection announcements={data?.announcements || []} />
        )}
      </main>
    </div>
  );
}
