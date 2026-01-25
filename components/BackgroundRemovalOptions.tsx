import React, { useState, useCallback, useEffect } from 'react';
import { Scissors, Loader2, Download, Check, Palette, RefreshCw, Trash2, X, Brush } from 'lucide-react';
import { RefineBackgroundRemoval } from './RefineBackgroundRemoval';

interface BgRemovalResult {
    id: string;
    originalUrl: string;
    resultUrl: string | null;
    resultBlob: Blob | null;
    status: 'idle' | 'processing' | 'completed' | 'error';
    progress: number;
    error?: string;
}

interface BackgroundRemovalOptionsProps {
    files: { id: string; name: string; previewUrl: string; file: File }[];
    onProcessComplete: (id: string, resultBlob: Blob) => void;
    onRemoveFile: (id: string) => void;
    onClearAll: () => void;
}

const PREVIEW_BACKGROUNDS = [
    { label: '透明', value: 'transparent', style: 'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ccc\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ccc\'/%3E%3C/svg%3E")]' },
    { label: '白色', value: '#FFFFFF', style: 'bg-white' },
    { label: '黑色', value: '#000000', style: 'bg-black' },
    { label: '红色', value: '#EF4444', style: 'bg-red-500' },
    { label: '蓝色', value: '#3B82F6', style: 'bg-blue-500' },
    { label: '绿色', value: '#22C55E', style: 'bg-green-500' },
];

