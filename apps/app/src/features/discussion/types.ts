export type ConversationType = 'COMPANY' | 'DIRECT' | 'GROUP';

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  title: string;
  avatar: { userId: string; hasAvatar: boolean } | null;
  lastMessage: { body: string; authorName: string; createdAt: string } | null;
  updatedAt: string;
  participantsCount: number;
}

export interface Contact {
  id: string;
  name: string;
  hasAvatar: boolean;
}

export interface MessageAuthor {
  id: string;
  name: string;
  hasAvatar: boolean;
}

export interface MessageAttachment {
  name: string;
  size: number;
  type: string;
}

export interface Message {
  id: string;
  author: MessageAuthor;
  body: string;
  attachment?: MessageAttachment;
  createdAt: string;
}

export interface MessageInput {
  body: string;
  attachmentKey?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
}

export interface AttachmentRef {
  key: string;
  name: string;
  size: number;
  type: string;
}
