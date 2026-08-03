/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import { createSecurityHeaders } from "../lib/security-headers";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

function isDevelopmentRequest(url: URL): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1" ||
    url.hostname === "::1"
  );
}

function withSecurityHeaders(
  response: Response,
  requestUrl: URL,
): Response {
  const headers = new Headers(response.headers);
  const securityHeaders = createSecurityHeaders({
    isDevelopment: isDevelopmentRequest(requestUrl),
    isHttps: requestUrl.protocol === "https:",
  });

  headers.delete("Strict-Transport-Security");
  for (const { key, value } of securityHeaders) {
    headers.set(key, value);
  }

  if (response.status === 101) {
    /*
     * A WebSocket upgrade response cannot be reconstructed with the standard
     * Response constructor. Its headers are mutable because the app created it.
     */
    response.headers.delete("Strict-Transport-Security");
    for (const { key, value } of securityHeaders) {
      response.headers.set(key, value);
    }
    return response;
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    let response: Response;

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    } else {
      response = await handler.fetch(request, env, ctx);
    }

    return withSecurityHeaders(response, url);
  },
};

export default worker;
