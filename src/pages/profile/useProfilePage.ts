import { useCallback, useEffect, useState } from 'react';
import { Customer, Transaction } from '../../models';
import { DatabaseMode, dbConfig } from '../../services/dbBridge';
import {
  clearAllLocalData,
  getPendingChanges,
  getPendingChangesCount,
  getStoreData,
  PendingChange,
  publishPendingChangesToCloud,
  syncLocalDatabaseFromCloud,
} from '../../services/indexedDBService';
import { auth } from '../../store/firebaseConfig';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { useAuth } from '../../store/hooks/useAuth';
import {
  ColorScheme,
  FontSize,
  setColorScheme,
  setFontSize,
  setThemeMode,
} from '../../store/slices/themeSlice';
import { showSnackbar } from '../../store/slices/uiSlice';

export interface LocalStats {
  customers: number;
  sales: number;
  payments: number;
  services: number;
  purchases: number;
  expenses: number;
}

export const colorPalettes: { key: ColorScheme; name: string; hex: string }[] =
  [
    { key: 'green', name: 'Agriculture Green', hex: '#006c4c' },
    { key: 'purple', name: 'Material Baseline', hex: '#6750a4' },
    { key: 'blue', name: 'Ocean Blue', hex: '#0061a4' },
    { key: 'orange', name: 'Harvest Amber', hex: '#8b5000' },
    { key: 'rose', name: 'Crimson Rose', hex: '#9c4146' },
  ];

export const fontSizeOptions: {
  key: FontSize;
  label: string;
  level: string;
  symbolClass: string;
}[] = [
  {
    key: 'small',
    label: 'Small',
    level: '-1 Level',
    symbolClass: 'font-settings__symbol--small',
  },
  {
    key: 'medium',
    label: 'Default',
    level: 'Standard',
    symbolClass: 'font-settings__symbol--medium',
  },
  {
    key: 'large',
    label: 'Large',
    level: '+1 Level',
    symbolClass: 'font-settings__symbol--large',
  },
];

