import React, { useState } from 'react';
import { Type, Move } from 'lucide-react';

interface TextWatermarkOptionsProps {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    opacity: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile';
    rotation: number;
    onTextChange: (text: string) => void;
    onFontSizeChange: (size: number) => void;
    onFontFamilyChange: (family: string) => void;
    onColorChange: (color: string) => void;
    onOpacityChange: (opacity: number) => void;
    onPositionChange: (position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'tile') => void;
    onRotationChange: (rotation: number) => void;
    imgSrc?: string;
}

const FONT_FAMILIES = [
    { label: '默认', value: 'sans-serif' },
    { label: '衬线体', value: 'serif' },
    { label: '等宽体', value: 'monospace' },
    { label: 'Arial', value: 'Arial' },
    { label: 'Helvetica', value: 'Helvetica' },
    { label: 'Times', value: 'Times New Roman' },
];

const POSITIONS = [
    { label: '居中', value: 'center' as const },
    { label: '左上', value: 'top-left' as const },
    { label: '右上', value: 'top-right' as const },
    { label: '左下', value: 'bottom-left' as const },
    { label: '右下', value: 'bottom-right' as const },
    { label: '平铺', value: 'tile' as const },
];

export const TextWatermarkOptions: React.FC<TextWatermarkOptionsProps> = ({
    text,
    fontSize,
    fontFamily,
    color,
    opacity,
    position,
    rotation,
    onTextChange,
    onFontSizeChange,
    onFontFamilyChange,
    onColorChange,
    onOpacityChange,
    onPositionChange,
    onRotationChange,
    imgSrc,
}) => {
    // Preview watermark style
    const previewStyle: React.CSSProperties = {
        position: 'absolute',
        fontSize: `${Math.max(12, fontSize / 10)}px`,
        fontFamily,
        color,
        opacity,
        transform: `rotate(${rotation}deg)`,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
    };

    const getPositionStyle = (): React.CSSProperties => {
        switch (position) {
            case 'top-left': return { top: '10px', left: '10px' };
            case 'top-right': return { top: '10px', right: '10px' };
            case 'bottom-left': return { bottom: '10px', left: '10px' };
            case 'bottom-right': return { bottom: '10px', right: '10px' };
            case 'center':
            default: return { top: '50%', left: '50%', transform: `translate(-50%, -50%) rotate(${rotation}deg)` };
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Preview */}
            <div className="bg-slate-900/5 rounded-2xl flex items-center justify-center p-4 min-h-[300px] overflow-hidden border border-slate-200 relative">
                {imgSrc ? (
                    <>
                        <img
                            src={imgSrc}
                            alt="Preview"
                            className="max-w-full max-h-[400px] object-contain shadow-lg rounded-lg"
                        />
                        {position !== 'tile' && text && (
                            <div style={{ ...previewStyle, ...getPositionStyle() }}>
                                {text}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-slate-400 text-sm">请先上传图片</div>
                )}
            </div>

            {/* Right: Controls */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5 overflow-y-auto max-h-[500px]">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                    <Type className="w-5 h-5 text-indigo-600" />
                    文字水印设置
                </h3>

                {/* Text input */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-600 font-medium">水印文字</label>
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => onTextChange(e.target.value)}
                        placeholder="请输入水印内容"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Font size */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-sm text-slate-600 font-medium">字体大小</label>
                        <span className="text-sm text-slate-500">{fontSize}px</span>
                    </div>
                    <input
                        type="range"
                        min="12"
                        max="200"
                        value={fontSize}
                        onChange={(e) => onFontSizeChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>

                {/* Font family */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-600 font-medium">字体</label>
                    <select
                        value={fontFamily}
                        onChange={(e) => onFontFamilyChange(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        {FONT_FAMILIES.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-600 font-medium">颜色</label>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="w-12 h-10 border border-slate-200 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => onColorChange(e.target.value)}
                            className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        />
                    </div>
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

                {/* Rotation */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <label className="text-sm text-slate-600 font-medium">旋转角度</label>
                        <span className="text-sm text-slate-500">{rotation}°</span>
                    </div>
                    <input
                        type="range"
                        min="-45"
                        max="45"
                        value={rotation}
                        onChange={(e) => onRotationChange(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                </div>
            </div>
        </div>
    );
};
