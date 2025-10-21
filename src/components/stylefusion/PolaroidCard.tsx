/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { DraggableCardContainer, DraggableCardBody } from '../ui/draggable-card';
import { cn } from '@/lib/utils';
import type { PanInfo } from 'framer-motion';

type ImageStatus = 'pending' | 'done' | 'error';

interface ImageCardProps {
    imageUrl?: string;
    caption: string;
    status: ImageStatus;
    error?: string;
    dragConstraintsRef?: React.RefObject<HTMLElement>;
    onShake?: () => void;
    onDownload?: () => void;
    isMobile?: boolean; // Keep for mobile-specific button logic if needed
}

const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-8 w-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

const ErrorDisplay = ({ error }: { error?: string }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="mt-2 text-sm text-red-300">{error ? "Generation failed." : "An error occurred."}</p>
    </div>
);

const Placeholder = () => (
    <div className="flex flex-col items-center justify-center h-full text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="font-bold text-2xl tracking-wide">Upload Portrait</span>
    </div>
);


const ImageCard: React.FC<ImageCardProps> = ({ imageUrl, caption, status, error, dragConstraintsRef, onShake, onDownload, isMobile }) => {
    const [isDeveloped, setIsDeveloped] = useState(false);
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const lastShakeTime = useRef(0);
    const lastVelocity = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (status === 'pending' || (status === 'done' && imageUrl)) {
            setIsDeveloped(false);
            setIsImageLoaded(false);
        }
    }, [imageUrl, status]);

    useEffect(() => {
        if (isImageLoaded) {
            const timer = setTimeout(() => setIsDeveloped(true), 200);
            return () => clearTimeout(timer);
        }
    }, [isImageLoaded]);

    const handleDragStart = () => {
        lastVelocity.current = { x: 0, y: 0 };
    };

    const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (!onShake || isMobile) return;

        const velocityThreshold = 1500;
        const shakeCooldown = 2000;
        const now = Date.now();

        if (info.velocity.x * lastVelocity.current.x < 0 && Math.abs(info.velocity.x) > velocityThreshold && (now - lastShakeTime.current > shakeCooldown)) {
            lastShakeTime.current = now;
            onShake();
        }

        lastVelocity.current = info.velocity;
    };
    
    // Determine if the card is interactable for regeneration (shake or button press)
    const isRegenerateable = status === 'done' || status === 'error';


    const cardInnerContent = (
        <>
            <div className="w-full bg-neutral-900 shadow-inner flex-grow relative overflow-hidden group rounded-sm">
                {status === 'pending' && <LoadingSpinner />}
                {status === 'error' && <ErrorDisplay error={error}/>}
                {status === 'done' && imageUrl && (
                    <>
                        <div className={cn(
                            "absolute top-2 right-2 z-20 flex flex-col gap-2 transition-opacity duration-300",
                            "opacity-100 sm:opacity-0 sm:group-hover:opacity-100", // Always visible on mobile-sized screens
                        )}>
                            {onDownload && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDownload(); }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Download image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                </button>
                            )}
                            {onShake && isRegenerateable && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onShake(); }}
                                    className="p-2 bg-black/50 rounded-full text-white hover:bg-black/75 focus:outline-none focus:ring-2 focus:ring-white"
                                    aria-label={`Regenerate image for ${caption}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.899 2.186l-1.42.71a5.002 5.002 0 00-8.479-1.554H10a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm12 14a1 1 0 01-1-1v-2.101a7.002 7.002 0 01-11.899-2.186l1.42-.71a5.002 5.002 0 008.479 1.554H10a1 1 0 110-2h6a1 1 0 011 1v6a1 1 0 01-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div
                            className={`absolute inset-0 z-10 bg-[#3a322c] transition-opacity duration-[3500ms] ease-out ${isDeveloped ? 'opacity-0' : 'opacity-100'}`}
                            aria-hidden="true"
                        />
                        <img
                            key={imageUrl}
                            src={imageUrl}
                            alt={caption}
                            onLoad={() => setIsImageLoaded(true)}
                            className={`w-full h-full object-cover transition-all duration-[4000ms] ease-in-out ${isDeveloped ? 'opacity-100 filter-none' : 'opacity-80 filter sepia(1) contrast(0.8) brightness(0.8)'}`}
                            style={{ opacity: isImageLoaded ? undefined : 0 }}
                        />
                    </>
                )}
                {status === 'done' && !imageUrl && <Placeholder />}
            </div>
            <div className="absolute bottom-4 left-4 right-4 text-center px-2">
                <p className={cn(
                    "font-bold text-2xl truncate tracking-wide",
                    status === 'done' && imageUrl ? 'text-neutral-100' : 'text-neutral-600'
                )}>
                    {caption}
                </p>
            </div>
        </>
    );

    const cardStyles = "bg-neutral-800/50 p-3 pb-12 flex flex-col items-center justify-start aspect-[3/4] w-80 max-w-full rounded-md shadow-lg relative border border-neutral-700/50";

    // Use Draggable Card for desktop for the physics-based interactions
    if (dragConstraintsRef) {
         return (
            <DraggableCardContainer>
                <DraggableCardBody 
                    className={cn(cardStyles, "!p-3 !pb-12")}
                    dragConstraintsRef={dragConstraintsRef}
                    onDragStart={handleDragStart}
                    onDrag={handleDrag}
                >
                    {cardInnerContent}
                </DraggableCardBody>
            </DraggableCardContainer>
        );
    }
    
    // A simpler, non-draggable card for other uses (like the main uploaded image)
    return (
        <div className={cardStyles}>
            {cardInnerContent}
        </div>
    );
};

export default ImageCard;