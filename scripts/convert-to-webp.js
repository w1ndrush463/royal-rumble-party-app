/**
 * Convert all wrestler images to WebP format
 * Run with: node scripts/convert-to-webp.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_PATH = path.join(__dirname, '../public/wrestlers');
const WRESTLERS_PATH = path.join(__dirname, '../src/data/wrestlers.json');

// Target size for uniform images (portrait style)
const TARGET_WIDTH = 200;
const TARGET_HEIGHT = 200;
const QUALITY = 80;

async function convertFolder(folder) {
  const folderPath = path.join(PUBLIC_PATH, folder);
  if (!fs.existsSync(folderPath)) {
    console.log(`Folder not found: ${folderPath}`);
    return { converted: 0, failed: 0, skipped: 0 };
  }

  const files = fs.readdirSync(folderPath);
  let converted = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const ext = path.extname(file).toLowerCase();

    // Skip non-image files and already converted webp
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
      if (ext === '.webp') skipped++;
      continue;
    }

    const baseName = path.basename(file, ext);
    const webpPath = path.join(folderPath, `${baseName}.webp`);

    try {
      await sharp(filePath)
        .resize(TARGET_WIDTH, TARGET_HEIGHT, {
          fit: 'cover',
          position: 'top' // Focus on face/upper body
        })
        .webp({ quality: QUALITY })
        .toFile(webpPath);

      // Delete original file
      fs.unlinkSync(filePath);
      converted++;

      if (converted % 50 === 0) {
        console.log(`  ${folder}: Converted ${converted} images...`);
      }
    } catch (err) {
      console.error(`  Failed to convert ${file}: ${err.message}`);
      failed++;
    }
  }

  return { converted, failed, skipped };
}

async function updateWrestlersJson() {
  const data = JSON.parse(fs.readFileSync(WRESTLERS_PATH, 'utf-8'));
  let updated = 0;

  for (const wrestler of data.wrestlers) {
    if (wrestler.imageUrl) {
      // Change extension to .webp
      const newUrl = wrestler.imageUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp');
      if (newUrl !== wrestler.imageUrl) {
        wrestler.imageUrl = newUrl;
        updated++;
      }
    }
  }

  fs.writeFileSync(WRESTLERS_PATH, JSON.stringify(data, null, 2));
  return updated;
}

async function main() {
  console.log('Converting wrestler images to WebP format...\n');

  const folders = ['wwe', 'aew', 'tna'];
  let totalConverted = 0;
  let totalFailed = 0;

  for (const folder of folders) {
    console.log(`Processing ${folder.toUpperCase()}...`);
    const { converted, failed, skipped } = await convertFolder(folder);
    console.log(`  Converted: ${converted}, Failed: ${failed}, Skipped: ${skipped}`);
    totalConverted += converted;
    totalFailed += failed;
  }

  console.log(`\nTotal converted: ${totalConverted}`);
  console.log(`Total failed: ${totalFailed}`);

  console.log('\nUpdating wrestlers.json...');
  const updated = await updateWrestlersJson();
  console.log(`Updated ${updated} image URLs`);

  console.log('\nDone!');
}

main().catch(console.error);
