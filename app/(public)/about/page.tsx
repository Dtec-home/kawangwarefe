"use client";

import { useQuery } from "@apollo/client/react";
import { GET_LEADERS, type Leader } from "@/lib/graphql/leaders";
import { Navigation } from "@/components/landing/navigation";
import { LeadersSection } from "@/components/landing/leaders-section";
import { Loader2, ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LeadersData {
  leaders: Leader[];
}

export default function AboutPage() {
  const { loading, data } = useQuery<LeadersData>(GET_LEADERS, {
    variables: { activeOnly: true },
  });

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

        {/* About blurb */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-primary" />
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  About Our Church
                </h1>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed">
                We are a Seventh-Day Adventist church family committed to worship,
                fellowship, and service. Through ministry, prayer, and community
                outreach we strive to share the love of Christ and grow together
                in faith. Whether you are visiting for the first time or have been
                part of our family for years, you are always welcome here.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <LeadersSection leaders={data?.leaders || []} />
        )}
      </main>
    </div>
  );
}
