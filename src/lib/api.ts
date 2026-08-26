import { Gallery, Photo, UserSession, AccessStatsSummary } from '../types';

const TOKEN_KEY = 'cami_fotos_token';
const SESSION_KEY = 'cami_fotos_session';

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

export const api = {
  getStoredSession,
  setStoredSession,
  getToken,
  request,

  // Auth APIs
  async login(password: string): Promise<UserSession> {
    const res = await request<UserSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    setStoredSession(res, true);
    return res;
  },

  async verifySession(): Promise<{ valid: boolean; role: string; displayName: string }> {
    return request<{ valid: boolean; role: string; displayName: string }>('/api/auth/verify');
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
    const res = await fetch('/api/auth/info');
    return res.json();
  },

  // Gallery APIs
  async getGalleries(): Promise<Gallery[]> {
    return request<Gallery[]>('/api/galleries');
  },

  async getGallery(slug: string): Promise<Gallery> {
    return request<Gallery>(`/api/galleries/${encodeURIComponent(slug)}`);
  },

  async createGallery(data: { name: string; subtitle?: string; description?: string; year?: number }): Promise<Gallery> {
    return request<Gallery>('/api/galleries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateGallery(id: string, data: { name?: string; subtitle?: string; description?: string; year?: number }): Promise<Gallery> {
    return request<Gallery>(`/api/galleries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteGallery(id: string): Promise<{ success: boolean; deletedId: string }> {
    return request<{ success: boolean; deletedId: string }>(`/api/galleries/${id}`, {
      method: 'DELETE',
    });
  },

  // Photos APIs
  async addPhoto(galleryId: string, photoData: {
    title: string;
    caption?: string;
    url: string;
    captureDate?: string;
    isCover?: boolean;
  }): Promise<Photo> {
    return request<Photo>(`/api/galleries/${galleryId}/photos`, {
      method: 'POST',
      body: JSON.stringify(photoData),
    });
  },

  async deletePhoto(galleryId: string, photoId: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/galleries/${galleryId}/photos/${photoId}`, {
      method: 'DELETE',
    });
  },

  async setCoverPhoto(galleryId: string, photoId: string): Promise<Gallery> {
    return request<Gallery>(`/api/galleries/${galleryId}/photos/${photoId}/set-cover`, {
      method: 'POST',
    });
  },

  // Stats APIs
  async trackView(action: 'view_gallery' | 'view_photo', galleryName?: string, photoTitle?: string): Promise<void> {
    try {
      await request('/api/stats/track', {
        method: 'POST',
        body: JSON.stringify({ action, galleryName, photoTitle }),
      });
    } catch {
      // Non-blocking telemetry
    }
  },

  async getStatsSummary(): Promise<AccessStatsSummary> {
    return request<AccessStatsSummary>('/api/stats/summary');
  },

  async clearStatsLogs(): Promise<void> {
    await request<{ success: boolean }>('/api/stats/logs', {
      method: 'DELETE',
    });
  },
};
