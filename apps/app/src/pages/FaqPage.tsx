import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, LifeBuoy } from 'lucide-react';
import { Card, cn } from '@drwindesk/ui';

interface QA {
  q: string;
  a: React.ReactNode;
}
interface Category {
  title: string;
  items: QA[];
}

const FAQ: Category[] = [
  {
    title: 'Connexion & compte',
    items: [
      {
        q: 'Quel est mon identifiant de connexion ?',
        a: "Renseignez l'organisation (ex. « drwintech »), votre email professionnel et votre mot de passe.",
      },
      {
        q: 'Je n’ai pas encore de mot de passe.',
        a: 'À votre invitation, vous recevez un email avec un lien pour définir votre mot de passe, puis vous pouvez vous connecter.',
      },
      {
        q: 'Pourquoi mon email est-il refusé à la connexion ?',
        a: 'Chaque organisation autorise certains domaines d’email. Si le vôtre n’est pas autorisé, contactez un administrateur pour l’ajouter.',
      },
    ],
  },
  {
    title: 'Utilisation',
    items: [
      {
        q: 'Comment naviguer rapidement ?',
        a: (
          <>
            Appuyez sur{' '}
            <kbd className="rounded-md border border-surface-border bg-surface px-1.5 text-[11px]">
              ⌘K
            </kbd>{' '}
            (ou Ctrl+K) pour ouvrir la recherche et accéder à n’importe quelle page ou action.
          </>
        ),
      },
      {
        q: 'Comment passer en mode sombre ?',
        a: (
          <>
            Via l’icône lune/soleil en haut à droite, ou dans{' '}
            <Link to="/parametres" className="font-medium text-brand-600 hover:underline">
              Paramètres → Apparence
            </Link>
            . Votre choix est mémorisé.
          </>
        ),
      },
      {
        q: 'Puis-je replier la barre latérale ?',
        a: 'Oui, avec le bouton « Replier » en bas de la barre. L’état est conservé.',
      },
    ],
  },
  {
    title: 'Modules',
    items: [
      {
        q: 'Où sont stockés les documents d’un employé ?',
        a: (
          <>
            Dans le module{' '}
            <Link to="/documents" className="font-medium text-brand-600 hover:underline">
              Documents & Contrats
            </Link>{' '}
            (ou directement depuis la fiche RH du collaborateur).
          </>
        ),
      },
      {
        q: 'Comment inviter un nouveau collaborateur ?',
        a: (
          <>
            Dans{' '}
            <Link to="/utilisateurs" className="font-medium text-brand-600 hover:underline">
              Utilisateurs & accès
            </Link>
            , cliquez sur « Inviter », renseignez l’email et les rôles. La personne reçoit un lien
            d’invitation.
          </>
        ),
      },
      {
        q: 'Que signifie le « taux » dans la consolidation des rapports ?',
        a: 'C’est le rapport entre les rapports soumis et le nombre attendu (collaborateurs actifs × jours de la période).',
      },
    ],
  },
];

function FaqItem({ item }: { item: QA }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-surface-border last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-ink">{item.q}</span>
        <ChevronDown
          size={18}
          className={cn('shrink-0 text-ink-subtle transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="pb-4 text-sm leading-relaxed text-ink-muted">{item.a}</div>}
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Foire aux questions</h2>
        <p className="text-ink-muted">Les réponses aux questions les plus fréquentes.</p>
      </header>

      {FAQ.map((cat) => (
        <Card key={cat.title} className="p-0">
          <div className="border-b border-surface-border px-5 py-3">
            <h3 className="text-sm font-semibold text-ink">{cat.title}</h3>
          </div>
          <div className="px-5">
            {cat.items.map((item) => (
              <FaqItem key={item.q} item={item} />
            ))}
          </div>
        </Card>
      ))}

      <Card className="flex items-center gap-3 bg-brand-soft">
        <LifeBuoy size={20} className="text-brand-soft-fg" />
        <p className="text-sm text-brand-soft-fg">
          Vous ne trouvez pas votre réponse ? Contactez un administrateur de votre organisation.
        </p>
      </Card>
    </div>
  );
}
