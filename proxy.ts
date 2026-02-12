import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Authentication placeholder proxy.
 * Structure is RBAC-ready: add session validation and role checks here.
 * Do NOT hardcode admin permissions; derive from identity/roles.
 */
export function proxy(request: NextRequest) {
  // Placeholder: allow all requests. Replace with real auth when ready.
  // Example: validate session cookie, JWT, or OIDC token and set headers for RBAC.
  const response = NextResponse.next();

  // Optional: set user/role headers for API routes to enforce RBAC
  // response.headers.set("x-user-id", session?.userId ?? "");
  // response.headers.set("x-user-roles", session?.roles?.join(",") ?? "");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
