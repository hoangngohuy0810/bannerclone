import { LogoSettings } from '../types';

export const applyLogoToImage = async (
  base64Image: string,
  logoSettings: LogoSettings
): Promise<string> => {
  if (!logoSettings.image) return base64Image;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      resolve(base64Image);
      return;
    }

    const mainImg = new Image();
    mainImg.crossOrigin = 'anonymous';
    mainImg.onload = () => {
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;
      
      // Draw main image
      ctx.drawImage(mainImg, 0, 0);

      const logoImg = new Image();
      logoImg.crossOrigin = 'anonymous';
      logoImg.onload = () => {
        // Calculate logo dimensions
        // logoSettings.size is percentage of main image width
        const logoWidth = mainImg.width * (logoSettings.size / 100);
        const logoRatio = logoImg.height / logoImg.width;
        const logoHeight = logoWidth * logoRatio;

        // Calculate position based on center point
        // positionX and positionY are percentages (0-100)
        const centerX = mainImg.width * (logoSettings.positionX / 100);
        const centerY = mainImg.height * (logoSettings.positionY / 100);
        
        const x = centerX - (logoWidth / 2);
        const y = centerY - (logoHeight / 2);

        if (logoSettings.addWhiteBorder) {
          // Draw white border using shadow
          ctx.shadowColor = 'white';
          ctx.shadowBlur = 0;
          
          // Draw multiple times with offset to create a solid border
          const borderSize = Math.max(2, mainImg.width * 0.005); // Responsive border size
          
          const offsets = [
            [borderSize, borderSize],
            [-borderSize, -borderSize],
            [borderSize, -borderSize],
            [-borderSize, borderSize],
            [borderSize, 0],
            [-borderSize, 0],
            [0, borderSize],
            [0, -borderSize]
          ];

          offsets.forEach(([ox, oy]) => {
            ctx.shadowOffsetX = ox;
            ctx.shadowOffsetY = oy;
            ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);
          });

          // Reset shadow for the main logo draw
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        }

        // Draw the actual logo
        ctx.drawImage(logoImg, x, y, logoWidth, logoHeight);

        resolve(canvas.toDataURL('image/png'));
      };
      
      logoImg.onerror = () => {
        console.error("Failed to load logo image");
        resolve(base64Image); // Fallback to original
      };
      
      logoImg.src = logoSettings.image as string;
    };

    mainImg.onerror = () => {
      console.error("Failed to load main image");
      resolve(base64Image);
    };

    mainImg.src = base64Image;
  });
};
