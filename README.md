# Klystr – Kubernetes Dashboard

A production-ready, web-based Kubernetes dashboard (similar to Lens) built with Next.js. All Kubernetes API communication is done server-side; the browser never talks to the cluster directly.

## Tech Stack

- **Next.js 14** (App Router, TypeScript)
- **TailwindCSS** + **shadcn/ui**
- **@kubernetes/client-node** (server-side only)
- **React Query** (TanStack Query)
- **Zustand** (global state)
- **SSE** for real-time log streaming
- **Monaco Editor** (read-only YAML viewer)

## Project Structure

```
/app              → UI (pages, layout)
/app/api          → Backend API routes (K8s proxy)
/lib              → Kubernetes client (k8s.ts), types, utils
/components       → UI components (shadcn + custom)
/store            → Zustand store
/hooks            → React Query & custom hooks
middleware.ts     → Auth placeholder (RBAC-ready)
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `KUBECONFIG` | Path to kubeconfig file. If unset, uses `~/.kube/config`. |
| `KUBERNETES_SERVICE_HOST` | When set (e.g. in-cluster), uses in-cluster ServiceAccount config. |

No Kubernetes API is exposed to the browser; all cluster access is via Next.js API routes.

## Running Locally

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure cluster access**

   - Ensure `~/.kube/config` exists and points to your cluster, or set `KUBECONFIG` to your config path.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

4. **Build for production**

   ```bash
   npm run build
   npm start
   ```

## Deploying Inside Kubernetes

1. **RBAC**

   Create a ServiceAccount and bind it to a Role/ClusterRole with the permissions your dashboard needs (e.g. list/get pods, namespaces, deployments, logs, delete pods, patch deployments). Do not use cluster-admin unless required.

   Example (minimal for this app):

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: klystr
     namespace: klystr
   ---
   apiVersion: rbac.authorization.k8s.io/v1
   kind: Role
   metadata:
     name: klystr
     namespace: klystr
   rules:
     - apiGroups: [""]
       resources: ["pods", "pods/log", "namespaces", "nodes"]
       verbs: ["get", "list", "watch", "delete"]
     - apiGroups: ["apps"]
       resources: ["deployments", "deployments/scale"]
       verbs: ["get", "list", "patch", "update"]
   ---
   apiVersion: rbac.authorization.k8s.io/v1
   kind: RoleBinding
   metadata:
     name: klystr
     namespace: klystr
   roleRef:
     apiGroup: rbac.authorization.k8s.io
     kind: Role
     name: klystr
   subjects:
     - kind: ServiceAccount
       name: klystr
       namespace: klystr
   ```

   To see resources in other namespaces, use a ClusterRole + ClusterRoleBinding or multiple RoleBindings.

2. **Deploy the app**

   - Build a Docker image from the Dockerfile (see below).
   - Run the container in a pod that uses the ServiceAccount above.
   - Set env so the app uses in-cluster config: the client will automatically use `KUBERNETES_SERVICE_HOST` / `KUBERNETES_SERVICE_PORT` and the mounted ServiceAccount token.

3. **Example Dockerfile**

   ```dockerfile
   FROM node:20-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM node:20-alpine AS runner
   WORKDIR /app
   ENV NODE_ENV=production
   COPY --from=builder /app/next.config.js ./
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static .next/static
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

   For standalone output, set in `next.config.js`:

   ```js
   module.exports = { output: "standalone" };
   ```

4. **Ingress / TLS**

   Put the app behind an Ingress with TLS and, if needed, an auth layer (e.g. OAuth2 Proxy, Dex). The included middleware is an auth placeholder; add your own session/JWT/OIDC checks and RBAC before production.

## Features (MVP)

- **Cluster overview** – context, namespaces/pods/nodes counts
- **Namespaces** – list with status and age
- **Pods** – list (filter by namespace), status, restarts, age, node
- **Pod detail** – metadata, real-time logs (SSE), read-only YAML (Monaco), delete pod
- **Deployments** – list, scale (replicas)
- **State** – Zustand (selected namespace, UI prefs), React Query (resources, refetch 5–10s)
- **Security** – middleware placeholder, RBAC-ready structure

## API Routes

| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/namespaces` | List namespaces |
| GET | `/api/pods?namespace=` | List pods (namespace or `_all`) |
| GET | `/api/pod/[name]?namespace=` | Pod detail + YAML |
| DELETE | `/api/pod/[name]?namespace=` | Delete pod |
| POST | `/api/deployment/scale` | Scale deployment (body: namespace, name, replicas) |
| GET | `/api/logs?namespace=&pod=&container=&tail=` | Pod logs (snapshot) |
| GET | `/api/logs/stream?namespace=&pod=&container=` | SSE stream of pod logs |
| GET | `/api/overview` | Cluster overview |
| GET | `/api/deployments?namespace=` | List deployments |

## License

MIT
