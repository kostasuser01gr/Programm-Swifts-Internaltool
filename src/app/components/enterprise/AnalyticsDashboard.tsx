import { useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { TrendingUp, TrendingDown, Hash, Users, CheckCircle2, Clock, AlertTriangle, BarChart3 } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';

interface AnalyticsDashboardProps {
  fields: Field[];
  records: TableRecord[];
  tableName: string;
  members: { id: string; name: string; email: string }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export function AnalyticsDashboard({ fields, records, tableName, members }: AnalyticsDashboardProps) {
  const statusField = fields.find((f) => f.type === 'select');
  const assigneeField = fields.find((f) => f.type === 'user');
  const numberField = fields.find((f) => f.type === 'number');
  const dateField = fields.find((f) => f.type === 'date');
  const priorityField = fields.find((f) => f.name.toLowerCase().includes('priority') && f.type === 'select');
  const checkboxField = fields.find((f) => f.type === 'checkbox');
  const tagsField = fields.find((f) => f.type === 'multiselect');

  // Status distribution
  const statusData = useMemo(() => {
    if (!statusField?.options?.choices) return [];
    return statusField.options.choices.map((choice) => ({
      name: choice.name,
      value: records.filter((r) => r.fields[statusField.id] === choice.id).length,
      color: choice.color === '#gray' ? '#9CA3AF' : choice.color,
    }));
  }, [statusField, records]);

  // Assignee workload
  const assigneeData = useMemo(() => {
    if (!assigneeField) return [];
    return members.map((member) => ({
      name: member.name.split(' ')[0],
      tasks: records.filter((r) => r.fields[assigneeField.id] === member.id).length,
      effort: numberField
        ? records
            .filter((r) => r.fields[assigneeField.id] === member.id)
            .reduce((sum, r) => sum + (Number(r.fields[numberField.id]) || 0), 0)
        : 0,
    }));
  }, [assigneeField, members, records, numberField]);

  // Priority breakdown
  const priorityData = useMemo(() => {
    if (!priorityField?.options?.choices) return [];
    return priorityField.options.choices.map((choice) => ({
      name: choice.name,
      value: records.filter((r) => r.fields[priorityField.id] === choice.id).length,
      color: choice.color === '#gray' ? '#9CA3AF' : choice.color,
    }));
  }, [priorityField, records]);

  // Date activity (records created per day)
  const dateActivityData = useMemo(() => {
    const dayMap: Record<string, number> = {};
    records.forEach((r) => {
      const date = r.createdTime.split('T')[0];
      dayMap[date] = (dayMap[date] || 0) + 1;
    });
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        created: count,
      }));
  }, [records]);

  // Tags distribution
  const tagsData = useMemo(() => {
    if (!tagsField?.options?.choices) return [];
    return tagsField.options.choices.map((choice) => ({
      name: choice.name,
      count: records.filter((r) => {
        const tags = r.fields[tagsField.id];
        return Array.isArray(tags) && tags.includes(choice.id);
      }).length,
      color: choice.color === '#gray' ? '#9CA3AF' : choice.color,
    })).sort((a, b) => b.count - a.count);
  }, [tagsField, records]);

  // Summary stats
  const stats = useMemo(() => {
    const total = records.length;
    const completed = checkboxField ? records.filter((r) => r.fields[checkboxField.id] === true).length : 0;
    const totalEffort = numberField
      ? records.reduce((sum, r) => sum + (Number(r.fields[numberField.id]) || 0), 0)
      : 0;
    const overdue = dateField
      ? records.filter((r) => {
          const d = r.fields[dateField.id];
          return d && new Date(String(d)) < new Date() && (!checkboxField || !r.fields[checkboxField.id]);
        }).length
      : 0;

    return { total, completed, totalEffort, overdue, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [records, checkboxField, numberField, dateField]);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              Analytics Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tableName} — {records.length} records</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Hash className="w-5 h-5 text-blue-500" />}
            label="Total Records"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5 text-green-500" />}
            label="Completed"
            value={`${stats.completed} (${stats.completionRate}%)`}
            color="green"
            trend={stats.completionRate > 50 ? 'up' : 'down'}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label="Total Effort"
            value={`${stats.totalEffort}h`}
            color="amber"
          />
          <StatCard
            icon={<AlertTriangle className="w-5 h-5 text-red-500" />}
            label="Overdue"
            value={stats.overdue}
            color="red"
            trend={stats.overdue > 0 ? 'down' : 'up'}
          />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status distribution */}
          {statusData.length > 0 && (
            <ChartCard title="Status Distribution">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Workload by assignee */}
          {assigneeData.length > 0 && (
            <ChartCard title="Workload by Assignee">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={assigneeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#3B82F6" name="Tasks" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="effort" fill="#10B981" name="Effort (h)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity over time */}
          {dateActivityData.length > 0 && (
            <ChartCard title="Activity Over Time">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dateActivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="created" stroke="#8B5CF6" fill="#8B5CF680" name="Records Created" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Priority breakdown */}
          {priorityData.length > 0 && (
            <ChartCard title="Priority Breakdown">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={priorityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]}>
                    {priorityData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>

        {/* Tags chart */}
        {tagsData.length > 0 && (
          <ChartCard title="Tags Distribution">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={tagsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Records" radius={[4, 4, 0, 0]}>
                  {tagsData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Completion progress */}
        <ChartCard title="Overall Progress">
          <div className="flex items-center gap-6 py-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Completion Rate</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{stats.completionRate}%</span>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                  ref={(el) => { if (el) el.style.width = `${stats.completionRate}%`; }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{stats.completed} completed</span>
                <span>{stats.total - stats.completed} remaining</span>
              </div>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, trend }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  trend?: 'up' | 'down';
}) {
  const bgColors: Record<string, string> = {
    blue: 'bg-blue-50 dark:bg-blue-950/30',
    green: 'bg-green-50 dark:bg-green-950/30',
    amber: 'bg-amber-50 dark:bg-amber-950/30',
    red: 'bg-red-50 dark:bg-red-950/30',
  };

  return (
    <div className={`${bgColors[color] || bgColors.blue} rounded-xl p-4 border border-gray-100 dark:border-gray-800`}>
      <div className="flex items-center justify-between mb-2">
        {icon}
        {trend && (
          trend === 'up'
            ? <TrendingUp className="w-4 h-4 text-green-500" />
            : <TrendingDown className="w-4 h-4 text-red-500" />
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{title}</h3>
      {children}
    </div>
  );
}
