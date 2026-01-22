import React, { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';

interface UploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept: string;
  description: string;
}

export const Uploader: React.FC<UploaderProps> = ({ onFilesSelected, accept, description }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Filter based on accept type (simple check)
      // accept usually looks like "image/webp" or "image/*"
      const allowedType = accept.replace('image/', '').replace('*', '');
      
      const droppedFiles = (Array.from(e.dataTransfer.files) as File[]).filter(
        file => file.type.includes(allowedType) || accept === 'image/*'
      );

      if (droppedFiles.length > 0) {
        onFilesSelected(droppedFiles);
      } else {
        alert(`Please drop valid images (${accept})`);
      }
    }
  }, [onFilesSelected, accept]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      e.target.value = '';
    }
  }, [onFilesSelected]);

  const handleBoxClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleBoxClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        flex flex-col items-center justify-center
        w-full h-64 rounded-2xl border-2 border-dashed
        transition-all duration-300 ease-in-out
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' 
          : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={handleFileInputChange}
      />
      
      <div className={`p-4 rounded-full mb-4 transition-colors ${isDragging ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-indigo-50'}`}>
        {isDragging ? (
           <Upload className="w-10 h-10 text-indigo-600" />
        ) : (
           <ImagePlus className="w-10 h-10 text-slate-400 group-hover:text-indigo-500" />
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-700 mb-1">
        {isDragging ? 'Drop files here' : description}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-xs">
        Files are processed locally in your browser.
      </p>
    </div>
  );
};