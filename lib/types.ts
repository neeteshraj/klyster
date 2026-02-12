/**
 * Shared types for Kubernetes resources (API responses and UI).
 * These mirror common K8s resource shapes; full types come from @kubernetes/client-node on the server.
 */

export interface NamespaceItem {
  name: string;
  status: string;
  age: string;
}

export interface PodItem {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  age: string;
  node?: string;
  ready?: string;
  /** CPU usage from metrics (e.g. "100m", "0.5") or "N/A" */
  cpu?: string;
  /** Memory usage from metrics (e.g. "150Mi") or "N/A" */
  memory?: string;
  /** e.g. "ReplicaSet/name", "DaemonSet/name", "Job/name" */
  controlledBy?: string;
  /** QoS class: Guaranteed, Burstable, BestEffort */
  qos?: string;
  /** Whether all containers are ready (for status icon) */
  containersReady?: boolean;
}

export interface PodDetail {
  name: string;
  namespace: string;
  status: string;
  restarts: number;
  age: string;
  node?: string;
  ip?: string;
  yaml?: string;
  containers: string[];
}

export interface DeploymentScalePayload {
  namespace: string;
  name: string;
  replicas: number;
}

export interface ClusterOverview {
  namespacesCount: number;
  podsCount: number;
  context: string;
  nodesCount?: number;
  /** Aggregated resource utilization (from nodes + metrics). */
  resourceUtilization?: {
    cpu: { usage: number; capacity: number; allocatable: number };
    memory: { usageBytes: number; capacityBytes: number; allocatableBytes: number };
    podsCount: number;
    podsAllocatable: number;
    podsCapacity: number;
  };
}

export interface NodeResource {
  cpu: string;
  memory: string;
}

export interface NodeUsage {
  cpu: string;
  memory: string;
}

export interface NodeItem {
  name: string;
  status: string;
  age: string;
  cpuCapacity: string;
  cpuAllocatable: string;
  memoryCapacity: string;
  memoryAllocatable: string;
  cpuUsage?: string;
  memoryUsage?: string;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
}

export interface NodeDetail {
  name: string;
  status: string;
  age: string;
  capacity: NodeResource;
  allocatable: NodeResource;
  usage?: NodeUsage;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  addresses?: Array<{ type: string; address: string }>;
  nodeInfo?: {
    osImage?: string;
    kernelVersion?: string;
    containerRuntimeVersion?: string;
    kubeletVersion?: string;
    architecture?: string;
    operatingSystem?: string;
  };
  conditions?: Array<{ type: string; status: string; message?: string }>;
  yaml?: string;
}

export interface SecretItem {
  name: string;
  namespace: string;
  type?: string;
  keys: string[];
  age: string;
}

export interface ConfigMapItem {
  name: string;
  namespace: string;
  keys: string[];
  age: string;
}

export interface ServiceItem {
  name: string;
  namespace: string;
  type: string;
  clusterIP: string;
  ports: string;
  age: string;
}

export interface IngressItem {
  name: string;
  namespace: string;
  class?: string;
  hosts: string;
  age: string;
}

export interface IngressClassItem {
  name: string;
  controller: string;
  age: string;
}
