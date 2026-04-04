"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/use-auth-store";
import { getUserByEmail } from "@/lib/db";
import { verifyPassword } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/auth/animated-background";
import Image from "next/image";
import { Loader2, Mail, Lock, ArrowRight, Terminal, Shield, Boxes } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

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

  const features = [
    {
      icon: Terminal,
      title: "Built-in Terminal",
      desc: "Exec into pods directly from the browser",
      color: "from-blue-500 to-cyan-400",
      glow: "rgba(59,130,246,0.15)",
    },
    {
      icon: Boxes,
      title: "Multi-Cluster",
      desc: "Switch contexts across EKS, GKE, AKS, k3s",
      color: "from-emerald-500 to-teal-400",
      glow: "rgba(16,185,129,0.15)",
    },
    {
      icon: Shield,
      title: "Local-first Security",
      desc: "Zero data leaves your browser. Ever.",
      color: "from-amber-500 to-orange-400",
      glow: "rgba(245,158,11,0.15)",
    },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left - Form */}
      <div className="flex flex-col justify-center px-6 py-12 lg:px-16 xl:px-24 bg-[hsl(220,13%,6%)]">
        <div className="mx-auto w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-10">
            <div className="relative inline-flex mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl scale-150" />
              <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white/[0.06] border border-white/[0.1]">
                <Image src="/logo.png" alt="Klyster" width={28} height={28} className="h-7 w-7 object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold text-white tracking-tight">Welcome back</h1>
            <p className="mt-2 text-[15px] text-white/40">Sign in to your Klyster account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                Email
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <Mail className="h-4 w-4 text-white/30 group-focus-within:text-primary/70 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                Password
              </label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  <Lock className="h-4 w-4 text-white/30 group-focus-within:text-primary/70 transition-colors" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="flex h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/30 transition-all duration-200"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2.5">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 cursor-pointer group text-[15px]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-white/35">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual panel */}
      <div
        ref={panelRef}
        onMouseMove={handleMouseMove}
        className="hidden lg:flex relative overflow-hidden bg-[hsl(220,15%,8%)]"
      >
        {/* Animated mesh */}
        <div className="absolute inset-0">
          <AnimatedBackground />
        </div>

        {/* Mouse-tracking radial glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(500px at ${mousePos.x}px ${mousePos.y}px, rgba(59,130,246,0.08), transparent 70%)`,
          }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-emerald-500/[0.03]" />
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[hsl(220,15%,8%)] to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-[hsl(220,15%,8%)] to-transparent" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 xl:p-16">
          {/* K8s logo */}
          <div className="relative mb-10">
            <div className="absolute inset-0 rounded-full bg-primary/15 blur-[80px] scale-[2.5]" />
            <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-[60px] scale-[2] animate-pulse" />
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/3/39/Kubernetes_logo_without_workmark.svg"
              alt="Kubernetes"
              className="relative w-36 h-36 xl:w-44 xl:h-44 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Tagline */}
          <h2 className="text-2xl xl:text-3xl font-bold text-white text-center mb-2 tracking-tight">
            Your Kubernetes, in the browser
          </h2>
          <p className="text-white/35 text-center text-sm max-w-sm mb-10 leading-relaxed">
            Manage clusters, pods, and workloads from a single powerful interface
          </p>

          {/* Feature cards */}
          <div className="flex flex-col gap-4 w-full max-w-sm">
            {features.map((f, i) => (
              <div key={i} className="group relative rounded-2xl p-[1px] transition-all duration-300 hover:scale-[1.02]">
                {/* Animated gradient border */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${f.glow}, transparent 60%)`,
                  }}
                />
                <div className="absolute inset-[1px] rounded-2xl bg-[hsl(220,15%,8%)]/90" />

                {/* Card content */}
                <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-md p-5 group-hover:border-white/[0.12] group-hover:bg-white/[0.05] transition-all duration-300">
                  <div className="flex items-start gap-4">
                    {/* Icon with gradient background */}
                    <div className="relative shrink-0">
                      <div
                        className="absolute inset-0 rounded-xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300"
                        style={{ background: `linear-gradient(135deg, ${f.glow}, transparent)` }}
                      />
                      <div className={`relative flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} shadow-lg`}>
                        <f.icon className="h-5 w-5 text-white" />
                      </div>
                    </div>

                    {/* Text */}
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-white/90 group-hover:text-white transition-colors">
                        {f.title}
                      </p>
                      <p className="text-[13px] text-white/35 group-hover:text-white/50 transition-colors mt-0.5 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div className="mt-10 flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.05]">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <span className="text-xs text-white/30 font-medium">Open source</span>
            <span className="text-white/10">·</span>
            <span className="text-xs text-white/30">Self-hosted</span>
            <span className="text-white/10">·</span>
            <span className="text-xs text-white/30">No telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
