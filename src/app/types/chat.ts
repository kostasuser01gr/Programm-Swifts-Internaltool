// ─── Chat Types ──────────────────────────────────────────────

export type UserRole =
  | 'coordinator'      // Συντονιστής – full control
  | 'supervisor'       // Επόπτης – manage channels, pin, moderate
  | 'fleet_supervisor'  // Επόπτης Στόλου – moderate fleet channels
  | 'head_rep'         // Head Rep – moderate own channels
  | 'employee'         // Υπάλληλος – basic chat
  | 'washer'           // Πλύντης – wash queue + limited chat
  | 'viewer';          // Read-only guest

export interface ChatUser {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;       // emoji or initials
  status: 'online' | 'away' | 'busy' | 'offline';
  group: 'ΟΜΑΔΑ Α' | 'ΟΜΑΔΑ Β' | 'Διοίκηση';
  position: string;     // human-readable title
  lastSeen: string;
}

export interface Reaction {
  emoji: string;
  users: string[];       // user IDs
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'link';
  url: string;
  size?: number;
  preview?: string;
}

export interface Message {
  id: string;
  channelId: string;
  senderId: string;
  content: string;
  timestamp: string;
  editedAt?: string;
  replyToId?: string;    // threaded replies
  threadId?: string;     // root message ID if this is a thread reply
  threadReplyCount?: number;  // count of replies (only on root)
  threadLastReplyAt?: string; // timestamp of last reply (only on root)
  mentions?: string[];   // mentioned user IDs
  reactions: Reaction[];
  attachments: MessageAttachment[];
  isPinned: boolean;
  isDeleted: boolean;
  readBy: string[];
  type: 'text' | 'system' | 'announcement';
}

export type ChannelType = 'public' | 'private' | 'direct' | 'announcement';

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  icon: string;
  members: string[];
  admins: string[];
  createdBy: string;
  createdAt: string;
  lastMessageAt: string;
  isPinned: boolean;
  isMuted: boolean;
  unreadCount: number;
  allowedRoles?: UserRole[]; // Who can read (omit = everyone with membership)
}

export interface TypingIndicator {
  userId: string;
  channelId: string;
  timestamp: number;
}

// ─── Role Permissions ────────────────────────────────────────

