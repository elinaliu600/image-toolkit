import React from 'react';
import { ICO_SIZES } from '../types';

interface IcoOptionsProps {
    selectedSizes: number[];
    onSizesChange: (sizes: number[]) => void;
}

export const IcoOptions: React.FC<IcoOptionsProps> = ({ selectedSizes, onSizesChange }) => {
    const toggleSize = (size: number) => {
        if (selectedSizes.includes(size)) {
            onSizesChange(selectedSizes.filter(s => s !== size));
        } else {
            onSizesChange([...selectedSizes, size].sort((a, b) => a - b));
        }
    };

    const selectAll = () => onSizesChange([...ICO_SIZES]);
    const clearAll = () => onSizesChange([]);

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-700">选择 ICO 尺寸</h3>
                <div className="flex gap-2">
                    <button
                        onClick={selectAll}
                        className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                    >
                        全选
                    </button>
                    <button
                        onClick={clearAll}
                        className="text-xs px-3 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                        清空
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                {ICO_SIZES.map((size) => {
                    const isSelected = selectedSizes.includes(size);
                    return (
                        <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={`
                relative flex flex-col items-center justify-center
                p-3 rounded-xl border-2 transition-all duration-200
                ${isSelected
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }
              `}
                        >
                            <div
                                className={`
                  mb-2 rounded-lg flex items-center justify-center
                  ${isSelected ? 'bg-indigo-200' : 'bg-slate-100'}
                `}
                                style={{
                                    width: Math.min(size / 8, 40),
                                    height: Math.min(size / 8, 40),
                                    minWidth: 16,
                                    minHeight: 16
                                }}
                            />
                            <span className="text-xs font-medium">{size}px</span>
                            {isSelected && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {selectedSizes.length === 0 && (
                <p className="mt-4 text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
                    ⚠️ 请至少选择一个尺寸
                </p>
            )}
        </div>
    );
};
