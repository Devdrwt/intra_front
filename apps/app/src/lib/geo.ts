import type { Coords } from './offlineQueue';

/**
 * Position GPS du navigateur (best-effort). Renvoie `undefined` si refusée,
 * indisponible ou trop lente — le serveur décidera si c'est bloquant.
 */
export function getCoords(timeoutMs = 7000): Promise<Coords | undefined> {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    return Promise.resolve(undefined);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(undefined),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30_000 },
    );
  });
}
