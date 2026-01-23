import React, { useState, useRef, useCallback } from 'react';
import { Pipette, Copy, Check, Palette } from 'lucide-react';

interface ColorPickerOptionsProps {
    imgSrc: string;
}

interface ColorInfo {
    hex: string;
    rgb: string;
    hsl: string;
    r: number;
    g: number;
    b: number;
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

export const ColorPickerOptions: React.FC<ColorPickerOptionsProps> = ({ imgSrc }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [pickedColors, setPickedColors] = useState<ColorInfo[]>([]);
    const [hoverColor, setHoverColor] = useState<ColorInfo | null>(null);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
    const [imgDimensions, setImgDimensions] = useState({ width: 0, height: 0 });

    const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        setImgDimensions({ width: img.naturalWidth, height: img.naturalHeight });

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(img, 0, 0);
            setIsLoaded(true);
        }
    }, []);

    const getColorAtPosition = useCallback((clientX: number, clientY: number, element: HTMLElement): ColorInfo | null => {
        const canvas = canvasRef.current;
        if (!canvas || !isLoaded) return null;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        const rect = element.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = Math.floor((clientX - rect.left) * scaleX);
        const y = Math.floor((clientY - rect.top) * scaleY);

        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;

        const pixel = ctx.getImageData(x, y, 1, 1).data;
        const r = pixel[0];
        const g = pixel[1];
        const b = pixel[2];
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        const rgb = `rgb(${r}, ${g}, ${b})`;
        const [h, s, l] = rgbToHsl(r, g, b);
        const hsl = `hsl(${h}, ${s}%, ${l}%)`;

        return { hex, rgb, hsl, r, g, b };
    }, [isLoaded]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        const color = getColorAtPosition(e.clientX, e.clientY, e.currentTarget);
        setHoverColor(color);
        const rect = e.currentTarget.getBoundingClientRect();
        setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }, [getColorAtPosition]);

    const handleClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
        const color = getColorAtPosition(e.clientX, e.clientY, e.currentTarget);
        if (color && !pickedColors.some(c => c.hex === color.hex)) {
            setPickedColors(prev => [...prev, color]);
        }
    }, [getColorAtPosition, pickedColors]);

    const handleMouseLeave = useCallback(() => {
        setHoverColor(null);
        setCursorPos(null);
    }, []);

    const copyToClipboard = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1500);
    };

    const removeColor = (index: number) => {
        setPickedColors(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image canvas for picking */}
            <div className="lg:col-span-2 bg-slate-900/5 rounded-2xl p-4 border border-slate-200 relative overflow-hidden">
                <div className="relative inline-block">
                    <img
                        src={imgSrc}
                        alt="Color picker source"
                        className="max-w-full max-h-[500px] object-contain cursor-crosshair rounded-lg shadow-lg"
                        onLoad={handleImageLoad}
                        onMouseMove={handleMouseMove}
                        onClick={handleClick}
                        onMouseLeave={handleMouseLeave}
                        draggable={false}
                    />

                    {/* Hidden canvas for pixel reading */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Hover preview */}
                    {hoverColor && cursorPos && (
                        <div
                            className="absolute pointer-events-none z-10"
                            style={{
                                left: cursorPos.x + 20,
                                top: cursorPos.y - 60,
                            }}
                        >
                            <div className="bg-white rounded-lg shadow-xl p-2 border border-slate-200 flex items-center gap-2">
                                <div
                                    className="w-10 h-10 rounded-lg border border-slate-300"
                                    style={{ backgroundColor: hoverColor.hex }}
                                />
                                <div className="text-xs">
                                    <div className="font-mono font-bold">{hoverColor.hex}</div>
                                    <div className="text-slate-500 font-mono">{hoverColor.rgb}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {isLoaded && (
                    <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                        <Pipette className="w-3 h-3" />
                        点击图片吸取颜色 ({imgDimensions.width}×{imgDimensions.height})
                    </div>
                )}
            </div>

            {/* Right: Picked colors palette */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    已吸取颜色 ({pickedColors.length})
                </h3>

                {pickedColors.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        点击图片吸取颜色
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {pickedColors.map((color, index) => (
                            <div
                                key={`${color.hex}-${index}`}
                                className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group relative"
                            >
                                <div
                                    className="w-12 h-12 rounded-lg border border-slate-200 flex-shrink-0"
                                    style={{ backgroundColor: color.hex }}
                                />
                                <div className="flex-1 min-w-0">
                                    <button
                                        onClick={() => copyToClipboard(color.hex, index)}
                                        className="flex items-center gap-1 text-sm font-mono font-bold text-slate-700 hover:text-indigo-600"
                                    >
                                        {color.hex}
                                        {copiedIndex === index ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                        ) : (
                                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                        )}
                                    </button>
                                    <div className="text-xs text-slate-500 font-mono">{color.rgb}</div>
                                    <div className="text-xs text-slate-400 font-mono">{color.hsl}</div>
                                </div>
                                <button
                                    onClick={() => removeColor(index)}
                                    className="absolute top-1 right-1 w-5 h-5 bg-red-100 text-red-500 rounded-full text-xs opacity-0 group-hover:opacity-100 hover:bg-red-200"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {pickedColors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={() => setPickedColors([])}
                            className="w-full py-2 text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            清空所有颜色
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
