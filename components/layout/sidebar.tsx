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
  LogOut,
  Lock,
  FileText,
  Network,
  Globe,
  List,
  Radio,
  Settings,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeft,
  TerminalSquare,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/use-store";
import { useAuthStore } from "@/store/use-auth-store";
import { useContexts, useSetContext } from "@/hooks/use-contexts";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const topNav: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/namespaces", label: "Applications", icon: Layers },
  { href: "/nodes", label: "Nodes", icon: Server },
  { href: "/tools/terminal", label: "Terminal", icon: TerminalSquare },
];

const navGroups: NavGroup[] = [
  {
    id: "workloads",
    label: "Workloads",
    items: [
      { href: "/workloads/pods", label: "Pods", icon: Boxes },
      { href: "/workloads/deployments", label: "Deployments", icon: LayoutGrid },
      { href: "/workloads/daemonsets", label: "Daemon Sets", icon: Boxes },
      { href: "/workloads/statefulsets", label: "Stateful Sets", icon: Boxes },
      { href: "/workloads/replicasets", label: "Replica Sets", icon: Boxes },
      { href: "/workloads/jobs", label: "Jobs", icon: Boxes },
      { href: "/workloads/cronjobs", label: "Cron Jobs", icon: Boxes },
    ],
  },
  {
    id: "config",
    label: "Config & Storage",
    items: [
      { href: "/config/configmaps", label: "Config Maps", icon: FileText },
      { href: "/config/secrets", label: "Secrets", icon: Lock },
      { href: "/config/resourcequotas", label: "Resource Quotas", icon: Settings },
      { href: "/config/hpas", label: "HPAs", icon: Settings },
      { href: "/config/limitranges", label: "Limit Ranges", icon: Settings },
    ],
  },
  {
    id: "network",
    label: "Network",
    items: [
      { href: "/network/services", label: "Services", icon: Network },
      { href: "/network/ingresses", label: "Ingresses", icon: Globe },
      { href: "/network/ingress-classes", label: "Ingress Classes", icon: List },
      { href: "/tools/port-forward", label: "Port Forwarding", icon: Radio },
    ],
  },
];

function isPathInGroup(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => item.href !== "#" && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))));
}

