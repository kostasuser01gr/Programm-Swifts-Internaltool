import { useNavigate } from 'react-router';
import { useChatStore } from '../../store/chatStore';
import { ChatLogin } from './ChatLogin';
import { ChatApp } from './ChatApp';

export default function ChatPage() {
  const { currentUser } = useChatStore();
  const navigate = useNavigate();

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#0f0d2e',
    }}>
      {/* Back to main app button */}
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'fixed',
          top: 12,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 14px',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(15,13,46,0.9)',
          backdropFilter: 'blur(10px)',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
          e.currentTarget.style.color = '#fff';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(15,13,46,0.9)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
        }}
      >
        ← Πρόγραμμα Βαρδιών
      </button>

      {currentUser ? <ChatApp /> : <ChatLogin />}
    </div>
  );
}
