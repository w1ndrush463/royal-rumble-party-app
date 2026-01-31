import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $matchState, $currentUser, getUserLotteryNumbers } from '../stores/matchStore';
import { serverClaimNumbers, serverClearAssignments, isAdmin } from '../stores/adminApi';

interface LotteryDrawProps {
  rumbleType: 'mens' | 'womens';
}

export default function LotteryDraw({ rumbleType }: LotteryDrawProps) {
  const matchState = useStore($matchState);
  const currentUser = useStore($currentUser);
  const [selected, setSelected] = useState<number[]>([]);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rumble = rumbleType === 'mens' ? matchState.mensRumble : matchState.womensRumble;
  const themeColor = rumbleType === 'mens' ? 'blue' : 'pink';
  const hasAssignments = Object.keys(rumble.assignments).length > 0;
  const adminMode = isAdmin();

  // Current user's already-claimed numbers
  const userNumbers = currentUser ? getUserLotteryNumbers(currentUser.id, rumbleType) : [];
  const hasClaimed = userNumbers.length > 0;

  const toggleNumber = (num: number) => {
    if (hasClaimed || isClaiming) return;
    if (rumble.assignments[num]) return; // already claimed by someone

    setSelected(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      if (prev.length >= 2) return prev;
      return [...prev, num];
    });
    setError(null);
  };

  const handleConfirm = async () => {
    if (!currentUser || selected.length !== 2) return;

    setIsClaiming(true);
    setError(null);

    try {
      await serverClaimNumbers(rumbleType, currentUser.id, selected);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim numbers');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear ALL number assignments? Everyone will need to re-pick.')) return;
    setIsClearing(true);
    setError(null);
    try {
      await serverClearAssignments(rumbleType);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear assignments');
    } finally {
      setIsClearing(false);
    }
  };

  // All draws for the results grid
  const allDraws = matchState.users.map(user => {
    const numbers = Object.entries(rumble.assignments)
      .filter(([, uid]) => uid === user.id)
      .map(([num]) => parseInt(num))
      .sort((a, b) => a - b);
    return { user, numbers };
  }).filter(({ numbers }) => numbers.length > 0);

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Your Numbers (if already claimed) */}
      {currentUser && hasClaimed && (
        <div className={`bg-${themeColor}-900/20 border border-${themeColor}-600 rounded-xl p-4`}>
          <div className="text-center">
            <div className={`text-${themeColor}-400 font-semibold mb-2`}>Your Numbers</div>
            <div className="flex justify-center gap-3">
              {userNumbers.map((num, i) => (
                <div
                  key={num}
                  className={`
                    w-14 h-14 rounded-full bg-${themeColor}-600
                    flex items-center justify-center text-white text-xl font-bold
                    shadow-lg shadow-${themeColor}-500/30
                  `}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Number Selection Grid */}
      {currentUser && !hasClaimed && (
        <div>
          <h3 className="font-bold text-lg text-center mb-3">
            <span className="gold-chrome-text">PICK YOUR NUMBERS</span>
          </h3>
          <p className="text-purple-300 text-sm text-center mb-4">
            Select 2 numbers from the grid below
          </p>

          <div className="grid grid-cols-6 gap-2 max-w-sm mx-auto">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(num => {
              const claimedById = rumble.assignments[num];
              const claimedByUser = claimedById
                ? matchState.users.find(u => u.id === claimedById)
                : null;
              const isClaimed = !!claimedById;
              const isSelected = selected.includes(num);

              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={isClaimed || isClaiming}
                  title={claimedByUser ? `Claimed by ${claimedByUser.name}` : `Number ${num}`}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center
                    text-lg font-bold transition-all
                    ${isClaimed
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                      : isSelected
                        ? `bg-${themeColor}-600 text-white ring-2 ring-${themeColor}-400 shadow-lg shadow-${themeColor}-500/40 scale-110`
                        : `bg-gray-700 text-white hover:bg-${themeColor}-700 hover:scale-105 cursor-pointer`
                    }
                  `}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Confirm Button */}
          {selected.length === 2 && (
            <div className="text-center mt-4">
              <button
                onClick={handleConfirm}
                disabled={isClaiming}
                className={`
                  px-8 py-3 rounded-xl text-white font-bold text-lg
                  bg-gradient-to-r from-${themeColor}-600 to-purple-600
                  hover:from-${themeColor}-500 hover:to-purple-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all transform hover:scale-105
                  shadow-lg shadow-${themeColor}-500/25
                `}
              >
                {isClaiming ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Claiming...
                  </span>
                ) : (
                  `Confirm Selection: ${selected.sort((a, b) => a - b).join(' & ')}`
                )}
              </button>
            </div>
          )}

          {selected.length === 1 && (
            <p className="text-purple-300 text-sm text-center mt-3">
              Select 1 more number
            </p>
          )}
        </div>
      )}

      {/* No user selected */}
      {!currentUser && (
        <div className="text-center text-purple-300">
          <p className="mb-2">Select your player on the home page first</p>
          <p className="text-sm text-purple-400">Then come back to pick your numbers</p>
        </div>
      )}

      {/* All Players Results */}
      {allDraws.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-center">
            <span className="gold-chrome-text">{rumbleType === 'mens' ? "MEN'S" : "WOMEN'S"} RUMBLE ASSIGNMENTS</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allDraws.map(({ user, numbers }) => {
              const isCurrentUser = currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  className={`
                    p-3 rounded-lg border transition-all duration-300
                    ${isCurrentUser
                      ? `bg-${themeColor}-900/20 border-${themeColor}-600 shadow-lg shadow-${themeColor}-500/20`
                      : 'bg-gray-800/50 border-purple-800/30 hover:border-purple-500/50'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${isCurrentUser ? `text-${themeColor}-300` : 'text-white'}`}>
                      {user.name}
                      {isCurrentUser && <span className="text-xs ml-1">(You)</span>}
                    </span>
                    <div className="flex gap-2">
                      {numbers.map(num => (
                        <span
                          key={num}
                          className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                            ${isCurrentUser
                              ? `bg-${themeColor}-600 text-white`
                              : 'bg-gray-700 text-gray-300'}
                          `}
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Number Distribution Grid */}
      <div className="mt-8 p-4 vaporwave-card">
        <h4 className="font-bold mb-3 text-center">
          <span className="gold-chrome-text">NUMBER DISTRIBUTION</span>
        </h4>
        <div className="grid grid-cols-10 gap-1">
          {Array.from({ length: 30 }, (_, i) => i + 1).map(num => {
            const assignedUserId = rumble.assignments[num];
            const assignedUser = assignedUserId
              ? matchState.users.find(u => u.id === assignedUserId)
              : null;
            const isCurrentUserNum = currentUser && assignedUserId === currentUser.id;

            return (
              <div
                key={num}
                title={assignedUser ? `${assignedUser.name}` : 'Available'}
                className={`
                  aspect-square rounded flex items-center justify-center text-xs font-medium
                  ${isCurrentUserNum
                    ? `bg-${themeColor}-600 text-white`
                    : assignedUser
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-900 text-gray-600'}
                `}
              >
                {num}
              </div>
            );
          })}
        </div>
        <p className="text-purple-400 text-xs mt-2 text-center">
          Hover over numbers to see who has them
        </p>
      </div>

      {/* Admin: Clear All Assignments */}
      {adminMode && hasAssignments && (
        <div className="text-center pt-4 border-t border-purple-800/30">
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="px-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
          >
            {isClearing ? 'Clearing...' : 'Clear All Assignments'}
          </button>
        </div>
      )}
    </div>
  );
}
