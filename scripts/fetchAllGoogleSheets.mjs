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
    await sleep(1200); // Throttling to respect 60 req/min
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

const KNOWN_SHEETS = [
  { id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos', name: 'Master Customer Credit Sheet (Sheet1)' },
  { id: '1C274TasGsyMWwLRblMpItjzE8uXn39I0KjuTQ1nTJ2U', name: 'Jan Grass 2025', year: 2025, month: 1 },
  { id: '1VgPd99_fu-irua2__cq_6VvvxitXYAO4mYqESEXputI', name: 'Feb Grass 2025', year: 2025, month: 2 },
  { id: '1vGNllFNuHcNjj_Y4FJDHfX6Gx6W7nF_gsatsh-jW1Uw', name: 'March Grass 2025', year: 2025, month: 3 },
  { id: '1FJPVf2naMueUOyb_dBUb9pZBSqcIvRlKrsok1CSJXOM', name: 'April Grass 2025', year: 2025, month: 4 },
  { id: '1l9gwKeMGXEYuFbew6OqwxAjgX-KwRrgkjpEMSvFXni4', name: 'May Grass 2025', year: 2025, month: 5 },
  { id: '1hPlvbUp1qp3N1C9rZEGUlceErHx9bDhb2vyJnWhqlgQ', name: 'Jun Grass 2025', year: 2025, month: 6 },
  { id: '1NHW_B0z6EtFj4fFG8DV63lTu8VEiHVffXJ3mygZSDLc', name: 'July Grass 2025', year: 2025, month: 7 },
  { id: '1UBgWjEayNdMeDxLT81p4ZnJFJy6hEEiN9YcbsRA0PqY', name: 'Aug Grass 2025', year: 2025, month: 8 },
  { id: '1vgSJzMBlc50623ysVnmGAX7K3y6b4cMc1pvTVcMdoGM', name: 'Sep Grass 2025', year: 2025, month: 9 },
  { id: '1eTPdGUyrx8TTc_7ASGOaZtIjYmhD5Tz-wYzZ14_ciKk', name: 'Oct Grass 2025', year: 2025, month: 10 },
  { id: '1P_GER_N8Xej3qfXT7AUC6PgSE-q0BOW8JcNvgaC3jkw', name: 'Nov Grass 2025', year: 2025, month: 11 },
  { id: '1peCKx10p0OTsIQTdGu7I4JQrK3t4VSKZ9wqtWt884oQ', name: 'Dec Grass 2025', year: 2025, month: 12 },
  { id: '1Pitzwi6T1G9q9APSKiXZ6DtnoSiDgJQ8xmdi1haqT_k', name: 'Jan Grass 2026', year: 2026, month: 1 },
  { id: '1yvZSTJYxM1mZkD749dZQotOsYUl1dVHBphQdrQvnmaQ', name: 'Feb Grass 2026', year: 2026, month: 2 },
  { id: '1ZGH6k6vJlLdDHAmSAMM3TlIKO1Zvwu_QfPAes3akeBM', name: 'March Grass 2026', year: 2026, month: 3 },
  { id: '1jAfkLxU2OPZ4Kd4I9UpgODT8ZiokThe75KRgliK2m_4', name: 'April Grass 2026', year: 2026, month: 4 },
  { id: '15Idcr9ni3IvwRi5zqebJK37tjkOlh33nMTWCqdWyuE8', name: 'May Grass 2026', year: 2026, month: 5 },
  { id: '1DKRIqV8FsvMLrWiTdJhKCKvGblCbF-kXj8SUEtrkQpI', name: 'Jun Grass 2026', year: 2026, month: 6 },
  { id: '15qc64Q1Uebuunoeca9X1N8nS8o2GDgKzv8KEsGp5R6I', name: 'July Grass 2026', year: 2026, month: 7 },
  { id: '1FfEgoNS-rnosJWvD0-go6OvUWFa5NOyOnYj9DBXisxo', name: 'Aug Grass 2026', year: 2026, month: 8 },
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
  console.log(`📄 Spreadsheet: "${title}" [${sheetInfo.id}]`);
  console.log(`   Tabs (${sheetTabs.length}):`, sheetTabs.join(', '));

  const result = {
    id: sheetInfo.id,
    title,
    declaredName: sheetInfo.name,
    year: sheetInfo.year,
    month: sheetInfo.month,
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

  const allSpreadsheetsData = [];
  for (const info of KNOWN_SHEETS) {
    const data = await fetchSpreadsheet(token, info);
    if (data) allSpreadsheetsData.push(data);
  }

  // Save full raw dump to backups/allGoogleSheetsDump.json
  const cachePath = path.resolve('backups/allGoogleSheetsDump.json');
  fs.writeFileSync(cachePath, JSON.stringify(allSpreadsheetsData, null, 2), 'utf8');
  console.log(`\n🎉 Successfully fetched and saved all ${allSpreadsheetsData.length} sheets to ${cachePath}`);
}

main().catch(err => {
  console.error('Execution failed:', err);
});
