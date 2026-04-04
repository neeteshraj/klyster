"use client";

import dynamic from "next/dynamic";
import { Terminal } from "lucide-react";

const LocalTerminal = dynamic(
  () => import("@/components/terminal/local-terminal").then((mod) => mod.LocalTerminal),
  { ssr: false }
);

export default function TerminalPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-white/[0.06]">
          <Terminal className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-white">Terminal</h1>
          <p className="text-[11px] text-white/30">System shell on the host machine</p>
        </div>
      </div>

      {/* Terminal fills remaining space */}
      <div className="flex-1 min-h-0">
        <LocalTerminal />
      </div>
    </div>
  );
}
