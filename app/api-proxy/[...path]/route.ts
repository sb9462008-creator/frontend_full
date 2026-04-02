import http from "node:http";
import https from "node:https";

import { type NextRequest } from "next/server";

const bodylessMethods = new Set(["GET", "HEAD"]);
const requestHeadersToSkip = new Set([
  "accept-encoding",
  "connection",
  "content-length",
  "host",
  "if-modified-since",
  "if-none-match",
  "origin",
  "referer",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
]);
const responseHeadersToSkip = new Set([
  "connection",
  "content-length",
  "transfer-encoding",
]);

function buildTargetUrl(pathSegments: string[], requestUrl: string) {
  const backendUrl = process.env.BACKEND_PROXY_URL;

  if (!backendUrl) {
    throw new Error("BACKEND_PROXY_URL is not configured");
  }

  const targetUrl = new URL(pathSegments.join("/"), `${backendUrl.replace(/\/$/, "")}/`);
  targetUrl.search = new URL(requestUrl).search;

  return targetUrl;
}

function shouldAllowSelfSignedCertificate(url: URL) {
  return url.protocol === "https:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
}

function normalizeRequestHeaders(headers?: RequestInit["headers"]): http.OutgoingHttpHeaders {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

async function proxyLocalHttpsRequest(targetUrl: URL, init: RequestInit) {
  const transport = targetUrl.protocol === "https:" ? https : http;
  const requestBody =
    typeof init.body === "string"
      ? Buffer.from(init.body)
      : init.body instanceof ArrayBuffer
        ? Buffer.from(init.body)
        : null;

  return new Promise<Response>((resolve, reject) => {
    const upstreamRequest = transport.request(
      targetUrl,
      {
        method: init.method,
        headers: normalizeRequestHeaders(init.headers),
        rejectUnauthorized: false,
      },
      (upstreamResponse) => {
        const chunks: Buffer[] = [];

        upstreamResponse.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        upstreamResponse.on("end", () => {
          const responseHeaders = new Headers();
          const statusCode = upstreamResponse.statusCode ?? 502;
          const canHaveBody =
            init.method !== "HEAD" &&
            statusCode !== 204 &&
            statusCode !== 205 &&
            statusCode !== 304;

          Object.entries(upstreamResponse.headers).forEach(([key, value]) => {
            if (value == null || responseHeadersToSkip.has(key.toLowerCase())) {
              return;
            }

            if (Array.isArray(value)) {
              responseHeaders.set(key, value.join(", "));
              return;
            }

            responseHeaders.set(key, String(value));
          });

          resolve(
            new Response(canHaveBody ? Buffer.concat(chunks) : null, {
              status: statusCode,
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    upstreamRequest.on("error", reject);

    if (requestBody) {
      upstreamRequest.write(requestBody);
    }

    upstreamRequest.end();
  });
}

function copyRequestHeaders(request: NextRequest) {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (!requestHeadersToSkip.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

function copyResponseHeaders(response: Response) {
  const headers = new Headers();

  response.headers.forEach((value, key) => {
    if (!responseHeadersToSkip.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.url);
  const headers = copyRequestHeaders(request);
  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!bodylessMethods.has(request.method)) {
    init.body = await request.arrayBuffer();
  }

  const upstreamResponse = shouldAllowSelfSignedCertificate(targetUrl)
    ? await proxyLocalHttpsRequest(targetUrl, init)
    : await fetch(targetUrl, init);

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: copyResponseHeaders(upstreamResponse),
  });
}

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function OPTIONS(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(request, context);
}
