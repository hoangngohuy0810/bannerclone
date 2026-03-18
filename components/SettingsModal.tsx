import React from 'react';
import { GenerationSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GenerationSettings;
  onUpdateSettings: (newSettings: GenerationSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={handleOverlayClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Appearance
            </label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  settings.theme === 'light' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  settings.theme === 'dark' 
                    ? 'bg-gray-600 text-white shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Dark
              </button>
            </div>
          </div>

          {/* Number of Outputs */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of Outputs
              </label>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{settings.quantity}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={settings.quantity}
              onChange={(e) => onUpdateSettings({ ...settings, quantity: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Adjust how many variations to generate (1-5).</p>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aspect Ratio
            </label>
            <select
              value={settings.aspectRatio}
              onChange={(e) => onUpdateSettings({ ...settings, aspectRatio: e.target.value as any })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="1:1">1:1 (Square)</option>
              <option value="3:4">3:4 (Portrait)</option>
              <option value="4:3">4:3 (Landscape)</option>
              <option value="9:16">9:16 (Stories/Reels)</option>
              <option value="16:9">16:9 (Wide)</option>
            </select>
          </div>

          {/* Image Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Image Quality
            </label>
            <select
              value={settings.quality}
              onChange={(e) => onUpdateSettings({ ...settings, quality: e.target.value as any })}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="1K">Standard (1K)</option>
              <option value="2K">High (2K)</option>
              <option value="4K">Ultra (4K)</option>
            </select>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};