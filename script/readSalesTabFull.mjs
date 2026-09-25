import { readFileSync } from 'fs';
import { createRequire } from 'module';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { google } = require('googleapis');
const __dirname = dirname(fileURLToPath(import.meta.url));
const sa = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf-8'),
);
const auth = new google.auth.GoogleAuth({
  credentials: { client_email: sa.client_email, private_key: sa.private_key },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function readFull(id, tab) {
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${tab}!A1:L300`,
  });
  return r.data.values || [];
}

const MONTHS = [
  { key: 'Nov-2022', id: '1hrs0IxXvTS146ukGPyQ3zts2dsgnq_vAQYiR4TQUuGo' },
  { key: 'Dec-2022', id: '1DBrYUOC5BMFdixLhXCJMNlfnVyver5xUNVCT-UHjniE' },
  { key: 'Jan-2023', id: '1F9UiYHXrCsdU4CtB5Ynb4tBV1krwuNJIPFBsJ0k16_Q' },
  { key: 'Feb-2023', id: '1Kz9pnMoWloe16T7D15z75LnDPlYdhaQedJA8Cy1n52M' },
  { key: 'Mar-2023', id: '15g-2mDZVxRmjfgbhL4c13bOTruAR_ubNg6DGXboe9n0' },
];

for (const m of MONTHS) {
  const rows = await readFull(m.id, 'Sales');
  await delay(400);
  const hdr = rows[0] || [];
  console.log(`\n${'═'.repeat(65)}`);
  console.log(`📅  ${m.key}  — FULL SALES TAB (${rows.length} total rows)`);
  console.log(`Header: ${JSON.stringify(hdr)}`);
  console.log(`${'─'.repeat(65)}`);

  // Print ALL non-empty rows showing their index
  rows.forEach((r, i) => {
    if (i === 0) return; // skip header
    if (r.some((c) => c && c.toString().trim() !== '')) {
      console.log(`R${i + 1}: ${JSON.stringify(r)}`);
    }
  });
}
