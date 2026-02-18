import { Database, ArrowRightLeft, Download, Activity } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your data operations"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Data Sources" value={0} icon={Database} />
        <StatCard label="Transforms" value={0} icon={ArrowRightLeft} />
        <StatCard label="Exports" value={0} icon={Download} />
        <StatCard label="API Health" value="OK" icon={Activity} />
      </div>
      <div className="mt-8 rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No recent activity to display. Import data sources to get started.
        </p>
      </div>
    </>
  );
}
