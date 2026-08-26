import JSZip from 'jszip';
import { Gallery, Photo } from '../types';

export interface ZipProgressCallback {
  (progress: {
    current: number;
    total: number;
    percent: number;
    statusText: string;
  }): void;
}

/**
 * Fetches an image URL and converts it to a Blob, handling CORS or fallback via Canvas
 */
async function fetchImageBlob(url: string): Promise<Blob> {
  // If it's already a data URL / base64
  if (url.startsWith('data:')) {
    const res = await fetch(url);
    return await res.blob();
  }

  // Attempt standard fetch with CORS
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (response.ok) {
      return await response.blob();
    }
  } catch (err) {
    console.warn(`Direct fetch failed for ${url}, trying canvas fallback...`, err);
  }

  // Fallback via Image element + Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 1200;
        canvas.height = img.naturalHeight || img.height || 800;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob returned null'));
            }
          },
          'image/jpeg',
          0.95
        );
      } catch (canvasErr) {
        reject(canvasErr);
      }
    };
    img.onerror = (e) => {
      reject(new Error(`Failed to load image from URL: ${url}`));
    };
    img.src = url;
  });
}

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_.-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Downloads all photos from a single gallery as a .ZIP file
 */
export async function downloadGalleryAsZip(
  gallery: Gallery,
  onProgress?: ZipProgressCallback
): Promise<void> {
  if (!gallery.photos || gallery.photos.length === 0) {
    throw new Error('La galería no tiene fotografías para descargar.');
  }

  const zip = new JSZip();
  const total = gallery.photos.length;
  let current = 0;

  onProgress?.({
    current: 0,
    total,
    percent: 0,
    statusText: `Iniciando descarga de ${total} fotografías...`,
  });

  for (let i = 0; i < gallery.photos.length; i++) {
    const photo = gallery.photos[i];
    const indexPrefix = String(i + 1).padStart(2, '0');
    const safeTitle = sanitizeFilename(photo.title || `foto_${i + 1}`);
    const filename = `${indexPrefix}_${safeTitle}.jpg`;

    onProgress?.({
      current: i + 1,
      total,
      percent: Math.round(((i) / total) * 90),
      statusText: `Descargando (${i + 1}/${total}): ${photo.title}...`,
    });

    try {
      const blob = await fetchImageBlob(photo.url);
      zip.file(filename, blob);
    } catch (err) {
      console.error(`Error downloading photo ${photo.title}:`, err);
      // Create a small text info file noting the error
      zip.file(`${filename}.error.txt`, `No se pudo descargar la imagen original: ${photo.url}`);
    }

    current = i + 1;
  }

  onProgress?.({
    current: total,
    total,
    percent: 92,
    statusText: 'Comprimiendo archivo .ZIP...',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        current: total,
        total,
        percent: 92 + Math.round((metadata.percent / 100) * 8),
        statusText: `Empaquetando: ${Math.round(metadata.percent)}%`,
      });
    }
  );

  const cleanGallerySlug = sanitizeFilename(gallery.slug || gallery.name);
  const downloadFilename = `CamiFotos_${cleanGallerySlug}_${gallery.year || new Date().getFullYear()}.zip`;

  // Trigger download in browser
  triggerBlobDownload(zipBlob, downloadFilename);

  onProgress?.({
    current: total,
    total,
    percent: 100,
    statusText: '¡Descarga completada!',
  });
}

/**
 * Downloads ALL photos across ALL galleries as a organized .ZIP file
 */
export async function downloadAllGalleriesAsZip(
  galleries: Gallery[],
  onProgress?: ZipProgressCallback
): Promise<void> {
  const allPhotosCount = galleries.reduce((acc, g) => acc + (g.photos ? g.photos.length : 0), 0);

  if (allPhotosCount === 0) {
    throw new Error('No hay fotografías disponibles para descargar.');
  }

  const zip = new JSZip();
  let processedCount = 0;

  onProgress?.({
    current: 0,
    total: allPhotosCount,
    percent: 0,
    statusText: `Iniciando descarga completa (${allPhotosCount} fotos en ${galleries.length} galerías)...`,
  });

  for (const gallery of galleries) {
    if (!gallery.photos || gallery.photos.length === 0) continue;

    const folderName = `${gallery.year ? `${gallery.year}_` : ''}${sanitizeFilename(gallery.name)}`;
    const galleryFolder = zip.folder(folderName);

    for (let i = 0; i < gallery.photos.length; i++) {
      const photo = gallery.photos[i];
      const indexPrefix = String(i + 1).padStart(2, '0');
      const safeTitle = sanitizeFilename(photo.title || `foto_${i + 1}`);
      const filename = `${indexPrefix}_${safeTitle}.jpg`;

      onProgress?.({
        current: processedCount + 1,
        total: allPhotosCount,
        percent: Math.round((processedCount / allPhotosCount) * 90),
        statusText: `[${gallery.name}] (${i + 1}/${gallery.photos.length}): ${photo.title}...`,
      });

      try {
        const blob = await fetchImageBlob(photo.url);
        if (galleryFolder) {
          galleryFolder.file(filename, blob);
        } else {
          zip.file(`${folderName}/${filename}`, blob);
        }
      } catch (err) {
        console.error(`Error downloading photo ${photo.title}:`, err);
        if (galleryFolder) {
          galleryFolder.file(`${filename}.error.txt`, `Error al descargar: ${photo.url}`);
        }
      }

      processedCount++;
    }
  }

  onProgress?.({
    current: allPhotosCount,
    total: allPhotosCount,
    percent: 92,
    statusText: 'Generando archivo .ZIP comprimido...',
  });

  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      onProgress?.({
        current: allPhotosCount,
        total: allPhotosCount,
        percent: 92 + Math.round((metadata.percent / 100) * 8),
        statusText: `Empaquetando todas las fotos: ${Math.round(metadata.percent)}%`,
      });
    }
  );

  const downloadFilename = `CamiFotos_Coleccion_Completa_${new Date().getFullYear()}.zip`;
  triggerBlobDownload(zipBlob, downloadFilename);

  onProgress?.({
    current: allPhotosCount,
    total: allPhotosCount,
    percent: 100,
    statusText: '¡Descarga completa finalizada!',
  });
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 150);
}
