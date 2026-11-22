import type {
  ThemeCustomization,
  ThemePalette,
  ThemeTypography,
  ThemeButtonStyle,
  ThemeCardStyle,
} from './websiteApi';

interface ThemeStylerPanelProps {
  theme: ThemeCustomization;
  onChange: (updatedTheme: ThemeCustomization) => void;
}

const PRESET_PALETTES: Array<{
  name: string;
  palette: ThemePalette;
  typography: ThemeTypography;
  buttonStyle: ThemeButtonStyle;
  cardStyle: ThemeCardStyle;
}> = [
  {
    name: 'Royal Heritage',
    palette: {
      primary: '#883A32',
      secondary: '#4C654D',
      background: '#FAF7F2',
      card: '#FFFFFF',
      text: '#1E1B18',
      accent: '#C29B38',
    },
    typography: {
      headingFont: 'Playfair Display, serif',
      bodyFont: 'Plus Jakarta Sans, sans-serif',
      headingScale: 'lg',
    },
    buttonStyle: { shape: 'pill', variant: 'filled' },
    cardStyle: { borderRadius: 'lg', elevation: 'ambient' },
  },
  {
    name: 'Modern Minimal',
    palette: {
      primary: '#1C1917',
      secondary: '#78716C',
      background: '#FAFAF9',
      card: '#FFFFFF',
      text: '#0C0A09',
      accent: '#2563EB',
    },
    typography: {
      headingFont: 'Inter, sans-serif',
      bodyFont: 'Inter, sans-serif',
      headingScale: 'md',
    },
    buttonStyle: { shape: 'square', variant: 'filled' },
    cardStyle: { borderRadius: 'sm', elevation: 'flat' },
  },
  {
    name: 'Floral Romance',
    palette: {
      primary: '#B76E79',
      secondary: '#7D8471',
      background: '#FFF9F9',
      card: '#FFFFFF',
      text: '#2C2223',
      accent: '#D4A373',
    },
    typography: {
      headingFont: 'Cormorant Garamond, serif',
      bodyFont: 'Plus Jakarta Sans, sans-serif',
      headingScale: 'xl',
    },
    buttonStyle: { shape: 'pill', variant: 'soft' },
    cardStyle: { borderRadius: 'xl', elevation: 'ambient' },
  },
  {
    name: 'Bohemian Sunset',
    palette: {
      primary: '#C86446',
      secondary: '#D4A373',
      background: '#FDF8F5',
      card: '#FFFFFF',
      text: '#2B1D0F',
      accent: '#E07A5F',
    },
    typography: {
      headingFont: 'Cinzel, serif',
      bodyFont: 'Lato, sans-serif',
      headingScale: 'lg',
    },
    buttonStyle: { shape: 'soft', variant: 'filled' },
    cardStyle: { borderRadius: 'md', elevation: 'raised' },
  },
  {
    name: 'Forest Emerald',
    palette: {
      primary: '#1B4332',
      secondary: '#40916C',
      background: '#F7FBF9',
      card: '#FFFFFF',
      text: '#081C15',
      accent: '#D8A47F',
    },
    typography: {
      headingFont: 'Playfair Display, serif',
      bodyFont: 'Inter, sans-serif',
      headingScale: 'lg',
    },
    buttonStyle: { shape: 'pill', variant: 'filled' },
    cardStyle: { borderRadius: 'lg', elevation: 'ambient' },
  },
];

const TYPOGRAPHY_PAIRINGS = [
  {
    label: 'Playfair Display + Plus Jakarta Sans',
    desc: 'Editorial elegance, warm and timeless',
    headingFont: 'Playfair Display, serif',
    bodyFont: 'Plus Jakarta Sans, sans-serif',
  },
  {
    label: 'Cormorant Garamond + Inter',
    desc: 'Regal poetic serif with crisp modern readability',
    headingFont: 'Cormorant Garamond, serif',
    bodyFont: 'Inter, sans-serif',
  },
  {
    label: 'Cinzel + Lato',
    desc: 'Classical monument engraving paired with warm sans',
    headingFont: 'Cinzel, serif',
    bodyFont: 'Lato, sans-serif',
  },
  {
    label: 'Modern Minimal Sans (Inter)',
    desc: 'Clean, Swiss architectural clarity',
    headingFont: 'Inter, sans-serif',
    bodyFont: 'Inter, sans-serif',
  },
];

