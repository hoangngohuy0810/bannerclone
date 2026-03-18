import React, { useState } from 'react';
import { GeneratedImage } from '../types';

interface GalleryProps {
  images: GeneratedImage[];
  isGenerating: boolean;
  expectedCount: number;
  onRegenerate: (id: string, prompt: string) => void;
}

// Helper to map setting string to Tailwind aspect class
const getAspectClass = (ratio: string) => {
    switch (ratio) {
        case '1:1': return 'aspect-square';
        case '3:4': return 'aspect-[3/4]';
        case '4:3': return 'aspect-[4/3]';
        case '9:16': return 'aspect-[9/16]';
        case '16:9': return 'aspect-video';
        default: return 'aspect-[3/4]';
    }
};

export const Gallery: React.FC<GalleryProps> = ({ images, isGenerating, expectedCount, onRegenerate }) => {
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');
  
  // State for Lightbox Edit
  const [lightboxPrompt, setLightboxPrompt] = useState<string>('');
  const [isLightboxEditing, setIsLightboxEditing] = useState<boolean>(false);

  const handleEditClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setEditingId(id);
      setEditPrompt('');
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setEditingId(null);
  };

  const handleSubmitEdit = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (editPrompt.trim()) {
          onRegenerate(id, editPrompt);
          setEditingId(null);
      }
  };

  const handleLightboxRegenerate = () => {
      if (selectedImage && lightboxPrompt.trim()) {
          onRegenerate(selectedImage.id, lightboxPrompt);
          setLightboxPrompt('');
          setIsLightboxEditing(false);
          // Optionally close lightbox or keep it open to wait for result. 
          // Since result updates in bg, keeping it open might show old image until update.
          // Let's close it to show the grid loading state.
          setSelectedImage(null); 
      }
  };

  // If initial state (empty and not generating), show a welcome placeholder
  if (images.length === 0 && !isGenerating) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl bg-gray-50/50 dark:bg-gray-800/30 min-h-[500px]">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chưa có thiết kế nào</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Tải lên mẫu tham khảo và hình ảnh sản phẩm ở bảng bên phải, sau đó nhấn <strong>"Tạo thiết kế"</strong> để bắt đầu.
        </p>
      </div>
    );
  }

  const downloadImage = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `banner-clone-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    images.forEach((img, index) => {
        setTimeout(() => {
            downloadImage(img.url, img.id);
        }, index * 500); // Stagger downloads to prevent browser blocking
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Kết quả</span>
            {isGenerating && (
                <span className="text-sm font-normal text-blue-500 animate-pulse bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                    Đang tạo {expectedCount} biến thể...
                </span>
            )}
            {!isGenerating && images.length > 0 && (
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 px-3 py-1">
                    {images.length} thiết kế hoàn thành
                </span>
            )}
          </h2>
          
          {images.length > 0 && !isGenerating && (
              <button 
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Tải tất cả
              </button>
          )}
      </div>
      
      {/* Grid container with variable aspect ratios handled by children */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 overflow-y-auto pb-10 pr-2 custom-scrollbar auto-rows-min">
        {images.map((img) => (
          <div 
            key={img.id} 
            className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300 h-fit"
            onClick={() => { setSelectedImage(img); setIsLightboxEditing(false); }}
          >
            <div className={`w-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative ${getAspectClass(img.aspectRatio)}`}>
                <img
                  src={img.url}
                  alt={`Generated ${img.style}`}
                  className={`w-full h-full object-cover transition-transform duration-500 ${editingId !== img.id ? 'group-hover:scale-105' : ''}`}
                />

                {/* Loading Overlay for Regeneration */}
                {img.isRegenerating && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                        <span className="text-white text-xs font-medium animate-pulse">Đang chỉnh sửa...</span>
                    </div>
                )}

                {/* Edit Mode Overlay */}
                {editingId === img.id && !img.isRegenerating && (
                    <div 
                        className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h4 className="text-white font-bold text-sm mb-2">Chỉnh sửa thiết kế</h4>
                        <textarea 
                            className="w-full h-24 bg-gray-800 text-white text-sm rounded-lg border border-gray-600 p-2 mb-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Nhập yêu cầu (VD: Đổi nền đỏ, làm logo to hơn...)"
                            autoFocus
                            value={editPrompt}
                            onChange={(e) => setEditPrompt(e.target.value)}
                        />
                        <div className="flex gap-2 w-full">
                            <button 
                                onClick={(e) => handleCancelEdit(e)}
                                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold rounded-lg"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={(e) => handleSubmitEdit(e, img.id)}
                                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Hover Actions (Only visible if not editing) */}
            {editingId !== img.id && !img.isRegenerating && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    {/* Regenerate Button */}
                    <button
                        onClick={(e) => handleEditClick(e, img.id)}
                        className="w-8 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                        title="Chỉnh sửa / Regenerate"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                        </svg>
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); downloadImage(img.url, img.id); }}
                        className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-1 transition-transform hover:scale-105"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Tải về
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedImage(img); setIsLightboxEditing(false); }}
                        className="w-8 py-2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-lg flex items-center justify-center transition-transform hover:scale-105"
                        title="Phóng to"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                        </svg>
                    </button>
                </div>
                </div>
            )}
          </div>
        ))}

        {isGenerating && Array.from({ length: expectedCount - images.length }).map((_, idx) => (
            <div key={`loading-${idx}`} className="bg-gray-100 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 aspect-[3/4] flex flex-col items-center justify-center animate-pulse p-4">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <div className="h-2 w-2/3 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-2 w-1/2 bg-gray-300 dark:bg-gray-700 rounded"></div>
                <span className="text-xs text-gray-400 mt-2">Đang xử lý...</span>
            </div>
        ))}
      </div>

      {/* Lightbox / Zoom Modal */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
        >
            <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
                
                {/* Image Container */}
                <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                    <img 
                        src={selectedImage.url} 
                        alt="Zoomed Result" 
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                    />
                </div>
                
                {/* Lightbox Controls */}
                <div className="mt-4 w-full flex flex-col gap-3">
                     {/* Edit Input Area */}
                     <div className="flex gap-2 w-full max-w-2xl mx-auto">
                        <input 
                            type="text" 
                            value={lightboxPrompt}
                            onChange={(e) => setLightboxPrompt(e.target.value)}
                            onFocus={() => setIsLightboxEditing(true)}
                            placeholder="Nhập yêu cầu sửa ảnh (VD: Đổi nền đen, thêm logo...)"
                            className="flex-1 bg-white/10 border border-white/20 text-white rounded-full px-4 py-3 outline-none focus:border-blue-500 focus:bg-white/20 transition-all placeholder-gray-400"
                        />
                        <button 
                            onClick={handleLightboxRegenerate}
                            disabled={!lightboxPrompt.trim()}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                            </svg>
                            Sửa ngay
                        </button>
                     </div>

                     {/* Top Right Actions */}
                     <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); downloadImage(selectedImage.url, selectedImage.id); }}
                            className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                            title="Tải xuống"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="p-3 bg-white/10 hover:bg-white/30 text-white rounded-full shadow-lg backdrop-blur-md transition-colors"
                            title="Đóng"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};