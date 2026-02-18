import { ArrowRightLeft, Plus } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Transforms" };

export default function TransformsPage() {
  return (
    <>
      <PageHeader title="Transforms" description="Define data transformation pipelines">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Pipeline
        </Button>
      </PageHeader>
      <EmptyState
        icon={ArrowRightLeft}
        title="No transforms configured"
        description="Create transformation pipelines to clean, merge, or reshape your data."
      >
        <Button variant="outline">Create your first pipeline</Button>
      </EmptyState>
    </>
  );
}
