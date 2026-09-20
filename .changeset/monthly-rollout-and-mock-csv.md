---
'react-m3-mobile-skeleton': minor
---

feat: implement monthly rollout accounting, full CSV-based Mock sandbox & Google Drive backup/restore system

- **Monthly Rollout & Trading Period Accounting**:
  - Finalize closed trading period markers, closing stock accounting, cumulative net P&L tracking, and transaction unlock validations.
  - Integrated rollout history breakdown view in Settings with opening stock, purchases, sales, gross commission, Daalu income, expenses, and balance sheet reconciliation.
- **Mock Sandbox Environment Overhaul**:
  - Sourced 100% directly from bundled CSV datasets (`customers.csv`, `sales.csv`, `payments.csv`, `services.csv`, `purchases.csv`, `expenses.csv`).
  - Simplified interface into strictly 2 actions: **Sync DB** and **Reset**.
  - Added offline mock banner with auto-refresh and sandbox detection across all repositories and query layers.
- **Google Drive Backup & Restore**:
  - Targeted Google Drive folder (`1hG506Zm9k2A2HWqRjzP60F0Sg5ZtXp4e`) for complete CSV backups and database recovery.
  - Streamlined UI to strictly 2 actions: **Backup** and **Restore**.
  - Added CLI automation scripts: `npm run drive:backup` and `npm run drive:restore`.
- **Profile & Settings UI Redesign**:
  - Separated Theme and Font settings into dedicated sections at the top of Profile settings.
  - High-contrast M3 toggle switches with distinct visual indicators and state badges for Dark Mode and Mock Sandbox.
- **Period Filter Bar Fixes**:
  - Refined month switching behavior from YTD: clicking the month button immediately reactivates Month mode without opening the select menu popup.
