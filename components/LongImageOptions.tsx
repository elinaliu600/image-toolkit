import React, { useState, useRef } from 'react';
import { Rows, GripVertical, X, Settings } from 'lucide-react';
import { formatBytes } from '../services/converter';

interface FileInfo {
    id: string;
    name: string;
    previewUrl: string;
    width?: number;
    height?: number;
    size: number;
}

interface LongImageOptionsProps {
    files: FileInfo[];
    onReorder: (fromIndex: number, toIndex: number) => void;
    onRemove: (id: string) => void;
    direction: 'vertical' | 'horizontal';
    gap: number;
    borderRadius: number;
    backgroundColor: string;
    onDirectionChange: (direction: 'vertical' | 'horizontal') => void;
    onGapChange: (gap: number) => void;
    onBorderRadiusChange: (radius: number) => void;
    onBackgroundColorChange: (color: string) => void;
}

export const LongImageOptions: React.FC<LongImageOptionsProps> = ({
    files,
    onReorder,
    onRemove,
    direction,
    gap,
    borderRadius,
    backgroundColor,
    onDirectionChange,
    onGapChange,
    onBorderRadiusChange,
    onBackgroundColorChange,
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragEnd = () => {
        if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
            onReorder(draggedIndex, dragOverIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    return (
        <div className="space-y-6">
            {/* Image list */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Rows className="w-5 h-5 text-indigo-600" />
                        图像列表 ({files.length})
                    </h3>
                    {files.length > 0 && (
                        <button
                            onClick={() => files.forEach(f => onRemove(f.id))}
                            className="text-sm text-red-500 hover:text-red-600"
                        >
                            清空所有
                        </button>
                    )}
                </div>

                {files.length > 1 && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm">
                        <GripVertical className="w-4 h-4" />
                        拖拽图片可调整拼接顺序
                    </div>
                )}

                {files.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        请先上传至少 2 张图片
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {files.map((file, index) => (
                            <div
                                key={file.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragLeave={handleDragLeave}
                                className={`
                  relative group cursor-grab active:cursor-grabbing
                  w-[160px] rounded-xl border-2 overflow-hidden transition-all
                  ${dragOverIndex === index ? 'border-indigo-500 scale-105' : 'border-slate-200'}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                `}
                            >
                                {/* Order badge */}
                                <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {index + 1}
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(file.id);
                                    }}
                                    className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>

                                {/* Thumbnail */}
                                <div className="aspect-square bg-slate-100">
                                    <img
                                        src={file.previewUrl}
                                        alt={file.name}
                                        className="w-full h-full object-cover"
                                        draggable={false}
                                    />
                                </div>

                                {/* Info bar */}
                                <div className="px-2 py-2 bg-slate-50 text-xs">
                                    <div className="flex items-center justify-between text-slate-500 mb-1">
                                        {file.width && file.height ? (
                                            <span>{file.width}×{file.height}</span>
                                        ) : (
                                            <span>--</span>
                                        )}
                                        <span>{formatBytes(file.size)}</span>
                                    </div>
                                    <div className="text-slate-700 truncate font-medium" title={file.name}>
                                        {file.name}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Settings */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-indigo-600" />
                        拼接设置
                    </h3>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                        {showAdvanced ? '隐藏高级设置' : '显示高级设置'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Direction */}
                    <div className="space-y-2">
                        <label className="text-sm text-slate-600 font-medium">拼接方向</label>
                        <select
                            value={direction}
                            onChange={(e) => onDirectionChange(e.target.value as 'vertical' | 'horizontal')}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="vertical">纵向拼接</option>
                            <option value="horizontal">横向拼接</option>
                        </select>
                    </div>

                    {/* Gap */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-sm text-slate-600 font-medium">图像边距</label>
                            <span className="text-sm text-slate-500">{gap}px</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
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
                                className="w-10 h-10 border border-slate-200 rounded cursor-pointer"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => onBackgroundColorChange(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Advanced settings */}
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                        {/* Border radius */}
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm text-slate-600 font-medium">图像圆角</label>
                                <span className="text-sm text-slate-500">{borderRadius}px</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={borderRadius}
                                onChange={(e) => onBorderRadiusChange(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                        </div>
                    </div>
                )}

                {files.length >= 2 && (
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            已准备 {files.length} 张图片，点击上方"转换全部"开始拼接
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
