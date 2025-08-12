import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface CircularImageCropperProps {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  size?: number;
}

export const CircularImageCropper = ({ 
  imageUrl, 
  onCropComplete, 
  size = 300 
}: CircularImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for clipping
    ctx.save();

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Calculate image dimensions and position
    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawWidth = size * scale;
    let drawHeight = size * scale;

    if (imgAspect > 1) {
      drawHeight = drawWidth / imgAspect;
    } else {
      drawWidth = drawHeight * imgAspect;
    }

    const drawX = (size - drawWidth) / 2 + position.x;
    const drawY = (size - drawHeight) / 2 + position.y;

    // Draw image
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Restore context
    ctx.restore();

    // Draw circle border
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [size, scale, position, imageLoaded]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const newPosition = {
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    };

    // Constrain movement to keep image within reasonable bounds
    const maxOffset = size * scale * 0.5;
    newPosition.x = Math.max(-maxOffset, Math.min(maxOffset, newPosition.x));
    newPosition.y = Math.max(-maxOffset, Math.min(maxOffset, newPosition.y));

    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number[]) => {
    setScale(newScale[0]);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    // Auto-fit image to circle
    if (imageRef.current) {
      const img = imageRef.current;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      
      // Set initial scale to fit the smaller dimension
      if (imgAspect > 1) {
        setScale(1.2); // Slightly larger than fit for better coverage
      } else {
        setScale(1.2);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden image for loading */}
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Crop source"
        className="hidden"
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
      />

      {/* Cropper Container */}
      <div className="flex justify-center">
        <div 
          ref={containerRef}
          className="relative border-2 border-dashed border-muted-foreground/30 rounded-full bg-muted/20"
          style={{ width: size, height: size }}
        >
          <canvas
            ref={canvasRef}
            width={size}
            height={size}
            className="cursor-move rounded-full"
            style={{ width: size, height: size }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-muted-foreground">Loading...</div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      {imageLoaded && (
        <div className="space-y-4">
          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zoom</span>
              <div className="flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                <ZoomIn className="h-4 w-4" />
              </div>
            </div>
            <Slider
              value={[scale]}
              onValueChange={handleScaleChange}
              min={0.5}
              max={3}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button onClick={handleCrop} size="sm">
              Apply Crop
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-muted-foreground text-center">
            Drag to reposition • Use slider to zoom • Click Apply Crop when ready
          </div>
        </div>
      )}
    </div>
  );
};

export default CircularImageCropper;
