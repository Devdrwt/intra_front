import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'DrwinDesk — Drwintech',
    template: '%s · DrwinDesk',
  },
  description:
    "Plateforme RH, documents et reporting de Drwintech. Centraliser ce qui était dispersé, automatiser ce qui était répétitif.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
