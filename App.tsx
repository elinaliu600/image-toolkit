import React, { useState, useCallback, useEffect } from 'react';
import {
  Images, Zap, Trash2, DownloadCloud, Loader2, Menu, X,
  FileImage, FileType, Minimize2, Maximize2, Film, Box, ArrowRightLeft, Crop,
  RotateCw, Sun, Contrast, Type, Stamp, Rows, LayoutGrid, Pipette, Camera, Clapperboard
} from 'lucide-react';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { Uploader } from './components/Uploader';
import { ImageListItem } from './components/ImageListItem';
import { IcoOptions } from './components/IcoOptions';
import { GifFrameList } from './components/GifFrameList';
import { CompressOptions } from './components/CompressOptions';
import { ResizeOptions } from './components/ResizeOptions';
import { CropOptions } from './components/CropOptions';
import { RotateOptions } from './components/RotateOptions';
import { BrightnessOptions } from './components/BrightnessOptions';
import { TextWatermarkOptions } from './components/TextWatermarkOptions';
import { ImageWatermarkOptions } from './components/ImageWatermarkOptions';
import { LongImageOptions } from './components/LongImageOptions';
import { ColorPickerOptions } from './components/ColorPickerOptions';
import { VideoScreenshotOptions } from './components/VideoScreenshotOptions';
import { PixelCrop } from 'react-image-crop';
import { ImageFile, ConversionStatus, ToolConfig, GifFrame, ICO_SIZES } from './types';
import {
  convertImage, compressImage, resizeImage, cropImage, generateIco, extractGifFrames, formatBytes,
  rotateImage, adjustBrightnessContrast, grayscaleImage,
  addTextWatermark, addImageWatermark, stitchImages,
  TextWatermarkOptions as TextWatermarkOptionsType, ImageWatermarkOptions as ImageWatermarkOptionsType, StitchOptions
} from './services/converter';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Define available tools
const TOOLS: ToolConfig[] = [
  // ========== 格式转换 ==========
  {
    id: 'format-convert',
    name: '图片格式转换',
    description: '支持 PNG/JPG/WebP/SVG/PDF 输入，转换为 PNG/JPG/WebP 输出',
    icon: ArrowRightLeft,
    accept: 'image/*,.svg,.pdf',
    targetFormat: 'image/png',
    targetExt: 'png',
    toolType: 'convert',
    category: 'format'
  },

  // ========== 图片编辑 ==========
  {
    id: 'compress',
    name: '图片压缩',
    description: '压缩图片体积，可调节质量',
    icon: Minimize2,
    accept: 'image/jpeg,image/png,image/webp',
    toolType: 'compress',
    category: 'edit'
  },
  {
    id: 'resize',
    name: '尺寸调整',
    description: '调整图片宽高尺寸',
    icon: Maximize2,
    accept: 'image/*',
    toolType: 'resize',
    category: 'edit'
  },
  {
    id: 'crop',
    name: '批量裁切',
    description: '批量裁切图片到指定区域',
    icon: Crop,
    accept: 'image/*',
    toolType: 'crop',
    category: 'edit'
  },
  {
    id: 'rotate',
    name: '旋转/翻转',
    description: '旋转或镜像翻转图片',
    icon: RotateCw,
    accept: 'image/*',
    toolType: 'rotate',
    category: 'edit'
  },
  {
    id: 'brightness',
    name: '亮度/对比度',
    description: '调整图片亮度和对比度',
    icon: Sun,
    accept: 'image/*',
    toolType: 'brightness',
    category: 'edit'
  },
  {
    id: 'grayscale',
    name: '黑白/去色',
    description: '将图片转为黑白效果',
    icon: Contrast,
    accept: 'image/*',
    toolType: 'grayscale',
    category: 'edit'
  },

  // ========== 水印工具 ==========
  {
    id: 'text-watermark',
    name: '文字水印',
    description: '批量添加文字水印',
    icon: Type,
    accept: 'image/*',
    toolType: 'text-watermark',
    category: 'watermark'
  },
  {
    id: 'image-watermark',
    name: '图片水印',
    description: '批量添加 Logo 水印',
    icon: Stamp,
    accept: 'image/*',
    toolType: 'image-watermark',
    category: 'watermark'
  },

  // ========== 拼图工具 ==========
  {
    id: 'long-image',
    name: '长图拼接',
    description: '多张图片拼接成长图',
    icon: Rows,
    accept: 'image/*',
    toolType: 'long-image',
    category: 'collage'
  },

  // ========== 取色工具 ==========
  {
    id: 'color-picker',
    name: '拾色器',
    description: '从图片中吸取颜色',
    icon: Pipette,
    accept: 'image/*',
    toolType: 'color-picker',
    category: 'color'
  },

  // ========== 视频工具 ==========
  {
    id: 'video-screenshot',
    name: '视频截图',
    description: '从视频中截取帧画面',
    icon: Camera,
    accept: 'video/*',
    toolType: 'video-screenshot',
    category: 'video'
  },

  // ========== 动图工具 ==========
  {
    id: 'gif-extract',
    name: 'GIF 帧提取',
    description: '提取 GIF 动画的所有帧',
    icon: Film,
    accept: 'image/gif',
    targetExt: 'png',
    toolType: 'gif-extract',
    category: 'animation'
  },
  {
    id: 'ico-generator',
    name: 'ICO 生成器',
    description: '生成多尺寸 ICO 图标文件',
    icon: Box,
    accept: 'image/png,image/jpeg,image/webp',
    targetExt: 'ico',
    toolType: 'ico',
    category: 'animation'
  },
  {
    id: 'apng',
    name: 'APNG 动图制作',
    description: '多张 PNG 合成动态 PNG',
    icon: Clapperboard,
    accept: 'image/png',
    targetExt: 'apng',
    toolType: 'apng',
    category: 'animation',
    disabled: true
  },
];

