"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Bell, Sparkles, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

function AnnouncementDetailModal({ announcement, onClose }: { announcement: Announcement | null; onClose: () => void }) {
  if (!announcement) return null;

  return (
    <Dialog open={!!announcement} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2">
            {announcement.priority > 0 && (
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            )}
            <span>{announcement.title}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {format(new Date(announcement.publishDate), "MMMM d, yyyy 'at' h:mm a")}
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed">{announcement.content}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AnnouncementsSection({ announcements }: AnnouncementsSectionProps) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const hasAnnouncements = announcements && announcements.length > 0;

  // Check if content exceeds 3 lines (rough estimate: ~150 characters)
  const isContentLong = (content: string) => content.length > 150;

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
                  className="hover:shadow-xl hover:scale-105 transition-all duration-300 border-l-4 border-l-primary animate-slide-up flex flex-col"
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
                  <CardContent className="flex-1 flex flex-col justify-between">
                    <p className="text-sm line-clamp-3">{announcement.content}</p>
                    {isContentLong(announcement.content) && (
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setSelectedAnnouncement(announcement)}
                        className="mt-3 p-0 h-auto"
                      >
                        Read more →
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              icon={Bell}
              title="No announcements at this time"
              description="Check back soon for updates!"
            />
          )}
        </div>
      </div>

      {/* Announcement Detail Modal */}
      <AnnouncementDetailModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
      />
    </section>
  );
}
