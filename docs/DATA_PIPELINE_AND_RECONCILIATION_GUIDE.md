# HaySales Data Pipeline, Google Sheets Reconciliation & Historical Ingestion Guide

This document captures the end-to-end knowledge, architecture, business rules, and step-by-step procedures used to extract, normalize, reconcile, and import data from Google Sheets into the HaySales Firestore database and CSV backups.

It serves as the permanent reference manual for maintaining existing data and ingesting historical datasets (such as **2025 data**).

---

## 1. System & Data Architecture Overview

```mermaid
flowchart TD
    A[Google Drive Folder\n1-gQoQwAfGXqHZOvy5FYl20hq_K-kB_En] --> B[Master Customer & Opening Sheets]
    A --> C[Monthly Spreadsheets\ne.g., Jan-Aug 2026 Grass Sheets]

    B --> D[Customer Normalization & Alias Engine]
    C --> D

    D --> E[Canonical Customer Registry\ncust_001, cust_002, ...]

    C --> F[Data Extractors]
    F --> F1[Sales Ingestion]
    F --> F2[Purchases Ingestion]
    F --> F3[Services Ingestion]
    F --> F4[Farm Expenses Ingestion]

    E & F1 & F2 & F3 & F4 --> G[Reconciliation & Validation Engine]

    G --> H[Customer Ledger Accounting\nRunning Balance & Discounts]
    G --> I[Monthly P&L & Rollout Engine\nStock, COGS, Net Profit]

    H & I --> J[(Cloud Firestore DB)]
    H & I --> K[IndexedDB Local Cache\nv5 Offline DB]
    H & I --> L[Standardized Backup CSVs\nGoogle Drive Backup & Restore]
```

### Key IDs & Storage Locations

- **Google Drive Data Folder**: `1-gQoQwAfGXqHZOvy5FYl20hq_K-kB_En`
- **Master Customer Spreadsheet ID**: `1Q7NTxdeE7xQ7XBNGijn0xjoxkZK4Y1Glu3bMBfmxH-c`
- **Authentication**: Service Account JSON with Google Drive (`drive.readonly`) and Google Sheets (`spreadsheets.readonly`) scopes.

---

## 2. Customer Master & Alias Resolution

In traditional Google Sheets records, customer names have spelling variations, Gujarati/English phonetic variations, honorific variations (`bhai`, `ji`, `patel`), or village name suffixes (e.g., `Vedancha`, `Kubhasan`, `Khodla`).

### Alias Mapping Principles

1. **Canonical Primary Name**: All transaction records must link to a single canonical `customerId` and standardized name.
2. **Normalized Lookup**: Lowercase, strip punctuation (`.`, `-`), collapse consecutive spaces.
3. **Known Alias Rules**:
   - Phonetic variants: `Meghrajbhai` $\leftrightarrow$ `Megharajbhai`, `Hamirbhai` $\leftrightarrow$ `Hameerbhai`.
   - Inverted surname/given names: `Jafarkhan Khasa` $\rightarrow$ `Khasha Jafarkhan`.
   - Village disambiguation: When two people share a name, attach the village in parentheses, e.g. `Foshi Prabhubhai Maganbhai (Vedancha)`.
   - Single-name entities: `Akoliya` $\rightarrow$ merged to `Bhanwar Lal Akoliya` (or canonical Akoliya record).

### Retail Customer Mapping (`retail`, `dhuva retail`)

Walk-in or spot cash sales recorded as `retail` or `dhuva retail` in Google Sheets:

- Must **NOT** be discarded.
- Must be mapped to a dedicated **Retail Customer** account (e.g. `Retail Customer` / `Dhuva Retail`).
- Handled as cash sales transactions with immediate cash receipt (`cashPaid = amount`, `remainingDue = 0`) or tracked under retail ledger.

### Ignored / Non-Customer Rows in Sales Sheets

Only rows representing non-sales summaries, operational overheads, or formula totals are ignored from sales tables:

- `expenses` (parsed into Farm Expenses table instead)
- `intrest`, `interest` (financial overhead)
- `daalu diesel + depreciation` (vehicle/machinery operational cost)
- `total`, `grand total`, `subtotal` (sheet calculation rows)

---

## 3. Google Sheet Tab & Column Structure

### A. Monthly Sales & Grass Sheets

Each monthly spreadsheet (e.g., `Jan Grass 2026`, `Feb Grass 2026`, etc.) contains daily sales records:

