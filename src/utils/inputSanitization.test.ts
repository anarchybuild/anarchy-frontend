import { describe, it, expect, beforeEach } from 'vitest';
import {
  sanitizeHtml,
  sanitizeUserInput,
  sanitizeDisplayName,
  sanitizeDescription,
  validateEmail,
  validateWalletAddress,
  validateUrl,
  checkRateLimit,
} from './inputSanitization';

describe('sanitizeHtml', () => {
  it('should remove script tags', () => {
    const input = 'Hello <script>alert("XSS")</script> World';
    const result = sanitizeHtml(input);
    expect(result).toBe('Hello  World');
  });

  it('should remove javascript: protocol', () => {
    const input = 'Click <a href="javascript:alert(1)">here</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('javascript:');
  });

  it('should remove vbscript: protocol', () => {
    const input = 'Click <a href="vbscript:msgbox">here</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('vbscript:');
  });

  it('should remove HTML tags', () => {
    const input = '<div>Hello <b>World</b></div>';
    const result = sanitizeHtml(input);
    expect(result).toBe('Hello World');
  });

  it('should remove data URLs with HTML', () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('data:');
  });

  it('should handle empty input', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  it('should handle null input', () => {
    const result = sanitizeHtml(null as any);
    expect(result).toBe('');
  });

  it('should handle undefined input', () => {
    const result = sanitizeHtml(undefined as any);
    expect(result).toBe('');
  });

  it('should preserve plain text', () => {
    const input = 'This is plain text';
    const result = sanitizeHtml(input);
    expect(result).toBe('This is plain text');
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const result = sanitizeHtml(input);
    expect(result).toBe('Hello World');
  });
});

describe('sanitizeUserInput', () => {
  it('should sanitize and limit length', () => {
    const input = '<script>alert("XSS")</script>' + 'A'.repeat(1000);
    const result = sanitizeUserInput(input, 100);
    expect(result.length).toBeLessThanOrEqual(100);
    expect(result).not.toContain('script');
  });

  it('should use default max length of 1000', () => {
    const input = 'A'.repeat(2000);
    const result = sanitizeUserInput(input);
    expect(result.length).toBe(1000);
  });

  it('should handle short input', () => {
    const input = 'Short text';
    const result = sanitizeUserInput(input);
    expect(result).toBe('Short text');
  });
});

describe('sanitizeDisplayName', () => {
  it('should limit to 50 characters', () => {
    const input = 'A'.repeat(100);
    const result = sanitizeDisplayName(input);
    expect(result.length).toBeLessThanOrEqual(50);
  });

  it('should sanitize HTML', () => {
    const input = '<b>Name</b>';
    const result = sanitizeDisplayName(input);
    expect(result).toBe('Name');
  });
});

describe('sanitizeDescription', () => {
  it('should limit to 2000 characters', () => {
    const input = 'A'.repeat(3000);
    const result = sanitizeDescription(input);
    expect(result.length).toBe(2000);
  });

  it('should sanitize HTML', () => {
    const input = '<p>Description</p>';
    const result = sanitizeDescription(input);
    expect(result).toBe('Description');
  });
});

describe('validateEmail', () => {
  it('should accept valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('should accept email with subdomain', () => {
    expect(validateEmail('user@mail.example.com')).toBe(true);
  });

  it('should accept email with plus sign', () => {
    expect(validateEmail('user+tag@example.com')).toBe(true);
  });

  it('should accept email with dots', () => {
    expect(validateEmail('user.name@example.com')).toBe(true);
  });

  it('should reject email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('should reject email without domain', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('should reject email without username', () => {
    expect(validateEmail('@example.com')).toBe(false);
  });

  it('should reject email without TLD', () => {
    expect(validateEmail('user@example')).toBe(false);
  });

  it('should reject email with spaces', () => {
    expect(validateEmail('user @example.com')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

describe('validateWalletAddress', () => {
  it('should accept valid Ethereum address', () => {
    expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(true);
  });

  it('should accept address with all lowercase', () => {
    expect(validateWalletAddress('0x742d35cc6634c0532925a3b844bc9e7595f0beb0')).toBe(true);
  });

  it('should accept address with all uppercase', () => {
    expect(validateWalletAddress('0x742D35CC6634C0532925A3B844BC9E7595F0BEB0')).toBe(true);
  });

  it('should reject address without 0x prefix', () => {
    expect(validateWalletAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb0')).toBe(false);
  });

  it('should reject address with wrong length', () => {
    expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0b')).toBe(false);
  });

  it('should reject address with invalid characters', () => {
    expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEg0')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateWalletAddress('')).toBe(false);
  });

  it('should reject address that is too long', () => {
    expect(validateWalletAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb01')).toBe(false);
  });
});

describe('validateUrl', () => {
  it('should accept valid http URL', () => {
    expect(validateUrl('http://example.com')).toBe(true);
  });

  it('should accept valid https URL', () => {
    expect(validateUrl('https://example.com')).toBe(true);
  });

  it('should accept URL with path', () => {
    expect(validateUrl('https://example.com/path/to/page')).toBe(true);
  });

  it('should accept URL with query string', () => {
    expect(validateUrl('https://example.com?query=value')).toBe(true);
  });

  it('should accept URL with hash', () => {
    expect(validateUrl('https://example.com#section')).toBe(true);
  });

  it('should accept URL with port', () => {
    expect(validateUrl('https://example.com:8080')).toBe(true);
  });

  it('should reject URL without protocol', () => {
    expect(validateUrl('example.com')).toBe(false);
  });

  it('should reject ftp URL', () => {
    expect(validateUrl('ftp://example.com')).toBe(false);
  });

  it('should reject file URL', () => {
    expect(validateUrl('file:///path/to/file')).toBe(false);
  });

  it('should reject invalid URL', () => {
    expect(validateUrl('not a url')).toBe(false);
  });

  it('should reject empty string', () => {
    expect(validateUrl('')).toBe(false);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit storage before each test
    // Note: This is a simple approach; in production, you might need a more robust reset mechanism
  });

  it('should allow first request', () => {
    const result = checkRateLimit('user1');
    expect(result).toBe(true);
  });

  it('should allow requests within limit', () => {
    for (let i = 0; i < 10; i++) {
      const result = checkRateLimit('user2', 10, 60000);
      expect(result).toBe(true);
    }
  });

  it('should reject requests exceeding limit', () => {
    // Make 10 requests (the default limit)
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user3', 10, 60000);
    }
    
    // 11th request should be rejected
    const result = checkRateLimit('user3', 10, 60000);
    expect(result).toBe(false);
  });

  it('should track different identifiers separately', () => {
    // Max out user4
    for (let i = 0; i < 10; i++) {
      checkRateLimit('user4', 10, 60000);
    }
    
    // user5 should still be allowed
    const result = checkRateLimit('user5', 10, 60000);
    expect(result).toBe(true);
  });

  it('should respect custom limits', () => {
    // Set limit to 3
    checkRateLimit('user6', 3, 60000);
    checkRateLimit('user6', 3, 60000);
    checkRateLimit('user6', 3, 60000);
    
    // 4th request should be rejected
    const result = checkRateLimit('user6', 3, 60000);
    expect(result).toBe(false);
  });
});

