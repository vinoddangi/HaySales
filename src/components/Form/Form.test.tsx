import { renderHook, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { Form, useForm, useFormContext } from './index';

describe('Form Component and useForm Hook', () => {
  describe('useForm Hook', () => {
    it('manages key-value form state and triggers change callbacks', () => {
      const onDataChange = vi.fn();
      const onChange = vi.fn();

      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: 'Wheat', weight: 100 },
          onDataChange,
          onChange,
        }),
      );

      expect(result.current.values.name).toBe('Wheat');
      expect(result.current.values.weight).toBe(100);
      expect(result.current.getValue('name')).toBe('Wheat');

      act(() => {
        result.current.setValue('weight', 250);
      });

      expect(result.current.values.weight).toBe(250);
      expect(onDataChange).toHaveBeenCalledWith('weight', 250, {
        name: 'Wheat',
        weight: 250,
      });
      expect(onChange).toHaveBeenCalledWith({
        name: 'Wheat',
        weight: 250,
      });
    });

    it('validates with custom validation function and reports isValid', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { amount: 0, crop: '' },
          validate: (vals) => Boolean(vals.amount > 0 && vals.crop.length > 0),
        }),
      );

      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.setValue('crop', 'Mustard');
      });
      expect(result.current.isValid).toBe(false);

      act(() => {
        result.current.setValue('amount', 5000);
      });
      expect(result.current.isValid).toBe(true);
    });

    it('handles field-level validation and errors', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { price: 0 },
          fieldValidators: {
            price: (val) => (val > 0 ? undefined : 'Price must be positive'),
          },
        }),
      );

      act(() => {
        result.current.setValue('price', -5);
      });

      expect(result.current.hasError('price')).toBe(true);
      expect(result.current.getError('price')).toBe('Price must be positive');
      expect(result.current.isValidField('price')).toBe(false);

      act(() => {
        result.current.setValue('price', 20);
      });

      expect(result.current.hasError('price')).toBe(false);
      expect(result.current.getError('price')).toBeUndefined();
      expect(result.current.isValidField('price')).toBe(true);
    });

    it('prevents double submission and respects isSaving / in-flight states', async () => {
      const onSubmit = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 50)),
        );

      const { result } = renderHook(() =>
        useForm({
          initialValues: { amount: 100 },
          validate: (vals) => vals.amount > 0,
          onSubmit,
        }),
      );

      let promise1: Promise<void>;
      let promise2: Promise<void>;

      await act(async () => {
        promise1 = result.current.handleSubmit();
        promise2 = result.current.handleSubmit();
        await Promise.all([promise1, promise2]);
      });

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ amount: 100 });
    });

    it('resets to initial values', () => {
      const { result } = renderHook(() =>
        useForm({
          initialValues: { name: 'Initial', count: 1 },
        }),
      );

      act(() => {
        result.current.setValue('name', 'Changed');
        result.current.setValue('count', 99);
      });

      expect(result.current.values.name).toBe('Changed');

      act(() => {
        result.current.reset();
      });

      expect(result.current.values.name).toBe('Initial');
      expect(result.current.values.count).toBe(1);
    });
  });

  describe('Form Component', () => {
    it('renders form wrapper with M3 gap classes and children', () => {
      const html = renderToStaticMarkup(
        <Form gap="lg" className="custom-form-class">
          <Form.Field label="Customer Name" required>
            <input name="customer" />
          </Form.Field>
          <Form.Actions>
            <button type="submit">Submit</button>
          </Form.Actions>
        </Form>,
      );

      expect(html).toContain('hs-form');
      expect(html).toContain('hs-form--gap-lg');
      expect(html).toContain('custom-form-class');
      expect(html).toContain('hs-form__field');
      expect(html).toContain('Customer Name *');
      expect(html).toContain('hs-form__actions');
      expect(html).toContain('Submit');
    });

    it('renders with render props exposing form methods', () => {
      const html = renderToStaticMarkup(
        <Form initialValues={{ crop: 'Bajra' }}>
          {(form) => <span>Current crop: {form.values.crop}</span>}
        </Form>,
      );

      expect(html).toContain('Current crop: Bajra');
    });

    it('provides form context to nested child components', () => {
      const ChildComponent = () => {
        const form = useFormContext<{ crop: string }>();
        return <span>Context crop: {form.values.crop}</span>;
      };

      const html = renderToStaticMarkup(
        <Form initialValues={{ crop: 'Mustard' }}>
          <ChildComponent />
        </Form>,
      );

      expect(html).toContain('Context crop: Mustard');
    });

    it('renders field errors with semantic negative sentiment', () => {
      const html = renderToStaticMarkup(
        <Form.Field label="Weight" error="Weight cannot be zero">
          <input />
        </Form.Field>,
      );

      expect(html).toContain('Weight cannot be zero');
      expect(html).toContain('text--sentiment-negative');
      expect(html).toContain('hs-form__error');
    });
  });
});
