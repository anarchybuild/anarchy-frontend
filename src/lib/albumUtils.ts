/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Helper function to load an image and return it as an HTMLImageElement
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        // Setting crossOrigin is good practice for canvas operations, even with data URLs
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(new Error(`Failed to load image: ${src.substring(0, 50)}...`));
        img.src = src;
    });
}

/**
 * Creates a single "photo album" page image from a collection of themed images.
 * @param imageData A record mapping theme strings to their image data URLs.
 * @returns A promise that resolves to a data URL of the generated album page (JPEG format).
 */
export async function createAlbumPage(imageData: Record<string, string>): Promise<string> {
    const canvas = document.createElement('canvas');
    // High-resolution canvas for good quality (A4-like ratio)
    const canvasWidth = 2480;
    const canvasHeight = 3508;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Could not get 2D canvas context');
    }

    // 1. Draw the album page background
    ctx.fillStyle = '#fdf5e6'; // A warm, parchment-like color
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 2. Draw the title
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    ctx.font = `bold 120px 'Oswald', sans-serif`;
    ctx.fillText('Style Fusion Creations', canvasWidth / 2, 150);

    ctx.font = `50px 'Roboto', sans-serif`;
    ctx.fillStyle = '#555';
    ctx.fillText('Generated with Google AI Studio', canvasWidth / 2, 220);

    // 3. Load all the images concurrently
    const themes = Object.keys(imageData);
    const loadedImages = await Promise.all(
        Object.values(imageData).map(url => loadImage(url))
    );

    const imagesWithThemes = themes.map((theme, index) => ({
        theme,
        img: loadedImages[index],
    }));

    // 4. Define grid layout and draw each image card
    const grid = { cols: 2, rows: 3, padding: 100 };
    const contentTopMargin = 300; // Space for the header
    const contentHeight = canvasHeight - contentTopMargin;
    const cellWidth = (canvasWidth - grid.padding * (grid.cols + 1)) / grid.cols;
    const cellHeight = (contentHeight - grid.padding * (grid.rows + 1)) / grid.rows;

    const cardAspectRatio = 1.25; // height is 1.25 times width
    const maxCardWidth = cellWidth * 0.9;
    const maxCardHeight = cellHeight * 0.9;

    let cardWidth = maxCardWidth;
    let cardHeight = cardWidth * cardAspectRatio;

    if (cardHeight > maxCardHeight) {
        cardHeight = maxCardHeight;
        cardWidth = cardHeight / cardAspectRatio;
    }

    const imageContainerWidth = cardWidth * 0.9;
    const imageContainerHeight = imageContainerWidth * (4 / 3); // Slightly taller than wide

    imagesWithThemes.forEach(({ theme, img }, index) => {
        const row = Math.floor(index / grid.cols);
        const col = index % grid.cols;

        const x = grid.padding * (col + 1) + cellWidth * col + (cellWidth - cardWidth) / 2;
        const y = contentTopMargin + grid.padding * (row + 1) + cellHeight * row + (cellHeight - cardHeight) / 2;
        
        ctx.save();
        
        ctx.translate(x + cardWidth / 2, y + cardHeight / 2);
        
        const rotation = (Math.random() - 0.5) * 0.08; // Radians (approx. +/- 2 degrees)
        ctx.rotate(rotation);
        
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 15;
        
        // Draw the dark card background
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
        
        ctx.shadowColor = 'transparent';
        
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let drawWidth = imageContainerWidth;
        let drawHeight = drawWidth / aspectRatio;

        if (drawHeight > imageContainerHeight) {
            drawHeight = imageContainerHeight;
            drawWidth = drawHeight * aspectRatio;
        }

        const imageAreaTopMargin = (cardWidth - imageContainerWidth) / 2;
        const imageContainerY = -cardHeight / 2 + imageAreaTopMargin;
        
        const imgX = -drawWidth / 2;
        const imgY = imageContainerY + (imageContainerHeight - drawHeight) / 2;
        
        ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight);
        
        // Draw the caption
        ctx.fillStyle = '#e5e5e5';
        ctx.font = `60px 'Oswald', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const captionAreaTop = imageContainerY + imageContainerHeight;
        const captionAreaBottom = cardHeight / 2;
        const captionY = captionAreaTop + (captionAreaBottom - captionAreaTop) / 2;

        ctx.fillText(theme, 0, captionY);
        
        ctx.restore();
    });

    return canvas.toDataURL('image/jpeg', 0.9);
}