import { useStore } from '@nanostores/react';
import { $syncStatus, $lastSyncTime, forceSync } from '../stores/syncStore';

export default function SyncIndicator() {
  const status = useStore($syncStatus);
  const lastSync = useStore($lastSyncTime);

  const statusConfig = {
    idle: { color: 'green', bg: 'bg-green-500', label: 'Live' },
    syncing: { color: 'yellow', bg: 'bg-yellow-500', label: 'Syncing' },
    error: { color: 'red', bg: 'bg-red-500', label: 'Offline' },
    offline: { color: 'gray', bg: 'bg-gray-500', label: 'Offline' },
  };

  const config = statusConfig[status];

  return (
    <button
      onClick={forceSync}
      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-purple-900/50 transition-colors border border-transparent hover:border-purple-600/30"
      title={lastSync ? `Last sync: ${lastSync.toLocaleTimeString()}` : 'Click to sync'}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.bg} ${
          status === 'syncing' ? 'animate-pulse' : ''
        } ${status === 'idle' ? 'shadow-lg shadow-green-500/50' : ''}`}
      />
      <span className={`text-xs text-${config.color}-400`}>{config.label}</span>
    </button>
  );
}
