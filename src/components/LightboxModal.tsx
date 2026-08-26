import React, { useState, useEffect, useCallback } from 'react';
import { Photo, UserRole } from '../types';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2,
  Download
} from 'lucide-react';

interface LightboxModalProps {
  photos: Photo[];
  currentIndex: number;
  galleryName: string;
  userRole: UserRole;
  onClose: () => void;
  onNavigate: (index: number) => void;
  isAutoSlideshow?: boolean;
  onDownloadGalleryZip?: () => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  photos,
  currentIndex,
  galleryName,
  onClose,
  onNavigate,
  isAutoSlideshow = false,
  onDownloadGalleryZip,
}) => {
  const [isPlaying, setIsPlaying] = useState(isAutoSlideshow);
  const [showFilmstrip] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const currentPhoto = photos[currentIndex];
  const totalPhotos = photos.length;

  const handleNext = useCallback(() => {
    setImageLoaded(false);
    setIsZoomed(false);
    onNavigate((currentIndex + 1) % totalPhotos);
  }, [currentIndex, totalPhotos, onNavigate]);

  const handlePrev = useCallback(() => {
    setImageLoaded(false);
    setIsZoomed(false);
    onNavigate((currentIndex - 1 + totalPhotos) % totalPhotos);
  }, [currentIndex, totalPhotos, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'H') {
        handlePrev();
      } else if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key === 'z' || e.key === 'Z') {
        setIsZoomed(prev => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleBrowserFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Slideshow auto advance
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      handleNext();
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, handleNext]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  if (!currentPhoto) return null;

  return (
    <div 
      id="lightbox-overlay"
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden"
    >
      {/* Top Header Bar */}
      <header className="relative z-30 flex items-center justify-between px-4 sm:px-6 py-3.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        {/* Left: Gallery name & photo index */}
        <div className="flex items-center space-x-3 text-white">
          <span className="text-xs sm:text-sm font-medium tracking-wide font-serif text-zinc-200">
            {galleryName}
          </span>
          <span className="text-zinc-600">/</span>
          <span className="text-xs font-mono text-amber-400 bg-zinc-900/90 px-2 py-0.5 rounded border border-zinc-800">
            {currentIndex + 1} de {totalPhotos}
          </span>
          <span className="text-xs font-mono text-zinc-500 hidden md:inline">
            {currentPhoto.filename}
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {/* Slideshow button */}
          <button
            id="lightbox-slideshow-toggle"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isPlaying ? 'bg-amber-500 text-black' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={isPlaying ? 'Pausar pase (Espacio)' : 'Reproducir pase continuo (Espacio)'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          {/* Zoom toggle */}
          <button
            id="lightbox-zoom-toggle"
            onClick={() => setIsZoomed(!isZoomed)}
            className={`p-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isZoomed ? 'bg-zinc-800 text-amber-400' : 'text-zinc-300 hover:text-white hover:bg-zinc-800/80'
            }`}
            title={isZoomed ? 'Ajustar a pantalla (Z)' : 'Zoom 100% (Z)'}
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          {/* Fullscreen browser toggle */}
          <button
            id="lightbox-fullscreen-toggle"
            onClick={toggleBrowserFullscreen}
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Pantalla completa nativa (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Download Current Photo */}
          <a
            id="lightbox-download-photo"
            href={currentPhoto.url}
            download={currentPhoto.filename || `${currentPhoto.title}.jpg`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Descargar esta foto en alta resolución"
          >
            <Download className="w-4 h-4" />
          </a>

          {/* Download Entire Gallery ZIP */}
          {onDownloadGalleryZip && (
            <button
              id="lightbox-download-gallery-zip"
              onClick={onDownloadGalleryZip}
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 transition-colors cursor-pointer"
              title="Descargar todas las fotos de esta galería en .ZIP"
            >
              <Download className="w-3.5 h-3.5" />
              <span>.ZIP</span>
            </button>
          )}

          {/* Close button */}
          <button
            id="lightbox-close-button"
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-700/80 transition-colors ml-2 cursor-pointer"
            title="Cerrar (Escape)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Image Stage */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden px-2 sm:px-12 py-2">
        
        {/* Previous arrow */}
        <button
          id="lightbox-prev-button"
          onClick={handlePrev}
          className="absolute left-2 sm:left-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title="Foto anterior (←)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Next arrow */}
        <button
          id="lightbox-next-button"
          onClick={handleNext}
          className="absolute right-2 sm:right-4 z-30 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white/80 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-all hover:scale-105 cursor-pointer"
          title="Siguiente foto (→)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Image wrapper */}
        <div 
          className={`relative max-w-full max-h-full flex items-center justify-center transition-transform duration-300 ${
            isZoomed ? 'cursor-zoom-out overflow-auto scale-150' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <img
            id="lightbox-current-image"
            key={currentPhoto.id}
            src={currentPhoto.url}
            alt={currentPhoto.title}
            onLoad={() => setImageLoaded(true)}
            className={`max-h-[82vh] max-w-[94vw] object-contain transition-opacity duration-300 select-none shadow-2xl ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>

      </div>

      {/* Bottom Filmstrip Thumbnails & Caption */}
      <footer className="relative z-30 px-4 sm:px-6 py-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent flex flex-col items-center space-y-2">
        {/* Active photo title overlay & caption */}
        <div className="text-center max-w-xl">
          <h3 className="text-xs sm:text-sm text-zinc-200 font-serif font-light">
            {currentPhoto.title}
          </h3>
          {currentPhoto.caption && (
            <p className="text-[11px] text-zinc-400 font-light mt-0.5 line-clamp-1">
              {currentPhoto.caption}
            </p>
          )}
        </div>

        {/* Thumbnail Filmstrip */}
        {showFilmstrip && totalPhotos > 1 && (
          <div className="flex items-center space-x-2 overflow-x-auto max-w-2xl py-1 px-2 scrollbar-none">
            {photos.map((p, idx) => (
              <button
                key={p.id}
                onClick={() => {
                  setImageLoaded(false);
                  onNavigate(idx);
                }}
                className={`relative shrink-0 w-12 sm:w-14 h-8 sm:h-10 rounded-md overflow-hidden transition-all cursor-pointer ${
                  idx === currentIndex 
                    ? 'ring-2 ring-amber-400 scale-105 opacity-100' 
                    : 'opacity-40 hover:opacity-80 border border-zinc-800'
                }`}
              >
                <img
                  src={p.thumbnailUrl || p.url}
                  alt={p.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </footer>
    </div>
  );
};
