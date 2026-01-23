import React from 'react';
import { ImageIcon, Move, Upload } from 'lucide-react';

interface ImageWatermarkOptionsProps {
    watermarkFile: File | null;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
    opacity: number;
    scale: number;
    onWatermarkFileChange: (file: File | null) => void;
    onPositionChange: (position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile') => void;
    onOpacityChange: (opacity: number) => void;
    onScaleChange: (scale: number) => void;
    imgSrc?: string;
}

const POSITIONS = [
    { label: '居中', value: 'center' as const },
    { label: '左上', value: 'top-left' as const },
    { label: '右上', value: 'top-right' as const },
    { label: '左下', value: 'bottom-left' as const },
    { label: '右下', value: 'bottom-right' as const },
    { label: '平铺', value: 'tile' as const },
];

export const ImageWatermarkOptions: React.FC<ImageWatermarkOptionsProps> = ({
    watermarkFile,
    position,
    opacity,
    scale,
    onWatermarkFileChange,
    onPositionChange,
    onOpacityChange,
    onScaleChange,
    imgSrc,
}) => {
    const watermarkPreviewUrl = watermarkFile ? URL.createObjectURL(watermarkFile) : null;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onWatermarkFileChange(e.target.files[0]);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="bg-slate-900/5 rounded-2xl flex items-center justify-center p-4 min-h-[300px] overflow-hidden border border-slate-200 relative">
                {imgSrc ? (
                    <div className="relative">
                        <img
                            src={imgSrc}
                            alt="Preview"
                            className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg"
                        />
                        {watermarkPreviewUrl && position !== 'tile' && (
                            <img
                                src={watermarkPreviewUrl}
                                alt="Watermark"
                                style={{
                                    position: 'absolute',
                                    opacity,
                                    width: `${scale * 30}%`,
                                    ...(position === 'center' ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } :
                                        position === 'top-left' ? { top: '10px', left: '10px' } :
                                            position === 'top-right' ? { top: '10px', right: '10px' } :
                                                position === 'bottom-left' ? { bottom: '10px', left: '10px' } :
                                                    { bottom: '10px', right: '10px' })
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div className="text-slate-400 text-sm">请先上传图片</div>
                )}
            </div>

            {/* Right: Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    图片水印设置
                </h3>

                {/* Watermark file upload */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-600 font-medium">水印图片 (Logo)</label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <div className={`
              flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg
              ${watermarkFile ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}
              transition-colors cursor-pointer
            `}>
                            {watermarkFile ? (
                                <>
                                    {watermarkPreviewUrl && (
                                        <img src={watermarkPreviewUrl} alt="Logo" className="w-8 h-8 object-contain" />
                                    )}
                                    <span className="text-sm text-indigo-600">{watermarkFile.name}</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5 text-slate-400" />
                                    <span className="text-sm text-slate-500">点击上传水印图片</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scale */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-sm text-slate-600 font-medium">水印大小</label>
                        <span className="text-sm text-slate-500">{Math.round(scale * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={scale}
                        onChange={(e) => onScaleChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-sm text-slate-600 font-medium">透明度</label>
                        <span className="text-sm text-slate-500">{Math.round(opacity * 100)}%</span>
                    </div>
                    <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => onOpacityChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Position */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-600 font-medium flex items-center gap-2">
                        <Move className="w-4 h-4" />
                        位置
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {POSITIONS.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => onPositionChange(p.value)}
                                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${position === p.value
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }
                `}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
