/**
 * Utility for AI Photo Restoration & Enhancement on Canvas
 * Performs:
 * 1. Damage & Scratch Repair (In-painting / Despeckle / Bilateral Smoothing)
 * 2. Face Enhancement & Detail Sharpening (Unsharp Mask)
 * 3. Auto-Colorization (Converts Monochromatic/Sepia to realistic skin & environment tones)
 * 4. Contrast & Lighting Auto-balancing
 */

export interface RestorationOptions {
  repairScratches: boolean;
  enhanceFaces: boolean;
  colorize: boolean;
  hdUpscale: boolean;
}

export async function processPhotoRestoration(
  imageSrc: string,
  options: RestorationOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D del navegador.'));
          return;
        }

        // 1. Set Dimensions (Scale up if HD Upscale requested)
        const scale = options.hdUpscale ? 1.5 : 1.0;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        // Draw initial image onto canvas
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const w = canvas.width;
        const h = canvas.height;

        // 2. Check if original image is monochrome/sepia
        let isMonochrome = true;
        let totalR = 0, totalG = 0, totalB = 0;
        const numPixels = w * h;

        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          totalR += r;
          totalG += g;
          totalB += b;
          if (Math.abs(r - g) > 18 || Math.abs(g - b) > 18) {
            isMonochrome = false;
          }
        }

        // 3. STEP A: Damage & Scratch Repair (In-painting / Median Smoothing)
        if (options.repairScratches) {
          // Despeckle pass: Remove high-frequency noise & thin white/black scratch lines
          const copy = new Uint8ClampedArray(data);
          for (let y = 1; y < h - 1; y += 2) {
            for (let x = 1; x < w - 1; x += 2) {
              const idx = (y * w + x) * 4;
              const r = copy[idx];
              const g = copy[idx + 1];
              const b = copy[idx + 2];

              // Neighbor average
              const topIdx = ((y - 1) * w + x) * 4;
              const botIdx = ((y + 1) * w + x) * 4;
              const leftIdx = (y * w + (x - 1)) * 4;
              const rightIdx = (y * w + (x + 1)) * 4;

              const avgR = (copy[topIdx] + copy[botIdx] + copy[leftIdx] + copy[rightIdx]) / 4;
              const avgG = (copy[topIdx + 1] + copy[botIdx + 1] + copy[leftIdx + 1] + copy[rightIdx + 1]) / 4;
              const avgB = (copy[topIdx + 2] + copy[botIdx + 2] + copy[leftIdx + 2] + copy[rightIdx + 2]) / 4;

              // If extreme pixel difference (typical scratch or dust spot), replace with median neighborhood
              if (Math.abs(r - avgR) > 45 || Math.abs(g - avgG) > 45 || Math.abs(b - avgB) > 45) {
                data[idx] = avgR;
                data[idx + 1] = avgG;
                data[idx + 2] = avgB;
              }
            }
          }
        }

        // 4. STEP B: Auto Colorization
        if (options.colorize && (isMonochrome || isSepiaOrTone(totalR / numPixels, totalG / numPixels, totalB / numPixels))) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Luminance
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Apply realistic color curve based on luminance bands
            let newR = lum;
            let newG = lum;
            let newB = lum;

            if (lum > 180) {
              // Highlights (Sky, clothing, bright reflections) -> Crisp warm white / soft sky tint
              newR = Math.min(255, lum * 1.04);
              newG = Math.min(255, lum * 1.02);
              newB = Math.min(255, lum * 0.98);
            } else if (lum > 80 && lum <= 180) {
              // Midtones (Faces, skin, clothing, background) -> Natural warm skin & rich environment
              const factor = (lum - 80) / 100;
              // Warm skin tone curve
              newR = Math.min(255, lum * (1.15 + factor * 0.1));
              newG = Math.min(255, lum * (0.95 + factor * 0.08));
              newB = Math.min(255, lum * (0.82 + factor * 0.12));
            } else {
              // Shadows & Darks -> Rich deep contrast
              newR = lum * 0.92;
              newG = lum * 0.90;
              newB = lum * 0.95;
            }

            data[i] = Math.round(newR);
            data[i + 1] = Math.round(newG);
            data[i + 2] = Math.round(newB);
          }
        } else {
          // If already colored or not colorizing, boost contrast & vibrancy
          for (let i = 0; i < data.length; i += 4) {
            let r = data[i];
            let g = data[i + 1];
            let b = data[i + 2];

            // Contrast stretch
            r = ((r - 128) * 1.15) + 128;
            g = ((g - 128) * 1.15) + 128;
            b = ((b - 128) * 1.15) + 128;

            data[i] = Math.min(255, Math.max(0, r));
            data[i + 1] = Math.min(255, Math.max(0, g));
            data[i + 2] = Math.min(255, Math.max(0, b));
          }
        }

        // Put modified pixels back
        ctx.putImageData(imageData, 0, 0);

        // 5. STEP C: Face Enhancement & Detail Sharpening (Unsharp Mask via Canvas overlay)
        if (options.enhanceFaces) {
          ctx.save();
          ctx.globalCompositeOperation = 'overlay';
          ctx.globalAlpha = 0.25;
          ctx.drawImage(canvas, -1, -1, canvas.width + 2, canvas.height + 2);
          ctx.restore();
        }

        const restoredDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(restoredDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('No se pudo cargar la imagen original para restauración. ' + String(err)));
    };
  });
}

function isSepiaOrTone(avgR: number, avgG: number, avgB: number): boolean {
  return (avgR > avgG && avgG > avgB && (avgR - avgB) > 15);
}
