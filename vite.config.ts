import vinext from "vinext";
import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

const localBindingConfig = {
  main: "./worker/index.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async () => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  // Keep the existing Sites/Cloudflare path for the current deployment, while
  // emitting Nitro's Vercel output whenever Vercel runs the build.
  const isVercelBuild = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL);

  return {
    // Nitro's Vercel adapter otherwise adds PostCSS import resolution before
    // Tailwind can handle its own `@import "tailwindcss"` directive.
    css: isVercelBuild
      ? { postcss: { plugins: [tailwindcss()] } }
      : undefined,
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    resolve: isVercelBuild
      ? {
          alias: {
            // The commercial database is still hosted on Cloudflare D1. On
            // Vercel, calls that require it fail explicitly until a database
            // connection is configured, while public pages remain available.
            "cloudflare:workers": resolve("db/cloudflare-workers-vercel.ts"),
            "tailwindcss": resolve("node_modules/tailwindcss/index.css"),
          },
        }
      : undefined,
    plugins: isVercelBuild
      ? [vinext(), nitro()]
      : [
          vinext(),
          sites(),
          cloudflare({
            viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
            config: localBindingConfig,
          }),
        ],
  };
});
