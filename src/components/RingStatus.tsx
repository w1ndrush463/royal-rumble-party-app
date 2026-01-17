import { useStore } from '@nanostores/react';
import { $matchState, $currentUser, getWrestlersInRing, isUserWrestler, getWrestler } from '../stores/matchStore';
import type { RumbleMatch } from '../types';

interface RingStatusProps {
  rumbleType: 'mens' | 'womens';
}

export default function RingStatus({ rumbleType }: RingStatusProps) {
  const matchState = useStore($matchState);
  const currentUser = useStore($currentUser);

  const rumble: RumbleMatch = rumbleType === 'mens' ? matchState.mensRumble : matchState.womensRumble;
  const wrestlersInRing = getWrestlersInRing(rumble);

  if (rumble.status === 'not_started') {
    return (
      <div className="vaporwave-card p-4">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-500 rounded-full" />
          <span className="text-purple-300">CURRENTLY IN RING</span>
        </h3>
        <p className="text-purple-400 text-sm text-center py-4">Match not started</p>
      </div>
    );
  }

  if (rumble.status === 'completed') {
    const winner = rumble.winner ? getWrestler(rumble.winner) : null;
    return (
      <div className="vaporwave-card p-4 winner-celebration">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="gold-chrome-text">WINNER</span>
        </h3>
        {winner && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-900/40 to-transparent rounded-lg border border-yellow-500/50">
            <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden shadow-lg shadow-yellow-500/30">
              {winner.imageUrl ? (
                <img src={winner.imageUrl} alt={winner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                  {winner.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="text-white font-bold">{winner.name}</div>
              <div className="text-yellow-400 text-sm font-medium">Royal Rumble Winner!</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="vaporwave-card p-4">
      <h3 className="font-bold mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
        <span className="text-white">CURRENTLY IN RING</span>
        <span className="neon-cyan text-sm">({wrestlersInRing.length})</span>
      </h3>

      {wrestlersInRing.length === 0 ? (
        <p className="text-purple-400 text-sm text-center py-4">Ring is empty</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {wrestlersInRing.map(({ entryNumber, wrestler }) => {
            const isUsersWrestler = currentUser && isUserWrestler(wrestler.id, rumbleType);

            return (
              <div
                key={wrestler.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  isUsersWrestler
                    ? 'bg-gradient-to-r from-yellow-900/40 to-transparent border border-yellow-500/50 shadow-lg shadow-yellow-500/10'
                    : 'bg-gray-800/50 border border-purple-800/30 hover:border-purple-500/50'
                }`}
              >
                {/* Entry Number */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg shadow-purple-500/30">
                  {entryNumber}
                </div>

                {/* Wrestler Image */}
                <div className="w-10 h-10 rounded-lg bg-gray-700 overflow-hidden flex-shrink-0">
                  {wrestler.imageUrl ? (
                    <img src={wrestler.imageUrl} alt={wrestler.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-bold">
                      {wrestler.name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name & Badges */}
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">{wrestler.name}</div>
                  <div className="flex gap-1 flex-wrap">
                    {wrestler.isCurrentChampion && (
                      <span className="text-xs bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-1.5 py-0.5 rounded font-medium">
                        Champion
                      </span>
                    )}
                    {wrestler.isFormerRumbleWinner && (
                      <span className="text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white px-1.5 py-0.5 rounded font-medium">
                        RR Winner
                      </span>
                    )}
                  </div>
                </div>

                {/* Your wrestler indicator */}
                {isUsersWrestler && (
                  <div className="text-yellow-400 text-xs font-bold animate-pulse">YOURS</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
