import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export type FieldValidator<T, K extends keyof T = keyof T> = (
  _value: T[K],
  _values: T,
) => string | undefined | boolean;

export interface UseFormOptions<T extends Record<string, any>> {
  initialValues: T;
  validate?: (_values: T) => boolean | FormErrors<T> | undefined;
  validateField?: <K extends keyof T>(
    _key: K,
    _value: T[K],
    _values: T,
  ) => string | undefined;
  fieldValidators?: Partial<{
    [K in keyof T]: FieldValidator<T, K>;
  }>;
  onSubmit?: (_values: T) => void | Promise<void>;
  onChange?: (_values: T) => void;
  onDataChange?: <K extends keyof T>(
    _key: K,
    _value: T[K],
    _allValues: T,
  ) => void;
  isSaving?: boolean;
}

export interface FormFieldRegistration<V> {
  value: V;
  onChange: (_value: V) => void;
  error: boolean;
  errorText: string | undefined;
}

export interface UseFormReturn<T extends Record<string, any>> {
  values: T;
  errors: FormErrors<T>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  getValue: <K extends keyof T>(_key: K) => T[K];
  setValue: <K extends keyof T>(_key: K, _value: T[K]) => void;
  setValues: (_newValues: Partial<T> | ((_prev: T) => T)) => void;
  getError: (_key: keyof T) => string | undefined;
  hasError: (_key: keyof T) => boolean;
  setFieldError: (_key: keyof T, _error: string | undefined) => void;
  setTouched: (_key: keyof T, _isTouched?: boolean) => void;
  validate: () => boolean;
  validateField: <K extends keyof T>(_key: K) => boolean;
  isValidField: (_key: keyof T) => boolean;
  handleSubmit: (_e?: React.FormEvent) => Promise<void>;
  reset: (_newValues?: Partial<T>) => void;
  register: <K extends keyof T>(_key: K) => FormFieldRegistration<T[K]>;
}

export const FormContext = createContext<UseFormReturn<any> | null>(null);

export function useFormContext<
  T extends Record<string, any> = Record<string, any>,
