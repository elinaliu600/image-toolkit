import { LucideIcon } from 'lucide-react';

export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export type ToolType = 
  | 'convert'      // Basic format conversion
  | 'compress'     // Image compression
  | 'resize'       // Image resizing
  | 'ico'          // ICO generator
  | 'gif-extract'; // GIF frame extraction

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accept: string;      // HTML input accept attribute
  targetFormat?: string; // MIME type for output
  targetExt?: string;   // File extension for output
  toolType: ToolType;
  category: 'format' | 'optimize' | 'special';
}

export interface ImageFile {
  id: string;
  file: File;
  previewUrl: string;
  status: ConversionStatus;
  convertedUrl?: string;
  convertedBlob?: Blob;
  errorMessage?: string;
  originalSize: number;
}

export interface GifFrame {
  id: string;
  frameIndex: number;
  dataUrl: string;
  blob: Blob;
  delay: number;
}

export interface IcoSize {
  size: number;
  selected: boolean;
}

export const ICO_SIZES: number[] = [24, 32, 48, 64, 128, 256, 512];