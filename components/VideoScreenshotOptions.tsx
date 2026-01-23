import React, { useState, useRef, useCallback } from 'react';
import { Camera, Download, Play, Pause, SkipBack, SkipForward, Clock, Image as ImageIcon } from 'lucide-react';

interface VideoScreenshotOptionsProps {
    videoFile: File;
    onScreenshotCapture: (blob: Blob, timestamp: number) => void;
}

interface Screenshot {
    id: string;
    blob: Blob;
    url: string;
    timestamp: number;
}

export const VideoScreenshotOptions: React.FC<VideoScreenshotOptionsProps> = ({
    videoFile,
    onScreenshotCapture,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
    const [videoUrl, setVideoUrl] = useState<string>('');

    // Load video
    React.useEffect(() => {
        const url = URL.createObjectURL(videoFile);
        setVideoUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [videoFile]);

    const handleLoadedMetadata = useCallback(() => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    }, []);

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
            setCurrentTime(time);
        }
    }, []);

    const skipTime = useCallback((delta: number) => {
        if (!videoRef.current) return;
        const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    }, [duration]);

    const captureScreenshot = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (blob) {
                const screenshot: Screenshot = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    blob,
                    url: URL.createObjectURL(blob),
                    timestamp: currentTime,
                };
                setScreenshots(prev => [...prev, screenshot]);
                onScreenshotCapture(blob, currentTime);
            }
        }, 'image/png');
    }, [currentTime, onScreenshotCapture]);

    const removeScreenshot = useCallback((id: string) => {
        setScreenshots(prev => {
            const shot = prev.find(s => s.id === id);
            if (shot) {
                URL.revokeObjectURL(shot.url);
            }
            return prev.filter(s => s.id !== id);
        });
    }, []);

    const downloadScreenshot = useCallback((screenshot: Screenshot) => {
        const link = document.createElement('a');
        link.href = screenshot.url;
        link.download = `screenshot_${formatTime(screenshot.timestamp).replace(/:/g, '-')}.png`;
        link.click();
    }, []);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-6">
            {/* Video player */}
            <div className="bg-slate-900 rounded-2xl overflow-hidden">
                <div className="relative">
                    <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full max-h-[400px] object-contain"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                    />
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls */}
                <div className="p-4 bg-slate-800 space-y-3">
                    {/* Progress bar */}
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-white/60 font-mono w-16">{formatTime(currentTime)}</span>
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            step="0.01"
                            value={currentTime}
                            onChange={handleSeek}
                            className="flex-1 h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                        <span className="text-xs text-white/60 font-mono w-16 text-right">{formatTime(duration)}</span>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => skipTime(-5)}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="后退 5 秒"
                        >
                            <SkipBack className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => skipTime(-1)}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                            title="后退 1 秒"
                        >
                            -1s
                        </button>
                        <button
                            onClick={togglePlay}
                            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                        </button>
                        <button
                            onClick={() => skipTime(1)}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium"
                            title="前进 1 秒"
                        >
                            +1s
                        </button>
                        <button
                            onClick={() => skipTime(5)}
                            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="前进 5 秒"
                        >
                            <SkipForward className="w-5 h-5" />
                        </button>

                        <div className="ml-8">
                            <button
                                onClick={captureScreenshot}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                <Camera className="w-5 h-5" />
                                截图
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Screenshots list */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-indigo-600" />
                    已截取 ({screenshots.length})
                </h3>

                {screenshots.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        播放视频并点击"截图"按钮捕获画面
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {screenshots.map((shot) => (
                            <div
                                key={shot.id}
                                className="relative group rounded-lg overflow-hidden border border-slate-200"
                            >
                                <img
                                    src={shot.url}
                                    alt={`Screenshot at ${formatTime(shot.timestamp)}`}
                                    className="w-full aspect-video object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white font-mono flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(shot.timestamp)}
                                        </span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => downloadScreenshot(shot)}
                                                className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                                                title="下载"
                                            >
                                                <Download className="w-3 h-3" />
                                            </button>
                                            <button
                                                onClick={() => removeScreenshot(shot.id)}
                                                className="p-1 bg-red-500/50 hover:bg-red-500/70 rounded text-white"
                                                title="删除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {screenshots.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                        <button
                            onClick={() => screenshots.forEach(s => downloadScreenshot(s))}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <Download className="w-4 h-4" />
                            下载全部
                        </button>
                        <button
                            onClick={() => {
                                screenshots.forEach(s => URL.revokeObjectURL(s.url));
                                setScreenshots([]);
                            }}
                            className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                        >
                            清空
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
