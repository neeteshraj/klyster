"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export function LocalTerminal() {
  const termRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const terminalRef = useRef<any>(null);
  const fitAddonRef = useRef<any>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("connecting");
  const [shellInfo, setShellInfo] = useState("");

  const connect = useCallback(async () => {
    if (!termRef.current) return;

    setStatus("connecting");

    const { Terminal } = await import("@xterm/xterm");
    const { FitAddon } = await import("@xterm/addon-fit");

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
      scrollback: 10000,
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

    // Small delay to ensure DOM is ready before fitting
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Build WebSocket URL
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const params = new URLSearchParams({
      cols: String(term.cols),
      rows: String(term.rows),
    });

    const wsUrl = `${protocol}//${window.location.host}/ws/terminal?${params}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "connected":
            setStatus("connected");
            setShellInfo(msg.data);
            break;
          case "stdout":
            term.write(msg.data);
            break;
          case "stderr":
            term.write(msg.data);
            break;
          case "error":
            setStatus("error");
            term.write(`\r\n\x1b[1;31m${msg.data}\x1b[0m\r\n`);
            break;
          case "exit":
            setStatus("disconnected");
            term.write(`\r\n\x1b[1;33m${msg.data}\x1b[0m\r\n`);
            break;
        }
      } catch {
        term.write(event.data);
      }
    };

    ws.onerror = () => {
      setStatus("error");
      term.write("\r\n\x1b[1;31mConnection error\x1b[0m\r\n");
    };

    ws.onclose = () => {
      setStatus((prev) => (prev === "error" ? "error" : "disconnected"));
    };

    // stdin
    term.onData((data: string) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "stdin", data }));
      }
    });

    // resize
    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    };

    window.addEventListener("resize", handleResize);

    // Also observe the container for size changes (e.g. sidebar collapse)
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols: term.cols, rows: term.rows }));
      }
    });
    if (termRef.current) {
      resizeObserver.observe(termRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
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
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1117] border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full ${
            status === "connected" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" :
            status === "connecting" ? "bg-amber-500 animate-pulse" :
            status === "error" ? "bg-red-500" :
            "bg-white/20"
          }`} />
          <span className="text-[12px] font-medium text-white/60">System Terminal</span>
          {shellInfo && (
            <span className="text-[11px] font-mono text-white/25 hidden sm:inline">
              {shellInfo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(status === "disconnected" || status === "error") && (
            <button
              onClick={handleReconnect}
              className="text-[11px] text-primary hover:text-primary/80 font-medium transition-colors px-2 py-0.5 rounded bg-primary/10 hover:bg-primary/15"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Terminal */}
      <div
        ref={termRef}
        className="flex-1 bg-[#0d1117] overflow-hidden"
        style={{ padding: "4px 4px 0 4px" }}
      />
    </div>
  );
}
