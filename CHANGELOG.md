# react-m3-mobile-skeleton

## 0.2.0

### Minor Changes

- 9032a11: feat: implement annual backup protection, status tracking, warning banners, and mandatory field styling

  - Require annual backup for previous year (`currentYear - 1`) before logging new current-year transactions
  - Permit backdated entries for previous years at all times
  - Add warning banners on Dashboard and all add/activity forms (`SaleForm`, `ServiceForm`, `PurchaseForm`, `ExpenseForm`, `LedgerPaymentForm`)
  - Integrate Firestore `metadata/backup_status` document tracking
  - Standardize all collection and subcollection names to lowercase (`customers`, `transactions`, `purchases`, `transactions-{year}`, `purchases-{year}`)
  - Add mandatory field indicators (red `*`) across all input, textfield, and select components
  - Clean up quick-access buttons from dashboard
