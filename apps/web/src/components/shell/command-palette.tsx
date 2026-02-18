"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Database,
  ArrowRightLeft,
  Download,
  Settings,
  Activity,
  HelpCircle,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTheme } from "next-themes";

interface RouteCommand {
  label: string;
  href: string;
  icon: LucideIcon;
}

const ROUTES: RouteCommand[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Data Sources", href: "/sources", icon: Database },
  { label: "Import Files", href: "/sources/import", icon: Database },
  { label: "Transforms", href: "/transforms", icon: ArrowRightLeft },
  { label: "Exports", href: "/exports", icon: Download },
  { label: "API Status", href: "/status", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Help", href: "/help", icon: HelpCircle },
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { setTheme } = useTheme();

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {ROUTES.map((route) => (
            <CommandItem key={route.href} onSelect={() => navigate(route.href)}>
              <route.icon className="mr-2 h-4 w-4" />
              {route.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => { setTheme("light"); onOpenChange(false); }}>
            <Sun className="mr-2 h-4 w-4" />
            Light Mode
          </CommandItem>
          <CommandItem onSelect={() => { setTheme("dark"); onOpenChange(false); }}>
            <Moon className="mr-2 h-4 w-4" />
            Dark Mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
