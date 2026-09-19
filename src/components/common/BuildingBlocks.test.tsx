import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Badge,
  Input,
  SelectField,
  SummaryBox,
  SummaryRow,
  Text,
} from './index';

describe('Common Building Block Components (Salt DS Inspired)', () => {
  describe('Input', () => {
    it('renders input with label and handles error', () => {
      render(<Input label="Test Input" error="Required field" />);
      expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
      expect(screen.getByText('Required field')).toBeInTheDocument();
    });
  });

  describe('SelectField', () => {
    it('renders select with options and label', () => {
      const options = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ];
      render(<SelectField label="Test Select" options={options} />);
      expect(screen.getByLabelText('Test Select')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders badge with sentiment and appearance', () => {
      render(
        <Badge sentiment="positive" appearance="subtle">
          Cash Paid
        </Badge>,
      );
      expect(screen.getByText('Cash Paid')).toBeInTheDocument();
    });

    it('renders badge with solid appearance', () => {
      render(
        <Badge sentiment="negative" appearance="solid">
          Overdue
        </Badge>,
      );
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });
  });

  describe('Text', () => {
    it('renders text with styleAs, sentiment, and appearance', () => {
      render(
        <Text styleAs="label" appearance="secondary" uppercase>
          Sales Rate (Avg)
        </Text>,
      );
      const textEl = screen.getByText('Sales Rate (Avg)');
      expect(textEl).toBeInTheDocument();
      expect(textEl).toHaveClass('uppercase');
    });

    it('renders typography heading with sentiment and weight', () => {
      render(
        <Text styleAs="h2" sentiment="positive" weight="black">
          ₹15,000
        </Text>,
      );
      expect(screen.getByText('₹15,000')).toBeInTheDocument();
    });
  });

  describe('SummaryBox & SummaryRow', () => {
    it('renders summary box with rows', () => {
      render(
        <SummaryBox>
          <SummaryRow label="Subtotal" value="₹1,000" />
          <SummaryRow label="Grand Total" value="₹1,000" isTotal isHighlight />
        </SummaryBox>,
      );
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getAllByText('₹1,000')).toHaveLength(2);
    });
  });
});
