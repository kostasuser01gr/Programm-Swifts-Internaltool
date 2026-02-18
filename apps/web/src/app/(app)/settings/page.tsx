import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Configure your workbench preferences" />
      <div className="space-y-6">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            General
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Theme, language, and display preferences are managed through the sidebar and command palette (⌘K).
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">API Connection</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The API endpoint is configured via the <code className="rounded bg-muted px-1.5 py-0.5 text-xs">NEXT_PUBLIC_API_URL</code> environment variable.
          </p>
        </div>
      </div>
    </>
  );
}
