import portadaDePortada from '../assets/images/DePortada.jpeg';
import portadaSunset from '../assets/images/portada_cami_sunset_1787786938649.jpg';

export const APP_COVER_STORAGE_KEY = 'cami_fotos_app_cover_photo_v1';

export interface PresetCover {
  id: string;
  name: string;
  url: string;
}

export const PRESET_COVERS: PresetCover[] = [
  {
    id: 'de-portada-local',
    name: 'Foto de Portada Oficial (DePortada.jpeg)',
    url: portadaDePortada,
  },
  {
    id: 'sunset-cami',
    name: 'Atardecer Dorado en el Muelle',
    url: portadaSunset,
  },
  {
    id: 'torres-paine',
    name: 'Torres del Paine (Paisaje)',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=2400&q=85',
  }
];

export function getStoredCoverPhoto(): string {
  try {
    const custom = localStorage.getItem(APP_COVER_STORAGE_KEY);
    if (custom && custom.trim().length > 0) {
      return custom;
    }
  } catch {}
  // Prefer DePortada if available, otherwise sunset
  return portadaDePortada || portadaSunset;
}

export function saveStoredCoverPhoto(url: string): void {
  try {
    localStorage.setItem(APP_COVER_STORAGE_KEY, url);
  } catch (e) {
    console.warn('Failed to save cover photo to localStorage', e);
  }
}

export function resetStoredCoverPhoto(): string {
  const defaultUrl = portadaDePortada || portadaSunset;
  try {
    localStorage.removeItem(APP_COVER_STORAGE_KEY);
  } catch {}
  return defaultUrl;
}
