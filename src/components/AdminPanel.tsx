import { useState } from 'react';
import { useStore } from '@nanostores/react';
import {
  $matchState,
  $wrestlers,
  getWrestlersInRing,
  getWrestler,
} from '../stores/matchStore';
import {
  serverAddEntrant,
  serverEliminateWrestler,
  serverResetRumble,
} from '../stores/adminApi';
import WrestlerSearch from './WrestlerSearch';
import type { Wrestler, RumbleMatch } from '../types';

interface AdminPanelProps {
  rumbleType: 'mens' | 'womens';
}

export default function AdminPanel({ rumbleType }: AdminPanelProps) {
  const matchState = useStore($matchState);
  const wrestlers = useStore($wrestlers);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rumble: RumbleMatch = rumbleType === 'mens' ? matchState.mensRumble : matchState.womensRumble;
  const wrestlersInRing = getWrestlersInRing(rumble);

  // Filter wrestlers by gender and exclude already entered
  const enteredIds = Object.values(rumble.entrants);
  const availableWrestlers = wrestlers.filter(
    w => w.gender === (rumbleType === 'mens' ? 'male' : 'female') && !enteredIds.includes(w.id)
  );

  const handleAddEntrant = async (wrestler: Wrestler) => {
    if (rumble.currentEntryNumber >= 30) return;
    setIsLoading(true);
    setError(null);
    try {
      await serverAddEntrant(rumbleType, wrestler.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add entrant');
      console.error('Failed to add entrant:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEliminate = async (wrestlerId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await serverEliminateWrestler(rumbleType, wrestlerId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to eliminate');
      console.error('Failed to eliminate:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await serverResetRumble(rumbleType);
      setShowConfirmReset(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
      console.error('Failed to reset:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const genderLabel = rumbleType === 'mens' ? "Men's" : "Women's";
  const themeColor = rumbleType === 'mens' ? 'blue' : 'pink';

  return (
    <div className={`bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-4 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Admin Controls
          {isLoading && (
            <span className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          )}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          rumble.status === 'not_started' ? 'bg-gray-700 text-gray-300' :
          rumble.status === 'in_progress' ? 'bg-green-900 text-green-300' :
          'bg-yellow-900 text-yellow-300'
        }`}>
          {rumble.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Entrant */}
      {rumble.currentEntryNumber < 30 && rumble.status !== 'completed' && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Add Entry #{rumble.currentEntryNumber + 1}
          </label>
          <WrestlerSearch
            wrestlers={availableWrestlers}
            onSelect={handleAddEntrant}
            placeholder={`Search ${genderLabel.toLowerCase()} wrestlers...`}
            genderFilter={rumbleType === 'mens' ? 'male' : 'female'}
            excludeIds={enteredIds}
            autoFocus
          />
        </div>
      )}

      {/* Eliminate Wrestler */}
      {wrestlersInRing.length > 0 && rumble.status === 'in_progress' && (
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Eliminate Wrestler ({wrestlersInRing.length} in ring)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {wrestlersInRing.map(({ entryNumber, wrestler }) => (
              <button
                key={wrestler.id}
                onClick={() => handleEliminate(wrestler.id)}
                className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-red-900/50 rounded-lg text-left transition-colors group"
              >
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                  {entryNumber}
                </div>
                <span className="text-white text-sm truncate flex-1">{wrestler.name}</span>
                <span className="text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  OUT
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800 rounded-lg p-2">
          <div className={`text-xl font-bold text-${themeColor}-400`}>{rumble.currentEntryNumber}</div>
          <div className="text-xs text-gray-400">Entered</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="text-xl font-bold text-green-400">{wrestlersInRing.length}</div>
          <div className="text-xs text-gray-400">In Ring</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-2">
          <div className="text-xl font-bold text-red-400">{rumble.eliminations.length}</div>
          <div className="text-xs text-gray-400">Eliminated</div>
        </div>
      </div>

      {/* Match Complete */}
      {rumble.status === 'completed' && rumble.winner && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3 text-center">
          <div className="text-yellow-400 font-bold">Match Complete!</div>
          <div className="text-white">Winner: {getWrestler(rumble.winner)?.name}</div>
        </div>
      )}

      {/* Reset Button */}
      <div className="pt-2 border-t border-gray-800">
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full py-2 text-sm text-gray-400 hover:text-red-400 transition-colors"
          >
            Reset Match
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400 text-center">Are you sure? This will clear all match data.</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
