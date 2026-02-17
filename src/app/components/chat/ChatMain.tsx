import { useState, useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

export function ChatMain() {
  const {
    currentUser,
    activeChannelId,
    getActiveChannel,
    getChannelMessages,
    getUserById,
    searchQuery,
    setSearchQuery,
    typingIndicators,
    setShowUserPanel,
    showUserPanel,
  } = useChatStore();

  const channel = getActiveChannel();
  const messages = activeChannelId ? getChannelMessages(activeChannelId) : [];
  const bottomRef = useRef<HTMLDivElement>(null);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showPinned, setShowPinned] = useState(false);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeChannelId]);

  // Filtered messages (search)
  const displayMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter(m =>
      m.content.toLowerCase().includes(q) ||
      (getUserById(m.senderId)?.name.toLowerCase().includes(q))
    );
  }, [messages, searchQuery]);

  // Pinned messages
  const pinnedMessages = useMemo(() => messages.filter(m => m.isPinned), [messages]);

  // Typing users
  const typingUsers = typingIndicators
    .filter(t => t.channelId === activeChannelId && t.userId !== currentUser?.id)
    .map(t => getUserById(t.userId)?.name)
    .filter(Boolean);

  // Group messages by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; messages: typeof displayMessages }[] = [];
    let currentDate = '';
    for (const msg of displayMessages) {
      const d = new Date(msg.timestamp).toLocaleDateString('el-GR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      if (d !== currentDate) {
        currentDate = d;
        groups.push({ date: d, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    }
    return groups;
  }, [displayMessages]);

  if (!channel) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f0d2e',
        color: 'rgba(255,255,255,0.3)',
        fontSize: 16,
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
          <div>Επιλέξτε κανάλι για να ξεκινήσετε</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: '#0f0d2e',
      minWidth: 0,
    }}>
      {/* Channel header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.02)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>{channel.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>{channel.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {channel.description} · {channel.members.length} μέλη
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <HeaderBtn emoji="📌" count={pinnedMessages.length} active={showPinned} onClick={() => setShowPinned(!showPinned)} title="Καρφιτσωμένα" />
          <HeaderBtn emoji="🔍" active={showSearch} onClick={() => { setShowSearch(!showSearch); if (showSearch) setSearchQuery(''); }} title="Αναζήτηση" />
          <HeaderBtn emoji="👥" active={showUserPanel} onClick={() => setShowUserPanel(!showUserPanel)} title="Μέλη" />
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Αναζήτηση μηνυμάτων..."
            autoFocus
            style={{
              width: '100%',
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.06)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searchQuery && (
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4, paddingLeft: 4 }}>
              {displayMessages.length} αποτελέσματα
            </div>
          )}
        </div>
      )}

      {/* Pinned messages overlay */}
      {showPinned && pinnedMessages.length > 0 && (
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(99,102,241,0.06)',
          maxHeight: 200,
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: 1 }}>
            📌 ΚΑΡΦΙΤΣΩΜΕΝΑ ({pinnedMessages.length})
          </div>
          {pinnedMessages.map(m => {
            const s = getUserById(m.senderId);
            return (
              <div key={m.id} style={{
                padding: '6px 10px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                marginBottom: 4,
                fontSize: 12,
                color: 'rgba(255,255,255,0.7)',
              }}>
                <span style={{ fontWeight: 600, color: '#a5b4fc' }}>{s?.name}:</span>{' '}
                {m.content.slice(0, 100)}
              </div>
            );
          })}
        </div>
      )}

      {/* Messages area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 0',
      }}>
        {groupedByDate.map(group => (
          <div key={group.date}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 0',
              position: 'sticky',
              top: 0,
              zIndex: 5,
            }}>
              <span style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                background: '#0f0d2e',
                padding: '3px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {group.date}
              </span>
            </div>
            {group.messages.map((msg, idx) => {
              const prevMsg = idx > 0 ? group.messages[idx - 1] : null;
              const isGrouped = prevMsg
                && prevMsg.senderId === msg.senderId
                && prevMsg.type !== 'system'
                && msg.type !== 'system'
                && (new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime() < 300000);
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onReply={(id) => setReplyToId(id)}
                  isGrouped={!!isGrouped}
                />
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{
          padding: '4px 20px',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          fontStyle: 'italic',
        }}>
          {typingUsers.join(', ')} γράφ{typingUsers.length > 1 ? 'ουν' : 'ει'}...
        </div>
      )}

      {/* Message input */}
      <MessageInput replyToId={replyToId} onClearReply={() => setReplyToId(null)} />
    </div>
  );
}

function HeaderBtn({ emoji, count, active, onClick, title }: {
  emoji: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  title: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        position: 'relative',
        border: 'none',
        background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
        color: active ? '#a5b4fc' : 'rgba(255,255,255,0.5)',
        fontSize: 18,
        cursor: 'pointer',
        padding: '6px 8px',
        borderRadius: 8,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {emoji}
      {(count ?? 0) > 0 && (
        <span style={{
          position: 'absolute',
          top: 0,
          right: 0,
          background: '#6366f1',
          color: '#fff',
          fontSize: 9,
          fontWeight: 700,
          width: 16,
          height: 16,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {count}
        </span>
      )}
    </button>
  );
}
