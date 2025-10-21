/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { generateStyledImage } from './services/geminiService';
import ImageCard from './components/PolaroidCard';
import { createAlbumPage } from './lib/albumUtils';
import Footer from './components/Footer';

const GHOST_CARDS_CONFIG = [
  { initial: { x: "-150%", y: "-100%", rotate: -30 }, transition: { delay: 0.2 } },
  { initial: { x: "150%", y: "-80%", rotate: 25 }, transition: { delay: 0.4 } },
  { initial: { x: "-120%", y: "120%", rotate: 45 }, transition: { delay: 0.6 } },
  { initial: { x: "180%", y: "90%", rotate: -20 }, transition: { delay: 0.8 } },
  { initial: { x: "0%", y: "-200%", rotate: 0 }, transition: { delay: 0.5 } },
  { initial: { x: "100%", y: "150%", rotate: 10 }, transition: { delay: 0.3 } },
];

type ImageStatus = 'pending' | 'done' | 'error';
interface GeneratedImage {
    id: string;
    theme: string;
    status: ImageStatus;
    url?: string;
    error?: string;
}

const primaryButtonClasses = "font-oswald tracking-wide text-xl text-center text-neutral-800 bg-yellow-500 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:bg-yellow-400 shadow-[2px_2px_0px_2px_rgba(0,0,0,0.3)] border-2 border-yellow-600";
const secondaryButtonClasses = "font-oswald tracking-wide text-xl text-center text-neutral-200 bg-neutral-700/50 backdrop-blur-sm border-2 border-neutral-500/80 py-3 px-8 rounded-sm transform transition-transform duration-200 hover:scale-105 hover:bg-neutral-600";


