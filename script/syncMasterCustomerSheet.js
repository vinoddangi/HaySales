import { existsSync, readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const MASTER_SPREADSHEET_ID =
  process.env.MASTER_SPREADSHEET_ID ||
  '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sync local compiled registry into the Google Master Customer Sheet
 */
async function syncMasterCustomerSheet() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  const registryFile = join(DATA_DIR, 'local_customer_registry.json');
  if (!existsSync(registryFile)) {
    console.error(
      '❌ Local registry file not found. Please run "npm run db:build:registry" first.',
    );
    process.exit(1);
  }

  const localRegistry = JSON.parse(readFileSync(registryFile, 'utf-8'));

  console.log('🔄 Starting Master Customer Sheet Sync & Append...');
  if (isDryRun) {
    console.log(
      '🧪 MODE: DRY-RUN (No changes will be written to Google Sheets)\n',
    );
  }

  // 1. Fetch current Master Customer Sheet
  console.log(
    `📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID} [Customers!A:Z]...`,
  );
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:Z',
  });
  const masterAllRows = masterRes.data.values || [];
  const existingMasterNames = new Set();

  masterAllRows.slice(1).forEach((row) => {
    const rawName = (row[0] || '').trim();
    if (rawName) existingMasterNames.add(normalize(rawName));
  });

  console.log(
    `✅ Found ${existingMasterNames.size} existing customers in Master Sheet.\n`,
  );

  // 2. Identify newly discovered customers to append
  const newCustomersToAppend = [];
  for (const c of localRegistry) {
    if (!existingMasterNames.has(c.canonicalNorm)) {
      newCustomersToAppend.push(c.canonicalName);
    }
  }

  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(
    `📋 SUMMARY: Found ${newCustomersToAppend.length} New Customer(s) to add to Master Sheet`,
  );
  console.log(
    '═══════════════════════════════════════════════════════════════\n',
  );

  if (newCustomersToAppend.length === 0) {
    console.log('✨ All customers already exist in the Master Customer Sheet!');
    return;
  }

  newCustomersToAppend.forEach((name, idx) => {
    console.log(`  ${idx + 1}. "${name}"`);
  });

  if (isDryRun) {
    console.log(
      `\n💡 Dry-run complete. Run "npm run db:master:sync" to append these ${newCustomersToAppend.length} customers to the Master Google Sheet.`,
    );
    return;
  }

  // 3. Append to Master Sheet
  console.log(
    `\n✍️ Appending ${newCustomersToAppend.length} customer(s) to Master Sheet...`,
  );
  const rowsToAppend = newCustomersToAppend.map((name) => [name]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:A',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: rowsToAppend,
    },
  });

  console.log(
    `🎉 Successfully added ${newCustomersToAppend.length} new customer(s) to Master Google Sheet!`,
  );
}

syncMasterCustomerSheet().catch((err) => {
  console.error('❌ Master sync failed:', err);
  process.exit(1);
});
