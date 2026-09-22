import { readFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, 'service-account.json'), 'utf-8'),
);
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });

const MONTHLY_GRASS_SHEETS = [
  {
    month: '2026-01 (Jan)',
    name: 'Jan Grass 2026',
    id: '1Pitzwi6T1G9q9APSKiXZ6DtnoSiDgJQ8xmdi1haqT_k',
  },
  {
    month: '2026-02 (Feb)',
    name: 'Feb Grass 2026',
    id: '1yvZSTJYxM1mZkD749dZQotOsYUl1dVHBphQdrQvnmaQ',
  },
  {
    month: '2026-03 (Mar)',
    name: 'March Grass 2026',
    id: '1ZGH6k6vJlLdDHAmSAMM3TlIKO1Zvwu_QfPAes3akeBM',
  },
  {
    month: '2026-04 (Apr)',
    name: 'April Grass 2026',
    id: '1jAfkLxU2OPZ4Kd4I9UpgODT8ZiokThe75KRgliK2m_4',
  },
  {
    month: '2026-05 (May)',
    name: 'May Grass 2026',
    id: '15Idcr9ni3IvwRi5zqebJK37tjkOlh33nMTWCqdWyuE8',
  },
  {
    month: '2026-06 (Jun)',
    name: 'Jun Grass 2026',
    id: '1DKRIqV8FsvMLrWiTdJhKCKvGblCbF-kXj8SUEtrkQpI',
  },
  {
    month: '2026-07 (Jul)',
    name: 'July Grass 2026',
    id: '15qc64Q1Uebuunoeca9X1N8nS8o2GDgKzv8KEsGp5R6I',
  },
  {
    month: '2026-08 (Aug)',
    name: 'Aug Grass 2026',
    id: '1FfEgoNS-rnosJWvD0-go6OvUWFa5NOyOnYj9DBXisxo',
  },
];

async function checkAllSalesTabs() {
  console.log(
    '================================================================',
  );
  console.log('🌾 DETAILED "Sales" TAB AUDIT FOR AKOLIYA MEGHRAJ / M. P.');
  console.log(
    '================================================================\n',
  );

  let totalSalesFound = 0;

  for (const s of MONTHLY_GRASS_SHEETS) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: s.id,
        range: 'Sales!A1:N250',
      });
      const rows = res.data.values || [];
      const header = rows[0] || [];

      console.log(
        `\n📅 [${s.month}] ${s.name} (Total rows in Sales tab: ${rows.length})`,
      );
      let foundInMonth = false;

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const rowStr = r.join(' | ');
        const lower = rowStr.toLowerCase();

        if (
          lower.includes('megh') ||
          lower.includes('m. p') ||
          lower.includes('m p') ||
          (lower.includes('akoliya') && lower.includes('parthi'))
        ) {
          foundInMonth = true;
          totalSalesFound++;
          console.log(`   ⭐ Row ${i + 1}:`);
          console.log(`      • Date (Col A): ${r[0] || '-'}`);
          console.log(`      • Customer (Col B): "${r[1] || '-'}"`);
          console.log(`      • Grass/Item (Col C): ${r[2] || '-'}`);
          console.log(`      • Weight (Col D): ${r[3] || '-'} kg`);
          console.log(`      • Rate (Col E): ₹${r[4] || '-'}`);
          console.log(`      • Total Amount (Col F): ₹${r[5] || '-'}`);
          console.log(`      • Cash Paid (Col G): ₹${r[6] || '0'}`);
          console.log(`      • Remaining Due (Col H): ₹${r[7] || '0'}`);
          console.log(
            `      • Notes/Vehicle (Col I+): ${r.slice(8).join(' | ')}`,
          );
        }
      }

      if (!foundInMonth) {
        console.log(`   (No matching sales in ${s.name})`);
      }
    } catch (e) {
      console.log(`   ❌ Error reading ${s.name}: ${e.message}`);
    }
  }

  console.log(
    `\n================================================================`,
  );
  console.log(`Total Sales Found Across All 8 Months: ${totalSalesFound}`);
  console.log(
    `================================================================`,
  );
}

checkAllSalesTabs();
