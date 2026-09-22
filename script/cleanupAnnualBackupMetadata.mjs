/**
 * Script: Clean up annual backup metadata and legacy collections from Firestore DB
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

async function cleanupAnnualBackupDb() {
  console.log('🔄 Cleaning up Firestore annual backup metadata...');

  // 1. Delete metadata/backup_status
  const statusDocRef = db.collection('metadata').doc('backup_status');
  const snap = await statusDocRef.get();
  if (snap.exists) {
    await statusDocRef.delete();
    console.log('✅ Deleted document /metadata/backup_status');
  } else {
    console.log('ℹ️ /metadata/backup_status already does not exist.');
  }

  // 2. Check and clean any legacy archive collections
  const collections = await db.listCollections();
  for (const col of collections) {
    if (
      col.id.startsWith('customers-') ||
      col.id.startsWith('purchases-') ||
      col.id.startsWith('transactions-')
    ) {
      console.log(`🧹 Cleaning legacy archive collection: ${col.id}...`);
      const colSnap = await col.get();
      const batch = db.batch();
      colSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ Cleared ${colSnap.size} docs from ${col.id}`);
    }
  }

  console.log('\n🎉 Firestore annual backup cleanup completed!');
}

cleanupAnnualBackupDb().catch((err) => {
  console.error('Error cleaning up backup metadata in Firestore:', err);
  process.exit(1);
});
