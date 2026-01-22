import React from 'react';

interface CompressOptionsProps {
    quality: number;
    onQualityChange: (quality: number) => void;
}

export const CompressOptions: React.FC<CompressOptionsProps> = ({ quality, onQualityChange }) => {
    const qualityPercent = Math.round(quality * 100);

    const getQualityLabel = (q: number) => {
        if (q >= 0.9) return { text: '最高质量', color: 'text-green-600' };
        if (q >= 0.7) return { text: '高质量', color: 'text-blue-600' };
        if (q >= 0.5) return { text: '中等质量', color: 'text-amber-600' };
        return { text: '高压缩', color: 'text-red-600' };
    };

    const label = getQualityLabel(quality);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">压缩质量</h3>
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${label.color}`}>{qualityPercent}%</span>
                    <span className={`text-xs px-2 py-1 rounded-full bg-slate-100 ${label.color}`}>
                        {label.text}
                    </span>
                </div>
            </div>

            <div className="relative">
                <input
                    type="range"
                    min="10"
                    max="100"
                    value={qualityPercent}
                    onChange={(e) => onQualityChange(parseInt(e.target.value) / 100)}
                    className="w-full h-3 bg-gradient-to-r from-red-200 via-amber-200 via-blue-200 to-green-200 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-indigo-500
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
          "
                />
                <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>体积更小</span>
                    <span>质量更好</span>
                </div>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                <p>💡 推荐使用 70-80% 质量，可在保持视觉效果的同时显著减小文件体积</p>
            </div>
        </div>
    );
};
