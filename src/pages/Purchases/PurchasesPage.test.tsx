import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PurchaseFormCard, PurchasesOverviewMetricsCard } from './components';

describe('PurchasesPage Components', () => {
  it('renders PurchasesOverviewMetricsCard with formatted metrics', () => {
    const html = renderToStaticMarkup(
      <PurchasesOverviewMetricsCard
        totalPurchaseAmount={50000}
        totalPurchaseWeight={5000}
        totalExpenseAmount={5000}
        totalSoldWeight={3000}
        currentStock={2000}
        avgBuyRate={10}
      />,
    );

    expect(html).toContain('Purchases');
    expect(html).toContain('5,000 kg');
    expect(html).toContain('₹50,000');
    expect(html).toContain('Avg Buying Rate');
  });

  it('renders PurchaseFormCard form elements properly', () => {
    const onSubmit = vi.fn();
    const html = renderToStaticMarkup(
      <PurchaseFormCard isSaving={false} onSubmit={onSubmit} />,
    );

    expect(html).toContain('Record Stock Purchase');
    expect(html).toContain('Purchase Date');
    expect(html).toContain('Crop Type');
    expect(html).toContain('Weight (Kg)');
    expect(html).toContain('Purchase Amount (₹)');
  });
});
