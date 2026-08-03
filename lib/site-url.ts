const DEFAULT_SITE_URL =
  "https://relief-visibility-fr.souhoufyou.chatgpt.site";

function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  try {
    const url = new URL(configured || DEFAULT_SITE_URL);
    url.hash = "";
    url.pathname = "/";
    url.search = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const SITE_URL = resolveSiteUrl();

export function siteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
