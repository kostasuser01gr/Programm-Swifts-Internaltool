"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

type Status = "loading" | "ok" | "error";

export function ApiStatusBadge() {
  const [status, setStatus] = React.useState<Status>("loading");

  const check = React.useCallback(async () => {
    if (!API_URL) {
      setStatus("error");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setStatus(data.ok ? "ok" : "error");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  React.useEffect(() => {
    check();
    const interval = setInterval(check, 30_000); // ping every 30s
    return () => clearInterval(interval);
  }, [check]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/status" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              status === "ok" && "bg-green-500",
              status === "error" && "bg-red-500",
              status === "loading" && "bg-yellow-500 animate-pulse"
            )}
          />
          <span className="hidden sm:inline">API</span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        {status === "ok" && "API is healthy"}
        {status === "error" && "API unreachable"}
        {status === "loading" && "Checking API..."}
      </TooltipContent>
    </Tooltip>
  );
}
