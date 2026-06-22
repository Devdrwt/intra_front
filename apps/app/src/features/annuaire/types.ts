export interface PersonneBrief {
  prenom: string;
  nom: string;
  userId: string | null;
  hasAvatar: boolean;
}
export interface TempsForts {
  arrivees: (PersonneBrief & { poste: string; dateEmbauche: string })[];
  anniversaires: (PersonneBrief & { annees: number })[];
}
export interface Absent extends PersonneBrief {
  motif: string;
}

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
