import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { Message } from '../../types/chat';
import { ROLE_PERMISSIONS } from '../../types/chat';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🙏', '✅', '🔥'];

// URL detection regex
const URL_REGEX = /(https?:\/\/[^\s<>[\]{}|\\^`"]+)/g;

// Render message content with @mention highlights and URL linkification
function renderContent(content: string) {
  // First split on mentions
  const mentionParts = content.split(/(@[^\s@]+(?:\s[^\s@]+)?)/g);
  
  return mentionParts.map((part, i) => {
    if (part.startsWith('@')) {
      return (
        <span
          key={i}
          style={{
            color: '#a5b4fc',
            fontWeight: 600,
            background: 'rgba(99,102,241,0.15)',
            padding: '1px 4px',
            borderRadius: 4,
          }}
        >
          {part}
        </span>
      );
    }
    // Linkify URLs in non-mention parts
    const urlParts = part.split(URL_REGEX);
    if (urlParts.length === 1) return part;
    return urlParts.map((seg, j) => {
      if (URL_REGEX.test(seg)) {
        URL_REGEX.lastIndex = 0; // reset regex state
        return (
          <a
            key={`${i}-${j}`}
            href={seg}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#60a5fa', textDecoration: 'underline',
              wordBreak: 'break-all',
            }}
          >
            {seg.length > 50 ? seg.slice(0, 50) + '…' : seg}
          </a>
        );
      }
      return seg;
    });
  });
}

interface MessageBubbleProps {
  message: Message;
  onReply: (id: string) => void;
  isGrouped?: boolean;
}

export function MessageBubble({ message, onReply, isGrouped = false }: MessageBubbleProps) {
  const { currentUser, getUserById, toggleReaction, deleteMessage, pinMessage, editMessage, getChannelMessages } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const sender = getUserById(message.senderId);
  const isOwn = currentUser?.id === message.senderId;
  const perms = currentUser ? ROLE_PERMISSIONS[currentUser.role] : null;
  const canDelete = isOwn || perms?.canDeleteAnyMessage;
  const canPin = perms?.canPinMessages;

  // Find reply-to message
  const replyTo = message.replyToId
    ? useChatStore.getState().messages.find(m => m.id === message.replyToId)
    : null;
  const replyToSender = replyTo ? getUserById(replyTo.senderId) : null;

  if (message.type === 'system') {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '8px 0',
      }}>
        <span style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          fontStyle: 'italic',
          background: 'rgba(255,255,255,0.04)',
          padding: '4px 14px',
          borderRadius: 12,
        }}>
          {message.content}
        </span>
      </div>
    );
  }

  const timestamp = new Date(message.timestamp);
  const timeStr = timestamp.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== message.content) {
      editMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 10,
        padding: isGrouped ? '1px 16px' : '4px 16px',
        position: 'relative',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowEmojis(false); }}
    >
      {/* Avatar — hidden when grouped */}
      {!isOwn && !isGrouped && (
        <div style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
          flexShrink: 0,
          marginTop: 2,
        }}>
          {sender?.avatar ?? '👤'}
        </div>
      )}

      {/* Spacer when avatar hidden for grouped messages */}
      {!isOwn && isGrouped && <div style={{ width: 36, flexShrink: 0 }} />}

      {/* Bubble */}
      <div style={{ maxWidth: '70%', minWidth: 100 }}>
        {/* Sender name (not own messages, not grouped) */}
        {!isOwn && !isGrouped && (
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: roleNameColor(sender?.role),
            marginBottom: 2,
            paddingLeft: 4,
          }}>
            {sender?.name ?? 'Unknown'}
            <span style={{
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              fontWeight: 400,
              marginLeft: 6,
            }}>
              {timeStr}
            </span>
          </div>
        )}

        {/* Reply quote */}
        {replyTo && (
          <div style={{
            padding: '6px 10px',
            marginBottom: 2,
            borderLeft: '3px solid #6366f1',
            borderRadius: '0 8px 8px 0',
            background: 'rgba(99,102,241,0.08)',
            fontSize: 12,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <span style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {replyToSender?.name}:
            </span>{' '}
            {replyTo.content.slice(0, 80)}
          </div>
        )}

        {/* Message body */}
        <div style={{
          padding: '10px 14px',
          borderRadius: isOwn ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
          background: isOwn
            ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
            : 'rgba(255,255,255,0.08)',
          color: '#fff',
          fontSize: 14,
          lineHeight: 1.5,
          wordBreak: 'break-word',
          position: 'relative',
        }}>
          {message.isPinned && (
            <span style={{
              position: 'absolute',
              top: -6,
              right: 8,
              fontSize: 12,
            }}>📌</span>
          )}

          {isEditing ? (
            <div>
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } if (e.key === 'Escape') setIsEditing(false); }}
                style={{
                  width: '100%',
                  minHeight: 40,
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 14,
                  padding: 8,
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
                <button onClick={() => setIsEditing(false)} style={smallBtnStyle('#6b7280')}>Ακύρωση</button>
                <button onClick={handleSaveEdit} style={smallBtnStyle('#6366f1')}>Αποθήκευση</button>
              </div>
            </div>
          ) : (
            <>
              {renderContent(message.content)}
              {message.editedAt && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>(edited)</span>
              )}
            </>
          )}
        </div>

        {/* Own message timestamp */}
        {isOwn && (
          <div style={{
            fontSize: 10,
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'right',
            marginTop: 2,
            paddingRight: 4,
          }}>
            {timeStr}
            <span style={{ marginLeft: 4 }}>
              {message.readBy.length > 1 ? '✓✓' : '✓'}
            </span>
          </div>
        )}

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4, paddingLeft: 4 }}>
            {message.reactions.map(r => (
              <button
                key={r.emoji}
                onClick={() => toggleReaction(message.id, r.emoji)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 8px',
                  borderRadius: 12,
                  border: r.users.includes(currentUser?.id ?? '')
                    ? '1px solid rgba(99,102,241,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                  background: r.users.includes(currentUser?.id ?? '')
                    ? 'rgba(99,102,241,0.15)'
                    : 'rgba(255,255,255,0.04)',
                  cursor: 'pointer',
                  fontSize: 13,
                  color: '#fff',
                }}
              >
                {r.emoji}
                <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                  {r.users.length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover action bar */}
      {showActions && !isEditing && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: isOwn ? undefined : 16,
          left: isOwn ? 16 : undefined,
          display: 'flex',
          gap: 2,
          background: '#1e1b4b',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '3px 4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}>
          <ActionBtn emoji="😀" title="Αντίδραση" onClick={() => setShowEmojis(!showEmojis)} />
          <ActionBtn emoji="↩️" title="Απάντηση" onClick={() => onReply(message.id)} />
          {isOwn && <ActionBtn emoji="✏️" title="Επεξεργασία" onClick={() => { setIsEditing(true); setEditContent(message.content); }} />}
          {canPin && <ActionBtn emoji={message.isPinned ? '📌' : '📍'} title="Καρφίτσωμα" onClick={() => pinMessage(message.id)} />}
          {canDelete && <ActionBtn emoji="🗑️" title="Διαγραφή" onClick={() => deleteMessage(message.id)} />}

          {showEmojis && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              display: 'flex',
              gap: 2,
              background: '#1e1b4b',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '4px 6px',
              marginTop: 2,
              zIndex: 11,
            }}>
              {QUICK_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => { toggleReaction(message.id, e); setShowEmojis(false); }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    fontSize: 16,
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: 4,
                  }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ emoji, title, onClick }: { emoji: string; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        fontSize: 14,
        cursor: 'pointer',
        padding: '3px 5px',
        borderRadius: 4,
        lineHeight: 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {emoji}
    </button>
  );
}

function roleNameColor(role?: string): string {
  switch (role) {
    case 'coordinator': return '#f87171';
    case 'supervisor': return '#fbbf24';
    case 'fleet_supervisor': return '#60a5fa';
    case 'head_rep': return '#34d399';
    default: return '#94a3b8';
  }
}

function smallBtnStyle(bg: string): React.CSSProperties {
  return {
    padding: '4px 10px',
    border: 'none',
    borderRadius: 6,
    background: bg,
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  };
}
