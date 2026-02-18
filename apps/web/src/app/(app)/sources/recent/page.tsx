import { Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = { title: "Recent Files" };

export default function RecentPage() {
  return (
    <>
      <PageHeader title="Recent Files" description="Files you've recently opened or imported" />
      <EmptyState
        icon={Clock}
        title="No recent files"
        description="Files you open or import will appear here for quick access."
      />
    </>
  );
}
