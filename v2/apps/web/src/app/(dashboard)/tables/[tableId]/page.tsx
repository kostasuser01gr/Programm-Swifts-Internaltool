'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';

interface Field {
  id: string;
  name: string;
  type: string;
  is_primary: number;
}

interface DataRecord {
  id: string;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface TableDetail {
  id: string;
  name: string;
  member_role: string;
  fields: Field[];
  records: DataRecord[];
}

export default function TableDetailPage() {
  const params = useParams<{ tableId: string }>();
  const [table, setTable] = useState<TableDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  const canWrite = table?.member_role === 'owner' || table?.member_role === 'editor';

  const load = useCallback(async () => {
    setLoading(true);
    const res = await api.getTable(params.tableId);
    if (res.ok && res.data) setTable(res.data);
    setLoading(false);
  }, [params.tableId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await api.createRecord(params.tableId, formData);
    if (res.ok) {
      setNewOpen(false);
      setFormData({});
      await load();
    }
    setCreating(false);
  }

  async function handleDelete(recordId: string) {
    await api.deleteRecord(params.tableId, recordId);
    await load();
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!table) {
    return <p className="text-muted-foreground">Table not found.</p>;
  }

  const fields = table.fields;
  const nonPrimaryFields = fields.filter((f) => !f.is_primary);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/workspaces">
            <Button variant="ghost" size="icon" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{table.name}</h1>
          <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {table.member_role}
          </span>
        </div>
        {canWrite && (
          <Dialog open={newOpen} onOpenChange={setNewOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                {nonPrimaryFields.map((f) => (
                  <div key={f.id} className="space-y-1">
                    <Label htmlFor={f.id}>{f.name}</Label>
                    <Input
                      id={f.id}
                      value={formData[f.name] ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, [f.name]: e.target.value }))
                      }
                    />
                  </div>
                ))}
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? 'Saving…' : 'Save'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Records grid */}
      <div className="mt-6 overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {fields.map((f) => (
                <th key={f.id} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                  {f.name}
                </th>
              ))}
              {canWrite && <th className="w-10" />}
            </tr>
          </thead>
          <tbody className="divide-y">
            {table.records.map((rec) => (
              <tr key={rec.id} className="hover:bg-muted/30 transition-colors">
                {fields.map((f) => (
                  <td key={f.id} className="whitespace-nowrap px-4 py-3">
                    {f.is_primary
                      ? rec.id.slice(0, 12)
                      : String(rec.data[f.name] ?? '')}
                  </td>
                ))}
                {canWrite && (
                  <td className="px-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete record ${rec.id.slice(0, 8)}`}
                      onClick={() => handleDelete(rec.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
            {table.records.length === 0 && (
              <tr>
                <td colSpan={fields.length + (canWrite ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  No records yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
