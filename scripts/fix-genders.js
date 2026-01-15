/**
 * Fix wrestler genders by scraping from Cagematch
 * Run with: node scripts/fix-genders.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WRESTLERS_PATH = path.join(__dirname, '../src/data/wrestlers.json');
const DELAY_MS = 300; // Rate limiting

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search for wrestler on Cagematch and get their gender
async function getGenderFromCagematch(name) {
  // URL encode the name for search
  const searchName = encodeURIComponent(name);
  const searchUrl = `https://www.cagematch.net/?id=2&view=workers&search=${searchName}`;

  try {
    const response = await fetch(searchUrl);
    const html = await response.text();

    // Look for exact name match in search results and get their profile link
    const namePattern = new RegExp(`id=2&amp;nr=(\\d+)&amp;[^"]*">${escapeRegex(name)}<`, 'i');
    const match = namePattern.exec(html);

    if (!match) {
      // Try partial match
      const partialPattern = /id=2&amp;nr=(\d+)&amp;[^"]*">([^<]+)</;
      const partialMatch = partialPattern.exec(html);
      if (!partialMatch) return null;
    }

    const wrestlerId = match ? match[1] : null;
    if (!wrestlerId) return null;

    // Fetch the wrestler's profile page
    await sleep(100);
    const profileUrl = `https://www.cagematch.net/?id=2&nr=${wrestlerId}`;
    const profileResponse = await fetch(profileUrl);
    const profileHtml = await profileResponse.text();

    // Extract gender from profile
    if (profileHtml.includes('Gender:</div>') || profileHtml.includes('Gender:')) {
      if (profileHtml.includes('>female<') || profileHtml.includes('Gender: female') ||
          profileHtml.includes('>Female<') || /Gender:<[^>]*>[^<]*female/i.test(profileHtml)) {
        return 'female';
      }
      if (profileHtml.includes('>male<') || profileHtml.includes('Gender: male') ||
          profileHtml.includes('>Male<') || /Gender:<[^>]*>[^<]*male/i.test(profileHtml)) {
        return 'male';
      }
    }

    return null;
  } catch (err) {
    return null;
  }
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function main() {
  const data = JSON.parse(fs.readFileSync(WRESTLERS_PATH, 'utf-8'));

  // Get wrestlers currently marked as male (potential misclassifications)
  const maleWrestlers = data.wrestlers.filter(w => w.gender === 'male');
  console.log(`Checking ${maleWrestlers.length} wrestlers marked as male...\n`);

  const fixes = [];
  let checked = 0;

  for (const wrestler of maleWrestlers) {
    checked++;
    process.stdout.write(`[${checked}/${maleWrestlers.length}] ${wrestler.name}... `);

    const gender = await getGenderFromCagematch(wrestler.name);

    if (gender === 'female') {
      console.log('FEMALE - fixing!');
      fixes.push(wrestler.name);
      wrestler.gender = 'female';
    } else if (gender === 'male') {
      console.log('confirmed male');
    } else {
      console.log('not found');
    }

    await sleep(DELAY_MS);

    // Save progress every 50 wrestlers
    if (checked % 50 === 0) {
      fs.writeFileSync(WRESTLERS_PATH, JSON.stringify(data, null, 2));
      console.log(`\n--- Saved progress (${fixes.length} fixes so far) ---\n`);
    }
  }

  // Final save
  fs.writeFileSync(WRESTLERS_PATH, JSON.stringify(data, null, 2));

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! Fixed ${fixes.length} wrestlers to female:`);
  fixes.forEach(name => console.log(`  - ${name}`));
}

main().catch(console.error);
