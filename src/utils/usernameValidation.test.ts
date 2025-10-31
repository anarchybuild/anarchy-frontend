import { describe, it, expect } from 'vitest';
import { validateUsername } from './usernameValidation';

describe('validateUsername', () => {
  it('should return valid for correct username', () => {
    const result = validateUsername('valid_user123');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept username with only letters', () => {
    const result = validateUsername('username');
    expect(result.isValid).toBe(true);
  });

  it('should accept username with only numbers', () => {
    const result = validateUsername('12345');
    expect(result.isValid).toBe(true);
  });

  it('should accept username with underscores', () => {
    const result = validateUsername('user_name_123');
    expect(result.isValid).toBe(true);
  });

  it('should reject empty username', () => {
    const result = validateUsername('');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username is required');
  });

  it('should reject username longer than 15 characters', () => {
    const result = validateUsername('thisusernameistoolong');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username must be 15 characters or less');
  });

  it('should accept username with exactly 15 characters', () => {
    const result = validateUsername('username1234567');
    expect(result.isValid).toBe(true);
  });

  it('should reject username with spaces', () => {
    const result = validateUsername('user name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
  });

  it('should reject username with special characters', () => {
    const result = validateUsername('user@name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
  });

  it('should reject username with hyphens', () => {
    const result = validateUsername('user-name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
  });

  it('should reject username with dots', () => {
    const result = validateUsername('user.name');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
  });

  it('should reject username with emojis', () => {
    const result = validateUsername('user😀');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Username can only contain letters, numbers, and underscores');
  });
});

