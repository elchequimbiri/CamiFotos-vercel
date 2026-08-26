import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { Gallery, Photo, AccessLog, UserRole, AccessStatsSummary } from './src/types';
import { INITIAL_GALLERIES, INITIAL_LOGS } from './src/data/initialData';

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Passwords from environment or supported defaults
const FAMILY_PASS = (process.env.FAMILY_PASSWORD || 'family2026').trim();
const ADMIN_PASS = (process.env.ADMIN_PASSWORD || 'admin2026').trim();

// Fallback accepted passwords list for smooth developer / preview experience
const VALID_FAMILY_PASSWORDS = new Set([
  FAMILY_PASS,
  'family2026',
  'family_photo_2026',
  'family',
  'familia'
]);

const VALID_ADMIN_PASSWORDS = new Set([
  ADMIN_PASS,
  'admin2026',
  'admin_cami_secure',
  'admin'
]);

// Secret for signing session tokens
const SESSION_SECRET = process.env.SESSION_SECRET || 'cami_fotos_secure_signing_secret_key_2026';

// In-memory data store with fallback persistence in memory
let galleries: Gallery[] = JSON.parse(JSON.stringify(INITIAL_GALLERIES));
let accessLogs: AccessLog[] = JSON.parse(JSON.stringify(INITIAL_LOGS));

// Active sessions mapping: token -> { role, createdAt, lastActive }
const activeSessions = new Map<string, { role: UserRole; createdAt: string; lastActive: string }>();

// Helper to generate signed cryptographically secure tokens
function generateSignedToken(role: UserRole): string {
  const payload = {
    role,
    t: Date.now(),
    nonce: crypto.randomBytes(8).toString('hex')
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `cf_${encoded}.${hmac}`;
}

// Helper to verify signed token (valid for 30 days)
function verifySignedToken(token: string): { role: UserRole; createdAt: string } | null {
  if (!token || !token.startsWith('cf_')) return null;
  const raw = token.slice(3);
  const parts = raw.split('.');
  if (parts.length !== 2) return null;
  const [encoded, hmac] = parts;
  const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  if (hmac !== expectedHmac) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    // Expire after 30 days
    if (!payload.t || Date.now() - payload.t > 30 * 24 * 60 * 60 * 1000) {
      return null;
    }
    if (payload.role !== 'admin' && payload.role !== 'family') {
      return null;
    }
    return {
      role: payload.role,
      createdAt: new Date(payload.t).toISOString()
    };
  } catch {
    return null;
  }
}

// Log an action
function recordLog(role: UserRole, action: AccessLog['action'], galleryName?: string, photoTitle?: string, details?: string, userAgent?: string) {
  const log: AccessLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    role,
    action,
    galleryName,
    photoTitle,
    details,
    userAgent
  };
  accessLogs.unshift(log);
  // Keep up to 200 logs
  if (accessLogs.length > 200) {
    accessLogs = accessLogs.slice(0, 200);
  }
}

// Authentication middleware
interface AuthRequest extends Request {
  userRole?: UserRole;
  userToken?: string;
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : (req.query.token as string);

  if (!token) {
    return res.status(401).json({ 
      error: 'Sesión no válida o expirada. Se requiere autenticación para acceder a las fotografías.' 
    });
  }

  // Check in-memory session or verify signed token
  let session = activeSessions.get(token);
  if (!session) {
    const verified = verifySignedToken(token);
    if (verified) {
      session = {
        role: verified.role,
        createdAt: verified.createdAt,
        lastActive: new Date().toISOString()
      };
      activeSessions.set(token, session);
    }
  }

  if (!session) {
    return res.status(401).json({ 
      error: 'Sesión no válida o expirada. Se requiere autenticación para acceder a las fotografías.' 
    });
  }

  session.lastActive = new Date().toISOString();
  req.userRole = session.role;
  req.userToken = token;
  next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administración.' });
    }
    next();
  });
}

