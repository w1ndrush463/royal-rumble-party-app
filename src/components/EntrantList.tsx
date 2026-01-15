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
      <div className="text-center py-12 text-gray-400">
        <div className="text-6xl mb-4">🏟️</div>
        <p className="text-lg">Match hasn't started yet</p>
        <p className="text-sm mt-2">Entrants will appear here as they enter the ring</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Entrants: {rumble.currentEntryNumber}/30</span>
        <span>
          In Ring: {Object.keys(rumble.entrants).length - rumble.eliminations.length}
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
              className={`relative ${isWinner ? 'ring-2 ring-yellow-400 rounded-lg' : ''}`}
            >
              {isWinner && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-xs font-bold z-10">
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
        <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-700 text-gray-400">
          <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold animate-pulse">
            {rumble.currentEntryNumber + 1}
          </div>
          <span className="text-sm">Waiting for next entrant...</span>
        </div>
      )}

      {/* Match Complete */}
      {rumble.status === 'completed' && rumble.winner && (
        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-900/30 to-yellow-600/30 rounded-lg border border-yellow-600 text-center">
          <div className="text-2xl mb-2">🏆</div>
          <div className="text-yellow-400 font-bold text-lg">
            {getWrestler(rumble.winner)?.name} wins the Royal Rumble!
          </div>
        </div>
      )}
    </div>
  );
}
