import defaultRolloutHistory from '../data/monthlyRolloutHistory.json';
import { Customer, MonthlyRolloutStatus, Transaction } from '../types';
import { parseCsv } from '../utils/csvExport';

import customersCsvRaw from './csv/customers.csv?raw';
import expensesCsvRaw from './csv/expenses.csv?raw';
import paymentsCsvRaw from './csv/payments.csv?raw';
import purchasesCsvRaw from './csv/purchases.csv?raw';
import salesCsvRaw from './csv/sales.csv?raw';
import servicesCsvRaw from './csv/services.csv?raw';

const MOCK_MODE_STORAGE_KEY = 'haysales_mock_mode_enabled';
const MOCK_DATA_STORAGE_KEY = 'haysales_mock_data_store_v5';

export interface MockStoreState {
  customers: Customer[];
  transactions: Transaction[]; // Sales, Payments, Services, Opening Balances
  purchases: Transaction[]; // Purchases, Expenses
  monthlyRollout: MonthlyRolloutStatus;
}

/**
 * Parse customers.csv into Customer[]
 */
export function parseCustomersFromCsv(csvText: string): Customer[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('customerid');
  const nameIdx = headers.indexOf('customername');
  const mobIdx = headers.indexOf('mobile');
  const vilIdx = headers.indexOf('village');
  const limIdx = headers.indexOf('creditlimit');
  const outIdx = headers.indexOf('outstandingamount');

  return rows.slice(1).map((r, i) => ({
    id: idIdx !== -1 && r[idIdx] ? r[idIdx] : String(i + 1),
    name: nameIdx !== -1 && r[nameIdx] ? r[nameIdx] : `Customer ${i + 1}`,
    mobile: mobIdx !== -1 ? r[mobIdx] : '',
    village: vilIdx !== -1 ? r[vilIdx] : '',
    creditLimit:
      limIdx !== -1 && r[limIdx] ? Number(r[limIdx]) || 35000 : 35000,
    outstandingAmount: outIdx !== -1 && r[outIdx] ? Number(r[outIdx]) || 0 : 0,
  }));
}

/**
 * Parse sales.csv into Transaction[] (type: 'SALE' or 'SERVICE')
 */
export function parseSalesFromCsv(csvText: string): Transaction[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('transactionid');
  const custIdIdx = headers.indexOf('customerid');
  const nameIdx = headers.indexOf('customername');
  const dateIdx = headers.indexOf('date');
  const itemIdx = headers.indexOf('item');
  const wtIdx = headers.indexOf('weightkg');
  const rateIdx = headers.indexOf('rate');
  const amtIdx = headers.indexOf('totalamount');
  const cashIdx = headers.indexOf('cashpaid');
  const dueIdx = headers.indexOf('remainingdue');
  const noteIdx = headers.indexOf('notes');

  return rows.slice(1).map((r, i) => {
    const rawId = idIdx !== -1 && r[idIdx] ? r[idIdx] : `sale_${i + 1}`;
    const isService = rawId.startsWith('service_');
    const amt = amtIdx !== -1 && r[amtIdx] ? Number(r[amtIdx]) || 0 : 0;
    const cash =
      cashIdx !== -1 && r[cashIdx] !== '' && r[cashIdx] !== undefined
        ? Number(r[cashIdx]) || 0
        : isService
          ? amt
          : 0;
    const due =
      dueIdx !== -1 && r[dueIdx] !== '' && r[dueIdx] !== undefined
        ? Number(r[dueIdx]) || 0
        : Math.max(0, amt - cash);

    return {
      id: rawId,
      type: isService ? 'SERVICE' : 'SALE',
      customerId: custIdIdx !== -1 ? r[custIdIdx] : '',
      customerName: nameIdx !== -1 ? r[nameIdx] : '',
      date:
        dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
      item:
        itemIdx !== -1 && r[itemIdx]
          ? r[itemIdx]
          : isService
            ? 'Pickup'
            : 'Others',
      weightKg: wtIdx !== -1 && r[wtIdx] ? Number(r[wtIdx]) || 0 : 0,
      rate: rateIdx !== -1 && r[rateIdx] ? Number(r[rateIdx]) || 0 : 0,
      amount: amt,
      cashPaid: cash,
      remainingDue: due,
      note: noteIdx !== -1 ? r[noteIdx] : '',
      category: isService ? 'Services' : undefined,
    };
  });
}

