import type { Opportunity, AppState } from '../types';

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function applyFilters(opportunities: Opportunity[], state: AppState): Opportunity[] {
  let results = opportunities.map(o => ({ ...o }));

  // 1. Tag filter
  if (state.activeTags.size > 0) {
    results = results.filter(o => o.tags.some(t => state.activeTags.has(t)));
  }

  // 2. Commitment filter
  if (state.commitment === 'recurring') {
    results = results.filter(o => o.commitment === 'weekly' || o.commitment === 'monthly');
  } else if (state.commitment !== 'any') {
    results = results.filter(o => o.commitment === state.commitment);
  }

  // 3. Days filter
  if (state.days !== 'any') {
    results = results.filter(o => o.days === state.days || o.days === 'either');
  }

  // 4. Distance filter
  if (state.userLat !== null && state.userLng !== null) {
    results = results
      .map(o => ({
        ...o,
        distance: haversineDistance(state.userLat!, state.userLng!, o.lat, o.lng),
      }))
      .filter(o => o.distance! <= state.radius)
      .sort((a, b) => a.distance! - b.distance!);
  }

  return results;
}
