"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ArrowRightLeft,
  Download,
  Settings,
  HelpCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/shell/theme-toggle";

export interface NavItem {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  group: "main" | "secondary";
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard, group: "main" },
  { id: "sources", href: "/sources", label: "Data Sources", icon: Database, group: "main" },
  { id: "transforms", href: "/transforms", label: "Transforms", icon: ArrowRightLeft, group: "main" },
  { id: "exports", href: "/exports", label: "Exports", icon: Download, group: "main" },
  { id: "status", href: "/status", label: "API Status", icon: Activity, group: "secondary" },
  { id: "settings", href: "/settings", label: "Settings", icon: Settings, group: "secondary" },
  { id: "help", href: "/help", label: "Help", icon: HelpCircle, group: "secondary" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();
  const mainItems = NAV_ITEMS.filter((i) => i.group === "main");
  const secondaryItems = NAV_ITEMS.filter((i) => i.group === "secondary");

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Brand */}
      <div className={cn("flex h-14 items-center border-b border-border px-4 shrink-0", collapsed && "justify-center px-2")}>
        {!collapsed ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">D</span>
            </div>
            <span className="truncate text-sm font-semibold">DataOps Workbench</span>
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">D</span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3" role="navigation" aria-label="Main navigation">
        {mainItems.map((item) => (
          <SidebarLink key={item.id} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
      </nav>

      {/* Secondary Nav */}
      <div className="px-2 pb-2">
        <Separator className="mb-2" />
        {secondaryItems.map((item) => (
          <SidebarLink key={item.id} item={item} active={isActive(item.href)} collapsed={collapsed} />
        ))}
        <div className={cn("mt-2", collapsed ? "flex justify-center" : "px-2")}>
          <ThemeToggle collapsed={collapsed} />
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="border-t border-border p-2">
        <Button variant="ghost" size="sm" onClick={onToggle} className="w-full justify-center" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  const Icon = item.icon;
  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }
  return link;
}
