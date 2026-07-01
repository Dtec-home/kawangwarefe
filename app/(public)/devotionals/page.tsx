"use client";

import { useQuery } from "@apollo/client/react";
import { GET_ALL_DEVOTIONALS } from "@/lib/graphql/public-content-queries";
import { Navigation } from "@/components/landing/navigation";
import { DevotionalsSection } from "@/components/landing/devotionals-section";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DevotionalsData {
  devotionals: any[];
}

export default function DevotionalsPage() {
  const { loading, data } = useQuery<DevotionalsData>(GET_ALL_DEVOTIONALS);

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
          <DevotionalsSection devotionals={data?.devotionals || []} />
        )}
      </main>
    </div>
  );
}
