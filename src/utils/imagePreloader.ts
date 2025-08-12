export const preloadCriticalImages = (imageUrls: string[], maxPreload = 2) => {
  imageUrls.slice(0, maxPreload).forEach((url) => {
    if (url && url !== '/placeholder.svg') {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    }
  });
};

export const addImageSizeHints = (container: HTMLElement) => {
  const images = container.querySelectorAll('img[data-src]');
  images.forEach((img) => {
    const element = img as HTMLImageElement;
    if (!element.style.width && !element.style.height) {
      element.style.aspectRatio = '1/1';
      element.style.minHeight = '200px';
    }
  });
};

export const optimizeImageLoad = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};