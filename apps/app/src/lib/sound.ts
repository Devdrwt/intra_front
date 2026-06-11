/**
 * Son de notification (sans fichier asset) via Web Audio.
 * Préférence stockée en localStorage. Le navigateur n'autorise le son qu'après
 * une première interaction utilisateur — ce qui est toujours le cas en usage.
 */
const PREF_KEY = 'drwindesk.sound.enabled';

export function isSoundEnabled(): boolean {
  return localStorage.getItem(PREF_KEY) !== '0'; // activé par défaut
}
export function setSoundEnabled(on: boolean): void {
  localStorage.setItem(PREF_KEY, on ? '1' : '0');
}

let ctx: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

/** Petit « ding » à deux tons (A5 → D6). */
export function playPing(): void {
  if (!isSoundEnabled()) return;
  const ac = audioCtx();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') void ac.resume();
    const now = ac.currentTime;
    const notes = [
      { f: 880, t: 0 },
      { f: 1174.66, t: 0.11 },
    ];
    for (const n of notes) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.f;
      gain.gain.setValueAtTime(0.0001, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.16, now + n.t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + 0.3);
      osc.connect(gain).connect(ac.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + 0.32);
    }
  } catch {
    /* ignore */
  }
}
