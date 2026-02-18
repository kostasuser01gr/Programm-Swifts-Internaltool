"use client";

import * as React from "react";
import { Activity, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface HealthData {
  ok: boolean;
  version: string;
  timestamp: string;
  environment?: string;
}

type CheckState =
  | { status: "loading" }
  | { status: "ok"; data: HealthData; latencyMs: number }
  | { status: "error"; message: string };

export default function StatusPage() {
  const [state, setState] = React.useState<CheckState>({ status: "loading" });
  const [lastChecked, setLastChecked] = React.useState<Date | null>(null);

  const check = React.useCallback(async () => {
    setState({ status: "loading" });
    if (!API_URL) {
      setState({ status: "error", message: "NEXT_PUBLIC_API_URL is not configured" });
      return;
    }
    const start = performance.now();
    try {
      const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
      const latencyMs = Math.round(performance.now() - start);
      if (!res.ok) {
        setState({ status: "error", message: `HTTP ${res.status} – ${res.statusText}` });
        return;
      }
      const data: HealthData = await res.json();
      setState({ status: "ok", data, latencyMs });
    } catch (err) {
      setState({ status: "error", message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setLastChecked(new Date());
    }
  }, []);

  React.useEffect(() => {
    check();
  }, [check]);

  return (
    <>
      <PageHeader title="API Status" description="Health check for the backend API">
        <Button variant="outline" size="sm" onClick={check} disabled={state.status === "loading"}>
          <RefreshCw className={cn("mr-2 h-4 w-4", state.status === "loading" && "animate-spin")} />
          Refresh
        </Button>
      </PageHeader>

      <div className="rounded-xl border bg-card p-6 max-w-xl space-y-4">
        {/* Status banner */}
        <div className="flex items-center gap-3">
          {state.status === "loading" && (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
              <span className="text-sm font-medium">Checking API...</span>
            </>
          )}
          {state.status === "ok" && (
            <>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              <span className="text-sm font-medium">All systems operational</span>
              <Badge variant="outline" className="ml-auto text-green-600 border-green-300 bg-green-50">
                Healthy
              </Badge>
            </>
          )}
          {state.status === "error" && (
            <>
              <XCircle className="h-6 w-6 text-red-500" />
              <span className="text-sm font-medium">API unreachable</span>
              <Badge variant="destructive" className="ml-auto">
                Down
              </Badge>
            </>
          )}
        </div>

        {/* Detail rows */}
        <div className="divide-y text-sm">
          <Row label="Endpoint" value={API_URL || "(not set)"} />
          {state.status === "ok" && (
            <>
              <Row label="Version" value={state.data.version} />
              <Row label="Environment" value={state.data.environment ?? "—"} />
              <Row label="Latency" value={`${state.latencyMs} ms`} />
              <Row label="Timestamp" value={state.data.timestamp} />
            </>
          )}
          {state.status === "error" && <Row label="Error" value={state.message} />}
          {lastChecked && (
            <Row label="Last checked" value={lastChecked.toLocaleTimeString()} />
          )}
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-right">{value}</span>
    </div>
  );
}
