import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const reg = JSON.parse(
  readFileSync(
    join(__dirname, 'data', 'local_customer_registry.json'),
    'utf-8',
  ),
);
let totalOpening = 0;
let countWithDebt = 0;

for (const c of reg) {
  const d = c.baselineOutstanding20251231 || c.openingDebt || 0;
  if (d > 0) {
    countWithDebt++;
    totalOpening += d;
  }
}

console.log(`Customers with opening debt: ${countWithDebt}/${reg.length}`);
console.log(
  `Total Opening Debt (from Column K): ₹${totalOpening.toLocaleString('en-IN')}`,
);
