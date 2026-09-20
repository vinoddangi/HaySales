import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function deletePayments() {
  console.log(
    '🗑️ Finding and deleting all PAYMENT transactions in Firestore...',
  );
  const custSnap = await db.collection('customers').get();
  let deletedCount = 0;

  for (const doc of custSnap.docs) {
    const txSnap = await doc.ref
      .collection('transactions')
      .where('type', '==', 'PAYMENT')
      .get();
    for (const t of txSnap.docs) {
      await t.ref.delete();
      deletedCount++;
    }
  }

  console.log(
    `✅ Successfully deleted ${deletedCount} payment transactions from Firestore.`,
  );
}

deletePayments().catch((err) => {
  console.error('Error deleting payments:', err);
  process.exit(1);
});
