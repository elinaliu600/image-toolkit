import React from 'react';
import { Download, DownloadCloud } from 'lucide-react';
import { GifFrame } from '../types';
import JSZip from 'jszip';

interface GifFrameListProps {
    frames: GifFrame[];
    originalFileName: string;
}

export const GifFrameList: React.FC<GifFrameListProps> = ({ frames, originalFileName }) => {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');

    const downloadSingle = (frame: GifFrame) => {
        const link = document.createElement('a');
        link.href = frame.dataUrl;
        link.download = `${baseName}_frame_${String(frame.frameIndex + 1).padStart(3, '0')}.png`;
        link.click();
    };

    const downloadAll = async () => {
        const zip = new JSZip();

        frames.forEach((frame) => {
            const fileName = `${baseName}_frame_${String(frame.frameIndex + 1).padStart(3, '0')}.png`;
            // Convert data URL to binary
            const base64 = frame.dataUrl.split(',')[1];
            zip.file(fileName, base64, { base64: true });
        });

        const blob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${baseName}_frames.zip`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    return (
        <div className="space-y-4">
            {/* Header with download all button */}
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div>
                    <h3 className="font-semibold text-slate-700">提取完成</h3>
                    <p className="text-sm text-slate-500">共 {frames.length} 帧</p>
                </div>
                <button
                    onClick={downloadAll}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/25 transition-all font-medium"
                >
                    <DownloadCloud className="w-5 h-5" />
                    下载全部 (ZIP)
                </button>
            </div>

            {/* Frame grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {frames.map((frame) => (
                    <div
                        key={frame.id}
                        className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all"
                    >
                        <div className="aspect-square bg-slate-50 p-2">
                            <img
                                src={frame.dataUrl}
                                alt={`Frame ${frame.frameIndex + 1}`}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => downloadSingle(frame)}
                                className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 rounded-lg font-medium text-sm hover:bg-slate-100 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                下载
                            </button>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded-md font-medium">
                            #{frame.frameIndex + 1}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
