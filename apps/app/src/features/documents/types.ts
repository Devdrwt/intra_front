export type TypeDocument = 'CONTRAT' | 'BULLETIN' | 'ATTESTATION' | 'NDA' | 'AUTRE';

export interface Document {
  id: string;
  /** Collaborateur rattaché (clé étrangère vers le module RH). */
  employeId: string;
  nom: string;
  type: TypeDocument;
  dateAjout: string; // ISO
  tailleKo: number;
  url?: string; // lien S3 signé fourni par le backend
}

export type DocumentInput = Omit<Document, 'id' | 'dateAjout' | 'url'>;

export const TYPE_DOCUMENT_LABEL: Record<TypeDocument, string> = {
  CONTRAT: 'Contrat',
  BULLETIN: 'Bulletin de salaire',
  ATTESTATION: 'Attestation',
  NDA: 'NDA',
  AUTRE: 'Autre',
};

export const TYPE_DOCUMENT_OPTIONS = (
  Object.keys(TYPE_DOCUMENT_LABEL) as TypeDocument[]
).map((value) => ({ value, label: TYPE_DOCUMENT_LABEL[value] }));
