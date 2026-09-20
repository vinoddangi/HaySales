import { Customer } from '../../types';
import { parseNumber, parseOptionalString, parseString } from './utils';

/**
 * Standard Customer Entity Parser
 * Normalizes customer documents directly from DB.
 */
export function parseCustomer(raw: any, id?: string): Customer {
  return {
    id: parseString(id || raw?.id),
    name: parseString(raw?.name),
    mobile: parseOptionalString(raw?.mobile),
    village: parseOptionalString(raw?.village),
    creditLimit: parseNumber(raw?.creditLimit, 35000),
    outstandingAmount: parseNumber(raw?.outstandingAmount, 0),
  };
}
