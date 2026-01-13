"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface Announcement {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  priority: number;
}

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export function AnnouncementsSection({ announcements }: AnnouncementsSectionProps) {
  const hasAnnouncements = announcements && announcements.length > 0;

  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Bell className="w-6 h-6 text-primary animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Announcements
              </h2>
            </div>
            <p className="text-muted-foreground">Stay updated with the latest news from our church</p>
          </div>

          {/* Announcements Grid or Empty State */}
          {hasAnnouncements ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {announcements.map((announcement, index) => (
                <Card
                  key={announcement.id}
                  className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-primary animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-start gap-2">
                      {announcement.priority > 0 && (
                        <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      )}
                      <span>{announcement.title}</span>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(announcement.publishDate), "MMMM d, yyyy")}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No announcements at this time</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for updates!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
