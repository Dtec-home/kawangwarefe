import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sermons & Videos",
  description:
    "Watch sermons, worship services, and spiritual content from SDA Church Kawangware on YouTube. Catch up on past services and stay connected with our church.",
  openGraph: {
    title: "Sermons & Videos | SDA Church Kawangware",
    description:
      "Watch sermons and worship services from Seventh-Day Adventist Church Kawangware.",
  },
};

export default function SermonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
