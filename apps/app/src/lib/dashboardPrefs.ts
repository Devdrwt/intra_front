const KEY = 'drwindesk.dashboard.hidden';

/** Widgets masqués par l'utilisateur (persistés en localStorage). */
export function getHiddenWidgets(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

export function setHiddenWidgets(ids: Set<string>): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...ids]));
  } catch {
    /* mode privé / quota : on ignore */
  }
}
