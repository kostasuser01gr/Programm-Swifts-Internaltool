import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatUser, Channel, Message, TypingIndicator, RolePermissions } from '../types/chat';
import { ROLE_PERMISSIONS } from '../types/chat';
import { CHAT_USERS, DEFAULT_CHANNELS, SAMPLE_MESSAGES } from '../data/chatData';

// ─── Store State ─────────────────────────────────────────────

interface ChatState {
  // Auth
  currentUser: ChatUser | null;
  users: ChatUser[];

  // Channels & messages
  channels: Channel[];
  messages: Message[];
  activeChannelId: string | null;

  // UI state
  typingIndicators: TypingIndicator[];
  searchQuery: string;
  showUserPanel: boolean;
  showChannelCreate: boolean;

  // Computed helpers
  getPermissions: () => RolePermissions | null;
  getActiveChannel: () => Channel | null;
  getChannelMessages: (channelId: string) => Message[];
  getUserById: (userId: string) => ChatUser | undefined;
  getVisibleChannels: () => Channel[];
  getUnreadTotal: () => number;

  // Actions
  login: (userId: string) => void;
  logout: () => void;
  setActiveChannel: (channelId: string) => void;
  sendMessage: (content: string, replyToId?: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  pinMessage: (messageId: string) => void;
  markChannelRead: (channelId: string) => void;
  toggleMuteChannel: (channelId: string) => void;
  togglePinChannel: (channelId: string) => void;
  setSearchQuery: (query: string) => void;
  setShowUserPanel: (show: boolean) => void;
  setShowChannelCreate: (show: boolean) => void;
  createChannel: (name: string, description: string, type: Channel['type'], memberIds: string[]) => void;
  updateUserStatus: (status: ChatUser['status']) => void;
  setTyping: (channelId: string) => void;
  clearTyping: (userId: string, channelId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: CHAT_USERS,
      channels: DEFAULT_CHANNELS,
      messages: SAMPLE_MESSAGES,
      activeChannelId: null,
      typingIndicators: [],
      searchQuery: '',
      showUserPanel: false,
      showChannelCreate: false,

      // ─── Computed ────────────────────────────────────────

      getPermissions: () => {
        const user = get().currentUser;
        return user ? ROLE_PERMISSIONS[user.role] : null;
      },

      getActiveChannel: () => {
        const { channels, activeChannelId } = get();
        return channels.find(c => c.id === activeChannelId) ?? null;
      },

      getChannelMessages: (channelId: string) => {
        return get().messages
          .filter(m => m.channelId === channelId && !m.isDeleted)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      },

      getUserById: (userId: string) => {
        return get().users.find(u => u.id === userId);
      },

      getVisibleChannels: () => {
        const { currentUser, channels } = get();
        if (!currentUser) return [];
        return channels.filter(ch => ch.members.includes(currentUser.id));
      },

      getUnreadTotal: () => {
        const visible = get().getVisibleChannels();
        return visible.reduce((sum, ch) => sum + ch.unreadCount, 0);
      },

      // ─── Actions ─────────────────────────────────────────

      login: (userId: string) => {
        const user = get().users.find(u => u.id === userId);
        if (user) {
          set({
            currentUser: { ...user, status: 'online' },
            activeChannelId: 'ch-general',
          });
          // Update user status in users list
          set(state => ({
            users: state.users.map(u =>
              u.id === userId ? { ...u, status: 'online' as const, lastSeen: new Date().toISOString() } : u
            ),
          }));
        }
      },

      logout: () => {
        const { currentUser } = get();
        if (currentUser) {
          set(state => ({
            users: state.users.map(u =>
              u.id === currentUser.id ? { ...u, status: 'offline' as const, lastSeen: new Date().toISOString() } : u
            ),
            currentUser: null,
            activeChannelId: null,
          }));
        }
      },

      setActiveChannel: (channelId: string) => {
        set({ activeChannelId: channelId });
        get().markChannelRead(channelId);
      },

      sendMessage: (content: string, replyToId?: string) => {
        const { currentUser, activeChannelId, users } = get();
        if (!currentUser || !activeChannelId || !content.trim()) return;

        // Extract @mentions
        const mentionMatches = content.match(/@([^\s@]+(?:\s[^\s@]+)?)/g) || [];
        const mentionedUserIds = mentionMatches
          .map(m => m.slice(1)) // remove @
          .map(name => users.find(u => u.name === name)?.id)
          .filter((id): id is string => !!id);

        const msg: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          channelId: activeChannelId,
          senderId: currentUser.id,
          content: content.trim(),
          timestamp: new Date().toISOString(),
          replyToId,
          mentions: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
          reactions: [],
          attachments: [],
          isPinned: false,
          isDeleted: false,
          readBy: [currentUser.id],
          type: 'text',
        };

        // If replying, update root message thread count
        let updatedMessages = [...get().messages];
        if (replyToId) {
          msg.threadId = replyToId;
          updatedMessages = updatedMessages.map(m =>
            m.id === replyToId
              ? {
                  ...m,
                  threadReplyCount: (m.threadReplyCount || 0) + 1,
                  threadLastReplyAt: msg.timestamp,
                }
              : m
          );
        }

        set(state => ({
          messages: [...updatedMessages, msg],
          channels: state.channels.map(ch =>
            ch.id === activeChannelId
              ? { ...ch, lastMessageAt: msg.timestamp, unreadCount: 0 }
              : ch
          ),
        }));
      },

      editMessage: (messageId: string, newContent: string) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId && m.senderId === currentUser.id
              ? { ...m, content: newContent, editedAt: new Date().toISOString() }
              : m
          ),
        }));
      },

      deleteMessage: (messageId: string) => {
        const { currentUser, getPermissions } = get();
        if (!currentUser) return;
        const perms = getPermissions();
        set(state => ({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m;
            // Can delete own messages or any message with permission
            if (m.senderId === currentUser.id || perms?.canDeleteAnyMessage) {
              return { ...m, isDeleted: true, content: '🗑️ Μήνυμα διαγράφηκε' };
            }
            return m;
          }),
        }));
      },

      toggleReaction: (messageId: string, emoji: string) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set(state => ({
          messages: state.messages.map(m => {
            if (m.id !== messageId) return m;
            const existing = m.reactions.find(r => r.emoji === emoji);
            let newReactions;
            if (existing) {
              if (existing.users.includes(currentUser.id)) {
                // Remove reaction
                const filtered = existing.users.filter(uid => uid !== currentUser.id);
                newReactions = filtered.length > 0
                  ? m.reactions.map(r => r.emoji === emoji ? { ...r, users: filtered } : r)
                  : m.reactions.filter(r => r.emoji !== emoji);
              } else {
                // Add to existing
                newReactions = m.reactions.map(r =>
                  r.emoji === emoji ? { ...r, users: [...r.users, currentUser.id] } : r
                );
              }
            } else {
              newReactions = [...m.reactions, { emoji, users: [currentUser.id] }];
            }
            return { ...m, reactions: newReactions };
          }),
        }));
      },

      pinMessage: (messageId: string) => {
        const perms = get().getPermissions();
        if (!perms?.canPinMessages) return;
        set(state => ({
          messages: state.messages.map(m =>
            m.id === messageId ? { ...m, isPinned: !m.isPinned } : m
          ),
        }));
      },

      markChannelRead: (channelId: string) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === channelId ? { ...ch, unreadCount: 0 } : ch
          ),
          messages: state.messages.map(m =>
            m.channelId === channelId && !m.readBy.includes(currentUser.id)
              ? { ...m, readBy: [...m.readBy, currentUser.id] }
              : m
          ),
        }));
      },

      toggleMuteChannel: (channelId: string) => {
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === channelId ? { ...ch, isMuted: !ch.isMuted } : ch
          ),
        }));
      },

      togglePinChannel: (channelId: string) => {
        set(state => ({
          channels: state.channels.map(ch =>
            ch.id === channelId ? { ...ch, isPinned: !ch.isPinned } : ch
          ),
        }));
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setShowUserPanel: (show: boolean) => set({ showUserPanel: show }),
      setShowChannelCreate: (show: boolean) => set({ showChannelCreate: show }),

      createChannel: (name: string, description: string, type: Channel['type'], memberIds: string[]) => {
        const { currentUser } = get();
        if (!currentUser) return;

        const newChannel: Channel = {
          id: `ch-${Date.now()}`,
          name,
          description,
          type,
          icon: type === 'private' ? '🔒' : type === 'announcement' ? '📢' : '💬',
          members: [...new Set([currentUser.id, ...memberIds])],
          admins: [currentUser.id],
          createdBy: currentUser.id,
          createdAt: new Date().toISOString(),
          lastMessageAt: new Date().toISOString(),
          isPinned: false,
          isMuted: false,
          unreadCount: 0,
        };

        // System message
        const sysMsg: Message = {
          id: `msg-sys-${Date.now()}`,
          channelId: newChannel.id,
          senderId: currentUser.id,
          content: `📌 Κανάλι "${name}" δημιουργήθηκε από ${currentUser.name}`,
          timestamp: new Date().toISOString(),
          reactions: [],
          attachments: [],
          isPinned: false,
          isDeleted: false,
          readBy: [currentUser.id],
          type: 'system',
        };

        set(state => ({
          channels: [...state.channels, newChannel],
          messages: [...state.messages, sysMsg],
          activeChannelId: newChannel.id,
          showChannelCreate: false,
        }));
      },

      updateUserStatus: (status: ChatUser['status']) => {
        const { currentUser } = get();
        if (!currentUser) return;
        set(state => ({
          currentUser: { ...currentUser, status },
          users: state.users.map(u =>
            u.id === currentUser.id ? { ...u, status, lastSeen: new Date().toISOString() } : u
          ),
        }));
      },

      setTyping: (channelId: string) => {
        const { currentUser } = get();
        if (!currentUser) return;
        const indicator: TypingIndicator = {
          userId: currentUser.id,
          channelId,
          timestamp: Date.now(),
        };
        set(state => ({
          typingIndicators: [
            ...state.typingIndicators.filter(t => !(t.userId === currentUser.id && t.channelId === channelId)),
            indicator,
          ],
        }));
        // Auto-clear after 3s
        setTimeout(() => get().clearTyping(currentUser.id, channelId), 3000);
      },

      clearTyping: (userId: string, channelId: string) => {
        set(state => ({
          typingIndicators: state.typingIndicators.filter(t => !(t.userId === userId && t.channelId === channelId)),
        }));
      },
    }),
    {
      name: 'shift-chat-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        channels: state.channels,
        messages: state.messages,
        activeChannelId: state.activeChannelId,
      }),
    }
  )
);
