# HaySales Project Agent Rules & Guidelines

Please refer to [GEMINI.md](./GEMINI.md) for the full guidelines.

## Key Rules Summary:

1. **Never create pages (`src/pages/*`) or features proactively**: Wait for explicit user commands.
2. **Material Design 3 (M3) is Highest Priority**: Use `@material/web` components and M3 tokens (`var(--md-sys-...)`) as first-class building blocks.
3. **Reference `create-modal` Branch ONLY**: Always inspect and check the `create-modal` branch (`git show create-modal:<path>`) as the reference. Do not invent synthetic features, cards, or mock options not present in `create-modal`.
4. **Dedicated Subfolders for Components & Views**:
   - Reusable building blocks live in `src/components/<ComponentName>/` with companion `.css`, `use<ComponentName>.ts`, and `index.ts`.
   - Layout primitives live in `src/components/layouts/` (`Flex/`, `Grid/`).
   - Multi-part views live in `src/views/<ViewName>/`.
5. **Modular Page & Section Views (`src/pages/<PageName>/components/`)**: Decompose each distinct card or section in a page into its own individual view/component file under that page's `components/` subfolder (e.g., `HeroBannerCard.tsx`, `MetricsGrid.tsx`, `QuickActionsCard.tsx`, `CustomerDuesCard.tsx`, `AvailableLotsCard.tsx`), keeping the main page file clean and modular.
6. **Logic in Custom Hooks**: All JavaScript/business logic, state management, event listeners, and API/Redux hooks must reside in custom hooks (`use<Component>.ts`). `.tsx` files must remain strictly presentational.
7. **Layout Primitives over Raw Divs**: Always use `<Flex>`, `<Flex.Item>` / `<FlexItem>`, `<Grid>`, and `<Grid.Item>` / `<GridItem>` driven by props rather than raw divs with inline utility layout chains.
8. **M3 CSS Tokens + Companion .css Files for Components**: Components must have dedicated companion `.css` files using tokens (`var(--md-sys-...)`). Never write long inline Tailwind utility chains in JSX; create semantic classes in the `.css` file instead. Zero arbitrary values (no `p-[16px]`).
9. **Weight Property & Unit**: Kilograms (**Kg**) ONLY. The property name across all schemas, metrics, and models is strictly **`weight`** (never `weightKg`). No Quintals, Tons, etc.
10. **Currency**: **₹ / Kg** only.
11. **Double-entry Balance**: $\text{Total Assets} = \text{Total Liabilities \& Capital}$.
12. **Zero Backward-Compatibility Aliases**: Never introduce synthetic alias exports, type aliases, or shim wrapper functions for backward compatibility. Fix the original syntax directly at call sites.
13. **Single Financial Field (`amount`)**: `amount` is the only monetary value property for all transactions (including `PAYMENT`). There is NO `paymentAmount` field.
14. **Derived Rate (`getRate`)**: `rate` is never stored in the database. Rate is dynamically derived on the fly via `getRate(tx)` as $\text{amount} / \text{weight}$ in ₹/Kg strictly for crop transactions, returning `number | undefined`.
