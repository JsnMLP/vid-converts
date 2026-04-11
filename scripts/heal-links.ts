#!/usr/bin/env node
// ============================================================
// VID CONVERTS — SELF-HEALING LINK SCRIPT
// File: scripts/heal-links.ts
// ============================================================
// PURPOSE:
//   1. Reads every YouTube resource in resourcePool.ts
//   2. Checks if the URL is still live via YouTube oembed API
//   3. For dead links: searches YouTube Data API v3 using
//      the resource's searchQuery to find a live replacement
//   4. Writes the replacement URL back into resourcePool.ts
//   5. Logs a summary of what was fixed
//
// USAGE (run from project root):
//   npx ts-node scripts/heal-links.ts
//
// REQUIRES:
//   YOUTUBE_DATA_API_KEY in your .env.local file
//   (Add to Vercel env vars too, but this script runs locally)
//
// TO AUTOMATE (optional):
//   Add to package.json scripts:
//     "heal-links": "ts-node scripts/heal-links.ts"
//   Then run: npm run heal-links
//
//   Or set up a weekly cron on Railway — ask Claude to wire that up.
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually since this is a script, not Next.js
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const YOUTUBE_API_KEY = process.env.YOUTUBE_DATA_API_KEY;
const RESOURCE_POOL_PATH = path.join(
  process.cwd(),
  'src',
  'lib',
  'resourcePool.ts'
);

if (!YOUTUBE_API_KEY) {
  console.error(
    '\n❌  YOUTUBE_DATA_API_KEY not found in .env.local\n' +
    '    1. Go to console.cloud.google.com\n' +
    '    2. Enable YouTube Data API v3\n' +
    '    3. Create an API key\n' +
    '    4. Add to .env.local: YOUTUBE_DATA_API_KEY=your_key_here\n'
  );
  process.exit(1);
}

// ── Types ──────────────────────────────────────────────────
interface Resource {
  id: string;
  category: string;
  title: string;
  creator: string;
  platform: string;
  url: string;
  searchQuery: string;
}

