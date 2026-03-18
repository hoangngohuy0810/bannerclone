import React, { useState, useEffect } from 'react';
import { MultiImageUpload } from './components/MultiImageUpload';
import { Gallery } from './components/Gallery';
import { LogoSettingsPanel } from './components/LogoSettingsPanel';
import { generateBanner, generateDesign, editBanner } from './services/geminiService';
import { applyLogoToImage } from './utils/imageUtils';
import { GeneratedImage, GenerationState, STYLES, GenerationSettings, DEFAULT_SETTINGS, TYPOGRAPHY_STYLES, GenerationMode } from './types';

const App: React.FC = () => {
    const [referenceImages, setReferenceImages] = useState<string[]>([]);

    // Clone Mode Assets
    const [productImages, setProductImages] = useState<string[]>([]);

    // Design Mode Assets
    const [infoFiles, setInfoFiles] = useState<string[]>([]);

    // Input states
    const [brandDescription, setBrandDescription] = useState<string>('');
    const [promoInfo, setPromoInfo] = useState<string>('');
    const [prompt, setPrompt] = useState<string>('');

    const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);

    const [state, setState] = useState<GenerationState>({
        isGenerating: false,
        error: null,
        results: []
    });

    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

    // Password State
    const [passwordInput, setPasswordInput] = useState<string>('');

    // Check for authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const authStatus = localStorage.getItem('app_authenticated');
                if (authStatus === 'true') {
                    setIsAuthenticated(true);
                }
            } catch (e) {
                console.error("Error checking auth:", e);
            } finally {
                setIsCheckingAuth(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogin = () => {
        if (passwordInput === '160825') {
            localStorage.setItem('app_authenticated', 'true');
            setIsAuthenticated(true);
        } else {
            alert("Mật khẩu không đúng.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('app_authenticated');
        setIsAuthenticated(false);
        setPasswordInput('');
    };

    useEffect(() => {
        if (settings.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [settings.theme]);

    const toggleTheme = () => {
        setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
    };

    const handleModeChange = (mode: GenerationMode) => {
        setSettings(prev => ({ ...prev, mode: mode }));
    };

    const handleGenerate = async () => {
        // Validation based on mode
        if (referenceImages.length === 0) {
            setState(prev => ({ ...prev, error: 'Vui lòng tải lên ít nhất một mẫu thiết kế tham khảo.' }));
            return;
        }

        if (settings.mode === 'clone' && productImages.length === 0) {
            setState(prev => ({ ...prev, error: 'Chế độ Ghép sản phẩm yêu cầu tải lên ảnh sản phẩm.' }));
            return;
        }

        if (settings.mode === 'design' && infoFiles.length === 0) {
            setState(prev => ({ ...prev, error: 'Chế độ Thiết kế AI yêu cầu tải lên file thông tin (Ảnh hoặc PDF).' }));
            return;
        }

        setState({
            isGenerating: true,
            error: null,
            results: []
        });

        try {
            const tasks = [];
            for (let i = 0; i < settings.quantity; i++) {
                const style = STYLES[i % STYLES.length];
                tasks.push(async () => {
                    let resultBase64 = '';

                    if (settings.mode === 'clone') {
                        resultBase64 = await generateBanner(
                            referenceImages,
                            productImages,
                            brandDescription,
                            promoInfo,
                            prompt,
                            style,
                            settings,
                            undefined // Fallback to provided config API key
                        );
                    } else {
                        resultBase64 = await generateDesign(
                            referenceImages,
                            infoFiles,
                            brandDescription,
                            promoInfo,
                            prompt,
                            style,
                            settings,
                            undefined // Fallback to provided config API key
                        );
                    }

                    const rawBase64 = resultBase64;

                    // Apply logo if configured
                    if (settings.logo.image) {
                        resultBase64 = await applyLogoToImage(resultBase64, settings.logo);
                    }

                    const imgData: GeneratedImage = {
                        id: crypto.randomUUID(),
                        url: resultBase64,
                        rawUrl: rawBase64,
                        style: style,
                        aspectRatio: settings.aspectRatio
                    };
                    return imgData;
                });
            }

            const promises = tasks.map(async (task) => {
                try {
                    const img = await task();
                    setState(prev => ({
                        ...prev,
                        results: [...prev.results, img]
                    }));
                } catch (err: any) {
                    console.error("Generation failed for task", err);
                    if (err.message && (err.message.includes("Permission Denied") || err.message.includes("403") || err.message.includes("Requested entity was not found"))) {
                        // Do not reset key immediately for manual keys, maybe it was just a transient error, but alert user
                        throw new Error("Quyền truy cập bị từ chối. Vui lòng kiểm tra lại API Key hoặc chọn gói trả phí.");
                    }
                    throw err;
                }
            });

            await Promise.all(promises);

        } catch (error: any) {
            setState(prev => ({
                ...prev,
                error: error.message || 'Đã xảy ra lỗi không mong muốn trong quá trình tạo.'
            }));
        } finally {
            setState(prev => ({ ...prev, isGenerating: false }));
        }
    };

    // Re-apply logo when logo settings change
    useEffect(() => {
        const reapplyLogos = async () => {
            setState(prev => {
                if (prev.results.length === 0) return prev;

                // We can't do async inside setState directly, so we need to handle it outside
                return prev;
            });

            // To avoid infinite loops and stale state, we just use the current state.results
            // This might have a slight race condition if results change while applying,
            // but it's acceptable for this use case.
            if (state.results.length === 0) return;

            const updatedResults = await Promise.all(
                state.results.map(async (img) => {
                    if (!img.rawUrl) return img; // Safety check

                    let newUrl = img.rawUrl;
                    if (settings.logo.image) {
                        newUrl = await applyLogoToImage(img.rawUrl, settings.logo);
                    }

                    return { ...img, url: newUrl };
                })
            );

            setState(prev => {
                // Only update if the number of results hasn't changed (basic race condition check)
                if (prev.results.length !== updatedResults.length) return prev;

                // Merge the new URLs with any other state changes that might have happened
                const mergedResults = prev.results.map((prevImg, i) => ({
                    ...prevImg,
                    url: updatedResults[i].url
                }));

                return { ...prev, results: mergedResults };
            });
        };

        reapplyLogos();
    }, [settings.logo]);

    const handleRegenerate = async (id: string, editPrompt: string) => {
        // Find the image to regenerate
        const imageIndex = state.results.findIndex(img => img.id === id);
        if (imageIndex === -1) return;

        const currentImage = state.results[imageIndex];

        // Set regeneration state for this specific image
        setState(prev => {
            const newResults = [...prev.results];
            newResults[imageIndex] = { ...newResults[imageIndex], isRegenerating: true };
            return { ...prev, results: newResults };
        });

        try {
            let newBase64 = await editBanner(
                currentImage.rawUrl, // Use rawUrl for editing
                editPrompt,
                currentImage.aspectRatio,
                undefined // Fallback to provided config API key
            );

            const rawBase64 = newBase64;

            // Apply logo if configured
            if (settings.logo.image) {
                newBase64 = await applyLogoToImage(newBase64, settings.logo);
            }

            // Update with new image
            setState(prev => {
                const newResults = [...prev.results];
                newResults[imageIndex] = {
                    ...newResults[imageIndex],
                    url: newBase64,
                    rawUrl: rawBase64,
                    isRegenerating: false
                };
                return { ...prev, results: newResults };
            });

        } catch (error: any) {
            console.error("Regeneration failed", error);
            setState(prev => {
                const newResults = [...prev.results];
                newResults[imageIndex] = { ...newResults[imageIndex], isRegenerating: false };
                return {
                    ...prev,
                    results: newResults,
                    error: error.message || "Lỗi khi chỉnh sửa ảnh."
                };
            });
        }
    };

    // Loading Screen
    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Login Screen
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-lg w-full text-center space-y-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 mb-2">
                            BannerClone AI
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Hệ thống nội bộ. Vui lòng đăng nhập.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                            <label className="block text-left text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Mật khẩu truy cập
                            </label>
                            <input
                                type="password"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                placeholder="Nhập mật khẩu..."
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button
                                onClick={handleLogin}
                                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-95"
                            >
                                Đăng nhập
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0f1115] text-gray-900 dark:text-white transition-colors duration-300`}>

            {/* Left Column: Results/History Area */}
            <div className="flex-1 h-full overflow-hidden flex flex-col p-6 lg:p-8">
                <header className="mb-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-xl">B</span>
                        </div>
                        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500">
                            BannerClone AI
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 underline mr-2"
                        >
                            Đăng xuất
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                            title={settings.theme === 'dark' ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
                        >
                            {settings.theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                </svg>
                            )}
                        </button>
                    </div>
                </header>

                <Gallery
                    images={state.results}
                    isGenerating={state.isGenerating}
                    expectedCount={settings.quantity}
                    onRegenerate={handleRegenerate}
                />
            </div>

            {/* Right Column: Sidebar (Inputs & Settings) */}
            <div className="w-full lg:w-[420px] bg-white dark:bg-[#1a1d24] h-full overflow-y-auto border-l border-gray-200 dark:border-gray-800 shadow-2xl flex flex-col z-20 custom-scrollbar">

                {/* Mode Switcher Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800">
                    <button
                        onClick={() => handleModeChange('clone')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 
                    ${settings.mode === 'clone'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Ghép Sản Phẩm
                    </button>
                    <button
                        onClick={() => handleModeChange('design')}
                        className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 
                    ${settings.mode === 'design'
                                ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                    >
                        Thiết Kế AI
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Upload Section */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <span className="bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                </svg>
                            </span>
                            Tài nguyên
                        </h2>

                        {/* Always show Reference Images */}
                        <MultiImageUpload
                            label="Mẫu thiết kế (Reference)"
                            description="Tải lên mẫu banner bạn muốn học theo"
                            images={referenceImages}
                            onImagesChange={setReferenceImages}
                        />

                        {/* Conditional Upload based on Mode */}
                        {settings.mode === 'clone' ? (
                            <MultiImageUpload
                                label="Sản phẩm (Assets)"
                                description="Tải lên ảnh sản phẩm cần ghép"
                                images={productImages}
                                onImagesChange={setProductImages}
                            />
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg mb-2 text-xs text-purple-800 dark:text-purple-300 border border-purple-100 dark:border-purple-800">
                                    AI sẽ tự đọc thông tin từ file bạn tải lên (PDF, Ảnh chụp màn hình...) để tạo nội dung cho banner.
                                </div>
                                <MultiImageUpload
                                    label="File Thông Tin (Info Source)"
                                    description="Tải lên PDF hoặc Ảnh chứa thông tin (CTKM, Sự kiện...)"
                                    images={infoFiles}
                                    onImagesChange={setInfoFiles}
                                    accept="image/*,application/pdf"
                                />
                            </div>
                        )}
                    </div>

                    {/* Prompt Section */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-lg p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                            </span>
                            Thông tin & Yêu cầu
                        </h2>

                        <div>
                            <label htmlFor="brandDescription" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                                Mô tả thương hiệu
                            </label>
                            <textarea
                                id="brandDescription"
                                rows={2}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                placeholder="Ví dụ: Thương hiệu thời trang cao cấp, tối giản..."
                                value={brandDescription}
                                onChange={(e) => setBrandDescription(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="promoInfo" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                                Thông tin khuyến mãi (Tùy chọn)
                            </label>
                            <textarea
                                id="promoInfo"
                                rows={2}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                placeholder="Ví dụ: Giảm 50%, Mua 1 tặng 1, Freeship..."
                                value={promoInfo}
                                onChange={(e) => setPromoInfo(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="prompt" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">
                                Yêu cầu tùy chỉnh (Tùy chọn)
                            </label>
                            <textarea
                                id="prompt"
                                rows={3}
                                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl p-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                placeholder="Ví dụ: Đổi nền sang màu xanh biển, thêm chữ 'Giảm giá mùa hè'..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                            <span className="bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                                </svg>
                            </span>
                            Cấu hình
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Phong cách chữ (Typography)</label>
                                <select
                                    value={settings.typography}
                                    onChange={(e) => setSettings({ ...settings, typography: e.target.value as any })}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                >
                                    {TYPOGRAPHY_STYLES.map((typo) => (
                                        <option key={typo} value={typo}>{typo}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Tỷ lệ khung hình</label>
                                    <select
                                        value={settings.aspectRatio}
                                        onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                    >
                                        <option value="1:1">1:1 (Vuông)</option>
                                        <option value="3:4">3:4 (Dọc)</option>
                                        <option value="4:3">4:3 (Ngang)</option>
                                        <option value="9:16">9:16 (Story)</option>
                                        <option value="16:9">16:9 (Wide)</option>
                                        <option value="1:1.414">1:√2 (A4/In ấn)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Chất lượng</label>
                                    <select
                                        value={settings.quality}
                                        onChange={(e) => setSettings({ ...settings, quality: e.target.value as any })}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                                    >
                                        <option value="1K">Tiêu chuẩn (1K)</option>
                                        <option value="2K">Cao (2K)</option>
                                        <option value="4K">Siêu cao (4K)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                                <div className="flex justify-between mb-2">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400">Số lượng biến thể</label>
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{settings.quantity}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="5"
                                    step="1"
                                    value={settings.quantity}
                                    onChange={(e) => setSettings({ ...settings, quantity: parseInt(e.target.value) })}
                                    className="w-full h-1.5 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                <input
                                    type="checkbox"
                                    id="addWhiteSpace"
                                    checked={settings.addWhiteSpace || false}
                                    onChange={(e) => setSettings({ ...settings, addWhiteSpace: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                                />
                                <label htmlFor="addWhiteSpace" className="text-sm font-medium text-gray-900 dark:text-gray-300 cursor-pointer flex-1">
                                    Thêm viền trắng (An toàn in ấn)
                                </label>
                            </div>

                            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                                <LogoSettingsPanel
                                    settings={settings.logo}
                                    onChange={(logo) => setSettings({ ...settings, logo })}
                                    aspectRatio={settings.aspectRatio}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {state.error && (
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-300 text-xs">
                            {state.error}
                        </div>
                    )}
                </div>

                {/* Footer / Generate Action */}
                <div className="mt-auto p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1d24] sticky bottom-0 z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={
                            state.isGenerating ||
                            referenceImages.length === 0 ||
                            (settings.mode === 'clone' && productImages.length === 0) ||
                            (settings.mode === 'design' && infoFiles.length === 0)
                        }
                        className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-xl transition-all duration-300 flex items-center justify-center gap-3
                    ${state.isGenerating || referenceImages.length === 0 || (settings.mode === 'clone' && productImages.length === 0) || (settings.mode === 'design' && infoFiles.length === 0)
                                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                : settings.mode === 'clone'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white transform hover:scale-[1.02] hover:shadow-blue-500/25'
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transform hover:scale-[1.02] hover:shadow-purple-500/25'
                            }`}
                    >
                        {state.isGenerating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                {settings.mode === 'clone' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                                    </svg>
                                )}
                                {settings.mode === 'clone' ? 'Tạo thiết kế' : 'Thiết kế AI'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default App;