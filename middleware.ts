import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from "@/lib/server/adminSession";

const LOGIN_PATH = "/login";

const PUBLIC_PAGES = ["/login", "/forgot-password", "/reset-password"] as const;
const PUBLIC_APIS = [
  "/api/admin/login",
  "/api/admin/logout",
  "/api/admin/forgot-password",
  "/api/admin/reset-password",
] as const;

function isPublicPath(pathname: string): boolean {
  for (const page of PUBLIC_PAGES) {
    if (pathname === page || pathname.startsWith(`${page}/`)) return true;
  }
  for (const api of PUBLIC_APIS) {
    if (pathname === api) return true;
  }
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff2?)$/i)
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
    const ok = await verifyAdminSessionToken(token);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const authed = await verifyAdminSessionToken(token);
  const isAuthPage = PUBLIC_PAGES.some(
    (page) => pathname === page || pathname.startsWith(`${page}/`),
  );

  if (isAuthPage) {
    if (authed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL(LOGIN_PATH, request.url);
    login.searchParams.set("from", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
