/**
 * Kubernetes client setup - server-side only.
 * All K8s API communication happens via Next.js API routes; never expose this to the browser.
 */

import * as k8s from "@kubernetes/client-node";
import path from "path";
import os from "os";

let kubeConfig: k8s.KubeConfig | null = null;
let coreV1Api: k8s.CoreV1Api | null = null;
let appsV1Api: k8s.AppsV1Api | null = null;
let batchV1Api: k8s.BatchV1Api | null = null;
let autoscalingV2Api: k8s.AutoscalingV2Api | null = null;
let networkingV1Api: k8s.NetworkingV1Api | null = null;
let metricsClient: k8s.Metrics | null = null;

/**
 * Resolved kubeconfig file path. When KUBECONFIG contains multiple paths (colon-separated),
 * only the first path is used by the client.
 */
export function getKubeConfigPath(): string {
  const envPath = process.env.KUBECONFIG;
  if (envPath) {
    // KUBECONFIG can be "path1:path2:path3"; use first path
    const firstPath = envPath.split(path.delimiter)[0]?.trim() || envPath;
    return path.isAbsolute(firstPath) ? firstPath : path.resolve(process.cwd(), firstPath);
  }
  const home = os.homedir();
  return path.join(home, ".kube", "config");
}

/** All paths from KUBECONFIG (when set), or [default path]. */
export function getKubeConfigPaths(): string[] {
  const envPath = process.env.KUBECONFIG;
  if (envPath) {
    return envPath
      .split(path.delimiter)
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => (path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)));
  }
  return [path.join(os.homedir(), ".kube", "config")];
}

/**
 * Load KubeConfig from KUBECONFIG env or default location.
 * When running in-cluster (e.g. inside a pod), use in-cluster config.
 */
export function getKubeConfig(): k8s.KubeConfig {
  if (kubeConfig) {
    return kubeConfig;
  }

  const kc = new k8s.KubeConfig();

  if (process.env.KUBERNETES_SERVICE_HOST && process.env.KUBERNETES_SERVICE_PORT) {
    kc.loadFromCluster();
  } else {
    const configPath = getKubeConfigPath();
    try {
      kc.loadFromFile(configPath);
    } catch (err) {
      throw new Error(
        `Failed to load kubeconfig from ${configPath}. Set KUBECONFIG or ensure ~/.kube/config exists. ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  kubeConfig = kc;
  return kc;
}

/** Request-like with optional headers (NextRequest or { headers: Headers }). */
export type RequestWithHeaders = { headers?: Headers } | undefined;

/**
 * Get KubeConfig from request (X-Kubeconfig base64 header or kubeconfig query param) or default.
 * When custom config is present, loads from that content and does not cache.
 * Query param is used for EventSource/GET requests that cannot send custom headers.
 */
export function getKubeConfigFromRequest(request?: RequestWithHeaders & { url?: string }): k8s.KubeConfig {
  let raw = request?.headers?.get?.("x-kubeconfig");
  if (!raw?.trim() && request?.url) {
    try {
      raw = new URL(request.url).searchParams.get("kubeconfig");
    } catch {
      raw = null;
    }
  }
  if (raw?.trim()) {
    try {
      const decoded = Buffer.from(raw, "base64").toString("utf-8");
      const kc = new k8s.KubeConfig();
      kc.loadFromString(decoded);
      return kc;
    } catch (err) {
      throw new Error(
        `Invalid X-Kubeconfig: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
  return getKubeConfig();
}

function hasCustomKubeconfig(request?: RequestWithHeaders & { url?: string }): boolean {
  if (request?.headers?.get?.("x-kubeconfig")) return true;
  if (request?.url) {
    try {
      return !!new URL(request.url).searchParams.get("kubeconfig");
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Core V1 API (Pods, Namespaces, etc.).
 * Pass request to use custom kubeconfig from X-Kubeconfig header or kubeconfig query.
 */
export function getCoreV1Api(request?: RequestWithHeaders & { url?: string }): k8s.CoreV1Api {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (coreV1Api) return coreV1Api;
    coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    return coreV1Api;
  }
  return kc.makeApiClient(k8s.CoreV1Api);
}

/**
 * Apps V1 API (Deployments, etc.).
 * Pass request to use custom kubeconfig from X-Kubeconfig header or kubeconfig query.
 */
export function getAppsV1Api(request?: RequestWithHeaders & { url?: string }): k8s.AppsV1Api {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (appsV1Api) return appsV1Api;
    appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
    return appsV1Api;
  }
  return kc.makeApiClient(k8s.AppsV1Api);
}

/**
 * Batch V1 API (Jobs, CronJobs).
 */
export function getBatchV1Api(request?: RequestWithHeaders & { url?: string }): k8s.BatchV1Api {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (batchV1Api) return batchV1Api;
    batchV1Api = kc.makeApiClient(k8s.BatchV1Api);
    return batchV1Api;
  }
  return kc.makeApiClient(k8s.BatchV1Api);
}

/**
 * Autoscaling V2 API (HorizontalPodAutoscaler).
 */
export function getAutoscalingV2Api(request?: RequestWithHeaders & { url?: string }): k8s.AutoscalingV2Api {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (autoscalingV2Api) return autoscalingV2Api;
    autoscalingV2Api = kc.makeApiClient(k8s.AutoscalingV2Api);
    return autoscalingV2Api;
  }
  return kc.makeApiClient(k8s.AutoscalingV2Api);
}

/**
 * Networking V1 API (Ingress, IngressClass, NetworkPolicy, etc.).
 */
export function getNetworkingV1Api(request?: RequestWithHeaders & { url?: string }): k8s.NetworkingV1Api {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (networkingV1Api) return networkingV1Api;
    networkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);
    return networkingV1Api;
  }
  return kc.makeApiClient(k8s.NetworkingV1Api);
}

