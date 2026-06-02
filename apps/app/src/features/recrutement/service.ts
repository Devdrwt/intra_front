import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';
import type { Candidature, CandidatureStatut, ContactMessage } from './types';

/**
 * Service Recrutement (côté RH/admin). MOCK par défaut ; API NestJS avec
 * `VITE_MOCK_RECRUTEMENT=false`. Endpoints (intra_back, module siteweb) :
 *   GET   /candidatures?statut          → CandidatureDto[]
 *   GET   /candidatures/:id             → CandidatureDto
 *   PATCH /candidatures/:id/statut      { statut } → CandidatureDto
 *   GET   /contact-messages?pending     → ContactMessageDto[]
 *   PATCH /contact-messages/:id/traite  → 204
 */
const delay = <T>(value: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
let candidatures: Candidature[] = [
  {
    id: 'cand1',
    nom: 'Fatou Bint',
    email: 'fatou.bint@exemple.com',
    telephone: '+229 01 90 00 00 11',
    poste: 'Développeuse front',
    message: 'Passionnée par React et le design system.',
    statut: 'RECUE',
    createdAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  },
  {
    id: 'cand2',
    nom: 'Koffi Mensah',
    email: 'koffi.mensah@exemple.com',
    poste: 'Data analyst',
    statut: 'ENTRETIEN',
    createdAt: new Date(Date.now() - 5 * 86_400_000).toISOString(),
  },
];
let messages: ContactMessage[] = [
  {
    id: 'msg1',
    nom: 'Entreprise Alpha',
    email: 'contact@alpha.bj',
    sujet: 'Demande de devis ERP',
    message: 'Bonjour, nous aimerions un devis pour 40 collaborateurs.',
    traite: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
];

const mockApi = {
  listCandidatures: (statut?: CandidatureStatut) =>
    delay(
      [...candidatures]
        .filter((c) => !statut || c.statut === statut)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  getCandidature: (id: string) => delay(candidatures.find((c) => c.id === id) ?? null),
  setStatut: (id: string, statut: CandidatureStatut) => {
    candidatures = candidatures.map((c) => (c.id === id ? { ...c, statut } : c));
    return delay(candidatures.find((c) => c.id === id)!);
  },
  listContact: (pending = false) =>
    delay(
      [...messages]
        .filter((m) => !pending || !m.traite)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    ),
  markTraite: (id: string) => {
    messages = messages.map((m) => (m.id === id ? { ...m, traite: true } : m));
    return delay(undefined);
  },
};

// --- HTTP (NestJS) ------------------------------------------------------------
const httpApi = {
  listCandidatures: (statut?: CandidatureStatut) =>
    api
      .get<Candidature[]>('/candidatures', { params: statut ? { statut } : {} })
      .then((r) => r.data),
  getCandidature: (id: string) =>
    api.get<Candidature>(`/candidatures/${id}`).then((r) => r.data),
  setStatut: (id: string, statut: CandidatureStatut) =>
    api.patch<Candidature>(`/candidatures/${id}/statut`, { statut }).then((r) => r.data),
  listContact: (pending = false) =>
    api
      .get<ContactMessage[]>('/contact-messages', { params: pending ? { pending: 'true' } : {} })
      .then((r) => r.data),
  markTraite: (id: string) =>
    api.patch(`/contact-messages/${id}/traite`).then(() => undefined),
};

export const recrutementService = USE_MOCKS.recrutement ? mockApi : httpApi;
