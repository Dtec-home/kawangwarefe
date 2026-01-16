import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SDA Church Kawangware",
    short_name: "SDA Kawangware",
    description:
      "Seventh-Day Adventist Church Kawangware - Sabbath worship, devotionals, events, and online giving",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e3a5f",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
