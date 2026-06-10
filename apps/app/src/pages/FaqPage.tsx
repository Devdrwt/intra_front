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
  {
    title: 'Agenda',
    items: [
      {
        q: 'Comment voir mes congés et formations dans mon agenda ?',
        a: (
          <>
            Ils s’affichent automatiquement dans{' '}
            <Link to="/agenda" className="font-medium text-brand-600 hover:underline">Mon agenda</Link>,
            colorés par source (congés, formations, studio, échéances, paie). Pas de ressaisie.
          </>
        ),
      },
      {
        q: 'Puis-je synchroniser mon agenda avec Google Agenda ou Outlook ?',
        a: 'Oui : dans Mon agenda, cliquez sur « S’abonner (iCal) ». Le lien se copie ; collez-le dans Google Agenda / Outlook / votre téléphone pour voir votre agenda DrwinDesk (lecture seule).',
      },
      {
        q: 'Comment créer un rendez-vous ?',
        a: 'Dans Mon agenda, bouton « Événement » : titre, date, heures (ou journée entière), lieu.',
      },
    ],
  },
  {
    title: 'Demandes & validations',
    items: [
      {
        q: 'Comment demander une permission de quelques heures ?',
        a: (
          <>
            Dans{' '}
            <Link to="/mes-demandes" className="font-medium text-brand-600 hover:underline">Mes demandes</Link>{' '}
            (onglet « Permissions »), renseignez les heures de début et de fin pour une absence
            courte (sinon laissez vide pour une journée).
          </>
        ),
      },
      {
        q: 'Où valider les congés, frais et achats de mon équipe ?',
        a: (
          <>
            Tout au même endroit dans{' '}
            <Link to="/mes-validations" className="font-medium text-brand-600 hover:underline">Mes validations</Link>{' '}
            (onglet « À valider »).
          </>
        ),
      },
      {
        q: 'Comment suivre l’avancement de ma demande ?',
        a: 'Dans Mes validations → onglet « Mes demandes » : la timeline montre les étapes (manager, RH, finance…) et qui a validé.',
      },
    ],
  },
  {
    title: 'Finance & inventaire',
    items: [
      {
        q: 'En quelle devise sont les montants ?',
        a: 'En Franc CFA (XOF), affiché « F », sans centimes.',
      },
      {
        q: 'Comment exporter les écritures pour la comptabilité ?',
        a: (
          <>
            Dans{' '}
            <Link to="/finance/comptabilite" className="font-medium text-brand-600 hover:underline">Finance → Comptabilité</Link>,
            choisissez la période et le format (CSV, FEC ou SYSCOHADA) puis « Exporter ».
          </>
        ),
      },
      {
        q: 'Comment rembourser une note de frais en Mobile Money ?',
        a: 'Dans Notes de frais, sur une note approuvée, cliquez « Rembourser » et saisissez la référence de la transaction MoMo.',
      },
      {
        q: 'Où est recensé le matériel de l’entreprise ?',
        a: (
          <>
            Dans{' '}
            <Link to="/finance/inventaire" className="font-medium text-brand-600 hover:underline">Inventaire & immobilisations</Link>{' '}
            : matériel, mobilier, véhicules… avec état, valeur, localisation et affectation.
          </>
        ),
      },
    ],
  },
  {
    title: 'Assistant IA',
    items: [
      {
        q: 'Que peut faire l’assistant IA ?',
        a: (
          <>
            Dans{' '}
            <Link to="/assistant" className="font-medium text-brand-600 hover:underline">Assistant IA</Link>{' '}
            : générer des brouillons (contrat, attestation, rapport, lettre) et répondre à vos
            questions. Chaque document généré est un <strong>brouillon à vérifier</strong>.
          </>
        ),
      },
      {
        q: 'Le contrat est-il pré-rempli avec les vraies informations de l’employé ?',
        a: 'Oui : pour un contrat ou une attestation, sélectionnez l’employé concerné. Le document est rédigé avec ses informations réelles (poste, date d’embauche…) au lieu de laisser des crochets.',
      },
      {
        q: 'L’assistant a-t-il accès à mes données ?',
        a: 'Il n’utilise que les données que vous fournissez et auxquelles vous avez accès. La clé de l’IA reste côté serveur, jamais exposée dans le navigateur.',
      },
    ],
  },
  {
    title: 'Application mobile',
    items: [
      {
        q: 'Comment installer DrwinDesk sur mon téléphone ?',
        a: 'Ouvrez le site dans votre navigateur mobile, puis « Ajouter à l’écran d’accueil ». L’app s’ouvre en plein écran, avec une barre d’actions en bas.',
      },
      {
        q: 'Le pointage fonctionne-t-il sans réseau ?',
        a: 'Oui. Hors-ligne, votre pointage est enregistré localement puis synchronisé automatiquement dès le retour de la connexion.',
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
