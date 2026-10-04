import fs from 'fs';
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

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function uploadDoc(token, projectId, collection, docId, data) {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${docId}`;
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) fields[k] = toFirestoreValue(v);
  }
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  });
  const resData = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to upload ${collection}/${docId}: ` + JSON.stringify(resData));
  }
  console.log(`✅ Uploaded ${collection}/${docId}`);
}

async function main() {
  const { token, projectId } = await getAccessToken();

  // 1. Upload customer 620
  await uploadDoc(token, projectId, 'customers', '620', {
    id: '620',
    name: 'Inventory Clearance',
    mobile: '',
    village: '',
    creditLimit: 0,
  });

  // 2. Upload sale_2026_05_clearance_001
  await uploadDoc(token, projectId, 'customer_transactions', 'sale_2026_05_clearance_001', {
    id: 'sale_2026_05_clearance_001',
    date: '2026-05-01',
    customerId: '620',
    customerName: 'Inventory Clearance',
    type: 'SALE',
    category: 'Grass',
    weight: 12050,
    amount: 500,
    cashPaid: 500,
    remainingDue: 0,
    notes: 'Physical stock deficit / inventory clearance for May 2026',
  });

  console.log('🎉 Successfully uploaded Inventory Clearance customer and transaction!');
}

main().catch(console.error);
