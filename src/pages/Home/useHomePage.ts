import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  calculateBalanceSheet,
  calculateCustomerOutstandingMetrics,
  calculateExpectedProfit,
  filterTransactionsByTimeline,
  getOpeningStockForMonth,
} from '../../business';
import {
  CustomerTransactionData,
  INITIAL_ASSETS,
  INITIAL_CAPITAL,
  INITIAL_LIABILITIES,
  INITIAL_RETAINED_PROFIT,
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
} from '../../store/slices/customersApi';
import {
  FilterPeriodMode,
  setFilterMode,
  setSelectedMonth,
  setSelectedYear,
} from '../../store/slices/uiSlice';
import { MONTH_NAMES } from '../../utils/formatters';

export function useHomePage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // 1. Redux UI state
  const filterMode = useAppSelector((state) => state.ui.filterMode);
  const selectedMonth = useAppSelector((state) => state.ui.selectedMonth);
  const selectedYear = useAppSelector((state) => state.ui.selectedYear);

  // 2. Redux Stock state: Opening inventory derived from previous month's closing stock
  const openingStock = useAppSelector((state) =>
    getOpeningStockForMonth(state.stock, selectedYear, selectedMonth + 1),
  );

  // 3. API queries
  const { data: customers = [], isLoading: isLoadingCustomers } =
    useGetCustomersQuery();
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

  // 9. Profit Metrics via Business Layer
  const profitMetrics = useMemo(() => {
    const profitSummary = calculateExpectedProfit(
      filteredTransactions,
      openingStock,
    );
    const cumulativeProfitSummary = calculateExpectedProfit(
      allTransactions,
      openingStock,
    );

    const netProfit = profitSummary.netOperatingProfit;
    const profitMarginPct =
      salesMetrics.totalAmount > 0
        ? (netProfit / salesMetrics.totalAmount) * 100
        : 0;

    return {
      netProfit,
      profitMarginPct,
      grossCommission: profitSummary.commission.totalGrossCommissionProfit,
      pickupNet: profitSummary.service.netServiceProfit,
      operatingExpenses: profitSummary.operatingExpenses,
      cumulativeProfit: cumulativeProfitSummary.netOperatingProfit,
      totalClosingStock: profitSummary.commission.totalClosingStock,
    };
  }, [
    filteredTransactions,
    allTransactions,
    openingStock,
    salesMetrics.totalAmount,
  ]);

  // 10. Customer Outstanding Metrics via Business Layer
  const customerOutstandingMetrics = useMemo(() => {
    return calculateCustomerOutstandingMetrics(
      customers,
      customerTxs as CustomerTransactionData[],
      filteredTransactions,
      timeline,
    );
  }, [customers, customerTxs, filteredTransactions, timeline]);

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
    const netCashflow = Number((totalCashIn - totalCashOut).toFixed(2));

    return {
      netCashflow,
      totalCashIn: Number(totalCashIn.toFixed(2)),
      paymentsReceived: Number(paymentsReceived.toFixed(2)),
      salesOnCash: Number(salesOnCash.toFixed(2)),
      servicesReceived: Number(servicesReceived.toFixed(2)),
      totalCashOut: Number(totalCashOut.toFixed(2)),
      purchaseOnCash: Number(purchaseOnCash.toFixed(2)),
      expensesOnCash: Number(expensesOnCash.toFixed(2)),
    };
  }, [filteredTransactions, salesMetrics.salesOnCash]);

  // 12. Balance Sheet & Cash in Hand Metrics
  const balanceSheetMetrics = useMemo(() => {
    const partnerCapital =
      (INITIAL_CAPITAL.capital_vinod?.principalCapital || 1500000) +
      (INITIAL_LIABILITIES.loan_partner_vinod?.amount || 750000); // Baseline ₹2,250,000

    const retainedProfit =
      INITIAL_RETAINED_PROFIT + profitMetrics.cumulativeProfit;

    const customerReceivables = customerOutstandingMetrics.totalOutstanding;
    const closingStockValue = profitMetrics.totalClosingStock.amount;

    const fixedAssetsList = Object.values(INITIAL_ASSETS);

    const bsResult = calculateBalanceSheet({
      partnerCapital,
      retainedProfit,
      customerReceivables,
      closingStockValue,
      fixedAssets: fixedAssetsList,
      loansAndLiabilities: 0,
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
  }, [profitMetrics, customerOutstandingMetrics.totalOutstanding]);

  // 13. Period Label
  const periodLabel = useMemo(() => {
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
    customerOutstandingMetrics,
    cashflowMetrics,
    balanceSheetMetrics,
    allTransactions,
    handleFilterModeChange,
    handleMonthChange,
    handleYearChange,
    handleNavigate,
    handleNewSale,
  };
}

export default useHomePage;
