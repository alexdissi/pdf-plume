import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = getSiteUrl().toString();

  return {
    name: "PDF Plume",
    short_name: "PDF Plume",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b0b",
    theme_color: "#0b0b0b",
    icons: [
      {
        src: `${baseUrl}/favicon.ico`,
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
