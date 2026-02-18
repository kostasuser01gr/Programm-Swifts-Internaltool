'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  color: string;
}

const EVENTS: CalendarEvent[] = [
  { id: 'e1', title: 'Sprint Planning', date: '2026-02-18', color: 'bg-primary' },
  { id: 'e2', title: 'Design Review', date: '2026-02-18', color: 'bg-success' },
  { id: 'e3', title: 'Release v2.0', date: '2026-02-20', color: 'bg-warning' },
  { id: 'e4', title: 'Team Standup', date: '2026-02-19', color: 'bg-info' },
  { id: 'e5', title: 'Client Demo', date: '2026-02-25', color: 'bg-chart-4' },
  { id: 'e6', title: 'Code Review', date: '2026-02-27', color: 'bg-primary' },
  { id: 'e7', title: 'Retrospective', date: '2026-03-01', color: 'bg-destructive' },
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(1); // February = 1
  const [events, setEvents] = useState(EVENTS);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number | null; date: string }> = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, date: '' });
    }
    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, date: dateStr });
    }
    return days;
  }, [year, month, daysInMonth, firstDay]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function addEvent() {
    if (!newTitle || !newDate) return;
    setEvents((prev) => [
      ...prev,
      { id: `e${Date.now()}`, title: newTitle, date: newDate, color: 'bg-primary' },
    ]);
    setNewTitle('');
    setNewDate('');
    setNewOpen(false);
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event title" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
              </div>
              <Button onClick={addEvent} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{MONTHS[month]} {year}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAYS.map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map((cell, i) => {
              const dayEvents = events.filter((e) => e.date === cell.date);
              const isToday = cell.date === today;
              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[80px] rounded-lg border border-transparent p-1.5 transition-colors',
                    cell.day && 'hover:bg-muted/30',
                    isToday && 'border-primary/50 bg-primary/5',
                  )}
                >
                  {cell.day && (
                    <>
                      <span className={cn('text-xs font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>
                        {cell.day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium text-white truncate', ev.color)}
                          >
                            {ev.title}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming events sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {events
              .filter((e) => e.date >= (today ?? ''))
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map((ev) => (
                <div key={ev.id} className="flex items-center gap-3">
                  <div className={cn('h-2.5 w-2.5 rounded-full', ev.color)} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">{ev.date}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