| Column Index  | Field Name        | Type     | Notes / Parsing Logic                                                                               |
| :------------ | :---------------- | :------- | :-------------------------------------------------------------------------------------------------- |
| **Col A (0)** | Date              | `Date`   | Parsed into `YYYY-MM-DD`. If blank, carries forward date from previous row.                         |
| **Col B (1)** | Customer Name     | `String` | Run through Alias Dictionary to map to `customerId`.                                                |
| **Col C (2)** | Crop / Item       | `String` | Normalized to valid crop item (`Juvar`, `Makai`, `Bajra`, `Chana`, `Ghaun`, `Groundnut Hay`, etc.). |
| **Col D (3)** | Weight (kg)       | `Number` | Weight in kilograms. Filter out non-numeric/empty cells.                                            |
| **Col E (4)** | Total Amount (₹)  | `Number` | Total sale value ($=\text{Weight} \times \text{Rate}$).                                             |
| **Col F (5)** | Cash Received (₹) | `Number` | Cash paid immediately at time of purchase.                                                          |
| **Col G (6)** | Balance / Due (₹) | `Number` | $\text{Amount} - \text{Cash Received}$. Added to customer's outstanding balance.                    |

### B. Purchases / Stock Inward Tabs

Tracks bulk purchases of hay from farmers/dealers:

- **Date**: Date of purchase.
- **Item**: Crop variety (`Juvar`, `Makai`, `Chana`, etc.).
- **Weight (kg)**: Total inward weight.
- **Amount (₹)**: Purchase cost.
- **Cash Paid (₹)**: Cash paid to vendor.
- **Vendor Name**: Farmer or supplier name.
- **Note**: Truck number, farm location, or crop quality.

### C. Services & Machinery Tabs

Tracks services provided using machinery:

- **Items**: `Tractor Service`, `Baler Service`, `Thresher Service`, `Pickup Transport`.
- **Amount & Cash Paid**: Credited or collected in cash.

### D. Farm Expenses Tabs

Categorized into standardized expense types:

1. `Fuel` (Diesel for tractors, pickups, balers).
2. `Maintenance` (Repairs, spare parts, servicing).
3. `Labor` (Majuri, loading/unloading labor).
4. `Daalu/Pickup` (Transportation and delivery charges).
5. `Others` (Miscellaneous utilities, interest, tea/supplies).
6. `Discount Given` (Settlement discounts provided during ledger payments).

---

## 4. Reconciliation & Accounting Logic

### A. Customer Outstanding Amount Reconciliation

The customer outstanding due represents the exact net amount owed by each customer to the business. During the Google Sheets migration, manual ledger totals were audited against transactional math to achieve 100% mathematical consistency.

#### 1. Core Mathematical Formula

For every customer account:
$$\text{Outstanding Due} = \text{Opening Balance} + \sum \text{Sale/Service Credit Due} - \sum \text{Cash Payments Received} - \sum \text{Discounts Given}$$

Where:

- $\text{Opening Balance}$: Outstanding debt carried forward from the previous financial year (e.g., 2025 ending balance).
- $\text{Sale/Service Credit Due}$: The unpaid portion of any sale or service ($\text{Amount} - \text{Spot Cash Paid}$).
- $\text{Cash Payments Received}$: Direct cash collections recorded via customer payment receipts.
- $\text{Discounts Given}$: Concessions/round-offs granted during account settlement.

#### 2. Resolving Sheet Discrepancies vs Transaction Ledgers

In manual Google Sheets records, human arithmetic errors or missing opening balances often caused discrepancies:

- **Missing Baseline Debt**: If a customer made a ₹20,000 payment in March but had only ₹5,000 of sales in 2026, the customer had an implicit baseline debt of ₹15,000 from 2025.
- **Explicit Opening Balance Documents**: For every customer with carried-over debt, an explicit `OPENING_BALANCE` transaction document (`item: 'Previous Outstanding'`, `date: 'YYYY-01-01'`) is seeded into their ledger subcollection so that the entire ledger history sums up exactly without invisible baseline offsets.

#### 3. Monthly Timing Offsets & Discrepancy Resolution in Google Sheets

When auditing historical monthly customer dues against Google Sheets credit lists, two patterns emerge:

