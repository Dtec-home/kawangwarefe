"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-[500px] md:min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-primary/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-primary/10 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Main Heading */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text text-transparent">
                  Seventh-Day
                </span>
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Adventist Church
                </span>
              </h1>

              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="h-1 w-12 bg-gradient-to-r from-primary to-primary/70 rounded-full" />
                <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground">
                  Kawangware
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl animate-slide-up" style={{ animationDelay: '400ms' }}>
              A community of faith, hope, and love. Join us as we worship together and grow in Christ.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '600ms' }}>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-primary/70 hover:from-primary/90 hover:to-primary/60 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                asChild
              >
                <Link href="/contribute">
                  <Heart className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Give Online
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>

              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-2 border-primary text-primary hover:bg-primary/10 transition-all duration-300"
                asChild
              >
                <Link href="/events">
                  <Calendar className="w-5 h-5 mr-2" />
                  View Events
                </Link>
              </Button>
            </div>

            {/* Service Times Card */}
            <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
              <div className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-2xl p-6 shadow-xl">
                <p className="text-sm text-muted-foreground mb-4 flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-primary" />
                  Join us for worship
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/10 to-accent/30 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold">
                      S
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">Sabbath Service</div>
                      <div className="text-muted-foreground">Saturday 9:00 AM - 12:00 PM</div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-foreground">
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        W
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold">Midweek Vespers</div>
                        <div className="text-muted-foreground">Wed 5:00 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-xs">
                        F
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold">Friday Vespers</div>
                        <div className="text-muted-foreground">Fri 5:00 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Church Community Illustration */}
          <div className="relative animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <Image
                src="/illustrations/church-community.png"
                alt="Church Community"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
