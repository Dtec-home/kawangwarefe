import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Login",
  description:
    "Sign in to your SDA Church Kawangware member account to access your dashboard, contributions, and church resources.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
