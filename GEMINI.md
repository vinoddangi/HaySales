# HaySales Project Agent Rules & Guidelines

## 1. Operating Instructions & Workflow

- **Strictly Follow Instructions**: Never create pages (`src/pages/*`), features, or routes proactively without explicit user instructions. Wait for explicit commands before adding anything new.
- **Reference `create-modal` Branch ONLY**: Always inspect and check the `create-modal` branch (via `git show create-modal:<path>` or `git ls-tree create-modal`) as the single source of truth for reference. Never invent synthetic features, extra cards, or unsolicited options not present in `create-modal`. Always check what `create-modal` actually had before building.
- **Zero Backward-Compatibility Aliases**: Never introduce synthetic alias exports, type aliases, or shim wrapper functions for backward compatibility (e.g., `export const parseOptionalNumber = parseNumber;`). Always fix or update the original syntax directly at call sites.
- **No Unsolicited Assumptions**: Do not interpret or add extra boilerplate beyond what the user asked. Keep changes atomic, focused, and verified.
- **Verification**: Always run `npm run build` or type checks to verify clean code after modifications.

---

## 2. Component Architecture & Modularity

- **Material Design 3 (M3) is Highest Priority**: Use Google Material Design 3 Web Components (`@material/web`) and tokens (`var(--md-sys-...)`) as first-class citizens.
- **Pure Small Building Blocks Only Directly in `src/components/`**: All reusable components live directly in `src/components/` without subfolders (NO `common/`, `layout/`, `material/`, `navigation/`, `feedback/`, `cards/`).
- **No Domain Card Subfolders**: Do NOT create domain-specific card subfolders or one-off card files (e.g., NO `src/components/dashboard/cards/` or `src/pages/profile/cards/`).
- **Card Component Handles Card Use Cases**: The composable `<Card>` component (with its prespecified structure `Card.Header`, `Card.Content`, `Card.Actions`, `Card.Divider`) must handle card layouts directly inside the page or feature component. Avoid creating separate file wrappers for individual cards.
- **Zero Monolithic Files**: Keep files clean and single-purpose without mixing unrelated concerns.

---

## 3. UI & Styling Architecture

- **Material Design 3**: Wrap Google Material Design 3 Web Components (`@material/web`) in React components.
- **Strict Companion .css & Token Architecture (MANDATORY)**:
  - **Companion .css Files for ALL Components**: Every component must have its own companion `.css` file (e.g., `TopAppBar.css`, `BottomNavBar.css`, `Card.css`).
  - **Tokens in .css Files**: All styling properties (colors, shapes, radii, spacing, elevations) must be defined in the companion `.css` file using M3 CSS tokens (`var(--md-sys-...)`).
  - **No Utility Chains in JSX**: NEVER write long inline Tailwind utility chains directly in JSX (e.g., NEVER write `className="flex-1 bg-transparent text-sm text-surface-foreground placeholder:text-outline focus:outline-none"`). Instead, create an explicit, semantic class in the companion `.css` file using tokens (e.g., `.top-app-bar__search-input`) and use that class name in JSX.
  - **Zero Arbitrary Values**: Absolutely NO arbitrary hardcoded pixel or hex values anywhere (NEVER use `p-[16px]`, `bg-[#006c4c]`, `rounded-[16px]`).
  - **Conditional Classes**: Use `clsx` (and `tailwind-merge` where merging Tailwind utilities) to conditionally compose classes on components.
- **Reference Over Copying**: When rebuilding features or components from reference code, do NOT copy old legacy code directly. Use it only as a behavioral reference and implement from scratch according to these strict modularity and styling guidelines.

---

## 4. Business & Accounting Constraints

- **Strict Single Weight Unit**: Kilograms (**Kg**) ONLY.
  - Absolutely NO conversions to or mentions of Quintals, Tons, Maunds, etc. All weights in inputs, calculations, database records, and UI displays must be in **Kg**.
- **Currency**: **₹ / Kg** (Rupees per Kilogram).
- **Single Financial Field (`amount`)**: `amount` is the only monetary value property for all transactions (including `PAYMENT`). There is NO `paymentAmount` field.
- **Derived Rate (`getRate`)**: `rate` is never stored in the database. Rate is dynamically derived on the fly via `getRate(tx)` as $\text{amount} / \text{weight}$ in ₹/Kg strictly for crop transactions, returning `number | undefined`.
- **Accounting Invariant**: Strict double-entry balance identity must always hold:
  $$\text{Total Assets} = \text{Total Liabilities \& Capital}$$
- **Data Integrity**: Customer and supplier ledger entries must be verifiable and consistent.

---

## 5. Tech Stack Reference

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (bound to M3 CSS tokens) + Companion Component `.css` files
- **State Management**: Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- **Routing**: React Router (`react-router-dom`)
- **Components**: Google Material Design 3 Web Components (`@material/web`)
- **Class Utilities**: `clsx`, `tailwind-merge`
- **Icons**: `lucide-react`