export function ThemeStylerPanel({ theme, onChange }: ThemeStylerPanelProps) {
  const currentPalette = theme.palette;
  const currentTypography = theme.typography;
  const buttonStyle = theme.buttonStyle || { shape: 'pill', variant: 'filled' };
  const cardStyle = theme.cardStyle || { borderRadius: 'lg', elevation: 'ambient' };
  const pattern = theme.backgroundPattern || 'subtle-paper';

  const applyPreset = (preset: typeof PRESET_PALETTES[0]) => {
    onChange({
      palette: preset.palette,
      typography: preset.typography,
      buttonStyle: preset.buttonStyle,
      cardStyle: preset.cardStyle,
      backgroundPattern: pattern,
    });
  };

  const handleColorChange = (key: keyof ThemePalette, val: string) => {
    onChange({
      ...theme,
      palette: {
        ...currentPalette,
        [key]: val,
      },
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* 1. Presets */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Palette & Theme Presets
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PRESET_PALETTES.map((preset) => {
            const isSelected =
              currentPalette.primary.toLowerCase() === preset.palette.primary.toLowerCase() &&
              currentPalette.background.toLowerCase() === preset.palette.background.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`p-3 text-left rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-800 bg-amber-50/40 ring-2 ring-amber-700/20 shadow-sm'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-stone-900">{preset.name}</span>
                  {isSelected && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-800 text-white">
                      Active
                    </span>
                  )}
                </div>
                {/* Color swatches */}
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: preset.palette.primary }} />
                  <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: preset.palette.secondary }} />
                  <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: preset.palette.background }} />
                  <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: preset.palette.accent }} />
                  <div className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: preset.palette.text }} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Custom Color Pickers */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Custom Brand Colors
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Primary Brand</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.primary}
                onChange={(e) => handleColorChange('primary', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.primary}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Secondary / Muted</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.secondary}
                onChange={(e) => handleColorChange('secondary', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.secondary}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Background Canvas</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.background}
                onChange={(e) => handleColorChange('background', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.background}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Card Container</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.card}
                onChange={(e) => handleColorChange('card', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.card}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Body Text</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.text}
                onChange={(e) => handleColorChange('text', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.text}</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">Gold / Highlight Accent</label>
            <div className="flex items-center gap-2 p-1.5 bg-stone-50 border border-stone-200 rounded-lg">
              <input
                type="color"
                value={currentPalette.accent ?? '#C29B38'}
                onChange={(e) => handleColorChange('accent', e.target.value)}
                className="w-7 h-7 rounded border-0 cursor-pointer bg-transparent"
              />
              <span className="text-xs font-mono text-stone-600">{currentPalette.accent ?? '#C29B38'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Typography Pairings */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
          Typography Pairings
        </h3>
        <div className="space-y-2">
          {TYPOGRAPHY_PAIRINGS.map((typo) => {
            const isSelected = currentTypography.headingFont.includes(typo.headingFont.split(',')[0]);
            return (
              <button
                key={typo.label}
                type="button"
                onClick={() =>
                  onChange({
                    ...theme,
                    typography: {
                      ...currentTypography,
                      headingFont: typo.headingFont,
                      bodyFont: typo.bodyFont,
                    },
                  })
                }
                className={`w-full p-3 text-left rounded-xl border transition-all ${
                  isSelected
                    ? 'border-amber-800 bg-amber-50/40 ring-2 ring-amber-700/20'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-serif font-bold text-stone-900">{typo.label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{typo.desc}</div>
                  </div>
                  {isSelected && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-800"></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Button & Shape Styles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Button Corner Radius
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['pill', 'soft', 'square'] as const).map((shape) => (
              <button
                key={shape}
                type="button"
                onClick={() =>
                  onChange({
                    ...theme,
                    buttonStyle: { ...buttonStyle, shape },
                  })
                }
                className={`py-2 text-xs font-medium capitalize border transition-all ${
                  buttonStyle.shape === shape
                    ? 'border-amber-800 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                } ${shape === 'pill' ? 'rounded-full' : shape === 'soft' ? 'rounded-lg' : 'rounded-none'}`}
              >
                {shape}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Card Corners
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['none', 'sm', 'lg', 'xl'] as const).map((radius) => (
              <button
                key={radius}
                type="button"
                onClick={() =>
                  onChange({
                    ...theme,
                    cardStyle: { ...cardStyle, borderRadius: radius },
                  })
                }
                className={`py-2 text-xs font-medium capitalize rounded-md border transition-all ${
                  cardStyle.borderRadius === radius
                    ? 'border-amber-800 bg-amber-50 text-amber-900 font-semibold'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                }`}
              >
                {radius}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Background Pattern */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
          Subtle Background Canvas Texture
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'none', label: 'Solid Minimal' },
              { id: 'subtle-paper', label: 'Handmade Linen' },
              { id: 'floral-filigree', label: 'Floral Motif' },
              { id: 'royal-damask', label: 'Royal Filigree' },
            ] as const
          ).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                onChange({
                  ...theme,
                  backgroundPattern: p.id,
                })
              }
              className={`p-2.5 text-xs font-medium rounded-lg border text-center transition-all ${
                pattern === p.id
                  ? 'border-amber-800 bg-amber-50 text-amber-900 font-semibold'
                  : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