// Ensure cover photo is picked according to "provided the image filename begins with 00" rule
function enrichGalleryCover(gal: Gallery): Gallery {
  const copy = { ...gal };
  // Check if there is a photo with filename beginning with 00
  const zeroZeroPhoto = copy.photos.find(p => p.filename.startsWith('00') || p.isCover);
  if (zeroZeroPhoto) {
    copy.coverImage = zeroZeroPhoto.thumbnailUrl || zeroZeroPhoto.url;
  } else if (copy.photos.length > 0) {
    copy.coverImage = copy.photos[0].thumbnailUrl || copy.photos[0].url;
  }
  return copy;
}

// ==================== AUTHENTICATION API ====================

// Login endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const trimmed = typeof password === 'string' ? password.trim() : '';

  if (!trimmed) {
    return res.status(400).json({ error: 'Por favor, ingrese una contraseña.' });
  }

  let role: UserRole | null = null;
  if (VALID_ADMIN_PASSWORDS.has(trimmed)) {
    role = 'admin';
  } else if (VALID_FAMILY_PASSWORDS.has(trimmed)) {
    role = 'family';
  }

  if (!role) {
    return res.status(401).json({ 
      error: 'Contraseña incorrecta. Verifique la clave de Familia o Administración.' 
    });
  }

  const token = generateSignedToken(role);
  const loginTime = new Date().toISOString();
  activeSessions.set(token, {
    role,
    createdAt: loginTime,
    lastActive: loginTime
  });

  recordLog(
    role, 
    'login', 
    undefined, 
    undefined, 
    `Inicio de sesión (${role === 'admin' ? 'Administrador' : 'Modo Familia'})`, 
    req.headers['user-agent']
  );

  return res.json({
    token,
    role,
    displayName: role === 'admin' ? 'Administrador' : 'Familia & Amigos',
    loginTime
  });
});

// Verify current session
app.get('/api/auth/verify', requireAuth, (req: AuthRequest, res: Response) => {
  const session = activeSessions.get(req.userToken!)!;
  return res.json({
    valid: true,
    role: session.role,
    displayName: session.role === 'admin' ? 'Administrador' : 'Familia & Amigos',
    loginTime: session.createdAt
  });
});

// Logout
app.post('/api/auth/logout', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.userToken) {
    activeSessions.delete(req.userToken);
  }
  return res.json({ success: true });
});

// Password hint/info for demo purpose
app.get('/api/auth/info', (req: Request, res: Response) => {
  res.json({
    familyHint: FAMILY_PASS,
    adminHint: ADMIN_PASS,
    usingEnvFamily: Boolean(process.env.FAMILY_PASSWORD),
    usingEnvAdmin: Boolean(process.env.ADMIN_PASSWORD)
  });
});

// ==================== APP COVER PHOTO API ====================
let appCoverPhotoUrl: string | null = null;

// Get current App Cover Photo (Public)
app.get('/api/cover-photo', (req: Request, res: Response) => {
  res.json({ coverPhoto: appCoverPhotoUrl });
});

// Update App Cover Photo (Admin only)
app.post('/api/cover-photo', requireAdmin, (req: AuthRequest, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Se requiere una URL o imagen válida para la portada.' });
  }
  appCoverPhotoUrl = url;
  recordLog('admin', 'admin_action', undefined, undefined, 'Foto de portada de inicio actualizada');
  res.json({ success: true, coverPhoto: appCoverPhotoUrl });
});

// ==================== GALLERIES API (Protected) ====================

// List all galleries
app.get('/api/galleries', requireAuth, (req: AuthRequest, res: Response) => {
  const enriched = galleries.map(enrichGalleryCover);
  res.json(enriched);
});

// Get specific gallery by slug or id
app.get('/api/galleries/:slug', requireAuth, (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const gallery = galleries.find(g => g.slug === slug || g.id === slug);

  if (!gallery) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  // Increment view count
  gallery.viewsCount = (gallery.viewsCount || 0) + 1;

  res.json(enrichGalleryCover(gallery));
});

