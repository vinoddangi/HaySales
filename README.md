# HaySales — React Material Design 3 Mobile App

A modern, mobile-first React application skeleton built with **React 19**, **Vite 6**, **Tailwind CSS**, **Material Design 3 (M3)** design system tokens & components, **Redux Toolkit (RTK)**, and **React Router v7**.

---

## 📱 Features

- **⚡ Fast Modern Stack**:
  - **Vite 6** + **React 19** + **TypeScript 5.7+**
  - **Node 24** runtime specification (`.nvmrc` & `engines`)
- **🎨 Material Design 3 (M3) System**:
  - Full M3 design token palette (*Primary, Secondary, Tertiary, Surface containers 1–5, Outlines, Error states*).
  - **5 Dynamic M3 Color Schemes**:
    - 🌿 **Agriculture Green** (`#2D6B28`)
    - 💜 **Material Baseline Purple** (`#6750A4`)
    - 🌊 **Ocean Blue** (`#00639A`)
    - 🌾 **Harvest Amber** (`#8B5000`)
    - 🌹 **Crimson Rose** (`#9C4146`)
  - Instantaneous Light & Dark mode synchronization.
- **📱 Mobile-First Native Experience**:
  - **Top App Bar** with safe-area insets, back navigation, and collapsible search.
  - **Bottom Navigation Bar** with active pill indicators and notification badges.
  - **Bottom Sheet Modal** with drag handle, animated slide-up, and backdrop blur.
  - **Floating Action Buttons (FAB)** & Extended FABs.
  - **M3 Interactive Components**: Filled/Tonal/Outlined Buttons, Cards, Filter/Suggestion Chips, Switches, Segmented Buttons, Text Fields, and Snackbars.
  - **Desktop Mobile Device Frame Toggle** for responsive preview during development.
- **🗃️ Redux Toolkit (RTK) State Management**:
  - `themeSlice`: Light/Dark mode, M3 dynamic color palette accent, desktop frame toggle.
  - `uiSlice`: Mobile bottom sheet modals, snackbar notifications, search state.
  - `itemsSlice`: Product & inventory catalog, category filtering, favorites, and quantity updates.
  - Typed hooks (`useAppDispatch`, `useAppSelector`).
- **🧭 React Router DOM v7**:
  - Nested routes under `MobileShell`:
    - `/` — Dashboard & Featured Forage
    - `/explore` — Search & Category Filtered Catalog (Grid & List views)
    - `/item/:id` — Product Detail, Lab Feed Specs, and Order FAB
    - `/activity` — Freight Shipments & Lab Report Notifications
    - `/profile` — Settings, Dynamic M3 Theme Switcher, and Preferences
    - `*` — 404 Not Found
- **🚀 CI/CD & Firebase Hosting**:
  - GitHub Actions automated workflows for pull request previews and live deployments.
  - Firebase Hosting SPA routing configuration.
- **✨ Code Quality & Formatting**:
  - **ESLint 9** Flat Config with TypeScript & React Hooks rules.
  - **Prettier** with automatic Tailwind CSS class sorting plugin.
  - VS Code auto-format and auto-fix on save configured in `.vscode/settings.json`.

---

## 📂 Project Structure

```
HaySales/
├── .github/
│   └── workflows/
│       ├── firebase-hosting-merge.yml        # Deploy to live on main merge
│       └── firebase-hosting-pull-request.yml  # Deploy preview URL on PR
├── .vscode/
│   ├── launch.json                           # Chrome launch debug configuration
│   ├── settings.json                         # Format and ESLint on save
│   └── extensions.json                       # Recommended VS Code extensions
├── src/
│   ├── components/
│   │   ├── common/                           # M3 Reusable UI Components
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Chip.tsx
│   │   │   ├── Fab.tsx
│   │   │   ├── SegmentedControl.tsx
│   │   │   ├── Snackbar.tsx
│   │   │   ├── Switch.tsx
│   │   │   └── TextField.tsx
│   │   └── navigation/                       # Mobile Shell & Bars
│   │       ├── BottomNavBar.tsx
│   │       ├── MobileShell.tsx
│   │       └── TopAppBar.tsx
│   ├── pages/                                # Route Screen Components
│   │   ├── ActivityPage.tsx
│   │   ├── ExplorePage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ItemDetailPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── ProfilePage.tsx
│   ├── routes/
│   │   └── AppRoutes.tsx                     # React Router Routes
│   ├── store/                                # Redux Toolkit
│   │   ├── hooks.ts
│   │   ├── index.ts
│   │   └── slices/
│   │       ├── itemsSlice.ts
│   │       ├── themeSlice.ts
│   │       └── uiSlice.ts
│   ├── theme/                                # Material 3 Design System
│   │   ├── m3Tokens.ts                       # Color palettes & tokens
│   │   └── ThemeProvider.tsx                 # Dynamic DOM token injector
│   ├── types/
│   │   └── index.ts                          # TypeScript domain interfaces
│   ├── utils/
│   │   └── cn.ts                             # Tailwind class merger
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── .firebaserc                               # Firebase project configuration
├── .gitignore
├── .nvmrc                                    # Node 24 runtime
├── .prettierignore
├── .prettierrc                               # Prettier formatting config
├── eslint.config.js                          # ESLint 9 Flat Config
├── firebase.json                             # Firebase Hosting SPA routing
├── index.html                                # Mobile viewport fit=cover
├── package.json
├── postcss.config.js
├── tailwind.config.js                        # Tailwind M3 token extensions
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
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
> Google Chrome will automatically launch at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

### 4. Preview Production Build
```bash
npm run preview
```

### 5. Linting & Formatting
```bash
# Run ESLint
npm run lint

# Automatically fix ESLint errors
npm run lint:fix

# Format code with Prettier & Tailwind sort
npm run format

# Verify formatting without writing
npm run format:check
```

---

## 🚀 Firebase Hosting & CI/CD Deployment

This repository is configured to deploy to Firebase project **`shreyansh-group`**.

### Adding the Firebase Secret to GitHub:
1. Go to [Firebase Console Service Accounts](https://console.firebase.google.com/u/0/project/shreyansh-group/settings/serviceaccounts/adminsdk) and click **Generate new private key**.
2. Open your GitHub Repository > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
3. Create a secret named `FIREBASE_SERVICE_ACCOUNT_SHREYANSH_GROUP` and paste the entire JSON contents.

Once configured:
- Every **Pull Request** gets an automated **preview channel deployment**.
- Merges to **`main`** automatically build and deploy to the **live site**.

---

## 📄 License

MIT
