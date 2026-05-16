import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { canAccessPath } from "@/lib/route-access";
import { isAppRole } from "@/lib/roles";

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  const role = request.auth?.user?.role ?? "";

  if (!isAppRole(role)) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (!canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"]
};
