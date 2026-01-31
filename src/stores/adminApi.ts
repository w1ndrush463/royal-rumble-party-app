import { $matchState } from './matchStore';
import { $stateVersion } from './syncStore';
import type { MatchState } from '../types';

const API_BASE = '/api';

// Initialize admin mode from URL params, persisting to localStorage.
// Visit any page with ?admin=true&secret=YOUR_SECRET once to activate.
// Admin mode then persists across all pages until cleared.
export function initAdmin(): void {
  if (typeof window === 'undefined') return;

  const urlParams = new URLSearchParams(window.location.search);
  const urlSecret = urlParams.get('secret');
  const adminParam = urlParams.get('admin');

  if (urlSecret) {
    localStorage.setItem('adminSecret', urlSecret);
  }

  if (adminParam === 'true') {
    localStorage.setItem('adminMode', 'true');
  } else if (adminParam === 'false') {
    localStorage.removeItem('adminMode');
    localStorage.removeItem('adminSecret');
  }

  // Clean URL params after persisting (avoid leaking secret in browser history)
  if (urlSecret || adminParam) {
    const url = new URL(window.location.href);
    url.searchParams.delete('secret');
    url.searchParams.delete('admin');
    window.history.replaceState({}, '', url.toString());
  }
}

// Get admin secret from localStorage (persisted from initial URL visit)
export function getAdminSecret(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminSecret');
}

// Check if admin mode is active (both mode flag and secret must be present)
export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('adminMode') === 'true' && getAdminSecret() !== null;
}

export function clearAdminCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminSecret');
  localStorage.removeItem('adminMode');
}

interface AdminResponse {
  success: boolean;
  state?: MatchState;
  version?: string;
  error?: string;
}

async function adminRequest(payload: object): Promise<AdminResponse> {
  const secret = getAdminSecret();
  if (!secret) {
    throw new Error('No admin credentials. Add ?secret=YOUR_SECRET to the URL.');
  }

  const response = await fetch(`${API_BASE}/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
    },
    body: JSON.stringify(payload),
  });

  const result: AdminResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}`);
  }

  // Update local state immediately for instant feedback
  if (result.state) {
    $matchState.set(result.state);
  }
  if (result.version) {
    $stateVersion.set(result.version);
  }

  return result;
}

// Admin mutation functions (send to server)
export async function serverAddEntrant(rumbleType: 'mens' | 'womens', wrestlerId: string) {
  return adminRequest({
    action: 'addEntrant',
    rumbleType,
    wrestlerId,
  });
}

export async function serverEliminateWrestler(rumbleType: 'mens' | 'womens', wrestlerId: string) {
  return adminRequest({
    action: 'eliminateWrestler',
    rumbleType,
    wrestlerId,
  });
}

export async function serverResetRumble(rumbleType: 'mens' | 'womens') {
  return adminRequest({
    action: 'resetRumble',
    rumbleType,
  });
}

export async function serverClaimNumbers(
  rumbleType: 'mens' | 'womens',
  userId: string,
  numbers: number[]
): Promise<AdminResponse> {
  const response = await fetch(`${API_BASE}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rumbleType, userId, numbers }),
  });

  const result: AdminResponse = await response.json();

  if (!response.ok) {
    throw new Error(result.error || `HTTP ${response.status}`);
  }

  if (result.state) {
    $matchState.set(result.state);
  }
  if (result.version) {
    $stateVersion.set(result.version);
  }

  return result;
}

export async function serverClearAssignments(rumbleType: 'mens' | 'womens') {
  return adminRequest({
    action: 'clearAssignments',
    rumbleType,
  });
}

export async function serverFullUpdate(state: MatchState) {
  return adminRequest({
    action: 'fullUpdate',
    state,
  });
}
