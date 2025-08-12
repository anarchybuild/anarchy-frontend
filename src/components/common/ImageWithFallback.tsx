
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
  placeholder?: boolean;
  priority?: boolean;
  gridContext?: boolean;
  preload?: boolean;
  sizes?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const ImageWithFallback = ({
  src,
  alt,
  className,
  fallback = '/placeholder.svg',
  placeholder = true,
  priority = false,
  gridContext = false,
  preload = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  onLoad,
  onError,
}: ImageWithFallbackProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver>();

  // Preload critical images
  useEffect(() => {
    if (preload && !hasError) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
      
      return () => {
        document.head.removeChild(link);
      };
    }
  }, [preload, src, hasError]);

  useEffect(() => {
    if (priority) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: gridContext ? '200px' : '100px', // Increased margin for faster loading
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, gridContext]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden w-full h-full', className)}>
      {/* Placeholder while loading */}
      {placeholder && isLoading && (
        <div className={cn(
          'absolute inset-0 bg-muted/50 animate-pulse flex items-center justify-center',
          gridContext && 'bg-muted/30'
        )}>
          <div className={cn(
            'bg-muted/70 rounded animate-pulse',
            gridContext ? 'w-3 h-3' : 'w-8 h-8'
          )} />
        </div>
      )}

      {/* Actual image */}
      {isInView && (
        <img
          src={hasError ? fallback : src}
          alt={alt}
          sizes={sizes}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      )}
    </div>
  );
};
