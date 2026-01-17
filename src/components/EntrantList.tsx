import { useStore } from '@nanostores/react';
import { $matchState, $currentUser, getEntrantWrestlers, getWrestler, isUserWrestler } from '../stores/matchStore';
import WrestlerCard from './WrestlerCard';
import type { RumbleMatch } from '../types';

interface EntrantListProps {
  rumbleType: 'mens' | 'womens';
}

export default function EntrantList({ rumbleType }: EntrantListProps) {
  const matchState = useStore($matchState);
  const currentUser = useStore($currentUser);

  const rumble: RumbleMatch = rumbleType === 'mens' ? matchState.mensRumble : matchState.womensRumble;
  const entrants = getEntrantWrestlers(rumble);

  if (rumble.status === 'not_started') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏟️</div>
        <p className="text-lg text-purple-300">Match hasn't started yet</p>
        <p className="text-sm mt-2 text-purple-400">Entrants will appear here as they enter the ring</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-cyan-400 font-medium">Entrants: <span className="text-white">{rumble.currentEntryNumber}/30</span></span>
        <span className="text-green-400 font-medium">
          In Ring: <span className="text-white">{Object.keys(rumble.entrants).length - rumble.eliminations.length}</span>
        </span>
      </div>

      {/* Entrant List */}
      <div className="space-y-2">
        {entrants.map(({ entryNumber, wrestler }) => {
          const isEliminated = rumble.eliminations.includes(wrestler.id);
          const isInRing = !isEliminated;
          const isUsersWrestler = currentUser && isUserWrestler(wrestler.id, rumbleType);
          const isWinner = rumble.winner === wrestler.id;

          return (
            <div
              key={wrestler.id}
              className={`relative ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg shadow-lg shadow-yellow-500/30' : ''}`}
            >
              {isWinner && (
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-2 py-0.5 rounded text-xs font-bold z-10 shadow-lg shadow-yellow-500/50">
                  WINNER!
                </div>
              )}
              <WrestlerCard
                wrestler={wrestler}
                entryNumber={entryNumber}
                isEliminated={isEliminated}
                isInRing={isInRing}
                isHighlighted={isUsersWrestler ?? false}
                size="medium"
              />
            </div>
          );
        })}
      </div>

      {/* Waiting for next entrant */}
      {rumble.currentEntryNumber < 30 && rumble.status === 'in_progress' && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-purple-600/50 bg-purple-900/20">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-sm font-bold text-white animate-pulse shadow-lg shadow-purple-500/30">
            {rumble.currentEntryNumber + 1}
          </div>
          <span className="text-sm text-purple-300">Waiting for next entrant...</span>
        </div>
      )}

      {/* Match Complete */}
      {rumble.status === 'completed' && rumble.winner && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-900/40 to-orange-900/30 rounded-lg border border-yellow-500/50 text-center shadow-lg shadow-yellow-500/20 winner-celebration">
          <div className="text-2xl mb-2">🏆</div>
          <div className="gold-chrome-text font-bold text-lg">
            {getWrestler(rumble.winner)?.name} wins the Royal Rumble!
          </div>
        </div>
      )}
    </div>
  );
}