/**
 * Parse payments.csv into Transaction[] (type: 'PAYMENT')
 */
export function parsePaymentsFromCsv(csvText: string): Transaction[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('paymentid');
  const custIdIdx = headers.indexOf('customerid');
  const nameIdx = headers.indexOf('customername');
  const dateIdx = headers.indexOf('date');
  const amtIdx = headers.indexOf('amountpaid');
  const noteIdx = headers.indexOf('notes');

  return rows.slice(1).map((r, i) => {
    const amt = amtIdx !== -1 && r[amtIdx] ? Number(r[amtIdx]) || 0 : 0;
    return {
      id: idIdx !== -1 && r[idIdx] ? r[idIdx] : `payment_${i + 1}`,
      type: 'PAYMENT',
      customerId: custIdIdx !== -1 ? r[custIdIdx] : '',
      customerName: nameIdx !== -1 ? r[nameIdx] : '',
      date:
        dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
      amount: amt,
      paymentAmount: amt,
      cashPaid: amt,
      remainingDue: 0,
      note: noteIdx !== -1 ? r[noteIdx] : '',
    };
  });
}

/**
 * Parse services.csv into Transaction[] (type: 'SERVICE')
 */
export function parseServicesFromCsv(csvText: string): Transaction[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('serviceid');
  const custIdIdx = headers.indexOf('customerid');
  const nameIdx = headers.indexOf('customername');
  const dateIdx = headers.indexOf('date');
  const itemIdx = headers.indexOf('item');
  const amtIdx = headers.indexOf('amount');
  const noteIdx = headers.indexOf('notes');

  return rows.slice(1).map((r, i) => {
    const amt = amtIdx !== -1 && r[amtIdx] ? Number(r[amtIdx]) || 0 : 0;
    return {
      id: idIdx !== -1 && r[idIdx] ? r[idIdx] : `service_${i + 1}`,
      type: 'SERVICE',
      customerId: custIdIdx !== -1 ? r[custIdIdx] : '',
      customerName: nameIdx !== -1 ? r[nameIdx] : '',
      date:
        dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
      item: itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Pickup',
      amount: amt,
      cashPaid: amt,
      remainingDue: 0,
      note: noteIdx !== -1 ? r[noteIdx] : '',
      category: 'Services',
    };
  });
}

/**
 * Parse purchases.csv into Transaction[] (type: 'PURCHASE' or 'EXPENSE')
 */
export function parsePurchasesFromCsv(csvText: string): Transaction[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('purchaseid');
  const dateIdx = headers.indexOf('date');
  const catIdx = headers.indexOf('category');
  const itemIdx = headers.indexOf('item');
  const wtIdx = headers.indexOf('weightkg');
  const rateIdx = headers.indexOf('purchaserate');
  const amtIdx = headers.indexOf('amount');
  const cashIdx = headers.indexOf('cashpaid');
  const dueIdx = headers.indexOf('remainingdue');
  const vendorIdx = headers.indexOf('vendorname');
  const noteIdx = headers.indexOf('notes');

  return rows.slice(1).map((r, i) => {
    const rawId = idIdx !== -1 && r[idIdx] ? r[idIdx] : `purchase_${i + 1}`;
    const isExpense = rawId.startsWith('expense_');
    const amt = amtIdx !== -1 && r[amtIdx] ? Number(r[amtIdx]) || 0 : 0;
    const cash =
      cashIdx !== -1 && r[cashIdx] !== '' && r[cashIdx] !== undefined
        ? Number(r[cashIdx]) || 0
        : amt;
    const due =
      dueIdx !== -1 && r[dueIdx] !== '' && r[dueIdx] !== undefined
        ? Number(r[dueIdx]) || 0
        : 0;
    const category =
      catIdx !== -1 && r[catIdx]
        ? r[catIdx]
        : isExpense
          ? 'Others'
          : 'Purchase';

    return {
      id: rawId,
      type: isExpense ? 'EXPENSE' : 'PURCHASE',
      category: isExpense ? undefined : (category as Transaction['category']),
      expenseCategory: isExpense ? category : undefined,
      date:
        dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
      item: itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Others',
      weightKg: wtIdx !== -1 && r[wtIdx] ? Number(r[wtIdx]) || 0 : 0,
      purchaseRate: rateIdx !== -1 && r[rateIdx] ? Number(r[rateIdx]) || 0 : 0,
      amount: amt,
      cashPaid: cash,
      remainingDue: due,
      vendorName: vendorIdx !== -1 ? r[vendorIdx] : '',
      note: noteIdx !== -1 ? r[noteIdx] : '',
    };
  });
}

