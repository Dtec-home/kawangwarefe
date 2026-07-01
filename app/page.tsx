import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { HomeContent } from "@/components/landing/home-content";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <HomeContent />
      </main>

      {/* Footer */}
      <footer className="bg-muted/50 border-t py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Seventh-Day Adventist Church</h3>
              <p className="text-sm text-muted-foreground">
                Kawangware - A community of faith, hope, and love. Join us as we worship together and grow in Christ.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/announcements" className="text-muted-foreground hover:text-foreground">Announcements</a></li>
                <li><a href="/devotionals" className="text-muted-foreground hover:text-foreground">Devotionals</a></li>
                <li><a href="/events" className="text-muted-foreground hover:text-foreground">Events</a></li>
                <li><a href="/sermons" className="text-muted-foreground hover:text-foreground">Sermons</a></li>
                <li><a href="/contribute" className="text-muted-foreground hover:text-foreground">Give Online</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Kawangware, Nairobi</li>
                <li>Kenya</li>
                <li>Location: Gitanga Road, PQ72+V98.</li>
                <li>Email: sdachurchkawangware@gmail.com</li>
              </ul>
              <div className="mt-3 overflow-hidden rounded-md border">
                <iframe
                  title="Church location map"
                  src="https://www.google.com/maps?q=PQ72%2BV98&output=embed"
                  className="h-40 w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Seventh-Day Adventist Church Kawangware. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
