'use client';

import { useState } from 'react';
import { Plus, GripVertical, MoreHorizontal, Paperclip, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

// ─── Types ──────────────────────────────────────────────────
interface KanbanCard {
  id: string;
  title: string;
  description: string;
  labels: Array<{ text: string; color: string }>;
  assignees: string[];
  attachments: number;
  comments: number;
  dueDate?: string;
}

interface Column {
  id: string;
  title: string;
  color: string;
  cards: KanbanCard[];
}

// ─── Initial data ───────────────────────────────────────────
const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-muted-foreground',
    cards: [
      {
        id: 'k1',
        title: 'Design new landing page',
        description: 'Create mockups for the marketing landing page',
        labels: [{ text: 'Design', color: 'bg-info' }, { text: 'High', color: 'bg-destructive' }],
        assignees: ['AM', 'BK'],
        attachments: 3,
        comments: 5,
        dueDate: 'Feb 25',
      },
      {
        id: 'k2',
        title: 'API documentation',
        description: 'Document all REST endpoints',
        labels: [{ text: 'Docs', color: 'bg-warning' }],
        assignees: ['CS'],
        attachments: 1,
        comments: 2,
      },
      {
        id: 'k3',
        title: 'Setup CI/CD pipeline',
        description: 'Configure GitHub Actions for automated deployment',
        labels: [{ text: 'DevOps', color: 'bg-chart-4' }],
        assignees: ['DR'],
        attachments: 0,
        comments: 8,
        dueDate: 'Mar 1',
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-primary',
    cards: [
      {
        id: 'k4',
        title: 'User authentication flow',
        description: 'Implement login, register, and session management',
        labels: [{ text: 'Feature', color: 'bg-success' }, { text: 'Critical', color: 'bg-destructive' }],
        assignees: ['AM', 'ET'],
        attachments: 2,
        comments: 12,
        dueDate: 'Feb 20',
      },
      {
        id: 'k5',
        title: 'Database migration scripts',
        description: 'Write v1→v2 data migration',
        labels: [{ text: 'Backend', color: 'bg-info' }],
        assignees: ['BK'],
        attachments: 4,
        comments: 3,
      },
    ],
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-success',
    cards: [
      {
        id: 'k6',
        title: 'Project scaffolding',
        description: 'Setup monorepo with pnpm workspaces',
        labels: [{ text: 'DevOps', color: 'bg-chart-4' }],
        assignees: ['CS'],
        attachments: 1,
        comments: 4,
      },
      {
        id: 'k7',
        title: 'Design system tokens',
        description: 'Establish color palette, typography, spacing',
        labels: [{ text: 'Design', color: 'bg-info' }],
        assignees: ['AM'],
        attachments: 2,
        comments: 6,
      },
    ],
  },
];

export default function KanbanPage() {
  const [columns, setColumns] = useState(initialColumns);
  const [newCardOpen, setNewCardOpen] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [draggedCard, setDraggedCard] = useState<{ columnId: string; cardId: string } | null>(null);

  function addCard(columnId: string) {
    if (!newTitle.trim()) return;
    setColumns((cols) =>
      cols.map((col) =>
        col.id === columnId
          ? {
              ...col,
              cards: [
                ...col.cards,
                {
                  id: `k${Date.now()}`,
                  title: newTitle,
                  description: newDesc,
                  labels: [],
                  assignees: [],
                  attachments: 0,
                  comments: 0,
                },
              ],
            }
          : col,
      ),
    );
    setNewTitle('');
    setNewDesc('');
    setNewCardOpen(null);
  }

  function handleDragStart(columnId: string, cardId: string) {
    setDraggedCard({ columnId, cardId });
  }

  function handleDrop(targetColumnId: string) {
    if (!draggedCard || draggedCard.columnId === targetColumnId) {
      setDraggedCard(null);
      return;
    }
    setColumns((cols) => {
      const sourceCol = cols.find((c) => c.id === draggedCard.columnId);
      const card = sourceCol?.cards.find((c) => c.id === draggedCard.cardId);
      if (!card) return cols;
      return cols.map((col) => {
        if (col.id === draggedCard.columnId) {
          return { ...col, cards: col.cards.filter((c) => c.id !== draggedCard.cardId) };
        }
        if (col.id === targetColumnId) {
          return { ...col, cards: [...col.cards, card] };
        }
        return col;
      });
    });
    setDraggedCard(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Kanban Board</h1>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex w-80 min-w-[320px] flex-col rounded-xl bg-muted/30 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(column.id)}
          >
            {/* Column header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {column.cards.length}
                </span>
              </div>
              <Dialog open={newCardOpen === column.id} onOpenChange={(open) => setNewCardOpen(open ? column.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add card to {column.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Card title" />
                    </div>
                    <div className="space-y-1">
                      <Label>Description</Label>
                      <Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Details…" />
                    </div>
                    <Button onClick={() => addCard(column.id)} className="w-full">Add Card</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-2">
              {column.cards.map((card) => (
                <Card
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(column.id, card.id)}
                  className="cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Labels */}
                    {card.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.labels.map((l) => (
                          <span key={l.text} className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium text-white', l.color)}>
                            {l.text}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-sm font-medium">{card.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{card.description}</p>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex -space-x-1.5">
                        {card.assignees.map((a) => (
                          <Avatar key={a} className="h-6 w-6 border-2 border-card">
                            <AvatarFallback className="bg-primary/20 text-primary text-[9px]">{a}</AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {card.attachments > 0 && (
                          <span className="flex items-center gap-1">
                            <Paperclip className="h-3 w-3" /> {card.attachments}
                          </span>
                        )}
                        {card.comments > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {card.comments}
                          </span>
                        )}
                        {card.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {card.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
