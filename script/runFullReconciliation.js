/**
 * Full End-to-End Reconciled Audit Pipeline Runner
 *
 * Executes the complete 2026 HaySales reconciliation sequence:
 * 1. buildLocalCustomerRegistry.js   -> Builds master 377 canonical profiles with all aliases & opening debts
 * 2. generateFlatSalesJson.js         -> Formats 484 date-sorted sales with item type 'Others'
 * 3. computeMonthlyPaymentsDetailed.js-> Computes 282 pairwise monthly cash & settlement payments
 * 4. generateLocalPaymentsJson.js     -> Formats and finalizes local payments JSON
 * 5. compareFinalOutstanding.js       -> Compares calculated outstanding against August Google Sheet Col K
 */

import { execSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const steps = [
  {
    name: '1. Build Canonical Customer Registry & Alias Dictionary',
    cmd: `node "${join(__dirname, 'buildLocalCustomerRegistry.js')}"`,
  },
  {
    name: '2. Ingest Latest Sales from 2026 Google Sheets (Local Audit)',
    cmd: `node "${join(__dirname, 'importMonthlySales.js')}" --dry-run`,
  },
  {
    name: '3. Ingest Stock Purchases (Local Audit)',
    cmd: `node "${join(__dirname, 'importMonthlyPurchases.js')}" --dry-run`,
  },
  {
    name: '4. Ingest Services (Pickup) & Expenses from Sales Tab (Local Audit)',
    cmd: `node "${join(__dirname, 'importMonthlyServicesAndExpenses.js')}" --dry-run`,
  },
  {
    name: '5. Generate Flat Date-Sorted Sales JSON (Item: Others)',
    cmd: `node "${join(__dirname, 'generateFlatSalesJson.js')}"`,
  },
  {
    name: '6. Compute Pairwise Monthly Payments & Settlements',
    cmd: `node "${join(__dirname, 'computeMonthlyPaymentsDetailed.js')}"`,
  },
  {
    name: '7. Format & Finalize Local Payment JSONs',
    cmd: `node "${join(__dirname, 'generateLocalPaymentsJson.js')}"`,
  },
  {
    name: '8. Compare Calculated Balances against August Google Sheet Column K',
    cmd: `node "${join(__dirname, 'compareFinalOutstanding.js')}"`,
  },
];

console.log('═══════════════════════════════════════════════════════════════');
console.log('🚀 RUNNING COMPLETE 2026 RECONCILIATION AUDIT PIPELINE');
console.log(
  '═══════════════════════════════════════════════════════════════\n',
);

for (const step of steps) {
  console.log(`\n▶️  [STEP] ${step.name}...`);
  try {
    execSync(step.cmd, { stdio: 'inherit', cwd: join(__dirname, '..') });
    console.log(`✅  [DONE] ${step.name}`);
  } catch (error) {
    console.error(`❌  [FAILED] ${step.name}:`, error.message);
    process.exit(1);
  }
}

console.log(
  '\n═══════════════════════════════════════════════════════════════',
);
console.log('🎉 FULL RECONCILIATION PIPELINE COMPLETED SUCCESSFULLY!');
console.log(
  '═══════════════════════════════════════════════════════════════\n',
);
