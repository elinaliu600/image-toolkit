import React, { useState, useCallback, useEffect } from 'react';
import {
  Images, Zap, Trash2, DownloadCloud, Loader2, Menu, X,
  FileImage, FileType, Minimize2, Maximize2, Film, Box, ArrowRightLeft
} from 'lucide-react';
import JSZip from 'jszip';
import { Sidebar } from './components/Sidebar';
import { Uploader } from './components/Uploader';
import { ImageListItem } from './components/ImageListItem';
import { IcoOptions } from './components/IcoOptions';
import { GifFrameList } from './components/GifFrameList';
import { CompressOptions } from './components/CompressOptions';
import { ResizeOptions } from './components/ResizeOptions';
import { ImageFile, ConversionStatus, ToolConfig, GifFrame, ICO_SIZES } from './types';
import {
  convertImage, compressImage, resizeImage, generateIco, extractGifFrames, formatBytes
} from './services/converter';

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Define available tools
const TOOLS: ToolConfig[] = [
  // Format conversion tools
  {
    id: 'webp-to-png',
    name: 'WebP → PNG',
    description: '将 WebP 图片转换为 PNG 格式',
    icon: Images,
    accept: 'image/webp',
    targetFormat: 'image/png',
    targetExt: 'png',
    toolType: 'convert',
    category: 'format'
  },
  {
    id: 'png-to-webp',
    name: 'PNG → WebP',
    description: '将 PNG 图片转换为 WebP 格式，减小体积',
    icon: FileType,
    accept: 'image/png',
    targetFormat: 'image/webp',
    targetExt: 'webp',
    toolType: 'convert',
    category: 'format'
  },
  {
    id: 'png-to-jpg',
    name: 'PNG → JPG',
    description: '将 PNG 转换为 JPG（不保留透明度）',
    icon: FileImage,
    accept: 'image/png',
    targetFormat: 'image/jpeg',
    targetExt: 'jpg',
    toolType: 'convert',
    category: 'format'
  },
  {
    id: 'jpg-to-png',
    name: 'JPG → PNG',
    description: '将 JPG 转换为 PNG 格式',
    icon: FileImage,
    accept: 'image/jpeg',
    targetFormat: 'image/png',
    targetExt: 'png',
    toolType: 'convert',
    category: 'format'
  },
  {
    id: 'batch-convert',
    name: '批量转换',
    description: '任意图片格式互转',
    icon: ArrowRightLeft,
    accept: 'image/*',
    targetFormat: 'image/png',
    targetExt: 'png',
    toolType: 'convert',
    category: 'format'
  },
  // Optimization tools
  {
    id: 'compress',
    name: '图片压缩',
    description: '压缩图片体积，可调节质量',
    icon: Minimize2,
    accept: 'image/jpeg,image/png,image/webp',
    toolType: 'compress',
    category: 'optimize'
  },
  {
    id: 'resize',
    name: '尺寸调整',
    description: '调整图片宽高尺寸',
    icon: Maximize2,
    accept: 'image/*',
    toolType: 'resize',
    category: 'optimize'
  },
  // Special tools
  {
    id: 'ico-generator',
    name: 'ICO 生成器',
    description: '生成多尺寸 ICO 图标文件',
    icon: Box,
    accept: 'image/png,image/jpeg,image/webp',
    targetExt: 'ico',
    toolType: 'ico',
    category: 'special'
  },
  {
    id: 'gif-extract',
    name: 'GIF 帧提取',
    description: '提取 GIF 动画的所有帧',
    icon: Film,
    accept: 'image/gif',
    targetExt: 'png',
    toolType: 'gif-extract',
    category: 'special'
  },
];

// Batch convert target formats
const BATCH_FORMATS = [
  { label: 'PNG', format: 'image/png', ext: 'png' },
  { label: 'JPG', format: 'image/jpeg', ext: 'jpg' },
  { label: 'WebP', format: 'image/webp', ext: 'webp' },
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

  // Clear files when tool changes
  useEffect(() => {
    setFiles([]);
    setGifFrames([]);
    setGifFileName('');
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
        case 'ico':
          if (icoSizes.length === 0) {
            throw new Error('请至少选择一个尺寸');
          }
          convertedBlob = await generateIco(fileItem.file, icoSizes);
          break;
        case 'convert':
        default:
          const targetFormat = activeTool.id === 'batch-convert'
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
    for (const file of filesToConvert) {
      await convertSingleFile(file.id);
    }
    setIsProcessingAll(false);
  };

  const handleDownloadAll = async () => {
    const completedFiles = files.filter((f) => f.status === ConversionStatus.COMPLETED && f.convertedBlob);
    if (completedFiles.length === 0) return;

    setIsZipping(true);
    const zip = new JSZip();

    const ext = activeTool.toolType === 'compress' || activeTool.toolType === 'resize'
      ? (activeTool.id === 'batch-convert' ? batchTargetFormat.ext : 'png')
      : (activeTool.id === 'batch-convert' ? batchTargetFormat.ext : activeTool.targetExt);

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

  const getTargetExt = () => {
    if (activeTool.id === 'batch-convert') return batchTargetFormat.ext;
    if (activeTool.toolType === 'compress' || activeTool.toolType === 'resize') {
      return files[0]?.file.type.includes('png') ? 'png' : 'jpg';
    }
    return activeTool.targetExt || 'png';
  };

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
                {idleCount > 0 && (
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
                    转换全部 ({idleCount})
                  </button>
                )}

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

          {activeTool.id === 'batch-convert' && (
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
                  {files.map((file) => (
                    <ImageListItem
                      key={file.id}
                      item={file}
                      targetExt={getTargetExt()}
                      onRemove={handleRemoveFile}
                    />
                  ))}
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
