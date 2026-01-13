"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Play, Video } from "lucide-react";

interface YouTubeVideo {
  id: string;
  title: string;
  videoId: string;
  description: string;
  category: string;
  embedUrl: string;
  thumbnailUrl: string;
  watchUrl: string;
}

interface YouTubeSectionProps {
  videos: YouTubeVideo[];
}

export function YouTubeSection({ videos }: YouTubeSectionProps) {
  const hasVideos = videos && videos.length > 0;

  if (!hasVideos) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <Youtube className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Watch & Listen
                </h2>
              </div>
              <p className="text-muted-foreground">Catch up on sermons and worship services</p>
            </div>

            {/* Empty State */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No videos available yet</p>
              <p className="text-sm text-muted-foreground mt-2">Subscribe to our YouTube channel for upcoming content!</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const featured = videos[0];
  const others = videos.slice(1, 5);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Youtube className="w-6 h-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Watch & Listen
              </h2>
            </div>
            <p className="text-muted-foreground">Catch up on sermons and worship services</p>
          </div>

          {/* Featured Video */}
          {featured && (
            <div className="mb-8 animate-slide-up">
              <Card className="overflow-hidden border-2 border-primary/20 hover:shadow-2xl transition-shadow duration-300">
                <div className="aspect-video relative group">
                  <iframe
                    src={featured.embedUrl}
                    title={featured.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                      {featured.category.toUpperCase()}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{featured.title}</CardTitle>
                </CardHeader>
                {featured.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {featured.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Video Grid */}
          {others.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {others.map((video, index) => (
                <Card
                  key={video.id}
                  className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 group animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <a href={video.watchUrl} target="_blank" rel="noopener noreferrer">
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                          <Play className="w-6 h-6 text-primary-foreground ml-1" />
                        </div>
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm line-clamp-2">{video.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {video.category}
                      </p>
                    </CardHeader>
                  </a>
                </Card>
              ))}
            </div>
          )}

          {/* View More Button */}
          <div className="text-center mt-8">
            <Button variant="outline" size="lg" className="hover:bg-primary hover:text-primary-foreground transition-colors" asChild>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
                <Youtube className="w-5 h-5 mr-2" />
                View All Videos
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
