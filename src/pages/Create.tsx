import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNFTMinting } from '@/hooks/useNFTMinting';
import { Send, Settings, Grid3X3, X } from 'lucide-react';
import AuthCard from '@/components/create/AuthCard';
import { CreateSidebar } from '@/components/create/CreateSidebar';
import { createDesign } from '@/services/designService';
import { createSeries, addImageToSeries, fetchSeriesImages, updateSeriesImageSelection, publishSeries } from '@/services/seriesService';
import { Series, SeriesImage } from '@/types/series';
const Create = () => {
  const location = useLocation();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('flux');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [isPrivate, setIsPrivate] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Series related state
  const [createSeriesMode, setCreateSeriesMode] = useState(false);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [seriesImages, setSeriesImages] = useState<SeriesImage[]>([]);
  const [lockedPrompt, setLockedPrompt] = useState('');

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const {
    toast
  } = useToast();
  const {
    isSignedIn,
    user,
    account
  } = useAuth();
  const {
    mintNFT,
    isMinting,
    mintingStatus,
    isConnected
  } = useNFTMinting();

  // Handle incoming image data from Design page
  useEffect(() => {
    if (location.state) {
      const {
        imageUrl,
        prompt: incomingPrompt,
        model: incomingModel,
        dimensions
      } = location.state;
      if (imageUrl) {
        setImagePreview(imageUrl);
        // Pre-fill form with generated image details
        if (incomingPrompt) {
          setPrompt(`Generated with ${incomingModel} at ${dimensions}: ${incomingPrompt}`);
          setFormData(prev => ({
            ...prev,
            name: `AI Generated - ${incomingModel}`,
            description: `Generated with ${incomingModel} at ${dimensions}: ${incomingPrompt}`
          }));
        }
        if (incomingModel) {
          setModel(incomingModel);
        }
      }
    }
  }, [location.state]);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  const createImageAndMint = async () => {
    console.log("🎯 createImageAndMint called", { 
      isSignedIn, 
      hasAccount: !!account, 
      accountAddress: account?.address,
      currentSeries, 
      createSeriesMode,
      isMinting,
      isConnected 
    });
    
    // If in series mode but no series exists yet, create it first
    if (createSeriesMode && !currentSeries) {
      console.log("📝 Creating series first...");
      await startSeries();
      return;
    }
    
    const promptToUse = currentSeries ? lockedPrompt : prompt.trim();
    if (!promptToUse) {
      console.log("❌ No prompt provided");
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt to generate an image.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("🔄 Starting image generation and minting process...");
    setGenerating(true);
    
    try {
      console.log("📸 Generating image with prompt:", promptToUse);
      
      // Generate the image first
      const response = await fetch('https://kzkdzvavqjdtomeqwlxn.supabase.co/functions/v1/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6a2R6dmF2cWpkdG9tZXF3bHhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY4OTY4NDgsImV4cCI6MjA1MjQ3Mjg0OH0.Y-h2taL-CQaF1WkOP_Dh9_ArOZH0CQTXgx-IpsvnGzg`
        },
        body: JSON.stringify({
          prompt: promptToUse,
          model,
          width,
          height
        })
      });
      
      const data = await response.json();
      console.log("📸 Image generation response:", { success: data.success, hasImageUrl: !!data.imageUrl, error: data.error });
      
      if (data.success && data.imageUrl) {
        console.log("✅ Image generated successfully:", data.imageUrl);
        
        // If we're in series mode and have a current series, add the image to it
        if (currentSeries && createSeriesMode) {
          console.log("📝 Adding image to series...");
          const orderIndex = seriesImages.length;
          const newImage = await addImageToSeries(currentSeries.id, data.imageUrl, orderIndex, true);
          setSeriesImages(prev => [...prev, newImage]);

          // Don't update imagePreview for series - keep showing the grid
          if (seriesImages.length === 0) {
            setImagePreview(data.imageUrl); // Only for the first image
          }
          toast({
            title: "Image added to series!",
            description: `Image ${orderIndex + 1} has been added to your series.`
          });
        } else {
          console.log("🎨 Processing single image creation and minting...");
          setImagePreview(data.imageUrl);

          // Create design and mint NFT
          const name = formData.name.trim() || 'Untitled Design';
          const description = formData.description.trim() || promptToUse;
          
          console.log("💾 Creating design with data:", { name, description, imageUrl: data.imageUrl });

          // Create design
          const designData = {
            name,
            description,
            image_url: data.imageUrl,
            price: null,
            license: null,
            private: isPrivate,
            series_id: currentSeries?.id || null
          };
          
          try {
            const createdDesign = await createDesign(designData, account?.address);
            console.log("✅ Design created successfully:", createdDesign);
          } catch (designError) {
            console.error("❌ Design creation failed:", designError);
          }

          // CRITICAL: Mint as NFT - this should ALWAYS happen
          console.log("🚀 Starting NFT minting process...");
          console.log("🔍 Minting params:", {
            name,
            description,
            imageUrl: data.imageUrl,
            creator: 'placeholder',
            accountConnected: !!account,
            userSignedIn: isSignedIn
          });
          
          try {
            const nftResult = await mintNFT({
              name,
              description,
              imageUrl: data.imageUrl,
              creator: 'placeholder',
              license: undefined
            });
            
            console.log("🎉 NFT minting result:", nftResult);
            
            if (nftResult) {
            } else {
              console.log("⚠️ NFT minting returned null/undefined");
              toast({
                title: "Design Created",
                description: "Design created but NFT minting may have failed. Check console for details.",
                variant: "default"
              });
            }
          } catch (mintError) {
            console.error("❌ NFT minting failed:", mintError);
            toast({
              title: "Minting Failed",
              description: `Design created but NFT minting failed: ${mintError.message}`,
              variant: "destructive"
            });
          }

          // Reset form
          setFormData({
            name: '',
            description: ''
          });
          setImagePreview(null);
          setIsPrivate(false);
          setShowAdvancedOptions(false);
        }
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error: any) {
      console.error('Error creating image and NFT:', error);
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create image and NFT. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };
  const startSeries = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please enter a prompt to start a series.",
        variant: "destructive"
      });
      return;
    }
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet or sign in to create a series.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const seriesName = formData.name.trim() || `Series: ${prompt.slice(0, 30)}...`;
      const seriesData = {
        name: seriesName,
        description: formData.description.trim() || null,
        prompt: prompt.trim(),
        model,
        width,
        height
      };
      const newSeries = await createSeries(seriesData, account?.address);
      setCurrentSeries(newSeries);
      setLockedPrompt(prompt.trim());
      setSeriesImages([]);
      toast({
        title: "Series created!",
        description: "Your series has been started. The prompt is now locked for this series."
      });
    } catch (error: any) {
      console.error('Error creating series:', error);
      toast({
        title: "Series creation failed",
        description: error.message || "Failed to create series. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePublishSeries = async () => {
    if (!currentSeries) return;
    if (seriesImages.length === 0) {
      toast({
        title: "No images to publish",
        description: "Please generate at least one image before publishing.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      await publishSeries(currentSeries.id);
      toast({
        title: "Series published!",
        description: "Your series is now live and visible to everyone."
      });

      // Reset to single design mode
      resetToSingleMode();
    } catch (error: any) {
      console.error('Error publishing series:', error);
      toast({
        title: "Publishing failed",
        description: error.message || "Failed to publish series. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const resetToSingleMode = () => {
    setCreateSeriesMode(false);
    setCurrentSeries(null);
    setSeriesImages([]);
    setLockedPrompt('');
    setPrompt('');
    setFormData({
      name: '',
      description: ''
    });
    setImagePreview(null);
    setIsPrivate(false);
    setShowAdvancedOptions(false);
  };
  const toggleImageSelection = async (image: SeriesImage) => {
    try {
      await updateSeriesImageSelection(image.id, !image.is_selected);
      setSeriesImages(prev => prev.map(img => img.id === image.id ? {
        ...img,
        is_selected: !img.is_selected
      } : img));
    } catch (error: any) {
      console.error('Error updating image selection:', error);
      toast({
        title: "Update failed",
        description: "Failed to update image selection.",
        variant: "destructive"
      });
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSignedIn) {
      toast({
        title: "Authentication required",
        description: "Please connect your wallet or sign in to create a design.",
        variant: "destructive"
      });
      return;
    }

    // If in series mode, start the series instead
    if (!currentSeries && createSeriesMode) {
      await startSeries();
      return;
    }

    // Use prompt as description if no description provided
    const description = formData.description.trim() || prompt.trim();
    const name = formData.name.trim() || 'Untitled Design';
    if (!description) {
      toast({
        title: "Missing description",
        description: "Please enter a description or prompt for your design.",
        variant: "destructive"
      });
      return;
    }
    if (!imagePreview) {
      toast({
        title: "Missing image",
        description: "Please generate an image from your prompt first.",
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const finalImageUrl = imagePreview;
      const designData = {
        name,
        description,
        image_url: finalImageUrl,
        price: null,
        license: null,
        private: isPrivate,
        series_id: currentSeries?.id || null
      };
      const createdDesign = await createDesign(designData, account?.address);
      toast({
        title: "Design Created Successfully!",
        description: "Your design has been successfully created."
      });

      // Reset form only if not in series mode
      if (!currentSeries) {
        setFormData({
          name: '',
          description: ''
        });
        setImagePreview(null);
        setIsPrivate(false);
        setShowAdvancedOptions(false);
      } else {
        // Just clear the image preview for next generation
        setImagePreview(null);
      }
    } catch (error: any) {
      toast({
        title: "Creation failed",
        description: "There was an error creating your design. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background">
      {!isSignedIn && !account ? <div className="flex items-center justify-center min-h-screen">
          <AuthCard />
        </div> : <div className="flex h-screen w-full">
          {/* Sidebar */}
          <CreateSidebar isExpanded={sidebarExpanded} onToggle={() => setSidebarExpanded(!sidebarExpanded)} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            

            {/* Content */}
            <div className="flex-1 flex flex-col p-6">
            {/* Image Preview */}
            <div className="mb-6 flex justify-center">
              <div className="border border-border rounded-lg p-4 bg-muted/30 min-h-[200px] flex flex-col items-center justify-center">
                {currentSeries && <div className="mb-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Grid3X3 className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">Series Mode</span>
                      <Button variant="ghost" size="sm" onClick={resetToSingleMode} className="h-6 w-6 p-0 ml-2">
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Locked prompt: "{lockedPrompt}"
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {seriesImages.length} image{seriesImages.length !== 1 ? 's' : ''} generated
                    </div>
                  </div>}
                
                {currentSeries && seriesImages.length > 0 ?
              // Show series images grid when in series mode
              <div className="w-full max-w-2xl">
                    <div className="text-sm text-muted-foreground mb-3 text-center">
                      Series Images (click to select/deselect for publishing)
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {seriesImages.map((image, index) => <div key={image.id} className={`relative cursor-pointer rounded-lg border-2 transition-all hover:shadow-md ${image.is_selected ? 'border-primary bg-primary/10 shadow-md' : 'border-border bg-muted/50 hover:border-primary/50'}`} onClick={() => toggleImageSelection(image)}>
                          <img src={image.image_url} alt={`Series image ${index + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 border-white shadow-sm ${image.is_selected ? 'bg-primary' : 'bg-gray-400'}`}>
                            {image.is_selected && <div className="w-full h-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>}
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                            #{index + 1}
                          </div>
                        </div>)}
                    </div>
                  </div> : imagePreview ? <img src={imagePreview} alt="Generated preview" className="max-w-md max-h-64 rounded-md" onLoad={() => console.log('Image loaded successfully')} onError={e => {
                console.error('Image failed to load:', e);
                setImagePreview(null);
                toast({
                  title: "Image display error",
                  description: "Generated image could not be displayed. Please try again.",
                  variant: "destructive"
                });
              }} /> : <div className="text-muted-foreground text-center">
                    <div className="text-sm">
                      {currentSeries ? 'Generate images for your series' : 'No image generated yet'}
                    </div>
                    <div className="text-xs mt-1">
                      {currentSeries ? 'Click Generate to add images to your series' : 'Enter a prompt and click Generate'}
                    </div>
                  </div>}
              </div>
            </div>

            {/* Main Input Container */}
            <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full">
              <div className="border border-border rounded-xl bg-card shadow-sm">
                {/* Main Input Area */}
                <div className="p-3">
                  <Textarea placeholder={currentSeries ? `Series prompt is locked: "${lockedPrompt}"` : createSeriesMode && !currentSeries ? "Enter a prompt to start your series..." : "What would you like to create today?"} value={currentSeries ? lockedPrompt : prompt} onChange={e => !currentSeries && setPrompt(e.target.value)} disabled={!!currentSeries} className={`min-h-[80px] resize-none border-0 shadow-none focus:outline-none text-base bg-transparent placeholder:text-muted-foreground/60 ${currentSeries ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>

                {/* Advanced Options */}
                {showAdvancedOptions && <div className="px-6 pb-4 border-t border-border/50">
                    <div className="space-y-4 pt-4">
                      <div>
                        <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Design name" className="mt-1" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="text-sm" placeholder="Width" min="256" max="2048" step="64" />
                          <Label className="text-xs text-muted-foreground">Width</Label>
                        </div>
                        <div>
                          <Input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="text-sm" placeholder="Height" min="256" max="2048" step="64" />
                          <Label className="text-xs text-muted-foreground">Height</Label>
                        </div>
                      </div>
                    </div>
                  </div>}

                {/* Bottom Bar */}
                <div className="flex items-center justify-between px-6 py-2 bg-muted/30 rounded-b-xl border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="h-8 w-8 p-0">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="private" checked={isPrivate} onCheckedChange={checked => setIsPrivate(checked as boolean)} />
                      <Label htmlFor="private" className="text-sm">
                        Private
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="create-series" checked={createSeriesMode} onCheckedChange={checked => {
                      if (!currentSeries) {
                        setCreateSeriesMode(checked as boolean);
                      }
                    }} disabled={!!currentSeries} />
                      <Label htmlFor="create-series" className="text-sm">
                        Series
                      </Label>
                    </div>
                    
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue>
                          {model === 'flux' && 'Flux'}
                          {model === 'turbo' && 'Turbo'}
                          {model === 'dreamshaper' && 'DreamShaper'}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="flux">
                          <div className="flex flex-col">
                            <span>Flux</span>
                            <span className="text-xs text-muted-foreground">High quality, detailed images</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="turbo">
                          <div className="flex flex-col">
                            <span>Turbo</span>
                            <span className="text-xs text-muted-foreground">Fast generation, good quality</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="dreamshaper">
                          <div className="flex flex-col">
                            <span>DreamShaper</span>
                            <span className="text-xs text-muted-foreground">Artistic, creative styles</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                     {currentSeries ? <>
                         <Button type="button" disabled={generating || !currentSeries && !prompt.trim()} onClick={createImageAndMint} size="sm" className="h-8 px-3">
                           {generating ? <>
                               <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                               Generating...
                             </> : 'Add Image'}
                         </Button>
                         
                         <Button type="button" disabled={loading || seriesImages.length === 0} onClick={handlePublishSeries} size="sm" className="h-8 px-3">
                           {loading ? <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" /> : null}
                           Publish Series
                         </Button>
                       </> : <Button type="button" disabled={generating || isMinting || !prompt.trim()} onClick={createImageAndMint} size="sm" className="h-8 px-3">
                         {generating || isMinting ? <>
                             <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                             {generating ? 'Creating...' : 'Minting...'}
                           </> : createSeriesMode && !currentSeries ? 'Start Series' : 'Create'}
                       </Button>}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>}
    </div>;
};
export default Create;