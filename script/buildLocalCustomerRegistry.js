import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, 'data');
mkdirSync(DATA_DIR, { recursive: true });

const FOLDER_ID = '1-gQoQwAfGXqHZOvy5FYl20hq_K-kB_En';
const MASTER_SPREADSHEET_ID =
  process.env.MASTER_SPREADSHEET_ID ||
  '1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c';

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key,
  },
  scopes: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Non-customer entries to ignore in sales sheets
const IGNORED_ENTRIES = new Set([
  'retail',
  'dhuva retail',
  'expenses',
  'intrest',
  'daalu diesel + depreciation',
  'total',
]);

// Known spelling corrections / aliases: Variation -> Canonical Master Name
const ALIAS_MAP = new Map([
  ['dangi meghrajbhai veerabhai', 'Dangi Megharajbhai Veerabhai'],
  ['dangi meghrajbhai virshangbhai', 'Dangi Megharajbhai Veerabhai'],
  ['dangi megharajbhai virshangbhai', 'Dangi Megharajbhai Veerabhai'],
  ['dangi meghrajbhai veershangbhai', 'Dangi Megharajbhai Veerabhai'],
  ['dangi megharajbhai veershangbhai', 'Dangi Megharajbhai Veerabhai'],
  ['judal rajanibhai mafabhai', 'Judal Rajnibhai Mafabhai'],
  ['kasha jafarkhan', 'Khasha Jafarkhan'],
  ['khasa jafarkhan', 'Khasha Jafarkhan'],
  ['jafarkhan khasa', 'Khasha Jafarkhan'],
  ['thakor jagdishbhai ishvarbhai', 'Thakor Jagdishbhai Ishavrbhai'],
  ['thakor savjibhai hameerbhai', 'Thakor Savjibhai Hamirbhai'],
  ['thakor savabhai hameerbhai', 'Thakor Savjibhai Hamirbhai'],
  ['bavaji vedancha', 'Bavji Vedancha'],
  ['boka dhanrajbhai bhemabhai', 'Boka Dhanrajbhai Bhemjibhai'],
  ['mor chehrabhai abhubhai', 'Mor Cheharabhai Abhubhai'],
  ['shokhatbhai kubhasan', 'Shukhatbhai Kubhasan'],
  ['thakor vishunbhai dheerajbhai', 'Thakor Vinshubhai Dheerajbhai'],
  ['thakor rangnathji', 'Thakor Rangnathji Khodla'],
  ['thakor jyantibhaimadhubhai', 'Thakor Jyantibhai Madhubhai'],
  ['judal preveenbhai veershangbhai', 'Judal Pravinbhai Veershangbhai'],
  ['judal ghemarbhai rajshangbhai', 'Judal Ghemarbhai Rashangbhai'],
  ['judal ghemarbhai rasangbhai', 'Judal Ghemarbhai Rashangbhai'],
  ['judal.ghemarbhai rajsagbhai', 'Judal Ghemarbhai Rashangbhai'],
  ['mor rameshbhai nanjibhai', 'Mor Rameshbhai Nathabhai'],
  ['thakor ranshodji raghjiji', 'Thakor Ransaji Raghjiji'],
  ['thakor ransabhai ragjibhai', 'Thakor Ransaji Raghjiji'],
  ['thakor ransabhai raghjibhai', 'Thakor Ransaji Raghjiji'],
  ['takor ransabhai ragjibhai', 'Thakor Ransaji Raghjiji'],
  ['takor dharjibhai galbabhai', 'Thakor Dharjibhai Galbabhai'],
  ['takor balvatbhai chaganbhai', 'Thakor Balvatbhai Chaganbhai'],
  ['takor nagjibhai hameerbhai', 'Thakor Nagjibhai Hamirbhai'],
  ['thakor nagjibhai hameerbhai', 'Thakor Nagjibhai Hamirbhai'],
  ['thakor. ramesh bhai pujabhai', 'Thakor Rameshbhai Poojabhai'],
  ['thakor rameshbhai poojabhai', 'Thakor Rameshbhai Poojabhai'],
  ['bera preveenbhai parthibhai', 'Bera Praveenbhai Parthibhai'],
  ['bera parveenbhai parthibhai', 'Bera Praveenbhai Parthibhai'],
  ['boka deepakbhai parthibhai', 'Boka Dipakbhai Parthibhai'],
  ['boka deepkabhai parathibhai', 'Boka Dipakbhai Parthibhai'],
  ['akoliya devabhai somabhai', 'Akoliya Devabhai Shomabhai'],
  ['akoliya megharajbhai parthibhai', 'Akoliya Meghrajbhai Parthibhai'],
  ['akoliya m p', 'Akoliya Meghrajbhai Parthibhai'],
  ['akoliya m. p.', 'Akoliya Meghrajbhai Parthibhai'],
  ['judal narshbhai parthibhai', 'Judal Nareshbhai Parthibhai'],
  ['judal sadbhai kalubhai', 'Judal Sadabhai Kalubhai'],
  ['choudhary narshibhai kalubhai', 'Chaudhary Narshibhai Kalubhai'],
  ['kuva.rajubhai ramsugbhai', 'Kuva Rajubhai Ramshungbhai'],
  ['mor ashokbhai vedcha', 'Mor Ashokbhai Vedancha'],
  ['bhutdiya.dineshbhai versagbhai', 'Bhutadiya Dineshbhai Virshangbhai'],
  ['bhutdaiya laljibhai veerabhai', 'Bhutadiya Laljibhai Veerabhai'],
  ['bhutdaiya babubhai bhemabhai', 'Bhutadiya Babubhai Bhemabhai'],
  ['fosi prabhubhai manganbhai', 'Foshi Prabhubhai Maganbhai (Vedancha)'],
  ['foshi prapubhai maganbhai', 'Foshi Prabhubhai Maganbhai (Vedancha)'],
  ['foshi prabhubhai maganbhai', 'Foshi Prabhubhai Maganbhai (Vedancha)'],
  ['khabhla kantibhai jeeva bhai', 'Khabhala Kantibhai Jeevabhai'],
  ['khabhala kantibhai jeevabhai', 'Khabhala Kantibhai Jeevabhai'],
  ['akoliya devabhai shomabhai', 'Akoliya Devabhai Shomabhai Chadotar'],
  ['akoliya devabhai somabhai', 'Akoliya Devabhai Shomabhai Chadotar'],
  ['akoliya ashokbhai dhanrajbhai', 'Akoliya Ashokbhai Dhanrajbhai'],
  ['akoliya ashokbhai dhanrajbhai', 'Akoliya Ashokbhai Dhanrajbhai'],
  ['bera rasangbhai dohjibhai', 'Bera Rajsangbhai Dohjibhai'],
  ['bera rashangbhai dohjibhai', 'Bera Rajsangbhai Dohjibhai'],
  ['bera rashanghbhai dohjibhai', 'Bera Rajsangbhai Dohjibhai'],
  ['judal laljibhai somabhai', 'Judal Laljibhai Shomabhai'],
  ['judal prakashbhai veershangbhai', 'Judal Prakashbhai Virshangbhai'],
  ['judal valjibhai vireshangbhai', 'Judal Valjibhai Virshangbhai'],
  ['kag dineshbhai jeshungbhai', 'Kag Dineshbhai Jasungbhai'],
  ['kag mafatbhaibhai ramshungbhai', 'Kag Mafatbhai Ramshungbhai'],
  ['kakavadiya bhagvanbhai chandisar', 'Kakvadiya Bhagavanbhai Chandisar'],
  ['kakavadiya maheshbhai ramjibhai', 'Kakvadiya Maheshbhai Ramjibhai'],
  ['kakavadiya sureshbhai chandisar', 'Kakvadiya Sureshbhai Chandisar'],
  ['kasha vajeerkhan', 'Khasha Jafarkhan'],
  ['lohramjibhai moghabhai', 'Loh Ramjibhai Moghabhai'],
  ['desai rajubhai', 'Desai Rajubhai Maganbhai Rasana'],
  ['desai rajubhai maganbhai', 'Desai Rajubhai Maganbhai Rasana'],
  ['thakor dharjibhai galbabhai', 'Thakor Dharjibhai Galbabhai Chandisar'],
  ['takor dharjibhai galbabhai', 'Thakor Dharjibhai Galbabhai Chandisar'],
  ['palani mangabhai khodabhai', 'Palani Magabhai Khodabhai'],
  ['palani nareshbhai ishavrbhai', 'Palani Nareshbhai Ishvarbhai'],
  ['plani nareshbhai ishvarbhai', 'Palani Nareshbhai Ishvarbhai'],
  ['thakor amartbhai manabhai', 'Thakor Amratbhai Manabhai'],
  ['thakor amaratbhai manabhai', 'Thakor Amratbhai Manabhai'],
  ['thakor balvatbhai chaganbhai', 'Thakor Balvantbhai Chaganbhai'],
  ['thakor bhupatbhai virchandbhai', 'Thakor Bhupatbhai Veerchandbhai'],
  ['thakor rameshbhai pujabhai', 'Thakor Rameshbhai Poojabhai'],
  ['thakor sankarbhai ranpur', 'Thakor Shankarbhai Ranpur'],
  ['thakor vipulbbhai changanbhai', 'Thakor Vipulbhai Chaganbhai'],
  ['valagot parkashbhai karsanbhai', 'Valagot Prakashbhai Karshanbhai'],
  ['juva chelabhai jeevabhai', 'Juva Chelabhai Jeevabhai Chadotar'],
  ['judal ghemarbhai rasanghbhai', 'Judal Ghemarbhai Rashangbhai'],
  ['judal ghemarbhai rajsagbhai', 'Judal Ghemarbhai Rashangbhai'],
  ['thakor rangnathji', 'Thakor Rangnathji Khodla'],
  ['valagot deepakbhai mavjibhai', 'Valagot Dipakbhai Mavjibhai'],
  ['valagot babubhai partahibhai vedancha', 'Valagot Babubhai Parthibhai'],
  ['thakor bajubhai galbabhai', 'Takor Bajubhai Galbabhai'],
  ['judal jeetuben manjibhai', 'Judal Jeetuben Manjibhai'],
  ['judal rasbhai paragbhai', 'Judal Rasabhai Paragbhai'],
  ['akoliya dhanrajbhai veershangbhai', 'Akoliya Dhanrajbhai Virshangbhai'],
  ['akoliya dhanrajbhai virshangbhai', 'Akoliya Dhanrajbhai Virshangbhai'],
  ['bera laxmanbhai moghabhai', 'Bera Laxmanbhai Meghabhai'],
  ['bera rashanghbhai', 'Bera Rajsangbhai Dohjibhai'],
  ['bera rashanghbhai dohjibhai', 'Bera Rajsangbhai Dohjibhai'],
  ['bera rasangbhai dohjibhai', 'Bera Rajsangbhai Dohjibhai'],
  ['madana parkash menat', 'Menat Prakashbhai Madana'],
  ['madana prakash menat', 'Menat Prakashbhai Madana'],
  ['vajeerkhan khasa', 'Khasa Vajeerkhan'],
  ['vajeerkhan kasha', 'Khasa Vajeerkhan'],
  ['khasa vajirkhan', 'Khasa Vajeerkhan'],
  ['ratada haribhai laxmanbhai', 'Ratada Haribhai Laxmanbhai Badharpura'],
  ['bera amratbhai karshanbhai', 'Bera Amartbhai Karsanbhai'],
  ['bera amaratbhai karshanbhai', 'Bera Amartbhai Karsanbhai'],
  ['bera amratbhai karsanbhai', 'Bera Amartbhai Karsanbhai'],
  ['bhutdiya dineshbhai versagbhai', 'Bhutadiya Dineshbhai Veershangbhai'],
  ['bhutdiyadineshbhai versagbhai', 'Bhutadiya Dineshbhai Veershangbhai'],
  ['desai babubhai kurshbhai', 'Desai Babubhai Khurshibhai'],
  ['judal jituben manjibhai', 'Judal Jeetuben Manjibhai'],
  ['judal bakabhai jeshungbhai', 'Judal Bakabhai Jasungbhai'],
]);

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseRupeeValue(val, defaultVal = 0) {
  if (val === undefined || val === null || String(val).trim() === '')
    return defaultVal;
  const cleanString = String(val).replace(/[^0-9.-]/g, '');
  const parsed = Number(cleanString);
  return isNaN(parsed) ? defaultVal : parsed;
}

