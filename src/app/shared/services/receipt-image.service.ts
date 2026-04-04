import { Injectable } from '@angular/core';

export interface ResizedImageResult {
  blob: Blob;
  width: number;
  height: number;
}

/** Otsu threshold for bimodal images (dark text, light paper). */
function otsuThreshold(hist: number[], total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * hist[i];
  }
  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      threshold = t;
    }
  }
  return threshold;
}

@Injectable({ providedIn: 'root' })
export class ReceiptImageService {
  /**
   * Resize + grayscale + Otsu binarization + PNG for OCR.
   * Thermal struk and phone photos are much easier for Tesseract as black-on-white bitmaps
   * than as JPEG colour noise.
   */
  async prepareImageForOcr(
    file: File,
    maxDimension = 2200
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
    const hist = new Array(256).fill(0);

    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const g = Math.round(
        0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]
      );
      gray[i] = g;
      hist[g]++;
    }

    const T = otsuThreshold(hist, n);

    for (let i = 0, p = 0; i < n; i++, p += 4) {
      const v = gray[i] < T ? 0 : 255;
      d[p] = d[p + 1] = d[p + 2] = v;
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
