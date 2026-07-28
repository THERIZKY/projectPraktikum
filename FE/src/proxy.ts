import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = [
  "/dashboard",
  "/users",
  "/laboratories",
  "/practicums",
  "/submissions",
  "/grades",
  "/announcements",
  "/notifications",
  "/audit-log",
  "/profile",
];

const AUTH_ROUTES = ["/login"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("pms_access_token")?.value;

  const isProtectedRoute = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Root path redirection
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // 2. Protect dashboard & administrative pages
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Prevent logged-in users from accessing login page
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
