import { NextResponse, type NextRequest } from "next/server";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function proxy(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isHttps = request.nextUrl.protocol === "https:" || forwardedProto === "https";

  if (process.env.NODE_ENV !== "production" || isHttps || isLocalHost(request.nextUrl.hostname)) {
    return NextResponse.next();
  }

  const secureUrl = request.nextUrl.clone();
  secureUrl.protocol = "https:";

  return NextResponse.redirect(secureUrl, 308);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
