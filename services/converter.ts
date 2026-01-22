import { GifFrame } from '../types';

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