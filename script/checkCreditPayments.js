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

const files = [
  {
    id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M',
    name: 'Customer Credit List-202601',
  },
  {
    id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8',
    name: 'Customer Credit List-20260228',
  },
  {
    id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc',
    name: 'Customer Credit List-20260331',
  },
  {
    id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU',
    name: 'Customer Credit List-20260430',
  },
  {
    id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs',
    name: 'Customer Credit List-20260531',
  },
  {
    id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs',
    name: 'Customer Credit List-20260630',
  },
  {
    id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE',
    name: 'Customer Credit List-20260831',
  },
  {
    id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
    name: 'Customer Credit List (1FyT2...)',
  },
];

function parseRupee(val) {
  if (!val) return 0;
  const num = parseFloat(
    String(val)
      .replace(/[₹,\s]/g, '')
      .trim(),
  );
  return isNaN(num) ? 0 : num;
}

async function main() {
  for (const f of files) {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: f.id,
      range: `Sheet1!A1:K300`,
    });
    const rows = res.data.values || [];
    let paymentCount = 0;
    let paymentTotal = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const credit2 = parseRupee(r[6]);
      const credit3 = parseRupee(r[7]);
      const totalCredit = credit2 + credit3;
      if (totalCredit > 0) {
        paymentCount++;
        paymentTotal += totalCredit;
      }
    }
    console.log(
      `${f.name} (ID: ${f.id}): ${paymentCount} payments, Total: ₹${paymentTotal.toLocaleString('en-IN')}`,
    );
  }
}

main();
