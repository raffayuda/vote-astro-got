import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { AUTH_COOKIE_PREFIX } from "@/lib/auth-cookie";

// Path di sini tanpa basePath: Next menambahkan "/vote" ke matcher dan ke
// redirect yang dibangun dari request.nextUrl.
// Pengecekan optimistik (hanya keberadaan cookie sesi).
// Role diverifikasi sungguhan di setiap halaman/aksi lewat requireRole().
const GUARDS = [
  { prefix: "/admin", login: "/admin/login" },
  { prefix: "/juri", login: "/juri/login" },
  { prefix: "/api/results", login: "/admin/login" },
  { prefix: "/api/export", login: "/admin/login" },
  { prefix: "/api/qr-export", login: "/admin/login" },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guard = GUARDS.find((g) => pathname === g.prefix || pathname.startsWith(g.prefix + "/"));
  if (!guard || pathname === guard.login) return NextResponse.next();

  if (getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) return NextResponse.next();

  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = guard.login;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/juri/:path*", "/api/results", "/api/export", "/api/qr-export"],
};
