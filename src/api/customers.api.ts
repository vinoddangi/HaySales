import { CustomerModel } from '../models';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
} from '../services/dbBridge';

export async function fetchCustomers(): Promise<CustomerModel[]> {
  const snapshot = await getDocs<Record<string, unknown>>(
    collection('customers'),
  );
  const customers = snapshot.docs.map((d) =>
    CustomerModel.fromRaw(d.data() || {}, d.id),
  );

  return customers.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export async function fetchCustomerById(
  id: string,
): Promise<CustomerModel | null> {
  const snapshot = await getDoc<Record<string, unknown>>(doc('customers', id));
  if (!snapshot.exists()) return null;
  return CustomerModel.fromRaw(snapshot.data() || {}, id);
}

export async function addCustomer(
  customer: Partial<CustomerModel> & { name: string },
): Promise<CustomerModel> {
  const generatedId = customer.id || crypto.randomUUID();
  const model = new CustomerModel({
    ...customer,
    id: generatedId,
  });

  await setDoc(doc('customers', generatedId), {
    ...model.toRaw(),
    id: generatedId,
  });

  return model;
}

export async function updateCustomer(
  id: string,
  data: Partial<CustomerModel>,
): Promise<void> {
  const existingDoc = await getDoc<Record<string, unknown>>(
    doc('customers', id),
  );
  const merged = CustomerModel.fromRaw(
    { ...(existingDoc.data() || {}), ...data },
    id,
  );
  await updateDoc(doc('customers', id), merged.toRaw());
}

export async function deleteCustomer(id: string): Promise<void> {
  await deleteDoc(doc('customers', id));
}
