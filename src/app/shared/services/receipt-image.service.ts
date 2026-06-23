import { Injectable } from '@angular/core';

export interface ResizedImageResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Stretch contrast using 2nd–98th percentile of the histogram.
 * Helps low-contrast or overexposed phone photos before thresholding.
 * Modifies `gray` in place.
 */
function stretchContrast(gray: Uint8Array, hist: number[], total: number): void {
  const lowCut = total * 0.02;
  const highCut = total * 0.98;
  let cumsum = 0;
  let low = 0;
  let high = 255;
  let foundLow = false;

  for (let i = 0; i < 256; i++) {
    cumsum += hist[i];
    if (!foundLow && cumsum >= lowCut) { low = i; foundLow = true; }
    if (cumsum >= highCut) { high = i; break; }
  }

  const range = high - low || 1;
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.min(255, Math.max(0, Math.round((gray[i] - low) * 255 / range)));
  }
}

/**
 * Build a summed-area table (integral image) for O(1) local sum queries.
 * Output dimensions are (w+1) × (h+1) so boundary checks are trivial.
 */
function buildIntegral(gray: Uint8Array, w: number, h: number): Float64Array {
  const ii = new Float64Array((w + 1) * (h + 1));
  const stride = w + 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      ii[(y + 1) * stride + (x + 1)] =
        gray[y * w + x] +
        ii[y * stride + (x + 1)] +
        ii[(y + 1) * stride + x] -
        ii[y * stride + x];
    }
  }
  return ii;
}

/**
 * Adaptive mean threshold.  Each pixel is classified as black (0) when its
 * intensity falls more than `offset` below the mean of the surrounding
 * `blockSize × blockSize` window.  Uses an integral image so cost is O(n).
 *
 * Compared with the old global-Otsu approach this handles shadows, gradients,
 * and uneven flash lighting that are common in hand-held phone photos of
 * paper receipts.
 */
function adaptiveThreshold(
  gray: Uint8Array,
  w: number,
  h: number,
  blockSize = 51,
  offset = 10
): Uint8Array {
  const ii = buildIntegral(gray, w, h);
  const half = Math.floor(blockSize / 2);
  const stride = w + 1;
  const out = new Uint8Array(gray.length);

  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - half);
    const y1 = Math.min(h - 1, y + half);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - half);
      const x1 = Math.min(w - 1, x + half);
      const area = (y1 - y0 + 1) * (x1 - x0 + 1);
      const sum =
        ii[(y1 + 1) * stride + (x1 + 1)] -
        ii[y0 * stride + (x1 + 1)] -
        ii[(y1 + 1) * stride + x0] +
        ii[y0 * stride + x0];
      out[y * w + x] = gray[y * w + x] < sum / area - offset ? 0 : 255;
    }
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class ReceiptImageService {
  /**
   * Resize + grayscale + contrast stretch + adaptive threshold + PNG for OCR.
   * Adaptive thresholding handles uneven lighting and shadows in hand-held photos
   * far better than the previous global-Otsu approach.
   */
  async prepareImageForOcr(
    file: File,
    maxDimension = 2400
  ): Promise<ResizedImageResult> {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const maxSide = Math.max(width, height);

    if (maxSide > maxDimension) {
      const scale = maxDimension / maxSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      bitmap.close();
      throw new Error('Could not get canvas context');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const imageData = ctx.getImageData(0, 0, width, height);
    const d = imageData.data;
    const n = width * height;
    const gray = new Uint8Array(n);
    const hist = new Array<number>(256).fill(0);

    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const g = Math.round(0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]);
      gray[i] = g;
      hist[g]++;
    }

    // Auto-levels: stretch the tonal range before binarization.
    stretchContrast(gray, hist, n);

    // Adaptive threshold: each pixel is compared against its local neighbourhood mean.
    const binary = adaptiveThreshold(gray, width, height, 51, 10);

    for (let i = 0, p = 0; i < n; i++, p += 4) {
      d[p] = d[p + 1] = d[p + 2] = binary[i];
      d[p + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('PNG export failed'))),
        'image/png'
      );
    });

    return { blob, width, height };
  }

  /** Downscales large photos before OCR to reduce CPU/memory use (legacy / non-OCR). */
  async resizeToJpeg(
    file: File,
    maxDimension = 1600,
    quality = 0.82
  ): Promise<ResizedImageResult> {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;
    const maxSide = Math.max(width, height);

    if (maxSide > maxDimension) {
      const scale = maxDimension / maxSide;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      throw new Error('Could not get canvas context');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Image export failed'))),
        'image/jpeg',
        quality
      );
    });

    return { blob, width, height };
  }
}
