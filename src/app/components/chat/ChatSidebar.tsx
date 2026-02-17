import { useChatStore } from '../../store/chatStore';
import type { Channel, ChannelType, ChatUser } from '../../types/chat';
import { ROLE_PERMISSIONS } from '../../types/chat';
import { useState } from 'react';

function ChannelItem({ channel, isActive }: { channel: Channel; isActive: boolean }) {
  const { setActiveChannel, togglePinChannel, toggleMuteChannel } = useChatStore();
  const [showCtx, setShowCtx] = useState(false);

  return (
    <div
      style={{ position: 'relative' }}
      onMouseLeave={() => setShowCtx(false)}
    >
      <button
        onClick={() => setActiveChannel(channel.id)}
        onContextMenu={e => { e.preventDefault(); setShowCtx(true); }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 10,
          border: 'none',
          background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.15s',
          textAlign: 'left',
        }}
        onMouseEnter={e => {
          if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
        }}
        onMouseLeave={e => {
          if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>{channel.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: isActive ? '#a5b4fc' : '#e2e8f0',
            fontWeight: isActive ? 700 : 500,
            fontSize: 13,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {channel.name}
            {channel.isMuted && <span style={{ opacity: 0.4, marginLeft: 4 }}>🔇</span>}
          </div>
        </div>
        {channel.unreadCount > 0 && (
          <div style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            background: '#6366f1',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 6px',
            flexShrink: 0,
          }}>
            {channel.unreadCount}
          </div>
        )}
      </button>

      {showCtx && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 12,
          zIndex: 100,
          background: '#1e1b4b',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8,
          padding: 4,
          minWidth: 160,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <CtxBtn label={channel.isPinned ? '📌 Ξεκαρφίτσωμα' : '📌 Καρφίτσωμα'} onClick={() => { togglePinChannel(channel.id); setShowCtx(false); }} />
          <CtxBtn label={channel.isMuted ? '🔔 Ενεργοποίηση' : '🔇 Σίγαση'} onClick={() => { toggleMuteChannel(channel.id); setShowCtx(false); }} />
        </div>
      )}
    </div>
  );
}

function CtxBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '7px 10px',
        border: 'none',
        background: 'transparent',
        color: '#e2e8f0',
        fontSize: 12,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: 6,
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}

export function ChatSidebar() {
  const {
    currentUser,
    activeChannelId,
    getVisibleChannels,
    getUnreadTotal,
    logout,
    updateUserStatus,
    setShowChannelCreate,
    showChannelCreate,
    createChannel,
    users,
  } = useChatStore();

  const channels = getVisibleChannels();
  const unreadTotal = getUnreadTotal();

  const pinned = channels.filter(c => c.isPinned);
  const public_ = channels.filter(c => !c.isPinned && c.type === 'public');
  const private_ = channels.filter(c => !c.isPinned && c.type === 'private');
  const announcements = channels.filter(c => !c.isPinned && c.type === 'announcement');

  const perms = currentUser ? ROLE_PERMISSIONS[currentUser.role] : null;

  // ── Create channel form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ChannelType>('public');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    createChannel(newName.trim(), newDesc.trim(), newType, selectedMembers);
    setNewName('');
    setNewDesc('');
    setNewType('public');
    setSelectedMembers([]);
  };

  const statusEmoji: Record<string, string> = {
    online: '🟢',
    away: '🟡',
    busy: '🔴',
    offline: '⚫',
  };

  if (!currentUser) return null;

  return (
    <div style={{
      width: 280,
      height: '100%',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>💬</span>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>Station Chat</span>
          </div>
          {unreadTotal > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 10,
            }}>
              {unreadTotal}
            </span>
          )}
        </div>

        {/* Current user */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 22 }}>{currentUser.avatar}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: 13 }}>{currentUser.name}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{currentUser.position}</div>
          </div>
          <select
            value={currentUser.status}
            onChange={e => updateUserStatus(e.target.value as ChatUser['status'])}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="online">🟢</option>
            <option value="away">🟡</option>
            <option value="busy">🔴</option>
            <option value="offline">⚫</option>
          </select>
        </div>
      </div>

      {/* Channels list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 4px' }}>
        {pinned.length > 0 && (
          <ChannelGroup label="📌 Καρφιτσωμένα" channels={pinned} activeId={activeChannelId} />
        )}
        {announcements.length > 0 && (
          <ChannelGroup label="📢 Ανακοινώσεις" channels={announcements} activeId={activeChannelId} />
        )}
        {public_.length > 0 && (
          <ChannelGroup label="💬 Κανάλια" channels={public_} activeId={activeChannelId} />
        )}
        {private_.length > 0 && (
          <ChannelGroup label="🔒 Ιδιωτικά" channels={private_} activeId={activeChannelId} />
        )}
      </div>

      {/* Create channel */}
      {(perms?.canCreatePublicChannel || perms?.canCreatePrivateChannel) && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setShowChannelCreate(!showChannelCreate)}
            style={{
              width: '100%',
              padding: '8px 0',
              border: '1px dashed rgba(255,255,255,0.2)',
              borderRadius: 10,
              background: 'transparent',
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            + Νέο Κανάλι
          </button>

          {showChannelCreate && (
            <div style={{ padding: '10px 0 4px' }}>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Όνομα καναλιού"
                style={inputStyle}
              />
              <input
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                placeholder="Περιγραφή (προαιρετικά)"
                style={{ ...inputStyle, marginTop: 6 }}
              />
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as ChannelType)}
                style={{ ...inputStyle, marginTop: 6 }}
              >
                {perms?.canCreatePublicChannel && <option value="public">💬 Δημόσιο</option>}
                {perms?.canCreatePrivateChannel && <option value="private">🔒 Ιδιωτικό</option>}
                {perms?.canCreateAnnouncement && <option value="announcement">📢 Ανακοίνωση</option>}
              </select>
              {/* Member selection for private channels */}
              {newType === 'private' && (
                <div style={{ marginTop: 6, maxHeight: 120, overflowY: 'auto' }}>
                  {users.filter(u => u.id !== currentUser.id).map(u => (
                    <label key={u.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '3px 0',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(u.id)}
                        onChange={e => {
                          setSelectedMembers(prev =>
                            e.target.checked ? [...prev, u.id] : prev.filter(id => id !== u.id)
                          );
                        }}
                      />
                      {u.avatar} {u.name}
                    </label>
                  ))}
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={!newName.trim()}
                style={{
                  width: '100%',
                  marginTop: 8,
                  padding: '8px 0',
                  border: 'none',
                  borderRadius: 8,
                  background: newName.trim() ? '#6366f1' : 'rgba(99,102,241,0.3)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: newName.trim() ? 'pointer' : 'default',
                }}
              >
                Δημιουργία
              </button>
            </div>
          )}
        </div>
      )}

      {/* Logout */}
      <div style={{ padding: '8px 12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={logout}
          style={{
            width: '100%',
            padding: '8px 0',
            border: 'none',
            borderRadius: 10,
            background: 'rgba(239,68,68,0.15)',
            color: '#fca5a5',
            fontSize: 12,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          🚪 Αποσύνδεση
        </button>
      </div>
    </div>
  );
}

function ChannelGroup({ label, channels, activeId }: { label: string; channels: Channel[]; activeId: string | null }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        padding: '6px 12px 4px',
      }}>
        {label}
      </div>
      {channels.map(ch => (
        <ChannelItem key={ch.id} channel={ch} isActive={ch.id === activeId} />
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.12)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
};
