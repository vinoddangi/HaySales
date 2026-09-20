import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Target Google Drive Folder ID
const FOLDER_ID = '1-gQoQwAfGXqHZOvy5FYl20hq_K-kB_En';
const MASTER_SPREADSHEET_ID = '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';

// Read Service Account credentials securely
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Authenticate Google Drive & Sheets API
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

async function auditAllCreditLists() {
  console.log(
    '📂 Scanning Google Drive folder for all Customer Credit List files...\n',
  );

  // 1. List all Customer Credit List spreadsheets from Drive folder
  const driveRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });

  const allDriveSheets = driveRes.data.files || [];
  const creditSheets = allDriveSheets.filter((f) =>
    f.name.toLowerCase().includes('customer credit list'),
  );

  // Also include 20251231 if not in root list
  const knownExplicit = [
    {
      id: '1o6D4OtAPEDLGNVZXWSz5zPX6xwdhosm-Yez5B-t8lXg',
      name: 'Customer Credit List-20251231',
    },
    {
      id: '1HaMh9dURUBcmQW5u5w3uNgjMf9q9ufbeSkFMAFoYLsE',
      name: 'Customer Credit List-20250131',
    },
  ];
  knownExplicit.forEach((exp) => {
    if (!creditSheets.some((s) => s.id === exp.id)) {
      creditSheets.push(exp);
    }
  });

  console.log(
    `✅ Found ${creditSheets.length} Customer Credit List spreadsheet(s) to audit:`,
  );
  creditSheets.forEach((s, idx) =>
    console.log(`  ${idx + 1}. ${s.name} (${s.id})`),
  );
  console.log('');

  // 2. Fetch Master Customer Sheet
  console.log(
    `📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID} [Customers!A:Z]...`,
  );
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:Z',
  });
  const masterAllRows = (masterRes.data.values || []).slice(1);
  const masterList = [];
  const masterNormMap = new Map();

  masterAllRows.forEach((r) => {
    const rawName = (r[0] || '').trim();
    if (!rawName) return;
    const norm = normalize(rawName);
    masterList.push({ rawName, norm });
    masterNormMap.set(norm, rawName);
  });
  console.log(`✅ Loaded ${masterList.length} master customers.\n`);

  // 3. Scan every credit list file
  const allUnmatched = new Map(); // rawName -> { sources: [], maxDue: 0, sampleRows: [] }

  for (const s of creditSheets) {
    console.log(`📄 Auditing: [${s.name}]...`);
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: s.id,
        range: 'Sheet1!A2:K',
      });
      const rows = res.data.values || [];
      let matchedCount = 0;
      let unmatchedCount = 0;

      rows.forEach((row) => {
        const rawName = (row[0] || '').trim();
        if (!rawName) return;
        const norm = normalize(rawName);
        const due = parseRupeeValue(row[10], 0);

        if (masterNormMap.has(norm)) {
          matchedCount++;
        } else {
          unmatchedCount++;
          if (!allUnmatched.has(rawName)) {
            allUnmatched.set(rawName, { sources: [], maxDue: 0 });
          }
          const entry = allUnmatched.get(rawName);
          if (!entry.sources.includes(s.name)) {
            entry.sources.push(s.name);
          }
          if (due > entry.maxDue) entry.maxDue = due;
        }
      });

      console.log(
        `   ✓ Total Rows: ${rows.length} | Matched: ${matchedCount} | Unmatched: ${unmatchedCount}\n`,
      );
    } catch (err) {
      console.error(`   ❌ Failed to read ${s.name}:`, err.message);
    }
  }

  // 4. Summarize and classify gaps
  console.log(
    '═══════════════════════════════════════════════════════════════════════════════',
  );
  console.log(
    `📋 FULL 2026 AUDIT: Found ${allUnmatched.size} Unique Unmatched Customer Name(s) Across All Sheets`,
  );
  console.log(
    '═══════════════════════════════════════════════════════════════════════════════\n',
  );

  const spellingCandidates = [];
  const genuinelyNew = [];

  for (const [rawName, meta] of allUnmatched.entries()) {
    const norm = normalize(rawName);
    const words = norm.split(' ');

    const scored = masterList.map((m) => {
      const mWords = m.norm.split(' ');
      const commonWords = words.filter((w) => mWords.includes(w)).length;
      const dist = levenshtein(norm, m.norm);
      return { masterName: m.rawName, masterNorm: m.norm, commonWords, dist };
    });

    scored.sort((a, b) => {
      if (b.commonWords !== a.commonWords) return b.commonWords - a.commonWords;
      return a.dist - b.dist;
    });

    const best = scored[0];
    const isCloseTypo =
      best.dist <= 3 || (best.commonWords >= 2 && best.dist <= 6);

    if (isCloseTypo) {
      spellingCandidates.push({
        rawName,
        maxDue: meta.maxDue,
        sources: meta.sources.join(', '),
        suggestedMaster: best.masterName,
        dist: best.dist,
      });
    } else {
      genuinelyNew.push({
        rawName,
        maxDue: meta.maxDue,
        sources: meta.sources.join(', '),
      });
    }
  }

  if (spellingCandidates.length > 0) {
    console.log('🔤 PROBABLE SPELLING MISTAKES / FORMAT VARIATIONS:');
    spellingCandidates.forEach((c, idx) => {
      console.log(`  ${idx + 1}. "${c.rawName}" (Max Due: ₹${c.maxDue})`);
      console.log(
        `     ➔ Suggested Master Match: "${c.suggestedMaster}" (Diff score: ${c.dist})`,
      );
      console.log(`     📁 Files: ${c.sources}\n`);
    });
  }

  if (genuinelyNew.length > 0) {
    console.log('👤 GENUINELY NEW CUSTOMERS (Ready to add to Master Sheet):');
    genuinelyNew.forEach((c, idx) => {
      console.log(
        `  ${idx + 1}. "${c.rawName}" (Max Due: ₹${c.maxDue}) | Files: ${c.sources}`,
      );
    });
  }
}

auditAllCreditLists().catch((err) => {
  console.error('❌ Audit script failed:', err);
});
