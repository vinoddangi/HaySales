import {
  ArrowDownLeft,
  Banknote,
  CreditCard,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Card, Text } from '../../../components/common';
import { Flex, Grid } from '../../../components/layout';
import { formatRupee, formatWeight } from '../../../utils/formatters';

export interface DashboardMetricsData {
  totalSalesAmount: number;
  totalSalesWeightKg: number;
  salesCount: number;
  totalPurchaseAmount: number;
  totalPurchaseWeightKg: number;
  purchasesCount: number;
  totalExpenseAmount: number;
  expensesCount: number;
  avgSalesRate: number;
  avgBuyRate: number;
  totalCashIn: number;
  totalCashOut: number;
  netCashflow: number;
  salesOnCredit: number;
  salesOnCash: number;
  servicesReceived?: number;
  servicesCount?: number;
  paymentsReceived: number;
  paymentsCount: number;
  purchaseOnCash: number;
  expensesOnCash: number;
}

export interface DashboardMetricCardsProps {
  metrics: DashboardMetricsData;
  isLoading?: boolean;
}

export const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({
  metrics,
  isLoading,
}) => {
  const navigate = useNavigate();
  const totalSales = metrics.totalSalesAmount;
  const cashPercentage =
    totalSales > 0 ? (metrics.salesOnCash / totalSales) * 100 : 0;
  const creditPercentage =
    totalSales > 0 ? (metrics.salesOnCredit / totalSales) * 100 : 0;

  if (isLoading) {
    return (
      <Grid columns={1} smColumns={2} gap="md">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container-low"
          />
        ))}
      </Grid>
    );
  }

  return (
    <Flex direction="column" gap="md" fullWidth>
      {/* Row 1: Top Main Cards (Max 2 cards: Total Sales & Total Purchases) */}
      <Grid columns={1} smColumns={2} gap="md" fullWidth>
        {/* Total Sales Card */}
        <Card
          variant="elevated"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/activity?category=SALES')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activity?category=SALES');
            }
          }}
          className="group relative cursor-pointer overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.08] to-m3-surface-container-low p-4 transition-all duration-200 hover:scale-[1.01] hover:border-emerald-500/60 hover:shadow-md active:scale-[0.99] dark:from-emerald-500/[0.12]"
        >
          <Flex align="center" justify="between">
            <Text
              styleAs="label"
              sentiment="positive"
              uppercase
              className="group-hover:underline"
            >
              Total Sales
            </Text>
            <div className="rounded-full bg-emerald-500/20 p-2 text-emerald-600 transition-transform group-hover:scale-110 dark:text-emerald-300">
              <TrendingUp className="h-4 w-4" />
            </div>
          </Flex>
          <div className="mt-2">
            <Text
              styleAs="display2"
              weight="black"
              appearance="primary"
              as="div"
            >
              {formatRupee(metrics.totalSalesAmount)}
            </Text>
            <Flex wrap align="center" gap="sm" className="mt-1">
              <Text styleAs="caption" appearance="secondary">
                {formatWeight(metrics.totalSalesWeightKg)}
              </Text>
              <Text styleAs="caption" appearance="secondary">
                •
              </Text>
              <Text styleAs="caption" appearance="secondary">
                {metrics.salesCount} Invoices
              </Text>
            </Flex>
            {/* Avg Selling Rate Badge */}
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-emerald-500/10 px-2 py-1 dark:bg-emerald-500/15">
              <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
                Avg Rate:
              </span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                {metrics.avgSalesRate > 0
                  ? `₹${metrics.avgSalesRate.toFixed(2)} /kg`
                  : '₹0.00 /kg'}
              </span>
            </div>
          </div>
        </Card>

        {/* Total Purchases Card */}
        <Card
          variant="elevated"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/activity?category=PURCHASES_EXPENSES')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activity?category=PURCHASES_EXPENSES');
            }
          }}
          className="group relative cursor-pointer overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-m3-surface-container-low p-4 transition-all duration-200 hover:scale-[1.01] hover:border-amber-500/60 hover:shadow-md active:scale-[0.99] dark:from-amber-500/[0.12]"
        >
          <Flex align="center" justify="between">
            <Text
              styleAs="label"
              sentiment="warning"
              uppercase
              className="group-hover:underline"
            >
              Total Purchases
            </Text>
            <div className="rounded-full bg-amber-500/20 p-2 text-amber-600 transition-transform group-hover:scale-110 dark:text-amber-300">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </Flex>
          <div className="mt-2">
            <Text
              styleAs="display2"
              weight="black"
              appearance="primary"
              as="div"
            >
              {formatRupee(metrics.totalPurchaseAmount)}
            </Text>
            <Flex wrap align="center" gap="sm" className="mt-1">
              <Text styleAs="caption" appearance="secondary">
                {formatWeight(metrics.totalPurchaseWeightKg)}
              </Text>
              <Text styleAs="caption" appearance="secondary">
                •
              </Text>
              <Text styleAs="caption" appearance="secondary">
                {metrics.purchasesCount} Orders
              </Text>
            </Flex>
            {/* Avg Buy Rate Badge */}
            <div className="mt-2.5 flex items-center justify-between rounded-lg bg-amber-500/10 px-2 py-1 dark:bg-amber-500/15">
              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-200">
                Avg Rate:
              </span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                {metrics.avgBuyRate > 0
                  ? `₹${metrics.avgBuyRate.toFixed(2)} /kg`
                  : '₹0.00 /kg'}
              </span>
            </div>
          </div>
        </Card>
      </Grid>

      {/* Row 2: Sales Breakdown (Max 2 cards: Sales on Cash & Sales on Credit) */}
      <Grid columns={2} gap="md" fullWidth>
        {/* Sales on Cash */}
        <Card
          variant="outlined"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/activity?category=SALES&nature=CASH')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activity?category=SALES&nature=CASH');
            }
          }}
          className="group cursor-pointer border-teal-500/30 bg-teal-500/[0.05] p-3.5 transition-all duration-200 hover:scale-[1.01] hover:border-teal-500/60 hover:shadow-md active:scale-[0.99] dark:bg-teal-500/[0.08]"
        >
          <Flex align="center" justify="between">
            <Flex
              align="center"
              gap="xs"
              className="text-teal-600 dark:text-teal-400"
            >
              <Banknote className="h-4 w-4 transition-transform group-hover:scale-110" />
              <Text
                styleAs="label"
                sentiment="positive"
                uppercase
                className="group-hover:underline"
              >
                Sales on Cash
              </Text>
            </Flex>
            <Badge sentiment="positive" size="sm">
              {cashPercentage.toFixed(0)}%
            </Badge>
          </Flex>
          <Text
            styleAs="h2"
            weight="extrabold"
            appearance="primary"
            className="mt-2 block"
          >
            {formatRupee(metrics.salesOnCash)}
          </Text>
          <Text
            styleAs="caption"
            appearance="secondary"
            className="mt-0.5 block"
          >
            Direct cash received
          </Text>
        </Card>

        {/* Sales on Credit */}
        <Card
          variant="outlined"
          role="button"
          tabIndex={0}
          onClick={() => navigate('/activity?category=SALES&nature=CREDIT')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/activity?category=SALES&nature=CREDIT');
            }
          }}
          className="group cursor-pointer border-purple-500/30 bg-purple-500/[0.05] p-3.5 transition-all duration-200 hover:scale-[1.01] hover:border-purple-500/60 hover:shadow-md active:scale-[0.99] dark:bg-purple-500/[0.08]"
        >
          <Flex align="center" justify="between">
            <Flex
              align="center"
              gap="xs"
              className="text-purple-600 dark:text-purple-400"
            >
              <CreditCard className="h-4 w-4 transition-transform group-hover:scale-110" />
              <Text
                styleAs="label"
                sentiment="accent"
                uppercase
                className="group-hover:underline"
              >
                Sales on Credit
              </Text>
            </Flex>
            <Badge sentiment="credit" size="sm">
              {creditPercentage.toFixed(0)}%
            </Badge>
          </Flex>
          <Text
            styleAs="h2"
            weight="extrabold"
            appearance="primary"
            className="mt-2 block"
          >
            {formatRupee(metrics.salesOnCredit)}
          </Text>
          <Text
            styleAs="caption"
            appearance="secondary"
            className="mt-0.5 block"
          >
            Credit given to buyers
          </Text>
        </Card>
      </Grid>

      {/* Row 3: Merged Net Cashflow & Payments Summary Card */}
      <Card
        variant="filled"
        className="border border-m3-outline-variant/60 bg-m3-surface-container p-3.5"
      >
        <Flex direction="column" gap="xs" fullWidth>
          {/* Main Net Cashflow Header */}
          <Flex align="center" justify="between" fullWidth>
            <Flex align="center" gap="sm">
              <div className="rounded-lg bg-m3-primary/10 p-2 text-m3-primary">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <Text
                  styleAs="label"
                  appearance="primary"
                  uppercase
                  className="block"
                >
                  Net Cashflow
                </Text>
                <Text
                  styleAs="caption"
                  appearance="secondary"
                  className="block text-[11px]"
                >
                  Cash In − Cash Out
                </Text>
              </div>
            </Flex>
            <div className="text-right">
              <Text
                styleAs="h2"
                weight="black"
                sentiment={metrics.netCashflow >= 0 ? 'positive' : 'negative'}
                className="block"
              >
                {formatRupee(metrics.netCashflow)}
              </Text>
            </div>
          </Flex>

          {/* Compact Cash In & Out Pills with Dedicated Sub-Lines */}
          <div className="mt-1 grid grid-cols-2 gap-2.5">
            {/* Cash In Details */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/activity?category=PAYMENTS')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/activity?category=PAYMENTS');
                }
              }}
              className="cursor-pointer rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-2.5 transition-all hover:bg-emerald-500/[0.15]"
            >
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Cash In
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                  {formatRupee(metrics.totalCashIn)}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[10px]">
                <div className="flex items-center justify-between text-m3-on-surface-variant">
                  <span>Recvd:</span>
                  <span className="font-semibold text-m3-on-surface">
                    {formatRupee(metrics.paymentsReceived)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-m3-on-surface-variant">
                  <span>Cash Sales:</span>
                  <span className="font-semibold text-m3-on-surface">
                    {formatRupee(metrics.salesOnCash)}
                  </span>
                </div>
                {(metrics.servicesReceived ?? 0) > 0 && (
                  <div className="flex items-center justify-between text-m3-on-surface-variant">
                    <span>Service:</span>
                    <span className="font-semibold text-m3-on-surface">
                      {formatRupee(metrics.servicesReceived || 0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cash Out Details */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate('/activity?category=PURCHASES_EXPENSES')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/activity?category=PURCHASES_EXPENSES');
                }
              }}
              className="cursor-pointer rounded-xl border border-amber-500/20 bg-amber-500/[0.08] p-2.5 transition-all hover:bg-amber-500/[0.15]"
            >
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Cash Out
                </span>
                <span className="text-xs font-black text-amber-700 dark:text-amber-400">
                  {formatRupee(metrics.totalCashOut)}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5 text-[10px]">
                <div className="flex items-center justify-between text-m3-on-surface-variant">
                  <span>Purchase:</span>
                  <span className="font-semibold text-m3-on-surface">
                    {formatRupee(metrics.purchaseOnCash)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-m3-on-surface-variant">
                  <span>Expense:</span>
                  <span className="font-semibold text-m3-on-surface">
                    {formatRupee(metrics.expensesOnCash)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Flex>
      </Card>
    </Flex>
  );
};
