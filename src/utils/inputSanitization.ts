/**
 * Input sanitization utilities for preventing XSS and ensuring data safety
 */

// Basic HTML tag regex for stripping potentially dangerous content
const HTML_TAG_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const JAVASCRIPT_REGEX = /javascript:/gi;
const VBSCRIPT_REGEX = /vbscript:/gi;
const DATA_URL_REGEX = /data:\s*text\/html/gi;

export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags
  let clean = input.replace(SCRIPT_REGEX, '');
  
  // Remove javascript: and vbscript: protocols
  clean = clean.replace(JAVASCRIPT_REGEX, '');
  clean = clean.replace(VBSCRIPT_REGEX, '');
  
  // Remove data URLs that could contain HTML
  clean = clean.replace(DATA_URL_REGEX, '');
  
  // Remove HTML tags for plain text fields
  clean = clean.replace(HTML_TAG_REGEX, '');
  
  return clean.trim();
};

export const sanitizeUserInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Basic sanitization
  let clean = sanitizeHtml(input);
  
  // Trim to max length
  clean = clean.substring(0, maxLength);
  
  return clean;
};

export const sanitizeDisplayName = (name: string): string => {
  return sanitizeUserInput(name, 50);
};

export const sanitizeDescription = (description: string): string => {
  return sanitizeUserInput(description, 2000);
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateWalletAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

// Rate limiting utilities
interface RateLimitEntry {
  count: number;
  lastReset: number;
}

const rateLimitStorage = new Map<string, RateLimitEntry>();

export const checkRateLimit = (
  identifier: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const entry = rateLimitStorage.get(identifier);
  
  if (!entry || now - entry.lastReset > windowMs) {
    rateLimitStorage.set(identifier, { count: 1, lastReset: now });
    return true;
  }
  
  if (entry.count >= maxRequests) {
    return false;
  }
  
  entry.count++;
  return true;
};

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  
  for (const [key, entry] of rateLimitStorage.entries()) {
    if (now - entry.lastReset > windowMs) {
      rateLimitStorage.delete(key);
    }
  }
}, 300000); // Clean up every 5 minutes