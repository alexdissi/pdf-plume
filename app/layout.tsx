import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { getSiteUrl } from "@/lib/site";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "PDF Plume — PDF editor in your browser",
    template: "%s — PDF Plume",
  },
  description:
    "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "PDF Plume — PDF editor in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    siteName: "PDF Plume",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Plume — PDF editor in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
