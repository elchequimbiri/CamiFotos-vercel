import React, { useState } from 'react';
import { Gallery, UserSession } from '../types';
import { 
  Images, 
  Calendar, 
  Eye, 
  Search, 
  Plus, 
  Sparkles, 
  FolderPlus,
  ArrowUpRight,
  SlidersHorizontal,
  Download,
  FileArchive
} from 'lucide-react';

interface GalleriesViewProps {
  galleries: Gallery[];
  session: UserSession;
  onSelectGallery: (gallery: Gallery) => void;
  onOpenCreateGallery: () => void;
  onDownloadAllZip?: () => void;
  onDownloadGalleryZip?: (gallery: Gallery) => void;
  isLoading: boolean;
}

export const GalleriesView: React.FC<GalleriesViewProps> = ({
  galleries,
  session,
  onSelectGallery,
  onOpenCreateGallery,
  onDownloadAllZip,
  onDownloadGalleryZip,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const isAdmin = session.role === 'admin';

  // Extract unique years
  const availableYears = Array.from(new Set(galleries.map(g => Number(g.year)))).sort((a: number, b: number) => b - a);

  // Filtered galleries
  const filteredGalleries = galleries.filter(g => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.subtitle && g.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesYear = selectedYear === 'all' || String(g.year) === selectedYear;
    return matchesSearch && matchesYear;
  });

  return (
    <div id="galleries-view-container" className="min-h-screen bg-[#070709] text-zinc-100 pb-24">
      {/* Hero / Intro Section */}
      <section className="pt-10 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center space-x-2 text-xs uppercase tracking-[0.2em] text-amber-400/90 font-medium mb-2.5">
              <span>Colección Organizada por Nombre</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white font-serif">
              Galerías de Fotografías
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 font-light mt-2 max-w-2xl leading-relaxed">
              Seleccione una galería para explorar todas sus fotografías en alta definición.
            </p>
          </div>

          {/* Quick stats, download all or Admin add button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {galleries.length > 0 && onDownloadAllZip && (
              <button
                id="download-all-zip-button"
                onClick={onDownloadAllZip}
                className="inline-flex items-center space-x-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-medium text-xs sm:text-sm px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                title="Descargar todas las fotos de todas las galerías en un archivo .ZIP organizado"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Descargar Todas (.ZIP)</span>
              </button>
            )}

            {isAdmin && (
              <button
                id="create-gallery-button"
                onClick={onOpenCreateGallery}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/20 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Nueva Galería</span>
              </button>
            )}
            <div className="px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400 font-mono">
              <span className="text-white font-medium">{galleries.length}</span> colecciones
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="gallery-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, lugar o tema..."
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-amber-400/30 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Year Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              id="filter-year-all"
              onClick={() => setSelectedYear('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                selectedYear === 'all'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
              }`}
            >
              Todos los años
            </button>
            {availableYears.map(year => (
              <button
                key={year}
                id={`filter-year-${year}`}
                onClick={() => setSelectedYear(String(year))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  selectedYear === String(year)
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80'
                }`}
              >
                {year}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* Galleries Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-zinc-500">
            <div className="w-8 h-8 border-2 border-amber-400/80 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Cargando galerías protegidas...</span>
          </div>
        ) : filteredGalleries.length === 0 ? (
          <div className="py-24 text-center max-w-md mx-auto space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
              <Images className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-medium text-zinc-200">No se encontraron galerías</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              No hay colecciones que coincidan con los filtros seleccionados. Intente borrar la búsqueda.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedYear('all'); }}
              className="text-xs text-amber-400 hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div 
            id="galleries-grid" 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {filteredGalleries.map((gallery) => {
              // Find cover photo starting with 00 or designated cover
              const coverPhoto = gallery.photos.find(p => p.filename.startsWith('00') || p.isCover) || gallery.photos[0];
              const photoCount = gallery.photos.length;

              return (
                <article
                  key={gallery.id}
                  id={`gallery-card-${gallery.id}`}
                  onClick={() => onSelectGallery(gallery)}
                  className="group relative bg-[#0d0d11] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-black/60 flex flex-col"
                >
                  {/* Image Container with 00_cover image */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
                    {coverPhoto?.url ? (
                      <img
                        src={coverPhoto.thumbnailUrl || coverPhoto.url}
                        alt={gallery.name}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        <Images className="w-12 h-12 stroke-[1]" />
                      </div>
                    )}

                    {/* Gradient Overlay for Text Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d11] via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                    {/* 00_ Cover Badge */}
                    <div className="absolute top-3.5 left-3.5 flex items-center space-x-2">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                        {coverPhoto?.filename ? coverPhoto.filename.split('.')[0] : '00_cover'}
                      </span>
                    </div>

                    {/* Year Badge */}
                    <div className="absolute top-3.5 right-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/10 text-[11px] font-medium text-zinc-300">
                        {gallery.year}
                      </span>
                    </div>

                    {/* Quick photo count badge */}
                    <div className="absolute bottom-3.5 right-3.5 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 font-mono">
                      <Images className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{photoCount} fotos</span>
                    </div>
                  </div>

                  {/* Gallery Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-normal text-white group-hover:text-amber-300 transition-colors font-serif tracking-tight">
                          {gallery.name}
                        </h2>
                        <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>

                      {gallery.subtitle && (
                        <p className="text-xs text-zinc-400 font-light mt-1 line-clamp-1">
                          {gallery.subtitle}
                        </p>
                      )}

                      {gallery.description && (
                        <p className="text-xs text-zinc-500 font-light mt-2.5 line-clamp-2 leading-relaxed">
                          {gallery.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info */}
                    <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-500 font-light">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-zinc-600" />
                        <span>{gallery.dateCreated}</span>
                      </span>

                      <div className="flex items-center space-x-3">
                        {onDownloadGalleryZip && gallery.photos.length > 0 && (
                          <button
                            id={`download-zip-card-${gallery.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDownloadGalleryZip(gallery);
                            }}
                            className="inline-flex items-center space-x-1 text-zinc-400 hover:text-amber-400 transition-colors p-1 -m-1 rounded hover:bg-zinc-800/60"
                            title={`Descargar ${gallery.photos.length} fotos de "${gallery.name}" en .ZIP`}
                          >
                            <Download className="w-3 h-3" />
                            <span className="text-[10px] font-mono font-medium">.ZIP</span>
                          </button>
                        )}
                        <span className="flex items-center space-x-1 text-zinc-400">
                          <Eye className="w-3 h-3 text-zinc-600" />
                          <span>{gallery.viewsCount || 0}</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
