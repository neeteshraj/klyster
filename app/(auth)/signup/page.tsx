"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { hashPassword } from "@/lib/auth-client";
import { addUser, getUserByEmail } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const existing = await getUserByEmail(email);
      if (existing) {
        setError("An account with this email already exists.");
        return;
      }
      const passwordHash = await hashPassword(password);
      const user = await addUser({
        email: email.toLowerCase().trim(),
        name: name.trim() || email.split("@")[0],
        passwordHash,
      });
      setUser({ id: user.id, email: user.email, name: user.name });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12 lg:order-2">
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
              <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
              <CardDescription>Get started with Klyster</CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="h-11"
                  />
                </div>
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
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Confirm password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="h-11"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <Button type="submit" className="w-full h-11" disabled={loading}>
                  {loading ? "Creating account…" : "Sign up"}
                </Button>
              </form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-primary/15 via-background to-primary/10 p-12 lg:order-1">
        <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
            alt="Kubernetes"
            className="relative w-full h-full max-w-[420px] max-h-[420px] object-contain opacity-90"
          />
        </div>
        <p className="mt-8 text-center text-muted-foreground text-sm max-w-xs">
          One account. All your clusters. Secured locally in your browser.
        </p>
      </div>
    </div>
  );
}
