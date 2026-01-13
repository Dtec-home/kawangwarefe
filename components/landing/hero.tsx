"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Heart, Calendar, ArrowRight } from "lucide-react";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-[700px] flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/30">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-teal-400/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-emerald-400/20 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-teal-300/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-emerald-300/15 rounded-full blur-2xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />

      <div className="container mx-auto px-4 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Left Column - Text Content */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Main Heading */}
            <div className="space-y-4 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  Seventh-Day
                </span>
                <br />
                <span className="bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Adventist Church
                </span>
              </h1>

              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div className="h-1 w-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
                  Kawangware
                </h2>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-2xl animate-slide-up" style={{ animationDelay: '400ms' }}>
              A community of faith, hope, and love. Join us as we worship together and grow in Christ.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '600ms' }}>
              <Button
                size="lg"
                className="text-lg px-8 py-6 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
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
                className="text-lg px-8 py-6 border-2 border-teal-600 text-teal-700 hover:bg-teal-50 transition-all duration-300"
                asChild
              >
                <Link href="#events">
                  <Calendar className="w-5 h-5 mr-2" />
                  View Events
                </Link>
              </Button>
            </div>

            {/* Service Times Card */}
            <div className="animate-slide-up" style={{ animationDelay: '800ms' }}>
              <div className="bg-white/80 backdrop-blur-sm border-2 border-teal-100 rounded-2xl p-6 shadow-xl">
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-2 font-medium">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Join us for worship
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                      S
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Sabbath Service</div>
                      <div className="text-gray-600">Saturday 9:00 AM - 12:00 PM</div>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                        W
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold">Midweek Vespers</div>
                        <div className="text-gray-600">Wed 5:00 PM</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                        F
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold">Friday Vespers</div>
                        <div className="text-gray-600">Fri 5:00 PM</div>
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
