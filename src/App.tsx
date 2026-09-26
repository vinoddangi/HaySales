import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/Home';
import { ProfilePage } from './pages/profile';
import { store } from './store';
import { ThemeProvider } from './theme';
import { MobileShell, PlaceholderView } from './views';

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MobileShell />}>
              <Route index element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route
                path="sales"
                element={
                  <PlaceholderView
                    title="New Sales Register"
                    subtitle="Register sales in Kilograms (Kg) and ₹ / Kg."
                  />
                }
              />
              <Route
                path="purchases"
                element={
                  <PlaceholderView
                    title="Purchases & Expenses"
                    subtitle="Record farmer procurement and operational expenses."
                  />
                }
              />
              <Route
                path="ledger"
                element={
                  <PlaceholderView
                    title="Customer Dues Ledger"
                    subtitle="Account balance statements and invoice payment tracking."
                  />
                }
              />
              <Route
                path="activity"
                element={
                  <PlaceholderView
                    title="Activity & History"
                    subtitle="Audit log of all registered transactions and orders."
                  />
                }
              />
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
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
};
