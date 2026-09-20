import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { mockDataStore } from '../mock/mockDataStore';
import { db } from '../store/firebaseConfig';
import { Customer } from '../types';

/**
 * Fetch all customers from Firestore (or mock store if mock mode enabled)
 */
export async function fetchCustomersApi(): Promise<Customer[]> {
  if (mockDataStore.isEnabled()) {
    return mockDataStore.getCustomers();
  }
  const querySnapshot = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];

  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    customers.push({
      id: docSnap.id,
      name: ((data.name || data.Name || '') as string).trim(),
      mobile: (data.mobile || data.Mobile) as string | undefined,
      creditLimit: (data.creditLimit as number) || 35000,
      outstandingAmount: (data.outstandingAmount as number) || 0,
    });
  });

  customers.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );

  return customers;
}

/**
 * Fetch a single customer by ID
 */
export async function fetchCustomerByIdApi(
  customerId: string,
): Promise<Customer | null> {
  if (mockDataStore.isEnabled()) {
    const cust = mockDataStore.getCustomers().find((c) => c.id === customerId);
    return cust || null;
  }
  const docRef = doc(db, 'customers', customerId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: ((data.name || data.Name || '') as string).trim(),
    mobile: (data.mobile || data.Mobile) as string | undefined,
    creditLimit: (data.creditLimit as number) || 35000,
    outstandingAmount: (data.outstandingAmount as number) || 0,
  };
}

/**
 * Update a customer's running outstanding amount
 */
export async function updateCustomerBalanceApi(
  customerId: string,
  outstandingAmount: number,
): Promise<void> {
  const customerRef = doc(db, 'customers', customerId);
  await updateDoc(customerRef, {
    outstandingAmount: Math.max(0, outstandingAmount),
  });
}
