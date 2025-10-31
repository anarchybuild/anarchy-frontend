import { describe, it, expect } from 'vitest';
import { validateDisplayName } from './displayNameValidation';

describe('validateDisplayName', () => {
  it('should return valid for correct display name', () => {
    const result = validateDisplayName('DisplayName123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept empty display name', () => {
    const result = validateDisplayName('');
    expect(result.isValid).toBe(true);
  });

  it('should accept display name with only whitespace', () => {
    const result = validateDisplayName('   ');
    expect(result.isValid).toBe(true);
  });

  it('should trim whitespace before validation', () => {
    const result = validateDisplayName('  ValidName  ');
    expect(result.isValid).toBe(true);
  });

  it('should accept display name with letters only', () => {
    const result = validateDisplayName('DisplayName');
    expect(result.isValid).toBe(true);
  });

  it('should accept display name with numbers', () => {
    const result = validateDisplayName('Display123');
    expect(result.isValid).toBe(true);
  });

  it('should accept display name with underscores', () => {
    const result = validateDisplayName('Display_Name');
    expect(result.isValid).toBe(true);
  });

  it('should reject display name longer than 15 characters', () => {
    const result = validateDisplayName('ThisDisplayNameIsTooLong');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name must be 15 characters or less');
  });

  it('should accept display name with exactly 15 characters', () => {
    const result = validateDisplayName('DisplayName1234');
    expect(result.isValid).toBe(true);
  });

  it('should reject display name with spaces (after trim)', () => {
    const result = validateDisplayName('Display Name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name can only contain letters, numbers, and underscores');
  });

  it('should reject display name with special characters', () => {
    const result = validateDisplayName('Display@Name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name can only contain letters, numbers, and underscores');
  });

  it('should reject display name with hyphens', () => {
    const result = validateDisplayName('Display-Name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name can only contain letters, numbers, and underscores');
  });

  it('should reject display name with dots', () => {
    const result = validateDisplayName('Display.Name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name can only contain letters, numbers, and underscores');
  });

  it('should reject display name with emojis', () => {
    const result = validateDisplayName('Display😀');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name can only contain letters, numbers, and underscores');
  });

  it('should handle display name that becomes too long after trimming', () => {
    const result = validateDisplayName('   ' + 'A'.repeat(16) + '   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Display name must be 15 characters or less');
  });
});

