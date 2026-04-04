import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AuthGuard } from "@/components/layout/auth-guard";
import { ThemeSync } from "@/components/layout/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Klyster – Kubernetes Dashboard",
  description: "Web-based Kubernetes control plane UI",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <ThemeSync />
          <AuthGuard>{children}</AuthGuard>
        </Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
