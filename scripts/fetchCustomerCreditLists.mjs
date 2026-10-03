import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAccessToken() {
  const creds = JSON.parse(fs.readFileSync('scripts/service-account.json', 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/drive.readonly',
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
  if (!data.access_token) {
    throw new Error('Failed to obtain access token: ' + JSON.stringify(data));
  }
  return data.access_token;
}

async function fetchWithRetry(url, options, maxRetries = 5) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    await sleep(1200); // Throttling
    const res = await fetch(url, options);
    const data = await res.json();
    if (res.status === 429 || data.error?.code === 429) {
      const waitTime = attempt * 10000;
      console.log(`⚠️ Rate limited (429). Retrying after ${waitTime / 1000}s (Attempt ${attempt}/${maxRetries})...`);
      await sleep(waitTime);
      continue;
    }
    return data;
  }
  throw new Error(`Failed after ${maxRetries} retries for ${url}`);
}

const MONTHLY_CREDIT_LISTS = [
  { date: '2024-12-31', id: '12dF_daDdjNWZCuG1Die6V_Eao7Io-bJwIpfSf-fD-o4', name: 'Customer Credit List-20241231' },
  { date: '2025-01-31', id: '1HaMh9dURUBcmQW5u5w3uNgjMf9q9ufbeSkFMAFoYLsE', name: 'Customer Credit List-20250131' },
  { date: '2025-02-28', id: '1g-DokyzqNIJcx5NoFCari1oJh2yOtCNKx8lQpXdGmXk', name: 'Customer Credit List-20250228' },
  { date: '2025-03-31', id: '1JY0qYWZ_4NcC9oujXttV29fmFyXJOg8yDX1vVAtcOP8', name: 'Customer Credit List-20250331' },
  { date: '2025-04-30', id: '15rVLqScXA_1sbJ5ph919_pMJWonOgQolai_S1h3-kwE', name: 'Customer Credit List-20250430' },
  { date: '2025-05-31', id: '1bU5MMpiWnODQ7szbWOG4DMXIHl9R2V3EQb3-xRTzbuk', name: 'Customer Credit List-20250531' },
  { date: '2025-06-30', id: '1cKGwAOV3OeWKWTsxoSewu35VL_Wxksqr0hw4o66ISwQ', name: 'Customer Credit List-20250630' },
  { date: '2025-07-31', id: '1jS2WeGoaIKZ9acumyr5QPGqCQ5qN_h63mnbjqqxb8ZA', name: 'Customer Credit List-20250731' },
  { date: '2025-08-31', id: '1A6aKCcH6Yxmh9A2LEyfwIyGf3ZgHxH4epOXgV1JwF48', name: 'Customer Credit List-20250831' },
  { date: '2025-09-30', id: '1BkjWvlZbL0VLAetn950KzGWsJ2ZmbPWwepd-ox-8CG8', name: 'Customer Credit List-20250930' },
  { date: '2025-10-31', id: '1ZeI9S9RecvTyMMwtlKM6agk4miFVw3H0N_mU78KnvbQ', name: 'Customer Credit List-20251031' },
  { date: '2025-11-30', id: '1F_zWiU4N0_wVbi6Fv0Vj-8yo19cwHOxfI8qKH0l0K1o', name: 'Customer Credit List-20251130' },
  { date: '2025-12-31', id: '1RZz9af6YqTGktNpR5kVm8TN5sMPfm26kS3HWoaqgRis', name: 'Customer Credit List-20251231' },
  { date: '2026-01-31', id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M', name: 'Customer Credit List-20260131' },
  { date: '2026-02-28', id: '1q0t_xmgiyUMIGvfeFpmoS4gXKdePAQCkQ4uI1X5y_v8', name: 'Customer Credit List-20260228' },
  { date: '2026-03-31', id: '1zclhvPX23ku1NBMO8o-Kb_W3OcPrdsKFc60mSWqJAGc', name: 'Customer Credit List-20260331' },
  { date: '2026-04-30', id: '1h8CapQVXE3Nr9gBTOkq-Lvm9uZdp4JFNAYYWSeDA5EU', name: 'Customer Credit List-20260430' },
  { date: '2026-05-31', id: '1Z8X_krghV-HDPVSh7JliNsRsgdasgaDnS4gh81UPHAs', name: 'Customer Credit List-20260531' },
  { date: '2026-06-30', id: '1KCaiFCewvPHMCKyQIUvzl4nyILEQITTQqJT94-D7YTs', name: 'Customer Credit List-20260630' },
  { date: '2026-07-31', id: '1SPXPWTSsvYWVNobZvtM0JroqRx76N3bgusSYUFSVVwE', name: 'Customer Credit List-20260731' },
];

async function fetchSpreadsheet(token, sheetInfo) {
  const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetInfo.id}`;
  const meta = await fetchWithRetry(metaUrl, { headers: { Authorization: `Bearer ${token}` } });
  if (meta.error) {
    console.error(`Error fetching metadata for ${sheetInfo.name} (${sheetInfo.id}):`, meta.error);
    return null;
  }
  const title = meta.properties?.title || sheetInfo.name;
  const sheetTabs = meta.sheets?.map(s => s.properties?.title) || [];
  console.log(`\n======================================================`);
  console.log(`📄 Credit List: "${title}" [${sheetInfo.id}] (${sheetInfo.date})`);
  console.log(`   Tabs (${sheetTabs.length}):`, sheetTabs.join(', '));

  const result = {
    id: sheetInfo.id,
    title,
    date: sheetInfo.date,
    name: sheetInfo.name,
    tabs: {}
  };

  for (const tab of sheetTabs) {
    const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetInfo.id}/values/${encodeURIComponent(tab)}!A1:Z500`;
    const valData = await fetchWithRetry(valuesUrl, { headers: { Authorization: `Bearer ${token}` } });
    const rows = valData.values || [];
    result.tabs[tab] = {
      rowCount: rows.length,
      sampleHeader: rows[0] || [],
      rows: rows
    };
    console.log(`   - Tab "${tab}": ${rows.length} rows`);
  }

  return result;
}

async function main() {
  console.log('🔍 Connecting to Google Sheets API...');
  const token = await getAccessToken();
  console.log('✅ Access Token acquired successfully.\n');

  const allCreditLists = [];
  for (const info of MONTHLY_CREDIT_LISTS) {
    const data = await fetchSpreadsheet(token, info);
    if (data) allCreditLists.push(data);
  }

  const cachePath = path.resolve('backups/allCustomerCreditListsDump.json');
  fs.writeFileSync(cachePath, JSON.stringify(allCreditLists, null, 2), 'utf8');
  console.log(`\n🎉 Successfully fetched and saved all ${allCreditLists.length} Customer Credit Lists to ${cachePath}`);
}

main().catch(err => {
  console.error('Execution failed:', err);
});
