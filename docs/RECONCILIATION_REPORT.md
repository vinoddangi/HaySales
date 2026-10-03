# HaySales Google Drive Data Pipeline & Reconciliation Report

**Date**: October 2, 2026  
**Pipeline Source**: Google Drive Spreadsheets (2025 & 2026 Folders)  
**Master Credit Sheet**: [`Customer Credit List (Master)`](https://docs.google.com/spreadsheets/d/1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos/edit?gid=0#gid=0)

---

## 1. Generated Data Files in `data/`

| File | Records | Schema / Columns | Description |
| :--- | :---: | :--- | :--- |
| [`data/customers.csv`](../data/customers.csv) | **657** | `id,name,mobile,village,creditLimit` | Canonical customers list (no `OutstandingAmount` column). |
| [`data/sales.csv`](../data/sales.csv) | **1,434** | `id,type,category,date,weight,amount,cashPaid,remainingDue,customerId,customerName,note` | Consolidated sales & opening dues (143 opening + 748 in 2025 + 543 in 2026). |
| [`data/sales_2024_opening.csv`](../data/sales_2024_opening.csv) | **143** | `customerId,customerName,amount,date` | Minimal format for 2024 customer opening dues as of `2024-12-31T12:00:00.000Z`. |
| [`data/sales_2025.csv`](../data/sales_2025.csv) | **748** | Same as `sales.csv` | All 12 monthly sales spreadsheets for 2025 (`Jan` to `Dec`). |
| [`data/sales_2026.csv`](../data/sales_2026.csv) | **543** | Same as `sales.csv` | 2026 sales (`Jan` to `Jul` + `Aug`/`Sep` master tabs). |
| [`data/purchases.csv`](../data/purchases.csv) | **234** | `id,type,category,date,weight,amount,cashPaid,remainingDue,vendorName,note` | Consolidated purchases (126 in 2025 + 108 in 2026). |
| [`data/purchases_2025.csv`](../data/purchases_2025.csv) | **126** | Same as `purchases.csv` | 2025 purchases. |
| [`data/purchases_2026.csv`](../data/purchases_2026.csv) | **108** | Same as `purchases.csv` | 2026 purchases. |
| [`data/payments.csv`](../data/payments.csv) | **778** | `id,type,date,amount,cashPaid,remainingDue,customerId,customerName,note` | Freshly extracted payments across all 20 monthly credit lists. |
| [`data/payments_2025.csv`](../data/payments_2025.csv) | **478** | Same as `payments.csv` | All payments in 2025. |
| [`data/payments_2026.csv`](../data/payments_2026.csv) | **300** | Same as `payments.csv` | All payments in 2026 (including master sheet). |

---

## 2. Key Architecture & Business Rules Applied

1. **Strict Single Weight Unit (`weight`)**: Kilograms (**Kg**) ONLY. No Quintals or Tons.
2. **Strict Single Financial Property (`amount`)**: No `paymentAmount` field.
3. **Transaction Model (`OPENING_DUE`)**:
   - Single canonical type: `'OPENING_DUE'` (under `TransactionType` and `CustomerTransactionType`).
   - Represents opening balance / opening dues without `weight` (`weight: 0`) and without `category`.
4. **Three Payment Extraction Scenarios**:
   - **Scenario 1 (Column G & H)**: Payments recorded directly in `Credit2` or `Credit3` of month $M$.
   - **Scenario 2 (Customer Omitted in Month $M$)**: Customer had remaining balance in month $M-1$ and is not present in month $M$ $\implies$ balance settled.
   - **Scenario 3 (Column B Reset to ₹0)**: Customer had balance in month $M-1$ and their `Prv. Debt` (Col B) in month $M$ is ₹0 $\implies$ prior balance cleared.

---

## 3. Reconciliation vs Master Spreadsheet

**Spreadsheet ID**: `1FyT2Oxx8iQm0qxP6_BPOGLeWcPWKFk_33Kz8asQ2dos`  
$$\text{CSV Ledger Balance} = \sum \text{Sales/Opening Due Amount} - \sum \text{Sales Cash Paid} - \sum \text{Payments}$$

### Reconciliation Stats
- **Total Customers in Master Sheet**: **204**
- **Exact Matches ($\Delta = ₹0$)**: **131 (64.2%)**
- **Minor Roundoff ($\Delta \le ₹10$)**: **3 (1.5%)**
- **Differences ($\Delta > ₹10$)**: **70 (34.3%)**

---

## 4. Reusable Pipeline Scripts in `scripts/`

- [`scripts/convertDriveToCsv.mjs`](../scripts/convertDriveToCsv.mjs): Extracts customers, 2024 opening dues, and 2025/2026 sales & purchases into CSVs.
- [`scripts/extractPayments.mjs`](../scripts/extractPayments.mjs): Freshly extracts payments from all 20 monthly credit lists applying the 3 scenarios.
- [`scripts/reconcileCustomerDues.mjs`](../scripts/reconcileCustomerDues.mjs): Compares calculated CSV ledger balances against the master Google spreadsheet.
- [`scripts/customerAliasDictionary.json`](../scripts/customerAliasDictionary.json): Audited 812-entry customer alias mapping dictionary.