function NavLink({
  href,
  icon: Icon,
  label,
  active,
  disabled,
  collapsed,
  size = "default",
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  disabled?: boolean;
  collapsed: boolean;
  size?: "default" | "sm";
}) {
  const iconSize = size === "sm" ? "h-[15px] w-[15px]" : "h-[17px] w-[17px]";
  const textSize = size === "sm" ? "text-[12.5px]" : "text-[13px]";
  const py = size === "sm" ? "py-[5px]" : "py-[7px]";

  const content = (
    <span
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 font-medium transition-all duration-150 min-w-0 relative group/item",
        py,
        disabled
          ? "text-muted-foreground/20 cursor-not-allowed"
          : active
            ? "text-foreground bg-muted/70"
            : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/50"
      )}
    >
      {/* Active glow bar */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
      )}
      <Icon className={cn(iconSize, "shrink-0", active && "text-blue-400")} />
      {!collapsed && <span className={cn("truncate", textSize)}>{label}</span>}
    </span>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {disabled ? (
            <span className="flex items-center justify-center rounded-md p-2 text-muted-foreground/20 cursor-not-allowed">
              <Icon className={cn(iconSize, "shrink-0")} />
            </span>
          ) : (
            <Link href={href}>
              <span className={cn(
                "flex items-center justify-center rounded-md p-2 transition-all duration-150 relative",
                active
                  ? "text-foreground bg-muted/70"
                  : "text-muted-foreground/70 hover:text-foreground/80 hover:bg-muted/50"
              )}>
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-4 rounded-r-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                )}
                <Icon className={cn(iconSize, "shrink-0", active && "text-blue-400")} />
              </span>
            </Link>
          )}
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const isDark = theme === "dark";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggle}
            className="flex items-center justify-center w-full rounded-md p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {isDark ? "Light mode" : "Dark mode"}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-[12px] font-medium"
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      {isDark ? "Light mode" : "Dark mode"}
    </button>
  );
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

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && href !== "#" && pathname.startsWith(href));

  return (
    <aside
      className={cn(
        "flex flex-col bg-card border-r border-border transition-[width] duration-200 overflow-hidden shrink-0 relative",
        collapsed ? "w-[52px]" : "w-[230px]"
      )}
    >
      {/* ── Logo + collapse toggle ── */}
      <div className={cn("flex items-center shrink-0 border-b border-border", collapsed ? "h-[52px] justify-center" : "h-[52px] px-3.5 justify-between")}>
        <Link href="/" className="flex items-center gap-2.5 min-w-0" title="Klyster">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="font-bold text-foreground text-[15px] tracking-tight truncate">
              Klyster
            </span>
          )}
        </Link>
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/60 transition-all duration-150 shrink-0"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Context switcher ── */}
      {!collapsed && (
        <div className="px-2.5 py-2.5 border-b border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left hover:bg-muted/50 transition-colors min-w-0 group"
              >
                {/* Cluster icon with status dot */}
                <div className="relative shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/10 border border-border">
                    <Server className="h-3.5 w-3.5 text-blue-400/80" />
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-card" />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate font-mono text-[11px] text-foreground/70 font-medium">
                    {contextLoading ? "Loading…" : contextError ? "Error" : currentContext}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40">Cluster context</span>
                </div>
                <ChevronsUpDown className="h-3 w-3 shrink-0 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
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

      {/* ── Navigation ── */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
        {/* Top nav */}
        {topNav.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            active={isActive(item.href)}
            collapsed={collapsed}
          />
        ))}

        {/* Groups */}
        {navGroups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          return (
            <div key={group.id} className="pt-3 first:pt-2">
              {/* Section label */}
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex items-center justify-between w-full px-2.5 mb-1 group/section"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/30 group-hover/section:text-muted-foreground/60 transition-colors">
                    {group.label}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-muted-foreground/20 group-hover/section:text-muted-foreground/50 transition-all duration-200",
                      isOpen && "rotate-90"
                    )}
                  />
                </button>
              ) : (
                <div className="h-px bg-border mx-1 mb-1.5" />
              )}

              {/* Items */}
              {(isOpen || collapsed) && (
                <div className="space-y-0.5">
                  {group.items
                    .filter((item) => collapsed ? item.href !== "#" : true)
                    .map((item) => (
                      <NavLink
                        key={item.label}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isActive(item.href)}
                        disabled={item.href === "#"}
                        collapsed={collapsed}
                        size="sm"
                      />
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="border-t border-border p-2 shrink-0 space-y-1.5">
        {/* Kubeconfig */}
        {!collapsed && (
          <KubeconfigDialog />
        )}

        {/* Theme toggle */}
        <ThemeToggle collapsed={collapsed} />

        {/* User */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center justify-center w-full rounded-md p-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-br from-blue-500/25 to-violet-500/20 border border-border">
                        <span className="text-[11px] font-bold text-blue-300 uppercase">
                          {user.name?.charAt(0) || user.email.charAt(0)}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {user.name || user.email}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <button
                  type="button"
                  className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 hover:bg-muted/50 transition-colors min-w-0 group"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/25 to-violet-500/20 border border-border shrink-0">
                    <span className="text-[11px] font-bold text-blue-300 uppercase">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1 text-left">
                    <span className="truncate text-[12px] font-medium text-foreground/75">{user.name || "User"}</span>
                    <span className="truncate text-[10px] text-muted-foreground/40">{user.email}</span>
                  </div>
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Expand toggle (only in collapsed mode) */}
        {collapsed && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                className="flex items-center justify-center w-full rounded-md p-2 text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted/50 transition-all duration-150"
                title="Expand sidebar"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Expand sidebar
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );
}