/**
 * Parse expenses.csv into Transaction[] (type: 'EXPENSE')
 */
export function parseExpensesFromCsv(csvText: string): Transaction[] {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) => h.toLowerCase());
  const idIdx = headers.indexOf('expenseid');
  const dateIdx = headers.indexOf('date');
  const catIdx = headers.indexOf('expensecategory');
  const itemIdx = headers.indexOf('item');
  const amtIdx = headers.indexOf('amount');
  const noteIdx = headers.indexOf('notes');

  return rows.slice(1).map((r, i) => {
    const amt = amtIdx !== -1 && r[amtIdx] ? Number(r[amtIdx]) || 0 : 0;
    return {
      id: idIdx !== -1 && r[idIdx] ? r[idIdx] : `expense_${i + 1}`,
      type: 'EXPENSE',
      category: 'Expense',
      expenseCategory: catIdx !== -1 && r[catIdx] ? r[catIdx] : 'Others',
      date:
        dateIdx !== -1 && r[dateIdx] ? r[dateIdx] : new Date().toISOString(),
      item: itemIdx !== -1 && r[itemIdx] ? r[itemIdx] : 'Others',
      amount: amt,
      cashPaid: amt,
      remainingDue: 0,
      note: noteIdx !== -1 ? r[noteIdx] : '',
    };
  });
}

/**
 * Parse all core CSV files to create the default Mock dataset
 */
export function parseAllMockDataFromCsv(): MockStoreState {
  const customers = parseCustomersFromCsv(customersCsvRaw);
  const sales = parseSalesFromCsv(salesCsvRaw);
  const payments = parsePaymentsFromCsv(paymentsCsvRaw);
  const services = parseServicesFromCsv(servicesCsvRaw);
  const purchases = parsePurchasesFromCsv(purchasesCsvRaw);
  const expenses = parseExpensesFromCsv(expensesCsvRaw);

  // Merge transactions without duplicate IDs
  const txMap = new Map<string, Transaction>();
  sales.forEach((s) => {
    if (s.id) txMap.set(s.id, s);
  });
  payments.forEach((p) => {
    if (p.id) txMap.set(p.id, p);
  });
  services.forEach((sv) => {
    if (sv.id) txMap.set(sv.id, sv);
  });

  // Merge purchases & expenses without duplicate IDs
  const pMap = new Map<string, Transaction>();
  purchases.forEach((p) => {
    if (p.id) pMap.set(p.id, p);
  });
  expenses.forEach((e) => {
    if (e.id) pMap.set(e.id, e);
  });

  return {
    customers,
    transactions: Array.from(txMap.values()),
    purchases: Array.from(pMap.values()),
    monthlyRollout: defaultRolloutHistory as unknown as MonthlyRolloutStatus,
  };
}

class MockDataStoreManager {
  private state: MockStoreState;
  private isMockEnabled: boolean;

  constructor() {
    const hasUrlMock =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('mock') === 'true';
    const hasEnvMock =
      typeof import.meta !== 'undefined' &&
      import.meta.env &&
      import.meta.env.VITE_MOCK_MODE === 'true';
    const hasStorageMock =
      typeof window !== 'undefined' &&
      localStorage.getItem(MOCK_MODE_STORAGE_KEY) === 'true';

    this.isMockEnabled = hasUrlMock || hasEnvMock || hasStorageMock;
    if (hasUrlMock && typeof window !== 'undefined') {
      localStorage.setItem(MOCK_MODE_STORAGE_KEY, 'true');
    }
    this.state = this.loadStateFromStorage();
  }

