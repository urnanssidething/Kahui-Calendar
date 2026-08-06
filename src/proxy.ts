import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Fast redirect for unauthenticated requests. This is a UX optimization only —
// every protected page/action must still call requireUser() itself, since a
// matcher change here must never be the only thing standing between a page
// and an unauthenticated request.
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has("kahui_session");

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/((?!login|api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons).*)",
  ],
};
