import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect method with methods from react-testing-library
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;

// Mock FileReader
if (typeof window !== 'undefined') {
  window.FileReader = class FileReader {
    private _file: Blob | null = null;
    
    readAsDataURL(file?: Blob) {
      if (file) this._file = file;
      setTimeout(() => {
        if (this.onload) {
          this.onload({
            target: { result: 'data:image/png;base64,mock' }
          } as any);
        }
      }, 0);
    }
    
    readAsText(file?: Blob) {
      if (file) this._file = file;
      setTimeout(async () => {
        if (this.onload && this._file) {
          // Read the actual blob content
          const text = await this._file.text();
          this.onload({
            target: { result: text }
          } as any);
        }
      }, 0);
    }
    
    result: any = null;
    onload: ((event: any) => void) | null = null;
    onerror: ((event: any) => void) | null = null;
  } as any;
}

