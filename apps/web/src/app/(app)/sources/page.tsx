import { Database, Upload } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Data Sources" };

export default function SourcesPage() {
  return (
    <>
      <PageHeader title="Data Sources" description="Manage and import your data files">
        <Button asChild>
          <Link href="/sources/import">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Link>
        </Button>
      </PageHeader>
      <EmptyState
        icon={Database}
        title="No data sources yet"
        description="Import Excel, CSV, or JSON files to start processing your data."
      >
        <Button variant="outline" asChild>
          <Link href="/sources/import">Import your first file</Link>
        </Button>
      </EmptyState>
    </>
  );
}
