import React, { useRef, useState } from 'react';

interface MultiImageUploadProps {
  label: string;
  description: string;
  images: string[];
  onImagesChange: (images: string[]) => void;
  accept?: string; // e.g., "image/*,application/pdf"
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  label,
  description,
  images,
  onImagesChange,
  accept = "image/*"
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    processFiles(files);
  };

  const processFiles = (files: FileList | null | undefined) => {
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      // Basic validation based on accept prop (simplified)
      if (accept.includes('image') && !file.type.startsWith('image/') && !file.type.includes('pdf')) return;
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);
        processedCount++;
        if (processedCount === files.length) {
            // Append new images to existing ones
            onImagesChange([...images, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const isPdf = (dataUrl: string) => {
      return dataUrl.startsWith('data:application/pdf');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider flex justify-between items-center">
        {label} <span className="text-xs font-normal normal-case opacity-70 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">{images.length} file</span>
      </label>
      
      <div
        className={`relative flex flex-col items-center justify-center w-full min-h-[120px] border-2 border-dashed rounded-xl transition-all duration-300 p-2
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' 
            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {images.length > 0 ? (
           <div className="w-full h-full grid grid-cols-3 gap-2 p-1">
             {images.map((img, idx) => (
                <div key={idx} className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    {isPdf(img) ? (
                        <div className="flex flex-col items-center justify-center text-red-500 p-2 text-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                            <span className="text-[10px] font-bold">PDF FILE</span>
                        </div>
                    ) : (
                        <img src={img} alt={`Asset ${idx}`} className="w-full h-full object-cover" />
                    )}
                    
                    <button 
                        onClick={(e) => handleRemove(idx, e)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                        title="Xóa file này"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
             ))}
             {/* Add Button Placeholder */}
             <div className="aspect-square flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors bg-gray-50 dark:bg-gray-900/30">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="text-[10px] mt-1">Thêm</span>
             </div>
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 px-4 text-center cursor-pointer">
            <svg
              className="w-8 h-8 mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              ></path>
            </svg>
            <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-semibold">Nhấn để tải lên</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{description}</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple
          onChange={handleFileChange}
        />
      </div>
      {images.length > 0 && (
          <button 
              onClick={(e) => {
                  e.stopPropagation();
                  onImagesChange([]);
              }}
              className="self-end text-xs text-red-500 hover:text-red-600 underline"
          >
              Xóa tất cả
          </button>
      )}
    </div>
  );
};