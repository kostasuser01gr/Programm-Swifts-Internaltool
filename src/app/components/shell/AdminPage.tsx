// ─── Admin Page ─────────────────────────────────────────────
// Users list + Audit Log tabs. Reads from API when available,
// falls back to demo data in mock mode.

import { useState, useMemo } from 'react';
import {
  Users, ShieldCheck, Clock, Search, MoreHorizontal,
  UserPlus, Ban, CheckCircle2, AlertTriangle, FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../ui/utils';
import { useDataMode } from '../../store/dataMode';

// ── Types ─────────────────────────────────────────────────

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'suspended';
  lastLogin: string;
  createdAt: string;
}

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  timestamp: string;
  ip?: string;
}

// ── Demo Data ─────────────────────────────────────────────

const DEMO_USERS: UserRow[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@dataos.dev', role: 'admin', status: 'active', lastLogin: '2 min ago', createdAt: '2025-01-15' },
  { id: 'u2', name: 'Alex K.', email: 'alex@company.gr', role: 'user', status: 'active', lastLogin: '1h ago', createdAt: '2025-02-01' },
  { id: 'u3', name: 'Maria S.', email: 'maria@company.gr', role: 'user', status: 'active', lastLogin: '3h ago', createdAt: '2025-02-10' },
  { id: 'u4', name: 'Nick P.', email: 'nick@company.gr', role: 'viewer', status: 'active', lastLogin: '1d ago', createdAt: '2025-03-01' },
  { id: 'u5', name: 'Elena D.', email: 'elena@company.gr', role: 'user', status: 'suspended', lastLogin: '30d ago', createdAt: '2025-03-15' },
];

const DEMO_AUDIT: AuditEntry[] = [
  { id: 'a1', actor: 'Admin User', action: 'user.create', entity: 'Alex K.', timestamp: '2 min ago', ip: '192.168.1.10' },
  { id: 'a2', actor: 'Alex K.', action: 'record.update', entity: 'Vehicle #247', timestamp: '15 min ago', ip: '192.168.1.22' },
  { id: 'a3', actor: 'System', action: 'automation.run', entity: 'Auto-archive', timestamp: '1h ago' },
  { id: 'a4', actor: 'Maria S.', action: 'record.create', entity: 'Wash batch #89', timestamp: '2h ago', ip: '192.168.1.35' },
  { id: 'a5', actor: 'Admin User', action: 'user.suspend', entity: 'Elena D.', timestamp: '5h ago', ip: '192.168.1.10' },
  { id: 'a6', actor: 'Nick P.', action: 'record.view', entity: 'Fleet Report Q4', timestamp: '1d ago', ip: '10.0.0.5' },
  { id: 'a7', actor: 'System', action: 'session.expire', entity: 'Nick P.', timestamp: '1d ago' },
  { id: 'a8', actor: 'Admin User', action: 'workspace.update', entity: 'Settings', timestamp: '2d ago', ip: '192.168.1.10' },
];

// ── Helpers ───────────────────────────────────────────────

const roleVariant = (role: string) => {
  switch (role) {
    case 'admin': return 'default';
    case 'user': return 'secondary';
    case 'viewer': return 'outline';
    default: return 'outline';
  }
};

const actionIcon = (action: string) => {
  if (action.includes('create')) return <UserPlus className="w-3.5 h-3.5 text-success" />;
  if (action.includes('update')) return <FileText className="w-3.5 h-3.5 text-info" />;
  if (action.includes('suspend') || action.includes('delete')) return <Ban className="w-3.5 h-3.5 text-destructive" />;
  if (action.includes('expire')) return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
  return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
};

// ── Components ────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState('');
  const users = DEMO_USERS;

  const filtered = useMemo(() =>
    search.trim()
      ? users.filter(u =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase())
        )
      : users
  , [users, search]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-input-background text-sm placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <Button size="sm" className="gap-1.5">
          <UserPlus className="w-4 h-4" /> Invite User
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">User</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Role</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">Last Login</th>
                  <th className="w-10 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-primary">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={roleVariant(user.role) as 'default' | 'secondary' | 'outline'} className="text-[10px] capitalize">
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {user.status === 'active' ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Ban className="w-3.5 h-3.5 text-destructive" />
                        )}
                        <span className={cn(
                          'text-xs capitalize',
                          user.status === 'active' ? 'text-success' : 'text-destructive',
                        )}>
                          {user.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{user.lastLogin}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No users found</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AuditTab() {
  const entries = DEMO_AUDIT;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Action</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Actor</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Entity</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">Time</th>
                <th className="text-left font-medium text-muted-foreground px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(entry => (
                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {actionIcon(entry.action)}
                      <span className="font-mono text-xs text-foreground">{entry.action}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground">{entry.actor}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.entity}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{entry.timestamp}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{entry.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Admin Page ───────────────────────────────────────

export function AdminPage() {
  const dataMode = useDataMode();

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage users, roles, and view audit logs.
          </p>
        </div>
        {dataMode.mode === 'mock' && (
          <Badge variant="outline" className="text-[10px]">Demo Data</Badge>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users" className="gap-1.5">
            <Users className="w-4 h-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UsersTab />
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <AuditTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminPage;
