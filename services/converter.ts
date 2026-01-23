import { GifFrame } from '../types';

/**
 * Helper function to draw rounded rectangle path
 */
const roundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

/**
 * Converts an image file to a specified format Blob.
 * Uses the browser's native Canvas API.
 */
export const convertImage = (file: File, targetFormat: string, quality: number = 0.9): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill white background for JPEG/formats that don't support transparency
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas conversion failed'));
        }
      }, targetFormat, quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Compress an image with specified quality
 */
export const compressImage = (file: File, quality: number): Promise<Blob> => {
  const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  return convertImage(file, format, quality);
};

/**
 * Resize an image to specified dimensions
 */
export const resizeImage = (
  file: File,
  width: number,
  height: number,
  maintainAspect: boolean = true
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let targetWidth = width;
      let targetHeight = height;

      if (maintainAspect) {
        const ratio = img.width / img.height;
        if (width / height > ratio) {
          targetWidth = height * ratio;
        } else {
          targetHeight = width / ratio;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Resize failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Generate ICO file with multiple sizes
 * ICO format: Header + Directory entries + Image data (PNG format)
 */
export const generateIco = async (file: File, sizes: number[]): Promise<Blob> => {
  const img = new Image();
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      try {
        const pngBlobs: { size: number; data: Uint8Array }[] = [];

        // Generate PNG for each size
        for (const size of sizes) {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, size, size);

          const pngBlob = await new Promise<Blob>((res, rej) => {
            canvas.toBlob((blob) => {
              if (blob) res(blob);
              else rej(new Error('Failed to generate PNG'));
            }, 'image/png');
          });

          const arrayBuffer = await pngBlob.arrayBuffer();
          pngBlobs.push({ size, data: new Uint8Array(arrayBuffer) });
        }

        // Build ICO file
        const headerSize = 6;
        const dirEntrySize = 16;
        const numImages = pngBlobs.length;

        // Calculate total size
        let totalDataSize = headerSize + (dirEntrySize * numImages);
        for (const png of pngBlobs) {
          totalDataSize += png.data.length;
        }

        const icoBuffer = new ArrayBuffer(totalDataSize);
        const view = new DataView(icoBuffer);
        const uint8 = new Uint8Array(icoBuffer);

        // ICO Header
        view.setUint16(0, 0, true);  // Reserved
        view.setUint16(2, 1, true);  // Type: 1 = ICO
        view.setUint16(4, numImages, true);  // Number of images

        // Directory entries and image data
        let dataOffset = headerSize + (dirEntrySize * numImages);

        for (let i = 0; i < pngBlobs.length; i++) {
          const png = pngBlobs[i];
          const entryOffset = headerSize + (i * dirEntrySize);

          // Directory entry
          view.setUint8(entryOffset, png.size >= 256 ? 0 : png.size);  // Width
          view.setUint8(entryOffset + 1, png.size >= 256 ? 0 : png.size);  // Height
          view.setUint8(entryOffset + 2, 0);  // Color palette
          view.setUint8(entryOffset + 3, 0);  // Reserved
          view.setUint16(entryOffset + 4, 1, true);  // Color planes
          view.setUint16(entryOffset + 6, 32, true);  // Bits per pixel
          view.setUint32(entryOffset + 8, png.data.length, true);  // Image size
          view.setUint32(entryOffset + 12, dataOffset, true);  // Image offset

          // Copy PNG data
          uint8.set(png.data, dataOffset);
          dataOffset += png.data.length;
        }

        URL.revokeObjectURL(objectUrl);
        resolve(new Blob([icoBuffer], { type: 'image/x-icon' }));
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Extract all frames from a GIF using canvas
 * This is a simplified approach - for full GIF support, consider using gif.js or similar
 */
export const extractGifFrames = async (file: File): Promise<GifFrame[]> => {
  // We'll use a library approach by loading the GIF and parsing it
  // For browser compatibility, we'll use the ImageDecoder API if available,
  // otherwise fall back to a canvas-based approach

  if ('ImageDecoder' in window) {
    return extractGifFramesWithImageDecoder(file);
  } else {
    // Fallback: use a simple single-frame extraction
    // For full multi-frame support, we need to parse the GIF binary
    return extractGifFramesManual(file);
  }
};

/**
 * Extract GIF frames using the modern ImageDecoder API
 */
const extractGifFramesWithImageDecoder = async (file: File): Promise<GifFrame[]> => {
  const frames: GifFrame[] = [];

  // @ts-ignore - ImageDecoder might not be in TypeScript types yet
  const decoder = new ImageDecoder({
    data: await file.arrayBuffer(),
    type: 'image/gif',
  });

  await decoder.tracks.ready;
  const track = decoder.tracks.selectedTrack;

  if (!track) {
    throw new Error('No track found in GIF');
  }

  const frameCount = track.frameCount;

  for (let i = 0; i < frameCount; i++) {
    const result = await decoder.decode({ frameIndex: i });
    const frame = result.image;

    const canvas = document.createElement('canvas');
    canvas.width = frame.displayWidth;
    canvas.height = frame.displayHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(frame, 0, 0);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/png');
    });

    frames.push({
      id: `frame-${i}`,
      frameIndex: i,
      dataUrl: canvas.toDataURL('image/png'),
      blob,
      delay: frame.duration / 1000, // Convert to ms
    });

    frame.close();
  }

  decoder.close();
  return frames;
};

/**
 * Manual GIF frame extraction by parsing the binary data
 */
const extractGifFramesManual = async (file: File): Promise<GifFrame[]> => {
  const arrayBuffer = await file.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  // Parse GIF header
  const signature = String.fromCharCode(...data.slice(0, 6));
  if (!signature.startsWith('GIF')) {
    throw new Error('Invalid GIF file');
  }

  // Get logical screen dimensions
  const width = data[6] | (data[7] << 8);
  const height = data[8] | (data[9] << 8);
  const packed = data[10];
  const hasGlobalColorTable = (packed & 0x80) !== 0;
  const globalColorTableSize = hasGlobalColorTable ? 3 * Math.pow(2, (packed & 0x07) + 1) : 0;

  let offset = 13 + globalColorTableSize;
  const frames: GifFrame[] = [];

  // Create a canvas for compositing frames
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // We need to decode each frame - this requires a full GIF decoder
  // For simplicity, let's use a trick: create multiple img elements and capture frames
  // This won't work for all GIFs but handles simple cases

  // Alternative approach: use the file as an animated image and capture visible frame
  const img = document.createElement('img');
  const objectUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      // For browsers without ImageDecoder, we can only get the first frame reliably
      // We'll draw the image and return it as a single frame
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          frames.push({
            id: 'frame-0',
            frameIndex: 0,
            dataUrl: canvas.toDataURL('image/png'),
            blob,
            delay: 100,
          });

          // Show a message that full frame extraction requires a modern browser
          console.warn('Full GIF frame extraction requires a browser with ImageDecoder API support (Chrome 94+)');
          resolve(frames);
        } else {
          reject(new Error('Failed to extract frame'));
        }
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load GIF'));
    };

    img.src = objectUrl;
  });
};

