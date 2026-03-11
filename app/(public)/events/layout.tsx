import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Events",
  description:
    "View upcoming events and activities at SDA Church Kawangware. Sabbath services, prayer meetings, youth programs, community outreach, and special church events in Nairobi.",
  openGraph: {
    title: "Church Events | SDA Church Kawangware",
    description:
      "Upcoming events and activities at Seventh-Day Adventist Church Kawangware, Nairobi.",
  },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
