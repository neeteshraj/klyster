/**
 * Custom server for Klystr.
 * Wraps Next.js with WebSocket support for:
 *   /ws/exec     - Kubernetes pod exec (shell into pods)
 *   /ws/terminal - Local system terminal (PTY on the host machine)
 */

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { WebSocketServer } = require("ws");
const k8s = require("@kubernetes/client-node");
const pty = require("node-pty");
const os = require("os");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname, searchParams } = new URL(req.url, `http://${req.headers.host}`);

    if (pathname === "/ws/exec") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        handleExec(ws, searchParams);
      });
    } else if (pathname === "/ws/terminal") {
      wss.handleUpgrade(req, socket, head, (ws) => {
        handleLocalTerminal(ws, searchParams);
      });
    } else {
      if (dev) return; // Let Next.js handle HMR upgrades
      socket.destroy();
    }
  });

  server.listen(port, hostname, () => {
    console.log(`> Klyster ready on http://${hostname}:${port}`);
  });
});

// ─────────────────────────────────────────────
// Local system terminal (PTY)
// ─────────────────────────────────────────────

function handleLocalTerminal(ws, params) {
  const cwd = params.get("cwd") || os.homedir();
  const cols = parseInt(params.get("cols") || "120", 10);
  const rows = parseInt(params.get("rows") || "30", 10);

  // Detect shell
  const shell = process.env.SHELL || (os.platform() === "win32" ? "powershell.exe" : "/bin/bash");

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell, [], {
      name: "xterm-256color",
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: "xterm-256color",
        COLORTERM: "truecolor",
      },
    });
  } catch (err) {
    ws.send(JSON.stringify({ type: "error", data: `Failed to spawn shell: ${err.message}` }));
    ws.close();
    return;
  }

  ws.send(JSON.stringify({ type: "connected", data: `Shell: ${shell} | CWD: ${cwd}` }));

  // PTY stdout → WebSocket
  ptyProcess.onData((data) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "stdout", data }));
    }
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "exit", data: `Process exited (code: ${exitCode}, signal: ${signal})` }));
      ws.close();
    }
  });

  // WebSocket → PTY stdin
  ws.on("message", (msg) => {
    try {
      const parsed = JSON.parse(msg.toString());
      if (parsed.type === "stdin") {
        ptyProcess.write(parsed.data);
      } else if (parsed.type === "resize" && parsed.cols && parsed.rows) {
        ptyProcess.resize(parsed.cols, parsed.rows);
      }
    } catch {
      // Raw text fallback
      ptyProcess.write(msg.toString());
    }
  });

  ws.on("close", () => {
    ptyProcess.kill();
  });

  ws.on("error", () => {
    ptyProcess.kill();
  });
}

// ─────────────────────────────────────────────
// Kubernetes pod exec
// ─────────────────────────────────────────────

async function handleExec(ws, params) {
  const namespace = params.get("namespace") || "default";
  const pod = params.get("pod");
  const container = params.get("container") || "";
  const customKubeconfig = params.get("kubeconfig") || "";
  const command = params.get("command") || "/bin/sh";

  if (!pod) {
    ws.send(JSON.stringify({ type: "error", data: "Missing pod name" }));
    ws.close();
    return;
  }

  try {
    const kc = new k8s.KubeConfig();
    if (customKubeconfig) {
      const decoded = Buffer.from(customKubeconfig, "base64").toString("utf-8");
      kc.loadFromString(decoded);
    } else if (process.env.KUBERNETES_SERVICE_HOST) {
      kc.loadFromCluster();
    } else {
      kc.loadFromDefault();
    }

    const exec = new k8s.Exec(kc);

    const stdoutStream = new require("stream").PassThrough();
    const stderrStream = new require("stream").PassThrough();

    stdoutStream.on("data", (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "stdout", data: chunk.toString() }));
      }
    });

    stderrStream.on("data", (chunk) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({ type: "stderr", data: chunk.toString() }));
      }
    });

    const stdinStream = new require("stream").PassThrough();

    ws.on("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === "stdin") {
          stdinStream.write(parsed.data);
        }
      } catch {
        stdinStream.write(msg);
      }
    });

    ws.send(JSON.stringify({ type: "connected", data: `Connecting to ${pod}/${container || "default"}...` }));

    const shellCmd = command.split(" ");

    const execConn = await exec.exec(
      namespace,
      pod,
      container,
      shellCmd,
      stdoutStream,
      stderrStream,
      stdinStream,
      true,
    );

    ws.on("close", () => {
      stdinStream.end();
      if (execConn && typeof execConn.close === "function") {
        execConn.close();
      }
    });

    if (execConn && execConn.on) {
      execConn.on("close", () => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "exit", data: "Session ended" }));
          ws.close();
        }
      });

      execConn.on("error", (err) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: "error", data: err.message }));
        }
      });
    }
  } catch (err) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: "error", data: err.message || "Exec failed" }));
      ws.close();
    }
  }
}
