import { parseNumber, parseString, RawRecord } from '../utils/rawHelpers';

export type Customer = {
  id: string; // Document ID
  name: string; // Customer name
  mobile?: string; // Contact mobile
  village?: string; // Village / City
  creditLimit?: number; // Advisory credit limit indicator
  openingBalance?: number; // Baseline opening debt / credit brought forward
  outstandingAmount?: number; // Running live outstanding balance
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
  openingBalance?: number;
  outstandingAmount?: number;

  constructor(data: Customer) {
    this.id = data.id;
    this.name = data.name;
    this.mobile = data.mobile;
    this.village = data.village;
    this.creditLimit = data.creditLimit;
    this.openingBalance = data.openingBalance;
    this.outstandingAmount = data.outstandingAmount;
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
      openingBalance: parseNumber(raw?.openingBalance),
      outstandingAmount: parseNumber(raw?.outstandingAmount),
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
    if (this.openingBalance !== undefined)
      raw.openingBalance = this.openingBalance;
    if (this.outstandingAmount !== undefined)
      raw.outstandingAmount = this.outstandingAmount;
    return raw;
  }

  hasOutstandingDues(): boolean {
    return (this.outstandingAmount || 0) > 0;
  }

  isOverCreditLimit(): boolean {
    return (this.outstandingAmount || 0) > (this.creditLimit || 0);
  }

  getAvailableCredit(): number {
    return Math.max(0, (this.creditLimit || 0) - (this.outstandingAmount || 0));
  }
}
