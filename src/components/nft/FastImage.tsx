import React, { useState, useRef, useEffect } from 'react';
import { useIntersection } from '@/hooks/useIntersection';

interface FastImageProps {
  src: string;
  thumbnailSrc?: string;
  alt: string;
  priority?: boolean;
  onLoad?: () => void;
}

// Check if a string is base64 data
const isBase64Image = (src: string): boolean => {
  return src.startsWith('data:image/');
};

// Create object URL for base64 data to improve performance
const createImageSrc = (src: string): string => {
  if (!src || src === '/placeholder.svg') return '/placeholder.svg';
  
  // If it's base64, return as-is (browser handles it efficiently)
  if (isBase64Image(src)) {
    return src;
  }
  
  // For regular URLs, return as-is
  return src;
};

const FastImage = React.memo(({ src, thumbnailSrc, alt, priority = false, onLoad }: FastImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use intersection observer for lazy loading (unless priority)
  const intersection = useIntersection(containerRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });
  
  const shouldLoad = priority || intersection?.isIntersecting;
  
  useEffect(() => {
    if (shouldLoad && !isLoaded && !hasError) {
      // Use thumbnail for grid loading if available, otherwise use main src
      const imageToLoad = thumbnailSrc || src;
      if (imageToLoad && imageToLoad !== '/placeholder.svg') {
        const img = new Image();
        img.onload = () => {
          setIsLoaded(true);
          onLoad?.();
        };
        img.onerror = () => {
          // If thumbnail fails, try main image
          if (thumbnailSrc && src !== thumbnailSrc) {
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              setIsLoaded(true);
              onLoad?.();
            };
            fallbackImg.onerror = () => setHasError(true);
            fallbackImg.src = createImageSrc(src);
          } else {
            setHasError(true);
          }
        };
        img.src = createImageSrc(imageToLoad);
      } else {
        setHasError(true);
      }
    }
  }, [shouldLoad, src, thumbnailSrc, isLoaded, hasError, onLoad]);

  return (
    <div 
      ref={containerRef}
      className="aspect-square overflow-hidden bg-muted relative"
    >
      {isLoaded && !hasError ? (
        <img
          ref={imgRef}
          src={createImageSrc(thumbnailSrc || src)}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-200"
          style={{ imageRendering: 'optimizeSpeed' as any }}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      ) : hasError ? (
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
          <span>Image unavailable</span>
        </div>
      ) : (
        <div className="w-full h-full bg-muted animate-pulse" />
      )}
    </div>
  );
});

FastImage.displayName = 'FastImage';

export default FastImage;