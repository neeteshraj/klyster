import { create } from "zustand";
import { persist } from "zustand/middleware";

export type KubeconfigSource = "default" | "file" | "paste";

export interface UIState {
  selectedNamespace: string;
  selectedCluster: string;
  sidebarCollapsed: boolean;
  /** When set, sent as X-Kubeconfig (base64) to API. Use default server config when null. */
  customKubeconfig: string | null;
  kubeconfigSource: KubeconfigSource;
  setSelectedNamespace: (ns: string) => void;
  setSelectedCluster: (cluster: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCustomKubeconfig: (config: string | null, source: KubeconfigSource) => void;
}

export const useStore = create<UIState>()(
  persist(
    (set) => ({
      selectedNamespace: "default",
      selectedCluster: "",
      sidebarCollapsed: false,
      customKubeconfig: null,
      kubeconfigSource: "default",
      setSelectedNamespace: (selectedNamespace) => set({ selectedNamespace }),
      setSelectedCluster: (selectedCluster) => set({ selectedCluster }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setCustomKubeconfig: (customKubeconfig, kubeconfigSource) =>
        set({ customKubeconfig, kubeconfigSource }),
    }),
    { name: "klyster-ui" }
  )
);
