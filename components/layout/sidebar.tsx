"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Layers,
  Boxes,
  LayoutGrid,
  Server,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Lock,
  FileText,
  Network,
  Globe,
  List,
  Radio,
  Settings,
  Factory,
  ArrowLeftRight,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/use-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useContexts, useSetContext } from "@/hooks/use-contexts";
import { ContextSelector } from "@/components/layout/context-selector";
import { KubeconfigDialog } from "@/components/layout/kubeconfig-dialog";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const topNav: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/namespaces", label: "Applications", icon: Layers },
  { href: "/nodes", label: "Nodes", icon: Server },
];

const workloadItems: NavItem[] = [
  { href: "#", label: "Overview", icon: LayoutDashboard },
  { href: "/workloads/pods", label: "Pods", icon: Boxes },
  { href: "/workloads/deployments", label: "Deployments", icon: LayoutGrid },
  { href: "#", label: "Daemon Sets", icon: Boxes },
  { href: "#", label: "Stateful Sets", icon: Boxes },
  { href: "#", label: "Replica Sets", icon: Boxes },
  { href: "#", label: "Replication Controllers", icon: Boxes },
  { href: "#", label: "Jobs", icon: Boxes },
  { href: "#", label: "Cron Jobs", icon: Boxes },
];

const configItems: NavItem[] = [
  { href: "/config/configmaps", label: "Config Maps", icon: FileText },
  { href: "/config/secrets", label: "Secrets", icon: Lock },
  { href: "#", label: "Resource Quotas", icon: Settings },
  { href: "#", label: "Limit Ranges", icon: Settings },
  { href: "#", label: "Horizontal Pod Autoscalers", icon: Settings },
  { href: "#", label: "Pod Disruption Budgets", icon: Settings },
  { href: "#", label: "Priority Classes", icon: Settings },
  { href: "#", label: "Runtime Classes", icon: Settings },
  { href: "#", label: "Leases", icon: Settings },
  { href: "#", label: "Mutating Webhook Configurations", icon: Settings },
  { href: "#", label: "Validating Webhook Configurations", icon: Settings },
];

const networkItems: NavItem[] = [
  { href: "/network/services", label: "Services", icon: Network },
  { href: "#", label: "Endpoints", icon: Network },
  { href: "/network/ingresses", label: "Ingresses", icon: Globe },
  { href: "/network/ingress-classes", label: "Ingress Classes", icon: List },
  { href: "#", label: "Network Policies", icon: Network },
  { href: "/tools/port-forward", label: "Port Forwarding", icon: Radio },
];

const navGroups: NavGroup[] = [
  { id: "workloads", label: "Workloads", icon: Factory, items: workloadItems },
  { id: "config", label: "Config", icon: Settings, items: configItems },
  { id: "network", label: "Network", icon: ArrowLeftRight, items: networkItems },
];

