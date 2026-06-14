"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, CalendarDays, HeartHandshake } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface EventRef {
  id: string;
  name: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  eventTime: string;
  location: string;
  registrationLink?: string;
  featuredImageUrl?: string;
  isPayable?: boolean;
  suggestedAmount?: string | number | null;
  category?: EventRef | null;
  purpose?: EventRef | null;
}

/** Build the deep-link into the existing /contribute flow for a payable event. */
function buildGiveHref(event: Event): string {
  const params = new URLSearchParams();
  if (event.category?.id) params.set("categoryId", event.category.id);
  if (event.purpose?.id) params.set("purposeId", event.purpose.id);
  if (event.suggestedAmount != null && `${event.suggestedAmount}` !== "") {
    params.set("amount", `${event.suggestedAmount}`);
  }
  params.set("eventId", event.id);
  return `/contribute?${params.toString()}`;
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

                    {(event.isPayable || event.registrationLink) && (
                      <div className="space-y-2 mt-4">
                        {event.isPayable && event.category?.id && (
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-teal-600 via-emerald-600 to-blue-600 hover:from-teal-700 hover:via-emerald-700 hover:to-blue-700 text-white"
                            asChild
                          >
                            <Link href={buildGiveHref(event)}>
                              <HeartHandshake className="w-4 h-4 mr-2" />
                              Give to this event
                              {event.suggestedAmount != null && `${event.suggestedAmount}` !== "" && (
                                <span className="ml-1 font-semibold">
                                  (KES {Number(event.suggestedAmount).toLocaleString("en-KE")})
                                </span>
                              )}
                            </Link>
                          </Button>
                        )}
                        {event.registrationLink && (
                          <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors" asChild>
                            <a href={event.registrationLink} target="_blank" rel="noopener noreferrer">
                              Register <ExternalLink className="w-4 h-4 ml-2" />
                            </a>
                          </Button>
                        )}
                      </div>
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
