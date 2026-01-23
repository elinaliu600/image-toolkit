import React from 'react';
import { Sun, Contrast } from 'lucide-react';

interface BrightnessOptionsProps {
    brightness: number;
    contrast: number;
    onBrightnessChange: (value: number) => void;
    onContrastChange: (value: number) => void;
    imgSrc?: string; // Preview image source
}

export const BrightnessOptions: React.FC<BrightnessOptionsProps> = ({
    brightness,
    contrast,
    onBrightnessChange,
    onContrastChange,
    imgSrc,
}) => {
    // CSS filter for real-time preview
    const filterStyle = {
        filter: `brightness(${100 + brightness}%) contrast(${100 + contrast}%)`
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image Preview */}
            <div className="bg-slate-900/5 rounded-2xl flex items-center justify-center p-4 min-h-[300px] overflow-hidden border border-slate-200">
                {imgSrc ? (
                    <img
                        src={imgSrc}
                        alt="Preview"
                        className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg transition-all duration-150"
                        style={filterStyle}
                    />
                ) : (
                    <div className="text-slate-400 text-sm">请先上传图片</div>
                )}
            </div>

            {/* Right: Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-indigo-600" />
                    亮度与对比度
                </h3>

                {/* Brightness slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-600 font-medium flex items-center gap-2">
                            <Sun className="w-4 h-4" />
                            亮度
                        </label>
                        <span className="text-sm text-slate-500 font-mono">{brightness > 0 ? '+' : ''}{brightness}</span>
                    </div>
                    <input
                        type="range"
                        min="-100"
                        max="100"
                        value={brightness}
                        onChange={(e) => onBrightnessChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>暗</span>
                        <span>原始</span>
                        <span>亮</span>
                    </div>
                </div>

                {/* Contrast slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-600 font-medium flex items-center gap-2">
                            <Contrast className="w-4 h-4" />
                            对比度
                        </label>
                        <span className="text-sm text-slate-500 font-mono">{contrast > 0 ? '+' : ''}{contrast}</span>
                    </div>
                    <input
                        type="range"
                        min="-100"
                        max="100"
                        value={contrast}
                        onChange={(e) => onContrastChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-xs text-slate-400">
                        <span>低</span>
                        <span>原始</span>
                        <span>高</span>
                    </div>
                </div>

                {/* Reset button */}
                <button
                    onClick={() => {
                        onBrightnessChange(0);
                        onContrastChange(0);
                    }}
                    className="w-full py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                    重置为默认值
                </button>
            </div>
        </div>
    );
};
