"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiStatusBadge } from "@/components/shell/api-status-badge";

interface TopBarProps {
  onCommandPalette: () => void;
  sidebarCollapsed: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/sources": "Data Sources",
  "/sources/import": "Import Files",
  "/sources/recent": "Recent Files",
  "/transforms": "Transforms",
  "/exports": "Exports",
  "/settings": "Settings",
  "/help": "Help",
  "/status": "API Status",
};

export function TopBar({ onCommandPalette, sidebarCollapsed }: TopBarProps) {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.map((_, i) => {
    const path = "/" + segments.slice(0, i + 1).join("/");
    return {
      path,
      label: ROUTE_LABELS[path] || segments[i].charAt(0).toUpperCase() + segments[i].slice(1),
    };
  });

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 transition-all",
        sidebarCollapsed ? "ml-16" : "ml-60"
      )}
    >
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm" aria-label="Breadcrumb">
        <span className="text-muted-foreground">Home</span>
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.path}>
            <span className="text-muted-foreground/50 mx-1">/</span>
            <span className={cn(i === crumbs.length - 1 ? "font-medium text-foreground" : "text-muted-foreground")}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
        {crumbs.length === 0 && (
          <>
            <span className="text-muted-foreground/50 mx-1">/</span>
            <span className="font-medium text-foreground">Dashboard</span>
          </>
        )}
      </nav>

      <div className="flex-1" />

      {/* API Status Badge */}
      <ApiStatusBadge />

      {/* Search trigger */}
      <Button variant="outline" size="sm" onClick={onCommandPalette} className="gap-2 text-muted-foreground hidden sm:flex">
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search...</span>
        <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
        <Bell className="h-4 w-4" />
      </Button>
    </header>
  );
}
