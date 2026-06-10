import { api } from '@/lib/api';
import { USE_MOCKS } from '@/lib/config';

/**
 * Assistant IA (cf. docs/contracts/assistant-ia.md). VITE_MOCK_AI=false → réel.
 *   /ai/modeles · /ai/generer (stream) · /ai/assistant (stream) · /ai/generations
 * NB : en réel, génération/Q&A sont streamés (Claude Opus 4.8). Le mock renvoie un brouillon.
 */
export interface ModeleDocument {
  id: string;
  nom: string;
  type: 'CONTRAT' | 'ATTESTATION' | 'LETTRE' | 'RAPPORT' | 'FICHE_POSTE' | 'AUTRE';
}
export interface GenerationResult {
  contenu: string;
  modelIa: string;
}

const delay = <T>(value: T, ms = 400): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

// --- MOCK ---------------------------------------------------------------------
const modeles: ModeleDocument[] = [
  { id: 'm1', nom: 'Contrat de travail CDI', type: 'CONTRAT' },
  { id: 'm2', nom: 'Attestation de travail', type: 'ATTESTATION' },
  { id: 'm3', nom: 'Rapport mensuel d’activité', type: 'RAPPORT' },
  { id: 'm4', nom: 'Lettre de convocation', type: 'LETTRE' },
];

const mockApi = {
  modeles: () => delay([...modeles]),
  generer: (modeleId: string, donnees?: Record<string, unknown>): Promise<GenerationResult> => {
    const modeleNom = modeles.find((m) => m.id === modeleId)?.nom ?? 'Document';
    const lignes = Object.entries(donnees ?? {})
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `— ${k} : ${String(v)}`)
      .join('\n');
    return delay({
      modelIa: 'claude-haiku-4-5 (simulé)',
      contenu:
        `**${modeleNom}** (projet — à vérifier)\n\n` +
        `Brouillon pré-rédigé à partir du modèle « ${modeleNom} »` +
        (lignes ? ` et des données réelles fournies :\n${lignes}\n` : '.\n') +
        `\nUne fois le backend IA branché, le contenu réel est généré par Claude puis classé en GED après validation.\n`,
    });
  },
  assistant: (question: string): Promise<string> =>
    delay(
      `Réponse simulée à : « ${question} ».\n\nUne fois l'assistant branché, je répondrai en ` +
        `langage naturel à partir de la GED et des données auxquelles vous avez accès (citations à l'appui).`,
    ),
};

// --- HTTP ---------------------------------------------------------------------
const httpApi = {
  modeles: () => api.get<ModeleDocument[]>('/ai/modeles').then((r) => r.data),
  generer: (modeleId: string, donnees?: Record<string, unknown>): Promise<GenerationResult> =>
    api.post<GenerationResult>('/ai/generer', { modeleId, donnees }).then((r) => r.data),
  assistant: (question: string): Promise<string> =>
    api.post<{ contenu: string }>('/ai/assistant', { message: question }).then((r) => r.data.contenu),
};

export const assistantService = USE_MOCKS.ai ? mockApi : httpApi;
