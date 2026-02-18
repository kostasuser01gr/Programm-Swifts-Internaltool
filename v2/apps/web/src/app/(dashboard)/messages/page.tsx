'use client';

import { useState } from 'react';
import { Send, Paperclip, Search, Phone, Video, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Mock data ──────────────────────────────────────────────
const conversations = [
  { id: '1', name: 'Alice Martin', initials: 'AM', lastMsg: 'Can you review the PR?', time: '2m', unread: 3, online: true },
  { id: '2', name: 'Bob Kennedy', initials: 'BK', lastMsg: 'Meeting at 3pm', time: '15m', unread: 0, online: true },
  { id: '3', name: 'Carol Smith', initials: 'CS', lastMsg: 'Design files are ready', time: '1h', unread: 1, online: false },
  { id: '4', name: 'Dave Roberts', initials: 'DR', lastMsg: 'Deployment successful!', time: '3h', unread: 0, online: false },
  { id: '5', name: 'Eve Turner', initials: 'ET', lastMsg: 'Thanks for the update', time: '1d', unread: 0, online: true },
  { id: '6', name: 'Frank Lee', initials: 'FL', lastMsg: 'Will check tomorrow', time: '2d', unread: 0, online: false },
];

const messages: Record<string, Array<{ id: string; from: 'me' | 'them'; text: string; time: string }>> = {
  '1': [
    { id: 'm1', from: 'them', text: 'Hey! I pushed the new feature branch.', time: '10:32 AM' },
    { id: 'm2', from: 'me', text: 'Great, I\'ll take a look at it now.', time: '10:35 AM' },
    { id: 'm3', from: 'them', text: 'There are some changes to the auth middleware too.', time: '10:36 AM' },
    { id: 'm4', from: 'me', text: 'Got it. The RBAC changes look good overall.', time: '10:42 AM' },
    { id: 'm5', from: 'them', text: 'Can you review the PR? I need it merged before EOD.', time: '10:45 AM' },
  ],
  '2': [
    { id: 'm6', from: 'them', text: 'Don\'t forget the standup at 3pm today.', time: '9:00 AM' },
    { id: 'm7', from: 'me', text: 'I\'ll be there. Anything specific to prep?', time: '9:05 AM' },
    { id: 'm8', from: 'them', text: 'Just the sprint update. Meeting at 3pm', time: '9:10 AM' },
  ],
};

export default function MessagesPage() {
  const [activeId, setActiveId] = useState('1');
  const [search, setSearch] = useState('');
  const [newMsg, setNewMsg] = useState('');

  const active = conversations.find((c) => c.id === activeId);
  const chat = messages[activeId] ?? [];

  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  function handleSend() {
    if (!newMsg.trim()) return;
    const msg = { id: `m${Date.now()}`, from: 'me' as const, text: newMsg, time: 'Just now' };
    messages[activeId] = [...(messages[activeId] ?? []), msg];
    setNewMsg('');
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 overflow-hidden rounded-xl border bg-card">
      {/* Conversation list */}
      <div className="w-80 border-r flex flex-col max-sm:hidden">
        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search messages…" className="pl-9 bg-muted/50 border-0" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Separator />
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {filtered.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveId(conv.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  activeId === conv.id ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{conv.initials}</AvatarFallback>
                  </Avatar>
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-card bg-success" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{conv.name}</span>
                    <span className="text-[10px] text-muted-foreground">{conv.time}</span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{conv.lastMsg}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {conv.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat view */}
      <div className="flex flex-1 flex-col">
        {/* Chat header */}
        {active && (
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary text-sm">{active.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{active.name}</p>
                <p className="text-xs text-muted-foreground">{active.online ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chat.map((msg) => (
              <div key={msg.id} className={cn('flex', msg.from === 'me' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[70%] rounded-2xl px-4 py-2.5',
                    msg.from === 'me'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted rounded-bl-md',
                  )}
                >
                  <p className="text-sm">{msg.text}</p>
                  <p className={cn('mt-1 text-[10px]', msg.from === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Composer */}
        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <Button type="button" variant="ghost" size="icon">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type a message…"
              className="flex-1"
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
