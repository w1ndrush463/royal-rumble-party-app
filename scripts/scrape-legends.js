/**
 * Scrape WWE All-Time Roster from Cagematch (1985-2026)
 * Match wrestlers to available images and add to wrestlers.json
 *
 * Run with: node scripts/scrape-legends.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRESTLERS_PATH = path.join(__dirname, '../src/data/wrestlers.json');
const WWE_IMAGES_PATH = path.join(__dirname, '../public/wrestlers/wwe');
const UNMATCHED_OUTPUT = path.join(__dirname, '../unmatched-legends.txt');

const START_YEAR = 1985;
const END_YEAR = 2026;

// Rate limiting
const DELAY_MS = 500;
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load existing wrestlers
const wrestlersData = JSON.parse(fs.readFileSync(WRESTLERS_PATH, 'utf-8'));
const existingNames = new Set(wrestlersData.wrestlers.map(w => normalizeName(w.name)));
const existingIds = new Set(wrestlersData.wrestlers.map(w => w.id));

// Load available images
const availableImages = fs.readdirSync(WWE_IMAGES_PATH)
  .filter(f => f.endsWith('.webp'))
  .map(f => ({
    filename: f,
    baseName: path.basename(f, '.webp'),
    normalized: normalizeName(path.basename(f, '.webp'))
  }));

console.log(`Loaded ${existingNames.size} existing wrestlers`);
console.log(`Found ${availableImages.length} WWE images`);

// Normalize name for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Generate potential normalized variations of a name
function getNameVariations(name) {
  const variations = new Set();
  const normalized = normalizeName(name);
  variations.add(normalized);

  // Original with just lowercase
  variations.add(name.toLowerCase().replace(/\s+/g, '-'));
  variations.add(name.toLowerCase().replace(/\s+/g, ''));

  // Handle "The X" -> "X" and vice versa
  if (name.toLowerCase().startsWith('the ')) {
    variations.add(normalizeName(name.slice(4)));
  }

  // Handle quotes and special characters
  const cleanName = name.replace(/["']/g, '');
  variations.add(normalizeName(cleanName));

  // Handle common suffixes
  const suffixes = [' Jr.', ' Jr', ' III', ' II', ' Sr.', ' Sr'];
  for (const suffix of suffixes) {
    if (name.endsWith(suffix)) {
      variations.add(normalizeName(name.slice(0, -suffix.length)));
    }
  }

  return Array.from(variations);
}

// Find matching image for a wrestler name
function findMatchingImage(name) {
  const variations = getNameVariations(name);

  for (const variation of variations) {
    const match = availableImages.find(img => img.normalized === variation);
    if (match) {
      return match.filename;
    }
  }

  // Try partial matching for longer names
  const nameParts = name.toLowerCase().split(/\s+/);
  if (nameParts.length >= 2) {
    // Try first + last name
    const firstLast = normalizeName(nameParts[0] + nameParts[nameParts.length - 1]);
    const match = availableImages.find(img => img.normalized === firstLast);
    if (match) return match.filename;

    // Try just last name for single-word image names
    const lastName = normalizeName(nameParts[nameParts.length - 1]);
    const lastMatch = availableImages.find(img => img.normalized === lastName && img.baseName.length > 4);
    if (lastMatch) return lastMatch.filename;
  }

  return null;
}

// Create wrestler ID from name
function createId(name) {
  let id = name
    .toLowerCase()
    .replace(/[''""]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure unique ID
  let baseId = id;
  let counter = 1;
  while (existingIds.has(id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }

  return id;
}

// Fetch a single year's roster
async function fetchYearRoster(year) {
  const url = `https://www.cagematch.net/?id=8&nr=1&page=16&year=${year}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`  Failed to fetch ${year}: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Extract wrestler names from links with ?id=2 (individual wrestlers)
    // HTML uses &amp; encoding for & characters
    const wrestlerPattern = /id=2&amp;nr=\d+&amp;[^"]*">([^<]+)</g;
    const wrestlers = [];
    let match;

    while ((match = wrestlerPattern.exec(html)) !== null) {
      const name = match[1].trim();
      // Skip empty or very short names
      if (name.length > 1) {
        wrestlers.push(name);
      }
    }

    return wrestlers;
  } catch (err) {
    console.error(`  Error fetching ${year}: ${err.message}`);
    return [];
  }
}

// Main function
async function main() {
  console.log(`\nScraping WWE All-Time Roster from ${START_YEAR} to ${END_YEAR}...\n`);

  const allWrestlers = new Set();

  // Fetch all years
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    process.stdout.write(`Fetching ${year}...`);
    const wrestlers = await fetchYearRoster(year);
    wrestlers.forEach(w => allWrestlers.add(w));
    console.log(` found ${wrestlers.length} wrestlers (total unique: ${allWrestlers.size})`);
    await sleep(DELAY_MS);
  }

  console.log(`\nTotal unique wrestlers from Cagematch: ${allWrestlers.size}`);

  // Filter out existing wrestlers
  const newWrestlers = Array.from(allWrestlers).filter(name => {
    return !existingNames.has(normalizeName(name));
  });

  console.log(`New wrestlers (not in database): ${newWrestlers.length}`);

  // Match against images
  const matched = [];
  const unmatched = [];

  for (const name of newWrestlers) {
    const imageFile = findMatchingImage(name);
    if (imageFile) {
      matched.push({ name, imageFile });
    } else {
      unmatched.push(name);
    }
  }

  console.log(`\nMatched with images: ${matched.length}`);
  console.log(`Unmatched (no image): ${unmatched.length}`);

  // Add matched wrestlers to wrestlers.json
  console.log('\nAdding matched wrestlers to database...');

  for (const { name, imageFile } of matched) {
    const id = createId(name);
    existingIds.add(id);

    const wrestler = {
      id,
      name,
      promotion: 'WWE',
      brand: null,
      gender: 'male', // Default, may need manual review
      isCurrentChampion: false,
      championships: [],
      isFormerChampion: false,
      isFormerRumbleWinner: false,
      rumbleWins: [],
      rumbleAppearances: 0,
      isHallOfFamer: false,
      isLegend: true,
      imageUrl: `/wrestlers/wwe/${imageFile}`
    };

    wrestlersData.wrestlers.push(wrestler);
  }

  // Save updated wrestlers.json
  fs.writeFileSync(WRESTLERS_PATH, JSON.stringify(wrestlersData, null, 2));
  console.log(`Added ${matched.length} wrestlers to wrestlers.json`);

  // Save unmatched list
  const unmatchedContent = `WWE Wrestlers Without Images (${unmatched.length} total)\n` +
    `Generated: ${new Date().toISOString()}\n` +
    `=`.repeat(50) + '\n\n' +
    unmatched.sort().join('\n');

  fs.writeFileSync(UNMATCHED_OUTPUT, unmatchedContent);
  console.log(`\nUnmatched wrestlers saved to: unmatched-legends.txt`);

  // Show some examples of matched wrestlers
  console.log('\nSample matched wrestlers:');
  matched.slice(0, 10).forEach(({ name, imageFile }) => {
    console.log(`  ${name} -> ${imageFile}`);
  });

  console.log('\nDone!');
}

main().catch(console.error);
