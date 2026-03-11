import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribution Confirmation",
  description: "View your contribution confirmation and receipt details.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
