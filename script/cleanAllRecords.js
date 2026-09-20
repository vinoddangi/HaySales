import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read Service Account credentials securely
const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

// Initialize Firebase Admin SDK
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function deleteDocumentRecursively(docRef) {
  // 1. First delete all subcollections
  const subCollections = await docRef.listCollections();
  for (const subCol of subCollections) {
    const subDocRefs = await subCol.listDocuments();
    for (const subDocRef of subDocRefs) {
      await deleteDocumentRecursively(subDocRef);
    }
  }
  // 2. Delete the document itself
  await docRef.delete();
}

async function cleanAllRecords() {
  console.log(
    '🧹 Starting deep recursive cleanup of all Firestore collections...',
  );

  // 1. Wipe all collections recursively
  const rootCollections = await db.listCollections();
  console.log(
    `Found root collections:`,
    rootCollections.map((c) => c.id),
  );

  for (const rootCol of rootCollections) {
    console.log(`🗑️ Deep cleaning root collection: '${rootCol.id}'...`);
    const docRefs = await rootCol.listDocuments();
    console.log(
      `Found ${docRefs.length} document references in '${rootCol.id}'.`,
    );

    let processed = 0;
    for (const docRef of docRefs) {
      await deleteDocumentRecursively(docRef);
      processed++;
      if (processed % 50 === 0 || processed === docRefs.length) {
        console.log(
          `  ✓ Cleaned ${processed}/${docRefs.length} in '${rootCol.id}'`,
        );
      }
    }
  }

  // 2. Extra safeguard for common collections if not returned in listCollections
  const explicitCollections = [
    'customers',
    'purchases',
    'metadata',
    'monthly_periods',
    'yearly_periods',
  ];

  for (const colName of explicitCollections) {
    try {
      const docRefs = await db.collection(colName).listDocuments();
      for (const docRef of docRefs) {
        await deleteDocumentRecursively(docRef);
      }
    } catch {
      // Ignore if collection does not exist
    }
  }

  console.log(
    '\n✨ All Firestore root documents, phantom parent paths, subcollections, monthly periods, and metadata have been completely wiped!',
  );
}

cleanAllRecords().catch((err) => {
  console.error('❌ Clean failed:', err);
  process.exit(1);
});