1. **1-Month Ingestion Timing Offset**:
   In the physical operations of 2025, credit sales made in month $M$ were tallied and formally entered into column C of the subsequent month's credit list ($M+1$). For instance:
   - January 2025 Sales Debt (₹4,46,988) was billed into `Customer Credit List-20250131` Col C.
   - February 2025 Sales Debt (₹9,09,742) was billed into `Customer Credit List-20250228` Col C.
   - March 2025 Sales Debt (₹5,52,530) was billed into `Customer Credit List-20250430` Col C.
     When aligned with their corresponding sales months, the transactional debt matches the credit sheets with **100% exact precision**.

2. **Column-Level Accounting Integrity**:
   Across every single monthly credit list evaluated (over 2,500 total customer rows), the column-level formula:
   $$\text{Total Due (Col K)} = \text{Total Debt (Col E)} - \text{Total Credit (Col J)}$$
   has **0 mathematical errors**.

---

### B. Payment Recovery & Settlement Scenarios

HaySales handles all practical farm/business payment scenarios systematically:

#### Scenario 1: Spot Cash Sales (No Credit Created)

- **Use Case**: Retail sales or regular customers paying 100% on the spot.
- **Transaction Details**:
  - `amount = ₹5,000`
  - `cashPaid = ₹5,000`
  - `remainingDue = ₹0`
- **Customer Ledger Impact**: Customer debt remains unchanged ($\Delta = 0$). Cash is recorded in the monthly revenue and cash flow.

#### Scenario 2: Credit Sales (Deferred Payment)

- **Use Case**: Customer purchases ₹25,000 worth of hay, pays ₹5,000 cash, and takes ₹20,000 on credit.
- **Transaction Details**:
  - `amount = ₹25,000`
  - `cashPaid = ₹5,000`
  - `remainingDue = ₹20,000`
- **Customer Ledger Impact**: Customer outstanding balance increases by $+₹20,000$.

#### Scenario 3: Partial Debt Recovery (Cash Payment)

- **Use Case**: Customer owes ₹40,000 and pays ₹15,000 in cash.
- **Transaction Details**:
  - `type = 'PAYMENT'`
  - `amount = ₹15,000`
  - `cashPaid = ₹15,000`
  - `discount = ₹0`
  - `remainingDue = ₹0`
- **Customer Ledger Impact**: Customer outstanding balance reduces from ₹40,000 to ₹25,000.

#### Scenario 4: Settle Full Balance with Discount / Round-off (Crucial Workflow)

- **Use Case**: Customer owes ₹29,200. During final negotiation, customer pays ₹29,000 cash, and the merchant agrees to waive the remaining ₹200 as a round-off settlement discount.
- **App Workflow**:
  - User selects "Settle Entire Balance" checkbox.
  - User enters `Amount Paid = ₹29,000`.
  - App automatically computes `Discount Given = ₹200` ($\text{Due} - \text{Cash Paid}$).
- **Database & Ledger Effects**:
  1. **Customer Ledger**: Payment transaction is recorded with `amount = ₹29,000`, `cashPaid = ₹29,000`, `discount = ₹200`. Customer's `outstandingAmount` is reduced to exactly **₹0**.
  2. **Expense & P&L Recording**: The ₹200 discount is automatically aggregated and recorded as an expense under category **`Discount Given`** in the Monthly P&L.
  3. **Financial Integrity**: Business accounts stay completely balanced without uncollected orphan debt.

#### Scenario 5: Full Cash Settlement (Exact Due Paid)

- **Use Case**: Customer owes ₹18,000 and pays the full ₹18,000 in cash.
- **Transaction Details**:
  - `amount = ₹18,000`
  - `cashPaid = ₹18,000`
  - `discount = ₹0`
- **Customer Ledger Impact**: Customer outstanding balance is reduced to **₹0**.

---

### C. Monthly Rollout & P&L Engine

At the end of each calendar month, the system calculates and locks the monthly financial summary:

1. **Gross Sales Revenue**: $\sum \text{Sales Amount} + \sum \text{Services Amount}$.
2. **Cost of Goods Sold (COGS)**:
   $$\text{COGS} = \text{Beginning Inventory Value} + \text{Purchases} - \text{Ending Inventory Value}$$
   _(Or calculated based on average purchase cost per kg multiplied by sold weight)._