export const useProfilePage = () => {
  const dispatch = useAppDispatch();
  const { mode, scheme, fontSize } = useAppSelector((state) => state.theme);
  const { currentUser, logout } = useAuth();

  // Profile Header State
  const [name, setName] = useState(() => {
    try {
      const stored = localStorage.getItem('haysales_profile_name');
      if (stored) return stored;
    } catch {
      // Ignore storage error
    }
    return auth.currentUser?.displayName || 'Vinod Dangi';
  });

  const phoneNumber = currentUser?.phoneNumber || '+91 98765 43210';
  const role = 'Enterprise Manager';

  const isDark = mode === 'dark';

  // Database Management State
  const [dbMode, setDbMode] = useState<DatabaseMode>(dbConfig.getMode());
  const [stats, setStats] = useState<LocalStats>({
    customers: 0,
    sales: 0,
    payments: 0,
    services: 0,
    purchases: 0,
    expenses: 0,
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingItems, setPendingItems] = useState<PendingChange[]>([]);
  const [showPendingDetails, setShowPendingDetails] = useState<boolean>(false);
  const [loadingDb, setLoadingDb] = useState(false);
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncingPull, setSyncingPull] = useState(false);

  const loadDbStats = useCallback(async () => {
    try {
      const [custs, cTxs, opTxs, pending] = await Promise.all([
        getStoreData<Customer>('customers'),
        getStoreData<Transaction>('customer_transactions'),
        getStoreData<Transaction>('operation_transactions'),
        getPendingChanges(),
      ]);

      const sales = cTxs.filter((t) => t.type === 'SALE').length;
      const payments = cTxs.filter((t) => t.type === 'PAYMENT').length;
      const services = cTxs.filter((t) => t.type === 'SERVICE').length;
      const purchases = opTxs.filter((t) => t.type === 'PURCHASE').length;
      const expenses = opTxs.filter((t) => t.type === 'EXPENSE').length;

      setStats({
        customers: custs.length,
        sales,
        payments,
        services,
        purchases,
        expenses,
      });
      setPendingCount(pending.length);
      setPendingItems(pending);
    } catch (err) {
      console.error('Failed to load local DB stats:', err);
    } finally {
      setLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInitialStats = async () => {
      try {
        const [custs, cTxs, opTxs, pending] = await Promise.all([
          getStoreData<Customer>('customers'),
          getStoreData<Transaction>('customer_transactions'),
          getStoreData<Transaction>('operation_transactions'),
          getPendingChanges(),
        ]);
        if (!isMounted) return;

        const sales = cTxs.filter((t) => t.type === 'SALE').length;
        const payments = cTxs.filter((t) => t.type === 'PAYMENT').length;
        const services = cTxs.filter((t) => t.type === 'SERVICE').length;
        const purchases = opTxs.filter((t) => t.type === 'PURCHASE').length;
        const expenses = opTxs.filter((t) => t.type === 'EXPENSE').length;

        setStats({
          customers: custs.length,
          sales,
          payments,
          services,
          purchases,
          expenses,
        });
        setPendingCount(pending.length);
        setPendingItems(pending);
      } catch (err) {
        console.error('Failed to load local DB stats:', err);
      }
    };

    fetchInitialStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleDbMode = (isLocal: boolean) => {
    const nextMode: DatabaseMode = isLocal ? 'local' : 'server';
    dbConfig.setMode(nextMode);
    setDbMode(nextMode);
    dispatch(
      showSnackbar(
        nextMode === 'local'
          ? 'Local Offline DB Enabled (IndexedDB)!'
          : 'Connected to Live Cloud Firestore!',
      ),
    );
  };

  const handleToggleDarkMode = (checked: boolean) => {
    const next = checked ? 'dark' : 'light';
    dispatch(setThemeMode(next));
    dispatch(showSnackbar(`Switched to ${checked ? 'Dark' : 'Light'} Mode`));
  };

  const handleSelectScheme = (palKey: ColorScheme, palName: string) => {
    dispatch(setColorScheme(palKey));
    dispatch(showSnackbar(`Applied ${palName} Theme`));
  };

  const handleSelectFontSize = (newSize: FontSize) => {
    dispatch(setFontSize(newSize));
    const labels: Record<FontSize, string> = {
      small: 'Small (Compact)',
      medium: 'Default (Standard)',
      large: 'Large (+1 Level)',
    };
    dispatch(showSnackbar(`Font size updated to ${labels[newSize]}`));
  };

  const handleUpdateDisplayName = async (newName: string) => {
    const cleanName = newName.trim();
    if (!cleanName) return;

    setName(cleanName);
    try {
      localStorage.setItem('haysales_profile_name', cleanName);
    } catch {
      // Ignore storage error
    }

    if (auth.currentUser) {
      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, { displayName: cleanName });
      } catch (err) {
        console.error('Update profile name error:', err);
      }
    }

    dispatch(showSnackbar('Name updated successfully!'));
  };

  const handleSignOut = async () => {
    await logout();
    dispatch(showSnackbar('Signed out successfully.'));
  };

  // 1. Sync from Cloud Firestore
  const handleSyncFromCloud = async () => {
    try {
      setSyncingPull(true);
      dispatch(showSnackbar('Syncing from Cloud Firestore...'));
      const res = await syncLocalDatabaseFromCloud();
      await loadDbStats();
      dispatch(
        showSnackbar(
          `Synced: ${res.customersCount} customers, ${res.customerTransactionsCount} customer txs, ${res.operationTransactionsCount} ops.`,
        ),
      );
    } catch (err) {
      console.error('Failed to sync from Firestore:', err);
      dispatch(showSnackbar('Failed to sync from Firestore.'));
    } finally {
      setSyncingPull(false);
    }
  };

  // 2. Publish Modified / Delta Records to Cloud Firestore
  const handlePublishToCloud = async () => {
    try {
      setSyncingCloud(true);
      const count = await getPendingChangesCount();
      if (count === 0) {
        dispatch(
          showSnackbar(
            'Database is already in sync with Cloud Firestore. No pending changes to publish.',
          ),
        );
        return;
      }

      const res = await publishPendingChangesToCloud();
      await loadDbStats();
      dispatch(
        showSnackbar(
          `Successfully published ${res.publishedCount} modified record(s) to Cloud Firestore!`,
        ),
      );
    } catch (err) {
      console.error('Failed to publish data to Firestore:', err);
      dispatch(showSnackbar('Failed to publish to Firestore.'));
    } finally {
      setSyncingCloud(false);
    }
  };

  // 3. Clear Local DB
  const handleClearLocalDb = async () => {
    try {
      setLoadingDb(true);
      await clearAllLocalData();
      await loadDbStats();
      dispatch(
        showSnackbar('Local DB cleared. Click "Sync" to fetch from Firestore.'),
      );
    } catch (err) {
      console.error('Failed to clear local DB:', err);
      dispatch(showSnackbar('Error clearing local DB.'));
    } finally {
      setLoadingDb(false);
    }
  };

  const getFontBadgeLabel = () => {
    if (fontSize === 'small') return 'Small (87.5%)';
    if (fontSize === 'large') return 'Large (+1 Level / 112.5%)';
    return 'Default (100%)';
  };

  return {
    name,
    phoneNumber,
    role,
    isDark,
    scheme,
    fontSize,
    dbMode,
    stats,
    pendingCount,
    pendingItems,
    showPendingDetails,
    setShowPendingDetails,
    loadingDb,
    syncingCloud,
    syncingPull,
    colorPalettes,
    fontSizeOptions,
    getFontBadgeLabel,
    handleToggleDarkMode,
    handleSelectScheme,
    handleSelectFontSize,
    handleUpdateDisplayName,
    handleSignOut,
    handleToggleDbMode,
    handleSyncFromCloud,
    handlePublishToCloud,
    handleClearLocalDb,
    loadDbStats,
  };
};
