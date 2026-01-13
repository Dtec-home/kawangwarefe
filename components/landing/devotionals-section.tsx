"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, BookMarked } from "lucide-react";
import { format } from "date-fns";

interface Devotional {
  id: string;
  title: string;
  content: string;
  author: string;
  scriptureReference: string;
  publishDate: string;
  isFeatured: boolean;
  featuredImageUrl?: string;
}

interface DevotionalsSectionProps {
  devotionals: Devotional[];
}

export function DevotionalsSection({ devotionals }: DevotionalsSectionProps) {
  const hasDevotionals = devotionals && devotionals.length > 0;

  if (!hasDevotionals) {
    return (
      <section id="devotionals" className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
                <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Daily Devotionals
                </h2>
              </div>
              <p className="text-muted-foreground">Grow in faith with our daily devotional readings</p>
            </div>

            {/* Empty State */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No devotionals available yet</p>
              <p className="text-sm text-muted-foreground mt-2">Stay tuned for inspiring daily readings!</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const featured = devotionals.find((d) => d.isFeatured);
  const regular = devotionals.filter((d) => !d.isFeatured).slice(0, 5);

  return (
    <section id="devotionals" className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Daily Devotionals
              </h2>
            </div>
            <p className="text-muted-foreground">Grow in faith with our daily devotional readings</p>
          </div>

          {/* Featured Devotional */}
          {featured && (
            <Card className="mb-8 overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-primary/20 animate-slide-up">
              <div className="grid md:grid-cols-2">
                {featured.featuredImageUrl && (
                  <div
                    className="h-64 md:h-auto bg-cover bg-center"
                    style={{ backgroundImage: `url(${featured.featuredImageUrl})` }}
                  />
                )}
                <div className={featured.featuredImageUrl ? "" : "md:col-span-2"}>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <BookMarked className="w-4 h-4 text-primary" />
                      <span className="text-xs text-primary font-semibold">FEATURED DEVOTIONAL</span>
                    </div>
                    <CardTitle className="text-2xl">{featured.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {featured.scriptureReference} • {featured.author}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-4 mb-4">{featured.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(featured.publishDate), "MMMM d, yyyy")}
                    </p>
                  </CardContent>
                </div>
              </div>
            </Card>
          )}

          {/* Regular Devotionals Grid */}
          {regular.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regular.map((devotional, index) => (
                <Card
                  key={devotional.id}
                  className="hover:shadow-lg hover:scale-105 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{devotional.title}</CardTitle>
                    <p className="text-sm text-primary font-medium">
                      {devotional.scriptureReference}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm line-clamp-3 mb-3">{devotional.content}</p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{devotional.author}</span>
                      <span>{format(new Date(devotional.publishDate), "MMM d")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
