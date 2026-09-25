import {
  parseOptionalNumber,
  parseOptionalString,
  parseString,
  RawRecord,
} from '../utils/rawHelpers';

export type Customer = {
  id: string; // Document ID
  name: string; // Customer name
  mobile?: string; // Contact mobile
  village?: string; // Village / City
  creditLimit?: number; // Advisory credit limit indicator
  outstandingAmount?: number; // Real-time running outstanding balance on customer doc
};

export type ICustomer = Customer;

/**
 * Domain Model Class for Customer with credit risk & ledger helper utilities
 */
export class CustomerModel {
  id: string;
  name: string;
  mobile?: string;
  village?: string;
  creditLimit?: number;
  outstandingAmount?: number;

  constructor(data: Customer) {
    this.id = data.id;
    this.name = data.name;
    this.mobile = data.mobile;
    this.village = data.village;
    this.creditLimit = data.creditLimit;
    this.outstandingAmount = data.outstandingAmount;
  }

  static from(data: Customer): CustomerModel {
    return data instanceof CustomerModel ? data : new CustomerModel(data);
  }

  static fromRaw(raw: RawRecord, id?: string): CustomerModel {
    const data: Customer = {
      id: parseString(id || raw?.id),
      name: parseString(raw?.name),
      mobile: parseOptionalString(raw?.mobile),
      village: parseOptionalString(raw?.village),
      creditLimit: parseOptionalNumber(raw?.creditLimit),
      outstandingAmount: parseOptionalNumber(raw?.outstandingAmount),
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

  getCreditUtilizationPercentage(): number {
    const limit = this.creditLimit || 0;
    const due = this.outstandingAmount || 0;
    return limit > 0 ? Number(((due / limit) * 100).toFixed(2)) : 0;
  }
}
