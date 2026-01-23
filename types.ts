import { LucideIcon } from 'lucide-react';

export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
}

export type ToolType =
  // Format conversion
  | 'convert'       // Unified format conversion (PNG/JPG/WebP/SVG/PDF)
  // Image editing
  | 'compress'      // Image compression
  | 'resize'        // Image resizing
  | 'crop'          // Image cropping
  | 'rotate'        // Rotate/flip
  | 'brightness'    // Brightness/contrast
  | 'grayscale'     // Grayscale/desaturate
  // Watermark
  | 'text-watermark'  // Text watermark
  | 'image-watermark' // Image/logo watermark
  // Collage
  | 'long-image'    // Long image stitching
  | 'grid-collage'  // Grid collage (2x2, 3x3, etc)
  // Color tools
  | 'color-picker'  // Color picker/eyedropper
  // Video tools
  | 'video-screenshot' // Video frame capture
  // Animation tools
  | 'ico'           // ICO generator
  | 'gif-extract'   // GIF frame extraction
  | 'apng';         // APNG creation

export type ToolCategory = 
  | 'format'      // 格式转换
  | 'edit'        // 图片编辑
  | 'watermark'   // 水印工具
  | 'collage'     // 拼图工具
  | 'color'       // 取色工具
  | 'video'       // 视频工具
  | 'animation';  // 动图工具

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accept: string;      // HTML input accept attribute
  targetFormat?: string; // MIME type for output
  targetExt?: string;   // File extension for output
  toolType: ToolType;
  category: ToolCategory;
  disabled?: boolean;  // For placeholder tools not yet implemented
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

// Category labels for sidebar
export const CATEGORY_LABELS: Record<ToolCategory, string> = {
  format: '格式转换',
  edit: '图片编辑',
  watermark: '水印工具',
  collage: '拼图工具',
  color: '取色工具',
  video: '视频工具',
  animation: '动图工具',
};