# HaySales UI Component Guide

> How to build screens correctly using the HaySales component library, M3 design tokens, and Tailwind.

---

## Table of Contents

1. [Core Principles](#1-core-principles)
2. [Token Reference](#2-token-reference)
3. [Typography — `<Text>`](#3-typography--text)
4. [Layout Primitives — `<Flex>` & `<Grid>`](#4-layout-primitives--flex--grid)
5. [Card System](#5-card-system)
6. [Composite Components](#6-composite-components)
7. [Form Components](#7-form-components)
8. [Feedback & Overlay](#8-feedback--overlay)
9. [Navigation Components](#9-navigation-components)
10. [Sentiment System](#10-sentiment-system)
11. [New Component Recipes](#11-new-component-recipes)
12. [Do / Don't Cheat Sheet](#12-do--dont-cheat-sheet)
13. [Building a Complete Screen](#13-building-a-complete-screen)

---

## 1. Core Principles

| Rule | Why |
|------|-----|
| **`<Text>` for all copy** | Keeps typescale consistent; never write raw `<span>`, `<p>`, `<div>` with font rules |
| **`<Flex>` / `<Grid>` for layout** | No raw `div` with inline flex/grid; use layout primitives with props |
| **M3 tokens in `.css` files** | All colors, spacing, shape, shadow come from `var(--md-sys-*)` tokens |
| **Zero arbitrary values** | Never `p-[16px]`, `bg-[#006c4c]`, `rounded-[12px]` |
| **Logic in `use*.ts` hooks** | `.tsx` is 100% presentational — no state, no event wiring, no Redux calls |
| **Sentiments, not custom colors** | Use `sentiment` props on `<Text>`, `<Badge>`, `<Card>`, `<StatCard>` |
| **No backward-compat aliases** | Fix call sites directly; never add shim re-exports |

---

## 2. Token Reference

All tokens are defined in `src/index.css` and auto-apply in dark mode via `.dark` class.

### Color Tokens

```css
/* Primary (agriculture green) */
var(--md-sys-color-primary)               /* #006c4c */
var(--md-sys-color-on-primary)
var(--md-sys-color-primary-container)     /* #89f8c7 */
var(--md-sys-color-on-primary-container)

/* Secondary */
var(--md-sys-color-secondary)
var(--md-sys-color-secondary-container)
var(--md-sys-color-on-secondary-container)

/* Tertiary (info / blue-grey) */
var(--md-sys-color-tertiary)
var(--md-sys-color-tertiary-container)
var(--md-sys-color-on-tertiary-container)

/* Error (negative) */
var(--md-sys-color-error)                 /* #ba1a1a */
var(--md-sys-color-error-container)       /* #ffdad6 */
var(--md-sys-color-on-error-container)

/* Warning */
var(--md-sys-color-warning)              /* #e28704 */
var(--md-sys-color-warning-container)
var(--md-sys-color-on-warning-container)

/* Surface scale (lowest → highest elevation) */
var(--md-sys-color-surface)
var(--md-sys-color-surface-container-lowest)
var(--md-sys-color-surface-container-low)
var(--md-sys-color-surface-container)
var(--md-sys-color-surface-container-high)
var(--md-sys-color-surface-container-highest)

/* On-surface */
var(--md-sys-color-on-surface)
var(--md-sys-color-on-surface-variant)
var(--md-sys-color-outline)
var(--md-sys-color-outline-variant)
```

### Shape Tokens

```css
var(--md-sys-shape-corner-none)          /* 0px   */
var(--md-sys-shape-corner-extra-small)   /* 4px   */
var(--md-sys-shape-corner-small)         /* 8px   */
var(--md-sys-shape-corner-medium)        /* 12px  */
var(--md-sys-shape-corner-large)         /* 16px  */
var(--md-sys-shape-corner-extra-large)   /* 28px  */
var(--md-sys-shape-corner-full)          /* 9999px */
```

### Spacing Tokens

```css
var(--md-sys-spacing-extra-small)   /* 4px  */
var(--md-sys-spacing-small)         /* 8px  */
var(--md-sys-spacing-medium)        /* 12px */
var(--md-sys-spacing-large)         /* 16px */
var(--md-sys-spacing-extra-large)   /* 24px */
var(--md-sys-spacing-huge)          /* 32px */
```

### Typescale Tokens

```css
/* Font sizes */
var(--md-sys-typescale-display-large-size)      /* 3.5rem */
var(--md-sys-typescale-headline-large-size)     /* 2rem   */
var(--md-sys-typescale-title-large-size)        /* 1.375rem */
var(--md-sys-typescale-title-medium-size)       /* 1.125rem */
var(--md-sys-typescale-body-large-size)         /* 1rem   */
var(--md-sys-typescale-body-medium-size)        /* 0.875rem */
var(--md-sys-typescale-label-medium-size)       /* 0.75rem */
var(--md-sys-typescale-caption-size)            /* 0.625rem */

/* Font weights */
var(--md-sys-typescale-headline-large-weight)   /* 700 */
var(--md-sys-typescale-title-large-weight)      /* 600 */
var(--md-sys-typescale-body-medium-weight)      /* 400 */
var(--md-sys-typescale-label-medium-weight)     /* 600 */
```

### Tailwind Token Aliases

The Tailwind config bridges M3 tokens as utilities:

```tsx
// Colors
className="text-primary"                  // var(--md-sys-color-primary)
className="bg-error-container"            // var(--md-sys-color-error-container)
className="text-surface-foreground"       // var(--md-sys-color-on-surface)
className="border-outline-variant"        // var(--md-sys-color-outline-variant)

// Border radius
className="rounded-sm"    // var(--md-sys-shape-corner-small)
className="rounded-lg"    // var(--md-sys-shape-corner-large)
className="rounded-full"  // var(--md-sys-shape-corner-full)

// Spacing
className="p-m3-lg"    // var(--md-sys-spacing-large) = 16px
className="gap-m3-sm"  // var(--md-sys-spacing-small) = 8px
```

---

## 3. Typography — `<Text>`

**Always use `<Text>` for every piece of copy.** Never use raw HTML tags with manual font styles.

### Import

```tsx
import { Text } from '@/components';
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `variant` | `TextVariant` | M3 typescale role (see below) |
| `sentiment` | `'positive' \| 'negative' \| 'warning' \| 'info' \| 'accent' \| 'neutral'` | Overrides color |
| `appearance` | `'primary' \| 'secondary' \| 'disabled'` | Semantic color level |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | Font weight override |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment |
| `uppercase` | `boolean` | Adds letter-spacing + uppercase |
| `truncate` | `boolean` | Single-line ellipsis |
| `as` | HTML tag | `'span'`, `'p'`, `'h1'`–`'h4'`, `'div'`, etc. |

### Variant Reference

```tsx
// Display — large numbers, hero screens
<Text variant="display-lg">₹12,45,000</Text>
<Text variant="display-md">Dashboard</Text>
<Text variant="display-sm">Report</Text>

// Headline — page/section titles
<Text as="h1" variant="headline-lg">Sales Overview</Text>
<Text as="h2" variant="headline-md">This Month</Text>
<Text as="h3" variant="headline-sm">Customer Dues</Text>

// Title — card headers, list section headers
<Text variant="title-lg">Ramesh Kumar</Text>
<Text variant="title-md">Total Sales</Text>
<Text variant="title-sm">Lot #42</Text>

// Body — paragraphs, descriptions, list items
<Text variant="body-lg">Full description text here.</Text>
<Text variant="body-md">Supporting detail.</Text>
<Text variant="body-sm">Fine print or supporting text.</Text>

// Label — tags, chips, overlines, form labels
<Text variant="label-lg">Category</Text>
<Text variant="label-md">Weight (Kg)</Text>
<Text variant="label-sm">STATUS</Text>   {/* auto uppercase + tracking */}

// Specialized
<Text variant="caption">Updated 2 mins ago</Text>
<Text variant="amount">₹ 1,24,500</Text>   {/* tabular nums, bold */}
```

### Sentiment & Appearance

```tsx
// Appearance — controls on-surface color level
<Text appearance="primary">Main content</Text>          // on-surface
<Text appearance="secondary">Supporting text</Text>     // on-surface-variant
<Text appearance="disabled">Not available</Text>        // outline

// Sentiment — semantic color override (replaces appearance)
<Text sentiment="positive">Payment received</Text>      // primary (green)
<Text sentiment="negative">Overdue</Text>               // error (red)
<Text sentiment="warning">Partially paid</Text>         // warning (amber)
<Text sentiment="info">Scheduled</Text>                 // tertiary (blue-grey)
<Text sentiment="accent">New</Text>                     // secondary
<Text sentiment="neutral">No change</Text>              // on-surface

// Combined modifiers
<Text variant="amount" sentiment="negative" as="p">₹ -38,200</Text>
<Text variant="label-sm" weight="bold" uppercase>Due Date</Text>
<Text variant="body-md" appearance="secondary" truncate>Long name that will truncate…</Text>
```

---

## 4. Layout Primitives — `<Flex>` & `<Grid>`

Never use raw `<div>` with `className="flex gap-2 items-center"`. Use `<Flex>` and `<Grid>` with props.

### Import

```tsx
import { Flex, Grid } from '@/components';
```

### Flex

```tsx
// Row with gap and alignment
<Flex gap="sm" align="center" justify="between">
  <Text variant="title-md">Sales</Text>
  <Badge sentiment="positive">Live</Badge>
</Flex>

// Column layout
<Flex direction="column" gap="md" padding="lg">
  <Text variant="headline-sm">Summary</Text>
  <Text variant="body-md" appearance="secondary">Details here.</Text>
</Flex>

// Full-width scrollable row
<Flex gap="sm" scrollable="x" fullWidth>
  {chips}
</Flex>

// Flex.Item for grow/shrink control
<Flex gap="md" align="center">
  <Flex.Item grow>
    <Text variant="body-lg" truncate>Customer Name</Text>
  </Flex.Item>
  <Flex.Item shrink={false}>
    <Text variant="amount">₹ 12,000</Text>
  </Flex.Item>
</Flex>
```

**Flex Props:**

| Prop | Values | Default |
|------|--------|---------|
| `direction` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `'row'` |
| `align` | `'start' \| 'center' \| 'end' \| 'baseline' \| 'stretch'` | — |
| `justify` | `'start' \| 'center' \| 'end' \| 'between' \| 'around' \| 'evenly'` | — |
| `gap` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | — |
| `wrap` | `boolean` | `false` |
| `padding` | spacing scale | — |
| `fullWidth` | `boolean` | `false` |
| `scrollable` | `'x' \| 'y' \| 'both'` | — |
| `as` | any HTML tag | `'div'` |

### Grid

```tsx
// 2-column KPI grid
<Grid columns={2} gap="sm" fullWidth>
  <StatCard value="₹1.2L" label="Sales" sentiment="positive" />
  <StatCard value="₹38K" label="Dues" sentiment="negative" />
</Grid>

// 3-column with responsive breakpoints
<Grid columns={1} smColumns={2} mdColumns={3} gap="md">
  {lots.map(lot => <LotCard key={lot.id} {...lot} />)}
</Grid>

// Grid.Item spanning multiple columns
<Grid columns={6} gap="sm">
  <Grid.Item colSpan={4}>
    <MainSection />
  </Grid.Item>
  <Grid.Item colSpan={2}>
    <Sidebar />
  </Grid.Item>
</Grid>
```

**Grid Props:**

| Prop | Values |
|------|--------|
| `columns` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 12` |
| `smColumns` | same (responsive breakpoint) |
| `mdColumns` | same (responsive breakpoint) |
| `gap / rowGap / columnGap` | spacing scale |
| `colSpan` (Item) | `1–12 \| 'full'` |
| `rowSpan` (Item) | `1–6 \| 'full'` |

---

## 5. Card System

`Card` is a compound component. Use sub-components to build structured surfaces.

### Import

```tsx
import { Card } from '@/components';
```

### Variants

```tsx
// outlined — default, border + surface bg
<Card variant="outlined">…</Card>

// filled — surface-container bg, no border
<Card variant="filled">…</Card>

// elevated — surface-container-low + md-elevation shadow
<Card variant="elevated">…</Card>

// tonal — secondary-container tint
<Card variant="tonal">…</Card>
```

### Sentiment Tinting

Combine `sentiment` with any variant to tint the card background and border:

```tsx
<Card sentiment="negative">…</Card>  // error-container bg + error border
<Card sentiment="positive">…</Card>  // primary-container bg + primary border
<Card sentiment="warning">…</Card>   // warning-container bg + warning border
<Card sentiment="info">…</Card>      // tertiary-container bg + tertiary border
<Card sentiment="primary">…</Card>   // primary-container bg + primary border
```

### Shape & Padding

```tsx
<Card corner="lg" padding="md">…</Card>
// corner: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
// padding: 'none' | 'sm' | 'md' | 'lg'
```

### Card.Header

```tsx
<Card.Header
  title="Sales Summary"            // string → auto-styled with title-md
  subtitle="October 2026"          // string → auto-styled with body-sm secondary
  icon={<TrendingUp size={18} />}  // left icon
  avatar={<Avatar name="Ramesh" />}// OR left avatar (takes precedence over icon)
  action={<Button variant="text">View All</Button>}  // right slot
/>
```

### Card.Content

```tsx
<Card.Content>
  <Text variant="body-md">Any content here.</Text>
</Card.Content>

<Card.Content noPadding>
  {/* Content that bleeds edge-to-edge */}
</Card.Content>
```

### Card.Actions

```tsx
<Card.Actions align="end">
  <Button variant="text">Cancel</Button>
  <Button variant="filled">Save</Button>
</Card.Actions>

// align: 'start' | 'center' | 'end' | 'between'
```

### Card.Metric

Pre-built KPI structure — icon + value + label + optional trend:

```tsx
<Card.Metric
  icon={<Wheat size={16} />}
  value="2,400 Kg"
  label="Available Stock"
  subtitle="Last updated: today"
  trend={{ value: '+120 Kg', direction: 'up', label: 'vs yesterday' }}
/>

// align: 'left' | 'center' | 'right'
// trend.direction: 'up' (positive color) | 'down' (error color) | 'neutral'
```

### Card.SubCard

Nested pill-style container with sentiment tinting:

```tsx
<Card.SubCard title="HAP" value="2,400 Kg" sentiment="positive" />
<Card.SubCard title="Wheat" value="1,100 Kg" sentiment="warning" />
<Card.SubCard title="Overdue" value="3" sentiment="negative" />
<Card.SubCard title="Scheduled" sentiment="info">
  <Text variant="caption">Next: Nov 1</Text>
</Card.SubCard>

// sentiment: 'neutral' | 'positive' | 'negative' | 'warning' | 'info'
```

### Card.Row

Key-value row for summaries and ledger lines:

```tsx
<Card.Row label="Rate" value="₹ 22/Kg" />
<Card.Row label="Weight" value="2,400 Kg" icon={<Scale size={14} />} />
<Card.Row label="Total" value="₹ 52,800" bold />
<Card.Row label="Customer" value="Ramesh Kumar" onClick={() => navigate('/customer/1')} />
```

### Card.ActionItem

Full-width tappable action button:

```tsx
<Card.ActionItem
  icon={<Plus size={16} />}
  label="Add Sale"
  onClick={handleAddSale}
/>
```

### Card.Divider

```tsx
<Card.Divider />
```

### Full Card Example

```tsx
<Card variant="outlined" corner="lg">
  <Card.Header
    title="Outstanding Dues"
    subtitle="3 customers"
    icon={<AlertCircle size={18} />}
    action={<Button variant="text" size="sm">View All</Button>}
  />
  <Card.Content>
    <Card.Row label="Ramesh Kumar" value="₹ 12,000" bold onClick={…} />
    <Card.Row label="Suresh Patel" value="₹ 8,500" bold onClick={…} />
    <Card.Divider />
    <Card.Row label="Total" value="₹ 20,500" bold />
  </Card.Content>
  <Card.Actions align="end">
    <Button variant="filled" size="sm">Collect Payment</Button>
  </Card.Actions>
</Card>
```

---

## 6. Composite Components

### `<StatCard>` — KPI Metric Card

```tsx
import { StatCard } from '@/components';

<StatCard
  icon={<TrendingUp size={20} />}
  value="₹ 1,24,500"
  label="Total Sales"
  subtitle="October 2026"
  sentiment="positive"
  trend={{ value: '+12%', direction: 'up', label: 'vs last month' }}
  variant="filled"
  onClick={() => navigate('/sales')}
/>

// sentiment: 'neutral' | 'positive' | 'negative' | 'warning' | 'info'
// variant: 'filled' | 'outlined' | 'elevated' | 'tonal'
```

Quick KPI grid:

```tsx
<Grid columns={2} gap="sm">
  <StatCard value="₹1.2L"  label="Sales"    sentiment="positive" icon={<TrendingUp />} />
  <StatCard value="₹38K"   label="Dues"     sentiment="negative" icon={<AlertCircle />} />
  <StatCard value="2,400"  label="Stock Kg" sentiment="info"     icon={<Package />} />
  <StatCard value="₹22/Kg" label="Avg Rate" sentiment="neutral"  icon={<BarChart2 />} />
</Grid>
```

### `<ListItem>` — M3 List Row

```tsx
import { ListItem } from '@/components';

<ListItem
  leading={<Avatar name="Ramesh Kumar" size="sm" />}
  headline="Ramesh Kumar"
  supporting="Last purchase: 2 days ago"
  trailing={<Badge sentiment="negative">₹12,000</Badge>}
  divider
  clickable
  onClick={() => navigate('/customer/1')}
/>

// size: 'compact' | 'default' | 'comfortable'
```

Building a list:

```tsx
<Card variant="outlined">
  <Card.Header title="Customers" />
  <Card.Content noPadding>
    {customers.map((c, i) => (
      <ListItem
        key={c.id}
        leading={<Avatar name={c.name} size="sm" />}
        headline={c.name}
        supporting={`₹ ${c.totalPurchases.toLocaleString('en-IN')}`}
        trailing={c.dueAmount > 0
          ? <Badge sentiment="negative">{formatAmount(c.dueAmount)}</Badge>
          : <Badge sentiment="positive">Cleared</Badge>
        }
        divider={i < customers.length - 1}
        clickable
        onClick={() => navigate(`/customer/${c.id}`)}
      />
    ))}
  </Card.Content>
</Card>
```

### `<SectionHeader>` — Section Title Row

```tsx
import { SectionHeader } from '@/components';

<SectionHeader title="Recent Sales" />

<SectionHeader
  title="Customer Dues"
  subtitle="3 pending"
  action={<Button variant="text" size="sm">View All</Button>}
/>

<SectionHeader
  title="Available Lots"
  subtitle="Tap to view details"
  spaceBelow
/>
```

### `<EmptyState>` — No Data Screen

```tsx
import { EmptyState } from '@/components';

<EmptyState
  icon={<ShoppingBag size={28} />}
  headline="No sales yet"
  body="Your sales will appear here once you add your first transaction."
  action={<Button variant="filled" onClick={handleAdd}>Add Sale</Button>}
  fill
/>

// fill: expands to take available vertical space (flex: 1)
```

### `<Divider>` — Separator

```tsx
import { Divider } from '@/components';

<Divider />                              // horizontal
<Divider inset />                        // horizontal with left+right margin
<Divider inset="start" />               // horizontal with left margin only
<Divider orientation="vertical" />      // vertical (align-self: stretch)
```

### `<SegmentedButton>` — Pill Toggle

```tsx
import { SegmentedButton } from '@/components';

const [period, setPeriod] = useState('week');

<SegmentedButton
  segments={[
    { value: 'day',   label: 'Day' },
    { value: 'week',  label: 'Week' },
    { value: 'month', label: 'Month' },
  ]}
  value={period}
  onChange={setPeriod}
/>

// With icons:
<SegmentedButton
  segments={[
    { value: 'list', label: 'List', icon: <List size={14} /> },
    { value: 'grid', label: 'Grid', icon: <Grid2X2 size={14} /> },
  ]}
  value={view}
  onChange={setView}
/>
```

---

## 7. Form Components

### `<Button>`

```tsx
import { Button } from '@/components';

// Variants
<Button variant="filled">Save</Button>
<Button variant="outlined">Cancel</Button>
<Button variant="text">Skip</Button>
<Button variant="elevated">Share</Button>
<Button variant="tonal">Secondary Action</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>   {/* default */}
<Button size="lg">Large</Button>

// With icons
<Button variant="filled" icon={<Plus size={16} />}>Add Sale</Button>
<Button variant="outlined" trailingIcon={<ChevronRight size={16} />}>Next</Button>

// States
<Button disabled>Disabled</Button>
<Button fullWidth variant="filled">Full Width</Button>
```

### `<TextField>`

```tsx
import { TextField } from '@/components';

<TextField label="Customer Name" value={name} onChange={setName} />

<TextField
  label="Weight (Kg)"
  type="number"
  variant="outlined"       // 'outlined' | 'filled'
  value={weight}
  onChange={setWeight}
  suffixText="Kg"
  supportingText="Enter weight in kilograms"
/>

<TextField
  label="Amount"
  prefixText="₹"
  error={!!error}
  errorText={error}
  value={amount}
  onChange={setAmount}
/>

// Multi-line
<TextField label="Notes" rows={4} value={notes} onChange={setNotes} />
```

### `<Select>`

```tsx
import { Select } from '@/components';

<Select
  label="Crop Type"
  value={crop}
  options={[
    { value: 'hap',    label: 'HAP' },
    { value: 'wheat',  label: 'Wheat' },
    { value: 'cotton', label: 'Cotton' },
  ]}
  onChange={setCrop}
  variant="outlined"   // 'outlined' | 'filled'
/>
```

### `<Checkbox>`

```tsx
import { Checkbox } from '@/components';

<Checkbox
  checked={isSelected}
  label="Include VAT"
  onChange={setIsSelected}
/>

<Checkbox indeterminate label="Select All" onChange={handleSelectAll} />
```

### `<Switch>`

```tsx
import { Switch } from '@/components';

<Switch
  selected={isDarkMode}
  label="Dark Mode"
  onChange={setIsDarkMode}
  icons
/>
```

---

## 8. Feedback & Overlay

### `<Badge>`

```tsx
import { Badge } from '@/components';

// Subtle (default) — container bg + colored border + colored text
<Badge sentiment="positive">Paid</Badge>
<Badge sentiment="negative">Overdue</Badge>
<Badge sentiment="warning">Partial</Badge>
<Badge sentiment="info">Scheduled</Badge>
<Badge sentiment="neutral">Draft</Badge>
<Badge sentiment="accent">New</Badge>

// Solid — filled colored bg
<Badge sentiment="negative" appearance="solid">Unpaid</Badge>
<Badge sentiment="positive" appearance="solid">Cleared</Badge>

// Sizes
<Badge size="sm">small</Badge>    {/* default */}
<Badge size="md">medium</Badge>

// Dot indicator (no children)
<Badge sentiment="negative" dot />
```

### `<Progress>`

```tsx
import { Progress } from '@/components';

<Progress />                                    // circular indeterminate
<Progress type="linear" />                     // linear indeterminate
<Progress type="circular" value={0.6} indeterminate={false} />  // 60%
<Progress type="linear"   value={0.4} indeterminate={false} />  // 40%
```

### `<Snackbar>`

Mount once at the app root. Trigger via the `useSnackbar` hook:

```tsx
// In app root layout:
import { Snackbar } from '@/components';
<Snackbar />

// In any component:
import { useSnackbar } from '@/components';
const { showSnackbar } = useSnackbar();
showSnackbar('Payment saved!', 'Undo');
```

### `<Dialog>`

```tsx
import { Dialog, Button } from '@/components';

<Dialog
  open={isOpen}
  onClose={() => setIsOpen(false)}
  headline="Delete Sale?"
  icon={<Trash2 size={20} />}
  actions={
    <>
      <Button variant="text" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="filled" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <Text variant="body-md">This action cannot be undone.</Text>
</Dialog>
```

### `<BottomSheet>`

```tsx
import { BottomSheet } from '@/components';

<BottomSheet open={isOpen} onClose={() => setIsOpen(false)}>
  <Text variant="title-md">Filter Options</Text>
  {/* content */}
</BottomSheet>
```

---

## 9. Navigation Components

### `<Tabs>`

```tsx
import { Tabs } from '@/components';

<Tabs
  type="primary"   // 'primary' | 'secondary'
  activeTabIndex={activeTab}
  onTabChange={(index, id) => setActiveTab(index)}
  tabs={[
    { id: 'sales',     label: 'Sales',     icon: <ShoppingCart size={18} /> },
    { id: 'purchases', label: 'Purchases', icon: <Package size={18} /> },
    { id: 'ledger',    label: 'Ledger',    icon: <BookOpen size={18} /> },
  ]}
/>
```

### `<Chip>` / `<ChipSet>`

```tsx
import { Chip, ChipSet } from '@/components';

// Filter chips (toggle)
<ChipSet>
  <Chip label="HAP"    variant="filter" selected={filter === 'hap'}    onClick={() => setFilter('hap')} />
  <Chip label="Wheat"  variant="filter" selected={filter === 'wheat'}  onClick={() => setFilter('wheat')} />
  <Chip label="Cotton" variant="filter" selected={filter === 'cotton'} onClick={() => setFilter('cotton')} />
</ChipSet>

// Assist chips (action shortcuts)
<Chip label="Call Customer" variant="assist" icon={<Phone size={14} />} onClick={handleCall} />

// Input chips (tag/token removal)
<Chip label="Ramesh Kumar" variant="input" removable onRemove={handleRemove} />
```

### `<Avatar>`

```tsx
import { Avatar } from '@/components';

<Avatar name="Ramesh Kumar" />              // initials: "R"
<Avatar name="Suresh" size="lg" />         // size: 'sm' | 'md' | 'lg'
<Avatar src="/profile.jpg" name="Vinod" /> // image with fallback
<Avatar name="Vinod" variant="rounded" />  // 'circular' | 'rounded'
<Avatar name="Admin" onClick={openProfile} />
```

### `<Fab>`

```tsx
import { Fab } from '@/components';

<Fab
  icon={<Plus size={24} />}
  label="New Sale"          // optional extended FAB label
  variant="primary"         // 'surface' | 'primary' | 'secondary' | 'tertiary'
  size="medium"             // 'small' | 'medium' | 'large'
  onClick={handleAdd}
/>
```

---

## 10. Sentiment System

The sentiment system is the single source of truth for color in the UI. Map every meaningful state to a sentiment, then let the component tokens do the work.

### Sentiment → Token Mapping

| Sentiment | Background Token | Foreground Token | When to Use |
|-----------|-----------------|-----------------|-------------|
| `positive` | `primary-container` | `on-primary-container` | Paid, cleared, in-stock, up-trend |
| `negative` | `error-container` | `on-error-container` | Overdue, unpaid, out-of-stock, loss |
| `warning` | `warning-container` | `on-warning-container` | Partial, pending, low-stock, attention |
| `info` | `tertiary-container` | `on-tertiary-container` | Scheduled, credit, neutral-info |
| `accent` | `secondary-container` | `on-secondary-container` | Highlight, new, featured |
| `neutral` | `surface-container` | `on-surface-variant` | Default, no emphasis |

### Using Sentiment Consistently

```tsx
// Text — foreground color only
<Text sentiment="negative">₹ 38,200 Overdue</Text>
<Text sentiment="positive" variant="amount">₹ 1,24,500</Text>

// Badge — background tint + border + foreground (subtle) or solid fill
<Badge sentiment="warning">Partial</Badge>
<Badge sentiment="negative" appearance="solid">UNPAID</Badge>

// Card — background tint + border on entire card surface
<Card sentiment="negative">
  <Card.Header title="Overdue Accounts" />
  <Card.Metric value="₹38,200" label="Total Outstanding" />
</Card>

// Card.SubCard — nested pill with same sentiment system
<Card.SubCard title="Credit Sales" value="₹45,000" sentiment="info" />
<Card.SubCard title="Cash Paid"   value="₹85,000" sentiment="positive" />

// StatCard — composite card + sentiment
<StatCard value="₹38,200" label="Outstanding" sentiment="negative" icon={<AlertCircle />} />
```

### Anti-Patterns ❌

```tsx
// ❌ Never use raw hex
<span style={{ color: '#e11d48' }}>Overdue</span>

// ❌ Never invent custom sentiments
<Badge sentiment="purple">…</Badge>

// ❌ Never write Tailwind hex or manual color classes
<div className="text-red-500 bg-red-100">Error</div>

// ❌ Never bypass <Text> for typography
<p style={{ fontSize: '0.75rem', fontWeight: 600 }}>Label</p>
```

---

## 11. New Component Recipes

### Transaction List Screen

```tsx
import { Card, ListItem, Badge, Text, EmptyState, SectionHeader, Divider } from '@/components';

function TransactionList({ transactions }) {
  if (!transactions.length) {
    return (
      <EmptyState
        icon={<Receipt size={28} />}
        headline="No transactions"
        body="Sales and purchases will appear here."
        fill
      />
    );
  }

  return (
    <Card variant="outlined">
      <SectionHeader
        title="Recent Transactions"
        subtitle={`${transactions.length} entries`}
        action={<Button variant="text" size="sm">Export</Button>}
      />
      <Divider />
      <Card.Content noPadding>
        {transactions.map((tx, i) => (
          <ListItem
            key={tx.id}
            headline={tx.customerName}
            supporting={tx.date}
            trailing={
              <Flex direction="column" align="end" gap="xs">
                <Text variant="amount" sentiment={tx.type === 'PAYMENT' ? 'positive' : 'neutral'}>
                  ₹ {tx.amount.toLocaleString('en-IN')}
                </Text>
                <Badge sentiment={tx.status === 'PAID' ? 'positive' : 'negative'} size="sm">
                  {tx.status}
                </Badge>
              </Flex>
            }
            divider={i < transactions.length - 1}
            clickable
            onClick={() => navigate(`/transaction/${tx.id}`)}
          />
        ))}
      </Card.Content>
    </Card>
  );
}
```

### KPI Dashboard Section

```tsx
import { Grid, StatCard, SectionHeader } from '@/components';

function DashboardMetrics({ metrics }) {
  return (
    <>
      <SectionHeader title="Today's Overview" subtitle="Live data" />
      <Grid columns={2} gap="sm" padding="sm">
        <StatCard
          icon={<TrendingUp size={20} />}
          value={`₹ ${metrics.sales.toLocaleString('en-IN')}`}
          label="Total Sales"
          sentiment="positive"
          trend={{ value: '+12%', direction: 'up', label: 'vs yesterday' }}
          onClick={() => navigate('/sales')}
        />
        <StatCard
          icon={<AlertCircle size={20} />}
          value={`₹ ${metrics.dues.toLocaleString('en-IN')}`}
          label="Dues"
          sentiment="negative"
          trend={{ value: `${metrics.dueCount} customers`, direction: 'neutral' }}
          onClick={() => navigate('/ledger')}
        />
        <StatCard
          icon={<Package size={20} />}
          value={`${metrics.stock.toLocaleString('en-IN')} Kg`}
          label="Stock"
          sentiment="info"
          variant="outlined"
        />
        <StatCard
          icon={<BarChart2 size={20} />}
          value={`₹ ${metrics.avgRate}/Kg`}
          label="Avg Rate"
          sentiment="neutral"
          variant="outlined"
        />
      </Grid>
    </>
  );
}
```

### Period Filter Bar (using SegmentedButton)

```tsx
import { SegmentedButton } from '@/components';

function PeriodFilter({ value, onChange }) {
  return (
    <SegmentedButton
      segments={[
        { value: 'day',   label: 'Day' },
        { value: 'week',  label: 'Week' },
        { value: 'month', label: 'Month' },
        { value: 'year',  label: 'Year' },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
```

---

## 12. Do / Don't Cheat Sheet

### Typography

```tsx
// ✅ DO
<Text variant="title-md" sentiment="negative">Overdue</Text>
<Text variant="amount" as="p">₹ 1,24,500</Text>
<Text variant="label-sm" appearance="secondary" uppercase>Weight</Text>

// ❌ DON'T
<h3 className="text-lg font-semibold text-red-500">Overdue</h3>
<p style={{ fontSize: '1rem', fontWeight: 800 }}>₹ 1,24,500</p>
<span className="text-xs uppercase tracking-wide text-gray-500">Weight</span>
```

### Layout

```tsx
// ✅ DO
<Flex gap="sm" align="center" justify="between">
<Grid columns={2} gap="md">

// ❌ DON'T
<div className="flex gap-2 items-center justify-between">
<div className="grid grid-cols-2 gap-4">
```

### Colors

```tsx
// ✅ DO — in .css companion files
.my-icon-wrapper {
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

// ❌ DON'T
.my-icon-wrapper {
  background-color: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}
```

### Card Sentiment

```tsx
// ✅ DO
<Card sentiment="negative">…</Card>
<Card.SubCard sentiment="info" title="Credit" />

// ❌ DON'T — write custom CSS classes with raw colors per card
<Card className="hs-customer-outstanding-card">…</Card>
// where .hs-customer-outstanding-card has rgba(244, 63, 94, 0.08)
```

---

## 13. Building a Complete Screen

Here is a full recipe for building a **page component** correctly from scratch.

### File Structure

```
src/pages/Sales/
├── components/
│   ├── SalesHeader.tsx       # page header section
│   ├── SalesMetrics.tsx      # KPI stats grid
│   ├── SalesFilters.tsx      # segment + chip filters
│   └── SalesListSection.tsx  # transaction list + empty state
├── SalesPage.tsx             # orchestrates sections only
└── useSalesPage.ts           # all state, redux, handlers
```

### SalesPage.tsx (orchestrator only)

```tsx
// SalesPage.tsx — NO logic, NO state, pure composition
import React from 'react';
import { Flex } from '@/components';
import { SalesHeader } from './components/SalesHeader';
import { SalesMetrics } from './components/SalesMetrics';
import { SalesFilters } from './components/SalesFilters';
import { SalesListSection } from './components/SalesListSection';
import { useSalesPage } from './useSalesPage';

const SalesPage: React.FC = () => {
  const {
    period, setPeriod,
    filter, setFilter,
    transactions, metrics,
    isLoading, handleAdd,
  } = useSalesPage();

  return (
    <Flex direction="column" gap="md" padding="md" fullWidth>
      <SalesHeader onAdd={handleAdd} />
      <SalesMetrics metrics={metrics} isLoading={isLoading} />
      <SalesFilters period={period} onPeriodChange={setPeriod}
                    filter={filter} onFilterChange={setFilter} />
      <SalesListSection transactions={transactions} isLoading={isLoading} />
    </Flex>
  );
};

export default SalesPage;
```

### useSalesPage.ts (all logic)

```tsx
// useSalesPage.ts — ALL state, selectors, handlers go here
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';

export const useSalesPage = () => {
  const dispatch = useAppDispatch();
  const [period, setPeriod] = useState('week');
  const [filter, setFilter] = useState('all');

  const transactions = useAppSelector(/* … */);
  const metrics = useAppSelector(/* … */);
  const isLoading = useAppSelector(/* … */);

  const handleAdd = () => { /* … */ };

  return { period, setPeriod, filter, setFilter,
           transactions, metrics, isLoading, handleAdd };
};
```

### SalesMetrics.tsx (section component)

```tsx
// SalesMetrics.tsx — presentational only
import React from 'react';
import { Grid, StatCard, Progress, Card } from '@/components';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface SalesMetricsProps {
  metrics: { sales: number; dues: number; avgRate: number };
  isLoading: boolean;
}

export const SalesMetrics: React.FC<SalesMetricsProps> = ({ metrics, isLoading }) => {
  if (isLoading) {
    return <Card variant="filled" padding="lg"><Progress type="linear" /></Card>;
  }

  return (
    <Grid columns={2} gap="sm" fullWidth>
      <StatCard
        icon={<TrendingUp size={20} />}
        value={`₹ ${metrics.sales.toLocaleString('en-IN')}`}
        label="Total Sales"
        sentiment="positive"
      />
      <StatCard
        icon={<AlertCircle size={20} />}
        value={`₹ ${metrics.dues.toLocaleString('en-IN')}`}
        label="Dues"
        sentiment="negative"
      />
      <StatCard
        value={`₹ ${metrics.avgRate}/Kg`}
        label="Avg Rate"
        sentiment="neutral"
        variant="outlined"
      />
    </Grid>
  );
};
```

