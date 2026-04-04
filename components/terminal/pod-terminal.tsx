"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useStore } from "@/store/use-store";

interface PodTerminalProps {
  namespace: string;
  pod: string;
  container: string;
  command?: string;
}

export function PodTerminal({ namespace, pod, container, command = "/bin/sh" }: PodTerminalProps) {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const customKubeconfig = useStore((s) => s.customKubeconfig);

  const connect = useCallback(async () => {
    if (!termRef.current) return;

    setStatus("connecting");
    setErrorMsg("");

    // Dynamically import xterm (browser-only)
    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

    // Clean up previous terminal
    if (terminalRef.current) {
      terminalRef.current.dispose();
    }

    const fitAddon = new FitAddon();
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 13,
      fontFamily: "'MesloLGS Nerd Font', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
      lineHeight: 1.3,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
        black: "#0d1117",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39d2c0",
        white: "#e6edf3",
        brightBlack: "#484f58",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
    });

    term.loadAddon(fitAddon);
    term.open(termRef.current);
    fitAddon.fit();

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write("\x1b[1;34m● Connecting to pod...\x1b[0m\r\n");

    // Build WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams({
      namespace,
      pod,
      container,
      command,
    });
    if (customKubeconfig) {
      params.set("kubeconfig", customKubeconfig);
    }

    const wsUrl = `${protocol}//${window.location.host}/ws/exec?${params}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Ready, waiting for connected message from server
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "connected":
            setStatus("connected");
            term.write("\x1b[1;32m● Connected\x1b[0m\r\n\r\n");
            break;
          case "stdout":
            term.write(msg.data);
            break;
          case "stderr":
            term.write(msg.data);
            break;
          case "error":
            setStatus("error");
            setErrorMsg(msg.data);
            term.write(`\r\n\x1b[1;31m● Error: ${msg.data}\x1b[0m\r\n`);
            break;
          case "exit":
            setStatus("disconnected");
            term.write(`\r\n\x1b[1;33m● ${msg.data}\x1b[0m\r\n`);
            break;
        }
      } catch {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      setErrorMsg("WebSocket connection failed");
      term.write("\r\n\x1b[1;31m● Connection error\x1b[0m\r\n");
    };

    ws.onclose = () => {
      if (status !== "error") {
        setStatus("disconnected");
      }
      term.write("\r\n\x1b[1;33m● Disconnected\x1b[0m\r\n");
    };

    // Send user input to WebSocket
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "stdin", data }));
      }
    });

    // Handle resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: "resize",
          cols: term.cols,
          rows: term.rows,
        }));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [namespace, pod, container, command, customKubeconfig]);

  useEffect(() => {
    // Import CSS
    import("@xterm/xterm/css/xterm.css");

    const cleanup = connect();

    return () => {
      cleanup?.then((fn) => fn?.());
      wsRef.current?.close();
      terminalRef.current?.dispose();
    };
  }, [connect]);

  const handleReconnect = () => {
    wsRef.current?.close();
    connect();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0d1117] border-b border-white/[0.06] rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${
            status === "connected" ? "bg-emerald-500" :
            status === "connecting" ? "bg-amber-500 animate-pulse" :
            status === "error" ? "bg-red-500" :
            "bg-white/20"
          }`} />
          <span className="text-xs font-mono text-white/50">
            {pod}/{container || "default"}
          </span>
          {status === "connected" && (
            <span className="text-[10px] text-emerald-500/70 font-medium uppercase">live</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(status === "disconnected" || status === "error") && (
            <button
              onClick={handleReconnect}
              className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={termRef}
        className="flex-1 bg-[#0d1117] rounded-b-lg overflow-hidden p-1"
        style={{ minHeight: 300 }}
      />

      {errorMsg && (
        <div className="px-3 py-1.5 bg-destructive/10 border-t border-destructive/20 text-xs text-destructive">
          {errorMsg}
        </div>
      )}
    </div>
  );
}
