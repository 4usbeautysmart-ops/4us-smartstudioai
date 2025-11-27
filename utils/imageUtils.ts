// This function takes a base64 image string and adds a watermark
export const addWatermark = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        if (!base64Str) return resolve(base64Str);

        const img = new Image();
        img.src = base64Str;
        // Handle CORS issues if images are from external sources (not the case here, but good practice)
        img.crossOrigin = 'Anonymous'; 

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            canvas.width = img.width;
            canvas.height = img.height;

            // Draw the original image
            ctx.drawImage(img, 0, 0);

            // Watermark text properties
            const watermarkText = "4us! Smart Studio AI";
            const padding = Math.max(20, Math.floor(canvas.width * 0.02)); // Responsive padding
            // Responsive font size based on image width
            const fontSize = Math.max(16, Math.floor(canvas.width / 45)); 
            
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Semi-transparent white
            ctx.textAlign = "right";
            ctx.textBaseline = "bottom";

            // Draw the watermark
            ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);

            // Return the new watermarked image as a base64 string
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = (error) => {
            console.error("Failed to load image for watermarking, returning original.", error);
            // If there's an error, just return the original string
            resolve(base64Str);
        };
    });
};
