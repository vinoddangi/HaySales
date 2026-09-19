# HaySales — React Material Design 3 Business & Farm Management App

A modern, mobile-first business and farm commerce management application built with **React 19**, **Vite 6**, **Tailwind CSS**, **Material Design 3 (M3)** design system, **Redux Toolkit (RTK)**, **Firebase Firestore**, and **React Router v7**.

---

## 📱 Features

- **⚡ Modern Technology Stack**:
  - **React 19** + **Vite 6** + **TypeScript 5.7+**
  - **Redux Toolkit & RTK Query** for reactive data fetching, automatic caching, and optimistic updates.
  - **Firebase Firestore** backend database for customer ledgers, sales, purchases, expenses, and archives.
- **🎨 Material Design 3 (M3) System**:
  - Full M3 design token palette (*Primary, Secondary, Tertiary, Surface containers 1–5, Outlines, Error states*).
  - Instantaneous Light & Dark mode synchronization.
- **🌾 Farm & Agro Commerce Workflows**:
  - **Dashboard**: Real-time sales, collections, cash/credit settlement split, stock analytics, and monthly/YTD performance filtering.
  - **Sales & Services**: Record grain/hay crop sales (Chana, Gavatri, Kutty, Tuvar, etc.) or custom vehicle/transport services.
  - **Farm Purchases & Expenses**: Manage stock procurement with weight & buying rate tracking, plus operational expense tracking.
  - **Customer Ledgers**: Interactive customer account ledger list, credit limit enforcement, running balances, and payment recording drawer.
  - **Activity Log**: Chronological timeline of all sales, payments, purchases, and farm expenses with category tabs and search.
- **🔒 Annual Backup Protection & Status Tracking**:
  - Automatically checks Firestore `metadata/backup_status` to ensure previous year data (`currentYear - 1`) has been backed up.
  - Displays dynamic warning banners on the dashboard and form interfaces when current-year dates are selected before backup completion.
  - Allows backdated previous-year entries at all times.
  - Single-click **Annual Backup & Rollover** in Profile archives records into `customers/{id}/transactions-{year}` and `purchases-{year}`, and rolls balances forward into opening balances.
- **📦 Automated Versioning & Releases (Changesets)**:
  - Automated versioning, changelog generation, and direct pushes to `main` via GitHub Actions and `@changesets/cli`.

---

## 📂 Project Structure

```
HaySales/
├── .changeset/                               # Changeset versioning configuration
├── .github/
│   └── workflows/
│       ├── ci.yml                            # Quality checks (typecheck, lint, vitest, build)
│       ├── release.yml                       # Auto-versioning & direct commit to main
│       └── firebase-hosting-merge.yml        # Deploy to live on main merge
├── script/
│   ├── backupToGoogleSheets.js               # Export Firestore data to Google Sheets
│   ├── cleanAllRecords.js                    # Deep clean Firestore database & metadata
│   ├── mergeCustomersFromSheets.js           # Merge & sync customers from Google Sheets
│   └── migrateFromSheets.js                  # Initial migration from Google Sheets
├── src/
│   ├── api/                                  # Pure Firebase API modules
│   │   ├── backup.api.ts                     # Backup status & annual archival
│   │   ├── customers.api.ts                  # Customer document operations
│   │   ├── purchases.api.ts                  # Purchases & farm expenses
│   │   └── transactions.api.ts               # Transactions collectionGroup & customer subcollections
│   ├── business/                             # Pure business domain calculations
│   │   ├── dashboardBusiness.ts              # Financial metrics & stock aggregation
│   │   ├── ledgerBusiness.ts                 # Balance & dues calculations
│   │   ├── purchasesBusiness.ts              # Stock weight & average rates
│   │   └── salesBusiness.ts                  # Sale totals & cash/credit split
│   ├── components/
│   │   ├── common/                           # M3 Reusable UI Components
│   │   └── layout/                           # Layout primitives (Flex, Grid)
│   ├── pages/                                # Route Views
│   │   ├── Activity/
│   │   ├── Customer/
│   │   ├── Home/
│   │   ├── Ledger/
│   │   ├── Profile/
│   │   ├── Purchases/
│   │   └── Sales/
│   ├── store/                                # Redux Toolkit State & RTK Query
│   │   └── slices/
│   │       ├── customersApi.ts               # RTK Query endpoints & tags
│   │       ├── itemsSlice.ts
│   │       ├── themeSlice.ts
│   │       └── uiSlice.ts
│   └── utils/
├── package.json
└── vite.config.ts
```

---

## 🛠️ Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```

### 3. Run Automated Tests & Quality Checks
```bash
# Run Vitest test suite
npm run test:run

# TypeScript typecheck
npm run typecheck

# ESLint & Prettier
npm run lint
npm run format:check
```

---

## 📦 Versioning & Changesets Workflow

When making changes that warrant a version bump:

```bash
# 1. Create a changeset file describing your changes
npx changeset

# 2. Commit your code along with the generated .changeset/*.md file
git add .
git commit -m "feat: your feature description"
git push origin your-branch
```

When merged into `main`, GitHub Actions will automatically bump the package version and update `CHANGELOG.md` directly on `main`.

---

## 📄 License

MIT
