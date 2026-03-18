
export interface GeneratedImage {
  id: string;
  url: string; // Final image with logo
  rawUrl: string; // Original image without logo
  style: string;
  aspectRatio: string; // Store the aspect ratio used to generate this image
  isRegenerating?: boolean; // Loading state for specific image
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  results: GeneratedImage[];
}

export type DesignStyle = 'Sao chép chính xác' | 'Hiện đại & Tối giản' | 'Nổi bật & Sống động' | 'Sang trọng & Thanh lịch' | 'Sáng tạo phá cách';

export const STYLES: DesignStyle[] = [
  'Sao chép chính xác',
  'Hiện đại & Tối giản',
  'Nổi bật & Sống động',
  'Sang trọng & Thanh lịch',
  'Sáng tạo phá cách'
];

export type TypographyStyle =
  | 'Tự động'
  | 'Làm đẹp, thời trang, mềm mại'
  | 'Cách điệu, dễ thương'
  | 'Tươi trẻ, màu sắc'
  | 'Chuyên nghiệp, hiện đại'
  | 'Hoài cổ (Retro/Vintage)'
  | 'Mạnh mẽ, nổi bật';

export const TYPOGRAPHY_STYLES: TypographyStyle[] = [
  'Tự động',
  'Làm đẹp, thời trang, mềm mại',
  'Cách điệu, dễ thương',
  'Tươi trẻ, màu sắc',
  'Chuyên nghiệp, hiện đại',
  'Hoài cổ (Retro/Vintage)',
  'Mạnh mẽ, nổi bật'
];

export type GenerationMode = 'clone' | 'design';

export interface LogoSettings {
  image: string | null;
  addWhiteBorder: boolean;
  positionX: number; // 0 to 100 (%)
  positionY: number; // 0 to 100 (%)
  size: number; // 0 to 100 (%)
}

export interface GenerationSettings {
  theme: 'dark' | 'light';
  quantity: number;
  aspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '1:1.414';
  quality: '1K' | '2K' | '4K';
  typography: TypographyStyle;
  mode: GenerationMode;
  logo: LogoSettings;
  addWhiteSpace: boolean;
}

export const DEFAULT_SETTINGS: GenerationSettings = {
  theme: 'dark',
  quantity: 4,
  aspectRatio: '3:4',
  quality: '1K',
  typography: 'Tự động',
  mode: 'clone',
  logo: {
    image: null,
    addWhiteBorder: false,
    positionX: 5,
    positionY: 5,
    size: 20
  },
  addWhiteSpace: false
};