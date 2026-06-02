import { api } from './api';

/**
 * Upload de fichier via URL presignée S3 (pattern à 3 temps).
 *
 * CONTRAT BACKEND attendu (à implémenter dans intra_back) :
 *   POST <presignPath>  body { filename, contentType, size }
 *        → 200 { uploadUrl: string, storageKey: string }
 *   puis le client PUT le binaire sur `uploadUrl` (URL signée, Content-Type exact),
 *   puis le client POST les métadonnées de la ressource avec `storageKey`.
 *
 * Le PUT se fait hors du client axios `api` : l'URL signée porte sa propre auth,
 * il ne faut NI cookies, NI en-tête CSRF, NI baseURL.
 */
export interface PresignResponse {
  uploadUrl: string;
  storageKey: string;
}

export async function uploadViaPresign(presignPath: string, file: File): Promise<string> {
  const contentType = file.type || 'application/octet-stream';
  const { data } = await api.post<PresignResponse>(presignPath, {
    filename: file.name,
    contentType,
    size: file.size,
  });

  const res = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: file,
  });
  if (!res.ok) throw new Error(`Échec du transfert du fichier (${res.status}).`);

  return data.storageKey;
}
