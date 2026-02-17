import { useChatStore } from '../../store/chatStore';
import type { ChatUser } from '../../types/chat';

export function UserListPanel() {
  const { currentUser, users, getActiveChannel, showUserPanel, setShowUserPanel } = useChatStore();
  const channel = getActiveChannel();

  if (!showUserPanel || !channel) return null;

  const channelMembers = users.filter(u => channel.members.includes(u.id));
  const online = channelMembers.filter(u => u.status === 'online');
  const away = channelMembers.filter(u => u.status === 'away');
  const busy = channelMembers.filter(u => u.status === 'busy');
  const offline = channelMembers.filter(u => u.status === 'offline');

  return (
    <div style={{
      width: 260,
      height: '100%',
      background: 'linear-gradient(180deg, #1e1b4b 0%, #1a1746 100%)',
      borderLeft: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
          👥 Μέλη ({channelMembers.length})
        </span>
        <button
          onClick={() => setShowUserPanel(false)}
          style={{
            border: 'none',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 18,
            cursor: 'pointer',
            padding: 2,
          }}
        >
          ✕
        </button>
      </div>

      {/* User list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px' }}>
        {online.length > 0 && <UserGroup label={`🟢 Online (${online.length})`} users={online} currentUserId={currentUser?.id} />}
        {away.length > 0 && <UserGroup label={`🟡 Away (${away.length})`} users={away} currentUserId={currentUser?.id} />}
        {busy.length > 0 && <UserGroup label={`🔴 Busy (${busy.length})`} users={busy} currentUserId={currentUser?.id} />}
        {offline.length > 0 && <UserGroup label={`⚫ Offline (${offline.length})`} users={offline} currentUserId={currentUser?.id} />}
      </div>
    </div>
  );
}

function UserGroup({ label, users, currentUserId }: { label: string; users: ChatUser[]; currentUserId?: string }) {
  const roleColor: Record<string, string> = {
    coordinator: '#f87171',
    supervisor: '#fbbf24',
    fleet_supervisor: '#60a5fa',
    head_rep: '#34d399',
    employee: '#94a3b8',
    viewer: '#6b7280',
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.4)',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        padding: '6px 10px 4px',
      }}>
        {label}
      </div>
      {users.map(user => (
        <div
          key={user.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '7px 10px',
            borderRadius: 8,
            transition: 'background 0.1s',
            cursor: 'default',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div style={{
            position: 'relative',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 15,
            flexShrink: 0,
          }}>
            {user.avatar}
            <div style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: user.status === 'online' ? '#22c55e'
                : user.status === 'away' ? '#eab308'
                : user.status === 'busy' ? '#ef4444'
                : '#6b7280',
              border: '2px solid #1e1b4b',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              color: '#e2e8f0',
              fontWeight: user.id === currentUserId ? 700 : 500,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.name}
              {user.id === currentUserId && (
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>(εσύ)</span>
              )}
            </div>
            <div style={{
              fontSize: 10,
              color: roleColor[user.role] ?? '#6b7280',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {user.position}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
