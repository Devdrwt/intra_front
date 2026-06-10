import { useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bot, FileSignature, Send, Sparkles } from 'lucide-react';
import { Button, Callout, Card, CardTitle, Select, Spinner, Textarea, cn } from '@drwindesk/ui';
import { useEmployes } from '@/features/rh/hooks';
import { fullName } from '@/features/rh/helpers';
import { assistantService } from './service';

export function AssistantPage() {
  const [tab, setTab] = useState<'generer' | 'chat'>('generer');

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-bold tracking-tight text-ink">Assistant IA</h2>
        <p className="text-ink-muted">Génère des documents (contrats, rapports…) et répond à vos questions.</p>
      </header>

      <Callout tone="warning">
        Contenu généré par IA — toujours <strong>à vérifier</strong> avant validation. Réponses limitées
        aux données auxquelles vous avez accès.
      </Callout>

      <div className="flex gap-2 border-b border-surface-border">
        <Tab active={tab === 'generer'} onClick={() => setTab('generer')} label="Générer un document" />
        <Tab active={tab === 'chat'} onClick={() => setTab('chat')} label="Assistant" />
      </div>

      {tab === 'generer' ? <GenererTab /> : <ChatTab />}
    </div>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors', active ? 'border-brand-500 text-brand-700' : 'border-transparent text-ink-muted hover:text-ink')}
    >
      {label}
    </button>
  );
}

function GenererTab() {
  const { data: modeles } = useQuery({ queryKey: ['ai', 'modeles'], queryFn: assistantService.modeles });
  const [modeleId, setModeleId] = useState('');
  const [employeId, setEmployeId] = useState('');
  const generer = useMutation({
    mutationFn: (args: { modeleId: string; donnees?: Record<string, unknown> }) =>
      assistantService.generer(args.modeleId, args.donnees),
  });

  const modele = (modeles ?? []).find((m) => m.id === modeleId);
  const besoinEmploye = modele?.type === 'CONTRAT' || modele?.type === 'ATTESTATION';
  // Liste RH (pour pré-remplir un contrat/attestation). Vide si l'utilisateur n'a pas le droit.
  const { data: employes } = useEmployes({});

  const onGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (!modeleId) return;
    let donnees: Record<string, unknown> | undefined;
    if (besoinEmploye && employeId) {
      const emp = employes?.find((x) => x.id === employeId);
      if (emp) {
        donnees = {
          nom: emp.nom,
          prenom: emp.prenom,
          poste: emp.poste,
          departement: emp.departement,
          typeContrat: emp.typeContrat,
          dateEmbauche: emp.dateEmbauche,
          email: emp.email,
          matricule: emp.matricule,
        };
      }
    }
    generer.mutate({ modeleId, donnees });
  };

  return (
    <div className="space-y-4">
      <Card>
        <form onSubmit={onGenerate} className="flex flex-wrap items-end gap-3">
          <Select
            id="modele"
            label="Modèle / canvas"
            value={modeleId}
            onChange={(e) => {
              setModeleId(e.target.value);
              setEmployeId('');
            }}
            placeholder="Choisir un modèle…"
            options={(modeles ?? []).map((m) => ({ value: m.id, label: m.nom }))}
            className="min-w-[220px] flex-1"
          />
          {besoinEmploye && (
            <Select
              id="employe"
              label="Pour quel employé ? (optionnel)"
              value={employeId}
              onChange={(e) => setEmployeId(e.target.value)}
              placeholder="— pré-remplir depuis une fiche —"
              options={(employes ?? []).map((x) => ({ value: x.id, label: fullName(x) }))}
              className="min-w-[200px] flex-1"
            />
          )}
          <Button type="submit" loading={generer.isPending} disabled={!modeleId}>
            <Sparkles size={16} /> Générer
          </Button>
        </form>
      </Card>

      {generer.isPending && (
        <Card className="flex items-center gap-2 text-ink-muted"><Spinner /> Génération en cours…</Card>
      )}
      {generer.data && (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <CardTitle>Brouillon généré</CardTitle>
            <span className="flex items-center gap-1 text-xs text-ink-subtle"><FileSignature size={13} /> {generer.data.modelIa}</span>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-sm text-ink-muted">{generer.data.contenu}</pre>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => generer.reset()}>Rejeter</Button>
            <Button>Valider & classer en GED</Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function ChatTab() {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [input, setInput] = useState('');
  const ask = useMutation({
    mutationFn: (q: string) => assistantService.assistant(q),
    onSuccess: (answer) => setMessages((m) => [...m, { role: 'ai', content: answer }]),
  });

  const onSend = (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setInput('');
    ask.mutate(q);
  };

  return (
    <div className="space-y-3">
      <Card className="min-h-[200px] space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center gap-2 text-sm text-ink-subtle"><Bot size={18} /> Posez une question (ex. « Résume le dernier rapport mensuel »).</div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('max-w-[85%] rounded-2xl px-3 py-2 text-sm', m.role === 'user' ? 'ml-auto bg-brand-soft text-brand-soft-fg' : 'bg-surface-muted text-ink')}>
            <p className="whitespace-pre-wrap">{m.content}</p>
          </div>
        ))}
        {ask.isPending && <div className="flex items-center gap-2 text-sm text-ink-muted"><Spinner /> …</div>}
      </Card>
      <form onSubmit={onSend} className="flex items-end gap-2">
        <Textarea id="q" label="" rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Votre question…" className="flex-1" />
        <Button type="submit" loading={ask.isPending} disabled={!input.trim()}><Send size={16} /></Button>
      </form>
    </div>
  );
}