// Create gallery (Admin only)
app.post('/api/galleries', requireAdmin, (req: AuthRequest, res: Response) => {
  const { name, subtitle, description, year } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'El nombre de la galería es obligatorio.' });
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const newGallery: Gallery = {
    id: 'gal-' + Date.now(),
    name: name.trim(),
    slug: slug || 'galeria-' + Date.now(),
    subtitle: subtitle?.trim() || '',
    description: description?.trim() || '',
    year: Number(year) || new Date().getFullYear(),
    dateCreated: new Date().toISOString().split('T')[0],
    viewsCount: 0,
    photos: []
  };

  galleries.unshift(newGallery);

  recordLog('admin', 'admin_action', newGallery.name, undefined, `Nueva galería creada: "${newGallery.name}"`);

  res.status(201).json(newGallery);
});

// Update gallery (Admin only)
app.put('/api/galleries/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, subtitle, description, year } = req.body;

  const gallery = galleries.find(g => g.id === id);
  if (!gallery) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  if (name) gallery.name = name.trim();
  if (subtitle !== undefined) gallery.subtitle = subtitle.trim();
  if (description !== undefined) gallery.description = description.trim();
  if (year) gallery.year = Number(year);

  recordLog('admin', 'admin_action', gallery.name, undefined, `Galería modificada: "${gallery.name}"`);

  res.json(enrichGalleryCover(gallery));
});

// Delete gallery (Admin only)
app.delete('/api/galleries/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const index = galleries.findIndex(g => g.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  const deleted = galleries.splice(index, 1)[0];
  recordLog('admin', 'admin_action', deleted.name, undefined, `Galería eliminada: "${deleted.name}"`);

  res.json({ success: true, deletedId: id });
});

// ==================== PHOTOS API (Protected) ====================

// Add photo to gallery (Admin only)
app.post('/api/galleries/:id/photos', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, caption, url, captureDate, isCover } = req.body;

  const gallery = galleries.find(g => g.id === id);
  if (!gallery) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  if (!url || !url.trim()) {
    return res.status(400).json({ error: 'La URL o imagen es obligatoria.' });
  }

  const photoCount = gallery.photos.length;
  // If isCover is chosen or this is the first photo and marked cover, name it 00_
  const prefix = isCover ? '00_' : String(photoCount + 1).padStart(2, '0') + '_';
  const cleanTitle = (title || 'Fotografía ' + (photoCount + 1)).trim();
  const fileSlug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const filename = `${prefix}${fileSlug}.jpg`;

  // If this photo is set as cover, unmark others and adjust filenames
  if (isCover) {
    gallery.photos.forEach(p => {
      p.isCover = false;
      if (p.filename.startsWith('00_')) {
        p.filename = p.filename.replace(/^00_/, '01_');
      }
    });
  }

  const newPhoto: Photo = {
    id: 'pho-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
    filename,
    title: cleanTitle,
    caption: caption?.trim() || '',
    url: url.trim(),
    thumbnailUrl: url.trim(),
    dateAdded: new Date().toISOString().split('T')[0],
    captureDate: captureDate || new Date().toISOString().split('T')[0],
    isCover: Boolean(isCover),
    viewsCount: 0
  };

  if (isCover) {
    gallery.photos.unshift(newPhoto);
  } else {
    gallery.photos.push(newPhoto);
  }

  recordLog('admin', 'admin_action', gallery.name, newPhoto.title, `Foto añadida: "${newPhoto.title}" (${filename})`);

  res.status(201).json(newPhoto);
});

