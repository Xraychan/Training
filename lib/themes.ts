import { FormTheme } from './types';

export const FORM_THEMES: FormTheme[] = [
  {
    id: 'default',
    backgroundColor: '#E4E3E0',
    cardColor: '#FFFFFF',
    fontFamily: "'Inter', sans-serif",
    fontColor: '#141414',
    labelColor: '#141414',
    accentColor: '#F27D26',
    borderRadius: 0,
    inputBackground: '#FFFFFF',
    inputBorderColor: '#D1D0CD',
  },
  {
    id: 'professional',
    backgroundColor: '#EEF2F7',
    cardColor: '#FFFFFF',
    fontFamily: "'Georgia', serif",
    fontColor: '#1A2B4A',
    labelColor: '#2C3E6B',
    accentColor: '#2A6DD9',
    borderRadius: 8,
    inputBackground: '#F8FAFF',
    inputBorderColor: '#B8C8E8',
  },
  {
    id: 'dark',
    backgroundColor: '#0F1117',
    cardColor: '#1C1F26',
    fontFamily: "'Inter', sans-serif",
    fontColor: '#E8E8F0',
    labelColor: '#A0A8C0',
    accentColor: '#7C6EEB',
    borderRadius: 12,
    inputBackground: '#252934',
    inputBorderColor: '#383D50',
  },
  {
    id: 'paper',
    backgroundColor: '#F0EBE1',
    cardColor: '#FBF8F2',
    fontFamily: "'Georgia', serif",
    fontColor: '#3B2F2F',
    labelColor: '#5C4033',
    accentColor: '#A0522D',
    borderRadius: 4,
    inputBackground: '#FFF8EE',
    inputBorderColor: '#C9B49A',
  },
  {
    id: 'midnight',
    backgroundColor: '#0D1B2A',
    cardColor: '#1B2E42',
    fontFamily: "'Inter', sans-serif",
    fontColor: '#D4E8F8',
    labelColor: '#90BBD7',
    accentColor: '#F5A623',
    borderRadius: 10,
    inputBackground: '#142233',
    inputBorderColor: '#2A4A65',
  },
];

export const THEME_META: Record<string, { name: string; description: string }> = {
  default:      { name: 'Default',      description: 'Clean & minimal' },
  professional: { name: 'Professional', description: 'Formal blue & white' },
  dark:         { name: 'Dark',         description: 'Dark mode, purple accent' },
  paper:        { name: 'Paper',        description: 'Warm beige, earthy tones' },
  midnight:     { name: 'Midnight',     description: 'Deep navy, golden accent' },
};

export function getTheme(themeId?: string): FormTheme {
  return FORM_THEMES.find(t => t.id === themeId) ?? FORM_THEMES[0];
}
