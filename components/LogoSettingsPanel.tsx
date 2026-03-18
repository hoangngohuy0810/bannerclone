import React, { useRef, useState, useEffect } from 'react';
import { LogoSettings } from '../types';

interface Props {
  settings: LogoSettings;
  onChange: (settings: LogoSettings) => void;
  aspectRatio: string;
}

export const LogoSettingsPanel: React.FC<Props> = ({ settings, onChange, aspectRatio }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Parse aspect ratio to get width/height ratio for the preview box
  const getRatio = () => {
    const [w, h] = aspectRatio.split(':').map(Number);
    return w / h;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...settings, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onChange({ ...settings, image: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setQuickPosition = (pos: 'top-left' | 'top-center' | 'bottom-right') => {
    let x = 15, y = 15;
    if (pos === 'top-left') {
      x = 15; y = 15;
    } else if (pos === 'top-center') {
      x = 50; y = 15;
    } else if (pos === 'bottom-right') {
      x = 85; y = 85;
    }
    onChange({ ...settings, positionX: x, positionY: y });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!settings.image) return;
    setIsDragging(true);
    updatePosition(e);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleMouseMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleMouseMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const updatePosition = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    
    // Prevent default scrolling on touch
    if ('touches' in e && e.cancelable) {
      e.preventDefault();
    }

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;

    // Clamp values
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    onChange({ ...settings, positionX: x, positionY: y });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
          Chèn Logo
        </label>
        {settings.image && (
          <button 
            onClick={handleRemoveLogo}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Xóa Logo
          </button>
        )}
      </div>

      {!settings.image ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mx-auto text-gray-400 mb-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tải lên Logo (PNG tách nền)</p>
          <p className="text-xs text-gray-500 mt-1">Click để chọn file</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              id="whiteBorder" 
              checked={settings.addWhiteBorder}
              onChange={(e) => onChange({ ...settings, addWhiteBorder: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="whiteBorder" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Thêm viền trắng quanh logo
            </label>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => setQuickPosition('top-left')}
              className="py-2 px-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Góc trên trái
            </button>
            <button 
              onClick={() => setQuickPosition('top-center')}
              className="py-2 px-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Giữa trên
            </button>
            <button 
              onClick={() => setQuickPosition('bottom-right')}
              className="py-2 px-2 text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Góc dưới phải
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Kích thước Logo: {settings.size}%
            </label>
            <input
              type="range"
              min="5"
              max="50"
              value={settings.size}
              onChange={(e) => onChange({ ...settings, size: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <div className="mt-2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Xem trước & Kéo thả vị trí
            </label>
            <div className="flex justify-center bg-gray-100 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div 
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
                className="relative bg-gray-300 dark:bg-gray-800 rounded shadow-inner overflow-hidden cursor-crosshair"
                style={{ 
                  width: '100%', 
                  maxWidth: '200px',
                  aspectRatio: aspectRatio.replace(':', '/')
                }}
              >
                {/* Checkerboard background to simulate transparency/image */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(45deg, #808080 25%, transparent 25%), linear-gradient(-45deg, #808080 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #808080 75%), linear-gradient(-45deg, transparent 75%, #808080 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}></div>
                
                {/* The Logo */}
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    left: `${settings.positionX}%`,
                    top: `${settings.positionY}%`,
                    width: `${settings.size}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <img 
                    src={settings.image} 
                    alt="Logo Preview" 
                    className="w-full h-auto"
                    style={settings.addWhiteBorder ? {
                      filter: 'drop-shadow(1px 1px 0 white) drop-shadow(-1px -1px 0 white) drop-shadow(1px -1px 0 white) drop-shadow(-1px 1px 0 white)'
                    } : {}}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/png" 
        className="hidden" 
      />
    </div>
  );
};
