import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Give Online - Church Contribution Portal",
  description:
    "Make your tithes, offerings, and contributions to SDA Church Kawangware securely via M-Pesa. Support church projects, mission work, and community outreach.",
  keywords: [
    "church giving",
    "online tithe",
    "M-Pesa contribution",
    "church offering",
    "SDA donation",
    "Kawangware church giving",
  ],
  openGraph: {
    title: "Give Online | SDA Church Kawangware",
    description:
      "Make secure online contributions to SDA Church Kawangware via M-Pesa",
    type: "website",
  },
};

export default function ContributeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