// Set photo as cover (Admin only)
app.post('/api/galleries/:id/photos/:photoId/set-cover', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id, photoId } = req.params;
  const gallery = galleries.find(g => g.id === id);

  if (!gallery) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  const photo = gallery.photos.find(p => p.id === photoId);
  if (!photo) {
    return res.status(404).json({ error: 'Fotografía no encontrada.' });
  }

  // Update filenames and flags
  gallery.photos.forEach(p => {
    if (p.id === photoId) {
      p.isCover = true;
      if (!p.filename.startsWith('00_')) {
        p.filename = '00_' + p.filename.replace(/^\d+_/, '');
      }
    } else {
      p.isCover = false;
      if (p.filename.startsWith('00_')) {
        p.filename = '01_' + p.filename.substring(3);
      }
    }
  });

  // Put cover photo at beginning of array
  const index = gallery.photos.findIndex(p => p.id === photoId);
  if (index > 0) {
    const [target] = gallery.photos.splice(index, 1);
    gallery.photos.unshift(target);
  }

  recordLog('admin', 'admin_action', gallery.name, photo.title, `Foto designada como portada: "${photo.title}"`);

  res.json(enrichGalleryCover(gallery));
});

// Delete photo (Admin only)
app.delete('/api/galleries/:id/photos/:photoId', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id, photoId } = req.params;
  const gallery = galleries.find(g => g.id === id);

  if (!gallery) {
    return res.status(404).json({ error: 'Galería no encontrada.' });
  }

  const pIndex = gallery.photos.findIndex(p => p.id === photoId);
  if (pIndex === -1) {
    return res.status(404).json({ error: 'Fotografía no encontrada.' });
  }

  const deletedPhoto = gallery.photos.splice(pIndex, 1)[0];
  recordLog('admin', 'admin_action', gallery.name, deletedPhoto.title, `Foto eliminada: "${deletedPhoto.title}"`);

  res.json({ success: true, deletedId: photoId });
});

// ==================== STATS & VIEW TRACKING ====================

// Track viewing a gallery or specific photo
app.post('/api/stats/track', requireAuth, (req: AuthRequest, res: Response) => {
  const { action, galleryName, photoTitle } = req.body;
  const role = req.userRole || 'family';

  if (action === 'view_gallery' && galleryName) {
    const gal = galleries.find(g => g.name === galleryName);
    if (gal) gal.viewsCount = (gal.viewsCount || 0) + 1;
    recordLog(role, 'view_gallery', galleryName, undefined, 'Apertura de galería');
  } else if (action === 'view_photo' && photoTitle) {
    if (galleryName) {
      const gal = galleries.find(g => g.name === galleryName);
      if (gal) {
        const photo = gal.photos.find(p => p.title === photoTitle);
        if (photo) photo.viewsCount = (photo.viewsCount || 0) + 1;
      }
    }
    recordLog(role, 'view_photo', galleryName, photoTitle, 'Visualización en pantalla completa');
  }

  res.json({ success: true });
});

// Get access stats summary (Admin only or authorized view)
app.get('/api/stats/summary', requireAuth, (req: AuthRequest, res: Response) => {
  const totalLogins = accessLogs.filter(l => l.action === 'login').length;
  const familyLogins = accessLogs.filter(l => l.action === 'login' && l.role === 'family').length;
  const adminLogins = accessLogs.filter(l => l.action === 'login' && l.role === 'admin').length;
  const totalGalleryViews = accessLogs.filter(l => l.action === 'view_gallery').length;
  const totalPhotoViews = accessLogs.filter(l => l.action === 'view_photo').length;

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
    recentLogs: accessLogs.slice(0, 50),
    galleryPopularity,
    photoPopularity
  };

  res.json(summary);
});

// Clear logs (Admin only)
app.delete('/api/stats/logs', requireAdmin, (req: AuthRequest, res: Response) => {
  accessLogs = [];
  recordLog('admin', 'admin_action', undefined, undefined, 'Registro de estadísticas restablecido');
  res.json({ success: true });
});

// ==================== VITE MIDDLEWARE & SERVER START ====================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Cami Fotos server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
