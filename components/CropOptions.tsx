import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import { AlignCenter, Maximize, Lock, Unlock, Grid, AlertTriangle } from 'lucide-react';
import 'react-image-crop/dist/ReactCrop.css';

interface CropOptionsProps {
    imgSrc: string;
    crop: PixelCrop;
    onCropChange: (crop: PixelCrop, scaleX: number, scaleY: number) => void;
    files: { id: string; name: string }[];
    activeFileId: string;
    onActiveFileChange: (id: string) => void;
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            { unit: '%', width: 80 },
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
    const [internalCrop, setInternalCrop] = useState<Crop>();

    // Track scale ratio between displayed image and actual image
    const [scaleX, setScaleX] = useState(1);
    const [scaleY, setScaleY] = useState(1);
    const [actualWidth, setActualWidth] = useState(0);
    const [actualHeight, setActualHeight] = useState(0);

    // Calculate actual pixel values for display
    const actualCropX = Math.round(crop.x * scaleX);
    const actualCropY = Math.round(crop.y * scaleY);
    const actualCropWidth = Math.round(crop.width * scaleX);
    const actualCropHeight = Math.round(crop.height * scaleY);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const img = e.currentTarget;
        const displayWidth = img.width;
        const displayHeight = img.height;
        const naturalWidth = img.naturalWidth;
        const naturalHeight = img.naturalHeight;

        // Calculate scale ratio
        const sX = naturalWidth / displayWidth;
        const sY = naturalHeight / displayHeight;
        setScaleX(sX);
        setScaleY(sY);
        setActualWidth(naturalWidth);
        setActualHeight(naturalHeight);

        if (crop.width === 0 && crop.height === 0) {
            const center = centerCrop(
                { unit: '%', width: 80, height: 80 },
                displayWidth,
                displayHeight
            );
            setInternalCrop(center);
        } else {
            setInternalCrop({ unit: 'px', ...crop });
        }
    }

    const handleAspectChange = (value: number | undefined) => {
        setAspect(value);
        if (value && imgRef.current) {
            const { width, height } = imgRef.current;
            const newCrop = centerAspectCrop(width, height, value);
            setInternalCrop(newCrop);
            const pixelCrop = {
                x: newCrop.x * width / 100,
                y: newCrop.y * height / 100,
                width: newCrop.width * width / 100,
                height: newCrop.height * height / 100,
                unit: 'px'
            } as PixelCrop;
            onCropChange(pixelCrop, scaleX, scaleY);
        }
    };

    const handleCropComplete = useCallback((c: PixelCrop) => {
        onCropChange(c, scaleX, scaleY);
    }, [onCropChange, scaleX, scaleY]);

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
                    onComplete={handleCropComplete}
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
                        <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">参考图片</label>
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

                {/* Image info */}
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-sm">
                    <div className="flex justify-between text-indigo-700">
                        <span>原图尺寸:</span>
                        <span className="font-mono">{actualWidth} × {actualHeight} px</span>
                    </div>
                    <div className="flex justify-between text-indigo-600 text-xs mt-1">
                        <span>缩放比例:</span>
                        <span className="font-mono">{scaleX.toFixed(2)}x</span>
                    </div>
                </div>

                {/* Aspect Ratio */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        {aspect ? <Lock className="w-4 h-4 text-indigo-500" /> : <Unlock className="w-4 h-4 text-slate-400" />}
                        <label className="text-sm font-semibold text-slate-800">比例</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {ASPECT_RATIOS.map((ratio) => (
                            <button
                                key={String(ratio.value)}
                                onClick={() => handleAspectChange(ratio.value)}
                                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors border
                                    ${aspect === ratio.value
                                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-100 hover:bg-slate-100'}`}
                            >
                                {ratio.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Coordinates - showing ACTUAL pixel values */}
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <Maximize className="w-4 h-4" /> 裁切尺寸 (实际像素)
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">宽度</label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 font-mono">
                                {actualCropWidth} px
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">高度</label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 font-mono">
                                {actualCropHeight} px
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">X 坐标</label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 font-mono">
                                {actualCropX} px
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-slate-500">Y 坐标</label>
                            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm text-slate-700 font-mono">
                                {actualCropY} px
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-slate-400 leading-relaxed px-1 space-y-2">
                    <p>* 显示的尺寸为实际导出像素值，已根据原图比例自动换算。</p>
                    {(actualCropWidth < 10 || actualCropHeight < 10) && (
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