export const BackgroundRemovalOptions: React.FC<BackgroundRemovalOptionsProps> = ({
    files,
    onProcessComplete,
    onRemoveFile,
    onClearAll,
}) => {
    const [results, setResults] = useState<BgRemovalResult[]>([]);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [modelProgress, setModelProgress] = useState(0);
    const [selectedBg, setSelectedBg] = useState('transparent');
    const [customBgColor, setCustomBgColor] = useState('#FFFFFF');
    const [isProcessingAll, setIsProcessingAll] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [refiningFileId, setRefiningFileId] = useState<string | null>(null);

    // Initialize results from files
    useEffect(() => {
        setResults(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const newResults = files.map(f => {
                const existing = prev.find(r => r.id === f.id);
                if (existing) return existing;
                return {
                    id: f.id,
                    originalUrl: f.previewUrl,
                    resultUrl: null,
                    resultBlob: null,
                    status: 'idle' as const,
                    progress: 0,
                };
            });
            return newResults;
        });
    }, [files]);

    const processImage = useCallback(async (fileId: string, file: File) => {
        setResults(prev => prev.map(r =>
            r.id === fileId ? { ...r, status: 'processing' as const, progress: 0 } : r
        ));

        try {
            const { removeBackground } = await import('@imgly/background-removal');

            const blob = await removeBackground(file, {
                progress: (key: string, current: number, total: number) => {
                    if (key === 'compute:inference') {
                        const progress = Math.round((current / total) * 100);
                        setResults(prev => prev.map(r =>
                            r.id === fileId ? { ...r, progress } : r
                        ));
                    }
                    if (key === 'fetch:model') {
                        setIsModelLoading(true);
                        setModelProgress(Math.round((current / total) * 100));
                    }
                },
            });

            setIsModelLoading(false);
            const resultUrl = URL.createObjectURL(blob);

            setResults(prev => prev.map(r =>
                r.id === fileId ? {
                    ...r,
                    status: 'completed' as const,
                    resultUrl,
                    resultBlob: blob,
                    progress: 100
                } : r
            ));

            onProcessComplete(fileId, blob);
        } catch (error: any) {
            console.error('Background removal error:', error);
            setIsModelLoading(false);
            setResults(prev => prev.map(r =>
                r.id === fileId ? {
                    ...r,
                    status: 'error' as const,
                    error: error.message || '处理失败'
                } : r
            ));
        }
    }, [onProcessComplete]);

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

    const downloadResult = useCallback((result: BgRemovalResult, fileName: string) => {
        if (!result.resultUrl) return;
        const link = document.createElement('a');
        link.href = result.resultUrl;
        link.download = `${fileName.replace(/\.[^.]+$/, '')}_抠图.png`;
        link.click();
    }, []);

    const downloadAll = useCallback(() => {
        const completedResults = results.filter(r => r.status === 'completed' && r.resultUrl);
        completedResults.forEach((result, index) => {
            const file = files.find(f => f.id === result.id);
            if (file) {
                setTimeout(() => downloadResult(result, file.name), index * 200);
            }
        });
    }, [results, files, downloadResult]);

    const getPreviewBgStyle = (): React.CSSProperties => {
        if (selectedBg === 'transparent') return {};
        if (selectedBg === 'custom') return { backgroundColor: customBgColor };
        return { backgroundColor: selectedBg };
    };

    const currentFile = files[currentIndex];
    const currentResult = results.find(r => r.id === currentFile?.id);
    const completedCount = results.filter(r => r.status === 'completed').length;
    const idleCount = results.filter(r => r.status === 'idle').length;

    return (
        <div className="space-y-6">
            {/* Model loading indicator */}
            {isModelLoading && (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-indigo-700">正在加载 AI 模型...</div>
                            <div className="text-xs text-indigo-500">首次使用需下载约 40MB，之后会缓存</div>
                        </div>
                        <div className="text-sm font-mono text-indigo-600">{modelProgress}%</div>
                    </div>
                    <div className="mt-2 h-2 bg-indigo-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${modelProgress}%` }} />
                    </div>
                </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3">
                <button
                    onClick={onClearAll}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                >
                    <Trash2 className="w-4 h-4" /> 清除全部
                </button>
                <button
                    onClick={processAll}
                    disabled={isProcessingAll || idleCount === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {isProcessingAll ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> 处理中...</>
                    ) : (
                        <><Scissors className="w-5 h-5" /> 开始抠图 ({idleCount})</>
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

                {/* Background color selector */}
                <div className="flex items-center gap-2 ml-auto">
                    <span className="text-sm text-slate-500">预览背景:</span>
                    {PREVIEW_BACKGROUNDS.slice(0, 4).map(bg => (
                        <button
                            key={bg.value}
                            onClick={() => setSelectedBg(bg.value)}
                            className={`w-7 h-7 rounded-lg border-2 transition-all ${bg.style} ${selectedBg === bg.value ? 'border-indigo-600 scale-110' : 'border-slate-200'}`}
                            title={bg.label}
                        />
                    ))}
                    <input
                        type="color"
                        value={customBgColor}
                        onChange={(e) => { setCustomBgColor(e.target.value); setSelectedBg('custom'); }}
                        className="w-7 h-7 rounded-lg border-2 border-slate-200 cursor-pointer"
                        title="自定义颜色"
                    />
                </div>
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
                                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${index === currentIndex ? 'border-indigo-600 scale-105' : 'border-slate-200'}`}
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
                                <button
                                    onClick={(e) => { e.stopPropagation(); onRemoveFile(file.id); }}
                                    className="absolute top-0.5 left-0.5 bg-red-500 rounded-full p-0.5 opacity-0 hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-2.5 h-2.5 text-white" />
                                </button>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Main comparison view */}
            {currentFile && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-700 truncate">{currentFile.name}</span>
                        <div className="flex gap-2">
                            {files.length === 1 && (
                                <button
                                    onClick={() => onRemoveFile(currentFile.id)}
                                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    title="删除图片"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            {currentResult?.status === 'completed' && (
                                <>
                                    <button
                                        onClick={() => setRefiningFileId(currentFile.id)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
                                    >
                                        <Brush className="w-4 h-4" /> 精修
                                    </button>
                                    <button
                                        onClick={() => downloadResult(currentResult, currentFile.name)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                    >
                                        <Download className="w-4 h-4" /> 下载
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Left-right comparison */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Original */}
                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 text-center">原图</div>
                            <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center">
                                <img src={currentFile.previewUrl} alt="Original" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>

                        {/* Result */}
                        <div className="space-y-2">
                            <div className="text-xs text-slate-500 text-center">
                                {currentResult?.status === 'completed' ? '抠图结果' : '处理后预览'}
                            </div>
                            <div
                                className={`aspect-square rounded-xl overflow-hidden flex items-center justify-center ${selectedBg === 'transparent' ? PREVIEW_BACKGROUNDS[0].style : ''}`}
                                style={getPreviewBgStyle()}
                            >
                                {currentResult?.status === 'completed' && currentResult.resultUrl ? (
                                    <img src={currentResult.resultUrl} alt="Result" className="max-w-full max-h-full object-contain" />
                                ) : currentResult?.status === 'processing' ? (
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                        <span className="text-sm">{currentResult.progress}%</span>
                                    </div>
                                ) : currentResult?.status === 'error' ? (
                                    <div className="flex flex-col items-center gap-2 text-red-500 p-4">
                                        <span className="text-sm">{currentResult.error}</span>
                                        <button
                                            onClick={() => processImage(currentFile.id, currentFile.file)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200"
                                        >
                                            <RefreshCw className="w-4 h-4" /> 重试
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-slate-400">
                                        <Scissors className="w-8 h-8" />
                                        <span className="text-sm">点击"开始抠图"</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Refine modal */}
            {refiningFileId && (() => {
                const file = files.find(f => f.id === refiningFileId);
                const result = results.find(r => r.id === refiningFileId);
                if (!file || !result?.resultUrl) return null;

                return (
                    <RefineBackgroundRemoval
                        originalImage={file.previewUrl}
                        maskImage={result.resultUrl}
                        onComplete={(blob) => {
                            const url = URL.createObjectURL(blob);
                            setResults(prev => prev.map(r =>
                                r.id === refiningFileId ? { ...r, resultUrl: url, resultBlob: blob } : r
                            ));
                            onProcessComplete(refiningFileId, blob);
                            setRefiningFileId(null);
                        }}
                        onCancel={() => setRefiningFileId(null)}
                    />
                );
            })()}
        </div>
    );
};
