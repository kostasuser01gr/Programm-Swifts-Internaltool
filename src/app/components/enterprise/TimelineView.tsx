import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Field, Record as TableRecord } from '../../types';
import { Button } from '../ui/button';

interface TimelineViewProps {
  fields: Field[];
  records: TableRecord[];
  dateFieldId: string;
  endDateFieldId?: string;
  onRecordClick: (record: TableRecord) => void;
  members: { id: string; name: string; email: string }[];
}

type ZoomLevel = 'day' | 'week' | 'month';

export function TimelineView({ fields, records, dateFieldId, endDateFieldId, onRecordClick, members }: TimelineViewProps) {
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('week');
  const [offset, setOffset] = useState(0);

  const primaryField = fields.find((f) => f.isPrimary);
  const statusField = fields.find((f) => f.type === 'select');
  const assigneeField = fields.find((f) => f.type === 'user');

  const today = new Date();

  // Calculate date range
  const dateRange = useMemo(() => {
    const baseDate = new Date(today);
    baseDate.setDate(baseDate.getDate() + offset);
    const daysToShow = zoomLevel === 'day' ? 14 : zoomLevel === 'week' ? 28 : 90;
    const start = new Date(baseDate);
    start.setDate(start.getDate() - Math.floor(daysToShow / 4));
    const end = new Date(start);
    end.setDate(end.getDate() + daysToShow);
    return { start, end, days: daysToShow };
  }, [offset, zoomLevel]);

  // Generate day columns
  const dayColumns = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(dateRange.start);
    while (current <= dateRange.end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [dateRange]);

  // Filter and position records
  const positionedRecords = useMemo(() => {
    return records
      .map((record) => {
        const startDate = record.fields[dateFieldId]
          ? new Date(String(record.fields[dateFieldId]))
          : null;
        if (!startDate) return null;

        const endDate = endDateFieldId && record.fields[endDateFieldId]
          ? new Date(String(record.fields[endDateFieldId]))
          : new Date(startDate.getTime() + 24 * 60 * 60 * 1000 * 3); // Default 3-day span

        const startDiff = (startDate.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
        const duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

        return {
          record,
          startDay: Math.max(0, startDiff),
          duration: Math.max(1, duration),
          startDate,
          endDate,
        };
      })
      .filter(Boolean) as {
        record: TableRecord;
        startDay: number;
        duration: number;
        startDate: Date;
        endDate: Date;
      }[];
  }, [records, dateFieldId, endDateFieldId, dateRange]);

  const dayWidth = zoomLevel === 'day' ? 80 : zoomLevel === 'week' ? 40 : 16;

  const handlePrev = () => setOffset((o) => o - (zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30));
  const handleNext = () => setOffset((o) => o + (zoomLevel === 'day' ? 7 : zoomLevel === 'week' ? 14 : 30));
  const handleToday = () => setOffset(0);

  const zoomIn = () => {
    if (zoomLevel === 'month') setZoomLevel('week');
    else if (zoomLevel === 'week') setZoomLevel('day');
  };

  const zoomOut = () => {
    if (zoomLevel === 'day') setZoomLevel('week');
    else if (zoomLevel === 'week') setZoomLevel('month');
  };

  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  const getMonthHeaders = () => {
    const months: { name: string; span: number; year: number }[] = [];
    let currentMonth = -1;
    dayColumns.forEach((day) => {
      if (day.getMonth() !== currentMonth) {
        currentMonth = day.getMonth();
        months.push({
          name: day.toLocaleDateString('en-US', { month: 'long' }),
          span: 1,
          year: day.getFullYear(),
        });
      } else {
        months[months.length - 1].span++;
      }
    });
    return months;
  };

  const barColors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-amber-500', 'bg-pink-500',
  ];

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      {/* Timeline header controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={zoomOut} disabled={zoomLevel === 'month'}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-12 text-center capitalize">{zoomLevel}</span>
          <Button variant="ghost" size="sm" onClick={zoomIn} disabled={zoomLevel === 'day'}>
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {positionedRecords.length} items on timeline
        </div>
      </div>

      {/* Timeline body */}
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: dayColumns.length * dayWidth }}>
          {/* Month headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 bg-white dark:bg-gray-900">
            <div className="w-56 min-w-56 border-r border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Task</span>
            </div>
            <div className="flex">
              {getMonthHeaders().map((month, idx) => (
                <div
                  key={idx}
                  className="border-r border-gray-200 dark:border-gray-700 px-2 py-1 bg-gray-50 dark:bg-gray-800"
                  style={{ width: month.span * dayWidth }}
                >
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {month.name} {month.year}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Day headers */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-[33px] z-10 bg-white dark:bg-gray-900">
            <div className="w-56 min-w-56 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800" />
            <div className="flex">
              {dayColumns.map((day, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center border-r border-gray-100 dark:border-gray-800 py-1 ${
                    isToday(day) ? 'bg-blue-50 dark:bg-blue-950' : isWeekend(day) ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                  }`}
                  style={{ width: dayWidth }}
                >
                  {zoomLevel !== 'month' && (
                    <span className="text-[10px] text-gray-400">{day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}</span>
                  )}
                  <span className={`text-[10px] ${isToday(day) ? 'text-blue-600 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Records / Gantt bars */}
          {positionedRecords.map((item, idx) => {
            const title = primaryField ? String(item.record.fields[primaryField.id] || 'Untitled') : 'Untitled';
            const assignee = assigneeField ? members.find((m) => m.id === item.record.fields[assigneeField.id]) : null;
            const status = statusField?.options?.choices?.find((c) => c.id === item.record.fields[statusField.id]);
            const barColor = barColors[idx % barColors.length];

            return (
              <div
                key={item.record.id}
                className="flex border-b border-gray-100 dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 group"
                style={{ height: 44 }}
              >
                {/* Row label */}
                <div
                  className="w-56 min-w-56 border-r border-gray-200 dark:border-gray-700 px-3 flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => onRecordClick(item.record)}
                >
                  {assignee && (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-medium flex-shrink-0">
                      {assignee.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate font-medium">{title}</span>
                  {status && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium flex-shrink-0"
                      style={{
                        backgroundColor: `${status.color === '#gray' ? '#9CA3AF' : status.color}20`,
                        color: status.color === '#gray' ? '#4B5563' : status.color,
                      }}
                    >
                      {status.name}
                    </span>
                  )}
                </div>

                {/* Timeline bar area */}
                <div className="flex-1 relative">
                  {/* Today line */}
                  {(() => {
                    const todayOffset = (today.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
                    if (todayOffset >= 0 && todayOffset <= dayColumns.length) {
                      return (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                          style={{ left: todayOffset * dayWidth }}
                        />
                      );
                    }
                    return null;
                  })()}

                  {/* Gantt bar */}
                  <div
                    className={`absolute top-2 h-7 ${barColor} rounded-md cursor-pointer hover:opacity-80 transition-opacity shadow-sm flex items-center px-2 overflow-hidden`}
                    style={{
                      left: item.startDay * dayWidth,
                      width: Math.max(item.duration * dayWidth, 24),
                    }}
                    onClick={() => onRecordClick(item.record)}
                    title={`${title}\n${item.startDate.toLocaleDateString()} – ${item.endDate.toLocaleDateString()}`}
                  >
                    <span className="text-[10px] text-white font-medium truncate">{title}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {positionedRecords.length === 0 && (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
              No records with dates to display on the timeline
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
