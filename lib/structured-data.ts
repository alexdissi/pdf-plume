import { getSiteUrl } from "@/lib/site";

export function websiteJsonLd() {
  const siteUrl = getSiteUrl().toString();

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PDF Plume",
    url: siteUrl,
  };
}

export function softwareAppJsonLd() {
  const siteUrl = getSiteUrl().toString();

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PDF Plume",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Edit PDFs directly in your browser: add text, draw, highlight, and annotate.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
  };
}
