import { $matchState } from './matchStore';
import { $stateVersion } from './syncStore';
import type { MatchState } from '../types';

const API_BASE = '/api';

// Get admin secret from URL param or localStorage
export function getAdminSecret(): string | null {
  if (typeof window === 'undefined') return null;

  const urlParams = new URLSearchParams(window.location.search);
  const urlSecret = urlParams.get('secret');

  if (urlSecret) {
    localStorage.setItem('adminSecret', urlSecret);
    return urlSecret;
  }

  return localStorage.getItem('adminSecret');
}

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const hasAdminParam = urlParams.get('admin') === 'true';
  const hasSecret = getAdminSecret() !== null;

  return hasAdminParam && hasSecret;
}

export function clearAdminCredentials() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('adminSecret');
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

export async function serverPerformLotteryDraw(rumbleType: 'mens' | 'womens') {
  return adminRequest({
    action: 'performLotteryDraw',
    rumbleType,
  });
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
