export type SecurityHeader = Readonly<{
  key: string;
  value: string;
}>;

type SecurityHeadersOptions = Readonly<{
  isDevelopment: boolean;
  isHttps: boolean;
}>;

/**
 * Keep the framework and Worker security policies aligned.
 *
 * WebSocket connections are permitted only for the local development server.
 * Transport-only directives are emitted only when the response is both HTTPS
 * and production, so an HTTP preview can never cache an invalid HSTS policy.
 */
export function createSecurityHeaders({
  isDevelopment,
  isHttps,
}: SecurityHeadersOptions): SecurityHeader[] {
  const isSecureProduction = !isDevelopment && isHttps;
  const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "script-src 'self' 'unsafe-inline'",
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "form-action 'self'",
    ...(isSecureProduction ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const headers: SecurityHeader[] = [
    {
      key: "Content-Security-Policy",
      value: contentSecurityPolicy,
    },
    {
      key: "X-Content-Type-Options",
      value: "nosniff",
    },
    {
      key: "X-Frame-Options",
      value: "DENY",
    },
    {
      key: "Referrer-Policy",
      value: "strict-origin-when-cross-origin",
    },
    {
      key: "Permissions-Policy",
      value:
        'camera=(), geolocation=(), microphone=(), payment=(self "https://checkout.stripe.com"), usb=()',
    },
    {
      key: "X-XSS-Protection",
      value: "0",
    },
  ];

  if (isSecureProduction) {
    /*
     * Keep HSTS host-scoped: deliberately no includeSubDomains/preload, which
     * avoids taking control of unrelated hosts.
     */
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000",
    });
  }

  return headers;
}