  private loadStateFromStorage(): MockStoreState {
    if (typeof window === 'undefined') {
      return this.getInitialState();
    }
    try {
      // Clear legacy storage keys
      localStorage.removeItem('haysales_mock_data_store_v1');
      localStorage.removeItem('haysales_mock_data_store_v2');
      localStorage.removeItem('haysales_mock_data_store_v3');

      const saved = localStorage.getItem(MOCK_DATA_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (
          parsed &&
          Array.isArray(parsed.transactions) &&
          parsed.transactions.length >= 50
        ) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return this.getInitialState();
  }

  private saveState(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(MOCK_DATA_STORAGE_KEY, JSON.stringify(this.state));
      } catch (err) {
        console.warn('Failed to save mock state:', err);
      }
    }
  }

  public getInitialState(): MockStoreState {
    return parseAllMockDataFromCsv();
  }

  public isEnabled(): boolean {
    return this.isMockEnabled;
  }

  public setEnabled(enabled: boolean): void {
    this.isMockEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(MOCK_MODE_STORAGE_KEY, String(enabled));
      window.dispatchEvent(
        new CustomEvent('haysales_mock_mode_changed', { detail: enabled }),
      );
    }
  }

  public resetToDefault(): void {
    this.state = this.getInitialState();
    this.saveState();
  }

  public clearAll(): void {
    this.state = {
      customers: [],
      transactions: [],
      purchases: [],
      monthlyRollout: defaultRolloutHistory as unknown as MonthlyRolloutStatus,
    };
    this.saveState();
  }

  public syncFromLiveDb(
    customers: Customer[],
    transactions: Transaction[],
    purchases: Transaction[],
    rollout?: MonthlyRolloutStatus,
  ): void {
    this.state = {
      customers: [...customers],
      transactions: [...transactions],
      purchases: [...purchases],
      monthlyRollout: rollout || this.state.monthlyRollout,
    };
    this.saveState();
  }

  public getState(): MockStoreState {
    return this.state;
  }

  // --- Generic Store Driver Methods (Identical to IndexedDB Driver) ---

  public getStoreData<T = any>(storeName: string): T[] {
    if (storeName === 'customers') return this.state.customers as any;
    if (storeName === 'transactions') return this.state.transactions as any;
    if (storeName === 'purchases') return this.state.purchases as any;
    if (storeName === 'monthly_rollout')
      return [this.state.monthlyRollout] as any;
    if (storeName === 'metadata') return [] as any;
    return [];
  }

  public getStoreItem<T = any>(storeName: string, key: string): T | undefined {
    if (storeName === 'customers') {
      return this.state.customers.find((c) => c.id === key) as any;
    }
    if (storeName === 'transactions') {
      return this.state.transactions.find((t) => t.id === key) as any;
    }
    if (storeName === 'purchases') {
      return this.state.purchases.find((p) => p.id === key) as any;
    }
    if (storeName === 'monthly_rollout') {
      return this.state.monthlyRollout as any;
    }
    return undefined;
  }

  public putStoreItem<T = any>(storeName: string, item: T): void {
    const raw = item as any;
    const key = raw.id || raw.key || raw.month;
    if (storeName === 'customers') {
      const idx = this.state.customers.findIndex((c) => c.id === key);
      if (idx >= 0) this.state.customers[idx] = raw;
      else this.state.customers.push(raw);
    } else if (storeName === 'transactions') {
      const idx = this.state.transactions.findIndex((t) => t.id === key);
      if (idx >= 0) this.state.transactions[idx] = raw;
      else this.state.transactions.unshift(raw);
    } else if (storeName === 'purchases') {
      const idx = this.state.purchases.findIndex((p) => p.id === key);
      if (idx >= 0) this.state.purchases[idx] = raw;
      else this.state.purchases.unshift(raw);
    } else if (storeName === 'monthly_rollout') {
      this.state.monthlyRollout = raw;
    }
    this.saveState();
  }

  public deleteStoreItem(storeName: string, key: string): void {
    if (storeName === 'customers') {
      this.state.customers = this.state.customers.filter((c) => c.id !== key);
    } else if (storeName === 'transactions') {
      this.state.transactions = this.state.transactions.filter(
        (t) => t.id !== key,
      );
    } else if (storeName === 'purchases') {
      this.state.purchases = this.state.purchases.filter((p) => p.id !== key);
    }
    this.saveState();
  }

  // --- CRUD Operations for Mock Store ---

  public getCustomers(): Customer[] {
    return [...this.state.customers].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }

  public addCustomer(cust: Customer): void {
    this.state.customers.push(cust);
    this.saveState();
  }

  public getTransactions(customerId?: string): Transaction[] {
    const list = customerId
      ? this.state.transactions.filter((t) => t.customerId === customerId)
      : [...this.state.transactions];

    return list.sort((a, b) => {
      const getTime = (d: any) => {
        if (!d) return 0;
        if (typeof d === 'object' && 'seconds' in d && d.seconds) {
          return d.seconds * 1000;
        }
        const parsed = new Date(d).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };
      return getTime(b.date) - getTime(a.date);
    });
  }

  public addTransaction(tx: Transaction): void {
    this.state.transactions.unshift(tx);
    if (tx.customerId) {
      const cust = this.state.customers.find((c) => c.id === tx.customerId);
      if (cust) {
        const cur = cust.outstandingAmount || 0;
        if (tx.type === 'SALE') {
          cust.outstandingAmount = cur + (tx.remainingDue ?? (tx.amount || 0));
        } else if (tx.type === 'PAYMENT') {
          cust.outstandingAmount = Math.max(
            0,
            cur - (tx.amount || tx.paymentAmount || 0),
          );
        }
      }
    }
    this.saveState();
  }

  public deleteTransaction(id: string): void {
    this.state.transactions = this.state.transactions.filter(
      (t) => t.id !== id,
    );
    this.saveState();
  }

  public getPurchases(): Transaction[] {
    return [...this.state.purchases];
  }

  public deletePurchase(id: string): void {
    this.state.purchases = this.state.purchases.filter((p) => p.id !== id);
    this.saveState();
  }

  public getMonthlyRollout(): MonthlyRolloutStatus {
    return this.state.monthlyRollout;
  }

  public ingestCsv(
    type:
      | 'customers'
      | 'sales'
      | 'payments'
      | 'purchases'
      | 'expenses'
      | 'services',
    csvText: string,
  ): { count: number } {
    let count = 0;
    if (type === 'customers') {
      this.state.customers = parseCustomersFromCsv(csvText);
      count = this.state.customers.length;
    } else if (type === 'sales') {
      const sales = parseSalesFromCsv(csvText);
      const otherTx = this.state.transactions.filter((t) => t.type !== 'SALE');
      this.state.transactions = [...otherTx, ...sales];
      count = sales.length;
    } else if (type === 'payments') {
      const payments = parsePaymentsFromCsv(csvText);
      const otherTx = this.state.transactions.filter(
        (t) => t.type !== 'PAYMENT',
      );
      this.state.transactions = [...otherTx, ...payments];
      count = payments.length;
    } else if (type === 'services') {
      const services = parseServicesFromCsv(csvText);
      const otherTx = this.state.transactions.filter(
        (t) => t.type !== 'SERVICE',
      );
      this.state.transactions = [...otherTx, ...services];
      count = services.length;
    } else if (type === 'purchases') {
      const purchases = parsePurchasesFromCsv(csvText);
      const otherP = this.state.purchases.filter((p) => p.type !== 'PURCHASE');
      this.state.purchases = [...otherP, ...purchases];
      count = purchases.length;
    } else if (type === 'expenses') {
      const expenses = parseExpensesFromCsv(csvText);
      const otherP = this.state.purchases.filter((p) => p.type !== 'EXPENSE');
      this.state.purchases = [...otherP, ...expenses];
      count = expenses.length;
    }
    this.saveState();
    return { count };
  }
}

export const mockDataStore = new MockDataStoreManager();
