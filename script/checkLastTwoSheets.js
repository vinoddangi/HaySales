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

async function main() {
  const f1 = await sheets.spreadsheets.values.get({
    spreadsheetId: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
    range: `Sheet1!A1:K5`,
  });
  console.log('Customer Credit List-20260831 Header & Rows:', f1.data.values);

  const f2 = await sheets.spreadsheets.values.get({
    spreadsheetId: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
    range: `Sheet1!A1:K5`,
  });
  console.log('Customer Credit List (1FyT2...) Header & Rows:', f2.data.values);
}

main();
