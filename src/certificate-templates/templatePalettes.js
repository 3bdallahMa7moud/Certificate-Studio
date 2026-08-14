const PALETTE_KEYS = Object.freeze([
  'primary',
  'surface',
  'text',
  'muted',
  'onPrimary',
  'accentDecor',
  'accentInk',
]);

function definePalette(palette) {
  const normalized = Object.fromEntries(
    PALETTE_KEYS.map(key => [key, palette[key]]),
  );
  return Object.freeze(normalized);
}

export const TEMPLATE_PALETTES = Object.freeze({
  editorial: definePalette({
    primary: '#142033',
    surface: '#FBF8F1',
    text: '#182235',
    muted: '#5D6675',
    onPrimary: '#FFFFFF',
    accentDecor: '#C9A35F',
    accentInk: '#735719',
  }),
  geometric: definePalette({
    primary: '#23412D',
    surface: '#F5F5EC',
    text: '#18271C',
    muted: '#5D6A60',
    onPrimary: '#FFFFFF',
    accentDecor: '#B87333',
    accentInk: '#7A431A',
  }),
  minimal: definePalette({
    primary: '#5B1A2A',
    surface: '#FFF9F7',
    text: '#2D1720',
    muted: '#6E5B62',
    onPrimary: '#FFFFFF',
    accentDecor: '#D4A574',
    accentInk: '#80502B',
  }),
  'rainbow-stars': definePalette({
    primary: '#5A4EB5',
    surface: '#FFFDF8',
    text: '#282247',
    muted: '#68617C',
    onPrimary: '#FFFFFF',
    accentDecor: '#FF806D',
    accentInk: '#7A4C08',
  }),
  'jungle-friends': definePalette({
    primary: '#1F6444',
    surface: '#FFFBEF',
    text: '#173829',
    muted: '#567062',
    onPrimary: '#FFFFFF',
    accentDecor: '#F2C94C',
    accentInk: '#715A00',
  }),
  'space-explorer': definePalette({
    primary: '#152B59',
    surface: '#F7FAFF',
    text: '#101A36',
    muted: '#53617E',
    onPrimary: '#FFFFFF',
    accentDecor: '#F4B942',
    accentInk: '#76550A',
  }),
  'ocean-adventure': definePalette({
    primary: '#066B75',
    surface: '#F4FCFD',
    text: '#083D43',
    muted: '#507176',
    onPrimary: '#FFFFFF',
    accentDecor: '#FF7F6E',
    accentInk: '#96372D',
  }),
  'storybook-castle': definePalette({
    primary: '#5B3F8C',
    surface: '#FFF9F1',
    text: '#322348',
    muted: '#6B5F78',
    onPrimary: '#FFFFFF',
    accentDecor: '#D9A441',
    accentInk: '#76510A',
  }),
  'sports-champion': definePalette({
    primary: '#B5430A',
    surface: '#FFFBF5',
    text: '#2D2A26',
    muted: '#6E6259',
    onPrimary: '#FFFFFF',
    accentDecor: '#F0A12C',
    accentInk: '#7E4B06',
  }),
  'islamic-heritage': definePalette({
    primary: '#174B38',
    surface: '#FAF8F2',
    text: '#203329',
    muted: '#5F6D65',
    onPrimary: '#FFFFFF',
    accentDecor: '#C5874D',
    accentInk: '#75441F',
  }),
  'graduation-honor': definePalette({
    primary: '#0F1B2D',
    surface: '#FAFAF8',
    text: '#162033',
    muted: '#5E6673',
    onPrimary: '#FFFFFF',
    accentDecor: '#C9A35F',
    accentInk: '#705415',
  }),
  'creative-arts': definePalette({
    primary: '#66317B',
    surface: '#FFFDF9',
    text: '#32203A',
    muted: '#6C5C70',
    onPrimary: '#FFFFFF',
    accentDecor: '#18AFA0',
    accentInk: '#7E2A49',
  }),
});

export function getTemplatePalette(templateId) {
  return TEMPLATE_PALETTES[templateId] || TEMPLATE_PALETTES.editorial;
}

export { PALETTE_KEYS };
