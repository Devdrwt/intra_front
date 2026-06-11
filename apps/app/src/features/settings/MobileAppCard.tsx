import { Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardDescription, CardTitle } from '@drwindesk/ui';

/** Carte « Application mobile » : QR code vers l'app (PWA installable). */
export function MobileAppCard() {
  const url = typeof window !== 'undefined' ? window.location.origin : 'https://app.drwintech.com';

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Smartphone size={18} className="text-ink-subtle" />
        <CardTitle>Application mobile</CardTitle>
      </div>
      <CardDescription>
        Scannez ce QR code avec votre téléphone pour ouvrir DrwinDesk et l’installer comme
        application.
      </CardDescription>
      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row">
        <div className="shrink-0 rounded-xl border border-surface-border bg-white p-3">
          <QRCodeSVG value={url} size={132} bgColor="#ffffff" fgColor="#312e81" level="M" />
        </div>
        <div className="text-sm text-ink-muted">
          <ol className="list-decimal space-y-1 pl-4">
            <li>Ouvrez l’appareil photo (ou un lecteur de QR code).</li>
            <li>Scannez le code → le lien s’ouvre dans le navigateur.</li>
            <li>
              Menu du navigateur → <strong>« Ajouter à l’écran d’accueil »</strong> pour l’installer.
            </li>
          </ol>
          <p className="mt-2 break-all text-xs text-ink-subtle">{url}</p>
        </div>
      </div>
    </Card>
  );
}
