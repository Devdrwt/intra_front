import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button, Callout, Card, CardDescription, CardTitle } from '@drwindesk/ui';
import { apiErrorMessage } from '@/lib/api';
import { toast } from '@/lib/toast';
import { disablePush, enablePush, isPushEnabled, pushSupported } from '@/lib/push';

export function NotificationsCard() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const supported = pushSupported();

  useEffect(() => {
    void isPushEnabled().then(setEnabled);
  }, []);

  const toggle = async () => {
    setBusy(true);
    try {
      if (enabled) {
        await disablePush();
        setEnabled(false);
        toast.success('Notifications désactivées sur cet appareil');
      } else {
        await enablePush();
        setEnabled(true);
        toast.success('Notifications activées');
      }
    } catch (e) {
      toast.error(apiErrorMessage(e, 'Action impossible.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Bell size={18} className="text-ink-subtle" />
        <CardTitle>Notifications</CardTitle>
      </div>
      <CardDescription>
        Recevez les alertes et messages sur cet appareil — même l’application fermée.
      </CardDescription>

      {!supported ? (
        <Callout tone="info" className="mt-4">
          Cet appareil ou navigateur ne prend pas en charge les notifications push. Sur iPhone,
          installez d’abord l’app (Partager → « Sur l’écran d’accueil »).
        </Callout>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <Button variant={enabled ? 'secondary' : 'primary'} onClick={() => void toggle()} loading={busy}>
            {enabled ? (
              <>
                <BellOff size={16} /> Désactiver
              </>
            ) : (
              <>
                <Bell size={16} /> Activer les notifications
              </>
            )}
          </Button>
          <span className="text-sm text-ink-subtle">
            {enabled ? 'Activées sur cet appareil' : 'Désactivées'}
          </span>
        </div>
      )}
    </Card>
  );
}
