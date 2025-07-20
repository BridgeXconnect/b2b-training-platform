import { useState, useCallback } from 'react';
import { z } from 'zod';

export interface FormField<T> {
  value: T;
  error: string | null;
  touched: boolean;
}

export type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validationSchema?: z.ZodSchema<T>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const setTouchedField = useCallback((field: keyof T, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);

  const validateField = useCallback((field: keyof T) => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors(prev => ({ ...prev, [field]: undefined }));
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path.includes(field as string));
        if (fieldError) {
          setErrors(prev => ({ ...prev, [field]: fieldError.message }));
          return false;
        }
      }
      return true;
    }
  }, [values, validationSchema]);

  const validateForm = useCallback(() => {
    if (!validationSchema) return true;

    try {
      validationSchema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof T, string>> = {};
        error.errors.forEach(e => {
          const field = e.path[0] as keyof T;
          newErrors[field] = e.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [values, validationSchema]);

  const handleSubmit = useCallback(async (
    onSubmit: (values: T) => Promise<void> | void
  ) => {
    setIsSubmitting(true);
    
    try {
      if (validateForm()) {
        await onSubmit(values);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validateForm]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: values[field],
    error: errors[field] || null,
    touched: touched[field] || false,
    onChange: (value: T[keyof T]) => setValue(field, value),
    onBlur: () => {
      setTouchedField(field, true);
      validateField(field);
    },
  }), [values, errors, touched, setValue, setTouchedField, validateField]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    setValue,
    setTouchedField,
    validateField,
    validateForm,
    handleSubmit,
    reset,
    getFieldProps,
  };
} 