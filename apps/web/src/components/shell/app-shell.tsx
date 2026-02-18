"use client";

import * as React from "react";
import { AppSidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/top-bar";
import { CommandPalette } from "@/components/shell/command-palette";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  // ⌘K / Ctrl+K handler
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />
      <TopBar
        onCommandPalette={() => setCommandOpen(true)}
        sidebarCollapsed={sidebarCollapsed}
      />
      <main
        className={cn(
          "min-h-[calc(100vh-3.5rem)] transition-all duration-300 ease-in-out pt-14",
          sidebarCollapsed ? "ml-16" : "ml-60"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
