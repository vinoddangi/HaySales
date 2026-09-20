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

const CORRECTIONS = [
  {
    fileTitle: 'Jan Grass 2026',
    spreadsheetId: '1Pitzwi6T1G9q9APSKiXZ6DtnoSiDgJQ8xmdi1haqT_k',
    tabName: 'Sales',
    items: [
      {
        oldName: 'Bera Laxmanbhai Moghabhai',
        newName: 'Bera Laxmanbhai Meghabhai',
      },
      {
        oldName: 'Judal Jituben Manjibhai',
        newName: 'Judal Jeetuben Manjibhai',
      },
      {
        oldName: 'Judal Bakabhai Jeshungbhai',
        newName: 'Judal Bakabhai Jasungbhai',
      },
    ],
  },
  {
    fileTitle: 'Feb Grass 2026',
    spreadsheetId: '1yvZSTJYxM1mZkD749dZQotOsYUl1dVHBphQdrQvnmaQ',
    tabName: 'Sales',
    items: [
      { oldName: 'Kasha Vajeerkhan', newName: 'Khasha Jafarkhan' },
      {
        oldName: 'Akoliya Dhanrajbhai Veershangbhai',
        newName: 'Akoliya Dhanrajbhai Virshangbhai',
      },
    ],
  },
  {
    fileTitle: 'March Grass 2026',
    spreadsheetId: '1ZGH6k6vJlLdDHAmSAMM3TlIKO1Zvwu_QfPAes3akeBM',
    tabName: 'Sales',
    items: [
      {
        oldName: 'Desai Rajubhai Maganbhai',
        newName: 'Desai Rajubhai Maganbhai Rasana',
      },
      {
        oldName: 'Desai Babubhai Kurshbhai',
        newName: 'Desai Babubhai Khurshibhai',
      },
      {
        oldName: 'Judal Rasbhai Paragbhai',
        newName: 'Judal Rasabhai Paragbhai',
      },
      {
        oldName: 'Madana Parkash Menat',
        newName: 'Menat Prakashbhai Madana',
      },
    ],
  },
  {
    fileTitle: 'July Grass 2026',
    spreadsheetId: '15qc64Q1Uebuunoeca9X1N8nS8o2GDgKzv8KEsGp5R6I',
    tabName: 'Sales',
    items: [
      {
        oldName: 'Bhutdiya.Dineshbhai Versagbhai',
        newName: 'Bhutadiya Dineshbhai Veershangbhai',
      },
    ],
  },
];

async function applyCorrections(dryRun = false) {
  console.log(
    `\n═══════════════════════════════════════════════════════════════`,
  );
  console.log(
    `📝 ${dryRun ? 'DRY RUN: VERIFYING' : 'APPLYING'} GOOGLE SHEET SPELLING CORRECTIONS`,
  );
  console.log(
    `═══════════════════════════════════════════════════════════════\n`,
  );

  let totalUpdated = 0;

  for (const c of CORRECTIONS) {
    console.log(`\n📄 Spreadsheet: ${c.fileTitle} [Tab: '${c.tabName}']`);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: c.spreadsheetId,
      range: `'${c.tabName}'!A1:Z120`,
    });
    const rows = res.data.values || [];

    for (const item of c.items) {
      let targetRange = null;
      let actualValue = null;

      for (let r = 0; r < rows.length; r++) {
        for (let col = 0; col < rows[r].length; col++) {
          const val = String(rows[r][col] || '').trim();
          const cleanVal = val.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanOld = item.oldName.toLowerCase().replace(/[^a-z0-9]/g, '');

          if (cleanVal === cleanOld) {
            const colLetter = String.fromCharCode(65 + col);
            targetRange = `'${c.tabName}'!${colLetter}${r + 1}`;
            actualValue = val;
            break;
          }
        }
        if (targetRange) break;
      }

      if (targetRange) {
        console.log(
          `  ✓ Found "${actualValue}" at ${targetRange} -> New Value: "${item.newName}"`,
        );
        if (!dryRun) {
          await sheets.spreadsheets.values.update({
            spreadsheetId: c.spreadsheetId,
            range: targetRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[item.newName]],
            },
          });
          console.log(`    ✅ Successfully updated in Google Sheet!`);
        }
        totalUpdated++;
      } else {
        console.warn(`  ⚠️ Could not find exact cell for: "${item.oldName}"`);
      }
    }
  }

  console.log(
    `\n═══════════════════════════════════════════════════════════════`,
  );
  console.log(
    `🎉 Summary: ${totalUpdated} cells ${dryRun ? 'verified' : 'updated successfully'} in Google Sheets!`,
  );
  console.log(
    `═══════════════════════════════════════════════════════════════\n`,
  );
}

const isDryRun = process.argv.includes('--dry-run');
applyCorrections(isDryRun).catch((err) => {
  console.error('Error applying corrections:', err);
  process.exit(1);
});
