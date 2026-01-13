"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Heart, Home, BookOpen, Calendar } from "lucide-react";
import Image from "next/image";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "#devotionals", label: "Devotionals", icon: BookOpen },
    { href: "#events", label: "Events", icon: Calendar },
    { href: "/contribute", label: "Give", icon: Heart, highlight: true },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 font-bold text-lg">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="SDA Church"
                fill
                className="object-contain"
              />
            </div>
            <span className="hidden sm:inline">SDA Kawangware</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return link.highlight ? (
                <Button key={link.href} asChild>
                  <Link href={link.href}>
                    <Icon className="w-4 h-4 mr-2" />
                    {link.label}
                  </Link>
                </Button>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
