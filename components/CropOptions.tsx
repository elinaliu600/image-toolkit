import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { AlignCenter, Maximize, Lock, Unlock, Grid, AlertTriangle } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface CropOptionsProps {
    imgSrc: string; // The reference image URL
    crop: PixelCrop;
    onCropChange: (crop: PixelCrop) => void;
    files: { id: string; name: string }[]; // List of files for switching reference
    activeFileId: string;
    onActiveFileChange: (id: string) => void;
}

// Helper to center the crop initially
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 80,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export const CropOptions: React.FC<CropOptionsProps> = ({
    imgSrc,
    crop,
    onCropChange,
    files,
    activeFileId,
    onActiveFileChange,
}) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [aspect, setAspect] = useState<number | undefined>(undefined);
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>(crop);
    const [internalCrop, setInternalCrop] = useState<Crop>();

    // Initialize crop when image loads
    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;

        // If we already have a specialized crop from parent, try to convert it to % for ReactCrop
        // Or just start centered if it's a fresh file switch? 
        // For now, let's defer to manual control unless it's the very first load
        if (crop.width === 0 && crop.height === 0) {
            // Default to center 80% with no aspect
            const center = centerCrop(
                { unit: '%', width: 80, height: 80 },
                width,
                height
            );
            // We need to convert this % crop to pixels for our parent state immediately
            // Actually ReactCrop onChange handles this. We just set internal state.
            setInternalCrop(center);
        } else {
            // Convert pixel crop back to what ReactCrop might expect? 
            // ReactCrop works fine with pixel units if we pass unit: 'px'
            setInternalCrop({ unit: 'px', ...crop });
        }
    }

    // Handle aspect ratio change
    const handleAspectChange = (value: number | undefined) => {
        setAspect(value);
        if (value && imgRef.current) {
            const { width, height } = imgRef.current;
            const newCrop = centerAspectCrop(width, height, value);
            setInternalCrop(newCrop);
            // Trigger update to parent? 
            // We'll let the user adjust it or let the onChange fire
            // Actually better to apply it immediately:
            // But we need pixel values for parent. ReactCrop onChange gives us that.
            // We can force a manual trigger:
            // Let's just set internal crop, and when user drags it will lock. 
            // Or we can manually calculate pixel crop here. 
            const pixelCrop = {
                x: newCrop.x * width / 100,
                y: newCrop.y * height / 100,
                width: newCrop.width * width / 100,
                height: newCrop.height * height / 100,
                unit: 'px'
            } as PixelCrop;
            onCropChange(pixelCrop);
        }
    };

    const ASPECT_RATIOS = [
        { label: '自由', value: undefined },
        { label: '1:1', value: 1 },
        { label: '4:3', value: 4 / 3 },
        { label: '3:4', value: 3 / 4 },
        { label: '16:9', value: 16 / 9 },
        { label: '9:16', value: 9 / 16 },
    ];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Image Preview & Crop Area */}
            <div className="lg:col-span-2 bg-slate-900/5 rounded-2xl flex items-center justify-center p-4 min-h-[400px] overflow-auto border border-slate-200">
                <ReactCrop
                    crop={internalCrop}
                    onChange={(_, percentCrop) => setInternalCrop(percentCrop)}
                    onComplete={(c) => {
                        setCompletedCrop(c);
                        onCropChange(c);
                    }}
                    aspect={aspect}
                    ruleOfThirds
                    minWidth={10}
                    minHeight={10}
                    className="max-h-[600px]"
                >
                    <img
                        ref={imgRef}
                        src={imgSrc}
                        onLoad={onImageLoad}
                        alt="Reference"
                        className="max-w-full max-h-[600px] object-contain shadow-lg"
                    />
                </ReactCrop>
            </div>

            {/* Right: Controls */}
            <div className="space-y-6">
                {/* File Switcher */}
                {files.length > 1 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">参考图片 (Reference)</label>
                        <select
                            value={activeFileId}
                            onChange={(e) => onActiveFileChange(e.target.value)}
                            className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {files.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Aspect Ratio */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        {aspect ? <Lock className="w-4 h-4 text-indigo-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                        <label className="text-sm font-semibold text-slate-800">比例 (Aspect Ratio)</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={String(ratio.value)}
                                onClick={() => handleAspectChange(ratio.value)}
                                className={`
                            px-2 py-1.5 text-xs font-medium rounded-md transition-colors border
                            ${aspect === ratio.value
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}
                        `}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coordinates */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Maximize className="w-4 h-4" /> 坐标与尺寸
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">宽度 (W)</label>
                            <input
                                type="number"
                                value={Math.round(crop.width)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    onCropChange({ ...crop, width: val });
                                    setInternalCrop({ ...crop, width: val, unit: 'px' });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">高度 (H)</label>
                            <input
                                type="number"
                                value={Math.round(crop.height)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    onCropChange({ ...crop, height: val });
                                    setInternalCrop({ ...crop, height: val, unit: 'px' });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">X 坐标</label>
                            <input
                                type="number"
                                value={Math.round(crop.x)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    onCropChange({ ...crop, x: val });
                                    setInternalCrop({ ...crop, x: val, unit: 'px' });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Y 坐标</label>
                            <input
                                type="number"
                                value={Math.round(crop.y)}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    onCropChange({ ...crop, y: val });
                                    setInternalCrop({ ...crop, y: val, unit: 'px' });
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed px-1 space-y-2">
                    <p>* 裁切框将以绝对像素坐标应用到所有图片。请确保批量上传的图片尺寸一致，否则可能导致裁切位置偏移。</p>
                    {(crop.width < 10 || crop.height < 10) && (
                        <p className="flex items-center gap-1.5 text-amber-600 bg-amber-50 p-2 rounded">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>裁切尺寸不能小于 10px</span>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
