export const STRIPE_API_VERSION = "2026-02-25.clover";
const STRIPE_REQUEST_TIMEOUT_MS = 12_000;

type StripeErrorPayload = {
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

export class StripeApiError extends Error {
  readonly code: string | null;
  readonly requestId: string | null;
  readonly status: number;

  constructor(input: {
    code?: string;
    message: string;
    requestId?: string | null;
    status: number;
  }) {
    super(input.message);
    this.name = "StripeApiError";
    this.code = input.code ?? null;
    this.requestId = input.requestId ?? null;
    this.status = input.status;
  }
}

export function getStripeSecretKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value && value.startsWith("sk_") ? value : null;
}

export function getStripeWebhookSecret(): string | null {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value && value.startsWith("whsec_") ? value : null;
}

export async function stripePost<T>(
  path: string,
  params: URLSearchParams,
  options: {
    idempotencyKey?: string;
    secretKey?: string;
  } = {},
): Promise<T> {
  const secretKey = options.secretKey ?? getStripeSecretKey();
  if (!secretKey) {
    throw new StripeApiError({
      message: "Stripe n’est pas configuré.",
      status: 503,
    });
  }

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Stripe-Version": STRIPE_API_VERSION,
  });
  if (options.idempotencyKey) {
    headers.set("Idempotency-Key", options.idempotencyKey);
  }

  return stripeFetch<T>(path, {
    body: params,
    headers,
    method: "POST",
  });
}

export async function stripeGet<T>(
  path: string,
  params?: URLSearchParams,
): Promise<T> {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    throw new StripeApiError({
      message: "Stripe n’est pas configuré.",
      status: 503,
    });
  }

  const query = params?.size ? `?${params.toString()}` : "";
  return stripeFetch<T>(`${path}${query}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Stripe-Version": STRIPE_API_VERSION,
    },
    method: "GET",
  });
}

async function stripeFetch<T>(
  path: string,
  init: RequestInit,
): Promise<T> {
  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    STRIPE_REQUEST_TIMEOUT_MS,
  );
  let response: Response;
  let rawBody: string;

  try {
    response = await fetch(`https://api.stripe.com${path}`, {
      ...init,
      signal: abortController.signal,
    });
    rawBody = await response.text();
  } catch {
    if (abortController.signal.aborted) {
      throw new StripeApiError({
        code: "api_connection_timeout",
        message: "Stripe n’a pas répondu dans le délai imparti.",
        status: 504,
      });
    }

    throw new StripeApiError({
      code: "api_connection_error",
      message: "Stripe est momentanément inaccessible.",
      status: 502,
    });
  } finally {
    clearTimeout(timeoutId);
  }

  let payload: T & StripeErrorPayload;

  try {
    payload = JSON.parse(rawBody) as T & StripeErrorPayload;
  } catch {
    throw new StripeApiError({
      message: "Stripe a renvoyé une réponse illisible.",
      requestId: response.headers.get("request-id"),
      status: response.status || 502,
    });
  }

  if (!response.ok) {
    throw new StripeApiError({
      code: payload.error?.code,
      message: payload.error?.message ?? "La requête Stripe a échoué.",
      requestId: response.headers.get("request-id"),
      status: response.status,
    });
  }

  return payload;
}
