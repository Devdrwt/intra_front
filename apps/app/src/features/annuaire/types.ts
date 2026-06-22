export interface AnnuaireEntry {
  id: string;
  prenom: string;
  nom: string;
  poste: string;
  departement: string;
  service: string | null;
  email: string;
  telephone: string | null;
  userId: string | null;
  hasAvatar: boolean;
  photoUrl: string | null;
}
