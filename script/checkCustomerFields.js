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

async function checkCustomerOpeningDebts() {
  const custSnap = await db.collection('customers').limit(10).get();
  console.log(`Sample Firestore Customers:`);
  for (const doc of custSnap.docs) {
    const data = doc.data();
    console.log(
      `- ${data.name} (ID: ${doc.id}): openingDebt = ${data.openingDebt}, balance = ${data.balance}`,
    );
  }
}

checkCustomerOpeningDebts().catch((err) => console.error(err));
