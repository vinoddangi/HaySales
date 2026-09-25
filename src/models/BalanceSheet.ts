import { FixedAsset, FixedAssetData } from './FixedAsset';

export interface BalanceSheetAssets {
  cashBalance: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssets: (FixedAsset | FixedAssetData)[];
  totalFixedAssetsValue: number;
  totalAssets: number;
}

export interface BalanceSheetLiabilities {
  vendorPayables: number;
  shortTermLoans?: number;
  otherLiabilities?: number;
  totalLiabilities: number;
}

export interface BalanceSheetEquity {
  partnerCapital: number;
  retainedProfit: number;
  totalEquity: number;
}

export interface BalanceSheetLiabilitiesAndEquity {
  partnerCapital: number;
  capitalInterestSettledInCash: number;
  retainedProfit: number;
  vendorPayables: number;
  totalLiabilities: number;
  totalCapitalAndEquity: number;
}

export interface BalanceSheetData {
  assets: BalanceSheetAssets;
  liabilitiesAndEquity: BalanceSheetLiabilitiesAndEquity;
  cashAdjustment: number;
}

export interface CalculateBalanceSheetParams {
  partnerCapital: number;
  retainedProfit: number;
  customerReceivables: number;
  closingStockValue: number;
  fixedAssets: (FixedAsset | FixedAssetData)[];
  vendorPayables?: number;
  openingCashBalance?: number;
}

/**
 * Domain Model Class for BalanceSheet with embedded double-entry validation utilities
 */
export class BalanceSheet implements BalanceSheetData {
  assets: BalanceSheetAssets;
  liabilitiesAndEquity: BalanceSheetLiabilitiesAndEquity;
  cashAdjustment: number;

  constructor(data: BalanceSheetData) {
    this.assets = data.assets;
    this.liabilitiesAndEquity = data.liabilitiesAndEquity;
    this.cashAdjustment = data.cashAdjustment;
  }

  static from(data: BalanceSheetData): BalanceSheet {
    return data instanceof BalanceSheet ? data : new BalanceSheet(data);
  }

  /**
   * Calculates the complete Balance Sheet snapshot based on double-entry principles
   */
  static calculate({
    partnerCapital,
    retainedProfit,
    customerReceivables,
    closingStockValue,
    fixedAssets,
    vendorPayables = 0,
    openingCashBalance = 0,
  }: CalculateBalanceSheetParams): BalanceSheet {
    const totalLiabilities = Number((vendorPayables || 0).toFixed(2));
    const totalCapitalAndEquity = Number(
      (partnerCapital + retainedProfit + totalLiabilities).toFixed(2),
    );

    const totalFixedAssetsValue = FixedAsset.getTotalBookValue(fixedAssets);

    const nonCashAssets =
      customerReceivables + closingStockValue + totalFixedAssetsValue;

    const cashBalance = totalCapitalAndEquity - nonCashAssets;
    const cashAdjustment = cashBalance - openingCashBalance;

    return new BalanceSheet({
      assets: {
        cashBalance: Number(cashBalance.toFixed(2)),
        customerReceivables: Number(customerReceivables.toFixed(2)),
        closingStockValue: Number(closingStockValue.toFixed(2)),
        fixedAssets,
        totalFixedAssetsValue: Number(totalFixedAssetsValue.toFixed(2)),
        totalAssets: Number(totalCapitalAndEquity.toFixed(2)),
      },
      liabilitiesAndEquity: {
        partnerCapital: Number(partnerCapital.toFixed(2)),
        capitalInterestSettledInCash: 0,
        retainedProfit: Number(retainedProfit.toFixed(2)),
        vendorPayables: totalLiabilities,
        totalLiabilities,
        totalCapitalAndEquity,
      },
      cashAdjustment: Number(cashAdjustment.toFixed(2)),
    });
  }

  /**
   * Verifies if Assets exactly equal Liabilities + Equity
   */
  isEquilibrium(): boolean {
    return (
      Math.abs(
        this.assets.totalAssets -
          this.liabilitiesAndEquity.totalCapitalAndEquity,
      ) < 0.01
    );
  }

  getNetWorth(): number {
    return (
      this.liabilitiesAndEquity.partnerCapital +
      this.liabilitiesAndEquity.retainedProfit
    );
  }

  getCashBalance(): number {
    return this.assets.cashBalance;
  }
}
