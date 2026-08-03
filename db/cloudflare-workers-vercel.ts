// Vercel does not expose Cloudflare D1 bindings. This module is only used by
// the Vercel build alias; the existing Cloudflare deployment still receives its
// real `cloudflare:workers` binding.
export const env: { DB?: unknown } = {};
