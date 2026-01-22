import React, { useState, useEffect } from 'react';
import { Link, Unlink } from 'lucide-react';

interface ResizeOptionsProps {
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    maintainAspect: boolean;
    onWidthChange: (width: number) => void;
    onHeightChange: (height: number) => void;
    onMaintainAspectChange: (maintain: boolean) => void;
}

export const ResizeOptions: React.FC<ResizeOptionsProps> = ({
    width,
    height,
    originalWidth,
    originalHeight,
    maintainAspect,
    onWidthChange,
    onHeightChange,
    onMaintainAspectChange,
}) => {
    const aspectRatio = originalWidth / originalHeight;

    const handleWidthChange = (newWidth: number) => {
        onWidthChange(newWidth);
        if (maintainAspect && newWidth > 0) {
            onHeightChange(Math.round(newWidth / aspectRatio));
        }
    };

    const handleHeightChange = (newHeight: number) => {
        onHeightChange(newHeight);
        if (maintainAspect && newHeight > 0) {
            onWidthChange(Math.round(newHeight * aspectRatio));
        }
    };

    const presets = [
        { label: '50%', w: Math.round(originalWidth * 0.5), h: Math.round(originalHeight * 0.5) },
        { label: '75%', w: Math.round(originalWidth * 0.75), h: Math.round(originalHeight * 0.75) },
        { label: '原始', w: originalWidth, h: originalHeight },
        { label: '150%', w: Math.round(originalWidth * 1.5), h: Math.round(originalHeight * 1.5) },
        { label: '200%', w: originalWidth * 2, h: originalHeight * 2 },
    ];

    const percentChange = width > 0 && originalWidth > 0
        ? Math.round((width / originalWidth) * 100)
        : 100;

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">调整尺寸</h3>
                <div className="text-sm text-slate-500">
                    原始: {originalWidth} × {originalHeight}
                </div>
            </div>

            {/* Size inputs */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">宽度 (px)</label>
                    <input
                        type="number"
                        value={width}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                        min="1"
                        max="10000"
                    />
                </div>

                <button
                    onClick={() => onMaintainAspectChange(!maintainAspect)}
                    className={`
            mt-4 p-2 rounded-lg transition-all
            ${maintainAspect
                            ? 'bg-indigo-100 text-indigo-600'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }
          `}
                    title={maintainAspect ? '锁定比例' : '自由调整'}
                >
                    {maintainAspect ? <Link className="w-5 h-5" /> : <Unlink className="w-5 h-5" />}
                </button>

                <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">高度 (px)</label>
                    <input
                        type="number"
                        value={height}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center font-medium"
                        min="1"
                        max="10000"
                    />
                </div>
            </div>

            {/* Preset buttons */}
            <div className="flex flex-wrap gap-2 mb-4">
                {presets.map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => {
                            onWidthChange(preset.w);
                            onHeightChange(preset.h);
                        }}
                        className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-all
              ${width === preset.w && height === preset.h
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
            `}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>

            {/* Change indicator */}
            <div className={`
        text-sm px-4 py-2 rounded-xl
        ${percentChange < 100
                    ? 'bg-green-50 text-green-700'
                    : percentChange > 100
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-slate-50 text-slate-600'
                }
      `}>
                {percentChange < 100 && `📉 缩小到 ${percentChange}%`}
                {percentChange > 100 && `📈 放大到 ${percentChange}%`}
                {percentChange === 100 && '📐 保持原始尺寸'}
            </div>
        </div>
    );
};
