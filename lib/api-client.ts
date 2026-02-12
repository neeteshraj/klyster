/**
 * Central fetch that adds X-Kubeconfig header when user has provided custom config.
 * Use this in hooks so all API calls send the optional kubeconfig.
 */

export function getKubeconfigHeader(customKubeconfig: string | null): Record<string, string> {
  if (!customKubeconfig?.trim()) return {};
  try {
    const base64 = typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(customKubeconfig)))
      : Buffer.from(customKubeconfig, "utf-8").toString("base64");
    return { "X-Kubeconfig": base64 };
  } catch {
    return {};
  }
}

export function fetchWithKubeconfig(
  url: string,
  init?: RequestInit,
  customKubeconfig?: string | null
): Promise<Response> {
  const headers = new Headers(init?.headers);
  const k8sHeaders = getKubeconfigHeader(customKubeconfig ?? null);
  Object.entries(k8sHeaders).forEach(([k, v]) => headers.set(k, v));
  return fetch(url, { ...init, headers });
}
