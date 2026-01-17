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
    <div className={`vaporwave-card p-4 space-y-4 ${isLoading ? 'opacity-70 pointer-events-none' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-bold flex items-center gap-2">
          <span className="gold-chrome-text">ADMIN</span>
          <span className="text-white">CONTROLS</span>
          {isLoading && (
            <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          )}
        </h3>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          rumble.status === 'not_started' ? 'bg-gray-700/50 text-gray-300 border border-gray-600' :
          rumble.status === 'in_progress' ? 'bg-green-900/50 text-green-300 border border-green-600' :
          'bg-yellow-900/50 text-yellow-300 border border-yellow-600'
        }`}>
          {rumble.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-600/50 rounded-lg p-2 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Entrant */}
      {rumble.currentEntryNumber < 30 && rumble.status !== 'completed' && (
        <div>
          <label className="block text-sm text-cyan-400 font-medium mb-2">
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
          <label className="block text-sm text-red-400 font-medium mb-2">
            Eliminate Wrestler ({wrestlersInRing.length} in ring)
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {wrestlersInRing.map(({ entryNumber, wrestler }) => (
              <button
                key={wrestler.id}
                onClick={() => handleEliminate(wrestler.id)}
                className="flex items-center gap-2 p-2 bg-gray-800/50 hover:bg-red-900/50 rounded-lg text-left transition-all border border-purple-800/30 hover:border-red-500/50 group"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                  {entryNumber}
                </div>
                <div className="w-8 h-8 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                  {wrestler.imageUrl ? (
                    <img src={wrestler.imageUrl} alt={wrestler.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs font-bold">
                      {wrestler.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-white text-sm truncate flex-1">{wrestler.name}</span>
                <span className="text-red-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  OUT
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-800/50 rounded-lg p-2 border border-cyan-800/30">
          <div className={`text-xl font-bold ${rumbleType === 'mens' ? 'text-cyan-400' : 'text-pink-400'}`}>{rumble.currentEntryNumber}</div>
          <div className="text-xs text-purple-300">Entered</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 border border-green-800/30">
          <div className="text-xl font-bold text-green-400">{wrestlersInRing.length}</div>
          <div className="text-xs text-purple-300">In Ring</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 border border-red-800/30">
          <div className="text-xl font-bold text-red-400">{rumble.eliminations.length}</div>
          <div className="text-xs text-purple-300">Eliminated</div>
        </div>
      </div>

      {/* Match Complete */}
      {rumble.status === 'completed' && rumble.winner && (
        <div className="bg-gradient-to-r from-yellow-900/40 to-transparent border border-yellow-500/50 rounded-lg p-3 text-center">
          <div className="gold-chrome-text font-bold">Match Complete!</div>
          <div className="text-white">Winner: {getWrestler(rumble.winner)?.name}</div>
        </div>
      )}

      {/* Reset Button */}
      <div className="pt-2 border-t border-purple-800/30">
        {!showConfirmReset ? (
          <button
            onClick={() => setShowConfirmReset(true)}
            className="w-full py-2 text-sm text-purple-400 hover:text-red-400 transition-colors"
          >
            Reset Match
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-400 text-center">Are you sure? This will clear all match data.</p>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-sm font-bold transition-all"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600"
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
