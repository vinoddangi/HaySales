import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SummaryBox } from './SummaryBox';

describe('SummaryBox Component', () => {
  it('renders children with compound SummaryBox.Row', () => {
    const html = renderToStaticMarkup(
      <SummaryBox>
        <SummaryBox.Row label="Total Rate:" value="₹12.50 / Kg" />
        <SummaryBox.Row label="Discount:" value="-₹500" sentiment="warning" />
        <SummaryBox.Row
          label="Total Balance:"
          value="₹5,000"
          sentiment="negative"
        />
      </SummaryBox>,
    );

    expect(html).toContain('Total Rate:');
    expect(html).toContain('₹12.50 / Kg');
    expect(html).toContain('Discount:');
    expect(html).toContain('-₹500');
    expect(html).toContain('Total Balance:');
    expect(html).toContain('₹5,000');
    expect(html).toContain('hs-summary-box');
  });

  it('renders items prop declaratively', () => {
    const html = renderToStaticMarkup(
      <SummaryBox
        items={[
          { label: 'Amount:', value: '₹10,000' },
          { label: 'Cash Paid:', value: '₹4,000', sentiment: 'positive' },
        ]}
      />,
    );

    expect(html).toContain('Amount:');
    expect(html).toContain('₹10,000');
    expect(html).toContain('Cash Paid:');
    expect(html).toContain('₹4,000');
  });

  it('renders custom children within SummaryBox.Row', () => {
    const html = renderToStaticMarkup(
      <SummaryBox>
        <SummaryBox.Row>
          <span>Custom Label</span>
          <span>Custom Value</span>
        </SummaryBox.Row>
      </SummaryBox>,
    );

    expect(html).toContain('Custom Label');
    expect(html).toContain('Custom Value');
  });
});
