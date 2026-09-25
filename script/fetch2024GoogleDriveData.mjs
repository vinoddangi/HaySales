/**
 * Download and cache all 2024 Monthly Spreadsheets & Customer Credit Lists
 * from Google Drive into script/data/raw_2024_sheets_dump.json
 * Features automatic rate-limiting and exponential backoff for Google Sheets API.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
const OUT_FILE = join(DATA_DIR, 'raw_2024_sheets_dump.json');

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

const sheets = google.sheets({ version: 'v4', auth });

const MONTHLY_SPREADSHEETS_2024 = [
  {
    key: '2024_04',
    name: 'April Grass 2024-25',
    id: '14rvOhScbEekNLV6Nmn__bQVhbxP7X0oqhSalz-BTl1s',
  },
  {
    key: '2024_05',
    name: 'May Grass 2024-25',
    id: '1xMVOs5yMazAG-NA3b4y7lz3aGPDZqzi7i9T-pzNsHv0',
  },
  {
    key: '2024_06',
    name: 'June Grass 2024-25',
    id: '1RV5syYkJjQZ14QoR5vynxgfbikRwxlZvMNJeEbLltVU',
  },
  {
    key: '2024_07',
    name: 'July Grass 2024-25',
    id: '1wFMBKMD4KESh47rIOa88OkY4EOd3GSeED6ib04NrdtQ',
  },
  {
    key: '2024_08',
    name: 'Aug Grass 2024-25',
    id: '1IXvKjF5Nps0gAVEM-dt1iwJs64tEvxDPOoCgYOBQ4lw',
  },
  {
    key: '2024_09',
    name: 'Sep Grass 2024-25',
    id: '1gJFn8NDkY78NKy41Oec8f6vGAIkaCrJ9z8bIkGQr6pQ',
  },
  {
    key: '2024_10',
    name: 'Oct Grass 2024-25',
    id: '1t55BvCeXlSqgbI5dpvDqrJSIA8gVl5ENgo56TAZDSYI',
  },
  {
    key: '2024_11',
    name: 'Nov Grass 2024-25',
    id: '1rcm6QVqS9kW0113_zpyn7XZGfOwX6n-wVYFvZN4cru0',
  },
  {
    key: '2024_12',
    name: 'Dec Grass 2024-25',
    id: '1_beZmyLuX9GrED7KdEOm4AyNeKTAnyACN51ZqcgzYMs',
  },
];

const CREDIT_LISTS_2024 = [
  {
    name: 'Customer Credit List-30-april',
    id: '11D9Wck1Y0JqYKFeklUeU_5bh0RfUUwM5fK0xtth03bM',
  },
  {
    name: 'Customer Credit List-May-31',
    id: '1PXI8ybzO1tDimdLvzBO-c_1bQXgsIednq_D66KFrnyA',
  },
  {
    name: 'Customer Credit List-20240630',
    id: '1hsz92hsihW5TuTRB-3_oYiXqNXbRJfvvLNOnpymfti0',
  },
  {
    name: 'Customer Credit List-20240731',
    id: '1UEHoi24WcQeJqbpwm95tQz7M5tYzAJ3AczdjmvF6WRc',
  },
  {
    name: 'Customer Credit List-20240831',
    id: '1d6-wSlGNr8Ph4S_mS0TAVk3sQYhJ0H2Mw_7lDb_oekw',
  },
  {
    name: 'Customer Credit List-20240930',
    id: '1PcyCIPrABzLcjhopioE2Y3S0Hoh1U3UbI54MoqKa4Eg',
  },
  {
    name: 'Customer Credit List-20241030',
    id: '1TPkK1ip-q4T7KKMnDgbWzpzf9BYI6ME82-8i5fICe8k',
  },
  {
    name: 'Customer Credit List-20241130',
    id: '1liGhHoPduBwhxwcdC2N_wejZa4Rac6g5beJF0jQCXSc',
  },
  {
    name: 'Customer Credit List-20241231',
    id: '12dF_daDdjNWZCuG1Die6V_Eao7Io-bJwIpfSf-fD-o4',
  },
  {
    name: 'Customer Credit List-Master',
    id: '1XZhs1rwTFVBWo5-DwdvF7pMEhHIlMP-A_SgqiTeMvU0',
  },
  {
    name: '2023-24 Anylicts',
    id: '1ZsZ2z2yHmWbXwqUBoMUybQv6ztApzuQB8OBDfuVGfSY',
  },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiWithRetry(fn, retries = 5, backoff = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(350); // slight throttle
      return await fn();
    } catch (err) {
      if (
        err.message &&
        err.message.includes('Quota exceeded') &&
        attempt < retries
      ) {
        const waitTime =
          backoff * Math.pow(2, attempt - 1) + Math.random() * 500;
        console.warn(
          `    ⚠️ Quota hit. Retrying in ${(waitTime / 1000).toFixed(1)}s (attempt ${attempt}/${retries})...`,
        );
        await sleep(waitTime);
      } else {
        throw err;
      }
    }
  }
}

async function fetchSpreadsheetMetadataAndValues(spreadsheetId) {
  const meta = await apiWithRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId }),
  );
  const sheetTitles = (meta.data.sheets || []).map((s) => s.properties.title);
  const result = { titles: sheetTitles, data: {} };

  for (const title of sheetTitles) {
    try {
      const resp = await apiWithRetry(() =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `'${title}'!A1:Z500`,
        }),
      );
      result.data[title] = resp.data.values || [];
    } catch (err) {
      console.warn(`    ⚠️ Could not fetch tab "${title}":`, err.message);
      result.data[title] = [];
    }
  }
  return result;
}

async function main() {
  console.log(
    '📥 Fetching 2024 Google Sheets & Credit Lists from Google Drive...\n',
  );
  const dump = existsSync(OUT_FILE)
    ? JSON.parse(readFileSync(OUT_FILE, 'utf8'))
    : {
        dumpedAt: new Date().toISOString(),
        monthlySheets: {},
        creditLists: {},
      };

  // 1. Monthly Sheets
  for (const m of MONTHLY_SPREADSHEETS_2024) {
    if (
      dump.monthlySheets &&
      dump.monthlySheets[m.key] &&
      Object.keys(dump.monthlySheets[m.key].data || {}).length >= 4
    ) {
      console.log(`⏩ Monthly Sheet ${m.name} (${m.key}) already cached.`);
      continue;
    }
    console.log(`📊 Fetching Monthly Sheet: ${m.name} (${m.key})...`);
    const sheetData = await fetchSpreadsheetMetadataAndValues(m.id);
    dump.monthlySheets[m.key] = {
      name: m.name,
      id: m.id,
      ...sheetData,
    };
    console.log(`  -> Fetched tabs: [${sheetData.titles.join(', ')}]`);
    writeFileSync(OUT_FILE, JSON.stringify(dump, null, 2), 'utf8');
  }

  // 2. Credit Lists
  for (const cl of CREDIT_LISTS_2024) {
    if (
      dump.creditLists &&
      dump.creditLists[cl.name] &&
      Object.keys(dump.creditLists[cl.name].data || {}).length >= 1
    ) {
      console.log(`⏩ Credit List ${cl.name} already cached.`);
      continue;
    }
    console.log(`📋 Fetching Credit List / Reference: ${cl.name}...`);
    try {
      const clData = await fetchSpreadsheetMetadataAndValues(cl.id);
      dump.creditLists[cl.name] = {
        name: cl.name,
        id: cl.id,
        ...clData,
      };
      console.log(`  -> Fetched tabs: [${clData.titles.join(', ')}]`);
      writeFileSync(OUT_FILE, JSON.stringify(dump, null, 2), 'utf8');
    } catch (err) {
      console.warn(`  ⚠️ Failed to fetch ${cl.name}:`, err.message);
    }
  }

  dump.dumpedAt = new Date().toISOString();
  writeFileSync(OUT_FILE, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`\n🎉 Successfully dumped 2024 data to ${OUT_FILE}`);
}

main().catch(console.error);
