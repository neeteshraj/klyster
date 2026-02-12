import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { AuthGuard } from "@/components/layout/auth-guard";

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <AuthGuard>{children}</AuthGuard>
        </Providers>
      </body>
    </html>
  );
}
