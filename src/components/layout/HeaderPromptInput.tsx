import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2, Expand } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useImageGeneration } from '@/hooks/useImageGeneration';

export const HeaderPromptInput = ({ onGenerated }: { onGenerated?: (result: { imageUrl: string; design?: any; nft?: any; prompt: string }) => void }) => {
  const [prompt, setPrompt] = useState('');
  const { generateAndMint, generating } = useImageGeneration();

  const handleGenerate = async () => {
    const result = await generateAndMint({
      prompt,
      name: 'Header Generated',
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
      onGenerated?.({ imageUrl: result.imageUrl, design: result.design, nft: result.nft, prompt });
    }

    // Keep prompt for re-use after successful generation
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !generating) {
      handleGenerate();
    }
  };

  return (
    <div className="flex items-center gap-2 max-w-md w-full">
      {/* Create button - identical to /create page functionality */}
      <Button
        variant="outline"
        size="sm"
        asChild
        className="px-3"
      >
        <Link to="/create">
          <Expand className="h-4 w-4" />
        </Link>
      </Button>
      
      {/* Input field */}
      <Input
        placeholder="Type to generate an image..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={generating}
        className="flex-1"
      />
      
      {/* Generate button - same as Create page "Create" button */}
      <Button
        onClick={handleGenerate}
        disabled={generating || !prompt.trim()}
        size="sm"
        className="px-4"
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Creating...
          </>
        ) : (
          "Create"
        )}
      </Button>
    </div>
  );
};