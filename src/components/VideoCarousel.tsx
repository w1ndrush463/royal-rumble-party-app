import { useState, useEffect } from 'react';

interface Video {
  filename: string;
  title: string;
  year: string;
}

// Parse video files to extract metadata
const videos: Video[] = [
  { filename: '1988-WWF-Royal-Rumble-Commercial-on-USA-Network.mp4', title: 'WWF Royal Rumble Commercial', year: '1988' },
  { filename: 'Royal-Rumble-1991-WWF-PPV-Commercial.mp4', title: 'WWF PPV Commercial', year: '1991' },
  { filename: 'Rare-WWF-Royal-Rumble-1991-Localized-to-Lehigh-Valley-Commercial-January-1991.mp4', title: 'Local TV Commercial', year: '1991' },
  { filename: 'WWF-Royal-Rumble-SNES-and-Sega-Genesis-Video-Game-Ad-1993-.mp4', title: 'Video Game Ad (SNES/Genesis)', year: '1993' },
  { filename: 'WWF-Royal-Rumble-Mega-Drive-Acclaim-1993-UK-TV-ad.mp4', title: 'Mega Drive UK Ad', year: '1993' },
  { filename: 'Commercial-WWF-Royal-Rumble-1996-Bret-Hart-vs-Undertaker.mp4', title: 'Bret Hart vs Undertaker', year: '1996' },
  { filename: 'WWF-Royal-Rumble-1996-commercial.mp4', title: 'WWF Commercial', year: '1996' },
  { filename: 'Commercial-WWF-Royal-Rumble-Adam-George-1997-01-19-.mp4', title: 'Adam & George Promo', year: '1997' },
  { filename: '1998-Royal-Rumble-Commercial.mp4', title: 'Royal Rumble Commercial', year: '1998' },
  { filename: 'WWF-Royal-Rumble-1998-Commercial.mp4', title: 'WWF Commercial', year: '1998' },
  { filename: 'WWE-Royal-Rumble-98-PPV-Commercial.mp4', title: 'PPV Commercial', year: '1998' },
  { filename: 'Commercial-WWF-Royal-Rumble-1999.mp4', title: 'WWF Commercial', year: '1999' },
  { filename: 'WWF-Royal-Rumble-2000-Commercial.mp4', title: 'WWF Commercial', year: '2000' },
  { filename: 'Commercial-WWF-Home-Video-Divas-Stone-Cold-Royal-Rumble-WrestleMania-TLC-2000-.mp4', title: 'Home Video Ad', year: '2000' },
  { filename: 'Commercial-WWF-Royal-Rumble-2000-Encore-Presentation.mp4', title: 'Encore Presentation', year: '2000' },
  { filename: 'WWF-Royal-Rumble-2001-Commercial.mp4', title: 'WWF Commercial', year: '2001' },
  { filename: 'WWE-Royal-Rumble-2001-PPV-Commercial.mp4', title: 'PPV Commercial', year: '2001' },
  { filename: 'WWF-Royal-Rumble-2002-Commercial.mp4', title: 'WWF Commercial', year: '2002' },
  { filename: 'WWE-royal-rumble-2003-ad.mp4', title: 'WWE Ad', year: '2003' },
  { filename: 'WWE-Royal-Rumble-2003-Commercial-2.mp4', title: 'WWE Commercial', year: '2003' },
  { filename: 'Commercial-WWE-Royal-Rumble-2003-Kurt-Angle-vs-Chris-Benoit.mp4', title: 'Angle vs Benoit', year: '2003' },
  { filename: 'Commercial-WWE-Royal-Rumble-2003-The-Dead-Man-Walks-Again.mp4', title: 'The Dead Man Walks Again', year: '2003' },
  { filename: 'Royal-Rumble-2004-commercial-1.mp4', title: 'Commercial #1', year: '2004' },
  { filename: 'Royal-Rumble-2004-commercial-2.mp4', title: 'Commercial #2', year: '2004' },
  { filename: 'Commercial-WWE-Royal-Rumble-2004.mp4', title: 'WWE Commercial', year: '2004' },
  { filename: 'Commercial-WWE-Royal-Rumble-2004-Brock-Lesnar-vs-Hardcore-Holly.mp4', title: 'Lesnar vs Holly', year: '2004' },
  { filename: 'Royal-Rumble-05-Commercial.mp4', title: 'Commercial', year: '2005' },
  { filename: 'Royal-Rumble-2005-Commercial.mp4', title: 'WWE Commercial', year: '2005' },
  { filename: 'WWE-Royal-Rumble-2006-Promo.mp4', title: 'WWE Promo', year: '2006' },
  { filename: 'Wwe-Royal-Rumble-2008-Commercial.mp4', title: 'WWE Commercial', year: '2008' },
  { filename: 'WWE-Royal-Rumble-2008.mp4', title: 'WWE Promo', year: '2008' },
  { filename: 'WWE-royal-rumble-train-promo-2008.mp4', title: 'Train Promo', year: '2008' },
  { filename: 'Wwe-Royal-Rumble-2009-Commercial.mp4', title: 'WWE Commercial', year: '2009' },
  { filename: 'WWE-Royal-Rumble-2011-Commercial.mp4', title: 'WWE Commercial', year: '2011' },
  { filename: 'WWE-Royal-Rumble-2013-Commercial.mp4', title: 'WWE Commercial', year: '2013' },
  { filename: 'WWE-Royal-Rumble-2014-Promo-Commercial-Short-Version-.mp4', title: 'Promo (Short)', year: '2014' },
  { filename: 'An-extended-look-at-the-2014-Royal-Rumble-commercial.mp4', title: 'Extended Look', year: '2014' },
  { filename: 'Royal-Rumble-2014-commercial-bloopers.mp4', title: 'Commercial Bloopers', year: '2014' },
  { filename: 'Royal-Rumble-Video-Game-Commercial.mp4', title: 'Video Game Commercial', year: 'Classic' },
  { filename: 'Sega-Genesis-Super-NES-WWF-Royal-Rumble-Commercial.mp4', title: 'SNES/Genesis Game', year: 'Classic' },
  { filename: 'SNES-Royal-Rumble-wwf-commercial.mp4', title: 'SNES Game Commercial', year: 'Classic' },
];

