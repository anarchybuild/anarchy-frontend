import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAlbumPage } from './albumUtils';

describe('createAlbumPage', () => {
  let mockCanvas: HTMLCanvasElement;
  let mockContext: any;

  beforeEach(() => {
    // Create mock canvas context
    mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
    };

    // Mock canvas
    mockCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => mockContext),
      toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
    } as any;

    // Mock document.createElement to return our mock canvas
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return mockCanvas as any;
      }
      return document.createElement(tagName);
    });

    // Mock Image constructor
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      src: string = '';
      crossOrigin: string | null = null;
      naturalWidth: number = 800;
      naturalHeight: number = 600;

      constructor() {
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 0);
      }
    } as any;
  });

  it('should create an album page with multiple images', async () => {
    const imageData = {
      'Nature': 'data:image/png;base64,iVBORw0KGgo=',
      'Urban': 'data:image/png;base64,iVBORw0KGgo=',
    };

    const result = await createAlbumPage(imageData);

    expect(result).toBe('data:image/jpeg;base64,mockdata');
    expect(mockContext.fillRect).toHaveBeenCalled();
    expect(mockContext.fillText).toHaveBeenCalled();
  });

  it('should set canvas dimensions correctly', async () => {
    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await createAlbumPage(imageData);

    expect(mockCanvas.width).toBe(2480);
    expect(mockCanvas.height).toBe(3508);
  });

  it('should draw background', async () => {
    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await createAlbumPage(imageData);

    // The background color should have been set at some point
    // Note: fillStyle gets mutated multiple times, so we just check fillRect was called
    expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 2480, 3508);
  });

  it('should draw title text', async () => {
    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await createAlbumPage(imageData);

    expect(mockContext.fillText).toHaveBeenCalledWith(
      'Style Fusion Creations',
      expect.any(Number),
      expect.any(Number)
    );
  });

  it('should handle multiple themes', async () => {
    const imageData = {
      'Nature': 'data:image/png;base64,iVBORw0KGgo=',
      'Urban': 'data:image/png;base64,iVBORw0KGgo=',
      'Abstract': 'data:image/png;base64,iVBORw0KGgo=',
    };

    const result = await createAlbumPage(imageData);

    expect(result).toBeDefined();
    expect(mockContext.drawImage).toHaveBeenCalled();
  });

  it('should throw error if canvas context is not available', async () => {
    mockCanvas.getContext = vi.fn(() => null);

    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await expect(createAlbumPage(imageData)).rejects.toThrow(
      'Could not get 2D canvas context'
    );
  });

  it('should handle empty image data', async () => {
    const imageData = {};

    const result = await createAlbumPage(imageData);

    expect(result).toBe('data:image/jpeg;base64,mockdata');
    // Should still draw background and title
    expect(mockContext.fillRect).toHaveBeenCalled();
  });

  it('should apply transformations to images', async () => {
    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await createAlbumPage(imageData);

    expect(mockContext.save).toHaveBeenCalled();
    expect(mockContext.translate).toHaveBeenCalled();
    expect(mockContext.rotate).toHaveBeenCalled();
    expect(mockContext.restore).toHaveBeenCalled();
  });

  it('should apply shadow effects', async () => {
    const imageData = {
      'Test': 'data:image/png;base64,iVBORw0KGgo=',
    };

    await createAlbumPage(imageData);

    expect(mockContext.shadowBlur).toBeGreaterThan(0);
  });

  it('should handle image loading errors gracefully', async () => {
    // Override Image mock to trigger error
    global.Image = class MockImage {
      onload: (() => void) | null = null;
      onerror: ((err: any) => void) | null = null;
      src: string = '';
      crossOrigin: string | null = null;

      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror(new Error('Failed to load'));
          }
        }, 0);
      }
    } as any;

    const imageData = {
      'Test': 'invalid-url',
    };

    await expect(createAlbumPage(imageData)).rejects.toThrow();
  });
});

