import { useState, useRef, useEffect, useMemo } from 'react';
import { useChatStore } from '../../store/chatStore';

interface MessageInputProps {
  replyToId: string | null;
  onClearReply: () => void;
}

export function MessageInput({ replyToId, onClearReply }: MessageInputProps) {
  const { currentUser, sendMessage, setTyping, activeChannelId, getUserById, getActiveChannel, messages, users } = useChatStore();
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIdx, setMentionIdx] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const channel = getActiveChannel();
  const replyMsg = replyToId ? messages.find(m => m.id === replyToId) : null;
  const replySender = replyMsg ? getUserById(replyMsg.senderId) : null;

  // @mention suggestions
  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    const channelMembers = channel ? users.filter(u => channel.members.includes(u.id)) : users;
    return channelMembers
      .filter(u => u.id !== currentUser?.id)
      .filter(u => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, users, channel, currentUser]);

  // Check if user can write in announcement channels
  const canWrite = (() => {
    if (!channel || !currentUser) return false;
    if (channel.type === 'announcement') {
      const allowedRoles = channel.allowedRoles ?? ['coordinator', 'supervisor'];
      return allowedRoles.includes(currentUser.role);
    }
    return true;
  })();

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [text]);

  // Focus on channel change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeChannelId]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim(), replyToId ?? undefined);
    setText('');
    onClearReply();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Mention navigation
    if (mentionQuery !== null && mentionSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIdx(i => (i + 1) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIdx(i => (i - 1 + mentionSuggestions.length) % mentionSuggestions.length);
        return;
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        insertMention(mentionSuggestions[mentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setMentionQuery(null);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertMention = (user: typeof users[0]) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    // Find the @ trigger position
    const pos = textarea.selectionStart;
    const before = text.slice(0, pos);
    const atIdx = before.lastIndexOf('@');
    if (atIdx === -1) return;
    const newText = text.slice(0, atIdx) + `@${user.name} ` + text.slice(pos);
    setText(newText);
    setMentionQuery(null);
    setMentionIdx(0);
    // Set cursor after mention
    requestAnimationFrame(() => {
      const newPos = atIdx + user.name.length + 2;
      textarea.setSelectionRange(newPos, newPos);
      textarea.focus();
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);
    if (activeChannelId) setTyping(activeChannelId);

    // Detect @mention
    const pos = e.target.selectionStart;
    const before = val.slice(0, pos);
    const match = before.match(/@([^\s@]*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIdx(0);
    } else {
      setMentionQuery(null);
    }
  };

  if (!canWrite) {
    return (
      <div style={{
        padding: '14px 20px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
      }}>
        📢 Μόνο Συντονιστές & Επόπτες μπορούν να γράψουν σε αυτό το κανάλι
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
      {/* @Mention autocomplete */}
      {mentionQuery !== null && mentionSuggestions.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 16, right: 16,
          background: 'rgba(15,13,46,0.97)', borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.4)',
          padding: 6, zIndex: 100, maxHeight: 240, overflowY: 'auto',
        }}>
          <div style={{ padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
            Αναφορά χρήστη
          </div>
          {mentionSuggestions.map((user, i) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              onMouseEnter={() => setMentionIdx(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '8px 10px', borderRadius: 8,
                border: 'none', cursor: 'pointer', textAlign: 'left',
                background: i === mentionIdx ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: '#e2e8f0', transition: 'background 0.1s',
              }}
            >
              <span style={{ fontSize: 18 }}>{user.avatar}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.role}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Reply preview */}
      {replyMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 20px',
          background: 'rgba(99,102,241,0.08)',
          borderLeft: '3px solid #6366f1',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>↩️</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>
              {replySender?.name}
            </span>
            <span style={{
              color: 'rgba(255,255,255,0.4)',
              fontSize: 12,
              marginLeft: 6,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {replyMsg.content.slice(0, 60)}
            </span>
          </div>
          <button
            onClick={onClearReply}
            style={{
              border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              fontSize: 16,
              cursor: 'pointer',
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Input area */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        padding: '10px 16px 14px',
      }}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Γράψε μήνυμα${channel ? ` σε ${channel.name}` : ''}...`}
          rows={1}
          style={{
            flex: 1,
            resize: 'none',
            padding: '10px 14px',
            borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.06)',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            lineHeight: 1.4,
            maxHeight: 120,
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim()}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: 'none',
            background: text.trim() ? '#6366f1' : 'rgba(99,102,241,0.3)',
            color: '#fff',
            fontSize: 18,
            cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}
