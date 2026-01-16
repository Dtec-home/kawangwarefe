import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";
import { ApolloWrapper } from "@/lib/graphql/apollo-client";
import { AuthProvider } from "@/lib/auth/auth-context";
import { StructuredData } from "@/components/seo/structured-data";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://sdakawangwangware.site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SDA Church Kawangware | Seventh-Day Adventist Church Nairobi",
    template: "%s | SDA Church Kawangware",
  },
  description:
    "Join Seventh-Day Adventist Church Kawangware for Sabbath worship services, Bible study, devotionals, community events, and online giving. Located in Kawangware, Nairobi, Kenya.",
  keywords: [
    "SDA Church Kawangware",
    "Seventh-Day Adventist Church",
    "SDA Church Nairobi",
    "Kawangware church",
    "Adventist church Kenya",
    "Sabbath worship Nairobi",
    "Christian church Kawangware",
    "Bible study Nairobi",
    "online giving church Kenya",
    "church events Kawangware",
    "devotionals",
    "Adventist community",
  ],
  authors: [{ name: "SDA Church Kawangware" }],
  creator: "SDA Church Kawangware",
  publisher: "Seventh-Day Adventist Church Kawangware",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_KE",
    url: siteUrl,
    siteName: "SDA Church Kawangware",
    title: "Seventh-Day Adventist Church Kawangware",
    description:
      "Join us for Sabbath worship services, Bible study, devotionals, community events, and online giving at SDA Church Kawangware, Nairobi.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SDA Church Kawangware - Seventh-Day Adventist Church Nairobi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SDA Church Kawangware | Seventh-Day Adventist Church Nairobi",
    description:
      "Join us for Sabbath worship services, Bible study, devotionals, and community events at SDA Church Kawangware.",
    images: ["/og-image.jpg"],
  },
  alternates: {
    canonical: siteUrl,
  },
  category: "religion",
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ApolloWrapper>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 4000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </ApolloWrapper>
        <Analytics />
      </body>
    </html>
  );
}
