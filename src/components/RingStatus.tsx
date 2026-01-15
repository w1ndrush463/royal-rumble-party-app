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
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <span className="w-3 h-3 bg-gray-500 rounded-full" />
          Currently in Ring
        </h3>
        <p className="text-gray-500 text-sm text-center py-4">Match not started</p>
      </div>
    );
  }

  if (rumble.status === 'completed') {
    const winner = rumble.winner ? getWrestler(rumble.winner) : null;
    return (
      <div className="bg-gray-900 rounded-xl p-4 border border-yellow-600">
        <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2">
          <span className="text-xl">🏆</span>
          Winner
        </h3>
        {winner && (
          <div className="flex items-center gap-3 p-2 bg-yellow-900/20 rounded-lg">
            <div className="w-12 h-12 rounded-lg bg-gray-700 overflow-hidden">
              {winner.imageUrl ? (
                <img src={winner.imageUrl} alt={winner.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold">
                  {winner.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <div className="text-white font-semibold">{winner.name}</div>
              <div className="text-yellow-400 text-sm">Royal Rumble Winner!</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        Currently in Ring ({wrestlersInRing.length})
      </h3>

      {wrestlersInRing.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Ring is empty</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {wrestlersInRing.map(({ entryNumber, wrestler }) => {
            const isUsersWrestler = currentUser && isUserWrestler(wrestler.id, rumbleType);

            return (
              <div
                key={wrestler.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isUsersWrestler ? 'bg-yellow-900/20 border border-yellow-600/50' : 'bg-gray-800'
                }`}
              >
                {/* Entry Number */}
                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
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
                      <span className="text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded">
                        Champion
                      </span>
                    )}
                    {wrestler.isFormerRumbleWinner && (
                      <span className="text-xs bg-purple-600 text-purple-100 px-1.5 py-0.5 rounded">
                        RR Winner
                      </span>
                    )}
                  </div>
                </div>

                {/* Your wrestler indicator */}
                {isUsersWrestler && (
                  <div className="text-yellow-400 text-xs font-bold">YOURS</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
