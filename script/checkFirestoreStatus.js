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

async function checkFirestore() {
  const custSnap = await db.collection('customers').get();
  console.log(`Total customers in Firestore: ${custSnap.size}`);

  let totalPaymentsInFirestore = 0;
  let totalSalesInFirestore = 0;

  for (const doc of custSnap.docs) {
    const txSnap = await doc.ref.collection('transactions').get();
    for (const t of txSnap.docs) {
      const data = t.data();
      if (data.type === 'PAYMENT') totalPaymentsInFirestore++;
      if (data.type === 'SALE') totalSalesInFirestore++;
    }
  }

  const purchasesSnap = await db.collection('purchases').get();
  console.log(`Total purchases in Firestore: ${purchasesSnap.size}`);
  console.log(`Total sales in Firestore: ${totalSalesInFirestore}`);
  console.log(`Total payments in Firestore: ${totalPaymentsInFirestore}`);
}

checkFirestore().catch((err) => console.error(err));