// Batch convert target formats
const BATCH_FORMATS = [
  { label: 'PNG', format: 'image/png', ext: 'png' },
  { label: 'JPG', format: 'image/jpeg', ext: 'jpg' },
  { label: 'WebP', format: 'image/webp', ext: 'webp' },
  { label: 'GIF', format: 'image/gif', ext: 'gif' },
  { label: 'BMP', format: 'image/bmp', ext: 'bmp' },
];

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolConfig>(TOOLS[0]);
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Tool-specific states
  const [icoSizes, setIcoSizes] = useState<number[]>([32, 64, 128, 256]);
  const [gifFrames, setGifFrames] = useState<GifFrame[]>([]);
  const [gifFileName, setGifFileName] = useState('');
  const [compressQuality, setCompressQuality] = useState(0.75);
  const [resizeWidth, setResizeWidth] = useState(800);
  const [resizeHeight, setResizeHeight] = useState(600);
  const [resizeOriginalWidth, setResizeOriginalWidth] = useState(800);
  const [resizeOriginalHeight, setResizeOriginalHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [batchTargetFormat, setBatchTargetFormat] = useState(BATCH_FORMATS[0]);
  const [isExtractingGif, setIsExtractingGif] = useState(false);

  // Crop states
  const [crop, setCrop] = useState<PixelCrop>({ unit: 'px', x: 0, y: 0, width: 0, height: 0 });
  const [activeCropFileId, setActiveCropFileId] = useState<string>('');

  // Rotate states
  const [rotateAngle, setRotateAngle] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Brightness/Contrast states
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);

  // Text watermark states
  const [wmText, setWmText] = useState('水印文字');
  const [wmFontSize, setWmFontSize] = useState(48);
  const [wmFontFamily, setWmFontFamily] = useState('sans-serif');
  const [wmColor, setWmColor] = useState('#000000');
  const [wmOpacity, setWmOpacity] = useState(0.5);
  const [wmPosition, setWmPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'>('bottom-right');
  const [wmRotation, setWmRotation] = useState(0);

  // Image watermark states
  const [imgWmFile, setImgWmFile] = useState<File | null>(null);
  const [imgWmPosition, setImgWmPosition] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile'>('bottom-right');
  const [imgWmOpacity, setImgWmOpacity] = useState(0.7);
  const [imgWmScale, setImgWmScale] = useState(0.3);

  // Long image stitch options
  const [stitchDirection, setStitchDirection] = useState<'vertical' | 'horizontal'>('vertical');
  const [stitchGap, setStitchGap] = useState(0);
  const [stitchBorderRadius, setStitchBorderRadius] = useState(0);
  const [stitchBgColor, setStitchBgColor] = useState('#FFFFFF');

  // Video screenshot state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoScreenshots, setVideoScreenshots] = useState<{ blob: Blob; timestamp: number }[]>([]);

  // Watch for crop changes to reset status
  const handleCropChange = (newCrop: PixelCrop) => {
    setCrop(newCrop);
    if (activeTool.toolType === 'crop' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };

  // Wrapper for rotate changes - reset status on change
  const handleRotateAngleChange = (angle: number) => {
    setRotateAngle(angle);
    if (activeTool.toolType === 'rotate' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };
  const handleFlipHChange = (flip: boolean) => {
    setFlipH(flip);
    if (activeTool.toolType === 'rotate' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };
  const handleFlipVChange = (flip: boolean) => {
    setFlipV(flip);
    if (activeTool.toolType === 'rotate' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };

  // Wrapper for brightness changes - reset status on change
  const handleBrightnessChange = (value: number) => {
    setBrightness(value);
    if (activeTool.toolType === 'brightness' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };
  const handleContrastChange = (value: number) => {
    setContrast(value);
    if (activeTool.toolType === 'brightness' && files.some(f => f.status === ConversionStatus.COMPLETED)) {
      setFiles(prev => prev.map(f => f.status === ConversionStatus.COMPLETED ? { ...f, status: ConversionStatus.IDLE } : f));
    }
  };

  // Clear files when tool changes
  useEffect(() => {
    setFiles([]);
    setGifFrames([]);
    setGifFrames([]);
    setGifFileName('');
    setCrop({ unit: 'px', x: 0, y: 0, width: 0, height: 0 });
    setActiveCropFileId('');
  }, [activeTool]);

  // Update resize dimensions when first file is added
  useEffect(() => {
    if (activeTool.toolType === 'resize' && files.length === 1 && files[0].file) {
      const img = new Image();
      img.onload = () => {
        setResizeOriginalWidth(img.width);
        setResizeOriginalHeight(img.height);
        setResizeWidth(img.width);
        setResizeHeight(img.height);
      };
      img.src = files[0].previewUrl;
    }
  }, [files, activeTool]);

  // Set initial crop file when files added
  useEffect(() => {
    if (activeTool.toolType === 'crop' && files.length > 0 && !activeCropFileId) {
      setActiveCropFileId(files[0].id);
    }
  }, [files, activeTool, activeCropFileId]);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    if (activeTool.toolType === 'gif-extract') {
      // For GIF extraction, only handle one file and extract frames
      if (newFiles.length > 0) {
        const gifFile = newFiles[0];
        setGifFileName(gifFile.name);
        setIsExtractingGif(true);
        extractGifFrames(gifFile)
          .then((frames) => {
            setGifFrames(frames);
            setIsExtractingGif(false);
          })
          .catch((error) => {
            console.error('GIF extraction error:', error);
            setIsExtractingGif(false);
            alert('GIF 帧提取失败: ' + error.message);
          });
      }
      return;
    }

    // For video screenshot, handle video file separately
    if (activeTool.toolType === 'video-screenshot') {
      if (newFiles.length > 0) {
        setVideoFile(newFiles[0]);
        setVideoScreenshots([]);
      }
      return;
    }

    const newImageFiles: ImageFile[] = newFiles.map((file) => ({
      id: generateId(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: ConversionStatus.IDLE,
      originalSize: file.size,
    }));

    setFiles((prev) => [...prev, ...newImageFiles]);
  }, [activeTool]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
        if (fileToRemove.convertedUrl) {
          URL.revokeObjectURL(fileToRemove.convertedUrl);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleClearAll = useCallback(() => {
    files.forEach((f) => {
      URL.revokeObjectURL(f.previewUrl);
      if (f.convertedUrl) URL.revokeObjectURL(f.convertedUrl);
    });
    setFiles([]);
    setGifFrames([]);
  }, [files]);

  const convertSingleFile = async (id: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: ConversionStatus.PROCESSING } : f))
    );

    const fileItem = files.find((f) => f.id === id);
    if (!fileItem) return;

    try {
      let convertedBlob: Blob;

      switch (activeTool.toolType) {
        case 'compress':
          convertedBlob = await compressImage(fileItem.file, compressQuality);
          break;
        case 'resize':
          convertedBlob = await resizeImage(fileItem.file, resizeWidth, resizeHeight, maintainAspect);
          break;
        case 'crop':
          // Ensure we have valid crop
          if (crop.width > 0 && crop.height > 0) {
            convertedBlob = await cropImage(fileItem.file, crop.x, crop.y, crop.width, crop.height);
          } else {
            // Return original if no crop set? Or fail? 
            // Better to return original or error. returning original for safety.
            convertedBlob = await convertImage(fileItem.file, fileItem.file.type);
          }
          break;
        case 'ico':
          if (icoSizes.length === 0) {
            throw new Error('请至少选择一个尺寸');
          }
          convertedBlob = await generateIco(fileItem.file, icoSizes);
          break;
        case 'rotate':
          convertedBlob = await rotateImage(fileItem.file, rotateAngle, flipH, flipV);
          break;
        case 'brightness':
          convertedBlob = await adjustBrightnessContrast(fileItem.file, brightness, contrast);
          break;
        case 'grayscale':
          convertedBlob = await grayscaleImage(fileItem.file);
          break;
        case 'text-watermark':
          convertedBlob = await addTextWatermark(fileItem.file, {
            text: wmText,
            fontSize: wmFontSize,
            fontFamily: wmFontFamily,
            color: wmColor,
            opacity: wmOpacity,
            position: wmPosition,
            rotation: wmRotation,
          });
          break;
        case 'image-watermark':
          if (!imgWmFile) {
            throw new Error('请先上传水印图片');
          }
          convertedBlob = await addImageWatermark(fileItem.file, imgWmFile, {
            position: imgWmPosition,
            opacity: imgWmOpacity,
            scale: imgWmScale,
          });
          break;
        case 'convert':
        default:
          const targetFormat = activeTool.id === 'format-convert'
            ? batchTargetFormat.format
            : activeTool.targetFormat!;
          convertedBlob = await convertImage(fileItem.file, targetFormat);
          break;
      }

      const convertedUrl = URL.createObjectURL(convertedBlob);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: ConversionStatus.COMPLETED, convertedUrl, convertedBlob }
            : f
        )
      );
    } catch (error: any) {
      console.error(error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: ConversionStatus.ERROR, errorMessage: error.message }
            : f
        )
      );
    }
  };

  const handleConvertAll = async () => {
    const filesToConvert = files.filter((f) => f.status === ConversionStatus.IDLE);
    if (filesToConvert.length === 0) return;

    setIsProcessingAll(true);

    // Special handling for multi-file tools (they produce a single output)
    if (activeTool.toolType === 'long-image') {
      try {
        // Mark all as processing
        setFiles(prev => prev.map(f => ({ ...f, status: ConversionStatus.PROCESSING })));

        const resultBlob = await stitchImages(files.map(f => f.file), {
          direction: stitchDirection,
          gap: stitchGap,
          borderRadius: stitchBorderRadius,
          backgroundColor: stitchBgColor,
        });

        const resultUrl = URL.createObjectURL(resultBlob);

        // Mark first file as completed with the result, others as completed but empty
        setFiles(prev => prev.map((f, index) => ({
          ...f,
          status: ConversionStatus.COMPLETED,
          convertedUrl: index === 0 ? resultUrl : undefined,
          convertedBlob: index === 0 ? resultBlob : undefined,
        })));
      } catch (error: any) {
        console.error(error);
        setFiles(prev => prev.map(f => ({
          ...f,
          status: ConversionStatus.ERROR,
          errorMessage: error.message,
        })));
      }
    } else {
      // Normal per-file processing
      for (const file of filesToConvert) {
        await convertSingleFile(file.id);
      }
    }

    setIsProcessingAll(false);
  };

  const getTargetExt = () => {
    if (activeTool.id === 'format-convert') return batchTargetFormat.ext;
    if (activeTool.toolType === 'compress' || activeTool.toolType === 'resize') {
      return files[0]?.file.type.includes('png') ? 'png' : 'jpg';
    }
    // Explicitly handle long-image and grid-collage (if restored)
    if (activeTool.toolType === 'long-image') return 'png';
    return activeTool.targetExt || 'png';
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter((f) => f.status === ConversionStatus.COMPLETED && f.convertedBlob);
    if (completedFiles.length === 0) return;

    // For long-image, just download the single merged result directly
    // Check both toolType and id to be safe
    if (activeTool.toolType === 'long-image' || activeTool.id === 'long-image') {
      const result = completedFiles.find(f => f.convertedBlob);
      if (result && result.convertedUrl) {
        const link = document.createElement('a');
        link.href = result.convertedUrl;
        link.download = `长图拼接_${Date.now()}.png`;
        link.click();
      }
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();

    // Use getTargetExt() to ensure consistency and avoid undefined extension
    const ext = getTargetExt();

    completedFiles.forEach((file) => {
      const originalName = file.file.name.substring(0, file.file.name.lastIndexOf('.'));
      zip.file(`${originalName}.${ext}`, file.convertedBlob!);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `converted_images_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    setIsZipping(false);
  };

  const idleCount = files.filter((f) => f.status === ConversionStatus.IDLE).length;
  const completedCount = files.filter((f) => f.status === ConversionStatus.COMPLETED).length;

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar
        tools={TOOLS}
        activeTool={activeTool}
        onToolSelect={setActiveTool}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  {React.createElement(activeTool.icon, { className: 'w-6 h-6 text-indigo-600' })}
                  {activeTool.name}
                </h1>
                <p className="text-sm text-slate-500">{activeTool.description}</p>
              </div>
            </div>

            {files.length > 0 && activeTool.toolType !== 'gif-extract' && (
              <div className="flex items-center gap-3">
                <div className="flex gap-2">

                  <button
                    onClick={handleConvertAll}
                    disabled={isProcessingAll || (activeTool.toolType === 'ico' && icoSizes.length === 0)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isProcessingAll ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    转换全部 ({idleCount > 0 ? idleCount : files.length})
                  </button>

                </div>

                {completedCount > 1 && (
                  <button
                    onClick={handleDownloadAll}
                    disabled={isZipping}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                  >
                    {isZipping ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <DownloadCloud className="w-5 h-5" />
                    )}
                    下载全部
                  </button>
                )}

                <button
                  onClick={handleClearAll}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="清空全部"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-6 max-w-5xl mx-auto space-y-6">
          {/* Tool-specific options */}
          {activeTool.toolType === 'ico' && (
            <IcoOptions selectedSizes={icoSizes} onSizesChange={setIcoSizes} />
          )}

          {activeTool.toolType === 'compress' && files.length > 0 && (
            <CompressOptions quality={compressQuality} onQualityChange={setCompressQuality} />
          )}

          {activeTool.toolType === 'resize' && files.length === 1 && (
            <ResizeOptions
              width={resizeWidth}
              height={resizeHeight}
              originalWidth={resizeOriginalWidth}
              originalHeight={resizeOriginalHeight}
              maintainAspect={maintainAspect}
              onWidthChange={setResizeWidth}
              onHeightChange={setResizeHeight}
              onMaintainAspectChange={setMaintainAspect}
            />
          )}

          {activeTool.toolType === 'crop' && files.length > 0 && (() => {
            const activeFile = files.find(f => f.id === activeCropFileId) || files[0];
            return (
              <CropOptions
                imgSrc={activeFile.previewUrl}
                crop={crop}
                onCropChange={handleCropChange}
                files={files.map(f => ({ id: f.id, name: f.file.name }))}
                activeFileId={activeCropFileId || activeFile.id}
                onActiveFileChange={setActiveCropFileId}
              />
            );
          })()}

          {activeTool.toolType === 'rotate' && files.length > 0 && (
            <RotateOptions
              angle={rotateAngle}
              flipH={flipH}
              flipV={flipV}
              onAngleChange={handleRotateAngleChange}
              onFlipHChange={handleFlipHChange}
              onFlipVChange={handleFlipVChange}
            />
          )}

          {activeTool.toolType === 'brightness' && files.length > 0 && (
            <BrightnessOptions
              brightness={brightness}
              contrast={contrast}
              onBrightnessChange={handleBrightnessChange}
              onContrastChange={handleContrastChange}
              imgSrc={files[0].previewUrl}
            />
          )}

          {activeTool.toolType === 'text-watermark' && files.length > 0 && (
            <TextWatermarkOptions
              text={wmText}
              fontSize={wmFontSize}
              fontFamily={wmFontFamily}
              color={wmColor}
              opacity={wmOpacity}
              position={wmPosition}
              rotation={wmRotation}
              onTextChange={setWmText}
              onFontSizeChange={setWmFontSize}
              onFontFamilyChange={setWmFontFamily}
              onColorChange={setWmColor}
              onOpacityChange={setWmOpacity}
              onPositionChange={setWmPosition}
              onRotationChange={setWmRotation}
              imgSrc={files[0].previewUrl}
            />
          )}

          {activeTool.toolType === 'image-watermark' && files.length > 0 && (
            <ImageWatermarkOptions
              watermarkFile={imgWmFile}
              position={imgWmPosition}
              opacity={imgWmOpacity}
              scale={imgWmScale}
              onWatermarkFileChange={setImgWmFile}
              onPositionChange={setImgWmPosition}
              onOpacityChange={setImgWmOpacity}
              onScaleChange={setImgWmScale}
              imgSrc={files[0].previewUrl}
            />
          )}

          {activeTool.toolType === 'long-image' && files.length > 0 && (
            <LongImageOptions
              files={files.map(f => ({ id: f.id, name: f.file.name, previewUrl: f.previewUrl, size: f.originalSize }))}
              onReorder={(fromIndex, toIndex) => {
                setFiles(prev => {
                  const newFiles = [...prev];
                  const [removed] = newFiles.splice(fromIndex, 1);
                  newFiles.splice(toIndex, 0, removed);
                  return newFiles;
                });
              }}
              onRemove={(id) => {
                setFiles(prev => prev.filter(f => f.id !== id));
              }}
              direction={stitchDirection}
              gap={stitchGap}
              borderRadius={stitchBorderRadius}
              backgroundColor={stitchBgColor}
              onDirectionChange={setStitchDirection}
              onGapChange={setStitchGap}
              onBorderRadiusChange={setStitchBorderRadius}
              onBackgroundColorChange={setStitchBgColor}
            />
          )}

          {activeTool.toolType === 'color-picker' && files.length > 0 && (
            <ColorPickerOptions imgSrc={files[0].previewUrl} />
          )}

          {activeTool.toolType === 'video-screenshot' && videoFile && (
            <VideoScreenshotOptions
              videoFile={videoFile}
              onScreenshotCapture={(blob, timestamp) => {
                setVideoScreenshots(prev => [...prev, { blob, timestamp }]);
              }}
            />
          )}

          {activeTool.id === 'format-convert' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">选择目标格式</h3>
              <div className="flex gap-3">
                {BATCH_FORMATS.map((format) => (
                  <button
                    key={format.ext}
                    onClick={() => setBatchTargetFormat(format)}
                    className={`
                      px-6 py-3 rounded-xl font-medium transition-all
                      ${batchTargetFormat.ext === format.ext
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }
                    `}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GIF Frame extraction */}
          {activeTool.toolType === 'gif-extract' ? (
            <>
              {gifFrames.length === 0 && !isExtractingGif && (
                <Uploader
                  onFilesSelected={handleFilesSelected}
                  accept={activeTool.accept}
                  description="拖放 GIF 文件或点击选择"
                />
              )}

              {isExtractingGif && (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
                  <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">正在提取 GIF 帧...</p>
                </div>
              )}

              {gifFrames.length > 0 && (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setGifFrames([]);
                        setGifFileName('');
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                      提取其他 GIF
                    </button>
                  </div>
                  <GifFrameList frames={gifFrames} originalFileName={gifFileName} />
                </>
              )}
            </>
          ) : (
            <>
              {/* Uploader */}
              <Uploader
                onFilesSelected={handleFilesSelected}
                accept={activeTool.accept}
                description={`拖放${activeTool.accept === 'image/*' ? '图片' : activeTool.accept.replace('image/', '').toUpperCase()}文件或点击选择`}
              />

              {/* File list */}
              {files.length > 0 && (
                <div className="space-y-3">
                  {files.map((file) => {
                    // Only show grayscale preview in thumbnails
                    // Brightness has its own large preview panel
                    let previewFilter: string | undefined;
                    if (activeTool.toolType === 'grayscale') {
                      previewFilter = 'grayscale(100%)';
                    }

                    return (
                      <ImageListItem
                        key={file.id}
                        item={file}
                        targetExt={getTargetExt()}
                        onRemove={handleRemoveFile}
                        previewFilter={previewFilter}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
