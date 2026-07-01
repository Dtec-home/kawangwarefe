import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about SDA Church Kawangware — our mission, our community, and the leaders who shepherd and serve our church family in Nairobi.",
  openGraph: {
    title: "About Us | SDA Church Kawangware",
    description:
      "Our mission, our community, and the leadership of Seventh-Day Adventist Church Kawangware, Nairobi.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
