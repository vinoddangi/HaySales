import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  calculateBalanceSheet,
  CropCommissionProfitResult,
  filterTransactionsByTimeline,
  getFixedAssetsForPeriod,
  getPartnerCapitalForPeriod,
  getPartnerLoanForPeriod,
  getProfitDistributionForPeriod,
} from '../../business';
import {
  CustomerTransactionData,
  isExpenseTransaction,
  isPaymentTransaction,
  isPurchaseTransaction,
  isSaleTransaction,
  isServiceTransaction,
  OperationsTransactionData,
  Transaction,
} from '../../models';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  useGetCustomersQuery,
  useGetCustomerTransactionsQuery,
  useGetOperationTransactionsQuery,
} from '../../store/api';
import {
  FilterPeriodMode,
  setFilterMode,
  setSelectedMonth,
  setSelectedYear,
} from '../../store/slices/timelineSlice';
import {
  selectCustomerOutstandingMetrics,
  selectEstimatedProfitMetrics,
  selectPeriodExpectedProfitSummary,
} from '../../store/selectors';
import { MONTH_NAMES } from '../../utils/formatters';

export function useHomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 1. Redux Timeline state
  const filterMode = useAppSelector((state) => state.timeline.filterMode);
  const selectedMonth = useAppSelector((state) => state.timeline.selectedMonth);
  const selectedYear = useAppSelector((state) => state.timeline.selectedYear);

  // 2. Profit & Stock Selectors (Continuous Monthly Stock Rolling & Commission calculation)
  const profitMetrics = useAppSelector(selectEstimatedProfitMetrics);
  const periodProfitSummary = useAppSelector(selectPeriodExpectedProfitSummary);

  // 3. API queries
  const { isLoading: isLoadingCustomers } = useGetCustomersQuery();
  const { data: customerTxs = [], isLoading: isLoadingCustomerTxs } =
    useGetCustomerTransactionsQuery(undefined);
  const { data: operationTxs = [], isLoading: isLoadingOperationTxs } =
    useGetOperationTransactionsQuery();

  const isLoading =
    isLoadingCustomers || isLoadingCustomerTxs || isLoadingOperationTxs;

  // 4. Combine all transactions
  const allTransactions: Transaction[] = useMemo(() => {
    return [
      ...(customerTxs as CustomerTransactionData[]),
      ...(operationTxs as OperationsTransactionData[]),
    ];
  }, [customerTxs, operationTxs]);

  // 5. Timeline filter object
  const timeline = useMemo(
    () => ({
      selectedYear,
      selectedMonth,
      filterMode,
    }),
    [selectedYear, selectedMonth, filterMode],
  );

  // 6. Filter transactions for active period
  const filteredTransactions = useMemo(() => {
    return filterTransactionsByTimeline(allTransactions, timeline);
  }, [allTransactions, timeline]);

  // 7. Sales Metrics
  const salesMetrics = useMemo(() => {
    const sales = filteredTransactions.filter(isSaleTransaction);
    const totalAmount = sales.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0,
    );
    const totalWeight = sales.reduce(
      (sum, tx) => sum + Number(tx.weight || 0),
      0,
    );
    const salesOnCash = sales.reduce(
      (sum, tx) => sum + Number(tx.cashPaid || 0),
      0,
    );
    const salesOnCredit = sales.reduce(
      (sum, tx) =>
        sum +
        Number(
          tx.remainingDue !== undefined
            ? tx.remainingDue
            : Math.max(0, Number(tx.amount || 0) - Number(tx.cashPaid || 0)),
        ),
      0,
    );
    const avgRate =
      totalWeight > 0 ? Number((totalAmount / totalWeight).toFixed(2)) : 0;
    const cashPercentage =
      totalAmount > 0 ? (salesOnCash / totalAmount) * 100 : 0;
    const creditPercentage =
      totalAmount > 0 ? (salesOnCredit / totalAmount) * 100 : 0;

    return {
      totalAmount,
      totalWeight,
      count: sales.length,
      avgRate,
      salesOnCash,
      salesOnCredit,
      cashPercentage,
      creditPercentage,
    };
  }, [filteredTransactions]);

  // 8. Purchase Metrics
  const purchaseMetrics = useMemo(() => {
    const purchases = filteredTransactions.filter(isPurchaseTransaction);
    const totalAmount = purchases.reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0,
    );
    const totalWeight = purchases.reduce(
      (sum, tx) => sum + Number(tx.weight || 0),
      0,
    );
    const avgRate =
      totalWeight > 0 ? Number((totalAmount / totalWeight).toFixed(2)) : 0;

    return {
      totalAmount,
      totalWeight,
      count: purchases.length,
      avgRate,
    };
  }, [filteredTransactions]);

  // 9. Stock Metrics derived from continuous monthly rolling profit summary
  const stockMetrics = useMemo(() => {
    const crops = Object.values(periodProfitSummary.commission.byCrop).filter(
      Boolean,
    ) as CropCommissionProfitResult[];

    return {
      totalClosingStock: periodProfitSummary.commission.totalClosingStock,
      totalOpeningStock: periodProfitSummary.commission.totalOpeningStock,
      totalPurchases: periodProfitSummary.commission.totalPurchases,
      totalSales: periodProfitSummary.commission.totalSales,
      totalCostOfGoodsSold: periodProfitSummary.commission.totalCostOfGoodsSold,
      totalGrossCommissionProfit:
        periodProfitSummary.commission.totalGrossCommissionProfit,
      crops,
    };
  }, [periodProfitSummary]);

  // 10. Customer Outstanding Metrics via Selector (Till-Date Transaction derivation)
  const customerOutstandingMetrics = useAppSelector(
    selectCustomerOutstandingMetrics,
  );

  // 11. Net Cashflow Metrics
  const cashflowMetrics = useMemo(() => {
    const paymentsReceived = filteredTransactions
      .filter(isPaymentTransaction)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const servicesReceived = filteredTransactions
      .filter(isServiceTransaction)
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const salesOnCash = salesMetrics.salesOnCash;
    const totalCashIn = paymentsReceived + salesOnCash + servicesReceived;

    const purchaseOnCash = filteredTransactions
      .filter(isPurchaseTransaction)
      .reduce((sum, tx) => sum + Number(tx.cashPaid || 0), 0);

    const expensesOnCash = filteredTransactions
      .filter(isExpenseTransaction)
      .reduce((sum, tx) => sum + Number(tx.cashPaid || tx.amount || 0), 0);

    const totalCashOut = purchaseOnCash + expensesOnCash;
    const netCashflow = Math.round(totalCashIn - totalCashOut);

    return {
      netCashflow,
      totalCashIn: Math.round(totalCashIn),
      paymentsReceived: Math.round(paymentsReceived),
      salesOnCash: Math.round(salesOnCash),
      servicesReceived: Math.round(servicesReceived),
      totalCashOut: Math.round(totalCashOut),
      purchaseOnCash: Math.round(purchaseOnCash),
      expensesOnCash: Math.round(expensesOnCash),
    };
  }, [filteredTransactions, salesMetrics.salesOnCash]);

  // 12. Balance Sheet & Cash in Hand Metrics
  const balanceSheetMetrics = useMemo(() => {
    const currentYearMonth =
      filterMode === 'all'
        ? '2026-08'
        : filterMode === 'ytd'
          ? `${selectedYear}-12`
          : `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;

    const partnerCapital = getPartnerCapitalForPeriod(currentYearMonth);
    const partnerLoan = getPartnerLoanForPeriod(currentYearMonth);
    const profitDistribution = getProfitDistributionForPeriod(currentYearMonth);

    const retainedProfit = profitMetrics.cumulativeProfit - profitDistribution;

    const customerReceivables = customerOutstandingMetrics.totalOutstanding;
    const closingStockValue = profitMetrics.totalClosingStock.amount;

    const fixedAssetsList = getFixedAssetsForPeriod(currentYearMonth);

    const bsResult = calculateBalanceSheet({
      partnerCapital,
      retainedProfit,
      customerReceivables,
      closingStockValue,
      fixedAssets: fixedAssetsList,
      loansAndLiabilities: partnerLoan,
      openingCashBalance: 0,
    });

    return {
      cashInHand: bsResult.assets.cashBalance,
      cashAdjustment: bsResult.cashAdjustment,
      customerReceivables: bsResult.assets.customerReceivables,
      closingStockValue: bsResult.assets.closingStockValue,
      fixedAssetsValue: bsResult.assets.totalFixedAssetsValue,
      totalAssets: bsResult.assets.totalAssets,
      totalLiabilities: bsResult.liabilitiesAndEquity.totalLiabilities,
      partnerCapital: bsResult.liabilitiesAndEquity.partnerCapital,
      retainedProfit: bsResult.liabilitiesAndEquity.retainedProfit,
    };
  }, [
    filterMode,
    selectedYear,
    selectedMonth,
    profitMetrics,
    customerOutstandingMetrics.totalOutstanding,
  ]);

  // 13. Period Label
  const periodLabel = useMemo(() => {
    if (filterMode === 'all') {
      return 'All Time';
    }
    if (filterMode === 'ytd') {
      return `YTD ${selectedYear}`;
    }
    return `${MONTH_NAMES[selectedMonth]} ${selectedYear}`;
  }, [filterMode, selectedMonth, selectedYear]);

  // 14. Action Handlers
  const handleFilterModeChange = (mode: FilterPeriodMode) => {
    dispatch(setFilterMode(mode));
  };

  const handleMonthChange = (month: number) => {
    dispatch(setSelectedMonth(month));
  };

  const handleYearChange = (year: number) => {
    dispatch(setSelectedYear(year));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleNewSale = () => {
    navigate('/sales');
  };

  return {
    isLoading,
    filterMode,
    selectedMonth,
    selectedYear,
    periodLabel,
    salesMetrics,
    purchaseMetrics,
    profitMetrics,
    stockMetrics,
    customerOutstandingMetrics,
    cashflowMetrics,
    balanceSheetMetrics,
    handleFilterModeChange,
    handleMonthChange,
    handleYearChange,
    handleNavigate,
    handleNewSale,
  };
}

export default useHomePage;