function App() {
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [themeInput, setThemeInput] = useState<string>('');
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [appState, setAppState] = useState<'idle' | 'image-uploaded'>('idle');


    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setUploadedImage(reader.result as string);
                setAppState('image-uploaded');
                setGeneratedImages([]); // Clear previous results
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerateTheme = async (e: FormEvent) => {
        e.preventDefault();
        if (!uploadedImage || !themeInput.trim()) return;

        const currentTheme = themeInput.trim();
        const newImageId = crypto.randomUUID();

        // Add placeholder card
        setGeneratedImages(prev => [
            { id: newImageId, theme: currentTheme, status: 'pending' },
            ...prev
        ]);
        setThemeInput(''); // Clear input

        try {
            const prompt = `Reimagine the person in this photo in the style of ${currentTheme}. The output must be a photorealistic image showing the person clearly, capturing the essence and aesthetic of the theme.`;
            const resultUrl = await generateStyledImage(uploadedImage, prompt, currentTheme);
            setGeneratedImages(prev => prev.map(img =>
                img.id === newImageId ? { ...img, status: 'done', url: resultUrl } : img
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => prev.map(img =>
                img.id === newImageId ? { ...img, status: 'error', error: errorMessage } : img
            ));
            console.error(`Failed to generate image for ${currentTheme}:`, err);
        }
    };


    const handleRegenerateTheme = async (id: string, theme: string) => {
        if (!uploadedImage) return;

        const imageToRegen = generatedImages.find(img => img.id === id);
        if (imageToRegen?.status === 'pending') {
            return;
        }

        console.log(`Regenerating image for ${theme}...`);

        setGeneratedImages(prev => prev.map(img =>
            img.id === id ? { ...img, status: 'pending', url: undefined, error: undefined } : img
        ));

        try {
            const prompt = `Reimagine the person in this photo in the style of a ${theme}. This includes appropriate clothing, background, and accessories. The output must be a photorealistic image showing the person clearly.`;
            const resultUrl = await generateStyledImage(uploadedImage, prompt, theme);
            setGeneratedImages(prev => prev.map(img =>
                img.id === id ? { ...img, status: 'done', url: resultUrl } : img
            ));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
            setGeneratedImages(prev => prev.map(img =>
                img.id === id ? { ...img, status: 'error', error: errorMessage } : img
            ));
            console.error(`Failed to regenerate image for ${theme}:`, err);
        }
    };

    const handleReset = () => {
        setUploadedImage(null);
        setGeneratedImages([]);
        setThemeInput('');
        setAppState('idle');
    };

    const handleDownloadIndividualImage = (id: string) => {
        const image = generatedImages.find(img => img.id === id);
        if (image?.status === 'done' && image.url) {
            const link = document.createElement('a');
            link.href = image.url;
            link.download = `style-fusion-${image.theme.toLowerCase().replace(/\s+/g, '-')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleDownloadAlbum = async () => {
        setIsDownloading(true);
        try {
            const doneImages = generatedImages.filter(img => img.status === 'done' && img.url);

            if (doneImages.length === 0) {
                alert("No images have been successfully generated to include in an album.");
                return;
            }

            const imageData = doneImages.reduce((acc, image) => {
                acc[image.theme] = image.url!;
                return acc;
            }, {} as Record<string, string>);

            const albumDataUrl = await createAlbumPage(imageData);

            const link = document.createElement('a');
            link.href = albumDataUrl;
            link.download = 'style-fusion-album.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error("Failed to create or download album:", error);
            alert("Sorry, there was an error creating your album. Please try again.");
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <main className="bg-neutral-900 text-neutral-200 min-h-screen w-full flex flex-col items-center justify-start p-4 pb-24 overflow-x-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02]"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/80 to-transparent pointer-events-none"></div>

            <div className="z-10 flex flex-col items-center justify-start w-full h-full flex-1 min-h-0 pt-10">
                <div className="text-center mb-10">
                    <h1 className="text-6xl md:text-8xl font-oswald font-bold text-neutral-100 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] tracking-wider">Style Fusion</h1>
                    <p className="font-roboto text-neutral-300 mt-2 text-xl tracking-wide">Generate your new look.</p>
                </div>

                {appState === 'idle' && (
                    <div className="relative flex flex-col items-center justify-center w-full mt-8">
                        {GHOST_CARDS_CONFIG.map((config, index) => (
                            <motion.div
                                key={index}
                                className="absolute w-80 h-[26rem] rounded-md p-4 bg-neutral-800/20 blur-sm"
                                initial={config.initial}
                                animate={{ x: "0%", y: "0%", rotate: (Math.random() - 0.5) * 20, scale: 0, opacity: 0 }}
                                transition={{ ...config.transition, ease: "circOut", duration: 2 }}
                            />
                        ))}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2, duration: 0.8, type: 'spring' }}
                            className="flex flex-col items-center"
                        >
                            <label htmlFor="file-upload" className="cursor-pointer group transform hover:scale-105 transition-transform duration-300">
                                <ImageCard
                                    caption="Click to begin"
                                    status="done"
                                />
                            </label>
                            <input id="file-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} />
                            <p className="mt-8 font-roboto text-neutral-500 text-center max-w-xs text-lg">
                                Click the card to upload your portrait and begin.
                            </p>
                        </motion.div>
                    </div>
                )}

                {appState === 'image-uploaded' && uploadedImage && (
                    <div className="w-full max-w-6xl mx-auto flex flex-col items-center">
                        <div className="w-full flex flex-col md:flex-row items-center justify-center gap-8 mb-12 p-4 bg-black/20 rounded-lg border border-neutral-800">
                            <ImageCard
                                imageUrl={uploadedImage}
                                caption="Your Portrait"
                                status="done"
                            />
                            <div className="flex flex-col gap-6 items-center md:items-start w-full max-w-md">
                                <h2 className="font-oswald text-3xl text-neutral-100 tracking-wide">Enter a Theme</h2>
                                <form onSubmit={handleGenerateTheme} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                                    <input
                                        type="text"
                                        value={themeInput}
                                        onChange={(e) => setThemeInput(e.target.value)}
                                        placeholder="e.g., pirate, astronaut..."
                                        className="font-roboto text-lg bg-neutral-800 border-2 border-neutral-600 text-white placeholder-neutral-500 rounded-sm px-4 py-3 flex-grow focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                        aria-label="Enter a theme for image generation"
                                    />
                                    <button type="submit" className={`${primaryButtonClasses} text-lg`}>
                                        Generate
                                    </button>
                                </form>
                                <button onClick={handleReset} className={`${secondaryButtonClasses} text-lg`}>
                                    Start Over
                                </button>
                            </div>
                        </div>

                        {generatedImages.length > 0 && (
                            <div className="w-full">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {generatedImages.map((image) => (
                                        <motion.div
                                            key={image.id}
                                            className="flex justify-center"
                                            layout
                                            initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                        >
                                            <ImageCard
                                                caption={image.theme}
                                                status={image.status}
                                                imageUrl={image.url}
                                                error={image.error}
                                                onShake={() => handleRegenerateTheme(image.id, image.theme)}
                                                onDownload={() => handleDownloadIndividualImage(image.id)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
                                <div className="mt-12 text-center">
                                    <button
                                        onClick={handleDownloadAlbum}
                                        disabled={isDownloading}
                                        className={`${primaryButtonClasses} text-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isDownloading ? 'Creating Album...' : 'Download Album'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <Footer />
        </main>
    );
}

export default App;
