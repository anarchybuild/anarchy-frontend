import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Paperclip, ArrowUp, X, Share2, Loader2 } from 'lucide-react';
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { useToast } from '@/hooks/use-toast';

export const FloatingPromptBox = () => {
  const [prompt, setPrompt] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [recommendedPrompts, setRecommendedPrompts] = useState<string[]>([]);
  const { generateAndMint, generating } = useImageGeneration();
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    
    const result = await generateAndMint({
      prompt,
      name: 'anarchy v1.1',
      description: prompt.trim(),
      options: {
        model: 'flux',
        width: 1024,
        height: 1024,
        isPrivate: false,
        seriesId: null
      }
    });

    if (result && result.imageUrl) {
      setPreviewUrl(result.imageUrl);
      setLastPrompt(prompt.trim());
    }

    // Keep prompt for re-use after successful generation (same as HeaderPromptInput)
    // Don't clear the prompt
  };

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !generating) {
      handleGenerate();
    }
  };

  const allPrompts = [
    "A futuristic cyberpunk cityscape at night",
    "Abstract geometric art with neon colors", 
    "Minimalist landscape with mountains",
    "Retro wave synthwave aesthetic",
    "Ancient temple in a mystical forest",
    "Space station orbiting a distant planet",
    "Victorian steampunk airship",
    "Underwater coral reef paradise",
    "Post-apocalyptic desert wasteland",
    "Magical floating islands in the sky",
    "Art deco cityscape in golden hour",
    "Norse mythology winter landscape",
    "Tropical beach at sunset",
    "Medieval castle on a cliff",
    "Robot garden in a digital world",
    "Crystal cave with glowing gems",
    "Samurai warrior in cherry blossom field",
    "Gothic cathedral interior",
    "Alien marketplace on distant world",
    "Fairy tale cottage in enchanted woods",
    "Neon-lit Tokyo street at midnight",
    "Desert oasis with palm trees",
    "Snow-covered mountain peak",
    "Ancient Egyptian pyramid complex",
    "Surreal Salvador Dali-inspired landscape"
  ];

  // Initialize random prompts on component mount
  useEffect(() => {
    const initialPrompts = allPrompts
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    setRecommendedPrompts(initialPrompts);
  }, []);

  const handleRecommendedPrompt = async (promptText: string, clickedIndex: number) => {
    setPrompt(promptText);
    
    // Replace the clicked prompt with a new random one
    const availablePrompts = allPrompts.filter(p => !recommendedPrompts.includes(p));
    if (availablePrompts.length > 0) {
      const newPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
      const updatedPrompts = [...recommendedPrompts];
      updatedPrompts[clickedIndex] = newPrompt;
      setRecommendedPrompts(updatedPrompts);
    }
    
    // Auto-generate after setting the prompt
    const result = await generateAndMint({
      prompt: promptText,
      name: 'anarchy v1.1',
      description: promptText.trim(),
      options: {
        model: 'flux',
        width: 1024,
        height: 1024,
        isPrivate: false,
        seriesId: null
      }
    });

    if (result && result.imageUrl) {
      setPreviewUrl(result.imageUrl);
      setLastPrompt(promptText.trim());
    }
  };

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999]">
        <div className="bg-background border border-border rounded-2xl p-4 shadow-2xl backdrop-blur-sm w-96">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Input
              placeholder="What would you like to create today?"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={generating}
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            />
            
            <Button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              size="icon"
              className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {/* Recommended Prompts */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Try these:</div>
            <div className="flex flex-wrap gap-1">
              {recommendedPrompts.map((promptText, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleRecommendedPrompt(promptText, index)}
                  disabled={generating}
                  className="text-xs h-7 px-2 rounded-full bg-muted/30 border-muted hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                >
                  {promptText}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed z-[1000] left-1/2 -translate-x-1/2 bottom-64">
          <div className="relative bg-background border rounded-lg shadow-xl w-80 overflow-hidden">
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
    </>
  );
};