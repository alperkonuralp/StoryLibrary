'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationError {
  field?: string;
  message: string;
  code?: string;
}

export interface FormValidationProps {
  errors?: ValidationError[];
  success?: string;
  className?: string;
}

export function FormValidation({ errors = [], success, className }: FormValidationProps) {
  if (!errors.length && !success) return null;

  return (
    <div className={cn('space-y-2', className)}>
      {success && (
        <Alert variant="default" className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}
      
      {errors.map((error, index) => (
        <Alert key={index} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error.field && (
              <Badge variant="outline" className="mr-2 text-xs">
                {error.field}
              </Badge>
            )}
            {error.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

export interface FieldValidationProps {
  error?: string;
  success?: boolean;
  warning?: string;
  info?: string;
  className?: string;
}

export function FieldValidation({ 
  error, 
  success, 
  warning, 
  info, 
  className 
}: FieldValidationProps) {
  if (!error && !success && !warning && !info) return null;

  const getIcon = () => {
    if (error) return <AlertCircle className="h-3 w-3" />;
    if (success) return <CheckCircle className="h-3 w-3" />;
    if (warning) return <AlertTriangle className="h-3 w-3" />;
    if (info) return <Info className="h-3 w-3" />;
    return null;
  };

  const getText = () => {
    if (error) return error;
    if (warning) return warning;
    if (info) return info;
    if (success) return 'Valid';
    return null;
  };

  const getStyles = () => {
    if (error) return 'text-red-600';
    if (success) return 'text-green-600';
    if (warning) return 'text-yellow-600';
    if (info) return 'text-blue-600';
    return '';
  };

  return (
    <div className={cn('flex items-center gap-1 text-xs mt-1', getStyles(), className)}>
      {getIcon()}
      <span>{getText()}</span>
    </div>
  );
}

export interface ValidationState {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  touched: Set<string>;
}

export interface UseValidationOptions<T> {
  initialValues: T;
  validationRules: ValidationRules<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export type ValidationRule<T> = (value: T, allValues: T) => string | null;
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]> | ValidationRule<T[K]>[];
};

export function useFormValidation<T extends Record<string, any>>(
  options: UseValidationOptions<T>
) {
  const [values, setValues] = React.useState<T>(options.initialValues);
  const [validation, setValidation] = React.useState<ValidationState>({
    isValid: true,
    errors: [],
    warnings: [],
    touched: new Set(),
  });

  const validateField = React.useCallback((
    fieldName: keyof T, 
    value: any, 
    allValues: T = values
  ): string | null => {
    const rules = options.validationRules[fieldName];
    if (!rules) return null;

    const rulesToCheck = Array.isArray(rules) ? rules : [rules];
    
    for (const rule of rulesToCheck) {
      const error = rule(value, allValues);
      if (error) return error;
    }
    
    return null;
  }, [options.validationRules, values]);

  const validateAll = React.useCallback((): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    Object.keys(options.validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName], values);
      if (error) {
        errors.push({
          field: fieldName,
          message: error,
        });
      }
    });
    
    return errors;
  }, [validateField, values, options.validationRules]);

  const updateField = React.useCallback((fieldName: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    if (options.validateOnChange) {
      const error = validateField(fieldName, value);
      setValidation(prev => ({
        ...prev,
        errors: prev.errors.filter(e => e.field !== fieldName).concat(
          error ? [{ field: fieldName as string, message: error }] : []
        ),
        isValid: prev.errors.filter(e => e.field !== fieldName).length === 0 && !error,
      }));
    }
  }, [validateField, options.validateOnChange]);

  const touchField = React.useCallback((fieldName: keyof T) => {
    setValidation(prev => ({
      ...prev,
      touched: new Set([...prev.touched, fieldName as string]),
    }));

    if (options.validateOnBlur) {
      const error = validateField(fieldName, values[fieldName]);
      setValidation(prev => ({
        ...prev,
        errors: prev.errors.filter(e => e.field !== fieldName).concat(
          error ? [{ field: fieldName as string, message: error }] : []
        ),
        isValid: prev.errors.filter(e => e.field !== fieldName).length === 0 && !error,
      }));
    }
  }, [validateField, values, options.validateOnBlur]);

  const validate = React.useCallback(() => {
    const errors = validateAll();
    setValidation(prev => ({
      ...prev,
      errors,
      isValid: errors.length === 0,
    }));
    return errors.length === 0;
  }, [validateAll]);

  const reset = React.useCallback(() => {
    setValues(options.initialValues);
    setValidation({
      isValid: true,
      errors: [],
      warnings: [],
      touched: new Set(),
    });
  }, [options.initialValues]);

  return {
    values,
    validation,
    updateField,
    touchField,
    validate,
    reset,
    getFieldError: (fieldName: keyof T) => 
      validation.errors.find(e => e.field === fieldName)?.message,
    isFieldTouched: (fieldName: keyof T) => 
      validation.touched.has(fieldName as string),
  };
}

// Common validation rules
export const ValidationRules = {
  required: (message = 'This field is required') => (value: any): string | null => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  minLength: (min: number, message?: string) => (value: string): string | null => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: string): string | null => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return null;
  },

  email: (message = 'Invalid email address') => (value: string): string | null => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return message;
    }
    return null;
  },

  url: (message = 'Invalid URL') => (value: string): string | null => {
    if (value) {
      try {
        new URL(value);
      } catch {
        return message;
      }
    }
    return null;
  },

  pattern: (regex: RegExp, message: string) => (value: string): string | null => {
    if (value && !regex.test(value)) {
      return message;
    }
    return null;
  },

  min: (min: number, message?: string) => (value: number): string | null => {
    if (value !== undefined && value < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  max: (max: number, message?: string) => (value: number): string | null => {
    if (value !== undefined && value > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },
};