import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getSiteUrl().toString();

  return {
    name: "Plume",
    short_name: "Plume",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    icons: [
      {
        src: `${baseUrl}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: `${baseUrl}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
