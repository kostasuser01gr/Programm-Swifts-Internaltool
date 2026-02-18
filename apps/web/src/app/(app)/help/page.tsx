import { HelpCircle, BookOpen, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Help" };

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help" description="Get started and find answers" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6 space-y-2">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-semibold">Documentation</h3>
          <p className="text-sm text-muted-foreground">
            Read the full developer guide and API reference.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-2">
          <HelpCircle className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-semibold">FAQ</h3>
          <p className="text-sm text-muted-foreground">
            Common questions about data imports, transforms, and exports.
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6 space-y-2">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
          <h3 className="font-semibold">Support</h3>
          <p className="text-sm text-muted-foreground">
            Open an issue on GitHub for bugs or feature requests.
          </p>
        </div>
      </div>
    </>
  );
}
