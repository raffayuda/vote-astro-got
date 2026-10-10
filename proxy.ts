import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Pengecekan optimistik (hanya keberadaan cookie sesi).
// Role diverifikasi sungguhan di setiap halaman/aksi lewat requireRole().
const GUARDS = [
  { prefix: "/admin", login: "/admin/login" },
  { prefix: "/juri", login: "/juri/login" },
  { prefix: "/api/results", login: "/admin/login" },
  { prefix: "/api/export", login: "/admin/login" },
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const guard = GUARDS.find((g) => pathname === g.prefix || pathname.startsWith(g.prefix + "/"));
  if (!guard || pathname === guard.login) return NextResponse.next();

  if (getSessionCookie(request)) return NextResponse.next();

  if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
  return NextResponse.redirect(new URL(guard.login, request.url));
}

export const config = {
  matcher: ["/admin/:path*", "/juri/:path*", "/api/results", "/api/export"],
};