function isPathInGroup(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => item.href !== "#" && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: contextData, isLoading: contextLoading, error: contextError } = useContexts();
  const setContextMutation = useSetContext();
  const selectedCluster = useStore((s) => s.selectedCluster);
  const setSelectedCluster = useStore((s) => s.setSelectedCluster);
  const currentContext = (contextData?.currentContext ?? selectedCluster) || "default";
  const contexts = contextData?.contexts ?? [];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    workloads: true,
    config: true,
    network: true,
  });

  useEffect(() => {
    navGroups.forEach((g) => {
      if (isPathInGroup(pathname, g.items)) {
        setOpenGroups((prev) => (prev[g.id] ? prev : { ...prev, [g.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
      pathname === href || (href !== "/" && href !== "#" && pathname.startsWith(href))
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border/80 bg-card transition-[width] duration-200 overflow-hidden shrink-0",
        collapsed ? "w-14" : "w-56"
      )}
    >
      <div className="flex h-16 items-center justify-start border-b border-border/80 px-3 shrink-0 gap-2 min-w-0">
        <Link href="/" className="flex items-center gap-2 rounded-md hover:bg-muted/80 transition-colors p-1 min-w-0 flex-1" title="Klyster">
          <Image
            src="/logo.png"
            alt=""
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="font-semibold text-primary text-lg tracking-tight truncate font-sans">
              Klyster
            </span>
          )}
        </Link>
      </div>

      {/* Cluster context - expandable at top */}
      {!collapsed && (
        <div className="px-2 pt-2 border-b border-border/60 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 w-full rounded-md px-2 py-2 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-w-0"
              >
                <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                <Circle className="h-2 w-2 shrink-0 fill-green-500 text-green-500" />
                <span className="truncate font-mono text-xs">
                  {contextLoading ? "Loading…" : contextError ? "Error" : currentContext}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]" side="right">
              <DropdownMenuLabel className="text-muted-foreground font-normal text-xs">
                Switch context
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {contexts.length === 0 ? (
                <DropdownMenuItem disabled>No contexts found</DropdownMenuItem>
              ) : (
                contexts.map((ctx) => (
                  <DropdownMenuItem
                    key={ctx.name}
                    onClick={() => {
                      setSelectedCluster(ctx.name);
                      setContextMutation.mutate(ctx.name);
                    }}
                    disabled={setContextMutation.isPending}
                    className={cn(
                      "flex flex-col items-start gap-0.5 font-mono text-xs",
                      ctx.name === currentContext && "bg-primary/10 text-primary"
                    )}
                  >
                    <span>{ctx.name}</span>
                    {(ctx.cluster || ctx.user) && (
                      <span className="text-[10px] font-sans normal-case text-muted-foreground">
                        {[ctx.cluster, ctx.user].filter(Boolean).join(" → ")}
                      </span>
                    )}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <nav className="flex-1 space-y-0.5 p-2 min-h-0 overflow-y-auto">
        {/* Top-level: Overview, Applications, Nodes */}
        {topNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <span className={linkClass(item.href)}>
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </span>
            </Link>
          );
        })}

        {/* Collapsible groups */}
        {!collapsed &&
          navGroups.map((group) => {
            const GroupIcon = group.icon;
            const isOpen = openGroups[group.id] ?? true;
            const isActiveGroup = isPathInGroup(pathname, group.items);
            return (
              <div key={group.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium transition-colors min-w-0",
                    isActiveGroup
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <ChevronRight
                    className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-90")}
                  />
                  <GroupIcon className="h-5 w-5 shrink-0" />
                  <span className="truncate">{group.label}</span>
                </button>
                {isOpen && (
                  <ul className="ml-4 mt-0.5 space-y-0.5 border-l border-border/60 pl-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isPlaceholder = item.href === "#";
                      return (
                        <li key={item.label}>
                          {isPlaceholder ? (
                            <span
                              className={cn(
                                "flex items-center gap-3 rounded-md px-2 py-1.5 text-xs text-muted-foreground/80 cursor-not-allowed"
                              )}
                            >
                              <ItemIcon className="h-4 w-4 shrink-0 opacity-50" />
                              <span className="truncate">{item.label}</span>
                            </span>
                          ) : (
                            <Link href={item.href}>
                              <span className={cn(linkClass(item.href), "py-1.5 px-2 text-xs")}>
                                <ItemIcon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </span>
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}

        {/* When collapsed: show group icons only, link to first real item */}
        {collapsed &&
          navGroups.map((group) => {
            const GroupIcon = group.icon;
            const firstLink = group.items.find((i) => i.href !== "#");
            return (
              <Link
                key={group.id}
                href={firstLink?.href ?? "#"}
                className={cn(
                  "flex items-center justify-center rounded-md p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground",
                  firstLink && pathname.startsWith(firstLink.href) && "bg-primary/10 text-primary"
                )}
                title={group.label}
              >
                <GroupIcon className="h-5 w-5 shrink-0" />
              </Link>
            );
          })}
      </nav>

      <div className="border-t border-border/80 space-y-2 p-2 shrink-0 min-w-0">
        {!collapsed && user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 min-w-0 px-2">
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate text-xs min-w-0">{user.email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!collapsed && (
          <div className="space-y-2 min-w-0">
            <KubeconfigDialog />
            <ContextSelector />
          </div>
        )}
        <div className="flex justify-center w-full">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}
