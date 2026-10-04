import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

async function fetchCollectionDocNames(token, projectId, collectionId) {
  let docNames = [];
  let pageToken = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionId}?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Failed to list collection ${collectionId}: ${err}`);
    }
    const data = await res.json();
    if (data.documents) {
      for (const d of data.documents) {
        docNames.push(d.name);
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return docNames;
}

async function main() {
  console.log('🚀 Starting Complete Firestore Clean & Restore Tool...');
  
  const auth = await getAccessToken();
  const token = auth.token;
  const projectId = auth.projectId;
  console.log(`✅ Authenticated for project: [${projectId}]`);

  // 1. Load Local Snapshot
  const snapshotPath = path.resolve('public/initialDatabaseSnapshot.json');
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { customers = [], customer_transactions = [], operation_transactions = [] } = snapshot;

  // 2. Fetch existing document names in Firestore to delete orphaned/unmatched docs
  console.log('\n🔍 Scanning existing Firestore collections...');
  const existingCustTxs = await fetchCollectionDocNames(token, projectId, 'customer_transactions');
  console.log(`   - Found ${existingCustTxs.length} existing customer_transactions in Firestore`);

  const validCustTxNames = new Set(customer_transactions.map(t => `projects/${projectId}/databases/(default)/documents/customer_transactions/${t.id}`));
  const docsToDelete = existingCustTxs.filter(name => !validCustTxNames.has(name));

  if (docsToDelete.length > 0) {
    console.log(`🗑️ Deleting ${docsToDelete.length} orphaned/reconciliation customer transactions from Firestore...`);
    const deleteWrites = docsToDelete.map(name => ({ delete: name }));
    const CHUNK_SIZE = 300;
    for (let i = 0; i < Math.ceil(deleteWrites.length / CHUNK_SIZE); i++) {
      const chunk = deleteWrites.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await commitBatch(token, projectId, chunk);
    }
    console.log('✅ Orphaned documents deleted.');
  }

  // 3. Upload target documents
  const allWrites = [];
  for (const c of customers) {
    allWrites.push({
      update: {
        name: `projects/${projectId}/databases/(default)/documents/customers/${c.id}`,
        fields: toFirestoreFields(c),
      },
    });
  }
  for (const ct of customer_transactions) {
    allWrites.push({
      update: {
        name: `projects/${projectId}/databases/(default)/documents/customer_transactions/${ct.id}`,
        fields: toFirestoreFields(ct),
      },
    });
  }
  for (const ot of operation_transactions) {
    allWrites.push({
      update: {
        name: `projects/${projectId}/databases/(default)/documents/operation_transactions/${ot.id}`,
        fields: toFirestoreFields(ot),
      },
    });
  }

  console.log(`\n📤 Uploading ${allWrites.length} clean restored documents...`);
  const CHUNK_SIZE = 300;
  const totalChunks = Math.ceil(allWrites.length / CHUNK_SIZE);
  for (let i = 0; i < totalChunks; i++) {
    const chunk = allWrites.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
    process.stdout.write(`⏳ Uploading batch ${i + 1}/${totalChunks} (${chunk.length} docs)... `);
    await commitBatch(token, projectId, chunk);
    console.log('✅ Done');
  }

  console.log('\n🎉 Cloud Firestore has been completely restored to pre-reconciliation baseline!');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
