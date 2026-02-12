"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { Sidebar } from "@/components/layout/sidebar";

const AUTH_PATHS = ["/login", "/signup"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isAuthPath = AUTH_PATHS.some((p) => pathname?.startsWith(p));
    if (!isLoggedIn && !isAuthPath) {
      router.replace("/login");
    }
  }, [isLoggedIn, pathname, router]);

  const isAuthPath = AUTH_PATHS.some((p) => pathname?.startsWith(p));
  if (!isLoggedIn && !isAuthPath) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  if (isAuthPath) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
