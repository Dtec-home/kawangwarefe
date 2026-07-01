import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Church Announcements",
  description:
    "Stay updated with the latest announcements and news from SDA Church Kawangware. Important notices, upcoming programs, and church updates.",
  openGraph: {
    title: "Church Announcements | SDA Church Kawangware",
    description:
      "Latest announcements and news from Seventh-Day Adventist Church Kawangware.",
  },
};

export default function AnnouncementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