async function buildLocalCustomerRegistry() {
  console.log('🏗️ Building Comprehensive Local Customer Registry...\n');

  // 1. Read Master Customers Sheet
  console.log(`📊 Reading Master Customers from ${MASTER_SPREADSHEET_ID}...`);
  const masterRes = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: 'Customers!A:Z',
  });
  const masterRows = (masterRes.data.values || []).slice(1);

  // Registry map: canonicalNorm -> Record
  const registry = new Map();

  masterRows.forEach((r, idx) => {
    const rawName = (r[0] || '').trim();
    if (!rawName) return;
    const norm = normalize(rawName);
    const mappedName = ALIAS_MAP.get(norm) || rawName;
    const canonicalNorm = normalize(mappedName);

    if (!registry.has(canonicalNorm)) {
      registry.set(canonicalNorm, {
        canonicalName: mappedName,
        canonicalNorm,
        masterIndex: idx + 1,
        mobile: (r[1] || '').trim() || undefined,
        village: (r[2] || '').trim() || undefined,
        creditLimit: parseRupeeValue(r[3], 35000),
        aliases: [rawName],
        sourceFiles: ['Master Customer Sheet'],
        baselineOutstanding20251231: 0,
        salesTransactionsCount2026: 0,
      });
    } else {
      const entry = registry.get(canonicalNorm);
      if (!entry.aliases.includes(rawName)) entry.aliases.push(rawName);
    }
  });

  console.log(`✅ Loaded ${registry.size} master customer records.\n`);

  // 2. Discover all relevant spreadsheets from Drive
  const driveRes = await drive.files.list({
    q: `'${FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`,
    fields: 'files(id, name)',
    orderBy: 'name',
  });
  const allFiles = driveRes.data.files || [];

  const creditFiles = allFiles.filter((f) =>
    f.name.toLowerCase().includes('customer credit list'),
  );
  const grassFiles = allFiles.filter((f) =>
    f.name.toLowerCase().includes('grass 2026'),
  );

  // Add 20250131 baseline, 202601, and August sheet
  const explicitCreditSheets = [
    {
      id: '1HaMh9dURUBcmQW5u5w3uNgjMf9q9ufbeSkFMAFoYLsE',
      name: 'Customer Credit List-20250131',
    },
    {
      id: '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M',
      name: 'Customer Credit List-202601',
    },
    {
      id: '1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos',
      name: 'Customer Credit List (Aug)',
    },
  ];
  for (const ec of explicitCreditSheets) {
    if (!creditFiles.some((f) => f.id === ec.id)) {
      creditFiles.push(ec);
    }
  }

  // 3. Scan Credit List files (Debts & Baseline)
  console.log(
    `📂 Scanning ${creditFiles.length} Credit List files for debts & aliases...`,
  );
  for (const cf of creditFiles) {
    try {
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: cf.id,
        range: 'Sheet1!A2:K',
      });
      const rows = res.data.values || [];

      rows.forEach((row) => {
        const rawName = (row[0] || '').trim();
        if (!rawName || rawName === 'Total') return;
        const norm = normalize(rawName);
        const due = parseRupeeValue(row[10], 0);

        const mappedName = ALIAS_MAP.get(norm) || rawName;
        const canonicalNorm = normalize(mappedName);

        if (!registry.has(canonicalNorm)) {
          registry.set(canonicalNorm, {
            canonicalName: mappedName,
            canonicalNorm,
            creditLimit: 35000,
            aliases: [],
            sourceFiles: [],
            baselineOutstanding20251231: 0,
            salesTransactionsCount2026: 0,
          });
        }

        const entry = registry.get(canonicalNorm);
        if (!entry.aliases.includes(rawName)) entry.aliases.push(rawName);
        if (!entry.sourceFiles.includes(cf.name))
          entry.sourceFiles.push(cf.name);

        // For Customer Credit List-20260131, use Column B (PrvDebt) - Column F (PrvCredit) as starting 2026 opening balance
        if (cf.id === '1ZkHAgbTWjQJDY6nklWtzoQkDWURj5IDwG_EZfxNj_1M') {
          const prvDebt = parseRupeeValue(row[1], 0);
          const prvCredit = parseRupeeValue(row[5], 0);
          const netOpening = Math.max(0, prvDebt - prvCredit);
          entry.baselineOutstanding20251231 = netOpening;
          entry.openingDebt = netOpening;
        }
      });
    } catch (err) {
      console.warn(`  ⚠️ Could not read ${cf.name}:`, err.message);
    }
  }

  // 4. Scan Monthly Grass 2026 Sales sheets
  console.log(
    `\n🌾 Scanning ${grassFiles.length} Monthly Grass 2026 Sales tabs...`,
  );
  for (const gf of grassFiles) {
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId: gf.id });
      const salesSheet = meta.data.sheets.find((s) =>
        s.properties.title.toLowerCase().includes('sales'),
      );
      if (!salesSheet) continue;

      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: gf.id,
        range: salesSheet.properties.title + '!A1:Z',
      });
      const rows = res.data.values || [];
      if (rows.length <= 1) continue;

      const header = rows[0].map((h) => String(h).trim().toLowerCase());
      let custColIdx = header.findIndex((h) => h.includes('customer'));
      if (custColIdx === -1) custColIdx = 1;

      for (let i = 1; i < rows.length; i++) {
        const rawName = (rows[i][custColIdx] || '').trim();
        if (!rawName) continue;
        const norm = normalize(rawName);
        if (IGNORED_ENTRIES.has(norm)) continue;

        const mappedName = ALIAS_MAP.get(norm) || rawName;
        const canonicalNorm = normalize(mappedName);

        if (!registry.has(canonicalNorm)) {
          registry.set(canonicalNorm, {
            canonicalName: mappedName,
            canonicalNorm,
            creditLimit: 35000,
            aliases: [],
            sourceFiles: [],
            baselineOutstanding20251231: 0,
            salesTransactionsCount2026: 0,
          });
        }

        const entry = registry.get(canonicalNorm);
        if (!entry.aliases.includes(rawName)) entry.aliases.push(rawName);
        if (!entry.sourceFiles.includes(gf.name))
          entry.sourceFiles.push(gf.name);
        entry.salesTransactionsCount2026++;
      }
    } catch (err) {
      console.warn(`  ⚠️ Could not read ${gf.name}:`, err.message);
    }
  }

  // 5. Convert to Array and Save to Local JSON Reference files
  const customerList = Array.from(registry.values());
  customerList.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  // Assign deterministic local IDs
  customerList.forEach((c, idx) => {
    c.id = String(idx + 1);
  });

  const registryPath = join(DATA_DIR, 'local_customer_registry.json');
  const aliasDictionaryPath = join(DATA_DIR, 'customer_alias_dictionary.json');

  writeFileSync(registryPath, JSON.stringify(customerList, null, 2), 'utf-8');

  // Build quick lookup dictionary for fast matching in migration/merge scripts
  const quickLookup = {};
  for (const c of customerList) {
    quickLookup[c.canonicalNorm] = { id: c.id, canonicalName: c.canonicalName };
    for (const alias of c.aliases) {
      quickLookup[normalize(alias)] = {
        id: c.id,
        canonicalName: c.canonicalName,
      };
    }
  }
  writeFileSync(
    aliasDictionaryPath,
    JSON.stringify(quickLookup, null, 2),
    'utf-8',
  );

  console.log(
    '\n═══════════════════════════════════════════════════════════════',
  );
  console.log(
    `🎉 LOCAL REGISTRY COMPILED: Total ${customerList.length} Unique Customers`,
  );
  console.log(
    '═══════════════════════════════════════════════════════════════',
  );
  console.log(`📁 Saved Full Registry Reference: ${registryPath}`);
  console.log(`📁 Saved Fast Alias Lookup: ${aliasDictionaryPath}`);
  console.log(
    `👥 Master Customers: ${customerList.filter((c) => c.masterIndex).length}`,
  );
  console.log(
    `➕ Newly Discovered Customers (across Credit & Sales files): ${
      customerList.filter((c) => !c.masterIndex).length
    }`,
  );
}

buildLocalCustomerRegistry().catch((err) => {
  console.error('❌ Failed to build local registry:', err);
  process.exit(1);
});
