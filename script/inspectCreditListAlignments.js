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
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function inspect(sheetId, name) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  console.log(`\n================= ${name} (${sheetId}) =================`);
  console.log(`Title: ${meta.data.properties.title}`);
  for (const s of meta.data.sheets) {
    const title = s.properties.title;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${title}!A1:Z5`,
    });
    console.log(`Sheet: ${title}, Headers:`, res.data.values?.[0]);
  }
}

async function main() {
  await inspect(
    '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
    'Customer Credit List-20260630',
  );
  await inspect(
    '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
    'Customer Credit List-20260831',
  );
  await inspect(
    '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
    'Customer Credit List',
  );
}

main();
