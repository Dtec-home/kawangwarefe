"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  registrationLink?: string;
  featuredImageUrl?: string;
}

interface EventsSectionProps {
  events: Event[];
}

export function EventsSection({ events }: EventsSectionProps) {
  const hasEvents = events && events.length > 0;

  return (
    <section id="events" className="py-16 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Upcoming Events
              </h2>
            </div>
            <p className="text-muted-foreground">Join us for these upcoming events and activities</p>
          </div>

          {/* Events Grid or Empty State */}
          {hasEvents ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => (
                <Card
                  key={event.id}
                  className="overflow-hidden hover:shadow-xl hover:scale-105 transition-all duration-300 group animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {event.featuredImageUrl && (
                    <div
                      className="h-48 bg-cover bg-center group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundImage: `url(${event.featuredImageUrl})` }}
                    />
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-2">{event.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{event.eventTime}</span>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>

                    {event.registrationLink && (
                      <Button variant="outline" size="sm" className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                        <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                          Register <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <CalendarDays className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">No upcoming events scheduled</p>
              <p className="text-sm text-muted-foreground mt-2">Check back soon for exciting church activities!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
