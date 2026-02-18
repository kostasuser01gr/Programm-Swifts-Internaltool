import { Upload } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Import Files" };

export default function ImportPage() {
  return (
    <>
      <PageHeader
        title="Import Files"
        description="Upload Excel, CSV, or JSON files for processing"
      />
      <div className="rounded-xl border border-dashed p-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium">Drop files here</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          or click to browse. Supports .xlsx, .csv, .json
        </p>
      </div>
    </>
  );
}
