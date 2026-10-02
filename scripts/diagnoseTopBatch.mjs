import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

async function getAccessToken() {
  const creds = JSON.parse(fs.readFileSync('scripts/service-account.json', 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const jwt = `${unsigned}.${sign.sign(creds.private_key, 'base64url')}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  return data.access_token;
}

const CREDIT_SHEETS = [
  { year: 2025, month: 1, name: '2025-01', id: '1HaMh9dURUBcmQW5u5w3uNgjMf9q9ufbeSkFMAFoYLsE' },
  { year: 2025, month: 2, name: '2025-02', id: '1g-DokyzqNIJcx5NoFCari1oJh2yOtCNKx8lQpXdGmXk' },
  { year: 2025, month: 3, name: '2025-03', id: '1JY0qYWZ_4NcC9oujXttV29fmFyXJOg8yDX1vVAtcOP8' },
  { year: 2025, month: 4, name: '2025-04', id: '15rVLqScXA_1sbJ5ph919_pMJWonOgQolai_S1h3-kwE' },
  { year: 2025, month: 5, name: '2025-05', id: '1bU5MMpiWnODQ7szbWOG4DMXIHl9R2V3EQb3-xRTzbuk' },
  { year: 2025, month: 6, name: '2025-06', id: '1cKGwAOV3OeWKWTsxoSewu35VL_Wxksqr0hw4o66ISwQ' },
  { year: 2025, month: 7, name: '2025-07', id: '1jS2WeGoaIKZ9acumyr5QPGqCQ5qN_h63mnbjqqxb8ZA' },
  { year: 2025, month: 8, name: '2025-08', id: '1A6aKCcH6Yxmh9A2LEyfwIyGf3ZgHxH4epOXgV1JwF48' },
  { year: 2025, month: 9, name: '2025-09', id: '1BkjWvlZbL0VLAetn950KzGWsJ2ZmbPWwepd-ox-8CG8' },
  { year: 2025, month: 10, name: '2025-10', id: '1ZeI9S9RecvTyMMwtlKM6agk4miFVw3H0N_mU78KnvbQ' },
  { year: 2025, month: 11, name: '2025-11', id: '1F_zWiU4N0_wVbi6Fv0Vj-8yo19cwHOxfI8qKH0l0K1o' },
  { year: 2025, month: 12, name: '2025-12', id: '1o6D4OtAPEDLGNVZXWSz5zPX6xwdhosm-Yez5B-t8lXg' },
  { year: 2026, month: 1, name: '2026-01', id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M' },
  { year: 2026, month: 2, name: '2026-02', id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8' },
  { year: 2026, month: 3, name: '2026-03', id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc' },
  { year: 2026, month: 4, name: '2026-04', id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU' },
  { year: 2026, month: 5, name: '2026-05', id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs' },
  { year: 2026, month: 6, name: '2026-06', id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs' },
  { year: 2026, month: 7, name: '2026-07', id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE' },
  { year: 2026, month: 8, name: '2026-08', id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos' },
];

function parseNumber(val) {
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/[₹,]/g, '').trim());
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

async function fetchWithRetry(url, options) {
  for (let i = 0; i < 5; i++) {
    try {
      const res = await fetch(url, options);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      return await res.json();
    } catch (e) {
      if (i === 4) throw e;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

const TOP_5_CUSTOMERS = [
  { id: '357', name: 'Thakor Shankarbhai Ranpur', query: 'thakor shankarbhai ranpur' },
  { id: '141', name: 'Judal Dayabhai Parthibhai', query: 'judal dayabhai' },
  { id: '371', name: 'Valagot Dipakbhai Mavjibhai', query: 'valagot dipakbhai' },
  { id: '360', name: 'Thakor Vinshubhai Dheerajbhai', query: 'thakor vinshu' },
  { id: '46', name: 'Bhutadiya Dineshbhai Veerabhai', query: 'bhutadiya dineshbhai veera' },
];

async function main() {
  const token = await getAccessToken();
  const headers = { Authorization: `Bearer ${token}` };

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('🔍 DEEP DIVE DIAGNOSTICS: TOP 5 DISCREPANCY CUSTOMERS BATCH');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const parseCsv = (txt) => {
    const lines = txt.trim().split('\n');
    const header = lines[0].split(',');
    return lines.slice(1).map(l => {
      const obj = {};
      const vals = l.split(',');
      for (let i = 0; i < header.length; i++) obj[header[i]] = vals[i];
      return obj;
    });
  };

  const allSales = parseCsv(fs.readFileSync('data/sales.csv', 'utf8'));
  const allPayments = parseCsv(fs.readFileSync('data/payments.csv', 'utf8'));

  const monthlyData = [];
  for (const info of CREDIT_SHEETS) {
    try {
      const meta = await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${info.id}?fields=sheets.properties`, { headers });
      if (!meta || !meta.sheets || !meta.sheets[0]) continue;
      const tab = meta.sheets[0].properties.title;
      const vals = await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${info.id}/values/'${encodeURIComponent(tab)}'!A1:K300`, { headers });
      monthlyData.push({ ...info, rows: vals?.values || [] });
    } catch (e) {
      console.warn(`Could not fetch ${info.name}: ${e.message}`);
    }
  }

  for (let idx = 0; idx < TOP_5_CUSTOMERS.length; idx++) {
    const c = TOP_5_CUSTOMERS[idx];
    console.log(`\n───────────────────────────────────────────────────────────────────`);
    console.log(`#${idx + 1}. [ID: ${c.id}] ${c.name}`);
    console.log(`───────────────────────────────────────────────────────────────────`);

    const custSales = allSales.filter(s => s.customerId === c.id || (s.customerName || '').toLowerCase().includes(c.query));
    const custPayments = allPayments.filter(p => p.customerId === c.id || (p.customerName || '').toLowerCase().includes(c.query));

    let totSales = 0, totCash = 0, totPay = 0;
    console.log(`\n  📄 CSV Sales (${custSales.length}):`);
    for (const s of custSales) {
      const amt = parseFloat(s.amount || 0);
      const cash = parseFloat(s.cashPaid || 0);
      totSales += amt;
      totCash += cash;
      console.log(`     • ${s.date?.slice(0, 10)} | ${s.type} | Amt: ₹${amt} | Cash: ₹${cash} | Net: ₹${amt - cash} | ${s.notes || ''}`);
    }

    console.log(`\n  📄 CSV Payments (${custPayments.length}):`);
    for (const p of custPayments) {
      const amt = parseFloat(p.amount || 0);
      totPay += amt;
      console.log(`     • ${p.date?.slice(0, 10)} | Amt: ₹${amt} | Notes: ${p.notes || ''}`);
    }

    const csvNet = totSales - totCash - totPay;
    console.log(`\n  👉 Current CSV Balance: ₹${csvNet} (Sales: ₹${totSales} - Cash: ₹${totCash} - Payments: ₹${totPay})`);

    console.log(`\n  📊 Google Sheets Monthly Progression:`);
    let lastNetDue = 0;
    for (const m of monthlyData) {
      for (let r = 1; r < m.rows.length; r++) {
        const row = m.rows[r];
        if (!row || !row[0]) continue;
        const name = (row[0] || '').trim();
        if (name.toLowerCase().includes(c.query)) {
          const prvDebt = parseNumber(row[1]);
          const salesDebt = parseNumber(row[2]);
          const totDebt = parseNumber(row[4]);
          const prvCredit = parseNumber(row[5]);
          const credit2 = parseNumber(row[6]);
          const credit3 = parseNumber(row[7]);
          const kasar = parseNumber(row[8]);
          const netDue = parseNumber(row[10]);
          lastNetDue = netDue;
          console.log(`     [${m.name} | Row ${r+1}] ${name} -> PrvDebt: ₹${prvDebt} | Sales: ₹${salesDebt} | TotDebt: ₹${totDebt} | PrvCred: ₹${prvCredit} | Cred2: ₹${credit2} | Kasar: ₹${kasar} | NetDue: ₹${netDue}`);
        }
      }
    }
    console.log(`\n  🎯 MASTER SHEET FINAL DUE: ₹${lastNetDue}`);
    console.log(`  ⚖️ NET DISCREPANCY: CSV ₹${csvNet} vs Sheet ₹${lastNetDue} (Diff: ₹${csvNet - lastNetDue})`);
  }
}

main().catch(console.error);
