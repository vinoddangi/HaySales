# React Material 3 Mobile Skeleton App

A mobile-first React application skeleton configured with **Vite**, **Tailwind CSS**, **Material Design 3 (M3)** design system tokens & components, **Redux Toolkit (RTK)**, and **React Router v7**.

## 🚀 Features

- **⚡ Vite + React 19 + TypeScript**: Fast HMR and typed development.
- **🎨 Material Design 3 (M3) System**:
  - Full M3 color palette (Primary, Secondary, Tertiary, Surface containers 1–5, Outlines, Error states).
  - Dynamic Palette Accents (Agriculture Green, Material Purple, Ocean Blue, Harvest Amber, Crimson Rose).
  - Light & Dark mode support with instantaneous DOM sync.
- **📱 Mobile-First Architecture**:
  - MD3 Top App Bar with safe-area padding & collapsible search.
  - MD3 Bottom Navigation Bar with active indicator pills and notification badges.
  - Full-featured mobile Bottom Sheet modal and floating SnackBar alerts.
  - Floating Action Buttons (FAB & Extended FAB).
  - Interactive touch-optimized components (Chips, Switches, Cards, Segmented Buttons, Text Fields).
  - Desktop Mobile Device Preview frame toggle for easy responsive testing.
- **🗃️ Redux Toolkit (RTK) State Management**:
  - `themeSlice`: Light/Dark mode, M3 dynamic color palette accent, preview mode toggle.
  - `uiSlice`: Global bottom sheet, snackbars, search query state.
  - `itemsSlice`: Product & inventory catalog, category filtering, favorites, and quantity updates.
  - Typed hooks (`useAppDispatch`, `useAppSelector`).
- **🧭 React Router DOM v7**:
  - MobileShell layout with nested routes (`/`, `/explore`, `/item/:id`, `/activity`, `/profile`, `*`).

---

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Run the Development Server

```bash
npm run dev
```

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

---

## 📁 Directory Structure

```
src/
├── components/
│   ├── common/             # Reusable M3 Components (Button, Card, Chip, Switch, Fab, etc.)
│   └── navigation/         # MobileShell, TopAppBar, BottomNavBar
├── pages/                  # HomePage, ExplorePage, ItemDetailPage, ActivityPage, ProfilePage, NotFoundPage
├── routes/                 # React Router AppRoutes
├── store/                  # Redux Toolkit store, hooks, slices (theme, ui, items)
├── theme/                  # M3 design tokens & dynamic ThemeProvider
├── types/                  # TypeScript domain interfaces
├── utils/                  # Tailwind cn class merger
├── App.tsx
├── index.css
└── main.tsx
```
