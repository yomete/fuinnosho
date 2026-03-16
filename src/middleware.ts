import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";
import { DEMO_MODE_COOKIE, DEMO_MODE_HEADER } from "@/lib/demo";

// Check demo mode at runtime
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Route-based demo mode: set header for current request and cookie for client
  if (pathname.startsWith("/demo")) {
    // Set request header so server components/actions detect demo mode
    request.headers.set(DEMO_MODE_HEADER, "true");
    const res = NextResponse.next({ request });
    res.cookies.set(DEMO_MODE_COOKIE, "true", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
    });
    return res;
  }

  // Clear demo cookie if present (user navigated away from demo)
  const hadDemoCookie = request.cookies.get(DEMO_MODE_COOKIE)?.value === "true";
  if (hadDemoCookie) {
    request.cookies.delete(DEMO_MODE_COOKIE);
  }

  const res = await updateSession(request);

  // Clear the cookie on the response so the browser removes it
  if (hadDemoCookie) {
    res.cookies.delete(DEMO_MODE_COOKIE);
  }

  // In global demo mode, skip all auth checks
  if (isDemoMode) {
    return res;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedRoutes = ["/profile", "/sync", "/settings"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes (login/register)
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ];
  const isAuthRoute = authRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Redirect if accessing protected route without session
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect if accessing auth routes with session
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/films", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/demo/:path*",
    "/films/:path*",
    "/profile/:path*",
    "/sync/:path*",
    "/settings/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ],
};
