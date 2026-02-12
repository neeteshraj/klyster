"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { hashPassword } from "@/lib/auth-client";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await getUserByEmail(email);
      if (!user) {
        setError("No account found with this email.");
        return;
      }
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) {
        setError("Invalid password.");
        return;
      }
      setUser({ id: user.id, email: user.email, name: user.name });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="space-y-3 px-0">
              <Image
                src="/logo.png"
                alt="Klyster"
                width={48}
                height={48}
                className="h-12 w-12 object-contain"
              />
              <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
              <CardDescription>Sign in to your Klyster account</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="h-11"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-primary font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary/20 via-background to-primary/5 p-12">
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
            alt="Kubernetes"
            className="relative w-full h-full max-w-[420px] max-h-[420px] object-contain opacity-90"
          />
        </div>
        <p className="mt-8 text-center text-muted-foreground text-sm max-w-xs">
          Kubernetes dashboard. Manage clusters, pods, and workloads from one place.
        </p>
      </div>
    </div>
  );
}
