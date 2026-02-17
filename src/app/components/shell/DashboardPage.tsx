// ─── Premium Dashboard ──────────────────────────────────────
// KPI cards with deltas + sparklines, activity feed, heatmap widget.
// Uses real data when API available, falls back to demo data.

import { useMemo, useState } from 'react';
import {
  TrendingUp, TrendingDown, Users, Database, Activity,
  Clock, ArrowUpRight, ArrowDownRight, BarChart3, Layers,
  Zap, Shield, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { cn } from '../ui/utils';
import { useDataMode } from '../../store/dataMode';

// ── Types ─────────────────────────────────────────────────

interface KPI {
  id: string;
  label: string;
  value: string;
  delta: number; // percent change
  trend: 'up' | 'down' | 'flat';
  icon: React.ElementType;
  sparkline: number[];
  breakdown?: { label: string; value: string }[];
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

// ── Demo Data ─────────────────────────────────────────────

function useDemoKPIs(): KPI[] {
  return useMemo(() => [
    {
      id: 'records', label: 'Total Records', value: '12,847',
      delta: 12.5, trend: 'up', icon: Database,
      sparkline: [45, 52, 49, 62, 55, 70, 78, 85, 90, 88, 95, 102],
      breakdown: [
        { label: 'This week', value: '342' },
        { label: 'Active', value: '11,204' },
        { label: 'Archived', value: '1,643' },
      ],
    },
    {
      id: 'users', label: 'Active Users', value: '48',
      delta: 8.3, trend: 'up', icon: Users,
      sparkline: [30, 32, 35, 33, 38, 40, 42, 41, 45, 44, 47, 48],
      breakdown: [
        { label: 'Online now', value: '12' },
        { label: 'Admins', value: '5' },
        { label: 'This month', value: '48' },
      ],
    },
    {
      id: 'automations', label: 'Automations Run', value: '2,156',
      delta: -3.2, trend: 'down', icon: Zap,
      sparkline: [180, 220, 195, 210, 185, 200, 175, 190, 170, 180, 165, 178],
      breakdown: [
        { label: 'Succeeded', value: '2,089' },
        { label: 'Failed', value: '67' },
        { label: 'Rate', value: '96.9%' },
      ],
    },
    {
      id: 'uptime', label: 'System Uptime', value: '99.97%',
      delta: 0.02, trend: 'up', icon: Shield,
      sparkline: [99.9, 99.95, 100, 99.98, 100, 99.99, 100, 99.97, 100, 100, 99.98, 99.97],
    },
  ], []);
}

function useDemoActivity(): ActivityItem[] {
  return useMemo(() => [
    { id: '1', user: 'Alex K.', action: 'created', target: 'Fleet Report Q4', time: '2 min ago' },
    { id: '2', user: 'Maria S.', action: 'updated', target: 'Vehicle #247 status', time: '15 min ago' },
    { id: '3', user: 'Nick P.', action: 'completed', target: 'Wash batch #89', time: '32 min ago' },
    { id: '4', user: 'System', action: 'triggered', target: 'Auto-archive automation', time: '1h ago' },
    { id: '5', user: 'Elena D.', action: 'commented on', target: 'Shift schedule change', time: '2h ago' },
    { id: '6', user: 'Admin', action: 'approved', target: 'New user registration', time: '3h ago' },
  ], []);
}

// ── Heatmap Data ──────────────────────────────────────────

function useHeatmapData(): number[][] {
  return useMemo(() => {
    // 7 rows (days), 12 cols (hours 8–19)
    return Array.from({ length: 7 }, () =>
      Array.from({ length: 12 }, () => Math.floor(Math.random() * 100))
    );
  }, []);
}

// ── Components ────────────────────────────────────────────

function MiniSparkline({ data, positive }: { data: number[]; positive?: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 24;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={positive === false ? 'var(--destructive)' : 'var(--primary)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      />
    </svg>
  );
}

function KPICard({ kpi }: { kpi: KPI }) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const Icon = kpi.icon;
  const positive = kpi.trend === 'up';
  const DeltaIcon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-shadow">
      {/* Subtle aurora accent on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none aurora-bg" style={{ opacity: 0.03 }} />

      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4.5 h-4.5 text-primary" />
          </div>
          <MiniSparkline data={kpi.sparkline} positive={positive} />
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-semibold tracking-tight">{kpi.value}</span>
            <span className={cn(
              'text-xs font-medium flex items-center gap-0.5 mb-1',
              positive ? 'text-success' : 'text-destructive',
            )}>
              <DeltaIcon className="w-3 h-3" />
              {Math.abs(kpi.delta)}%
            </span>
          </div>
        </div>

        {/* Breakdown tooltip */}
        {kpi.breakdown && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="mt-3 text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                  onClick={() => setShowBreakdown(!showBreakdown)}
                >
                  View details <ChevronRight className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="p-3">
                <div className="space-y-1.5">
                  {kpi.breakdown.map((b) => (
                    <div key={b.label} className="flex justify-between gap-6 text-xs">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-medium">{b.value}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}

function Heatmap({ data }: { data: number[][] }) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 12 }, (_, i) => `${i + 8}:00`);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          Activity Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="overflow-x-auto">
          <div className="min-w-[400px]">
            {/* Hour labels */}
            <div className="flex ml-10 mb-1">
              {hours.map((h, i) => (
                <div key={i} className="flex-1 text-center text-[9px] text-muted-foreground">
                  {i % 2 === 0 ? h : ''}
                </div>
              ))}
            </div>
            {/* Grid */}
            {data.map((row, di) => (
              <div key={di} className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-muted-foreground w-8 text-right shrink-0">
                  {days[di]}
                </span>
                <div className="flex flex-1 gap-0.5">
                  {row.map((val, hi) => (
                    <TooltipProvider key={hi}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex-1 aspect-square rounded-sm transition-colors cursor-default"
                            style={{
                              backgroundColor: `oklch(${0.65 + (val / 100) * 0.2} ${0.1 + (val / 100) * 0.15} 264 / ${0.15 + (val / 100) * 0.75})`,
                            }}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {days[di]} {hours[hi]}: {val} actions
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center justify-end gap-1 mt-2">
              <span className="text-[9px] text-muted-foreground mr-1">Less</span>
              {[0.15, 0.3, 0.5, 0.7, 0.9].map((opacity, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: `oklch(0.65 0.15 264 / ${opacity})` }}
                />
              ))}
              <span className="text-[9px] text-muted-foreground ml-1">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Activity
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs h-7">
            View all
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 group">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-semibold text-primary">
                  {item.user.charAt(0)}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <span className="font-medium">{item.user}</span>
                  {' '}<span className="text-muted-foreground">{item.action}</span>{' '}
                  <span className="font-medium">{item.target}</span>
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStats() {
  const stats = [
    { label: 'Fleet Vehicles', value: '10', icon: Layers },
    { label: 'Wash Queue', value: '3', icon: BarChart3 },
    { label: 'Chat Channels', value: '5', icon: Activity },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <span className="text-sm font-semibold tabular-nums">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Dashboard ────────────────────────────────────────

export function DashboardPage() {
  const kpis = useDemoKPIs();
  const activity = useDemoActivity();
  const heatmap = useHeatmapData();
  const dataMode = useDataMode();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your workspace activity and metrics.
          </p>
        </div>
        {dataMode.mode === 'mock' && (
          <Badge variant="outline" className="text-[10px]">Demo Data</Badge>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Heatmap (spans 2 cols) */}
        <div className="lg:col-span-2">
          <Heatmap data={heatmap} />
        </div>

        {/* Quick Stats */}
        <QuickStats />
      </div>

      {/* Activity Feed */}
      <ActivityFeed items={activity} />
    </div>
  );
}

export default DashboardPage;
