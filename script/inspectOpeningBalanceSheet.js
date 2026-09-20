import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SPREADSHEET_ID = '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M';

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

function parseRupee(val) {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val)
    .replace(/[^0-9.-]/g, '')
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

async function inspectOpeningSheet() {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  console.log(`Title: ${meta.data.properties.title}`);

  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${title}!A1:Z50`,
    });
    console.log(`\n=== Sheet: ${title} ===`);
    const rows = res.data.values || [];
    console.log(`Headers:`, rows[0]);
    rows.slice(0, 15).forEach((r, idx) => console.log(`Row ${idx + 1}:`, r));
  }
}

inspectOpeningSheet();
