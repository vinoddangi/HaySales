export * from './Accounting';
export * from './BalanceSheet';
export * from './Customer';
export * from './FixedAsset';
export * from './Transaction';
export * from './ui.model';

import { TransactionModel } from './Transaction';

/** Standard transaction data shape */
export type Transaction = import('./Transaction').TransactionData;
export type DomainTransaction = TransactionModel;

/**
 * Convert any plain transaction data into a concrete TransactionModel class instance.
 */
export function toDomainTransaction(
  data: import('./Transaction').TransactionData,
): TransactionModel {
  return TransactionModel.from(data);
}
