import { Gallery, Photo, UserSession, AccessStatsSummary, AccessLog, UserRole } from '../types';
import { INITIAL_GALLERIES, INITIAL_LOGS } from '../data/initialData';
import { getStoredCoverPhoto, saveStoredCoverPhoto, resetStoredCoverPhoto } from './coverManager';

const TOKEN_KEY = 'cami_fotos_token';
const SESSION_KEY = 'cami_fotos_session';
const LOCAL_GALLERIES_KEY = 'cami_fotos_galleries_v2';
const LOCAL_LOGS_KEY = 'cami_fotos_logs_v2';

// Supported default and environment passwords
const VITE_FAMILY_PASS = (import.meta.env.VITE_FAMILY_PASSWORD || 'family2026').trim();
const VITE_ADMIN_PASS = (import.meta.env.VITE_ADMIN_PASSWORD || 'admin2026').trim();

const VALID_FAMILY_PASSWORDS = new Set([
  VITE_FAMILY_PASS,
  'family2026',
  'family_photo_2026',
  'family',
  'familia',
]);

const VALID_ADMIN_PASSWORDS = new Set([
  VITE_ADMIN_PASS,
  'admin2026',
  'admin_cami_secure',
  'admin',
]);

// Helper for local galleries persistence
function getLocalGalleries(): Gallery[] {
  try {
    const raw = localStorage.getItem(LOCAL_GALLERIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  // Initialize with default galleries
  const copy = JSON.parse(JSON.stringify(INITIAL_GALLERIES));
  try {
    localStorage.setItem(LOCAL_GALLERIES_KEY, JSON.stringify(copy));
  } catch {}
  return copy;
}

function saveLocalGalleries(galleries: Gallery[]) {
  try {
    localStorage.setItem(LOCAL_GALLERIES_KEY, JSON.stringify(galleries));
  } catch (err) {
    console.warn('Could not persist galleries to localStorage', err);
  }
}

// Helper for local logs persistence
function getLocalLogs(): AccessLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  const copy = JSON.parse(JSON.stringify(INITIAL_LOGS));
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(copy));
  } catch {}
  return copy;
}

