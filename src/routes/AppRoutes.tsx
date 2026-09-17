import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MobileShell } from '../components/navigation/MobileShell';
import {
  ActivityPage,
  CustomerPage,
  HomePage,
  ItemDetailPage,
  LedgerPage,
  NotFoundPage,
  ProfilePage,
  PurchasesPage,
  SalesPage,
} from '../pages';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="purchases" element={<PurchasesPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="customers" element={<CustomerPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
