import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/customers", "/claims", "/account"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("ciq_token")?.value;
  const role = request.cookies.get("ciq_role")?.value;
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL(role === "CUSTOMER" ? "/account" : "/dashboard", request.url));
  }

  if (role === "CUSTOMER" && (pathname.startsWith("/dashboard") || pathname === "/customers")) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
