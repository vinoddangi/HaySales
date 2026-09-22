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

async function updateFirestoreRecord() {
  console.log(
    '🚀 Updating Customer 14 (Akoliya Meghrajbhai Parthibhai) in Firestore...\n',
  );

  const cust14Ref = db.collection('customers').doc('14');
  const cust15Ref = db.collection('customers').doc('15');

  // 1. Update Customer doc
  await cust14Ref.set(
    {
      name: 'Akoliya Meghrajbhai Parthibhai',
      openingDebt: 18895,
      outstandingAmount: 0,
      creditLimit: 35000,
      mobile: '',
      village: '',
    },
    { merge: true },
  );
  console.log(
    '✅ Updated Customer 14 document metadata (name, openingDebt: 18895, outstandingAmount: 0).',
  );

  // 2. Ensure explicit OPENING_BALANCE transaction exists
  const openingBalRef = cust14Ref
    .collection('transactions')
    .doc('opening_bal_14');
  await openingBalRef.set({
    id: 'opening_bal_14',
    customerId: '14',
    customerName: 'Akoliya Meghrajbhai Parthibhai',
    type: 'OPENING_BALANCE',
    category: 'Opening Balance',
    item: 'Previous Outstanding',
    amount: 18895,
    remainingDue: 18895,
    cashPaid: 0,
    date: '2026-01-01T00:00:00.000Z',
    note: 'Carried forward outstanding balance from 2025',
  });
  console.log(
    '✅ Added explicit OPENING_BALANCE transaction (₹18,895) on 2026-01-01.',
  );

  // 3. Ensure Jan 21 Sale exists
  const saleJanRef = cust14Ref
    .collection('transactions')
    .doc('sale_2026_01_49');
  await saleJanRef.set({
    id: 'sale_2026_01_49',
    customerId: '14',
    customerName: 'Akoliya Meghrajbhai Parthibhai',
    type: 'SALE',
    item: 'Others',
    weightKg: 1345,
    rate: 11,
    amount: 14795,
    cashPaid: 0,
    remainingDue: 14795,
    discount: 0,
    date: '2026-01-21T12:00:00.000Z',
    note: 'Sale recorded from Jan Grass 2026 (Row 49)',
  });
  console.log('✅ Added Jan 21 Sale transaction (₹14,795).');

  // 4. Ensure July 4 Sale exists
  const saleJulRef = cust14Ref
    .collection('transactions')
    .doc('sale_2026_07_16');
  await saleJulRef.set({
    id: 'sale_2026_07_16',
    customerId: '14',
    customerName: 'Akoliya Meghrajbhai Parthibhai',
    type: 'SALE',
    item: 'Others',
    weightKg: 2875,
    rate: 10.96,
    amount: 31500,
    cashPaid: 31500,
    remainingDue: 0,
    discount: 0,
    date: '2026-07-04T12:00:00.000Z',
    note: 'Sale recorded from July Grass 2026 (Row 16)',
  });
  console.log('✅ Added July 04 Sale transaction (₹31,500 - Cash paid).');

  // 5. Ensure July 15 Settlement Payment exists
  const payJulRef = cust14Ref.collection('transactions').doc('14_2026_07');
  await payJulRef.set({
    id: '14_2026_07',
    customerId: '14',
    customerName: 'Akoliya Meghrajbhai Parthibhai',
    type: 'PAYMENT',
    amount: 33690,
    paymentAmount: 33690,
    cashPaid: 33690,
    remainingDue: 0,
    date: '2026-07-15T12:00:00.000Z',
    note: 'Customer settled previous balance of ₹33,690 and was removed in Customer Credit List-20260731',
  });
  console.log('✅ Added July 15 Payment transaction (₹33,690).');

  // 6. Delete Customer 15 if still present
  const doc15 = await cust15Ref.get();
  if (doc15.exists) {
    const tx15 = await cust15Ref.collection('transactions').get();
    for (const d of tx15.docs) {
      await d.ref.delete();
    }
    await cust15Ref.delete();
    console.log('✅ Cleaned up redundant Customer 15 doc.');
  }

  // 7. Verify All Transactions under 14
  const finalCust = await cust14Ref.get();
  const allTxs = await cust14Ref.collection('transactions').get();

  console.log('\n======================================================');
  console.log('🎉 VERIFICATION OF CUSTOMER 14 IN FIRESTORE:');
  console.log('======================================================');
  console.log('Profile:', finalCust.data());
  console.log(`Total Transactions (${allTxs.size}):`);
  allTxs.docs
    .sort((a, b) => (a.data().date || '').localeCompare(b.data().date || ''))
    .forEach((d) => {
      const data = d.data();
      console.log(
        `  📅 [${data.date?.slice(0, 10)}] [${data.type}] ID: ${d.id} | Amount: ₹${data.amount || data.paymentAmount} | Item: ${data.item || 'Payment'} | Note: ${data.note || ''}`,
      );
    });
}

updateFirestoreRecord().catch(console.error);
