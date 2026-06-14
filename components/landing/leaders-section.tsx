"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { Leader } from "@/lib/graphql/leaders";

interface LeadersSectionProps {
  leaders: Leader[];
  /** Optional override for the section heading. */
  title?: string;
  subtitle?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LeadersSection({
  leaders,
  title = "Our Leaders",
  subtitle = "Meet the team that shepherds and serves our church family",
}: LeadersSectionProps) {
  const hasLeaders = leaders && leaders.length > 0;

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {title}
              </h2>
            </div>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>

          {hasLeaders ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {leaders.map((leader, index) => (
                <Card
                  key={leader.id}
                  className="text-center hover:shadow-xl hover:scale-105 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardContent className="pt-6 flex flex-col items-center">
                    {/* Avatar: photo or initials fallback */}
                    {leader.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={leader.photoUrl}
                        alt={leader.name}
                        className="w-24 h-24 rounded-full object-cover ring-4 ring-primary/10 mb-4"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold ring-4 ring-primary/10 mb-4">
                        {getInitials(leader.name)}
                      </div>
                    )}

                    <h3 className="text-lg font-semibold">{leader.name}</h3>
                    <p className="text-sm text-primary font-medium">{leader.title}</p>

                    {leader.category?.name && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {leader.category.name}
                      </Badge>
                    )}

                    {leader.bio && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-3">
                        {leader.bio}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">
                Leadership information coming soon
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
