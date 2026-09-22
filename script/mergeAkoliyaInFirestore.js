import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, 'service-account.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

async function mergeAkoliyaInFirestore() {
  console.log(
    '🚀 Merging Akoliya M. P. (14) & Akoliya Meghrajbhai Parthibhai (15) in Firestore...\n',
  );

  const cust14Ref = db.collection('customers').doc('14');
  const cust15Ref = db.collection('customers').doc('15');

  // 1. Fetch data
  const [doc14, doc15] = await Promise.all([cust14Ref.get(), cust15Ref.get()]);
  if (!doc14.exists) {
    console.error('❌ Customer 14 not found in Firestore!');
    return;
  }

  console.log('Found Customer 14:', doc14.data());
  if (doc15.exists) {
    console.log('Found Customer 15:', doc15.data());
  }

  // 2. Fetch Customer 15 transactions
  let tx15Docs = [];
  if (doc15.exists) {
    const tx15Snap = await cust15Ref.collection('transactions').get();
    tx15Docs = tx15Snap.docs;
    console.log(
      `Found ${tx15Docs.length} transactions under Customer 15 to migrate.`,
    );
  }

  const batch = db.batch();

  // 3. Update Customer 14 canonical profile
  batch.update(cust14Ref, {
    name: 'Akoliya Meghrajbhai Parthibhai',
    outstandingAmount: 0,
  });

  // 4. Move transactions from 15 to 14
  for (const doc of tx15Docs) {
    const data = doc.data();
    const newTxRef = cust14Ref.collection('transactions').doc(doc.id);
    batch.set(newTxRef, {
      ...data,
      customerId: '14',
      customerName: 'Akoliya Meghrajbhai Parthibhai',
    });
    batch.delete(doc.ref);
    console.log(` -> Migrating transaction ${doc.id} to Customer 14`);
  }

  // 5. Delete Customer 15 doc if exists
  if (doc15.exists) {
    batch.delete(cust15Ref);
    console.log(' -> Deleting redundant Customer 15 document');
  }

  // 6. Commit batch
  await batch.commit();
  console.log('\n✅ Successfully merged in Firestore!');

  // Verify
  const updated14 = await cust14Ref.get();
  const updated14Txs = await cust14Ref.collection('transactions').get();
  const verify15 = await cust15Ref.get();

  console.log('\n--- VERIFICATION ---');
  console.log('Customer 14 profile:', updated14.data());
  console.log(`Customer 14 transactions (${updated14Txs.size}):`);
  updated14Txs.forEach((d) =>
    console.log(
      `  - [${d.id}] ${d.data().type} amount: ₹${d.data().amount || d.data().paymentAmount}`,
    ),
  );
  console.log('Customer 15 exists:', verify15.exists);
}

mergeAkoliyaInFirestore().catch(console.error);
