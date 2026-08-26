import React, { useState } from 'react';
import { Gallery, Photo, UserSession } from '../types';
import { 
  ArrowLeft, 
  Play, 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutGrid, 
  Maximize2, 
  Calendar, 
  Plus, 
  Trash2, 
  Star,
  Info,
  Eye,
  Download,
  FileArchive
} from 'lucide-react';

interface GalleryDetailViewProps {
  gallery: Gallery;
  session: UserSession;
  onBack: () => void;
  onOpenPhoto: (photoIndex: number) => void;
  onStartSlideshow: () => void;
  onOpenAddPhoto: () => void;
  onDeletePhoto?: (photoId: string) => void;
  onSetCoverPhoto?: (photoId: string) => void;
  onDownloadZip?: (gallery: Gallery) => void;
}

export const GalleryDetailView: React.FC<GalleryDetailViewProps> = ({
  gallery,
  session,
  onBack,
  onOpenPhoto,
  onStartSlideshow,
  onOpenAddPhoto,
  onDeletePhoto,
  onSetCoverPhoto,
  onDownloadZip,
}) => {
  const [layoutMode, setLayoutMode] = useState<'masonry' | 'grid'>('masonry');
  const [hoveredPhotoId, setHoveredPhotoId] = useState<string | null>(null);

  const isAdmin = session.role === 'admin';

  return (
    <div id="gallery-detail-view" className="min-h-screen bg-[#070709] text-zinc-100 pb-28">
      
      {/* Top Header Banner */}
      <section className="pt-8 sm:pt-12 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Navigation back */}
        <div className="mb-6 flex items-center justify-between">
          <button
            id="back-to-galleries-link"
            onClick={onBack}
            className="inline-flex items-center space-x-2 text-xs sm:text-sm text-zinc-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a la lista de galerías</span>
          </button>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {gallery.photos.length > 0 && (
              <>
                <button
                  id="download-gallery-zip-button"
                  onClick={() => onDownloadZip?.(gallery)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 font-medium transition-all cursor-pointer shadow-sm hover:border-zinc-700"
                  title="Descargar todas las fotos de esta galería en un archivo .ZIP comprimido"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span className="inline">Descargar .ZIP</span>
                </button>

                <button
                  id="start-slideshow-button"
                  onClick={onStartSlideshow}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-200 font-medium transition-all cursor-pointer shadow-sm"
                  title="Iniciar pase de diapositivas a pantalla completa"
                >
                  <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="hidden sm:inline">Pase de Diapositivas</span>
                </button>
              </>
            )}

            {/* Layout switch */}
            <div className="hidden sm:flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setLayoutMode('masonry')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  layoutMode === 'masonry' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Diseño natural / Masonry"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setLayoutMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  layoutMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Diseño en cuadrícula uniforme"
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {isAdmin && (
              <button
                id="admin-add-photo-button"
                onClick={onOpenAddPhoto}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Foto</span>
              </button>
            )}
          </div>
        </div>

        {/* Gallery Title & Meta */}
        <div className="border-b border-zinc-800/80 pb-8">
          <div className="flex items-center space-x-2 text-xs uppercase tracking-widest text-zinc-500 font-mono mb-2">
            <span>Carpeta: /{gallery.slug}</span>
            <span>·</span>
            <span>{gallery.year}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white font-serif tracking-tight">
            {gallery.name}
          </h1>

          {gallery.subtitle && (
            <p className="text-base sm:text-lg text-zinc-300 font-light mt-2 max-w-3xl">
              {gallery.subtitle}
            </p>
          )}

          {gallery.description && (
            <p className="text-xs sm:text-sm text-zinc-400 font-light mt-3 max-w-3xl leading-relaxed">
              {gallery.description}
            </p>
          )}

          <div className="mt-4 flex items-center space-x-4 text-xs text-zinc-500 font-mono">
            <span>{gallery.photos.length} fotografías en total</span>
            <span>·</span>
            <span>Haga clic en cualquier foto para abrirla en pantalla completa</span>
          </div>
        </div>
      </section>

      {/* Photos Grid Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {gallery.photos.length === 0 ? (
          <div className="py-20 text-center max-w-sm mx-auto space-y-4">
            <p className="text-sm text-zinc-400">Esta galería aún no contiene fotografías.</p>
            {isAdmin && (
              <button
                onClick={onOpenAddPhoto}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 text-xs font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Subir la primera foto (00_cover.jpg)</span>
              </button>
            )}
          </div>
        ) : (
          <div 
            id="gallery-photos-grid"
            className={
              layoutMode === 'masonry'
                ? 'columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
            }
          >
            {gallery.photos.map((photo, index) => {
              const isCover = photo.filename.startsWith('00') || photo.isCover;

              return (
                <div
                  key={photo.id}
                  id={`photo-card-${photo.id}`}
                  onMouseEnter={() => setHoveredPhotoId(photo.id)}
                  onMouseLeave={() => setHoveredPhotoId(null)}
                  onClick={() => onOpenPhoto(index)}
                  className={`group relative rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800/80 hover:border-zinc-600 transition-all duration-300 cursor-pointer shadow-lg break-inside-avoid ${
                    layoutMode === 'grid' ? 'aspect-[4/3]' : ''
                  }`}
                >
                  {/* Photo image */}
                  <img
                    src={photo.thumbnailUrl || photo.url}
                    alt={photo.title}
                    loading="lazy"
                    className={`w-full ${
                      layoutMode === 'grid' ? 'h-full object-cover' : 'h-auto object-contain'
                    } transition-transform duration-500 ease-out group-hover:scale-103`}
                  />

                  {/* Dark hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4" />

                  {/* Top Bar on Hover */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300">
                      {photo.filename}
                    </span>

                    <div className="flex items-center space-x-1.5">
                      {isCover && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/90 text-zinc-950 text-[10px] font-semibold flex items-center space-x-1">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Portada 00</span>
                        </span>
                      )}

                      <div className="p-1 rounded-md bg-black/70 text-white backdrop-blur-md">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom info on Hover */}
                  <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 space-y-1">
                    <h3 className="text-sm font-medium text-white line-clamp-1 font-serif">
                      {photo.title}
                    </h3>
                    
                    {photo.caption && (
                      <p className="text-[11px] text-zinc-300 font-light line-clamp-2 leading-relaxed">
                        {photo.caption}
                      </p>
                    )}

                    {/* Admin quick actions if admin */}
                    {isAdmin && (
                      <div 
                        className="pt-2 flex items-center justify-end space-x-2 border-t border-zinc-700/60 mt-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {!isCover && onSetCoverPhoto && (
                          <button
                            onClick={() => onSetCoverPhoto(photo.id)}
                            className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[10px] font-medium transition-colors"
                            title="Convertir en foto portada 00_"
                          >
                            Poner portada (00_)
                          </button>
                        )}
                        {onDeletePhoto && (
                          <button
                            onClick={() => onDeletePhoto(photo.id)}
                            className="p-1 rounded bg-red-950/80 hover:bg-red-900 text-red-300 transition-colors"
                            title="Eliminar foto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
};