3. **Total Farm Expenses**: $\sum \text{Fuel} + \sum \text{Maintenance} + \sum \text{Labor} + \sum \text{Daalu/Pickup} + \sum \text{Others} + \sum \text{Discounts}$.
4. **Net Profit**:
   $$\text{Net Profit} = \text{Gross Revenue} - \text{COGS} - \text{Total Farm Expenses}$$
5. **Rollout Status Lock**: `monthly_rollout_status.lastRolledOutMonth` ensures historical accounting records cannot be accidentally modified without proper rollout verification.

---

## 5. CSV Backup & Restore Specification

The system uses standard CSV files stored locally and synchronized with Google Drive:

1. **`customers.csv`**:
   `id,name,phone,village,openingBalance,outstandingAmount,creditLimit,isCreditAllowed,createdAt`
2. **`transactions.csv`**:
   `id,customerId,customerName,type,item,weightKg,rate,amount,cashPaid,remainingDue,discount,date,note,createdAt`
3. **`purchases.csv`**:
   `id,type,item,weightKg,rate,amount,cashPaid,remainingDue,vendorName,expenseCategory,date,note,createdAt`
4. **`monthly_rollout.csv`**:
   `id,month,totalRevenue,totalExpense,netProfit,totalSoldKg,totalPurchaseKg,closingStockKg,carriedBalance,status,createdAt`
5. **`metadata.csv`**:
   `id,data` (stores `monthly_rollout_status` JSON payload).

---

## 6. Playbook: Ingesting 2025 Historical Data (Step-by-Step)

When reading and importing **2025 Google Sheets data**, follow this step-by-step execution protocol:

### Step 1: Discover & Catalog 2025 Sheets & 2024 Baseline Credit List

1. Place `service-account.json` in root or configure Google OAuth credentials.
2. Locate the 2024 opening credit list: `Customer Credit List-20241231` (`12dF_daDdjNWZCuG1Die6V_Eao7Io-bJwIpfSf-fD-o4`) in `archived/2024`.
3. Locate all 12 monthly 2025 spreadsheet IDs in `archived/2025` (`1H4vbiSIczJ4sAxb9k-yt0zAO8iWC1Uty`): `Jan Grass 2025` (`1C274TasGsyMWwLRblMpItjzE8uXn39I0KjuTQ1nTJ2U`) through `Dec Grass 2025` (`1peCKx10p0OTsIQTdGu7I4JQrK3t4VSKZ9wqtWt884oQ`).

### Step 2: Customer Registry & Baseline Opening Due Reconciliation

1. Load existing canonical customer registry (`customers.csv`).
2. Parse `Customer Credit List-20241231` using the formula:
   $$\text{Baseline Opening Due} = \max(0, \text{Col B (Prv. Debt)} - \text{Col F (Prv. Credit)})$$
   _(Total Starting 2024 Opening Due across 163 customers: ₹2,320,165)._
3. Map every 2025 entity name variation to existing `customerId`s using `customer_alias_dictionary.json`.
4. Register genuine new historical customers with unique sequential IDs (IDs 378+) without altering existing 2026 customer IDs.

### Step 3: Sequential Ingestion (Month by Month)

1. **Extract Sales**: Parse 12 months of sales rows (761 transactions totaling ₹87,00,153).
2. **Extract Purchases**: Parse hay inward records across all 12 months (138 purchases totaling ₹1,49,57,914).
3. **Extract Services & Expenses**: Categorize Monthly Operations, Interest, and Diesel/Daalu.
4. **Extract Customer Payments**: Process pairwise monthly credit lists (`Customer Credit List-20250131` to `20251130`) to capture explicit payments and account clearances (389 payment records totaling ₹43,93,423).
5. **Generate Monthly Rollouts**: Generate 12 historical monthly rollout snapshots (`2025-01` through `2025-12`).

### Step 4: Local Database Seeding & Verification

1. Run `node script/ingest2025HistoricalData.mjs` to update CSV backups in `script/data/backups/`.
2. Run `node script/seedDatabase.js` to refresh `initialDatabaseSnapshot.json`.
3. Run `npm test` and `npm run build` to verify end-to-end type safety and zero regressions.

### Step 5: Month-by-Month Customer Due Validation

Run `node script/validateCustomerMonthlyDues.mjs` to trace and validate customer running ledger balances month-by-month:
$$\text{Ending Due}_M = \text{Starting Due}_M + \sum \text{Sales Debt}_M - \sum \text{Payments Received}_M$$
Verifies continuity across all 20 historical periods (Jan 2025 through Aug 2026).
