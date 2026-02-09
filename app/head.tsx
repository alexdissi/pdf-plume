import { softwareAppJsonLd, websiteJsonLd } from "@/lib/structured-data";

export default function Head() {
  const jsonLd = [websiteJsonLd(), softwareAppJsonLd()];

  return (
    <>
      <meta name="robots" content="index,follow" />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD should be inlined in a script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
