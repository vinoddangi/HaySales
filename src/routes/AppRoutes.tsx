import { LedgerPage } from '@/pages/LedgerPage';
import { SalesPage } from '@/pages/SalesPage';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MobileShell } from '../components/navigation/MobileShell';
import { ActivityPage } from '../pages/ActivityPage';
import { ExplorePage } from '../pages/ExplorePage';
import { HomePage } from '../pages/HomePage';
import { ItemDetailPage } from '../pages/ItemDetailPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProfilePage } from '../pages/ProfilePage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MobileShell />}>
        <Route index element={<HomePage />} />
        <Route path="explore" element={<ExplorePage />} />
        <Route path="item/:id" element={<ItemDetailPage />} />
        <Route path="activity" element={<ActivityPage />} />
        <Route path="sales" element={<SalesPage />} />
        <Route path="ledger" element={<LedgerPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
