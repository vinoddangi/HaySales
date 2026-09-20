import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from '../services/dbBridge';
import { db } from '../store/firebaseConfig';
import { Customer } from '../types';
import { parseCustomer } from '../utils/parsers';

/**
 * Fetch all customers from DB
 */
export async function fetchCustomersApi(): Promise<Customer[]> {
  const querySnapshot = await getDocs(collection(db, 'customers'));
  const customers: Customer[] = [];

  querySnapshot.forEach((docSnap) => {
    customers.push(parseCustomer(docSnap.data(), docSnap.id));
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
  const docRef = doc(db, 'customers', customerId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;

  return parseCustomer(docSnap.data(), docSnap.id);
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
