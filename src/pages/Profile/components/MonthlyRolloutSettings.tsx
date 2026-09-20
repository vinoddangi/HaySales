import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { DEFAULT_ROLLED_OUT_MONTH, getNextMonthString } from '../../../api';
import { Button, Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { useAppDispatch } from '../../../store/hooks';
import {
  useGetMonthlyRolloutStatusQuery,
  useRolloutMonthMutation,
} from '../../../store/slices/customersApi';
import { showSnackbar } from '../../../store/slices/uiSlice';
import { formatRupee, formatWeight } from '../../../utils/formatters';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function formatMonthLabel(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [y, m] = monthStr.split('-');
  const mIdx = parseInt(m, 10) - 1;
  const name = MONTH_NAMES[mIdx] || m;
  return `${name} ${y}`;
}

export const MonthlyRolloutSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const { data: rolloutStatus } = useGetMonthlyRolloutStatusQuery();
  const [rolloutMonth, { isLoading }] = useRolloutMonthMutation();

  const lastRolledOutMonth =
    rolloutStatus?.lastRolledOutMonth || DEFAULT_ROLLED_OUT_MONTH;
  const nextTargetMonth = getNextMonthString(lastRolledOutMonth);
  const history = rolloutStatus?.history || [];

  const handleExecuteRollout = async () => {
    try {
      await rolloutMonth({
        month: nextTargetMonth,
      }).unwrap();
      setShowConfirm(false);
      dispatch(
        showSnackbar({
          message: `Successfully rolled out ${formatMonthLabel(nextTargetMonth)}!`,
        }),
      );
    } catch (err) {
      console.error('Monthly rollout error:', err);
      dispatch(
        showSnackbar({
          message: 'Error executing monthly rollout.',
        }),
      );
    }
  };

  const toggleExpand = (m: string) => {
    setExpandedMonth(expandedMonth === m ? null : m);
  };

  return (
    <div className="space-y-2">
      <Flex align="center" gap="xs" className="px-1">
        <TrendingUp className="h-3.5 w-3.5 text-m3-primary" />
        <Text styleAs="label" appearance="secondary" uppercase>
          Monthly Trading &amp; Rollout
        </Text>
      </Flex>

      <Card variant="outlined" className="space-y-3.5 p-4">
        <div className="space-y-1">
          <Flex align="center" gap="xs">
            <Calendar className="h-4 w-4 text-m3-primary" />
            <Text styleAs="body-sm" appearance="primary" weight="bold">
              Rollout Period Accounting
            </Text>
          </Flex>

          {/* Current Rollout Status Badge */}
          <div className="py-1">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Latest Closed Month: {formatMonthLabel(lastRolledOutMonth)}
            </span>
          </div>

          <Text
            styleAs="caption"
            appearance="secondary"
            className="block leading-relaxed"
          >
            Closes monthly stock accounts, reconciles cumulative P&amp;L, rolls
            forward ending stock and balances into the next trading period (
            <strong>{formatMonthLabel(nextTargetMonth)}</strong>), and unlocks
            transaction entry for following months.
          </Text>
        </div>

        {/* Action Trigger / Confirmation Box */}
        {showConfirm ? (
          <div className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <Flex align="start" gap="xs">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-700 dark:text-amber-300">
                  Confirm Monthly Rollout for{' '}
                  {formatMonthLabel(nextTargetMonth)}
                </p>
                <p className="text-m3-on-surface-variant">
                  This will finalize trading figures for{' '}
                  {formatMonthLabel(nextTargetMonth)} and update the active
                  rollout marker.
                </p>
              </div>
            </Flex>

            <Flex gap="sm" justify="end" fullWidth>
              <Button
                variant="outlined"
                onClick={() => setShowConfirm(false)}
                disabled={isLoading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                onClick={handleExecuteRollout}
                disabled={isLoading}
                className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 dark:bg-emerald-600"
              >
                {isLoading ? 'Processing...' : `Confirm Rollout`}
              </Button>
            </Flex>
          </div>
        ) : (
          <Button
            variant="outlined"
            onClick={() => setShowConfirm(true)}
            className="w-full justify-between text-xs font-semibold"
          >
            <span>
              Rollout Next Month ({formatMonthLabel(nextTargetMonth)})
            </span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Monthly Rollout History (Jan – Aug 2026) */}
        {history.length > 0 && (
          <div className="space-y-2 border-t border-m3-outline/20 pt-2">
            <Text styleAs="caption" appearance="primary" weight="bold">
              Rolled Out Months History ({history.length})
            </Text>

            <div className="space-y-1.5">
              {history.map((item) => {
                const isExpanded = expandedMonth === item.month;
                const summary = item.summary;

                return (
                  <div
                    key={item.month}
                    className="overflow-hidden rounded-lg border border-m3-outline/30 bg-m3-surface-container-low text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleExpand(item.month)}
                      className="flex w-full items-center justify-between p-2.5 text-left transition-colors hover:bg-m3-surface-container"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-m3-on-surface">
                          {formatMonthLabel(item.month)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {summary?.netProfit?.cm !== undefined && (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Profit: {formatRupee(summary.netProfit.cm)}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-m3-on-surface-variant" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-m3-on-surface-variant" />
                        )}
                      </div>
                    </button>

                    {isExpanded && summary && (
                      <div className="space-y-3 border-t border-m3-outline/20 bg-m3-surface-container p-3">
                        {/* Trading & Stock */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-m3-primary">
                            Stock &amp; Trading
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-m3-on-surface-variant">
                            <div>
                              Opening Stock:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatWeight(
                                  summary.openingStock?.weightKg || 0,
                                )}{' '}
                                (
                                {formatRupee(summary.openingStock?.amount || 0)}
                                )
                              </span>
                            </div>
                            <div>
                              Purchases:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatWeight(summary.purchases?.weightKg || 0)}{' '}
                                ({formatRupee(summary.purchases?.amount || 0)})
                              </span>
                            </div>
                            <div>
                              Sales:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatWeight(summary.sales?.weightKg || 0)} (
                                {formatRupee(summary.sales?.amount || 0)})
                              </span>
                            </div>
                            <div>
                              Closing Stock:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatWeight(
                                  summary.closingStock?.weightKg || 0,
                                )}{' '}
                                (
                                {formatRupee(summary.closingStock?.amount || 0)}
                                )
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Income & P&L Statement */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-m3-primary">
                            P&amp;L Breakdown
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-m3-on-surface-variant">
                            <div>
                              Gross Comm (CM):{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatRupee(
                                  summary.commission?.cm ||
                                    (summary as any).grossCommission?.cm ||
                                    0,
                                )}
                              </span>
                            </div>
                            <div>
                              Daalu Income:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatRupee(summary.daalu?.cm || 0)}
                              </span>
                            </div>
                            <div>
                              Expenses (CM):{' '}
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {formatRupee(summary.expenses?.cm || 0)}
                              </span>
                            </div>
                            <div>
                              Monthly Profit:{' '}
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatRupee(summary.netProfit?.cm || 0)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Balance Sheet Balances */}
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-m3-primary">
                            Balance Sheet
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px] text-m3-on-surface-variant">
                            <div>
                              Customer Lending:{' '}
                              <span className="font-semibold text-m3-on-surface">
                                {formatRupee(summary.lendingToCustomers || 0)}
                              </span>
                            </div>
                            <div>
                              Cash in Hand:{' '}
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatRupee(summary.cashBalance || 0)}
                              </span>
                            </div>
                            <div>
                              Cumulative Profit:{' '}
                              <span className="font-bold text-m3-primary">
                                {formatRupee(summary.netProfit?.total || 0)}
                              </span>
                            </div>
                            <div>
                              Total Capital:{' '}
                              <span className="font-bold text-m3-on-surface">
                                {formatRupee(summary.totalCapital || 0)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
