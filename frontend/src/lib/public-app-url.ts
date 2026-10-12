export function getPublicAppOrigin(
  configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL
) {
  if (!configuredUrl) throw new Error("Public app URL is not configured.");

  const url = new URL(configuredUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Public app URL must use HTTP or HTTPS.");
  }

  return url.origin;
}