/**
 * Formats bytes into human readable string
 */
export const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Crop an image to specified area
 */
export const cropImage = (
  file: File,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      // Ensure crop bounds are valid
      // Allow user to crop outside? No, clip to bounds.
      const safeX = Math.max(0, x);
      const safeY = Math.max(0, y);
      const safeWidth = Math.min(width, img.width - safeX);
      const safeHeight = Math.min(height, img.height - safeY);

      if (safeWidth <= 0 || safeHeight <= 0) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Invalid crop dimensions'));
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = safeWidth;
      canvas.height = safeHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, safeX, safeY, safeWidth, safeHeight, 0, 0, safeWidth, safeHeight);

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Crop failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Rotate and/or flip an image
 * @param angle - Rotation angle in degrees (0, 90, 180, 270, or any value)
 * @param flipH - Flip horizontally
 * @param flipV - Flip vertically
 */
export const rotateImage = (
  file: File,
  angle: number = 0,
  flipH: boolean = false,
  flipV: boolean = false
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const radians = (angle * Math.PI) / 180;
      const sin = Math.abs(Math.sin(radians));
      const cos = Math.abs(Math.cos(radians));

      // Calculate new dimensions after rotation
      const newWidth = img.width * cos + img.height * sin;
      const newHeight = img.width * sin + img.height * cos;

      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Move to center, apply transformations, then draw
      ctx.translate(newWidth / 2, newHeight / 2);
      ctx.rotate(radians);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Rotate failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Adjust brightness and contrast of an image
 * @param brightness - Brightness adjustment (-100 to 100, 0 = no change)
 * @param contrast - Contrast adjustment (-100 to 100, 0 = no change)
 */
export const adjustBrightnessContrast = (
  file: File,
  brightness: number = 0,
  contrast: number = 0
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to usable factors
      const brightnessFactor = brightness / 100 * 255;
      const contrastFactor = (contrast + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
        // Apply contrast (centered at 128)
        data[i] = ((data[i] - 128) * contrastFactor + 128) + brightnessFactor;
        data[i + 1] = ((data[i + 1] - 128) * contrastFactor + 128) + brightnessFactor;
        data[i + 2] = ((data[i + 2] - 128) * contrastFactor + 128) + brightnessFactor;

        // Clamp values
        data[i] = Math.max(0, Math.min(255, data[i]));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
      }

      ctx.putImageData(imageData, 0, 0);

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Brightness/contrast adjustment failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

/**
 * Convert image to grayscale (black and white)
 */
export const grayscaleImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      // Get image data for pixel manipulation
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Use luminosity formula for natural-looking grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        data[i] = gray;     // R
        data[i + 1] = gray; // G
        data[i + 2] = gray; // B
        // Alpha (data[i + 3]) remains unchanged
      }

      ctx.putImageData(imageData, 0, 0);

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Grayscale conversion failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

// ==================== P2: WATERMARK & COLLAGE ====================

export interface TextWatermarkOptions {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
  rotation: number;
}

/**
 * Add text watermark to an image
 */
export const addTextWatermark = (
  file: File,
  options: TextWatermarkOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Setup text style
      ctx.font = `${options.fontSize}px ${options.fontFamily}`;
      ctx.fillStyle = options.color;
      ctx.globalAlpha = options.opacity;

      const textMetrics = ctx.measureText(options.text);
      const textWidth = textMetrics.width;
      const textHeight = options.fontSize;

      if (options.position === 'tile') {
        // Tile watermark across entire image
        ctx.save();
        ctx.rotate((options.rotation * Math.PI) / 180);

        const spacing = Math.max(textWidth, textHeight) * 2;
        for (let y = -canvas.height; y < canvas.height * 2; y += spacing) {
          for (let x = -canvas.width; x < canvas.width * 2; x += spacing) {
            ctx.fillText(options.text, x, y);
          }
        }
        ctx.restore();
      } else {
        // Single position watermark
        let x: number, y: number;

        switch (options.position) {
          case 'top-left':
            x = 20;
            y = textHeight + 20;
            break;
          case 'top-right':
            x = canvas.width - textWidth - 20;
            y = textHeight + 20;
            break;
          case 'bottom-left':
            x = 20;
            y = canvas.height - 20;
            break;
          case 'bottom-right':
            x = canvas.width - textWidth - 20;
            y = canvas.height - 20;
            break;
          case 'center':
          default:
            x = (canvas.width - textWidth) / 2;
            y = (canvas.height + textHeight) / 2;
            break;
        }

        if (options.rotation !== 0) {
          ctx.save();
          ctx.translate(x + textWidth / 2, y - textHeight / 2);
          ctx.rotate((options.rotation * Math.PI) / 180);
          ctx.fillText(options.text, -textWidth / 2, textHeight / 2);
          ctx.restore();
        } else {
          ctx.fillText(options.text, x, y);
        }
      }

      ctx.globalAlpha = 1;

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Text watermark failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };

    img.src = objectUrl;
  });
};

