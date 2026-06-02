'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, CardTitle, CardDescription, Input, Textarea } from '@drwindesk/ui';
import { postPublic } from '@/lib/api';

interface Form {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}
const EMPTY: Form = { nom: '', email: '', sujet: '', message: '' };

export function ContactForm() {
  const [form, setForm] = useState<Form>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    try {
      await postPublic('/contact', {
        nom: form.nom,
        email: form.email,
        sujet: form.sujet || undefined,
        message: form.message,
      });
      setStatus('sent');
      setForm(EMPTY);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Échec de l’envoi.');
    }
  };

  if (status === 'sent') {
    return (
      <Card className="mt-8">
        <CardTitle>Message envoyé ✅</CardTitle>
        <CardDescription>Merci, notre équipe vous répondra par email.</CardDescription>
        <Button variant="secondary" className="mt-4" onClick={() => setStatus('idle')}>
          Envoyer un autre message
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardTitle>Nous écrire</CardTitle>
      <CardDescription>Les champs marqués d’un * sont obligatoires.</CardDescription>
      <form className="mt-5 flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="nom"
            label="Nom *"
            value={form.nom}
            onChange={(e) => set('nom', e.target.value)}
            required
          />
          <Input
            id="email"
            type="email"
            label="Email *"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
        </div>
        <Input
          id="sujet"
          label="Sujet"
          value={form.sujet}
          onChange={(e) => set('sujet', e.target.value)}
          placeholder="Objet de votre message"
        />
        <Textarea
          id="message"
          label="Message *"
          rows={6}
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          required
        />

        {status === 'error' && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" disabled={status === 'sending'} className="mt-1 self-start">
          {status === 'sending' ? 'Envoi…' : 'Envoyer'}
        </Button>
      </form>
    </Card>
  );
}
