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
  applicationName: "Plume",
  title: {
    default: "Plume — PDF editor in your browser",
    template: "%s — Plume",
  },
  description:
    "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
  keywords: [
    "pdf editor",
    "edit pdf online",
    "annotate pdf",
    "highlight pdf",
    "add text to pdf",
    "draw on pdf",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    title: "Plume — PDF editor in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    siteName: "Plume",
    images: [
      {
        url: "/brand/logo-classic.png",
        width: 512,
        height: 512,
        alt: "Plume",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Plume — PDF editor in your browser",
    description:
      "Edit PDFs directly in your browser. Add text, draw, highlight, and annotate.",
    images: ["/brand/logo-classic.png"],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
