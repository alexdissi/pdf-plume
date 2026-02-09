export const DEFAULT_SITE_URL = "https://plume.dissi.fr";

export function getSiteUrl(): URL {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const raw = env && env.length > 0 ? env : DEFAULT_SITE_URL;

  // Ensure we always have a valid absolute URL.
  return new URL(raw);
}