>(): UseFormReturn<T> {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useFormContext must be used within a <Form> component');
  }
  return context as UseFormReturn<T>;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validate: customValidate,
  validateField: customValidateField,
  fieldValidators,
  onSubmit,
  onChange,
  onDataChange,
  isSaving = false,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [touched, setTouchedState] = useState<
    Partial<Record<keyof T, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const initialValuesRef = useRef<T>(initialValues);
  const isSubmittingRef = useRef<boolean>(false);
  const valuesRef = useRef<T>(values);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const runFieldValidation = useCallback(
    <K extends keyof T>(
      key: K,
      val: T[K],
      currentValues: T,
    ): string | undefined => {
      if (fieldValidators && fieldValidators[key]) {
        const result = fieldValidators[key]!(val, currentValues);
        if (typeof result === 'string') return result;
        if (result === false) return 'Invalid field value';
      }
      if (customValidateField) {
        return customValidateField(key, val, currentValues);
      }
      return undefined;
    },
    [customValidateField, fieldValidators],
  );

  const runFormValidation = useCallback(
    (currentValues: T): { isValid: boolean; errors: FormErrors<T> } => {
      const nextErrors: FormErrors<T> = {};
      let valid = true;

      if (fieldValidators) {
        for (const key of Object.keys(fieldValidators) as (keyof T)[]) {
          const fieldErr = runFieldValidation(
            key,
            currentValues[key],
            currentValues,
          );
          if (fieldErr) {
            nextErrors[key] = fieldErr;
            valid = false;
          }
        }
      }

      if (customValidate) {
        const result = customValidate(currentValues);
        if (typeof result === 'boolean') {
          if (!result) valid = false;
        } else if (result && typeof result === 'object') {
          for (const [k, err] of Object.entries(result)) {
            if (err) {
              nextErrors[k as keyof T] = err as string;
              valid = false;
            }
          }
        }
      }

      return { isValid: valid, errors: nextErrors };
    },
    [customValidate, fieldValidators, runFieldValidation],
  );

  const isValid = useMemo(() => {
    return runFormValidation(values).isValid;
  }, [runFormValidation, values]);

  const getValue = useCallback(<K extends keyof T>(key: K): T[K] => {
    return valuesRef.current[key];
  }, []);

  const setValue = useCallback(
    <K extends keyof T>(key: K, val: T[K]) => {
      setValuesState((prev) => {
        const next = { ...prev, [key]: val };
        valuesRef.current = next;

        onDataChange?.(key, val, next);
        onChange?.(next);

        const fieldErr = runFieldValidation(key, val, next);
        setErrors((prevErr) => ({
          ...prevErr,
          [key]: fieldErr,
        }));

        return next;
      });
    },
    [onChange, onDataChange, runFieldValidation],
  );

  const setValues = useCallback(
    (newValues: Partial<T> | ((_prev: T) => T)) => {
      setValuesState((prev) => {
        const next =
          typeof newValues === 'function'
            ? newValues(prev)
            : { ...prev, ...newValues };
        valuesRef.current = next;

        onChange?.(next);

        const { errors: nextErrors } = runFormValidation(next);
        setErrors(nextErrors);

        return next;
      });
    },
    [onChange, runFormValidation],
  );

  const getError = useCallback(
    (key: keyof T): string | undefined => {
      return errors[key];
    },
    [errors],
  );

  const hasError = useCallback(
    (key: keyof T): boolean => {
      return Boolean(errors[key]);
    },
    [errors],
  );

  const isValidField = useCallback(
    (key: keyof T): boolean => {
      return !errors[key];
    },
    [errors],
  );

  const setFieldError = useCallback(
    (key: keyof T, error: string | undefined) => {
      setErrors((prev) => ({
        ...prev,
        [key]: error,
      }));
    },
    [],
  );

  const setTouched = useCallback((key: keyof T, isTouched: boolean = true) => {
    setTouchedState((prev) => ({
      ...prev,
      [key]: isTouched,
    }));
  }, []);

  const validate = useCallback((): boolean => {
    const { isValid: formValid, errors: nextErrors } = runFormValidation(
      valuesRef.current,
    );
    setErrors(nextErrors);
    return formValid;
  }, [runFormValidation]);

  const validateField = useCallback(
    <K extends keyof T>(key: K): boolean => {
      const err = runFieldValidation(
        key,
        valuesRef.current[key],
        valuesRef.current,
      );
      setErrors((prev) => ({ ...prev, [key]: err }));
      return !err;
    },
    [runFieldValidation],
  );

  const reset = useCallback(
    (newValues?: Partial<T>) => {
      const resetVals = newValues
        ? { ...initialValuesRef.current, ...newValues }
        : initialValuesRef.current;
      setValuesState(resetVals);
      valuesRef.current = resetVals;
      setErrors({});
      setTouchedState({});
      setIsSubmitting(false);
      isSubmittingRef.current = false;
      onChange?.(resetVals);
    },
    [onChange],
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      if (isSubmittingRef.current || isSaving) {
        return;
      }

      const { isValid: formValid, errors: formErrors } = runFormValidation(
        valuesRef.current,
      );
      setErrors(formErrors);

      if (!formValid) {
        return;
      }

      if (!onSubmit) {
        return;
      }

      isSubmittingRef.current = true;
      setIsSubmitting(true);

      try {
        await onSubmit(valuesRef.current);
      } finally {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [isSaving, onSubmit, runFormValidation],
  );

  const register = useCallback(
    <K extends keyof T>(key: K): FormFieldRegistration<T[K]> => {
      return {
        value: values[key],
        onChange: (val: T[K]) => setValue(key, val),
        error: Boolean(touched[key] && errors[key]),
        errorText: touched[key] ? errors[key] : undefined,
      };
    },
    [errors, setValue, touched, values],
  );

  return {
    values,
    errors,
    touched,
    isSubmitting: isSubmitting || isSaving,
    isValid,
    getValue,
    setValue,
    setValues,
    getError,
    hasError,
    setFieldError,
    setTouched,
    validate,
    validateField,
    isValidField,
    handleSubmit,
    reset,
    register,
  };
}
