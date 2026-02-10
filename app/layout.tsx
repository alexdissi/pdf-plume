import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSiteUrl } from "@/lib/site";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Plume — edit PDFs in your browser",
    template: "%s — Plume",
  },
  description:
    "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Plume — edit PDFs in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    siteName: "Plume",
    images: [
      {
        url: "/brand/og.png",
        width: 1200,
        height: 630,
        alt: "Plume",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plume — edit PDFs in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    images: ["/brand/og.png"],
  },
  icons: {
    icon: [
      { url: "/icons/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
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
