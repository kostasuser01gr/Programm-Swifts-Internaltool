import { Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Exports" };

export default function ExportsPage() {
  return (
    <>
      <PageHeader title="Exports" description="Export and download processed data">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Export
        </Button>
      </PageHeader>
      <EmptyState
        icon={Download}
        title="No exports yet"
        description="Export your transformed data as Excel, CSV, or JSON files."
      >
        <Button variant="outline">Create an export</Button>
      </EmptyState>
    </>
  );
}
