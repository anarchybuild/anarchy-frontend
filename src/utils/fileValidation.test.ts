import { describe, it, expect } from 'vitest';
import { validateImageFile, createFilePreview } from './fileValidation';

describe('validateImageFile', () => {
  it('should accept valid image file', () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should accept jpeg image', () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  it('should accept gif image', () => {
    const file = new File(['content'], 'test.gif', { type: 'image/gif' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  it('should accept webp image', () => {
    const file = new File(['content'], 'test.webp', { type: 'image/webp' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  it('should reject non-image file', () => {
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid file type. Please select an image file');
  });

  it('should reject PDF file', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid file type. Please select an image file');
  });

  it('should reject file larger than 5MB', () => {
    // Create a file larger than 5MB
    const largeContent = new Uint8Array(6 * 1024 * 1024); // 6MB
    const file = new File([largeContent], 'large.png', { type: 'image/png' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('File too large. Please select an image smaller than 5MB');
  });

  it('should accept file exactly at 5MB limit', () => {
    const content = new Uint8Array(5 * 1024 * 1024); // Exactly 5MB
    const file = new File([content], 'exact.png', { type: 'image/png' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  it('should accept file just under 5MB limit', () => {
    const content = new Uint8Array(5 * 1024 * 1024 - 1); // Just under 5MB
    const file = new File([content], 'under.png', { type: 'image/png' });
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });
});

describe('createFilePreview', () => {
  it('should create preview from image file', async () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    const preview = await createFilePreview(file);
    expect(preview).toBe('data:image/png;base64,mock');
  });

  it('should handle different image types', async () => {
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const preview = await createFilePreview(file);
    expect(preview).toContain('data:');
  });
});

