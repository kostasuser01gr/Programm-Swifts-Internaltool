import { useChatStore } from '../../store/chatStore';
import { ChatSidebar } from './ChatSidebar';
import { ChatMain } from './ChatMain';
import { UserListPanel } from './UserListPanel';

export function ChatApp() {
  const { currentUser } = useChatStore();

  if (!currentUser) return null;

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <ChatSidebar />
      <ChatMain />
      <UserListPanel />
    </div>
  );
}
