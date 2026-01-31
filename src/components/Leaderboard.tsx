import { useStore } from '@nanostores/react';
import { $leaderboard } from '../stores/scoreStore';
import { $matchState } from '../stores/matchStore';
import { getWrestler } from '../stores/matchStore';
import type { RumbleMatch } from '../types';

function RumbleStats({ rumble, label, accentColor }: { rumble: RumbleMatch; label: string; accentColor: string }) {
  const totalEntrants = Object.keys(rumble.entrants).length;
  const inRing = totalEntrants - rumble.eliminations.length;
  const winnerName = rumble.winner ? getWrestler(rumble.winner)?.name || rumble.winner : '-';

  const statusLabel = rumble.status === 'not_started' ? 'Not Started'
    : rumble.status === 'in_progress' ? 'In Progress'
    : 'Completed';

  return (
    <section className="vaporwave-card p-6">
      <h3 className={`text-lg font-bold ${accentColor === 'cyan' ? 'blue-chrome-text' : 'pink-chrome-text'} mb-4 text-center`}>
        {label} Stats
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm p-2 bg-gray-800/30 rounded">
          <span className={`text-${accentColor}-400`}>Match Status</span>
          <span className="text-white font-medium">{statusLabel}</span>
        </div>
        <div className="flex justify-between text-sm p-2 bg-gray-800/30 rounded">
          <span className={`text-${accentColor}-400`}>Entrants</span>
          <span className="text-white font-medium">{totalEntrants} / 30</span>
        </div>
        <div className="flex justify-between text-sm p-2 bg-gray-800/30 rounded">
          <span className={`text-${accentColor}-400`}>Eliminations</span>
          <span className="text-white font-medium">{rumble.eliminations.length}</span>
        </div>
        {rumble.status === 'in_progress' && (
          <div className="flex justify-between text-sm p-2 bg-gray-800/30 rounded">
            <span className={`text-${accentColor}-400`}>In Ring</span>
            <span className="text-white font-medium">{inRing}</span>
          </div>
        )}
        <div className="flex justify-between text-sm p-2 bg-gray-800/30 rounded">
          <span className={`text-${accentColor}-400`}>Winner</span>
          <span className="text-white font-medium">{winnerName}</span>
        </div>
      </div>
    </section>
  );
}

function AwardCard({ emoji, title, subtitle, value, gradient, borderColor, hoverBorder, textColor }: {
  emoji: string;
  title: string;
  subtitle: string;
  value: string;
  gradient: string;
  borderColor: string;
  hoverBorder: string;
  textColor: string;
}) {
  return (
    <div className={`p-4 bg-gradient-to-br ${gradient} rounded-lg text-center border ${borderColor} hover:${hoverBorder} transition-all group`}>
      <div className="text-3xl mb-2 group-hover:animate-bounce">{emoji}</div>
      <div className={`text-white font-bold group-hover:${textColor} transition-colors`}>{title}</div>
      <div className="text-purple-300 text-xs mb-2">{subtitle}</div>
      <div className={`${textColor} font-bold`}>{value}</div>
    </div>
  );
}

