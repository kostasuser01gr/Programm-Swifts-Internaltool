'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Table2, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api-client';

interface WorkspaceDetail {
  id: string;
  name: string;
  description: string | null;
  member_role: string;
  bases: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
}

interface TableSummary {
  id: string;
  name: string;
  description: string | null;
  position: number;
}

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const wsRes = await api.getWorkspace(params.workspaceId);
      if (wsRes.ok && wsRes.data) {
        const wsData = wsRes.data as unknown as WorkspaceDetail;
        setWorkspace(wsData);

        // Load tables for first base
        const firstBase = wsData.bases[0];
        if (firstBase) {
          const tbRes = await api.listTables(firstBase.id);
          if (tbRes.ok && tbRes.data) setTables(tbRes.data);
        }
      }
      setLoading(false);
    }
    load();
  }, [params.workspaceId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return <p className="text-muted-foreground">Workspace not found.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Link href="/workspaces">
          <Button variant="ghost" size="icon" aria-label="Back to workspaces">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{workspace.name}</h1>
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {workspace.member_role}
        </span>
      </div>

      <h2 className="mt-6 text-lg font-semibold">Tables</h2>

      <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tables.map((t) => (
          <Link key={t.id} href={`/tables/${t.id}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t.name}
                </CardTitle>
                {t.description && <CardDescription>{t.description}</CardDescription>}
              </CardHeader>
            </Card>
          </Link>
        ))}
        {tables.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            No tables yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
