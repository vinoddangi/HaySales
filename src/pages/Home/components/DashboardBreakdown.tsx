import { Layers, PieChart } from 'lucide-react';
import React from 'react';
import { Badge, Card, Text } from '../../../components/common';
import { Flex } from '../../../components/layout';
import { formatRupee, formatWeight } from '../../../utils/formatters';

export interface ItemBreakdownItem {
  item: string;
  amount: number;
  weightKg: number;
  count: number;
  stockKg?: number;
  avgBuyRate?: number;
}

export interface DashboardBreakdownProps {
  itemBreakdown: ItemBreakdownItem[];
  totalSales: number;
  salesOnCash: number;
  salesOnCredit: number;
}

export const DashboardBreakdown: React.FC<DashboardBreakdownProps> = ({
  itemBreakdown,
  totalSales,
  salesOnCash,
  salesOnCredit,
}) => {
  const cashPct = totalSales > 0 ? (salesOnCash / totalSales) * 100 : 0;
  const creditPct = totalSales > 0 ? (salesOnCredit / totalSales) * 100 : 0;

  return (
    <Flex direction="column" gap="md" fullWidth>
      {/* Visual Cash vs Credit Distribution Bar */}
      {totalSales > 0 && (
        <Card
          variant="outlined"
          className="border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <Flex direction="column" gap="sm" fullWidth>
            <Flex align="center" justify="between" fullWidth>
              <Flex align="center" gap="xs">
                <PieChart className="h-4 w-4 text-m3-primary" />
                <Text styleAs="h4" appearance="primary" weight="bold">
                  Sales Settlement Split
                </Text>
              </Flex>
              <Text styleAs="label" appearance="secondary" weight="normal">
                Total: {formatRupee(totalSales)}
              </Text>
            </Flex>

            {/* Dual-color Progress Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-m3-surface-container-highest">
              <div
                style={{ width: `${cashPct}%` }}
                className="bg-teal-500 transition-all duration-500"
                title={`Cash: ${cashPct.toFixed(1)}%`}
              />
              <div
                style={{ width: `${creditPct}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={`Credit: ${creditPct.toFixed(1)}%`}
              />
            </div>

            <Flex align="center" justify="between" fullWidth>
              <Flex align="center" gap="xs">
                <span className="h-2 w-2 rounded-full bg-teal-500" />
                <Text styleAs="label" sentiment="positive" weight="medium">
                  Cash: {formatRupee(salesOnCash)} ({cashPct.toFixed(0)}%)
                </Text>
              </Flex>
              <Flex align="center" gap="xs">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <Text styleAs="label" sentiment="accent" weight="medium">
                  Credit: {formatRupee(salesOnCredit)} ({creditPct.toFixed(0)}%)
                </Text>
              </Flex>
            </Flex>
          </Flex>
        </Card>
      )}

      {/* Item-wise Performance Breakdown */}
      {itemBreakdown.length > 0 && (
        <Card
          variant="outlined"
          className="border-m3-outline-variant bg-m3-surface-container-low p-3.5"
        >
          <Flex direction="column" gap="md" fullWidth>
            <Flex align="center" justify="between" fullWidth>
              <Flex align="center" gap="xs">
                <Layers className="h-4 w-4 text-m3-primary" />
                <Text styleAs="h4" appearance="primary" weight="bold">
                  Crop / Item Sales & Stock
                </Text>
              </Flex>
              <Text styleAs="label" appearance="secondary">
                {itemBreakdown.length} Products
              </Text>
            </Flex>

            <Flex direction="column" gap="sm" fullWidth>
              {itemBreakdown.map((item) => {
                const itemPct =
                  totalSales > 0 ? (item.amount / totalSales) * 100 : 0;
                const avgRate =
                  item.weightKg > 0 ? item.amount / item.weightKg : 0;

                return (
                  <div
                    key={item.item}
                    className="rounded-lg border border-m3-outline-variant/50 bg-m3-surface p-2.5"
                  >
                    <Flex align="center" justify="between" fullWidth>
                      <Text
                        styleAs="body-sm"
                        appearance="primary"
                        weight="bold"
                      >
                        {item.item}
                      </Text>
                      <Text
                        styleAs="body-sm"
                        appearance="primary"
                        weight="black"
                      >
                        {formatRupee(item.amount)}
                      </Text>
                    </Flex>

                    <Flex
                      wrap
                      align="center"
                      justify="between"
                      gap="xs"
                      className="mt-1"
                    >
                      <Text
                        styleAs="label"
                        appearance="secondary"
                        weight="normal"
                      >
                        Sold: {formatWeight(item.weightKg)} • Avg: ₹
                        {avgRate.toFixed(2)}/kg
                      </Text>
                      {item.stockKg !== undefined && (
                        <Badge sentiment="info" size="sm">
                          Stock: {formatWeight(item.stockKg)}
                        </Badge>
                      )}
                    </Flex>

                    {item.avgBuyRate !== undefined && item.avgBuyRate > 0 && (
                      <Text
                        styleAs="caption"
                        appearance="secondary"
                        weight="medium"
                        className="mt-0.5 block"
                      >
                        Avg Buying: ₹{item.avgBuyRate.toFixed(2)}/kg
                      </Text>
                    )}

                    {/* Progress Line */}
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-m3-surface-container-highest">
                      <div
                        style={{ width: `${itemPct}%` }}
                        className="h-full rounded-full bg-m3-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </Flex>
          </Flex>
        </Card>
      )}
    </Flex>
  );
};
