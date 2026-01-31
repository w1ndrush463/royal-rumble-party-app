import { atom } from 'nanostores';
import { $matchState } from './matchStore';
import type { MatchState } from '../types';
import localData from '../data/match-state.json';

// Sync configuration
const POLL_INTERVAL = 2500; // 2.5 seconds
const API_BASE = '/api';

// Sync state atoms
export const $syncStatus = atom<'idle' | 'syncing' | 'error' | 'offline'>('idle');
export const $lastSyncTime = atom<Date | null>(null);
export const $stateVersion = atom<string>('0');
export const $syncEnabled = atom<boolean>(false);

let pollInterval: ReturnType<typeof setInterval> | null = null;
let isPolling = false;

// Start polling for state updates
export function startPolling() {
  if (typeof window === 'undefined') return;
  if (pollInterval) return;

  $syncEnabled.set(true);

  // Initial fetch
  fetchState();

  // Set up polling
  pollInterval = setInterval(fetchState, POLL_INTERVAL);

  // Handle visibility changes (pause when tab hidden)
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export function stopPolling() {
  $syncEnabled.set(false);

  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
}

function handleVisibilityChange() {
  if (document.hidden) {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  } else if ($syncEnabled.get()) {
    // Resume polling
    fetchState();
    pollInterval = setInterval(fetchState, POLL_INTERVAL);
  }
}

async function fetchState() {
  if (isPolling) return; // Prevent overlapping requests
  isPolling = true;

  try {
    $syncStatus.set('syncing');

    const currentVersion = $stateVersion.get();
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/state?version=${currentVersion}`, {
        cache: 'no-store',
      });
    } catch (fetchError) {
      // Network error (e.g. edge functions unavailable in dev)
      $syncStatus.set('offline');
      isPolling = false;
      return;
    }

    if (response.status === 304) {
      // No changes
      $syncStatus.set('idle');
      isPolling = false;
      return;
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Only update if version changed
    if (data.version !== currentVersion) {
      // Always use local build-time user list as source of truth for names/avatars
      const serverState = data.state as MatchState;
      serverState.users = localData.users;
      $matchState.set(serverState);
      $stateVersion.set(data.version);
    }

    $lastSyncTime.set(new Date());
    $syncStatus.set('idle');
  } catch (error) {
    console.error('Sync error:', error);
    $syncStatus.set('error');

    // Retry after a longer delay on error
    setTimeout(() => {
      if ($syncStatus.get() === 'error') {
        $syncStatus.set('idle');
      }
    }, 5000);
  } finally {
    isPolling = false;
  }
}

// Force immediate sync (resets version to force full fetch)
export async function forceSync() {
  $stateVersion.set('0');
  await fetchState();
}

// Initialize sync on client load
export function initSync() {
  if (typeof window === 'undefined') return;

  // Auto-start polling
  startPolling();

  // Stop polling on page unload
  window.addEventListener('beforeunload', stopPolling);
}
