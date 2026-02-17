import { useState } from 'react';
import { useChatStore } from '../../store/chatStore';
import type { ChatUser } from '../../types/chat';

export function ChatLogin() {
  const { users, login } = useChatStore();
  const [search, setSearch] = useState('');
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.position.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, ChatUser[]> = {};
  for (const u of filtered) {
    const g = u.group;
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(u);
  }

  const roleColor: Record<string, string> = {
    coordinator: '#dc2626',
    supervisor: '#f59e0b',
    fleet_supervisor: '#2563eb',
    head_rep: '#059669',
    employee: '#6b7280',
    viewer: '#9ca3af',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.12)',
        padding: 32,
        boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>💬</div>
          <h1 style={{ color: '#fff', fontSize: 26, fontWeight: 700, margin: 0 }}>
            Station Chat
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '8px 0 0' }}>
            Επιλέξτε χρήστη για είσοδο
          </p>
        </div>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Αναζήτηση υπαλλήλου..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
            marginBottom: 20,
          }}
        />

        <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
          {Object.entries(grouped).map(([group, members]) => (
            <div key={group} style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                padding: '0 8px',
                marginBottom: 8,
              }}>
                {group} ({members.length})
              </div>
              {members.map(user => (
                <button
                  key={user.id}
                  onClick={() => login(user.id)}
                  onMouseEnter={() => setHoveredId(user.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 12,
                    border: 'none',
                    background: hoveredId === user.id
                      ? 'rgba(255,255,255,0.12)'
                      : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    flexShrink: 0,
                  }}>
                    {user.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: 14,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.name}
                    </div>
                    <div style={{
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 12,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {user.position}
                    </div>
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#fff',
                    background: roleColor[user.role] ?? '#6b7280',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                    {user.role === 'coordinator' ? 'COORD'
                      : user.role === 'supervisor' ? 'SUP'
                      : user.role === 'fleet_supervisor' ? 'FLEET'
                      : user.role === 'head_rep' ? 'HEAD'
                      : 'STAFF'}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
