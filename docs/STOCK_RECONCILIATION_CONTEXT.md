# Stock & Transaction Reconciliation Summary (Jan 2025 – Aug 2026)

This document records the exact reconciliation between **Google Sheets** and our **Application CSV / Firestore Database** for all purchases, sales, opening stocks, and closing stocks.

---

## 1. Baseline Opening Position (as of Jan 1, 2025 / 2024 Year-End)

- **Opening Stock Weight**: `24,203.0 Kg`
- **Opening Stock Valuation**: `₹216,616.85` (Rate: ₹8.95/Kg)
- **Baseline Cumulative Commission**: `₹2,084,732.00`
- **Baseline Service Income (Daalu)**: `₹340,860.00`
- **Baseline Expenses**: `₹260,190.00`

---

## 2. Purchases & Sales Transaction Parity (100% Match)

Every individual monthly purchase and sales total across all 20 months in `data/operation_transactions.csv` and `data/customer_transactions.csv` **matches Google Sheets with 0 variance**:

| Month | Purchases (Kg) | Purchases (₹) | Sales (Kg) | Sales (₹) | Parity Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Jan 2025** | 64,135 | ₹607,400.00 | 76,318 | ₹811,218.00 | Exact Match (0 diff) |
| **Feb 2025** | 105,455 | ₹932,100.00 | 112,765 | ₹1,159,122.00 | Exact Match (0 diff) |
| **Mar 2025** | 129,905 | ₹938,700.00 | 117,817 | ₹1,029,647.00 | Exact Match (0 diff) |
| **Apr 2025** | 200,800 | ₹1,397,250.00 | 136,927 | ₹1,086,167.00 | Exact Match (0 diff) |
| **May 2025** | 68,000 | ₹470,400.00 | 66,950 | ₹552,916.00 | Exact Match (0 diff) |
| **Jun 2025** | 1 | ₹7.00 | 32,356 | ₹282,426.00 | Exact Match (0 diff) |
| **Jul 2025** | 37,100 | ₹300,900.00 | 75,367 | ₹681,160.00 | Exact Match (0 diff) |
| **Aug 2025** | 44,050 | ₹365,300.00 | 49,111 | ₹462,617.00 | Exact Match (0 diff) |
| **Sep 2025** | 127,595 | ₹1,143,600.00 | 111,470 | ₹1,100,187.00 | Exact Match (0 diff) |
| **Oct 2025** | 11,000 | ₹101,700.00 | 30,954 | ₹323,793.00 | Exact Match (0 diff) |
| **Nov 2025** | 60,700 | ₹592,400.00 | 47,121 | ₹504,167.00 | Exact Match (0 diff) |
| **Dec 2025** | 59,300 | ₹629,200.00 | 61,560 | ₹715,833.00 | Exact Match (0 diff) |
| **Jan 2026** | 95,890 | ₹913,410.00 | 105,108 | ₹1,121,090.00 | Exact Match (0 diff) |
| **Feb 2026** | 116,225 | ₹943,350.00 | 110,589 | ₹1,027,299.00 | Exact Match (0 diff) |
| **Mar 2026** | 115,925 | ₹898,200.00 | 115,638 | ₹1,022,780.00 | Exact Match (0 diff) |
| **Apr 2026** | 90,660 | ₹704,650.00 | 84,649 | ₹730,174.00 | Exact Match (0 diff) |
| **May 2026** | 122,890 | ₹1,089,650.00 | 121,217 | ₹1,231,340.00 | Exact Match (0 diff) |
| **Jun 2026** | 38,240 | ₹355,400.00 | 43,375 | ₹461,123.00 | Exact Match (0 diff) |
| **Jul 2026** | 84,970 | ₹874,000.00 | 85,694 | ₹995,684.00 | Exact Match (0 diff) |
| **Aug 2026** | 79,420 | ₹853,000.00 | 74,025 | ₹903,408.00 | Exact Match (0 diff) |
| **Total** | **1,652,261.0 Kg** | **₹14,110,617.00** | **1,659,011.0 Kg** | **₹16,202,151.00** | **Exact Match (0 diff)** |

---

## 3. The 12,050 Kg Inventory Deficit / Manual Adjustment

### Root Cause
- In the **April 2026 Google Sheet (`Main` tab)**, closing stock was correctly calculated as:
  $$\text{April Closing} = 10,233\text{ (Op)} + 90,660\text{ (Pur)} - 84,649\text{ (Sale)} = \mathbf{16,244\text{ Kg}}\text{ (₹126,268.07)}$$
- In the **May 2026 Google Sheet (`Opening/Closing` tab)**, opening stock was **manually entered** as:
  $$\text{May Opening} = \mathbf{4,194\text{ Kg}}\text{ (₹32,629.32)}$$
- **Deficit / Write-down Amount**:
  $$\Delta \text{Stock} = 16,244\text{ Kg} - 4,194\text{ Kg} = \mathbf{-12,050\text{ Kg}}\quad (\mathbf{-₹93,638.75}\text{ valuation reduction})$$

---

## 4. Closing Stock as of Aug 31, 2026

### A. Pure Continuous Calculation from CSV Data (Without Deficit Adjustment)
- **Total Inflow (Opening + Purchases)**: $24,203 + 1,652,261 = 1,676,464.0\text{ Kg}$
- **Total Outflow (Sales Dispatched)**: $1,659,011.0\text{ Kg}$
- **Calculated Closing Stock**: $\mathbf{17,453.0\text{ Kg}}$
- **Calculated Closing Valuation**: $\mathbf{₹186,054.64}$

### B. Google Sheet Closing Stock (With 12,050 Kg Manual Write-down)
- **Sheet Closing Stock (Aug 2026)**: $\mathbf{5,403.0\text{ Kg}}$ (₹58,187.35)
- **Difference**: Exactly $17,453.0\text{ Kg} - 5,403.0\text{ Kg} = \mathbf{12,050.0\text{ Kg}}$ ($₹186,054.64 - ₹58,187.35 = ₹127,867.29$)
