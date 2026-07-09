import { NextResponse, type NextRequest } from "next/server";
import {
  canRoleAccessPath,
  getDefaultRouteForRole,
  isPublicPath,
  normalizeRole,
} from "@/lib/auth-contract";

const TOKEN_COOKIE = "token";
const ROLE_COOKIE = "user_role";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = normalizeRole(request.cookies.get(ROLE_COOKIE)?.value);

  if (!token || !role) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!canRoleAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultRouteForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
