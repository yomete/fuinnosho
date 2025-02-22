import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { createClient } from "@/lib/supabase/server";

export async function middleware(request: NextRequest) {
  const res = await updateSession(request);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes
  const protectedRoutes = ["/films", "/profile"];

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Auth routes (login/register)
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ];
  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
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
    "/films/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/update-password",
  ],
};