export interface ImageWatermarkOptions {
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
  opacity: number;
  scale: number; // 0.1 to 1.0
}

/**
 * Add image watermark (logo) to an image
 */
export const addImageWatermark = (
  file: File,
  watermarkFile: File,
  options: ImageWatermarkOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const watermark = new Image();
    const objectUrl = URL.createObjectURL(file);
    const watermarkUrl = URL.createObjectURL(watermarkFile);

    let loadedCount = 0;
    const onBothLoaded = () => {
      loadedCount++;
      if (loadedCount < 2) return;

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        URL.revokeObjectURL(watermarkUrl);
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Calculate watermark size
      const wmWidth = watermark.width * options.scale;
      const wmHeight = watermark.height * options.scale;

      ctx.globalAlpha = options.opacity;

      if (options.position === 'tile') {
        // Tile watermark
        const spacingX = wmWidth * 1.5;
        const spacingY = wmHeight * 1.5;
        for (let y = 0; y < canvas.height; y += spacingY) {
          for (let x = 0; x < canvas.width; x += spacingX) {
            ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
          }
        }
      } else {
        // Single position
        let x: number, y: number;
        const padding = 20;

        switch (options.position) {
          case 'top-left':
            x = padding;
            y = padding;
            break;
          case 'top-right':
            x = canvas.width - wmWidth - padding;
            y = padding;
            break;
          case 'bottom-left':
            x = padding;
            y = canvas.height - wmHeight - padding;
            break;
          case 'bottom-right':
            x = canvas.width - wmWidth - padding;
            y = canvas.height - wmHeight - padding;
            break;
          case 'center':
          default:
            x = (canvas.width - wmWidth) / 2;
            y = (canvas.height - wmHeight) / 2;
            break;
        }

        ctx.drawImage(watermark, x, y, wmWidth, wmHeight);
      }

      ctx.globalAlpha = 1;

      const outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        URL.revokeObjectURL(watermarkUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image watermark failed'));
        }
      }, outputFormat, 0.92);
    };

    img.onload = onBothLoaded;
    watermark.onload = onBothLoaded;

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      URL.revokeObjectURL(watermarkUrl);
      reject(new Error('Failed to load image'));
    };

    watermark.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      URL.revokeObjectURL(watermarkUrl);
      reject(new Error('Failed to load watermark image'));
    };

    img.src = objectUrl;
    watermark.src = watermarkUrl;
  });
};

