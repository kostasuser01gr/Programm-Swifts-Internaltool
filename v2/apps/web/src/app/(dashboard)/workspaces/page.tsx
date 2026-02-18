'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  member_role: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await api.listWorkspaces();
    if (res.ok && res.data) setWorkspaces(res.data as unknown as Workspace[]);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await api.createWorkspace({ name });
    if (res.ok) {
      setOpen(false);
      setName('');
      await load();
    }
    setCreating(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Workspaces</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="ws-name">Name</Label>
                <Input
                  id="ws-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My workspace"
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : workspaces.map((ws) => (
              <Link key={ws.id} href={`/workspaces/${ws.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{ws.name}</CardTitle>
                    <CardDescription>
                      {ws.description ?? `Role: ${ws.member_role}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
        {!loading && workspaces.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            No workspaces yet. Create your first one.
          </p>
        )}
      </div>
    </div>
  );
}