function saveLocalLogs(logs: AccessLog[]) {
  try {
    localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(logs));
  } catch {}
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession | null, remember: boolean = true) {
  if (session) {
    const str = JSON.stringify(session);
    if (remember) {
      localStorage.setItem(SESSION_KEY, str);
      localStorage.setItem(TOKEN_KEY, session.token);
    } else {
      sessionStorage.setItem(SESSION_KEY, str);
      sessionStorage.setItem(TOKEN_KEY, session.token);
    }
  } else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

// Server API request with automatic client fallback detection
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Received HTML (likely 404 falling back to index.html on static Vercel)
    throw new Error('SERVER_UNAVAILABLE_OR_HTML');
  }

  if (res.status === 401) {
    setStoredSession(null);
    throw new Error('Sesión expirada o no autorizada. Por favor ingrese la contraseña nuevamente.');
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: 'Error en la solicitud' }));
    throw new Error(errorData.error || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// Client-side authentication processor
function authenticateClientSide(password: string): UserSession {
  const trimmed = password.trim();
  let role: UserRole | null = null;

  if (VALID_ADMIN_PASSWORDS.has(trimmed)) {
    role = 'admin';
  } else if (VALID_FAMILY_PASSWORDS.has(trimmed)) {
    role = 'family';
  }

  if (!role) {
    throw new Error('Contraseña incorrecta. Verifique la clave ingresada e intente nuevamente.');
  }

  const session: UserSession = {
    token: `cf_client_${role}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    role,
    displayName: role === 'admin' ? 'Administrador' : 'Familia & Amigos',
    loginTime: new Date().toISOString(),
  };

  // Log login in local logs
  const logs = getLocalLogs();
  logs.unshift({
    id: 'log-' + Date.now(),
    timestamp: new Date().toISOString(),
    role,
    action: 'login',
    details: role === 'admin' ? 'Inicio de sesión administrativo' : 'Inicio de sesión exitoso (Modo Familia)'
  });
  saveLocalLogs(logs.slice(0, 100));

  setStoredSession(session, true);
  return session;
}

export const api = {
  getStoredSession,
  setStoredSession,
  getToken,
  request,

  // Auth APIs
  async login(password: string): Promise<UserSession> {
    try {
      const res = await request<UserSession>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setStoredSession(res, true);
      return res;
    } catch (err: any) {
      // If server is not responding, returned 404/HTML (e.g. Vercel static), try client-side authentication
      if (err.message === 'SERVER_UNAVAILABLE_OR_HTML' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        return authenticateClientSide(password);
      }
      // If server responded with an actual password error message from the backend, also check client-side fallback just in case
      if (err.message?.includes('Contraseña incorrecta')) {
        try {
          return authenticateClientSide(password);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  },

  async verifySession(): Promise<{ valid: boolean; role: string; displayName: string }> {
    try {
      return await request<{ valid: boolean; role: string; displayName: string }>('/api/auth/verify');
    } catch {
      const session = getStoredSession();
      if (session && session.token) {
        return {
          valid: true,
          role: session.role,
          displayName: session.displayName
        };
      }
      return { valid: false, role: '', displayName: '' };
    }
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      setStoredSession(null);
    }
  },

  async getAuthHints(): Promise<{ familyHint: string; adminHint: string; usingEnvFamily: boolean; usingEnvAdmin: boolean }> {
    try {
      return await request('/api/auth/info');
    } catch {
      return {
        familyHint: 'family2026',
        adminHint: 'admin2026',
        usingEnvFamily: false,
        usingEnvAdmin: false
      };
    }
  },

  // Gallery APIs
  async getGalleries(): Promise<Gallery[]> {
    try {
      const data = await request<Gallery[]>('/api/galleries');
      // Save local backup
      saveLocalGalleries(data);
      return data;
    } catch {
      return getLocalGalleries();
    }
  },

  async getGallery(slug: string): Promise<Gallery> {
    try {
      return await request<Gallery>(`/api/galleries/${encodeURIComponent(slug)}`);
    } catch {
      const list = getLocalGalleries();
      const found = list.find(g => g.slug === slug || g.id === slug);
      if (!found) {
        throw new Error('Galería no encontrada');
      }
      return found;
    }
  },

  async createGallery(data: { name: string; subtitle?: string; description?: string; year?: number }): Promise<Gallery> {
    try {
      const res = await request<Gallery>('/api/galleries', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const local = getLocalGalleries();
      local.unshift(res);
      saveLocalGalleries(local);
      return res;
    } catch {
      const slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `galeria-${Date.now()}`;

      const newGal: Gallery = {
        id: `gal-${Date.now()}`,
        name: data.name.trim(),
        slug,
        subtitle: data.subtitle?.trim() || 'Nueva colección fotográfica',
        description: data.description?.trim() || '',
        year: data.year || new Date().getFullYear(),
        dateCreated: new Date().toISOString().split('T')[0],
        viewsCount: 0,
        photos: []
      };

      const list = getLocalGalleries();
      list.unshift(newGal);
      saveLocalGalleries(list);
      return newGal;
    }
  },

  async updateGallery(id: string, data: { name?: string; subtitle?: string; description?: string; year?: number }): Promise<Gallery> {
    try {
      const res = await request<Gallery>(`/api/galleries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const list = getLocalGalleries().map(g => g.id === id ? res : g);
      saveLocalGalleries(list);
      return res;
    } catch {
      const list = getLocalGalleries();
      const idx = list.findIndex(g => g.id === id);
      if (idx === -1) throw new Error('Galería no encontrada');

      const existing = list[idx];
      let slug = existing.slug;
      if (data.name && data.name !== existing.name) {
        slug = data.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');
      }

      const updated: Gallery = {
        ...existing,
        name: data.name ?? existing.name,
        slug,
        subtitle: data.subtitle ?? existing.subtitle,
        description: data.description ?? existing.description,
        year: data.year ?? existing.year,
      };

      list[idx] = updated;
      saveLocalGalleries(list);
      return updated;
    }
  },

  async deleteGallery(id: string): Promise<{ success: boolean; deletedId: string }> {
    try {
      const res = await request<{ success: boolean; deletedId: string }>(`/api/galleries/${id}`, {
        method: 'DELETE',
      });
      const list = getLocalGalleries().filter(g => g.id !== id);
      saveLocalGalleries(list);
      return res;
    } catch {
      const list = getLocalGalleries().filter(g => g.id !== id);
      saveLocalGalleries(list);
      return { success: true, deletedId: id };
    }
  },

  // Photos APIs
  async addPhoto(galleryId: string, photoData: {
    title: string;
    caption?: string;
    url: string;
    captureDate?: string;
    isCover?: boolean;
  }): Promise<Photo> {
    try {
      const res = await request<Photo>(`/api/galleries/${galleryId}/photos`, {
        method: 'POST',
        body: JSON.stringify(photoData),
      });
      const list = getLocalGalleries();
      const g = list.find(gal => gal.id === galleryId);
      if (g) {
        if (res.isCover) {
          g.photos.forEach(p => { p.isCover = false; });
        }
        g.photos.unshift(res);
        saveLocalGalleries(list);
      }
      return res;
    } catch {
      const list = getLocalGalleries();
      const g = list.find(gal => gal.id === galleryId);
      if (!g) throw new Error('Galería no encontrada');

      const isFirst = g.photos.length === 0;
      const willBeCover = photoData.isCover !== undefined ? photoData.isCover : isFirst;

      if (willBeCover) {
        g.photos.forEach(p => { p.isCover = false; });
      }

      const newPhoto: Photo = {
        id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        filename: `${photoData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`,
        title: photoData.title.trim(),
        caption: photoData.caption?.trim() || '',
        url: photoData.url,
        thumbnailUrl: photoData.url,
        width: 2400,
        height: 1600,
        aspectRatio: 1.5,
        dateAdded: new Date().toISOString().split('T')[0],
        captureDate: photoData.captureDate || new Date().toISOString().split('T')[0],
        isCover: willBeCover,
        viewsCount: 0
      };

      g.photos.unshift(newPhoto);
      saveLocalGalleries(list);
      return newPhoto;
    }
  },

  async deletePhoto(galleryId: string, photoId: string): Promise<{ success: boolean }> {
    try {
      const res = await request<{ success: boolean }>(`/api/galleries/${galleryId}/photos/${photoId}`, {
        method: 'DELETE',
      });
      const list = getLocalGalleries();
      const g = list.find(gal => gal.id === galleryId);
      if (g) {
        g.photos = g.photos.filter(p => p.id !== photoId);
        if (g.photos.length > 0 && !g.photos.some(p => p.isCover)) {
          g.photos[0].isCover = true;
        }
        saveLocalGalleries(list);
      }
      return res;
    } catch {
      const list = getLocalGalleries();
      const g = list.find(gal => gal.id === galleryId);
      if (!g) throw new Error('Galería no encontrada');

      g.photos = g.photos.filter(p => p.id !== photoId);
      if (g.photos.length > 0 && !g.photos.some(p => p.isCover)) {
        g.photos[0].isCover = true;
      }
      saveLocalGalleries(list);
      return { success: true };
    }
  },

  async setCoverPhoto(galleryId: string, photoId: string): Promise<Gallery> {
    try {
      const res = await request<Gallery>(`/api/galleries/${galleryId}/photos/${photoId}/set-cover`, {
        method: 'POST',
      });
      const list = getLocalGalleries().map(g => g.id === galleryId ? res : g);
      saveLocalGalleries(list);
      return res;
    } catch {
      const list = getLocalGalleries();
      const g = list.find(gal => gal.id === galleryId);
      if (!g) throw new Error('Galería no encontrada');

      const p = g.photos.find(photo => photo.id === photoId);
      if (!p) throw new Error('Foto no encontrada');

      g.photos.forEach(photo => {
        photo.isCover = photo.id === photoId;
      });

      saveLocalGalleries(list);
      return g;
    }
  },

  // Stats APIs
  async trackView(action: 'view_gallery' | 'view_photo', galleryName?: string, photoTitle?: string): Promise<void> {
    try {
      await request('/api/stats/track', {
        method: 'POST',
        body: JSON.stringify({ action, galleryName, photoTitle }),
      });
    } catch {
      // Client-side tracking fallback
      const session = getStoredSession();
      const role = session?.role || 'family';
      const logs = getLocalLogs();
      logs.unshift({
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString(),
        role,
        action,
        galleryName,
        photoTitle,
        details: action === 'view_gallery' 
          ? `Acceso a la galería "${galleryName || 'Desconocida'}"`
          : `Visualización de "${photoTitle || 'Foto'}"`
      });
      saveLocalLogs(logs.slice(0, 100));

      // Update count on gallery / photo
      const list = getLocalGalleries();
      if (galleryName) {
        const g = list.find(gal => gal.name === galleryName);
        if (g) {
          if (action === 'view_gallery') g.viewsCount = (g.viewsCount || 0) + 1;
          if (action === 'view_photo' && photoTitle) {
            const p = g.photos.find(pho => pho.title === photoTitle);
            if (p) p.viewsCount = (p.viewsCount || 0) + 1;
          }
          saveLocalGalleries(list);
        }
      }
    }
  },

  async getStatsSummary(): Promise<AccessStatsSummary> {
    try {
      return await request<AccessStatsSummary>('/api/stats/summary');
    } catch {
      const logs = getLocalLogs();
      const galleries = getLocalGalleries();

      const totalLogins = logs.filter(l => l.action === 'login').length;
      const familyLogins = logs.filter(l => l.action === 'login' && l.role === 'family').length;
      const adminLogins = logs.filter(l => l.action === 'login' && l.role === 'admin').length;
      const totalGalleryViews = logs.filter(l => l.action === 'view_gallery').length;
      const totalPhotoViews = logs.filter(l => l.action === 'view_photo').length;

      // Gallery popularity
      const galCounts: Record<string, number> = {};
      galleries.forEach(g => {
        galCounts[g.name] = g.viewsCount || 0;
      });
      const galleryPopularity = Object.entries(galCounts)
        .map(([galleryName, count]) => ({ galleryName, count }))
        .sort((a, b) => b.count - a.count);

      // Photo popularity
      const photoList: { photoTitle: string; galleryName: string; count: number }[] = [];
      galleries.forEach(g => {
        g.photos.forEach(p => {
          if (p.viewsCount) {
            photoList.push({
              photoTitle: p.title,
              galleryName: g.name,
              count: p.viewsCount
            });
          }
        });
      });
      const photoPopularity = photoList.sort((a, b) => b.count - a.count).slice(0, 10);

      const summary: AccessStatsSummary = {
        totalLogins,
        familyLogins,
        adminLogins,
        totalGalleryViews,
        totalPhotoViews,
        recentLogs: logs.slice(0, 25),
        galleryPopularity,
        photoPopularity
      };

      return summary;
    }
  },

  async clearStatsLogs(): Promise<void> {
    try {
      await request<{ success: boolean }>('/api/stats/logs', {
        method: 'DELETE',
      });
    } catch {}
    saveLocalLogs([]);
  },

  // App Cover Photo APIs
  async getAppCoverPhoto(): Promise<string> {
    try {
      const res = await request<{ coverPhoto: string | null }>('/api/cover-photo');
      if (res && res.coverPhoto) {
        saveStoredCoverPhoto(res.coverPhoto);
        return res.coverPhoto;
      }
    } catch {}
    return getStoredCoverPhoto();
  },

  async setAppCoverPhoto(url: string): Promise<string> {
    saveStoredCoverPhoto(url);
    try {
      await request<{ success: boolean; coverPhoto: string }>('/api/cover-photo', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });
    } catch (e) {
      console.warn('Server cover photo update failed, using local storage fallback', e);
    }
    return url;
  },

  async resetAppCoverPhoto(): Promise<string> {
    const defaultUrl = resetStoredCoverPhoto();
    try {
      await request<{ success: boolean; coverPhoto: string }>('/api/cover-photo', {
        method: 'POST',
        body: JSON.stringify({ url: defaultUrl }),
      });
    } catch {}
    return defaultUrl;
  },
};
