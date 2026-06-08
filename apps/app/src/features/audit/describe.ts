/**
 * Transforme une action d'audit (méthode + chemin) en libellé humain lisible.
 * Le chemin stocké contient de vrais identifiants → on les normalise en « :id ».
 */
function normalize(path: string | null, action: string): { key: string; segs: string[] } {
  const raw = (path ?? action.replace(/^\w+\s+/, '')).replace(/^\/api\/v1/, '');
  const segs = raw.split('/').filter(Boolean);
  const norm = segs.map((s) =>
    /^[0-9a-f-]{16,}$/i.test(s) || /^\d+$/.test(s) ? ':id' : s,
  );
  return { key: norm.join('/'), segs };
}

const RESOURCE: Record<string, string> = {
  'rh/employes': 'Employé',
  rapports: 'Rapport',
  projects: 'Projet',
  documents: 'Document',
  users: 'Utilisateur',
  conversations: 'Conversation',
  settings: 'Paramètres',
  departments: 'Département',
  services: 'Service',
  'recrutement/candidatures': 'Candidature',
  'recrutement/contact-messages': 'Message de contact',
};

export function describeAudit(method: string | null, path: string | null, action: string): string {
  const m = (method ?? '').toUpperCase();
  const { key, segs } = normalize(path, action);

  const SPECIAL: Record<string, string> = {
    'auth/login': 'Connexion',
    'auth/logout': 'Déconnexion',
    'auth/refresh': 'Session rafraîchie',
    'auth/set-password': 'Définition du mot de passe',
    'auth/forgot-password': 'Réinitialisation de mot de passe demandée',
    'me/profile': 'Mise à jour du profil',
    'me/password': 'Changement de mot de passe',
    'me/rapports': 'Enregistrement d’un rapport',
    'me/pointages/pointer': 'Pointage',
    'pointages/pointer': 'Pointage',
    'me/conges': 'Demande d’absence',
    conges: 'Création d’une demande d’absence',
    'presences/conges/:id/statut': 'Décision sur une demande',
    'conversations/direct': 'Nouvelle conversation',
    'conversations/group': 'Nouveau groupe',
    'webmail/send': 'Email envoyé',
  };
  if (SPECIAL[key]) return SPECIAL[key];

  if (key === 'webmail/account')
    return m === 'DELETE' ? 'Déconnexion de la messagerie' : 'Configuration de la messagerie';
  if (key === 'me/avatar')
    return m === 'DELETE' ? 'Retrait de la photo de profil' : 'Photo de profil mise à jour';
  if (key === 'me/conges/:id' || key === 'conges/:id') return 'Annulation d’une demande';
  if (/^conversations\/:id\/messages(\/:id)?$/.test(key))
    return m === 'DELETE' ? 'Message supprimé' : 'Message envoyé';

  const verb = m === 'POST' ? 'Ajout' : m === 'DELETE' ? 'Suppression' : 'Modification';
  const resKey = Object.keys(RESOURCE).find((k) => key === k || key.startsWith(k + '/'));
  if (resKey) {
    if (resKey === 'projects' && key.includes('/documents')) return `${verb} — Document de projet`;
    return `${verb} — ${RESOURCE[resKey]}`;
  }
  return `${verb} — ${segs[0] ?? 'action'}`;
}
