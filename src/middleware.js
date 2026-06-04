import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const PUBLIC_PATHS = ["/", "/superadmin/sign-in", "/finance/sign-in"];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function getRoleRedirect(role, slug, baseUrl) {
  if (role === "superAdmin" || role === "admin") return new URL("/admin", baseUrl);
  if (role === "employee") return new URL(`/employee/${slug}`, baseUrl);
  if (role === "accounts") return new URL(`/accounts/${slug}`, baseUrl);
  return null;
}

function checkRoleAccess(pathname, role, slug, referer, baseUrl) {
  if (pathname.startsWith("/admin") && role !== "superAdmin" && role !== "admin") {
    return NextResponse.redirect(referer ? new URL(referer) : new URL(`/employee/${slug}`, baseUrl));
  }
  if (pathname.startsWith("/employee") && role !== "employee") {
    return NextResponse.redirect(referer ? new URL(referer) : new URL("/admin", baseUrl));
  }
  if (pathname.startsWith("/accounts") && role !== "accounts") {
    return NextResponse.redirect(referer ? new URL(referer) : new URL(`/accounts/${slug}`, baseUrl));
  }
  return null;
}

export async function middleware(req) {
  const token = req.cookies.get("token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const pathname = req.nextUrl.pathname;
  const referer = req.headers.get("referer");
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  // Try access token first
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const { role, slug } = payload;

      if (isPublicPath(pathname)) {
        const redirectUrl = getRoleRedirect(role, slug, req.url);
        if (redirectUrl) return NextResponse.redirect(redirectUrl);
      }

      const roleBlock = checkRoleAccess(pathname, role, slug, referer, req.url);
      if (roleBlock) return roleBlock;

      return NextResponse.next();
    } catch {
      // Access token expired/invalid — fall through to refresh token
    }
  }

  // Try refresh token to auto-renew session
  if (refreshToken) {
    try {
      const { payload } = await jwtVerify(refreshToken, secret);
      const { id, email, role, slug } = payload;

      // Issue new access token
      const newToken = await new SignJWT({ id, email, role, slug })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1d")
        .sign(secret);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60,
        path: "/",
      };

      if (isPublicPath(pathname)) {
        const redirectUrl = getRoleRedirect(role, slug, req.url);
        if (redirectUrl) {
          const res = NextResponse.redirect(redirectUrl);
          res.cookies.set("token", newToken, cookieOptions);
          return res;
        }
      }

      const roleBlock = checkRoleAccess(pathname, role, slug, referer, req.url);
      if (roleBlock) {
        roleBlock.cookies.set("token", newToken, cookieOptions);
        return roleBlock;
      }

      const res = NextResponse.next();
      res.cookies.set("token", newToken, cookieOptions);
      return res;
    } catch {
      // Refresh token also expired — clear cookies and redirect to login
      if (!isPublicPath(pathname)) {
        const res = NextResponse.redirect(new URL("/", req.url));
        res.cookies.delete("token");
        res.cookies.delete("refresh_token");
        return res;
      }
      return NextResponse.next();
    }
  }

  // No tokens at all
  if (!isPublicPath(pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/superadmin/sign-in", "/finance/sign-in", "/admin/:path*", "/employee/:path*", "/accounts/:path*"],
};
