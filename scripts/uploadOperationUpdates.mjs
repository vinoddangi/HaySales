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

function areFieldsEqual(remoteFields = {}, localFields = {}) {
  const rKeys = Object.keys(remoteFields).sort();
  const lKeys = Object.keys(localFields).sort();
  if (rKeys.length !== lKeys.length) return false;
  for (let i = 0; i < rKeys.length; i++) {
    if (rKeys[i] !== lKeys[i]) return false;
    const k = rKeys[i];
    if (JSON.stringify(remoteFields[k]) !== JSON.stringify(localFields[k])) {
      return false;
    }
  }
  return true;
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

async function fetchAllCollectionDocs(token, projectId, collectionId) {
  const docs = new Map();
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
        const id = d.name.split('/').pop();
        docs.set(id, d);
      }
    }
    pageToken = data.nextPageToken || '';
  } while (pageToken);

  return docs;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Operation Transactions Differential Sync...');

  // 1. Load Initial Database Snapshot
  const snapshotPath = path.resolve('public/initialDatabaseSnapshot.json');
  if (!fs.existsSync(snapshotPath)) {
    throw new Error(`Snapshot file not found at ${snapshotPath}. Run python3 scripts/generateAllReconciledData.py first.`);
  }

  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  const { operation_transactions = [] } = snapshot;
  console.log(`📦 Loaded ${operation_transactions.length} operation transactions from snapshot.`);

  // 2. Authenticate
  const { token, projectId } = await getAccessToken();
  console.log(`✅ Authenticated to project: ${projectId}`);

  // 3. Fetch existing Firestore operation transactions
  console.log('🔍 Fetching existing Firestore operation_transactions...');
  const remoteDocsMap = await fetchAllCollectionDocs(token, projectId, 'operation_transactions');
  console.log(`   Found ${remoteDocsMap.size} existing remote documents in Firestore.`);

  // 4. Identify obsolete documents to delete
  const localIds = new Set(operation_transactions.map((t) => t.id));
  const obsoleteDocNames = [];
  for (const [id, doc] of remoteDocsMap.entries()) {
    if (!localIds.has(id)) {
      obsoleteDocNames.push(doc.name);
    }
  }

  if (obsoleteDocNames.length > 0) {
    console.log(`🧹 Deleting ${obsoleteDocNames.length} obsolete document(s) in Firestore:`);
    for (const name of obsoleteDocNames) {
      console.log(`   - ${name.split('/').pop()}`);
    }
    const deleteWrites = obsoleteDocNames.map((name) => ({ delete: name }));
    await commitBatch(token, projectId, deleteWrites);
    console.log('   ✅ Obsolete documents removed.');
  } else {
    console.log('   ✨ No obsolete documents to delete.');
  }

  // 5. Differential check: only prepare writes for new or changed documents
  const diffWrites = [];
  for (const ot of operation_transactions) {
    const localFields = toFirestoreFields(ot);
    const remoteDoc = remoteDocsMap.get(ot.id);
    const docPath = `projects/${projectId}/databases/(default)/documents/operation_transactions/${ot.id}`;

    if (!remoteDoc) {
      // Brand new document
      diffWrites.push({
        type: 'CREATE',
        id: ot.id,
        category: ot.category,
        amount: ot.amount,
        write: {
          update: {
            name: docPath,
            fields: localFields,
          },
        },
      });
    } else {
      // Check if fields differ
      const isMatch = areFieldsEqual(remoteDoc.fields, localFields);
      if (!isMatch) {
        diffWrites.push({
          type: 'UPDATE',
          id: ot.id,
          category: ot.category,
          amount: ot.amount,
          write: {
            update: {
              name: docPath,
              fields: localFields,
            },
          },
        });
      }
    }
  }

  console.log(`\n📊 Differential Analysis:`);
  console.log(`   - Unchanged documents: ${operation_transactions.length - diffWrites.length}`);
  console.log(`   - Changes to write:    ${diffWrites.length}`);

  if (diffWrites.length === 0) {
    console.log('🎉 Firestore is already completely up to date! Zero writes needed.');
    return;
  }

  console.log('\n📝 Pending writes detail:');
  for (const item of diffWrites) {
    console.log(`   [${item.type}] ${item.id} (${item.category}: ₹${item.amount})`);
  }

  // 6. Write in small batches (e.g. 10 docs per batch) with pause to avoid 429 quota limits
  const BATCH_SIZE = 10;
  for (let i = 0; i < diffWrites.length; i += BATCH_SIZE) {
    const batchItems = diffWrites.slice(i, i + BATCH_SIZE);
    const writes = batchItems.map((item) => item.write);
    process.stdout.write(`⏳ Writing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(diffWrites.length / BATCH_SIZE)} (${writes.length} docs)... `);
    await commitBatch(token, projectId, writes);
    console.log('✅ Done');
    if (i + BATCH_SIZE < diffWrites.length) {
      await sleep(1000); // 1-second pause between batches
    }
  }

  console.log('\n🎉 Successfully synchronized all operation transactions to Cloud Firestore!');
}

main().catch((err) => {
  console.error('\n❌ Firestore Sync Error:', err.message || err);
  process.exit(1);
});
