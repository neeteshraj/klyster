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
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Redirecting to sign in…</p>
        </div>
      </div>
    );
  }

  if (isAuthPath) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
