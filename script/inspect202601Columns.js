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

async function inspectColumns() {
  const s1 = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet1!A1:K300',
  });
  const rows1 = s1.data.values || [];
  console.log(`Sheet1 Rows: ${rows1.length}, Headers:`, rows1[0]);

  let s1SumB = 0,
    s1SumE = 0,
    s1SumK = 0;
  for (let i = 1; i < rows1.length; i++) {
    const r = rows1[i];
    if (!r[0] || r[0] === 'Total') continue;
    s1SumB += parseRupee(r[1]);
    s1SumE += parseRupee(r[4]);
    s1SumK += parseRupee(r[10]);
  }
  console.log(
    `Sheet1 Column B (Prv. Debt) Sum: ₹${s1SumB.toLocaleString('en-IN')}`,
  );
  console.log(
    `Sheet1 Column E (Total Debt) Sum: ₹${s1SumE.toLocaleString('en-IN')}`,
  );
  console.log(
    `Sheet1 Column K (Final Total) Sum: ₹${s1SumK.toLocaleString('en-IN')}`,
  );

  const s2 = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Sheet2!A1:F300',
  });
  const rows2 = s2.data.values || [];
  console.log(`\nSheet2 Rows: ${rows2.length}, Headers:`, rows2[0]);

  let s2SumC = 0,
    s2SumF = 0;
  for (let i = 1; i < rows2.length; i++) {
    const r = rows2[i];
    if (!r[1] || r[1] === 'Total') continue;
    s2SumC += parseRupee(r[2]);
    s2SumF += parseRupee(r[5]);
  }
  console.log(
    `Sheet2 Column C (Prv. Total) Sum: ₹${s2SumC.toLocaleString('en-IN')}`,
  );
  console.log(
    `Sheet2 Column F (Final Total) Sum: ₹${s2SumF.toLocaleString('en-IN')}`,
  );
}

inspectColumns();