/**
 * Metrics API (metrics-server). Returns node/pod CPU and memory usage.
 * Pass request to use custom kubeconfig from X-Kubeconfig header or kubeconfig query.
 */
export function getMetrics(request?: RequestWithHeaders & { url?: string }): k8s.Metrics {
  const kc = getKubeConfigFromRequest(request);
  if (!hasCustomKubeconfig(request)) {
    if (metricsClient) return metricsClient;
    metricsClient = new k8s.Metrics(kc);
    return metricsClient;
  }
  return new k8s.Metrics(kc);
}

/**
 * Get current context name (for UI display).
 * Pass request to use custom kubeconfig from X-Kubeconfig header.
 */
export function getCurrentContext(request?: RequestWithHeaders): string {
  const kc = getKubeConfigFromRequest(request);
  return kc.getCurrentContext() || "default";
}

export interface ContextInfo {
  name: string;
  cluster?: string;
  user?: string;
}

/**
 * List all contexts from the loaded kubeconfig (and path info).
 * Pass request to use custom kubeconfig from X-Kubeconfig header.
 */
export function getContextsList(request?: RequestWithHeaders): {
  configPath: string;
  configPaths: string[];
  currentContext: string;
  contexts: ContextInfo[];
} {
  const kc = getKubeConfigFromRequest(request);
  const contexts: ContextInfo[] = (kc.getContexts() || []).map((ctx) => ({
    name: ctx.name,
    cluster: ctx.cluster,
    user: ctx.user,
  }));
  const fromHeader = hasCustomKubeconfig(request);
  return {
    configPath: fromHeader ? "(pasted or from file)" : getKubeConfigPath(),
    configPaths: fromHeader ? [] : getKubeConfigPaths(),
    currentContext: kc.getCurrentContext() || "",
    contexts,
  };
}

/**
 * Switch current context. Resets cached API clients so next request uses the new context.
 * Pass request to use custom kubeconfig from X-Kubeconfig header.
 */
export function setCurrentContext(contextName: string, request?: RequestWithHeaders): void {
  const kc = getKubeConfigFromRequest(request);
  const names = (kc.getContexts() || []).map((c) => c.name);
  if (!names.includes(contextName)) {
    throw new Error(`Unknown context: ${contextName}. Available: ${names.join(", ")}`);
  }
  kc.setCurrentContext(contextName);
  if (!hasCustomKubeconfig(request)) {
    resetK8sClients();
  }
}

/**
 * Reset cached clients (e.g. after config change). Useful for tests or config reload.
 */
export function resetK8sClients(): void {
  kubeConfig = null;
  coreV1Api = null;
  appsV1Api = null;
  batchV1Api = null;
  autoscalingV2Api = null;
  networkingV1Api = null;
  metricsClient = null;
}
