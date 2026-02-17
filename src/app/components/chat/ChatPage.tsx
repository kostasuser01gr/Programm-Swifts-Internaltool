import { useNavigate } from 'react-router';
import { useChatStore } from '../../store/chatStore';
import { ChatLogin } from './ChatLogin';
import { ChatApp } from './ChatApp';

export default function ChatPage() {
  const { currentUser } = useChatStore();
  const navigate = useNavigate();

  return (
    <div className="w-full h-screen overflow-hidden relative bg-[oklch(0.15_0.04_270)]  dark:bg-[oklch(0.15_0.04_270)]">
      {/* Back to main app button */}
      <button
        onClick={() => navigate('/')}
        aria-label="Επιστροφή στο πρόγραμμα βαρδιών"
        className="fixed top-3 right-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-white/12 bg-[oklch(0.15_0.04_270/0.9)] backdrop-blur-[10px] text-white/70 text-xs font-semibold cursor-pointer transition-all duration-150 hover:bg-indigo-500/20 hover:text-white focus-visible:outline-2 focus-visible:outline-indigo-400 focus-visible:outline-offset-2"
      >
        ← Πρόγραμμα Βαρδιών
      </button>

      {currentUser ? <ChatApp /> : <ChatLogin />}
    </div>
  );
}
