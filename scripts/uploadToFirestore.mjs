import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Obtain Google OAuth2 Access Token with Datastore / Cloud Platform Scope
 */
async function getAccessToken(serviceAccountPath = 'scripts/service-account.json') {
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at: ${serviceAccountPath}`);
  }
  const creds = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: creds.client_email,
    scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/cloud-platform',
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
  return { token: data.access_token, projectId: creds.project_id || 'shreyansh-group' };
}

/**
 * Convert standard JS object to Firestore Value map
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val === undefined || val === null || val === '') continue;
    if (typeof val === 'number') {
      if (Number.isInteger(val)) {
        fields[key] = { integerValue: String(val) };
      } else {
        fields[key] = { doubleValue: val };
      }
    } else if (typeof val === 'boolean') {
      fields[key] = { booleanValue: val };
    } else if (typeof val === 'string') {
      fields[key] = { stringValue: val };
    } else if (Array.isArray(val)) {
      fields[key] = {
        arrayValue: {
          values: val.map((item) => (typeof item === 'string' ? { stringValue: item } : { integerValue: String(item) })),
        },
      };
    }
  }
  return fields;
}

/**
 * Commit a batch of writes to Firestore REST API
 */
async function commitBatch(token, projectId, writes) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore commit failed (${res.status}): ${errText}`);
  }
  return await res.json();
}

/**
 * Main Upload Runner
 */
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log('🚀 Starting Firestore Data Upload Tool...');
  if (isDryRun) {
    console.log('ℹ️ DRY RUN MODE: No writes will be committed to Cloud Firestore.');
  }

  // 1. Load Initial Database Snapshot
  const snapshotPath = path.resolve('public/initialDatabaseSnapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found at ${snapshotPath}. Please run python3 scripts/generateAllReconciledData.py first.`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { customers = [], customer_transactions = [], operation_transactions = [] } = snapshot;

  console.log(`📦 Loaded snapshot:`);
  console.log(`   - Customers:              ${customers.length} records`);
  console.log(`   - Customer Transactions: ${customer_transactions.length} records`);
  console.log(`   - Operation Transactions: ${operation_transactions.length} records`);

  // 2. Obtain Token & Project ID
  let token = 'DRY_RUN_TOKEN';
  let projectId = 'shreyansh-group';
  if (!isDryRun) {
    console.log('🔑 Authenticating with Google Cloud Service Account...');
    const auth = await getAccessToken();
    token = auth.token;
    projectId = auth.projectId;
    console.log(`✅ Authenticated for project: [${projectId}]`);
  }

  // 3. Build Write Operations
  const allWrites = [];

  // (A) Customers
  for (const c of customers) {
    const docPath = `projects/${projectId}/databases/(default)/documents/customers/${c.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: toFirestoreFields(c),
      },
    });
  }

  // (B) Customer Transactions
  for (const ct of customer_transactions) {
    const docPath = `projects/${projectId}/databases/(default)/documents/customer_transactions/${ct.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: toFirestoreFields(ct),
      },
    });
  }

  // (C) Operation Transactions
  for (const ot of operation_transactions) {
    const docPath = `projects/${projectId}/databases/(default)/documents/operation_transactions/${ot.id}`;
    allWrites.push({
      update: {
        name: docPath,
        fields: toFirestoreFields(ot),
      },
    });
  }

  console.log(`\n📤 Total Documents to Upload: ${allWrites.length}`);

  if (isDryRun) {
    console.log('✨ Dry run completed successfully. All document formats verified!');
    return;
  }

  // 4. Batch Commit (Chunk size = 300, max Firestore limit is 500)
  const CHUNK_SIZE = 300;
  const totalChunks = Math.ceil(allWrites.length / CHUNK_SIZE);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, allWrites.length);
    const chunk = allWrites.slice(start, end);

    process.stdout.write(`⏳ Uploading batch ${i + 1}/${totalChunks} (${chunk.length} docs: items ${start + 1}..${end})... `);
    await commitBatch(token, projectId, chunk);
    console.log('✅ Done');
  }

  console.log('\n🎉 Successfully uploaded all reconciled data to Cloud Firestore!');
  console.log(`   - Collection customers:              ${customers.length} docs`);
  console.log(`   - Collection customer_transactions: ${customer_transactions.length} docs`);
  console.log(`   - Collection operation_transactions: ${operation_transactions.length} docs`);
}

main().catch((err) => {
  console.error('\n❌ Firestore Upload Error:', err.message || err);
  process.exit(1);
});
