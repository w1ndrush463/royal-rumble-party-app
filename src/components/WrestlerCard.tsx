import type { Wrestler } from '../types';

interface WrestlerCardProps {
  wrestler: Wrestler;
  entryNumber?: number;
  isEliminated?: boolean;
  isInRing?: boolean;
  isHighlighted?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
}

const promotionColors: Record<string, string> = {
  WWE: 'bg-red-600',
  AEW: 'bg-yellow-500',
  TNA: 'bg-blue-600',
  NXT: 'bg-yellow-400',
  Evolve: 'bg-purple-600',
  EVE: 'bg-pink-500',
  Shimmer: 'bg-teal-500',
  WXW: 'bg-orange-500',
  Progress: 'bg-gray-600',
};

const brandColors: Record<string, string> = {
  Raw: 'text-red-500',
  SmackDown: 'text-blue-500',
  NXT: 'text-yellow-500',
};

export default function WrestlerCard({
  wrestler,
  entryNumber,
  isEliminated = false,
  isInRing = false,
  isHighlighted = false,
  showDetails = false,
  size = 'medium',
  onClick,
}: WrestlerCardProps) {
  const sizeClasses = {
    small: 'p-2 text-sm',
    medium: 'p-3 text-base',
    large: 'p-4 text-lg',
  };

  const imageSize = {
    small: 'w-10 h-10',
    medium: 'w-14 h-14',
    large: 'w-20 h-20',
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg border transition-all duration-200
        ${sizeClasses[size]}
        ${isEliminated ? 'opacity-50 bg-gray-800 border-gray-700' : 'bg-gray-900 border-gray-700'}
        ${isInRing ? 'ring-2 ring-green-500 border-green-500' : ''}
        ${isHighlighted ? 'ring-2 ring-yellow-400 border-yellow-400 bg-yellow-900/20' : ''}
        ${onClick ? 'cursor-pointer hover:border-gray-500' : ''}
      `}
    >
      {/* Entry Number Badge */}
      {entryNumber && (
        <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          {entryNumber}
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Wrestler Image */}
        <div className={`${imageSize[size]} rounded-full bg-gray-700 flex-shrink-0 overflow-hidden`}>
          {wrestler.imageUrl ? (
            <img
              src={wrestler.imageUrl}
              alt={wrestler.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
              {wrestler.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Wrestler Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-semibold truncate ${isEliminated ? 'line-through text-gray-500' : 'text-white'}`}>
              {wrestler.name}
            </span>

            {/* Promotion Badge */}
            <span className={`px-1.5 py-0.5 rounded text-xs text-white ${promotionColors[wrestler.promotion]}`}>
              {wrestler.promotion}
            </span>
          </div>

          {/* Brand */}
          {wrestler.brand && (
            <div className={`text-xs ${brandColors[wrestler.brand]}`}>
              {wrestler.brand}
            </div>
          )}

          {/* Badges Row */}
          <div className="flex flex-wrap gap-1 mt-1">
            {/* Current Champion */}
            {wrestler.isCurrentChampion && (
              <Badge color="gold" title={wrestler.championships.join(', ')}>
                Champion
              </Badge>
            )}

            {/* Former Champion */}
            {wrestler.isFormerChampion && !wrestler.isCurrentChampion && (
              <Badge color="silver">Former Champ</Badge>
            )}

            {/* Rumble Winner */}
            {wrestler.isFormerRumbleWinner && (
              <Badge color="purple" title={wrestler.rumbleWins.map(w => `${w.year} (#${w.entryNumber})`).join(', ')}>
                RR Winner {wrestler.rumbleWins.length > 1 ? `x${wrestler.rumbleWins.length}` : ''}
              </Badge>
            )}

            {/* Hall of Famer */}
            {wrestler.isHallOfFamer && (
              <Badge color="bronze">HOF</Badge>
            )}

            {/* Legend */}
            {wrestler.isLegend && !wrestler.isHallOfFamer && (
              <Badge color="teal">Legend</Badge>
            )}
          </div>

          {/* Extended Details */}
          {showDetails && (
            <div className="mt-2 text-xs text-gray-400 space-y-1">
              {wrestler.rumbleAppearances > 0 && (
                <div>Rumble Appearances: {wrestler.rumbleAppearances}</div>
              )}
              {wrestler.notableStats?.ironmanTime && (
                <div>Ironman Time: {wrestler.notableStats.ironmanTime}</div>
              )}
              {wrestler.notableStats?.mostEliminations && (
                <div>Single Match Eliminations: {wrestler.notableStats.mostEliminations}</div>
              )}
              {wrestler.notableStats?.careerEliminations && (
                <div>Career Eliminations: {wrestler.notableStats.careerEliminations}</div>
              )}
              {wrestler.notableStats?.famousFor && (
                <div className="italic">{wrestler.notableStats.famousFor}</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Eliminated Overlay */}
      {isEliminated && (
        <div className="absolute top-1 right-1 text-xs bg-red-900 text-red-200 px-2 py-0.5 rounded">
          ELIMINATED
        </div>
      )}

      {/* In Ring Indicator */}
      {isInRing && !isEliminated && (
        <div className="absolute top-1 right-1 text-xs bg-green-900 text-green-200 px-2 py-0.5 rounded flex items-center gap-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          IN RING
        </div>
      )}
    </div>
  );
}

// Badge component
interface BadgeProps {
  children: React.ReactNode;
  color: 'gold' | 'silver' | 'purple' | 'bronze' | 'teal' | 'blue';
  title?: string;
}

function Badge({ children, color, title }: BadgeProps) {
  const colorClasses = {
    gold: 'bg-yellow-600 text-yellow-100',
    silver: 'bg-gray-500 text-gray-100',
    purple: 'bg-purple-600 text-purple-100',
    bronze: 'bg-amber-700 text-amber-100',
    teal: 'bg-teal-600 text-teal-100',
    blue: 'bg-blue-600 text-blue-100',
  };

  return (
    <span
      className={`px-1.5 py-0.5 rounded text-xs font-medium ${colorClasses[color]}`}
      title={title}
    >
      {children}
    </span>
  );
}
