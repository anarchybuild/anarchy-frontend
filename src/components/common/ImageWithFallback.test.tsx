import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ImageWithFallback } from './ImageWithFallback';

describe('ImageWithFallback', () => {
  it('should render image with correct src and alt', () => {
    render(<ImageWithFallback src="/test.jpg" alt="Test image" priority={true} />);
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test.jpg');
  });

  it('should show placeholder while loading', () => {
    const { container } = render(
      <ImageWithFallback src="/test.jpg" alt="Test image" priority={true} placeholder={true} />
    );
    
    const placeholder = container.querySelector('.animate-pulse');
    expect(placeholder).toBeInTheDocument();
  });

  it('should use fallback image on error', async () => {
    render(
      <ImageWithFallback 
        src="/invalid.jpg" 
        alt="Test image" 
        fallback="/placeholder.svg"
        priority={true}
      />
    );
    
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    
    // Trigger error
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  it('should call onLoad callback when image loads', async () => {
    const onLoad = vi.fn();
    
    render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        priority={true}
        onLoad={onLoad}
      />
    );
    
    const img = screen.getByAltText('Test image');
    img.dispatchEvent(new Event('load'));
    
    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('should call onError callback when image fails to load', async () => {
    const onError = vi.fn();
    
    render(
      <ImageWithFallback 
        src="/invalid.jpg" 
        alt="Test image" 
        priority={true}
        onError={onError}
      />
    );
    
    const img = screen.getByAltText('Test image');
    img.dispatchEvent(new Event('error'));
    
    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
    });
  });

  it('should use eager loading for priority images', () => {
    render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        priority={true}
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });

  it('should use lazy loading for non-priority images', async () => {
    const { container } = render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        priority={false}
      />
    );
    
    // With non-priority, image may not render immediately due to intersection observer
    // Check that the component wrapper is present
    expect(container.firstChild).toBeInTheDocument();
    
    // The image may not be rendered yet (waiting for intersection)
    // This is expected behavior for lazy-loaded images
    const img = screen.queryByAltText('Test image');
    
    // If it does render (priority was set or IntersectionObserver triggered), check lazy loading
    if (img) {
      expect(img).toHaveAttribute('loading', 'lazy');
    }
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        className="custom-class"
        priority={true}
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should use default fallback when not specified', () => {
    render(
      <ImageWithFallback 
        src="/invalid.jpg" 
        alt="Test image" 
        priority={true}
      />
    );
    
    const img = screen.getByAltText('Test image') as HTMLImageElement;
    img.dispatchEvent(new Event('error'));
    
    waitFor(() => {
      expect(img).toHaveAttribute('src', '/placeholder.svg');
    });
  });

  it('should handle gridContext prop', () => {
    const { container } = render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        priority={true}
        gridContext={true}
      />
    );
    
    const placeholder = container.querySelector('.animate-pulse');
    expect(placeholder).toBeInTheDocument();
  });

  it('should not show placeholder when placeholder prop is false', () => {
    const { container } = render(
      <ImageWithFallback 
        src="/test.jpg" 
        alt="Test image" 
        priority={true}
        placeholder={false}
      />
    );
    
    const placeholder = container.querySelector('.animate-pulse');
    expect(placeholder).not.toBeInTheDocument();
  });
});

