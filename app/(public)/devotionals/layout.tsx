import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Devotionals",
  description:
    "Read daily devotionals from SDA Church Kawangware. Scripture readings, spiritual reflections, and faith-building content for your daily walk with God.",
  openGraph: {
    title: "Daily Devotionals | SDA Church Kawangware",
    description:
      "Daily devotionals, scripture readings, and spiritual reflections from SDA Church Kawangware.",
  },
};

export default function DevotionalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