// ── Check if a YouTube URL is live ────────────────────────
async function isYouTubeLive(url: string): Promise<boolean> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembedUrl, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Check if a Vimeo URL is live ──────────────────────────
async function isVimeoLive(url: string): Promise<boolean> {
  try {
    const videoId = url.split('/').pop();
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
    const res = await fetch(oembedUrl, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Search YouTube Data API for replacement ───────────────
async function findYouTubeReplacement(
  searchQuery: string
): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: '5',
      relevanceLanguage: 'en',
      safeSearch: 'none',
      key: YOUTUBE_API_KEY!,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`
    );

    if (!res.ok) {
      console.warn(`    ⚠️  YouTube API error: ${res.status}`);
      return null;
    }

    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      console.warn(`    ⚠️  No results found for: "${searchQuery}"`);
      return null;
    }

    // Take first result and verify it's live
    for (const item of items) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;

      const candidateUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const live = await isYouTubeLive(candidateUrl);

      if (live) {
        const title = item.snippet?.title || 'Unknown';
        const channel = item.snippet?.channelTitle || 'Unknown';
        console.log(`    ✅  Found replacement: "${title}" by ${channel}`);
        console.log(`        ${candidateUrl}`);
        return candidateUrl;
      }
    }

    console.warn(`    ⚠️  All candidates failed live check`);
    return null;
  } catch (err) {
    console.error(`    ❌  Search error:`, err);
    return null;
  }
}

// ── Update URL in resourcePool.ts file ───────────────────
function updateUrlInFile(
  fileContent: string,
  resourceId: string,
  oldUrl: string,
  newUrl: string
): string {
  // Find the resource block by id and replace its url field
  // We look for the id string followed eventually by the old url
  const idPattern = `id: '${resourceId}'`;
  const idIndex = fileContent.indexOf(idPattern);

  if (idIndex === -1) {
    console.warn(`    ⚠️  Could not find id '${resourceId}' in file`);
    return fileContent;
  }

  // Find the url field within 500 chars after the id
  const searchSection = fileContent.substring(idIndex, idIndex + 800);
  const oldUrlLine = `url: '${oldUrl}'`;
  const newUrlLine = `url: '${newUrl}'`;

  if (!searchSection.includes(oldUrlLine)) {
    console.warn(`    ⚠️  Could not find url field for '${resourceId}'`);
    return fileContent;
  }

  // Replace only within the resource block (not globally)
  const beforeBlock = fileContent.substring(0, idIndex);
  const block = fileContent.substring(idIndex, idIndex + 800);
  const afterBlock = fileContent.substring(idIndex + 800);

  const updatedBlock = block.replace(oldUrlLine, newUrlLine);
  return beforeBlock + updatedBlock + afterBlock;
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log('\n🔗  VID CONVERTS — Self-Healing Link Script');
  console.log('════════════════════════════════════════════\n');

  if (!fs.existsSync(RESOURCE_POOL_PATH)) {
    console.error(`❌  resourcePool.ts not found at:\n    ${RESOURCE_POOL_PATH}`);
    console.error('\n    Make sure you placed resourcePool.ts in src/lib/');
    process.exit(1);
  }

  // Dynamically require the resource pool
  // We parse the file rather than importing to avoid TS compilation issues
  let fileContent = fs.readFileSync(RESOURCE_POOL_PATH, 'utf-8');

  // Extract resources using a simple regex to find url and id fields
  // This is safer than eval — we only extract strings we need
  const resourceBlocks = fileContent.match(
    /id:\s*'([^']+)'[\s\S]*?platform:\s*'([^']+)'[\s\S]*?url:\s*'([^']+)'[\s\S]*?searchQuery:\s*'([^']+)'/g
  ) || [];

  const resources: { id: string; platform: string; url: string; searchQuery: string }[] = [];

  for (const block of resourceBlocks) {
    const idMatch = block.match(/id:\s*'([^']+)'/);
    const platformMatch = block.match(/platform:\s*'([^']+)'/);
    const urlMatch = block.match(/url:\s*'([^']+)'/);
    const queryMatch = block.match(/searchQuery:\s*'([^']+)'/);

    if (idMatch && platformMatch && urlMatch && queryMatch) {
      resources.push({
        id: idMatch[1],
        platform: platformMatch[1],
        url: urlMatch[1],
        searchQuery: queryMatch[1],
      });
    }
  }

  console.log(`📋  Found ${resources.length} resources to check\n`);

  let checkedCount = 0;
  let deadCount = 0;
  let fixedCount = 0;
  let unfixedCount = 0;
  const deadLinks: string[] = [];

  for (const resource of resources) {
    checkedCount++;
    process.stdout.write(
      `[${checkedCount}/${resources.length}] Checking ${resource.id}... `
    );

    let isLive = false;

    if (resource.platform === 'youtube') {
      isLive = await isYouTubeLive(resource.url);
    } else if (resource.platform === 'vimeo') {
      isLive = await isVimeoLive(resource.url);
    } else {
      // TikTok and Instagram — no public API to check, assume live
      isLive = true;
      process.stdout.write('skipped (TikTok/Instagram)\n');
      continue;
    }

    if (isLive) {
      process.stdout.write('✅ live\n');
      continue;
    }

    // DEAD LINK
    process.stdout.write('❌ DEAD\n');
    deadCount++;
    deadLinks.push(`${resource.id}: ${resource.url}`);

    if (resource.platform === 'youtube') {
      console.log(`    🔍  Searching for replacement...`);
      const replacement = await findYouTubeReplacement(resource.searchQuery);

      if (replacement) {
        fileContent = updateUrlInFile(
          fileContent,
          resource.id,
          resource.url,
          replacement
        );
        fixedCount++;
        console.log(`    ✍️  Updated ${resource.id} in resourcePool.ts`);
      } else {
        unfixedCount++;
        console.log(
          `    ❗  Could not auto-fix. Manual replacement needed for: ${resource.id}`
        );
      }
    } else {
      unfixedCount++;
      console.log(
        `    ❗  Vimeo replacement requires manual update for: ${resource.id}`
      );
    }

    // Pause between API calls to avoid rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  // Write updated file if any changes were made
  if (fixedCount > 0) {
    fs.writeFileSync(RESOURCE_POOL_PATH, fileContent, 'utf-8');
    console.log(`\n✍️  resourcePool.ts updated with ${fixedCount} fix(es)`);
  }

  // Summary
  console.log('\n════════════════════════════════════════════');
  console.log('📊  SUMMARY');
  console.log('════════════════════════════════════════════');
  console.log(`  Total checked:  ${checkedCount}`);
  console.log(`  Live:           ${checkedCount - deadCount}`);
  console.log(`  Dead:           ${deadCount}`);
  console.log(`  Auto-fixed:     ${fixedCount}`);
  console.log(`  Needs manual:   ${unfixedCount}`);

  if (unfixedCount > 0) {
    console.log('\n⚠️  MANUAL FIXES NEEDED:');
    deadLinks.forEach((l) => console.log(`  - ${l}`));
    console.log(
      '\n  Go to youtube.com and search for a replacement video,\n' +
      '  then update the url field in src/lib/resourcePool.ts\n'
    );
  }

  if (fixedCount > 0) {
    console.log(
      '\n🚀  DEPLOY REMINDER:');
    console.log('  git add src/lib/resourcePool.ts');
    console.log('  git commit -m "Auto-heal: replaced dead resource links"');
    console.log('  git push origin master\n');
  } else if (deadCount === 0) {
    console.log('\n🎉  All links are live. Nothing to fix!\n');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
