'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, CardTitle, CardDescription, Input, Textarea } from '@drwindesk/ui';
import { postPublic, presignAndUpload, UPLOADS_ENABLED } from '@/lib/api';

interface Form {
  nom: string;
  email: string;
  telephone: string;
  poste: string;
  message: string;
}
const EMPTY: Form = { nom: '', email: '', telephone: '', poste: '', message: '' };

export function CandidatureForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [cv, setCv] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      // tenantSlug omis → le backend cible "drwintech" par défaut.
      let cvStorageKey: string | undefined;
      if (UPLOADS_ENABLED && cv) {
        cvStorageKey = await presignAndUpload('/candidatures/cv/presign', cv);
      }
      await postPublic('/candidatures', {
        nom: form.nom,
        email: form.email,
        telephone: form.telephone || undefined,
        poste: form.poste || undefined,
        message: form.message || undefined,
        ...(cvStorageKey ? { cvStorageKey } : {}),
      });
      setStatus('sent');
      setForm(EMPTY);
      setCv(null);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Échec de l’envoi.');
    }
  };

  if (status === 'sent') {
    return (
      <Card className="mt-8">
        <CardTitle>Candidature reçue ✅</CardTitle>
        <CardDescription>
          Merci ! Nous revenons vers vous par email. Vous pouvez fermer cette page.
        </CardDescription>
        <Button variant="secondary" className="mt-4" onClick={() => setStatus('idle')}>
          Envoyer une autre candidature
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardTitle>Votre candidature</CardTitle>
      <CardDescription>Les champs marqués d’un * sont obligatoires.</CardDescription>
      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
        <Input
          id="nom"
          label="Nom complet *"
          value={form.nom}
          onChange={(e) => set('nom', e.target.value)}
          placeholder="Aïcha Kossou"
          required
        />
        <Input
          id="email"
          type="email"
          label="Email *"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="vous@exemple.com"
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="telephone"
            label="Téléphone"
            value={form.telephone}
            onChange={(e) => set('telephone', e.target.value)}
            placeholder="+229 …"
          />
          <Input
            id="poste"
            label="Poste visé"
            value={form.poste}
            onChange={(e) => set('poste', e.target.value)}
            placeholder="Développeur·se full-stack"
          />
        </div>
        <Textarea
          id="message"
          label="Message / lettre de motivation"
          rows={5}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          placeholder="Présentez-vous en quelques lignes…"
        />
        {UPLOADS_ENABLED ? (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cv" className="text-sm font-medium text-ink">
              CV (PDF)
            </label>
            <input
              id="cv"
              type="file"
              accept="application/pdf"
              onChange={(e) => setCv(e.target.files?.[0] ?? null)}
              className="text-sm text-ink-muted file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
            />
          </div>
        ) : (
          <p className="text-xs text-ink-subtle">
            📎 L’envoi du CV (PDF) sera disponible prochainement (stockage S3).
          </p>
        )}

        {status === 'error' && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={status === 'sending'} className="mt-1 self-start">
          {status === 'sending' ? 'Envoi…' : 'Envoyer ma candidature'}
        </Button>
      </form>
    </Card>
  );
}