export default function Leaderboard() {
  const leaderboard = useStore($leaderboard);
  const state = useStore($matchState);

  // Determine award winners
  const topScorer = leaderboard[0];

  // Royal Champion: user whose wrestler won either rumble
  let royalChampion = '-';
  for (const rumble of [state.mensRumble, state.womensRumble]) {
    if (rumble.winner) {
      const winnerEntryNum = Object.entries(rumble.entrants).find(([, id]) => id === rumble.winner)?.[0];
      if (winnerEntryNum) {
        const userId = rumble.assignments[winnerEntryNum];
        const user = state.users.find(u => u.id === userId);
        if (user) {
          royalChampion = user.name;
          break;
        }
      }
    }
  }

  // Iron Person: user with most combined ring time points
  const ironPerson = [...leaderboard].sort((a, b) => b.breakdown.ringTime - a.breakdown.ringTime)[0];
  const ironPersonValue = ironPerson && ironPerson.breakdown.ringTime > 0 ? ironPerson.name : '-';

  // Fortune Teller: most prediction points
  const fortuneTeller = [...leaderboard].sort((a, b) => b.breakdown.predictions - a.breakdown.predictions)[0];
  const fortuneTellerValue = fortuneTeller && fortuneTeller.breakdown.predictions > 0 ? fortuneTeller.name : '-';

  return (
    <div className="space-y-8">
      {/* Main Leaderboard */}
      <section className="vaporwave-card p-6">
        <h2 className="text-xl font-bold mb-4 text-center">
          <span className="gold-chrome-text">OVERALL STANDINGS</span>
        </h2>

        <div className="space-y-3">
          {leaderboard.map((user, index) => (
            <div
              key={user.userId}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                index === 0 ? 'bg-gradient-to-r from-yellow-900/40 to-transparent border border-yellow-600/50 shadow-lg shadow-yellow-500/10' :
                index === 1 ? 'bg-gradient-to-r from-gray-700/40 to-transparent border border-gray-500/30' :
                index === 2 ? 'bg-gradient-to-r from-amber-900/30 to-transparent border border-amber-700/30' :
                'bg-gray-800/50 border border-purple-800/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg ${
                index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-yellow-500/30' :
                index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black shadow-gray-400/30' :
                index === 2 ? 'bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-amber-500/30' :
                'bg-gray-700 text-gray-400'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold">{user.name}</div>
                {user.total > 0 ? (
                  <div className="text-purple-400 text-xs truncate">
                    {user.details.length > 0 ? user.details[0] : 'Points earned'}
                    {user.details.length > 1 && ` (+${user.details.length - 1} more)`}
                  </div>
                ) : (
                  <div className="text-purple-400 text-xs">No stats yet</div>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black neon-cyan">{user.total}</div>
                <div className="text-purple-400 text-xs">points</div>
              </div>
            </div>
          ))}
        </div>

        {state.mensRumble.status === 'not_started' && state.womensRumble.status === 'not_started' && (
          <p className="text-purple-400 text-sm text-center mt-4">
            Points will be calculated as the matches progress
          </p>
        )}
      </section>

      {/* Awards Section */}
      <section className="vaporwave-card p-6">
        <h2 className="text-xl font-bold mb-1 text-center">
          <span className="gold-chrome-text">PARTY AWARDS</span>
        </h2>
        <p className="text-purple-300 text-sm mb-4 text-center">Special recognition at the end of the event</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AwardCard
            emoji="&#127942;"
            title="Royal Champion"
            subtitle="Lottery winner of either Rumble"
            value={royalChampion}
            gradient="from-yellow-900/30 to-transparent"
            borderColor="border-yellow-800/30"
            hoverBorder="border-yellow-500/50"
            textColor="text-yellow-400"
          />
          <AwardCard
            emoji="&#9201;"
            title="Iron Person"
            subtitle="Most combined ring time"
            value={ironPersonValue}
            gradient="from-cyan-900/30 to-transparent"
            borderColor="border-cyan-800/30"
            hoverBorder="border-cyan-500/50"
            textColor="text-cyan-400"
          />
          <AwardCard
            emoji="&#128170;"
            title="Top Scorer"
            subtitle="Highest overall points"
            value={topScorer && topScorer.total > 0 ? topScorer.name : '-'}
            gradient="from-red-900/30 to-transparent"
            borderColor="border-red-800/30"
            hoverBorder="border-red-500/50"
            textColor="text-red-400"
          />
          <AwardCard
            emoji="&#128302;"
            title="Fortune Teller"
            subtitle="Most correct predictions"
            value={fortuneTellerValue}
            gradient="from-purple-900/30 to-transparent"
            borderColor="border-purple-800/30"
            hoverBorder="border-purple-500/50"
            textColor="text-purple-400"
          />
        </div>
      </section>

      {/* Stats Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <RumbleStats rumble={state.mensRumble} label="Men's Rumble" accentColor="cyan" />
        <RumbleStats rumble={state.womensRumble} label="Women's Rumble" accentColor="pink" />
      </div>

      {/* Point System */}
      <section className="vaporwave-card p-6">
        <h2 className="text-xl font-bold mb-4 text-center">
          <span className="gold-chrome-text">POINT SYSTEM</span>
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-gradient-to-br from-yellow-900/30 to-transparent rounded-lg border border-yellow-800/30">
            <div className="gold-chrome-text font-black text-2xl mb-1">+50</div>
            <div className="text-white font-bold">Lottery Winner</div>
            <div className="text-purple-300 text-xs">Your wrestler wins the Rumble</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-900/30 to-transparent rounded-lg border border-purple-800/30">
            <div className="neon-pink font-black text-2xl mb-1">+20</div>
            <div className="text-white font-bold">Final Four</div>
            <div className="text-purple-300 text-xs">Your wrestler makes final 4</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-cyan-900/30 to-transparent rounded-lg border border-cyan-800/30">
            <div className="neon-cyan font-black text-2xl mb-1">+1</div>
            <div className="text-white font-bold">Per Minute</div>
            <div className="text-purple-300 text-xs">Your wrestlers in the ring</div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gradient-to-r from-yellow-900/30 to-orange-900/20 border border-yellow-600/50 rounded-lg">
          <div className="text-yellow-400 text-sm">
            <strong className="text-yellow-300">Bonus Points:</strong> Correct predictions earn <span className="font-bold">+10</span> points each
          </div>
        </div>
      </section>
    </div>
  );
}
