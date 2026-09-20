import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const REGISTRY_FILE = join(__dirname, 'data', 'local_customer_registry.json');

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CREDIT_LIST_FILES = [
  {
    period: '2026_01',
    id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M',
    name: 'Jan Credit List',
  },
  {
    period: '2026_02',
    id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8',
    name: 'Feb Credit List',
  },
  {
    period: '2026_03',
    id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc',
    name: 'Mar Credit List',
  },
  {
    period: '2026_04',
    id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU',
    name: 'Apr Credit List',
  },
  {
    period: '2026_05',
    id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs',
    name: 'May Credit List',
  },
  {
    period: '2026_06',
    id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
    name: 'Jun Credit List',
  },
  {
    period: '2026_07',
    id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
    name: 'Jul Credit List',
  },
  {
    period: '2026_08',
    id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
    name: 'Aug Credit List',
  },
];

async function standardizeCustomerNames(dryRun = false) {
  console.log(
    `\n═══════════════════════════════════════════════════════════════`,
  );
  console.log(
    `🔄 ${dryRun ? 'DRY RUN: VERIFYING' : 'APPLYING'} CUSTOMER NAME STANDARDIZATIONS ACROSS GOOGLE SHEETS`,
  );
  console.log(
    `═══════════════════════════════════════════════════════════════\n`,
  );

  const registry = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'));
  const aliasMap = new Map();

  registry.forEach((c) => {
    aliasMap.set(normalize(c.canonicalName), c.canonicalName);
    if (c.aliases) {
      c.aliases.forEach((a) => aliasMap.set(normalize(a), c.canonicalName));
    }
  });

  let grandTotalUpdates = 0;

  for (const f of CREDIT_LIST_FILES) {
    console.log(`\n📄 Spreadsheet: ${f.name} (${f.id})`);

    const meta = await sheets.spreadsheets.get({ spreadsheetId: f.id });
    const tabName = meta.data.sheets[0].properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: f.id,
      range: `'${tabName}'!A1:A300`,
    });
    const rows = res.data.values || [];

    const batchUpdates = [];

    for (let i = 1; i < rows.length; i++) {
      const raw = (rows[i][0] || '').trim();
      if (!raw || raw === 'Total') continue;

      const norm = normalize(raw);
      const canonical = aliasMap.get(norm);

      if (canonical && canonical !== raw) {
        const range = `'${tabName}'!A${i + 1}`;
        batchUpdates.push({
          range,
          values: [[canonical]],
          oldName: raw,
          newName: canonical,
          row: i + 1,
        });
      }
    }

    console.log(
      `   Found ${batchUpdates.length} customer names to standardize:`,
    );
    batchUpdates.forEach((u) => {
      console.log(`     - Row ${u.row}: "${u.oldName}" -> "${u.newName}"`);
    });

    if (!dryRun && batchUpdates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: f.id,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: batchUpdates.map((u) => ({
            range: u.range,
            values: u.values,
          })),
        },
      });
      console.log(
        `   ✅ Successfully updated ${batchUpdates.length} customer names in ${f.name}!`,
      );
    }

    grandTotalUpdates += batchUpdates.length;
  }

  console.log(
    `\n═══════════════════════════════════════════════════════════════`,
  );
  console.log(
    `🎉 Total Customer Names ${dryRun ? 'Verified' : 'Standardized'}: ${grandTotalUpdates} across all 8 Credit Lists!`,
  );
  console.log(
    `═══════════════════════════════════════════════════════════════\n`,
  );
}

const isDryRun = process.argv.includes('--dry-run');
standardizeCustomerNames(isDryRun).catch((err) => {
  console.error('Error standardizing names:', err);
  process.exit(1);
});
