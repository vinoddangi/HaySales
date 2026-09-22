/**
 * Script: Check Firestore Database Storage Size & Document Counts
 * Usage: node script/checkFirestoreDbSize.mjs
 */

import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ service-account.json not found in script directory.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

function estimateDocSize(id, data) {
  // Rough Firestore storage calculation: doc name + field contents + 32-byte indexing overhead
  const jsonStr = JSON.stringify(data);
  return (
    Buffer.byteLength(id, 'utf8') + Buffer.byteLength(jsonStr, 'utf8') + 32
  );
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function inspectDbSize() {
  console.log('🔄 Inspecting Firestore collections and subcollections...\n');
  const collections = await db.listCollections();
  let totalDocs = 0;
  let totalBytes = 0;
  const breakdown = [];

  for (const col of collections) {
    const snap = await col.get();
    let colBytes = 0;
    let colDocs = snap.size;
    let subDocCount = 0;
    let subDocBytes = 0;

    for (const doc of snap.docs) {
      colBytes += estimateDocSize(doc.id, doc.data());

      // Check nested subcollections (e.g., customers/{id}/transactions)
      const subcols = await doc.ref.listCollections();
      for (const subcol of subcols) {
        const subSnap = await subcol.get();
        subDocCount += subSnap.size;
        for (const subDoc of subSnap.docs) {
          subDocBytes += estimateDocSize(subDoc.id, subDoc.data());
        }
      }
    }

    const fullColDocs = colDocs + subDocCount;
    const fullColBytes = colBytes + subDocBytes;
    totalDocs += fullColDocs;
    totalBytes += fullColBytes;

    breakdown.push({
      Collection: col.id,
      'Root Docs': colDocs,
      'Subcollection Docs': subDocCount,
      'Total Docs': fullColDocs,
      'Storage Size': formatBytes(fullColBytes),
    });
  }

  console.log(
    '========================================================================',
  );
  console.log(
    '                   FIRESTORE DATABASE SIZE REPORT                       ',
  );
  console.log(
    '========================================================================',
  );
  console.table(breakdown);
  console.log(
    '------------------------------------------------------------------------',
  );
  console.log(
    `📊 Total Documents in DB : ${totalDocs.toLocaleString('en-IN')}`,
  );
  console.log(`💾 Estimated Storage Size: ${formatBytes(totalBytes)}`);
  console.log(
    `🆓 Free Tier Limit (1 GB): ${((totalBytes / (1024 * 1024 * 1024)) * 100).toFixed(4)}% utilized`,
  );
  console.log(
    '========================================================================\n',
  );
}

inspectDbSize().catch((err) => {
  console.error('Error calculating database size:', err);
  process.exit(1);
});
