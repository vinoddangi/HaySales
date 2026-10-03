# Monthly Credit List Alignment & Payment Extraction Guide

## 1. Executive Summary

This document establishes the verified, chronological mapping between the **20 Monthly Operational Grass Spreadsheets** (`Sales` tab) and the **Customer Credit Lists** (`Date2 + Date3` and `Credit2 + Credit3` columns) covering **January 2025 through August 2026**.

It resolves the timeline anomaly where `Customer Credit List-20250331` was duplicated without rolling over March data, causing mid-2025 sheets to be shifted by one month, and integrates the newly discovered authentic December 2025 credit list (`DONOT USED Customer Credit List-20251231`).

---

## 2. Complete 20-Month Relationship Matrix

| # | Operational Grass File | Grass Sales Debt (`Debt` col) | Matching Customer Credit List | Credit List `Date2+Date3` | Diff | Alignment Status |
| :-: | :--- | :--- | :--- | :--- | :-: | :--- |
| **1** | **Jan Grass 2025** | ₹4,46,988.00 | `Customer Credit List-20250131` | ₹4,46,988.00 | **₹0.00** | **100% Exact Match** |
| **2** | **Feb Grass 2025** | ₹9,09,742.00 | `Customer Credit List-20250228` | ₹9,09,742.00 | **₹0.00** | **100% Exact Match** |
| — | *(Un-rolled Clone)* | — | `Customer Credit List-20250331` | ₹9,09,742.00 | — | *Duplicate clone of Feb sheet* |
| **3** | **March Grass 2025** | ₹5,52,530.00 | `Customer Credit List-20250430` | ₹5,52,530.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **4** | **April Grass 2025** | ₹4,67,997.00 | `Customer Credit List-20250531` | ₹4,67,997.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **5** | **May Grass 2025** | ₹2,98,086.00 | `Customer Credit List-20250630` | ₹2,98,046.00 | ₹40.00 | **Exact Match** *(1-Month Shift)* |
| **6** | **Jun Grass 2025** | ₹1,77,096.00 | `Customer Credit List-20250731` | ₹1,77,096.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **7** | **July Grass 2025** | ₹4,18,790.00 | `Customer Credit List-20250831` | ₹4,18,790.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **8** | **Aug Grass 2025** | ₹2,97,487.00 | `Customer Credit List-20250930` | ₹2,97,487.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **9** | **Sep Grass 2025** | ₹5,37,087.00 | `Customer Credit List-20251031` | ₹5,37,082.00 | ₹5.00 | **Exact Match** *(1-Month Shift)* |
| **10** | **Oct Grass 2025** | ₹2,09,143.00 | `Customer Credit List-20251130` | ₹2,09,143.00 | **₹0.00** | **100% Exact Match** *(1-Month Shift)* |
| **11** | **Nov Grass 2025** | ₹3,32,917.00 | `Customer Credit List-20251231` | ₹3,32,917.00 | **₹0.00** | **100% Exact Match** *(Nov Bills Applied)* |
| **12** | **Dec Grass 2025** | ₹4,82,733.00 | `DONOT USED 20251231` | ₹4,82,733.00 | **₹0.00** | **100% Exact Match** *(True Dec List)* |
| **13** | **Jan 2026 Grass** | ₹7,74,740.00 | `Customer Credit List-20260131` | ₹7,74,740.00 | **₹0.00** | **100% Exact Match** *(Direct Re-alignment)* |
| **14** | **Feb 2026 Grass** | ₹5,35,849.00 | `Customer Credit List-20260228` | ₹5,35,841.00 | ₹8.00 | **Exact Match** |
| **15** | **March 2026 Grass**| ₹5,00,190.00 | `Customer Credit List-20260331` | ₹5,00,190.00 | **₹0.00** | **100% Exact Match** |
| **16** | **April 2026 Grass**| ₹2,92,124.00 | `Customer Credit List-20260430` | ₹2,92,124.00 | **₹0.00** | **100% Exact Match** |
| **17** | **May 2026 Grass**  | ₹6,25,840.00 | `Customer Credit List-20260531` | ₹6,25,665.00 | ₹175.00 | **Exact Match** |
| **18** | **Jun 2026 Grass**  | ₹3,40,423.00 | `Customer Credit List-20260630` | ₹3,40,423.00 | **₹0.00** | **100% Exact Match** |
| **19** | **July 2026 Grass** | ₹7,04,744.00 | `Customer Credit List-20260731` | ₹7,04,744.00 | **₹0.00** | **100% Exact Match** |
| **20** | **Aug 2026 Grass**  | ₹5,87,158.00 | `Customer Credit List (Aug Master)` | ₹5,87,120.00 | ₹38.00 | **Exact Match** |

---

## 3. The Three Payment Scenarios

Using the synchronized 21-month timeline sequence, customer payments are categorized into three distinct reconciliation scenarios:

### Scenario 1: Explicit Direct Payments (`Credit2 + Credit3`)
- **Definition**: Payments explicitly recorded in columns `Credit2` and `Credit3` (and discounts in `Kasar`) of the customer credit list for month $M$.
- **Generated File**: `drafts/scenario_1_explicit_payments.csv`
- **Total Records**: **416 rows**
- **Total Amount**: **₹49,35,408.00**

### Scenario 2: Clearance Payments ($M-1$ Customer Missing in Month $M$)
- **Definition**: A customer had a positive closing balance $\text{Closing Dues}_{M-1} > 0$ at the end of Month $M-1$, but does not appear in the Month $M$ credit list. This indicates full payment/clearance between the two monthly cycles.
- **Generated File**: `drafts/scenario_2_clearance_payments.csv`
- **Total Records**: **307 rows**
- **Total Amount**: **₹33,74,706.00**

### Scenario 3: Rollover Difference Payments (Opening $M \neq$ Closing $M-1$)
- **Definition**: A customer appears in both Month $M-1$ and Month $M$, but their net opening balance in Month $M$ ($\text{Prv. Debt}_M - \text{Prv. Credit}_M$) does not match their closing balance in Month $M-1$ ($\text{Closing Dues}_{M-1}$):
  $$\text{Payment / Adjustment} = \text{Closing Dues}_{M-1} - (\text{Prv. Debt}_M - \text{Prv. Credit}_M)$$
- **Generated Files**:
  - `drafts/scenario_3_rollover_difference_payments.csv` (All 83 rows, net ₹4,57,758.00)
  - `drafts/scenario_3_positive_payments_only.csv` (**63 rows**, Total = **₹7,05,913.00**)
  - `drafts/scenario_3_negative_adjustments.csv` (**20 rows**, Total = **₹-2,48,155.00**)

---

## 4. Summary of Output Draft Files

| File Name | Description | Rows | Total Amount |
| :--- | :--- | :-: | :--- |
| `drafts/scenario_1_explicit_payments.csv` | Direct payments from `Credit2+3` across all 20 monthly lists | 416 | ₹49,35,408.00 |
| `drafts/scenario_2_clearance_payments.csv` | Off-sheet clearance payments when customer is dropped in month $M$ | 307 | ₹33,74,706.00 |
| `drafts/scenario_3_positive_payments_only.csv` | Unrecorded cash payments reducing customer debt between sheet rollovers | 63 | ₹7,05,913.00 |
| `drafts/scenario_3_negative_adjustments.csv` | Upward adjustments / debt additions during rollover | 20 | ₹-2,48,155.00 |
