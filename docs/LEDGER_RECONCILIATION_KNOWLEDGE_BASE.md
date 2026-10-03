# HaySales Full Ledger & Customer Reconciliation Knowledge Base

## 1. Executive Overview & Ground Truth Alignment

This document details the exact business rules, timeline discoveries, customer name resolution, and edge cases discovered while reconciling the entire 20-month operations of **HaySales** (January 2025 – August 2026) across Google Drive Spreadsheets and migrating into the local **IndexedDB** (`HaySalesOfflineDB`) / Cloud Firestore architecture.

---

## 2. Double-Entry Accounting Invariants & Ground Truths

Across all models and data feeds, the double-entry accounting identity holds strictly:

$$\begin{aligned}
\text{Total Customer Outstanding} &= \text{Opening Dues (Jan 1, 2025)} \\
&\quad + \text{Sales Credit Added (20 Months)} \\
&\quad + \text{Services Credit Added} \\
&\quad - \text{Total Payments Reconciled}
\end{aligned}$$

### Reconciled Metrics Summary (Jan 2025 – Aug 2026):

| Component | Amount (₹) | Source Ground Truth |
| :--- | :---: | :--- |
| **Opening Dues (Jan 1, 2025)** | **₹27,21,599.00** | [`Customer Credit List-20241231`](https://docs.google.com/spreadsheets/d/12dF_daDdjNWZCuG1Die6V_Eao7Io-bJwIpfSf-fD-o4/edit?gid=1908422397#gid=1908422397) (`12dF_daDdjNWZCuG1Die6V_Eao7Io-bJwIpfSf-fD-o4`) |
| **Gross Crop Sales** | **₹1,62,02,151.00** | 20 Grass Monthly Spreadsheets (`Sales` tab, **16,59,011 Kg**) |
| ↳ *Spot Cash Paid at Sale* | *(₹67,10,487.00)* | Spot cash collected immediately upon delivery |
| ↳ **Net Sales Credit Added** | **+₹94,91,664.00** | Unpaid crop sales balance added to customer debt |
| **Service Income (Daalu/Transport)** | **₹3,20,400.00** | 12 monthly line items aligned to canonical **Retail** account (`customerId: 423`) |
| **Total Customer Payments Reconciled** | **-₹85,84,759.00** | Unified across all 3 payment recovery scenarios |
| **⭐️ Total Customer Outstanding** | **₹36,28,504.00** | Ground Truth: [`Master Customer Credit Sheet (Sheet1)`](https://docs.google.com/spreadsheets/d/1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos/edit?gid=0#gid=0) (`1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos`) |

---

## 3. Timeline Alignment & Timeline Shift Anomaly

### The 1-Month Shift Discovery (March 2025 – November 2025)
1. **The Bug**: `Customer Credit List-20250331` was created by cloning the February credit list without rolling over March numbers (its sum was identical to Feb at ₹9,09,742).
2. **The Domino Effect**: To compensate, subsequent sheets were shifted forward by one month:
   - `March Grass 2025` bills were applied in `Customer Credit List-20250430`
   - `April Grass 2025` bills were applied in `Customer Credit List-20250531`
   - ... up to `November Grass 2025` bills applied in `Customer Credit List-20251231`.
3. **The Authentic December Sheet**: The true December 2025 credit list was stored in a file named `DONOT USED Customer Credit List-20251231` (`1o6D4OtAPEDLGNVZXWSz5zPX6xwdhosm-Yez5B-t8lXg`), matching `Dec Grass 2025` at ₹4,82,733.00.
4. **2026 Reset**: Starting January 2026 (`Customer Credit List-20260131`), the timeline re-aligned 1:1.

---

## 4. Google Sheets Column Structure Shifts

From **September 2025 onwards**, the Google Sheets team shifted column orders:
- **Jan 2025 – Aug 2025**:
  - Col 0 = `Customer Name`
  - Col 1 = `Date`
  - Col 2 = `Weight`
  - Col 3 = `Rate`
  - Col 4 = `Amount`
  - Col 5 = `Cash Paid`
  - Col 6 = `Remaining Due`
- **Sept 2025 – Aug 2026**:
  - Col 0 = `Date`
  - Col 1 = `Customer Name`
  - Col 2 = `Weight`
  - Col 3 = `Rate`
  - Col 4 = `Amount`
  - Col 5 = `Cash Paid`
  - Col 6 = `Remaining Due`

The extraction pipeline dynamically detects header strings (`customer`, `name`, `date`) and handles row-level indexing safely.

---

## 5. Non-Customer Operating Expenses & Service Income

At the bottom of the `Sales` tab in all 20 Grass sheets, there is a summary sub-table with operating expenses and transport income:
1. **Operating Expenses** (moved to `data/operation_transactions.csv`):
   - `Daalu Diesel`: Tractor fuel expenses (~₹20,000 – ₹50,000/mo).
   - `Intrest`: Monthly financing expense (strictly ₹7,000/mo in 2025).
   - `Stationery`, `Tractor Repair`, `Food / Staff`: General operational overhead.
2. **Service Income** (moved to `data/customer_transactions.csv` under `Retail`):
   - `Daalu` loading/transport income (12 occurrences totaling ₹3,20,400.00).

---

## 6. Three Payment Recovery Scenarios

To recover complete payment data across all 21 sheets without omitting off-sheet transactions:
- **Scenario 1 (Direct Explicit Payments)**:
  - Extracted from columns `Credit2` and `Credit3` (and discount in `Kasar`).
- **Scenario 2 (Dropped Customer Clearance)**:
  - When a customer had closing dues $\text{Closing Dues}_{M-1} > 0$ at month $M-1$ but is omitted in month $M$, they settled their dues between billing cycles.
- **Scenario 3 (Rollover Delta Collections)**:
  - When a customer's opening net balance in month $M$ is less than their closing balance in month $M-1$, the delta represents an unrecorded off-sheet collection.

---

## 7. Customer Master Deduplication & Canonical Alias Rules

All 718 raw text variants across 20 months are resolved into **570 canonical customer profiles**:
1. **`Akoliya Galababhai Devabhai` (ID `11`)**: Merged `Akoiliya Galbabhai Devabhai` + `Akoiliya Galbhabhai Devabhai` + `Akoliya Galbabhai Devabhai`.
2. **`Boka Dipakbhai Parthibhai` (ID `71`)**: Merged `Boka Deepkabhai Parathibhai` (ID `557`) + `Boka Dipakbhai Parthibhai`.
3. **`Foshi Prabhubhai Maganbhai` (ID `127`)**: Merged `Foshi Maganbhai Kalubhai` (ID `126`) + `Foshi Prabhubhai Maganbhai (Vedancha)` + 5 spelling variations.
4. **`Kakvadiya Maheshbhai Ramjibhai` (ID `306`)**: Merged `Kakavadiya Maheshbhai Ramjibhai` (ID `596`) + `Kakvadiya Maheshbhai Ramjibhai`.
5. **`Kubhasan Shokatbhai` (ID `297`)**: Merged `Kubhasan Shokatbhai 9898775295` + `Shokhatbhai Kubhalmer` + `Shokhatbhai Kubhasan`.
6. **`Retail` (ID `423`)**: Unified all walk-in retail cash variations (`Retail`, `Retail - Vedancha`, `Sudha Retail`, `Dhuva Retail`, `Khasa Retail`).

---

## 8. Master Generation Script

To regenerate the entire dataset from fresh Google Drive dumps at any time, run:
```bash
python3 scripts/generateAllReconciledData.py
```
This builds:
1. `data/customers.csv`
2. `data/customer_transactions.csv`
3. `data/operation_transactions.csv`
4. `public/initialDatabaseSnapshot.json`
5. `drafts/import_to_chrome_indexeddb.js`
