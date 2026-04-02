import http from "node:http";
import https from "node:https";

import { ShopPageClient } from "@/components/shop-page-client";
import type { Product } from "@/lib/types";

async function loadInitialProducts() {
  const backendUrl = process.env.BACKEND_PROXY_URL ?? "https://localhost:4000";
  const targetUrl = new URL("/products", backendUrl);
  const transport = targetUrl.protocol === "https:" ? https : http;

  return new Promise<Product[]>((resolve) => {
    const request = transport.request(
      targetUrl,
      {
        method: "GET",
        rejectUnauthorized: false,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        response.on("end", () => {
          try {
            const payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            resolve(Array.isArray(payload) ? (payload as Product[]) : []);
          } catch {
            resolve([]);
          }
        });
      },
    );

    request.on("error", () => resolve([]));
    request.end();
  });
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const queryParam = resolvedSearchParams.q;
  const initialQuery = Array.isArray(queryParam) ? (queryParam[0] ?? "") : (queryParam ?? "");
  const initialProducts = await loadInitialProducts();

  return <ShopPageClient initialQuery={initialQuery} initialProducts={initialProducts} />;
}
