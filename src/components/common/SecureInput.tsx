import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sanitizeUserInput } from '@/utils/inputSanitization';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength?: number;
  onSecureChange?: (value: string) => void;
}

interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength?: number;
  onSecureChange?: (value: string) => void;
}

export const SecureInput = React.forwardRef<HTMLInputElement, SecureInputProps>(
  ({ maxLength = 255, onSecureChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const sanitizedValue = sanitizeUserInput(e.target.value, maxLength);
      
      // Update the input value to the sanitized version
      e.target.value = sanitizedValue;
      
      if (onSecureChange) {
        onSecureChange(sanitizedValue);
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        maxLength={maxLength}
        onChange={handleChange}
      />
    );
  }
);

SecureInput.displayName = "SecureInput";

export const SecureTextarea = React.forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  ({ maxLength = 2000, onSecureChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const sanitizedValue = sanitizeUserInput(e.target.value, maxLength);
      
      // Update the textarea value to the sanitized version
      e.target.value = sanitizedValue;
      
      if (onSecureChange) {
        onSecureChange(sanitizedValue);
      }
      
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <Textarea
        {...props}
        ref={ref}
        maxLength={maxLength}
        onChange={handleChange}
      />
    );
  }
);

SecureTextarea.displayName = "SecureTextarea";