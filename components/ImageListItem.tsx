import React from 'react';
import { Download, Loader2, XCircle, Trash2, ArrowRight } from 'lucide-react';
import { ImageFile, ConversionStatus } from '../types';
import { formatBytes } from '../services/converter';

interface ImageListItemProps {
  item: ImageFile;
  targetExt: string;
  onRemove: (id: string) => void;
}

export const ImageListItem: React.FC<ImageListItemProps> = ({ item, targetExt, onRemove }) => {
  return (
    <div className="flex items-center gap-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100 group transition-all hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
        <img
          src={item.status === ConversionStatus.COMPLETED && item.convertedUrl ? item.convertedUrl : item.previewUrl}
          alt={item.file.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-slate-700 truncate text-sm" title={item.file.name}>
          {item.file.name}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {formatBytes(item.originalSize)}
          </span>
          {item.status === ConversionStatus.COMPLETED && (
            <>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-xs font-semibold text-indigo-600 uppercase">{targetExt} 完成</span>
            </>
          )}
        </div>
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3">
        {item.status === ConversionStatus.IDLE && (
          <span className="text-xs text-slate-400 font-medium px-2">等待转换</span>
        )}

        {item.status === ConversionStatus.PROCESSING && (
          <div className="flex items-center gap-2 text-indigo-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-xs font-medium hidden sm:inline">转换中...</span>
          </div>
        )}

        {item.status === ConversionStatus.ERROR && (
          <div className="flex items-center gap-2 text-red-500" title={item.errorMessage}>
            <XCircle className="w-5 h-5" />
            <span className="text-xs font-medium hidden sm:inline">错误</span>
          </div>
        )}

        {item.status === ConversionStatus.COMPLETED && item.convertedUrl && (
          <a
            href={item.convertedUrl}
            download={`${item.file.name.substring(0, item.file.name.lastIndexOf('.'))}.${targetExt}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-xs sm:text-sm"
          >
            <Download className="w-4 h-4" />
            下载
          </a>
        )}

        <button
          onClick={() => onRemove(item.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="移除文件"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};