export interface StitchOptions {
  direction: 'vertical' | 'horizontal';
  gap: number;
  borderRadius: number;
  backgroundColor: string;
}

/**
 * Stitch multiple images into a long image (vertical or horizontal)
 */
export const stitchImages = (files: File[], options: StitchOptions): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (files.length === 0) {
      reject(new Error('No files provided'));
      return;
    }

    const images: HTMLImageElement[] = [];
    const objectUrls: string[] = [];
    let loadedCount = 0;

    const onAllLoaded = () => {
      let totalWidth = 0;
      let totalHeight = 0;

      if (options.direction === 'vertical') {
        // Vertical: max width, sum of heights + gaps
        images.forEach(img => {
          totalWidth = Math.max(totalWidth, img.width);
          totalHeight += img.height;
        });
        totalHeight += options.gap * (images.length - 1);
      } else {
        // Horizontal: sum of widths + gaps, max height
        images.forEach(img => {
          totalWidth += img.width;
          totalHeight = Math.max(totalHeight, img.height);
        });
        totalWidth += options.gap * (images.length - 1);
      }

      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill background
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each image
      let currentPos = 0;
      images.forEach(img => {
        if (options.direction === 'vertical') {
          const x = (totalWidth - img.width) / 2;

          // Apply border radius if needed
          if (options.borderRadius > 0) {
            ctx.save();
            roundRect(ctx, x, currentPos, img.width, img.height, options.borderRadius);
            ctx.clip();
            ctx.drawImage(img, x, currentPos);
            ctx.restore();
          } else {
            ctx.drawImage(img, x, currentPos);
          }

          currentPos += img.height + options.gap;
        } else {
          const y = (totalHeight - img.height) / 2;

          if (options.borderRadius > 0) {
            ctx.save();
            roundRect(ctx, currentPos, y, img.width, img.height, options.borderRadius);
            ctx.clip();
            ctx.drawImage(img, currentPos, y);
            ctx.restore();
          } else {
            ctx.drawImage(img, currentPos, y);
          }

          currentPos += img.width + options.gap;
        }
      });

      canvas.toBlob((blob) => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image stitching failed'));
        }
      }, 'image/png');
    };

    files.forEach((file, index) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      objectUrls.push(objectUrl);

      img.onload = () => {
        images[index] = img;
        loadedCount++;
        if (loadedCount === files.length) {
          onAllLoaded();
        }
      };

      img.onerror = () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = objectUrl;
    });
  });
};

export interface GridCollageOptions {
  columns: number;
  gap: number;
  backgroundColor: string;
}

/**
 * Create a grid collage from multiple images
 */
export const createGridCollage = (
  files: File[],
  options: GridCollageOptions
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (files.length === 0) {
      reject(new Error('No files provided'));
      return;
    }

    const images: HTMLImageElement[] = [];
    const objectUrls: string[] = [];
    let loadedCount = 0;

    const onAllLoaded = () => {
      const cols = options.columns;
      const rows = Math.ceil(images.length / cols);

      // Find the maximum cell size based on all images
      let maxCellWidth = 0;
      let maxCellHeight = 0;
      images.forEach(img => {
        maxCellWidth = Math.max(maxCellWidth, img.width);
        maxCellHeight = Math.max(maxCellHeight, img.height);
      });

      // Use uniform cell size
      const cellWidth = maxCellWidth;
      const cellHeight = maxCellHeight;

      const totalWidth = cols * cellWidth + (cols + 1) * options.gap;
      const totalHeight = rows * cellHeight + (rows + 1) * options.gap;

      const canvas = document.createElement('canvas');
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Fill background
      ctx.fillStyle = options.backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw each image in its grid cell, centered
      images.forEach((img, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);

        const cellX = options.gap + col * (cellWidth + options.gap);
        const cellY = options.gap + row * (cellHeight + options.gap);

        // Center image in cell
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = cellX + (cellWidth - scaledWidth) / 2;
        const y = cellY + (cellHeight - scaledHeight) / 2;

        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      });

      canvas.toBlob((blob) => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Grid collage failed'));
        }
      }, 'image/png');
    };

    files.forEach((file, index) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      objectUrls.push(objectUrl);

      img.onload = () => {
        images[index] = img;
        loadedCount++;
        if (loadedCount === files.length) {
          onAllLoaded();
        }
      };

      img.onerror = () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        reject(new Error(`Failed to load image: ${file.name}`));
      };

      img.src = objectUrl;
    });
  });
};