import { useEffect, useRef } from 'react';

interface MetallicPaintParams {
  edge?: number;
  patternBlur?: number;
  patternScale?: number;
  refraction?: number;
  speed?: number;
  liquid?: number;
}

interface MetallicPaintProps {
  imageData: ImageData;
  params?: MetallicPaintParams;
}

export const parseLogoImage = async (file: File): Promise<{ imageData: ImageData } | null> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve({ imageData });
        } else {
          resolve(null);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const MetallicPaint = ({ imageData, params = {} }: MetallicPaintProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const {
      edge = 2,
      patternBlur = 0.005,
      patternScale = 2,
      refraction = 0.015,
      speed = 0.3,
      liquid = 0.07,
    } = params;

    let time = 0;
    const width = canvas.width;
    const height = canvas.height;

    // Create pattern
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = width * patternScale;
    patternCanvas.height = height * patternScale;
    const patternCtx = patternCanvas.getContext('2d');

    if (!patternCtx) return;

    // Generate noise pattern
    const generatePattern = () => {
      const imageDataPattern = patternCtx.createImageData(patternCanvas.width, patternCanvas.height);
      const data = imageDataPattern.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        data[i] = noise;
        data[i + 1] = noise;
        data[i + 2] = noise;
        data[i + 3] = 255;
      }
      
      patternCtx.putImageData(imageDataPattern, 0, 0);
    };

    generatePattern();

    const animate = () => {
      time += speed * 0.01;

      ctx.clearRect(0, 0, width, height);

      // Draw metallic effect
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');

      if (tempCtx) {
        // Draw logo mask
        tempCtx.putImageData(imageData, 0, 0);

        // Apply metallic effect
        ctx.save();
        
        // Create gradient for metallic look
        const gradient = ctx.createLinearGradient(
          0,
          0,
          width,
          height
        );
        
        const hue = (time * 50) % 360;
        gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
        gradient.addColorStop(0.5, `hsl(${(hue + 60) % 360}, 80%, 70%)`);
        gradient.addColorStop(1, `hsl(${(hue + 120) % 360}, 70%, 60%)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Apply pattern with animation
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.3;
        
        const offsetX = Math.sin(time) * width * liquid;
        const offsetY = Math.cos(time * 1.3) * height * liquid;
        
        ctx.drawImage(
          patternCanvas,
          offsetX,
          offsetY,
          width,
          height,
          0,
          0,
          width,
          height
        );

        // Apply logo mask
        ctx.globalCompositeOperation = 'destination-in';
        ctx.globalAlpha = 1;
        tempCtx.globalCompositeOperation = 'source-over';
        ctx.drawImage(tempCanvas, 0, 0);

        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageData, params]);

  return (
    <canvas
      ref={canvasRef}
      width={imageData.width}
      height={imageData.height}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
      }}
    />
  );
};

export default MetallicPaint;
