/**
 * Script: Update Expense Categories in Firestore Database
 * Connects via firebase-admin service-account and updates all expense records
 * with proper expenseCategory ('Discount', 'Interest', 'Fuel', etc.)
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

async function updateExpenseCategories() {
  console.log('🔄 Checking Firestore purchases & expenses collections...');

  let updatedPurchases = 0;
  let updatedExpenses = 0;

  // 1. Check purchases collection
  const purchasesSnap = await db.collection('purchases').get();
  console.log(`Found ${purchasesSnap.size} documents in /purchases`);

  for (const docSnap of purchasesSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    const isExpense = data.type === 'EXPENSE' || docId.startsWith('expense_');

    if (isExpense) {
      let targetCategory = data.expenseCategory;

      if (
        docId.startsWith('expense_discount_') ||
        (data.note && data.note.toLowerCase().includes('discount'))
      ) {
        targetCategory = 'Discount';
      } else if (
        docId.includes('_s199') ||
        (data.note && data.note.toLowerCase().includes('intrest')) ||
        (data.note && data.note.toLowerCase().includes('interest'))
      ) {
        targetCategory = 'Interest';
      } else if (
        docId.includes('_s198') ||
        (data.note && data.note.toLowerCase().includes('diesel')) ||
        (data.note && data.note.toLowerCase().includes('fuel'))
      ) {
        targetCategory = 'Fuel';
      }

      if (targetCategory && targetCategory !== data.expenseCategory) {
        console.log(
          `Updating /purchases/${docId}: expenseCategory '${data.expenseCategory}' -> '${targetCategory}'`,
        );
        await docSnap.ref.update({
          type: 'EXPENSE',
          category: 'Expense',
          expenseCategory: targetCategory,
        });
        updatedPurchases++;
      }
    }
  }

  // 2. Check root expenses collection if any exists
  const expensesSnap = await db.collection('expenses').get();
  console.log(`Found ${expensesSnap.size} documents in /expenses`);

  for (const docSnap of expensesSnap.docs) {
    const data = docSnap.data();
    const docId = docSnap.id;
    let targetCategory = data.expenseCategory;

    if (
      docId.startsWith('expense_discount_') ||
      (data.note && data.note.toLowerCase().includes('discount'))
    ) {
      targetCategory = 'Discount';
    } else if (
      docId.includes('_s199') ||
      (data.note && data.note.toLowerCase().includes('intrest')) ||
      (data.note && data.note.toLowerCase().includes('interest'))
    ) {
      targetCategory = 'Interest';
    } else if (
      docId.includes('_s198') ||
      (data.note && data.note.toLowerCase().includes('diesel')) ||
      (data.note && data.note.toLowerCase().includes('fuel'))
    ) {
      targetCategory = 'Fuel';
    }

    if (targetCategory && targetCategory !== data.expenseCategory) {
      console.log(
        `Updating /expenses/${docId}: expenseCategory '${data.expenseCategory}' -> '${targetCategory}'`,
      );
      await docSnap.ref.update({
        type: 'EXPENSE',
        category: 'Expense',
        expenseCategory: targetCategory,
      });
      updatedExpenses++;
    }
  }

  console.log(`\n✅ Firestore Expense Categories Correction complete!`);
  console.log(`- Updated /purchases records: ${updatedPurchases}`);
  console.log(`- Updated /expenses records: ${updatedExpenses}`);
}

updateExpenseCategories().catch((err) => {
  console.error('Error updating expense categories in Firestore:', err);
  process.exit(1);
});
