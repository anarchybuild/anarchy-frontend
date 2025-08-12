import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/common/ImageWithFallback';

interface SeriesImageGridProps {
  images: string[];
  seriesName: string;
}

const SeriesImageGrid = ({ images, seriesName }: SeriesImageGridProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openImageViewer = (index: number) => {
    setSelectedImageIndex(index);
    setIsViewerOpen(true);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    if (direction === 'prev') {
      setSelectedImageIndex(selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1);
    } else {
      setSelectedImageIndex(selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigateImage('prev');
    if (e.key === 'ArrowRight') navigateImage('next');
    if (e.key === 'Escape') setIsViewerOpen(false);
  };

  return (
    <>
      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <div 
            key={index}
            className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg border border-border hover:border-primary transition-colors"
            onClick={() => openImageViewer(index)}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={`${seriesName} image ${index + 1}`}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              placeholder={true}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm rounded-full p-2">
                <div className="w-6 h-6 border-2 border-white rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">{index + 1}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] p-0 border-0 bg-black/95"
          onKeyDown={(e) => handleKeyDown(e as any)}
        >
          <div className="relative w-full h-full min-h-[70vh] flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsViewerOpen(false)}
              className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Navigation Buttons */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateImage('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateImage('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/10"
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            {/* Current Image */}
            {selectedImageIndex !== null && (
              <div className="flex items-center justify-center w-full h-full p-8">
                <img
                  src={images[selectedImageIndex]}
                  alt={`${seriesName} image ${selectedImageIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}

            {/* Image Counter */}
            {images.length > 1 && selectedImageIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                {selectedImageIndex + 1} of {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SeriesImageGrid;