import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $matchState, $currentUser, getUserLotteryNumbers } from '../stores/matchStore';
import { serverPerformLotteryDraw, isAdmin } from '../stores/adminApi';

interface LotteryDrawProps {
  rumbleType: 'mens' | 'womens';
}

export default function LotteryDraw({ rumbleType }: LotteryDrawProps) {
  const matchState = useStore($matchState);
  const currentUser = useStore($currentUser);
  const [isDrawing, setIsDrawing] = useState(false);
  const [animatingIndex, setAnimatingIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const rumble = rumbleType === 'mens' ? matchState.mensRumble : matchState.womensRumble;
  const hasAssignments = Object.keys(rumble.assignments).length > 0;
  const themeColor = rumbleType === 'mens' ? 'blue' : 'pink';
  const canDraw = isAdmin();

  // Get current user's numbers
  const userNumbers = currentUser ? getUserLotteryNumbers(currentUser.id, rumbleType) : [];

  const handleDraw = async () => {
    if (!canDraw) {
      setError('Only admin can draw lottery numbers. Add ?admin=true&secret=YOUR_SECRET to the URL.');
      return;
    }

    setIsDrawing(true);
    setError(null);
    setAnimatingIndex(-1);

    try {
      // Perform the lottery draw via server
      const result = await serverPerformLotteryDraw(rumbleType);

      if (result.state) {
        const newRumble = rumbleType === 'mens' ? result.state.mensRumble : result.state.womensRumble;
        const assignments = newRumble.assignments;

        // Animate each user's draw
        for (let i = 0; i < matchState.users.length; i++) {
          setAnimatingIndex(i);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform lottery draw');
      console.error('Lottery draw failed:', err);
    } finally {
      setIsDrawing(false);
      setAnimatingIndex(-1);
    }
  };

  // Get all draws for display
  const allDraws = matchState.users.map(user => {
    const numbers = Object.entries(rumble.assignments)
      .filter(([_, uid]) => uid === user.id)
      .map(([num]) => parseInt(num))
      .sort((a, b) => a - b);
    return { user, numbers };
  });

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* Draw Button */}
      {!hasAssignments && (
        <div className="text-center">
          {canDraw ? (
            <button
              onClick={handleDraw}
              disabled={isDrawing}
              className={`
                px-8 py-4 rounded-xl text-white font-bold text-lg
                bg-gradient-to-r from-${themeColor}-600 to-purple-600
                hover:from-${themeColor}-500 hover:to-purple-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all transform hover:scale-105
                shadow-lg shadow-${themeColor}-500/25
              `}
            >
              {isDrawing ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Drawing Numbers...
                </span>
              ) : (
                `Draw ${rumbleType === 'mens' ? "Men's" : "Women's"} Rumble Numbers`
              )}
            </button>
          ) : (
            <div className="text-gray-400">
              <p className="mb-2">Waiting for admin to draw lottery numbers...</p>
              <p className="text-sm text-gray-500">Numbers will appear here once drawn</p>
            </div>
          )}
          {canDraw && (
            <p className="text-gray-400 text-sm mt-3">
              Each player will receive 2 random numbers (1-30)
            </p>
          )}
        </div>
      )}

      {/* Results */}
      {hasAssignments && (
        <div className="space-y-4">
          <h3 className="text-white font-semibold text-lg text-center">
            {rumbleType === 'mens' ? "Men's" : "Women's"} Rumble Assignments
          </h3>

          {/* Your Numbers (highlighted) */}
          {currentUser && userNumbers.length > 0 && (
            <div className={`bg-${themeColor}-900/20 border border-${themeColor}-600 rounded-xl p-4 mb-4`}>
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
                        animate-bounce-in
                      `}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {num}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* All Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allDraws.map(({ user, numbers }, index) => {
              const isCurrentUser = currentUser?.id === user.id;
              const isAnimating = animatingIndex === index;

              return (
                <div
                  key={user.id}
                  className={`
                    p-3 rounded-lg border transition-all duration-300
                    ${isCurrentUser
                      ? `bg-${themeColor}-900/20 border-${themeColor}-600`
                      : 'bg-gray-800 border-gray-700'}
                    ${isAnimating ? 'scale-105 ring-2 ring-yellow-400' : ''}
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

          {/* Redraw Button (Admin only) */}
          {canDraw && (
            <div className="text-center pt-4">
              <button
                onClick={handleDraw}
                disabled={isDrawing}
                className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
              >
                Redraw All Numbers
              </button>
            </div>
          )}
        </div>
      )}

      {/* Numbers Reference */}
      <div className="mt-8 p-4 bg-gray-800 rounded-xl">
        <h4 className="text-white font-medium mb-3">Number Distribution</h4>
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
                title={assignedUser ? `${assignedUser.name}` : 'Unassigned'}
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
        <p className="text-gray-500 text-xs mt-2 text-center">
          Hover over numbers to see who has them
        </p>
      </div>
    </div>
  );
}
