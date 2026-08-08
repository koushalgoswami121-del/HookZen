import { ImageAnalysisMetrics } from '../types';

/**
 * Analyzes image pixel data using an HTML5 Canvas element.
 * Measures brightness, contrast, color vibrancy, aspect ratio, and focal entropy.
 */
export async function analyzeImageCanvas(
  fileOrUrl?: File | string | null
): Promise<ImageAnalysisMetrics> {
  // Default metrics if no image provided
  if (!fileOrUrl) {
    return {
      hasImage: false,
      width: 1080,
      height: 1920,
      aspectRatio: 0.5625,
      isNineToSixteen: true,
      averageBrightness: 0,
      contrastRatio: 0,
      colorVibrancy: 0,
      focalEntropy: 0,
      visualScore: 35,
      feedback: [
        'No custom thumbnail or first frame uploaded.',
        'Upload a vertical 9:16 high-contrast thumbnail with text overlay to maximize click-through rate.',
      ],
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = '';
    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrUrl);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);

      const width = img.naturalWidth || 1080;
      const height = img.naturalHeight || 1920;
      const aspectRatio = width / height;
      const isNineToSixteen = Math.abs(aspectRatio - 9 / 16) < 0.15;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Downscale to 200x200 for lightning fast pixel processing
      const sampleSize = 200;
      canvas.width = sampleSize;
      canvas.height = sampleSize;

      let averageBrightness = 128;
      let contrastRatio = 50;
      let colorVibrancy = 50;
      let focalEntropy = 50;
      const feedback: string[] = [];

      if (ctx) {
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;
        const totalPixels = sampleSize * sampleSize;

        let totalLuminance = 0;
        let totalSat = 0;
        const luminances: number[] = [];

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          // Standard relative luminance formula
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          totalLuminance += lum;
          luminances.push(lum);

          // Color saturation estimate
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = max === 0 ? 0 : (max - min) / max;
          totalSat += sat;
        }

        averageBrightness = totalLuminance / totalPixels;
        const avgSat = totalSat / totalPixels;
        colorVibrancy = Math.min(100, Math.round(avgSat * 120));

        // RMS Contrast calculation
        let sumSquaredDiff = 0;
        for (let i = 0; i < luminances.length; i++) {
          sumSquaredDiff += Math.pow(luminances[i] - averageBrightness, 2);
        }
        const stdDevLum = Math.sqrt(sumSquaredDiff / totalPixels);
        contrastRatio = Math.min(100, Math.round((stdDevLum / 128) * 100));

        // Grid-based focal entropy (detects if center of image has distinct subject/contrast)
        let centerLuminanceDiff = 0;
        const centerStart = Math.floor(sampleSize * 0.3);
        const centerEnd = Math.floor(sampleSize * 0.7);
        let centerCount = 0;

        for (let y = centerStart; y < centerEnd; y++) {
          for (let x = centerStart; x < centerEnd; x++) {
            const idx = (y * sampleSize + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            centerLuminanceDiff += Math.abs(lum - averageBrightness);
            centerCount++;
          }
        }

        const avgCenterDiff = centerLuminanceDiff / (centerCount || 1);
        focalEntropy = Math.min(100, Math.round((avgCenterDiff / 64) * 100));
      }

      // Compute visual score out of 100
      let visualScore = 50;

      // Aspect ratio check (vertical 9:16 gets +20 pts)
      if (isNineToSixteen) {
        visualScore += 25;
        feedback.push('Aspect ratio is vertical 9:16 — perfect for mobile feeds.');
      } else {
        visualScore += 5;
        feedback.push('Non-vertical image aspect ratio. Vertical 9:16 fills screen 2.4x better.');
      }

      // Brightness check (ideal 90-180)
      if (averageBrightness >= 90 && averageBrightness <= 180) {
        visualScore += 25;
        feedback.push('Optimal lighting & brightness balance.');
      } else if (averageBrightness < 90) {
        visualScore += 10;
        feedback.push('Image is too dark. Increase exposure or face lighting for feed clarity.');
      } else {
        visualScore += 15;
        feedback.push('Image is slightly overexposed. Keep key subjects well-defined.');
      }

      // Contrast check (ideal > 45)
      if (contrastRatio >= 45) {
        visualScore += 25;
        feedback.push('High visual contrast grabs attention during fast scrolling.');
      } else {
        visualScore += 10;
        feedback.push('Low contrast. Main subject blends into background.');
      }

      // Vibrancy check
      if (colorVibrancy >= 35) {
        visualScore += 25;
        feedback.push('Vibrant color palette increases scroll-stop rate.');
      } else {
        visualScore += 12;
        feedback.push('Muted colors. Consider adding punchy warm accents or high-contrast text overlay.');
      }

      visualScore = Math.min(100, Math.max(10, Math.round(visualScore)));

      // Data URL generation if file was passed
      let dataUrl: string | undefined = undefined;
      if (typeof fileOrUrl === 'string') {
        dataUrl = fileOrUrl;
      } else if (canvas) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }

      resolve({
        hasImage: true,
        dataUrl,
        width,
        height,
        aspectRatio: Number(aspectRatio.toFixed(3)),
        isNineToSixteen,
        averageBrightness: Math.round(averageBrightness),
        contrastRatio: Math.round(contrastRatio),
        colorVibrancy: Math.round(colorVibrancy),
        focalEntropy: Math.round(focalEntropy),
        visualScore,
        feedback,
      });
    };

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve({
        hasImage: false,
        width: 1080,
        height: 1920,
        aspectRatio: 0.5625,
        isNineToSixteen: true,
        averageBrightness: 120,
        contrastRatio: 50,
        colorVibrancy: 50,
        focalEntropy: 50,
        visualScore: 40,
        feedback: ['Image failed to load.'],
      });
    };
  });
}
