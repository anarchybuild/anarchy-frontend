import React, { useState, useCallback } from 'react';
import { HeaderPromptInput } from './HeaderPromptInput';
import { Button } from '@/components/ui/button';
import { X, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const BottomPromptBar: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const { toast } = useToast();

  const handleGenerated = useCallback((result: { imageUrl: string; design?: any; nft?: any; prompt: string }) => {
    setPreviewUrl(result.imageUrl);
    setLastPrompt(result.prompt);
  }, []);

  const closePreview = () => setPreviewUrl(null);

  const handleShare = async () => {
    if (!previewUrl) return;

    try {
      const title = 'Check out my AI design';
      const text = lastPrompt || 'Created with Anarchy';
      const nav: any = navigator;

      // Prefer sharing the actual image file when supported
      if (window.fetch && nav?.canShare) {
        try {
          const res = await fetch(previewUrl, { mode: 'cors' });
          const blob = await res.blob();
          const ext = (blob.type?.split('/')?.[1] || 'png').split(';')[0];
          const file = new File([blob], `anarchy-design.${ext}`, { type: blob.type || 'image/png' });
          const shareData = { files: [file], title, text } as any;

          if (nav.canShare(shareData) && navigator.share) {
            await navigator.share(shareData);
            return;
          }
        } catch (_) {
          // If fetching/creating file fails, fall back to URL sharing
        }
      }

      // Fallback: share the URL (supported on many devices/browsers)
      if (navigator.share) {
        await navigator.share({ title, text, url: previewUrl });
        return;
      }

      // Last resort: copy link to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(previewUrl);
        toast({ title: 'Link copied', description: 'Image URL copied to clipboard.' });
        return;
      }

      // Share not supported - silently ignore per requirements
    } catch (err) {
      // Common when inside an iframe or when the browser blocks share UI
      try {
        await navigator.clipboard?.writeText?.(previewUrl);
        toast({ title: 'Share unavailable', description: 'Native share blocked. Link copied to clipboard instead.' });
      } catch (_) {
        // Unable to share - silently ignore per requirements
      }
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur supports-backdrop-blur:bg-background/80"
      role="region"
      aria-label="Quick create"
    >
      <div className="mx-auto max-w-5xl w-full px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-center">
          <HeaderPromptInput onGenerated={handleGenerated} />
        </div>
      </div>

      {previewUrl && (
        <div className="fixed z-[60] left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 bottom-24 sm:bottom-24 md:bottom-28">
          <div className="relative bg-background border rounded-lg shadow-xl w-11/12 sm:w-2/3 md:w-[33vw] overflow-hidden">
            <button
              aria-label="Close preview"
              onClick={closePreview}
              className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md h-8 w-8 bg-background/80 border hover:bg-accent transition"
            >
              <X className="h-4 w-4" />
            </button>

            <img
              src={previewUrl}
              alt={lastPrompt || 'Generated design'}
              loading="eager"
              className="w-full h-auto block"
            />

            <div className="flex items-center justify-end gap-2 p-2 border-t bg-muted/30">
              <Button type="button" size="sm" variant="secondary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(); }}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottomPromptBar;
