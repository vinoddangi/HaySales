import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { FlexLayout, Spinner } from '@salt-ds/core';
import { store } from './store';
import { ThemeProvider } from './theme';
import { MobileShell, PlaceholderView } from './views';

const HomePage = React.lazy(() => import('./pages/Home'));
const ProfilePage = React.lazy(() => import('./pages/profile'));
const SalesPage = React.lazy(() => import('./pages/Sales'));
const PurchasesPage = React.lazy(() => import('./pages/Purchases'));
const LedgerPage = React.lazy(() => import('./pages/Ledger'));
const ActivityPage = React.lazy(() => import('./pages/Activity'));

const RouteLoadingFallback: React.FC = () => (
  <FlexLayout
    direction="column"
    align="center"
    justify="center"
    style={{
      width: '100%',
      height: '100%',
      minHeight: '50vh',
      padding: 'var(--salt-spacing-300)',
    }}
  >
    <Spinner size="medium" />
  </FlexLayout>
);

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Routes>
              <Route path="/" element={<MobileShell />}>
                <Route index element={<HomePage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                <Route path="ledger" element={<LedgerPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route
                  path="*"
                  element={
                    <PlaceholderView
                      title="Page Not Found"
                      subtitle="The requested route does not exist."
                    />
                  }
                />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};
