export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface ProcessedImages {
  original: string;
  thumbnail: string;
  medium: string;
}

export interface ProcessedImageBlobs {
  original: string; // Keep as data URL for initial processing
  thumbnail: string;
  medium: string;
}

/**
 * Resize and compress an image for optimal loading
 */
export const processImageSizes = async (
  imageDataUrl: string, 
  options: ImageOptimizationOptions = {}
): Promise<ProcessedImages> => {
  const {
    quality = 0.7,
    format = 'webp'
  } = options;

  try {
    // Create image element
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    // Create thumbnail (200x200, very compressed)
    const thumbnailCanvas = document.createElement('canvas');
    const thumbnailCtx = thumbnailCanvas.getContext('2d');
    
    const thumbnailSize = 200;
    thumbnailCanvas.width = thumbnailSize;
    thumbnailCanvas.height = thumbnailSize;
    
    // Calculate dimensions to maintain aspect ratio
    const aspectRatio = img.width / img.height;
    let drawWidth = thumbnailSize;
    let drawHeight = thumbnailSize;
    let offsetX = 0;
    let offsetY = 0;
    
    if (aspectRatio > 1) {
      drawHeight = thumbnailSize / aspectRatio;
      offsetY = (thumbnailSize - drawHeight) / 2;
    } else {
      drawWidth = thumbnailSize * aspectRatio;
      offsetX = (thumbnailSize - drawWidth) / 2;
    }
    
    // Fill background with neutral color for transparency
    thumbnailCtx.fillStyle = '#f3f4f6';
    thumbnailCtx.fillRect(0, 0, thumbnailSize, thumbnailSize);
    
    thumbnailCtx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    
    // Create thumbnail with aggressive compression for <50kb target
    const thumbnailDataUrl = thumbnailCanvas.toDataURL(`image/${format}`, 0.5);

    // Create medium size (500x500, moderate compression)
    const mediumCanvas = document.createElement('canvas');
    const mediumCtx = mediumCanvas.getContext('2d');
    
    const mediumSize = 500;
    mediumCanvas.width = mediumSize;
    mediumCanvas.height = mediumSize;
    
    // Calculate medium dimensions
    let mediumDrawWidth = mediumSize;
    let mediumDrawHeight = mediumSize;
    let mediumOffsetX = 0;
    let mediumOffsetY = 0;
    
    if (aspectRatio > 1) {
      mediumDrawHeight = mediumSize / aspectRatio;
      mediumOffsetY = (mediumSize - mediumDrawHeight) / 2;
    } else {
      mediumDrawWidth = mediumSize * aspectRatio;
      mediumOffsetX = (mediumSize - mediumDrawWidth) / 2;
    }
    
    mediumCtx.fillStyle = '#f3f4f6';
    mediumCtx.fillRect(0, 0, mediumSize, mediumSize);
    mediumCtx.drawImage(img, mediumOffsetX, mediumOffsetY, mediumDrawWidth, mediumDrawHeight);
    
    const mediumDataUrl = mediumCanvas.toDataURL(`image/${format}`, quality);

    console.log('📸 Image optimization results:', {
      original: `${Math.round(imageDataUrl.length / 1024)}kb`,
      thumbnail: `${Math.round(thumbnailDataUrl.length / 1024)}kb`,
      medium: `${Math.round(mediumDataUrl.length / 1024)}kb`
    });

    return {
      original: imageDataUrl,
      thumbnail: thumbnailDataUrl,
      medium: mediumDataUrl
    };
  } catch (error) {
    console.error('❌ Image optimization failed:', error);
    // Fallback to original image if optimization fails
    return {
      original: imageDataUrl,
      thumbnail: imageDataUrl,
      medium: imageDataUrl
    };
  }
};

/**
 * Convert canvas to blob for better compression control
 */
export const canvasToBlob = async (
  canvas: HTMLCanvasElement, 
  format: string = 'image/webp', 
  quality: number = 0.7
): Promise<Blob> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob || new Blob());
    }, format, quality);
  });
};

/**
 * Estimate final file size before compression
 */
export const estimateImageSize = (width: number, height: number, quality: number = 0.7): number => {
  // Rough estimation: width * height * 3 (RGB) * quality / compression_ratio
  const baseSize = width * height * 3;
  const compressionRatio = 10; // WebP typically achieves 10:1 compression
  return Math.round((baseSize * quality) / compressionRatio);
};

/**
 * Get optimal image size for different use cases
 */
export const getOptimalDimensions = (useCase: 'thumbnail' | 'medium' | 'full') => {
  switch (useCase) {
    case 'thumbnail':
      return { width: 200, height: 200 };
    case 'medium':
      return { width: 500, height: 500 };
    case 'full':
      return { width: 1024, height: 1024 };
    default:
      return { width: 200, height: 200 };
  }
};