export interface RolePermissions {
  canCreatePublicChannel: boolean;
  canCreatePrivateChannel: boolean;
  canCreateAnnouncement: boolean;
  canDeleteAnyMessage: boolean;
  canPinMessages: boolean;
  canMuteUsers: boolean;
  canEditChannelInfo: boolean;
  canRemoveMembers: boolean;
  canViewAuditLog: boolean;
  canBroadcast: boolean;          // send to all channels
  canManageRoles: boolean;
  canArchiveChannels: boolean;
  // Extended permissions
  canKickUsers: boolean;
  canSuspendUsers: boolean;
  canResetPin: boolean;
  canForceLogout: boolean;
  canManageFleet: boolean;
  canManageWashQueue: boolean;
  canImportReservations: boolean;
  canUseNLCommands: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canAccessWasherApp: boolean;
  canManageSchedule: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  coordinator: {
    canCreatePublicChannel: true,
    canCreatePrivateChannel: true,
    canCreateAnnouncement: true,
    canDeleteAnyMessage: true,
    canPinMessages: true,
    canMuteUsers: true,
    canEditChannelInfo: true,
    canRemoveMembers: true,
    canViewAuditLog: true,
    canBroadcast: true,
    canManageRoles: true,
    canArchiveChannels: true,
    canKickUsers: true,
    canSuspendUsers: true,
    canResetPin: true,
    canForceLogout: true,
    canManageFleet: true,
    canManageWashQueue: true,
    canImportReservations: true,
    canUseNLCommands: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canAccessWasherApp: true,
    canManageSchedule: true,
  },
  supervisor: {
    canCreatePublicChannel: true,
    canCreatePrivateChannel: true,
    canCreateAnnouncement: true,
    canDeleteAnyMessage: true,
    canPinMessages: true,
    canMuteUsers: true,
    canEditChannelInfo: true,
    canRemoveMembers: true,
    canViewAuditLog: true,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: true,
    canKickUsers: true,
    canSuspendUsers: false,
    canResetPin: true,
    canForceLogout: true,
    canManageFleet: true,
    canManageWashQueue: true,
    canImportReservations: true,
    canUseNLCommands: true,
    canViewAnalytics: true,
    canManageSettings: false,
    canAccessWasherApp: true,
    canManageSchedule: true,
  },
  fleet_supervisor: {
    canCreatePublicChannel: true,
    canCreatePrivateChannel: true,
    canCreateAnnouncement: false,
    canDeleteAnyMessage: true,
    canPinMessages: true,
    canMuteUsers: false,
    canEditChannelInfo: true,
    canRemoveMembers: false,
    canViewAuditLog: false,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: false,
    canKickUsers: false,
    canSuspendUsers: false,
    canResetPin: false,
    canForceLogout: false,
    canManageFleet: true,
    canManageWashQueue: true,
    canImportReservations: false,
    canUseNLCommands: true,
    canViewAnalytics: true,
    canManageSettings: false,
    canAccessWasherApp: true,
    canManageSchedule: false,
  },
  head_rep: {
    canCreatePublicChannel: false,
    canCreatePrivateChannel: true,
    canCreateAnnouncement: false,
    canDeleteAnyMessage: false,
    canPinMessages: true,
    canMuteUsers: false,
    canEditChannelInfo: false,
    canRemoveMembers: false,
    canViewAuditLog: false,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: false,
    canKickUsers: false,
    canSuspendUsers: false,
    canResetPin: false,
    canForceLogout: false,
    canManageFleet: false,
    canManageWashQueue: false,
    canImportReservations: false,
    canUseNLCommands: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canAccessWasherApp: false,
    canManageSchedule: false,
  },
  employee: {
    canCreatePublicChannel: false,
    canCreatePrivateChannel: true,
    canCreateAnnouncement: false,
    canDeleteAnyMessage: false,
    canPinMessages: false,
    canMuteUsers: false,
    canEditChannelInfo: false,
    canRemoveMembers: false,
    canViewAuditLog: false,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: false,
    canKickUsers: false,
    canSuspendUsers: false,
    canResetPin: false,
    canForceLogout: false,
    canManageFleet: false,
    canManageWashQueue: false,
    canImportReservations: false,
    canUseNLCommands: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canAccessWasherApp: false,
    canManageSchedule: false,
  },
  washer: {
    canCreatePublicChannel: false,
    canCreatePrivateChannel: false,
    canCreateAnnouncement: false,
    canDeleteAnyMessage: false,
    canPinMessages: false,
    canMuteUsers: false,
    canEditChannelInfo: false,
    canRemoveMembers: false,
    canViewAuditLog: false,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: false,
    canKickUsers: false,
    canSuspendUsers: false,
    canResetPin: false,
    canForceLogout: false,
    canManageFleet: false,
    canManageWashQueue: true,
    canImportReservations: false,
    canUseNLCommands: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canAccessWasherApp: true,
    canManageSchedule: false,
  },
  viewer: {
    canCreatePublicChannel: false,
    canCreatePrivateChannel: false,
    canCreateAnnouncement: false,
    canDeleteAnyMessage: false,
    canPinMessages: false,
    canMuteUsers: false,
    canEditChannelInfo: false,
    canRemoveMembers: false,
    canViewAuditLog: false,
    canBroadcast: false,
    canManageRoles: false,
    canArchiveChannels: false,
    canKickUsers: false,
    canSuspendUsers: false,
    canResetPin: false,
    canForceLogout: false,
    canManageFleet: false,
    canManageWashQueue: false,
    canImportReservations: false,
    canUseNLCommands: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canAccessWasherApp: false,
    canManageSchedule: false,
  },
};
