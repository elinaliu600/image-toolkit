import React, { useState, useCallback, useEffect } from 'react';
import { Maximize, Loader2, Download, Check, RefreshCw, Trash2, ZoomIn } from 'lucide-react';

interface UpscaleResult {
    id: string;
    originalUrl: string;
    resultUrl: string | null;
    resultBlob: Blob | null;
    status: 'idle' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
    originalSize: { width: number; height: number };
    resultSize?: { width: number; height: number };
}

interface UpscaleOptionsProps {
    files: { id: string; name: string; previewUrl: string; file: File }[];
    onProcessComplete: (id: string, resultBlob: Blob) => void;
    onRemoveFile: (id: string) => void;
    onClearAll: () => void;
}

const SCALE_OPTIONS = [
    { label: '2x', value: 2 },
];

export const UpscaleOptions: React.FC<UpscaleOptionsProps> = ({
    files,
    onProcessComplete,
    onRemoveFile,
    onClearAll,
}) => {
    const [results, setResults] = useState<UpscaleResult[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [modelProgress, setModelProgress] = useState(0);
    const [scale, setScale] = useState(2);
    const [isProcessingAll, setIsProcessingAll] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Initialize results from files
    useEffect(() => {
        const initResults = async () => {
            const newResults: UpscaleResult[] = [];
            for (const f of files) {
                const existing = results.find(r => r.id === f.id);
                if (existing) {
                    newResults.push(existing);
                } else {
                    // Get original dimensions
                    const img = new Image();
                    img.src = f.previewUrl;
                    await new Promise(resolve => img.onload = resolve);
                    newResults.push({
                        id: f.id,
                        originalUrl: f.previewUrl,
                        resultUrl: null,
                        resultBlob: null,
                        status: 'idle',
                        progress: 0,
                        originalSize: { width: img.naturalWidth, height: img.naturalHeight },
                    });
                }
            }
            setResults(newResults);
        };
        initResults();
    }, [files]);

    const processImage = useCallback(async (fileId: string, file: File) => {
        setResults(prev => prev.map(r =>
            r.id === fileId ? { ...r, status: 'processing' as const, progress: 0 } : r
        ));

        try {
            setIsModelLoading(true);
            setModelProgress(10);

            // Dynamic import to avoid loading the large library until needed
            const Upscaler = (await import('upscaler')).default;

            setModelProgress(30);

            // Load model (only 2x now)
            const model = await import('@upscalerjs/esrgan-medium/2x');

            setModelProgress(60);

            const upscaler = new Upscaler({
                model: model.default,
            });

            setIsModelLoading(false);
            setModelProgress(100);

            // Create image element from file
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await new Promise(resolve => img.onload = resolve);

            // Upscale with progress
            const result = await upscaler.upscale(img, {
                patchSize: 64,
                padding: 2,
                progress: (progress: number) => {
                    setResults(prev => prev.map(r =>
                        r.id === fileId ? { ...r, progress: Math.round(progress * 100) } : r
                    ));
                },
            });

            URL.revokeObjectURL(img.src);

            // Convert result to blob
            let blob: Blob;
            if (result instanceof HTMLCanvasElement) {
                blob = await new Promise<Blob>((resolve, reject) => {
                    result.toBlob(b => b ? resolve(b) : reject(new Error('Failed to convert')), 'image/png');
                });
            } else if (typeof result === 'string') {
                // Base64 string
                const res = await fetch(result);
                blob = await res.blob();
            } else {
                throw new Error('Unexpected result type');
            }

            const resultUrl = URL.createObjectURL(blob);

            // Get result dimensions
            const resultImg = new Image();
            resultImg.src = resultUrl;
            await new Promise(resolve => resultImg.onload = resolve);

            setResults(prev => prev.map(r =>
                r.id === fileId ? {
                    ...r,
                    status: 'completed' as const,
                    resultUrl,
                    resultBlob: blob,
                    progress: 100,
                    resultSize: { width: resultImg.naturalWidth, height: resultImg.naturalHeight }
                } : r
            ));

            onProcessComplete(fileId, blob);
        } catch (error: any) {
            console.error('Upscale error:', error);
            setIsModelLoading(false);
            setResults(prev => prev.map(r =>
                r.id === fileId ? {
                    ...r,
                    status: 'error' as const,
                    error: error.message || '处理失败'
                } : r
            ));
        }
    }, [scale, onProcessComplete]);

    const processAll = useCallback(async () => {
        setIsProcessingAll(true);
        const idleResults = results.filter(r => r.status === 'idle');

        for (const result of idleResults) {
            const file = files.find(f => f.id === result.id);
            if (file) {
                await processImage(result.id, file.file);
            }
        }

        setIsProcessingAll(false);
    }, [results, files, processImage]);

    const downloadResult = useCallback((result: UpscaleResult, fileName: string) => {
        if (!result.resultUrl) return;
        const link = document.createElement('a');
        link.href = result.resultUrl;
        link.download = `${fileName.replace(/\.[^.]+$/, '')}_${scale}x.png`;
        link.click();
    }, [scale]);

    const downloadAll = useCallback(() => {
        const completedResults = results.filter(r => r.status === 'completed' && r.resultUrl);
        completedResults.forEach((result, index) => {
            const file = files.find(f => f.id === result.id);
            if (file) {
                setTimeout(() => downloadResult(result, file.name), index * 200);
            }
        });
    }, [results, files, downloadResult]);

    const currentFile = files[currentIndex];
    const currentResult = results.find(r => r.id === currentFile?.id);
    const completedCount = results.filter(r => r.status === 'completed').length;
    const idleCount = results.filter(r => r.status === 'idle').length;

    return (
        <div className="space-y-6">
            {/* Model loading indicator */}
            {isModelLoading && (
                <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-purple-700">正在加载 AI 模型...</div>
                            <div className="text-xs text-purple-500">首次使用需下载约 50MB，之后会缓存</div>
                        </div>
                        <div className="text-sm font-mono text-purple-600">{modelProgress}%</div>
                    </div>
                    <div className="mt-2 h-2 bg-purple-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-600 transition-all duration-300" style={{ width: `${modelProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4">
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> 清除全部
                </button>

                <button
                    onClick={processAll}
                    disabled={isProcessingAll || idleCount === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isProcessingAll ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> 处理中...</>
                    ) : (
                        <><ZoomIn className="w-5 h-5" /> 开始放大 ({idleCount})</>
                    )}
                </button>

                {completedCount > 0 && (
                    <button
                        onClick={downloadAll}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                    >
                        <Download className="w-5 h-5" /> 下载全部 ({completedCount})
                    </button>
                )}
            </div>

            {/* Tip */}
            <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                💡 提示：AI 放大可以让模糊图片变清晰。图片越小效果越明显，处理时间约 10-30 秒。
            </div>

            {/* Image thumbnails strip */}
            {files.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {files.map((file, index) => {
                        const result = results.find(r => r.id === file.id);
                        return (
                            <button
                                key={file.id}
                                onClick={() => setCurrentIndex(index)}
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex ? 'border-purple-600 scale-105' : 'border-slate-200'}`}
                            >
                                <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
                                {result?.status === 'completed' && (
                                    <div className="absolute top-0.5 right-0.5 bg-green-500 rounded-full p-0.5">
                                        <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                )}
                                {result?.status === 'processing' && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main comparison view */}
            {currentFile && currentResult && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <span className="text-sm font-medium text-slate-700">{currentFile.name}</span>
                            <span className="ml-2 text-xs text-slate-400">
                                {currentResult.originalSize.width} × {currentResult.originalSize.height}
                                {currentResult.resultSize && (
                                    <> → {currentResult.resultSize.width} × {currentResult.resultSize.height}</>
                                )}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onRemoveFile(currentFile.id)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                title="删除"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            {currentResult.status === 'completed' && (
                                <button
                                    onClick={() => downloadResult(currentResult, currentFile.name)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                                >
                                    <Download className="w-4 h-4" /> 下载
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Left-right comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 text-center">原图</div>
                            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                                <img src={currentFile.previewUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 text-center">
                                {currentResult.status === 'completed' ? `${scale}x 放大结果` : '处理后预览'}
                            </div>
                            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                                {currentResult.status === 'completed' && currentResult.resultUrl ? (
                                    <img src={currentResult.resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                                ) : currentResult.status === 'processing' ? (
                                    <div className="flex flex-col items-center gap-2 text-purple-500">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span className="text-sm">{currentResult.progress}%</span>
                                    </div>
                                ) : currentResult.status === 'error' ? (
                                    <div className="flex flex-col items-center gap-2 text-red-500 p-4">
                                        <span className="text-sm text-center">{currentResult.error}</span>
                                        <button
                                            onClick={() => processImage(currentFile.id, currentFile.file)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200"
                                        >
                                            <RefreshCw className="w-4 h-4" /> 重试
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <ZoomIn className="w-8 h-8" />
                                        <span className="text-sm">点击"开始放大"</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
