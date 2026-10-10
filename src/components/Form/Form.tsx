import clsx from 'clsx';
import React from 'react';
import { Button, ButtonSize, ButtonVariant } from '../Button';
import { SummaryBox } from '../SummaryBox';
import { Text } from '../Text';
import './Form.css';
import {
  FieldValidator,
  FormContext,
  FormErrors,
  useForm,
  useFormContext,
  UseFormReturn,
} from './useForm';

export type FormGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FormSubmitProps {
  label?: string;
  submittingLabel?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export interface FormProps<
  T extends Record<string, any> = Record<string, any>,
> {
  form?: UseFormReturn<T>;
  initialValues?: T;
  validate?: (values: T) => boolean | FormErrors<T> | undefined;
  validateField?: <K extends keyof T>(
    key: K,
    value: T[K],
    values: T,
  ) => string | undefined;
  fieldValidators?: Partial<{
    [K in keyof T]: FieldValidator<T, K>;
  }>;
  onSubmit?: (values: T) => void | Promise<void>;
  onChange?: (values: T) => void;
  onDataChange?: <K extends keyof T>(key: K, value: T[K], allValues: T) => void;
  isSaving?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  submitFullWidth?: boolean;
  submitVariant?: ButtonVariant;
  gap?: FormGap;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  children: React.ReactNode | ((form: UseFormReturn<T>) => React.ReactNode);
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

export interface FormActionsProps {
  align?: 'start' | 'center' | 'end' | 'between';
  className?: string;
  children: React.ReactNode;
}

const FormFieldComponent: React.FC<FormFieldProps> = ({
  label,
  error,
  required = false,
  className = '',
  children,
}) => {
  return (
    <div className={clsx('hs-form__field', className)}>
      {label && (
        <Text variant="label-md" weight="medium" appearance="secondary">
          {label} {required && '*'}
        </Text>
      )}
      {children}
      {error && (
        <Text
          variant="label-sm"
          sentiment="negative"
          className="hs-form__error"
        >
          {error}
        </Text>
      )}
    </div>
  );
};

const FormActionsComponent: React.FC<FormActionsProps> = ({
  align = 'end',
  className = '',
  children,
}) => {
  const alignClass =
    align === 'start'
      ? 'justify-start'
      : align === 'center'
        ? 'justify-center'
        : align === 'between'
          ? 'justify-between'
          : 'justify-end';

  return (
    <div className={clsx('hs-form__actions', alignClass, className)}>
      {children}
    </div>
  );
};

export const FormSubmitComponent: React.FC<FormSubmitProps> = ({
  label = 'Submit',
  submittingLabel,
  variant = 'filled',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className,
  style,
  icon,
  children,
}) => {
  const form = useFormContext();
  const isSubmitting = form?.isSubmitting ?? false;
  const isValid = form?.isValid ?? true;

  const content =
    children ?? (isSubmitting ? submittingLabel || `${label}...` : label);

  return (
    <Button
      variant={variant}
      size={size}
      type="submit"
      fullWidth={fullWidth}
      disabled={disabled || isSubmitting || !isValid}
      className={className}
      style={style}
      icon={icon}
    >
      {content}
    </Button>
  );
};

/**
 * Universal Form component providing unified state, callbacks,
 * validation functions, and double-submission protection.
 */
export const FormComponent = <
  T extends Record<string, any> = Record<string, any>,
>({
  form: providedForm,
  initialValues = {} as T,
  validate,
  validateField,
  fieldValidators,
  onSubmit,
  onChange,
  onDataChange,
  isSaving = false,
  submitLabel,
  submittingLabel,
  submitFullWidth = false,
  submitVariant = 'filled',
  gap = 'md',
  className = '',
  style,
  id,
  children,
}: FormProps<T>): React.ReactElement => {
  const internalForm = useForm<T>({
    initialValues,
    validate,
    validateField,
    fieldValidators,
    onSubmit,
    onChange,
    onDataChange,
    isSaving,
  });

  const form = providedForm || internalForm;

  return (
    <FormContext.Provider value={form as UseFormReturn<any>}>
      <form
        id={id}
        className={clsx('hs-form', `hs-form--gap-${gap}`, className)}
        onSubmit={form.handleSubmit}
        style={style}
        noValidate
      >
        {typeof children === 'function' ? children(form) : children}
        {submitLabel && (
          <FormSubmitComponent
            label={submitLabel}
            submittingLabel={submittingLabel}
            fullWidth={submitFullWidth}
            variant={submitVariant}
          />
        )}
      </form>
    </FormContext.Provider>
  );
};

export const Form = Object.assign(FormComponent, {
  Field: FormFieldComponent,
  Actions: FormActionsComponent,
  Submit: FormSubmitComponent,
  Summary: SummaryBox,
});

export default Form;
