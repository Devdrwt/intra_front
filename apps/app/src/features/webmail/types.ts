export interface MailAccount {
  id: string;
  label: string;
  email: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
}

export interface SaveAccountInput {
  label?: string;
  email: string;
  password: string;
  imapHost?: string;
  imapPort?: number;
  smtpHost?: string;
  smtpPort?: number;
}

export interface MailListItem {
  uid: number;
  from: { name: string; address: string } | null;
  subject: string;
  date: string | null;
  seen: boolean;
}

export interface MailAttachment {
  index: number;
  filename: string;
  contentType: string;
  size: number;
}

export interface MailMessage {
  uid: number;
  from: string | null;
  to: string | null;
  subject: string;
  date: string | null;
  html: string | null;
  text: string | null;
  attachments: MailAttachment[];
}

export interface SendInput {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}
