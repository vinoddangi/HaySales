import { parseNumber, parseString, RawRecord } from '../utils/rawHelpers';

export type Customer = {
  id: string; // Document ID
  name: string; // Customer name
  mobile?: string; // Contact mobile
  village?: string; // Village / City
  creditLimit?: number; // Advisory credit limit indicator
};

export type ICustomer = Customer;

/**
 * Domain Model Class for Customer
 */
export class CustomerModel {
  id: string;
  name: string;
  mobile?: string;
  village?: string;
  creditLimit?: number;

  constructor(data: Customer) {
    this.id = data.id;
    this.name = data.name;
    this.mobile = data.mobile;
    this.village = data.village;
    this.creditLimit = data.creditLimit;
  }

  static from(data: Customer): CustomerModel {
    return data instanceof CustomerModel ? data : new CustomerModel(data);
  }

  static fromRaw(raw: RawRecord, id?: string): CustomerModel {
    const data: Customer = {
      id: parseString(id || raw?.id, ''),
      name: parseString(raw?.name, ''),
      mobile: parseString(raw?.mobile),
      village: parseString(raw?.village),
      creditLimit: parseNumber(raw?.creditLimit),
    };
    return new CustomerModel(data);
  }

  toRaw(): Record<string, unknown> {
    const raw: Record<string, unknown> = {
      name: this.name,
    };
    if (this.mobile) raw.mobile = this.mobile;
    if (this.village) raw.village = this.village;
    if (this.creditLimit !== undefined) raw.creditLimit = this.creditLimit;
    return raw;
  }
}
