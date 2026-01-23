import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface GridCollageOptionsProps {
    columns: number;
    gap: number;
    backgroundColor: string;
    onColumnsChange: (columns: number) => void;
    onGapChange: (gap: number) => void;
    onBackgroundColorChange: (color: string) => void;
    fileCount: number;
}

const COLUMN_PRESETS = [2, 3, 4, 5, 6];

export const GridCollageOptions: React.FC<GridCollageOptionsProps> = ({
    columns,
    gap,
    backgroundColor,
    onColumnsChange,
    onGapChange,
    onBackgroundColorChange,
    fileCount,
}) => {
    const rows = Math.ceil(fileCount / columns);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-indigo-600" />
                宫格拼图设置
            </h3>

            {/* Columns */}
            <div className="space-y-3">
                <label className="text-sm text-slate-600 font-medium">列数</label>
                <div className="flex gap-2">
                    {COLUMN_PRESETS.map((col) => (
                        <button
                            key={col}
                            onClick={() => onColumnsChange(col)}
                            className={`
                w-10 h-10 rounded-lg font-medium text-sm transition-all
                ${columns === col
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }
              `}
                        >
                            {col}
                        </button>
                    ))}
                </div>
                <p className="text-xs text-slate-400">
                    {fileCount} 张图片将排列为 {columns} 列 × {rows} 行
                </p>
            </div>

            {/* Gap */}
            <div className="space-y-2">
                <div className="flex justify-between">
                    <label className="text-sm text-slate-600 font-medium">间距</label>
                    <span className="text-sm text-slate-500">{gap}px</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="50"
                    value={gap}
                    onChange={(e) => onGapChange(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
            </div>

            {/* Background color */}
            <div className="space-y-2">
                <label className="text-sm text-slate-600 font-medium">背景颜色</label>
                <div className="flex gap-2">
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => onBackgroundColorChange(e.target.value)}
                        className="w-12 h-10 border border-slate-200 rounded cursor-pointer"
                    />
                    <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => onBackgroundColorChange(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                    <button
                        onClick={() => onBackgroundColorChange('#FFFFFF')}
                        className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200"
                    >
                        白色
                    </button>
                    <button
                        onClick={() => onBackgroundColorChange('#000000')}
                        className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
                    >
                        黑色
                    </button>
                </div>
            </div>

            {/* Preview grid */}
            <div className="pt-4 border-t border-slate-100">
                <label className="text-sm text-slate-600 font-medium mb-3 block">布局预览</label>
                <div
                    className="grid p-2 rounded-lg"
                    style={{
                        gridTemplateColumns: `repeat(${columns}, 1fr)`,
                        gap: `${Math.min(gap / 5, 8)}px`,
                        backgroundColor
                    }}
                >
                    {Array.from({ length: Math.min(fileCount, 12) }).map((_, i) => (
                        <div
                            key={i}
                            className="aspect-square bg-indigo-100 rounded flex items-center justify-center text-indigo-600 text-xs font-medium"
                        >
                            {i + 1}
                        </div>
                    ))}
                    {fileCount > 12 && (
                        <div className="aspect-square bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs">
                            +{fileCount - 12}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
