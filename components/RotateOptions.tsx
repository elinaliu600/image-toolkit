import React from 'react';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical } from 'lucide-react';

interface RotateOptionsProps {
    angle: number;
    flipH: boolean;
    flipV: boolean;
    onAngleChange: (angle: number) => void;
    onFlipHChange: (flipH: boolean) => void;
    onFlipVChange: (flipV: boolean) => void;
}

export const RotateOptions: React.FC<RotateOptionsProps> = ({
    angle,
    flipH,
    flipV,
    onAngleChange,
    onFlipHChange,
    onFlipVChange,
}) => {
    const presetAngles = [
        { label: '0°', value: 0 },
        { label: '90°', value: 90 },
        { label: '180°', value: 180 },
        { label: '270°', value: 270 },
    ];

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <RotateCw className="w-5 h-5 text-indigo-600" />
                旋转与翻转
            </h3>

            {/* Rotation presets */}
            <div className="space-y-3">
                <label className="text-sm text-slate-600 font-medium">旋转角度</label>
                <div className="flex gap-2">
                    {presetAngles.map((preset) => (
                        <button
                            key={preset.value}
                            onClick={() => onAngleChange(preset.value)}
                            className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all
                ${angle === preset.value
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }
              `}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                {/* Custom angle input */}
                <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={angle}
                        onChange={(e) => onAngleChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <input
                        type="number"
                        min="0"
                        max="360"
                        value={angle}
                        onChange={(e) => onAngleChange(Number(e.target.value))}
                        className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-center"
                    />
                    <span className="text-sm text-slate-500">°</span>
                </div>
            </div>

            {/* Flip options */}
            <div className="space-y-3">
                <label className="text-sm text-slate-600 font-medium">翻转</label>
                <div className="flex gap-3">
                    <button
                        onClick={() => onFlipHChange(!flipH)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${flipH
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
            `}
                    >
                        <FlipHorizontal className="w-4 h-4" />
                        水平翻转
                    </button>
                    <button
                        onClick={() => onFlipVChange(!flipV)}
                        className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
              ${flipV
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }
            `}
                    >
                        <FlipVertical className="w-4 h-4" />
                        垂直翻转
                    </button>
                </div>
            </div>
        </div>
    );
};
