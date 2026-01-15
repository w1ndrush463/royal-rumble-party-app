/**
 * Script to match wrestler images to wrestlers in wrestlers.json
 * Run with: node scripts/match-images.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRESTLERS_PATH = path.join(__dirname, '../src/data/wrestlers.json');
const PUBLIC_PATH = path.join(__dirname, '../public/wrestlers');

// Load wrestlers
const wrestlersData = JSON.parse(fs.readFileSync(WRESTLERS_PATH, 'utf-8'));

// Load all images from each folder
function loadImages(folder) {
  const folderPath = path.join(PUBLIC_PATH, folder);
  if (!fs.existsSync(folderPath)) return [];
  return fs.readdirSync(folderPath).filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));
}

const wweImages = loadImages('wwe');
const aewImages = loadImages('aew');
const tnaImages = loadImages('tna');

console.log(`Loaded ${wweImages.length} WWE images`);
console.log(`Loaded ${aewImages.length} AEW images`);
console.log(`Loaded ${tnaImages.length} TNA images`);

// Normalize a name for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Get the base name from a filename (without extension)
function getBaseName(filename) {
  return path.basename(filename, path.extname(filename));
}

// Find best matching image for a wrestler
function findImage(wrestler, images, folder) {
  const wrestlerName = normalizeName(wrestler.name);
  const wrestlerParts = wrestlerName.split(' ');

  let bestMatch = null;
  let bestScore = 0;

  for (const img of images) {
    const imgName = normalizeName(getBaseName(img));
    const imgParts = imgName.split(' ');

    // Exact match
    if (imgName === wrestlerName) {
      return `/wrestlers/${folder}/${img}`;
    }

    // Calculate similarity score
    let score = 0;

    // Check if all wrestler name parts appear in image name
    const allPartsMatch = wrestlerParts.every(part => imgName.includes(part));
    if (allPartsMatch) {
      score += 100;
    }

    // Check individual parts
    for (const part of wrestlerParts) {
      if (imgName.includes(part)) {
        score += part.length; // Longer matches are better
      }
    }

    // Bonus for same number of words
    if (wrestlerParts.length === imgParts.length) {
      score += 10;
    }

    // Check for common variations
    const variations = getNameVariations(wrestler.name);
    for (const variation of variations) {
      if (imgName === normalizeName(variation)) {
        score += 200; // High score for known variations
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = img;
    }
  }

  // Only return if we have a reasonable match
  if (bestScore >= 50) {
    return `/wrestlers/${folder}/${bestMatch}`;
  }

  return null;
}

// Get name variations for common aliases
function getNameVariations(name) {
  const variations = [name];

  // Common variations mapping
  const aliases = {
    'CM Punk': ['cm-punk', 'cmpunk'],
    'The Rock': ['the-rock', 'rock', 'dwayne-johnson'],
    'Stone Cold Steve Austin': ['stone-cold', 'steve-austin', 'stonecoldsteveaustin'],
    'Triple H': ['triple-h', 'tripleh', 'hhh'],
    'The Undertaker': ['undertaker', 'the-undertaker'],
    'John Cena': ['john-cena', 'johncena'],
    'Randy Orton': ['randy-orton', 'randyorton'],
    'Roman Reigns': ['roman-reigns', 'romanreigns'],
    'Seth Rollins': ['seth-rollins', 'sethrollins'],
    'Cody Rhodes': ['cody-rhodes', 'codyrhodes'],
    'Brock Lesnar': ['brock-lesnar', 'brocklesnar'],
    'Edge': ['edge', 'adam-copeland', 'adam copeland edge'],
    'AJ Styles': ['aj-styles', 'ajstyles'],
    'Kevin Owens': ['kevin-owens', 'kevinowens'],
    'Sami Zayn': ['sami-zayn', 'samizayn'],
    'Gunther': ['gunther', 'walter'],
    'Rhea Ripley': ['rhea-ripley', 'rhearipley'],
    'Bianca Belair': ['bianca-belair', 'biancabelair'],
    'Charlotte Flair': ['charlotte-flair', 'charlotteflair', 'charlotte'],
    'Becky Lynch': ['becky-lynch', 'beckylynch'],
    'LA Knight': ['la-knight', 'laknight', 'eli-drake'],
    'Jey Uso': ['jey-uso', 'jeyuso'],
    'Jimmy Uso': ['jimmy-uso', 'jimmyuso'],
    'Solo Sikoa': ['solo-sikoa', 'solosikoa'],
    'Jade Cargill': ['jade-cargill', 'jadecargill'],
    'Damian Priest': ['damian-priest', 'damianpriest'],
    'Drew McIntyre': ['drew-mcintyre', 'drewmcintyre'],
    'MJF': ['mjf', 'maxwell jacob friedman'],
    'Jon Moxley': ['jon-moxley', 'jonmoxley', 'dean-ambrose'],
    'Chris Jericho': ['chris-jericho', 'chrisjericho'],
    'Kenny Omega': ['kenny-omega', 'kennyomega'],
    'Hangman Adam Page': ['hangman-adam-page', 'adam-page', 'hangman'],
    'Bryan Danielson': ['bryan-danielson', 'bryandanielson', 'daniel-bryan', 'daniel bryan'],
    'Sting': ['sting'],
    'Jeff Hardy': ['jeff-hardy', 'jeffhardy'],
    'Matt Hardy': ['matt-hardy', 'matthardy'],
    'Rey Mysterio': ['rey-mysterio', 'reymysterio'],
    'Dominik Mysterio': ['dominik-mysterio', 'dominikmysterio'],
    'Nia Jax': ['nia-jax', 'niajax'],
    'Bayley': ['bayley'],
    'Asuka': ['asuka'],
    'IYO SKY': ['iyo-sky', 'iyosky', 'io-shirai'],
    'Liv Morgan': ['liv-morgan', 'livmorgan'],
    'Tiffany Stratton': ['tiffany-stratton', 'tiffanystratton'],
    'Braun Strowman': ['braun-strowman', 'braunstrowman'],
    'Sheamus': ['sheamus'],
    'Pete Dunne': ['pete-dunne', 'petedunne', 'butch'],
    'Butch': ['butch', 'pete-dunne'],
    'Ludwig Kaiser': ['ludwig-kaiser', 'ludwigkaiser', 'marcel-barthel'],
    'Kazuchika Okada': ['kazuchika-okada', 'okada'],
    'Will Ospreay': ['will-ospreay', 'willospreay'],
    'Kofi Kingston': ['kofi-kingston', 'kofikingston', 'kofi'],
    'Xavier Woods': ['xavier-woods', 'xavierwoods'],
    'Big E': ['big-e', 'bige'],
    'Shinsuke Nakamura': ['shinsuke-nakamura', 'shinsukenakamura', 'nakamura'],
    'Ricochet': ['ricochet'],
    'Andrade': ['andrade', 'andrade-el-idolo'],
    'Karrion Kross': ['karrion-kross', 'karrionkross', 'kross'],
    'Scarlett': ['scarlett', 'scarlett-bordeaux'],
    'Trick Williams': ['trick-williams', 'trickwilliams'],
    'Carmelo Hayes': ['carmelo-hayes', 'carmelohayes'],
    'Bron Breakker': ['bron-breakker', 'bronbreakker'],
    'Roxanne Perez': ['roxanne-perez', 'roxanneperez'],
    'Giulia': ['giulia'],
    'Oba Femi': ['oba-femi', 'obafemi'],
    'Ethan Page': ['ethan-page', 'ethanpage'],
    'Joe Hendry': ['joe-hendry', 'joehendry'],
    'Moose': ['moose'],
    'Frankie Kazarian': ['frankie-kazarian', 'frankiekazarian'],
    'Mustafa Ali': ['mustafa-ali', 'mustafaali'],
    'Nic Nemeth': ['nic-nemeth', 'nicnemeth', 'dolph-ziggler'],
  };

  if (aliases[name]) {
    variations.push(...aliases[name]);
  }

  return variations;
}

// Match images for all wrestlers
let matched = 0;
let unmatched = 0;
const unmatchedWrestlers = [];

for (const wrestler of wrestlersData.wrestlers) {
  let imageUrl = null;

  // Determine which folder to search based on promotion
  if (wrestler.promotion === 'WWE' || wrestler.promotion === 'NXT') {
    imageUrl = findImage(wrestler, wweImages, 'wwe');
  } else if (wrestler.promotion === 'AEW') {
    imageUrl = findImage(wrestler, aewImages, 'aew');
    // Also check WWE images for former WWE wrestlers now in AEW
    if (!imageUrl) {
      imageUrl = findImage(wrestler, wweImages, 'wwe');
    }
  } else if (wrestler.promotion === 'TNA') {
    imageUrl = findImage(wrestler, tnaImages, 'tna');
    // Also check WWE/AEW images for TNA wrestlers
    if (!imageUrl) {
      imageUrl = findImage(wrestler, wweImages, 'wwe');
    }
    if (!imageUrl) {
      imageUrl = findImage(wrestler, aewImages, 'aew');
    }
  }

  // For legends/HOF, check all folders
  if (!imageUrl && (wrestler.isHallOfFamer || wrestler.isLegend)) {
    imageUrl = findImage(wrestler, wweImages, 'wwe') ||
               findImage(wrestler, aewImages, 'aew') ||
               findImage(wrestler, tnaImages, 'tna');
  }

  if (imageUrl) {
    wrestler.imageUrl = imageUrl;
    matched++;
  } else {
    wrestler.imageUrl = ''; // Keep empty for unmatched
    unmatched++;
    unmatchedWrestlers.push(wrestler.name);
  }
}

// Save updated wrestlers
fs.writeFileSync(WRESTLERS_PATH, JSON.stringify(wrestlersData, null, 2));

console.log(`\nMatched: ${matched}`);
console.log(`Unmatched: ${unmatched}`);
console.log(`\nUnmatched wrestlers:`);
unmatchedWrestlers.forEach(name => console.log(`  - ${name}`));
