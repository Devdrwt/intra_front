export interface MessageAuthor {
  id: string;
  name: string;
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
