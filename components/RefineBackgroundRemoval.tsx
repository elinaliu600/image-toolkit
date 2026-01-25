import React, { useState, useRef, useEffect } from 'react';
import { PaintBucket, Eraser, Download, RotateCcw, Check, X, ZoomIn, ZoomOut } from 'lucide-react';

interface RefineBackgroundRemovalProps {
    originalImage: string;
    maskImage: string;
    onComplete: (refinedBlob: Blob) => void;
    onCancel: () => void;
}

export const RefineBackgroundRemoval: React.FC<RefineBackgroundRemovalProps> = ({
    originalImage,
    maskImage,
    onComplete,
    onCancel,
}) => {
    const editCanvasRef = useRef<HTMLCanvasElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
    const [brushSize, setBrushSize] = useState(30);
    const [isDrawing, setIsDrawing] = useState(false);
    const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

    useEffect(() => {
        const loadImages = async () => {
            const img = new Image();
            const maskImg = new Image();

            img.crossOrigin = 'anonymous';
            maskImg.crossOrigin = 'anonymous';

            await Promise.all([
                new Promise(resolve => { img.onload = resolve; img.src = originalImage; }),
                new Promise(resolve => { maskImg.onload = resolve; maskImg.src = maskImage; })
            ]);

            setOriginalImg(img);

            const editCanvas = editCanvasRef.current;
            const previewCanvas = previewCanvasRef.current;
            const maskCanvas = maskCanvasRef.current;

            if (!editCanvas || !previewCanvas || !maskCanvas) return;

            const width = maskImg.width;
            const height = maskImg.height;

            editCanvas.width = width;
            editCanvas.height = height;
            previewCanvas.width = width;
            previewCanvas.height = height;
            maskCanvas.width = width;
            maskCanvas.height = height;

            const tempCtx = document.createElement('canvas').getContext('2d')!;
            const tempCanvas = tempCtx.canvas;
            tempCanvas.width = width;
            tempCanvas.height = height;
            tempCtx.drawImage(maskImg, 0, 0);
            const maskData = tempCtx.getImageData(0, 0, width, height);

            const maskCtx = maskCanvas.getContext('2d')!;
            const storedMask = maskCtx.createImageData(width, height);
            for (let i = 0; i < maskData.data.length; i += 4) {
                const alpha = maskData.data[i + 3];
                storedMask.data[i] = alpha;
                storedMask.data[i + 1] = alpha;
                storedMask.data[i + 2] = alpha;
                storedMask.data[i + 3] = 255;
            }
            maskCtx.putImageData(storedMask, 0, 0);

            renderBothViews(img, maskCanvas);
        };

        loadImages();
    }, [originalImage, maskImage]);

    const renderBothViews = (img: HTMLImageElement, maskCanvas: HTMLCanvasElement) => {
        renderEditView(img, maskCanvas);
        renderPreview(img, maskCanvas);
    };

    const renderEditView = (img: HTMLImageElement, maskCanvas: HTMLCanvasElement) => {
        const editCanvas = editCanvasRef.current;
        if (!editCanvas) return;

        const ctx = editCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, editCanvas.width, editCanvas.height);

        ctx.drawImage(img, 0, 0);

        const maskCtx = maskCanvas.getContext('2d')!;
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

        const imgData = ctx.getImageData(0, 0, editCanvas.width, editCanvas.height);

        for (let i = 0; i < maskData.data.length; i += 4) {
            const maskValue = maskData.data[i];
            if (maskValue < 128) {
                const alpha = 0.6;
                imgData.data[i] = imgData.data[i] * (1 - alpha) + 147 * alpha;
                imgData.data[i + 1] = imgData.data[i + 1] * (1 - alpha) + 51 * alpha;
                imgData.data[i + 2] = imgData.data[i + 2] * (1 - alpha) + 234 * alpha;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Draw cursor preview
        if (cursorPos) {
            ctx.strokeStyle = tool === 'brush' ? '#22c55e' : '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cursorPos.x, cursorPos.y, brushSize / 2, 0, Math.PI * 2);
            ctx.stroke();
        }
    };

    const renderPreview = (img: HTMLImageElement, maskCanvas: HTMLCanvasElement) => {
        const previewCanvas = previewCanvasRef.current;
        if (!previewCanvas) return;

        const ctx = previewCanvas.getContext('2d')!;
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, previewCanvas.width, previewCanvas.height);
        const maskCtx = maskCanvas.getContext('2d')!;
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

        for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i + 3] = maskData.data[i];
        }

        ctx.putImageData(imgData, 0, 0);
    };

    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = editCanvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const pos = getCanvasCoords(e);
        if (pos) {
            setCursorPos(pos);

            // Handle panning (right button)
            if (isPanning && panStart) {
                const rect = editCanvasRef.current!.getBoundingClientRect();
                const deltaX = e.clientX - panStart.x;
                const deltaY = e.clientY - panStart.y;
                setPanOffset(prev => ({
                    x: prev.x + deltaX,
                    y: prev.y + deltaY
                }));
                setPanStart({ x: e.clientX, y: e.clientY });
            }
            // Handle drawing (left button)
            else if (isDrawing && lastPos) {
                drawLine(lastPos.x, lastPos.y, pos.x, pos.y);
                setLastPos(pos);
            } else if (originalImg && maskCanvasRef.current) {
                renderEditView(originalImg, maskCanvasRef.current);
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        e.preventDefault();

        // Right button - start panning
        if (e.button === 2) {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            return;
        }

        // Left button - start drawing
        if (e.button === 0) {
            setIsDrawing(true);
            const pos = getCanvasCoords(e);
            if (pos) {
                setLastPos(pos);
                drawAt(pos.x, pos.y);
            }
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        setIsPanning(false);
        setLastPos(null);
        setPanStart(null);
    };

    const handleMouseLeave = () => {
        setCursorPos(null);
        stopDrawing();
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent context menu from showing
    };

    const drawAt = (x: number, y: number) => {
        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas || !originalImg) return;

        const ctx = maskCanvas.getContext('2d')!;
        const maskValue = tool === 'brush' ? 255 : 0;

        ctx.fillStyle = `rgb(${maskValue}, ${maskValue}, ${maskValue})`;
        ctx.beginPath();
        ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();

        renderBothViews(originalImg, maskCanvas);
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
        const maskCanvas = maskCanvasRef.current;
        if (!maskCanvas || !originalImg) return;

        const ctx = maskCanvas.getContext('2d')!;
        const maskValue = tool === 'brush' ? 255 : 0;

        ctx.strokeStyle = `rgb(${maskValue}, ${maskValue}, ${maskValue})`;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        renderBothViews(originalImg, maskCanvas);
    };

    const reset = () => {
        if (!maskImage || !originalImg) return;

        const maskImg = new Image();
        maskImg.onload = () => {
            const maskCanvas = maskCanvasRef.current;
            if (!maskCanvas) return;

            const tempCtx = document.createElement('canvas').getContext('2d')!;
            const tempCanvas = tempCtx.canvas;
            tempCanvas.width = maskImg.width;
            tempCanvas.height = maskImg.height;
            tempCtx.drawImage(maskImg, 0, 0);
            const maskData = tempCtx.getImageData(0, 0, maskImg.width, maskImg.height);

            const maskCtx = maskCanvas.getContext('2d')!;
            const storedMask = maskCtx.createImageData(maskImg.width, maskImg.height);
            for (let i = 0; i < maskData.data.length; i += 4) {
                const alpha = maskData.data[i + 3];
                storedMask.data[i] = alpha;
                storedMask.data[i + 1] = alpha;
                storedMask.data[i + 2] = alpha;
                storedMask.data[i + 3] = 255;
            }
            maskCtx.putImageData(storedMask, 0, 0);

            renderBothViews(originalImg, maskCanvas);
        };
        maskImg.src = maskImage;
    };

    const applyMask = async () => {
        const maskCanvas = maskCanvasRef.current;
        if (!originalImg || !maskCanvas) return;

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = originalImg.width;
        resultCanvas.height = originalImg.height;
        const ctx = resultCanvas.getContext('2d')!;

        ctx.drawImage(originalImg, 0, 0);
        const imgData = ctx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);

        const maskCtx = maskCanvas.getContext('2d')!;
        const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

        for (let i = 0; i < imgData.data.length; i += 4) {
            imgData.data[i + 3] = maskData.data[i];
        }

        ctx.putImageData(imgData, 0, 0);

        resultCanvas.toBlob((blob) => {
            if (blob) onComplete(blob);
        }, 'image/png');
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const delta = -e.deltaY / 1000;
        setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-slate-800">精修抠图</h2>
                        <button onClick={onCancel} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="grid grid-cols-4 gap-6">
                        <div className="col-span-3">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
                                {/* Left: Edit canvas */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-slate-600 text-center">编辑区（左键=画笔 | 右键=拖动）</div>
                                    <div
                                        className="bg-slate-100 rounded-xl p-3 flex items-center justify-center overflow-hidden"
                                        style={{ width: '600px', height: '600px' }}
                                        onWheel={handleWheel}
                                    >
                                        <canvas
                                            ref={editCanvasRef}
                                            onMouseDown={startDrawing}
                                            onMouseMove={handleMouseMove}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={handleMouseLeave}
                                            onContextMenu={handleContextMenu}
                                            className="border border-slate-300 rounded shadow-sm"
                                            style={{
                                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                                transformOrigin: 'center',
                                                cursor: isPanning ? 'grabbing' : 'none'
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Middle: Vertical zoom slider */}
                                <div className="flex flex-col items-center gap-3 pt-10">
                                    <ZoomIn className="w-5 h-5 text-slate-500" />
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        value={zoom * 100}
                                        onChange={(e) => setZoom(Number(e.target.value) / 100)}
                                        className="h-64"
                                        style={{
                                            writingMode: 'bt-lr',
                                            WebkitAppearance: 'slider-vertical',
                                            width: '8px'
                                        }}
                                    />
                                    <ZoomOut className="w-5 h-5 text-slate-500" />
                                    <div className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                        {Math.round(zoom * 100)}%
                                    </div>
                                </div>

                                {/* Right: Preview canvas */}
                                <div className="space-y-2">
                                    <div className="text-sm font-medium text-slate-600 text-center">实时预览</div>
                                    <div
                                        className="rounded-xl p-3 flex items-center justify-center overflow-hidden"
                                        style={{
                                            width: '600px',
                                            height: '600px',
                                            backgroundImage: "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\"%3E%3Crect width=\"10\" height=\"10\" fill=\"%23ccc\"/%3E%3Crect x=\"10\" y=\"10\" width=\"10\" height=\"10\" fill=\"%23ccc\"/%3E%3C/svg%3E')"
                                        }}
                                        onWheel={handleWheel}
                                    >
                                        <canvas
                                            ref={previewCanvasRef}
                                            className="border border-slate-300 rounded shadow-sm"
                                            style={{
                                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                                transformOrigin: 'center'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700">工具</h3>
                                <button
                                    onClick={() => setTool('brush')}
                                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${tool === 'brush' ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <PaintBucket className="w-5 h-5" /> 保留
                                </button>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${tool === 'eraser' ? 'bg-red-600 text-white shadow-lg scale-105' : 'bg-white text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <Eraser className="w-5 h-5" /> 删除
                                </button>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                <h3 className="text-sm font-semibold text-slate-700">笔刷大小</h3>
                                <input
                                    type="range"
                                    min="5"
                                    max="80"
                                    value={brushSize}
                                    onChange={(e) => setBrushSize(Number(e.target.value))}
                                    className="w-full"
                                />
                                <div className="text-center text-lg font-mono text-slate-600">{brushSize}px</div>
                            </div>

                            <button
                                onClick={reset}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200"
                            >
                                <RotateCcw className="w-5 h-5" /> 重置
                            </button>

                            <div className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg leading-relaxed">
                                <strong>💡 提示</strong><br />
                                左键=画笔/橡皮擦<br />
                                右键=拖动画布<br />
                                滚轮=缩放<br />
                                圆圈=笔刷大小
                            </div>

                            <div className="space-y-2 pt-4">
                                <button
                                    onClick={applyMask}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg"
                                >
                                    <Check className="w-5 h-5" /> 应用修改
                                </button>
                                <button
                                    onClick={onCancel}
                                    className="w-full px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    </div>

                    <canvas ref={maskCanvasRef} className="hidden" />
                </div >
            </div >
        </div >
    );
};