export default function VideoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentVideo = videos[currentIndex];

  const nextVideo = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  const prevVideo = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const playRandom = () => {
    const randomIndex = Math.floor(Math.random() * videos.length);
    setCurrentIndex(randomIndex);
    setIsPlaying(true);
  };

  return (
    <div className="vaporwave-card p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-bold">
          <span className="gold-chrome-text">CLASSIC</span>
          <span className="text-white"> COMMERCIALS</span>
        </h3>
        <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
          {currentIndex + 1} / {videos.length}
        </span>
      </div>

      {/* Video Player */}
      <div className="relative rounded-lg overflow-hidden bg-black video-player">
        <video
          key={currentVideo.filename}
          className="w-full aspect-video"
          controls
          autoPlay={isPlaying}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={`/videos/${currentVideo.filename}`} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay with video info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pointer-events-none">
          <div className="text-white font-bold">{currentVideo.title}</div>
          <div className="text-cyan-400 text-sm">Royal Rumble {currentVideo.year}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-4 gap-2">
        <button
          onClick={prevVideo}
          className="flex-1 py-2 px-3 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors text-sm font-medium"
        >
          ← Prev
        </button>

        <button
          onClick={playRandom}
          className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-lg transition-colors text-sm font-bold"
        >
          🎲 Random
        </button>

        <button
          onClick={nextVideo}
          className="flex-1 py-2 px-3 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 rounded-lg transition-colors text-sm font-medium"
        >
          Next →
        </button>
      </div>

      {/* Year quick select */}
      <div className="mt-4 flex flex-wrap gap-1">
        {['1988', '1991', '1996', '1998', '2000', '2003', '2004', '2008', '2014', 'Classic'].map((year) => (
          <button
            key={year}
            onClick={() => {
              const idx = videos.findIndex(v => v.year === year);
              if (idx >= 0) setCurrentIndex(idx);
            }}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentVideo.year === year
                ? 'bg-cyan-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {year}
          </button>
        ))}
      </div>
    </div>
  );
}
