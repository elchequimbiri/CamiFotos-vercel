import React, { useState } from 'react';
import { Gallery, Photo } from '../types';
import { 
  X, 
  Plus, 
  FolderPlus, 
  Upload, 
  Trash2, 
  Star, 
  Edit3, 
  Check, 
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Folder,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../lib/api';

interface AdminPanelModalProps {
  galleries: Gallery[];
  activeGalleryId?: string;
  onClose: () => void;
  onRefreshGalleries: () => Promise<void>;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  galleries,
  activeGalleryId,
  onClose,
  onRefreshGalleries,
}) => {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    activeGalleryId || (galleries[0]?.id || '')
  );
  const [tab, setTab] = useState<'photos' | 'edit_gallery' | 'new_gallery'>('photos');

  // Form states for New Gallery
  const [newGalName, setNewGalName] = useState('');
  const [newGalSubtitle, setNewGalSubtitle] = useState('');
  const [newGalDesc, setNewGalDesc] = useState('');
  const [newGalYear, setNewGalYear] = useState(new Date().getFullYear());

  // Form states for New Photo
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isPhotoCover, setIsPhotoCover] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedGallery = galleries.find(g => g.id === selectedGalleryId);

  // Handle local image file upload (converts to base64 / Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-fill title if empty
    if (!photoTitle) {
      const nameClean = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setPhotoTitle(nameClean);
    }

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        setPhotoUrl(loadEvt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Create Gallery
  const handleCreateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalName.trim()) {
      setStatusMessage({ type: 'error', text: 'El nombre de la galería es obligatorio.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const created = await api.createGallery({
        name: newGalName.trim(),
        subtitle: newGalSubtitle.trim(),
        description: newGalDesc.trim(),
        year: Number(newGalYear),
      });

      await onRefreshGalleries();
      setSelectedGalleryId(created.id);
      setTab('photos');
      setNewGalName('');
      setNewGalSubtitle('');
      setNewGalDesc('');
      setStatusMessage({ type: 'success', text: `Galería "${created.name}" creada exitosamente.` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al crear la galería.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Add Photo
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGalleryId) {
      setStatusMessage({ type: 'error', text: 'Seleccione una galería primero.' });
      return;
    }
    if (!photoUrl.trim()) {
      setStatusMessage({ type: 'error', text: 'Suba un archivo de imagen o ingrese una URL válida.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      await api.addPhoto(selectedGalleryId, {
        title: photoTitle.trim() || 'Nueva Fotografía',
        caption: photoCaption.trim(),
        url: photoUrl.trim(),
        isCover: isPhotoCover,
      });

      await onRefreshGalleries();
      // Reset photo fields
      setPhotoTitle('');
      setPhotoCaption('');
      setPhotoUrl('');
      setIsPhotoCover(false);
      setStatusMessage({ type: 'success', text: 'Fotografía añadida exitosamente a la carpeta.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al subir la fotografía.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Photo
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('¿Está seguro de eliminar esta fotografía de la galería?')) return;
    setIsLoading(true);
    try {
      await api.deletePhoto(selectedGalleryId, photoId);
      await onRefreshGalleries();
      setStatusMessage({ type: 'success', text: 'Fotografía eliminada.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Set Cover Photo (00_)
  const handleSetCover = async (photoId: string) => {
    setIsLoading(true);
    try {
      await api.setCoverPhoto(selectedGalleryId, photoId);
      await onRefreshGalleries();
      setStatusMessage({ type: 'success', text: 'Fotografía designada como portada principal (00_).' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al asignar portada.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Gallery
  const handleDeleteGallery = async () => {
    if (!selectedGallery) return;
    if (!confirm(`¿Eliminar permanentemente la galería "${selectedGallery.name}" y todas sus fotos?`)) return;
    setIsLoading(true);
    try {
      await api.deleteGallery(selectedGallery.id);
      await onRefreshGalleries();
      setSelectedGalleryId(galleries[0]?.id || '');
      setStatusMessage({ type: 'success', text: 'Galería eliminada.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al eliminar la galería.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="admin-panel-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#0c0c10] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-normal text-white">
                Panel de Administración
              </h2>
              <p className="text-[11px] text-zinc-400">
                Gestione galerías, suba fotografías de alta resolución y asigne portadas (00_).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div className={`px-6 py-2.5 text-xs flex items-center space-x-2 ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-b border-emerald-800/50 text-emerald-300' 
              : 'bg-red-950/40 border-b border-red-800/50 text-red-300'
          }`}>
            {statusMessage.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 px-6 pt-3 border-b border-zinc-800 bg-zinc-950/30">
          <button
            onClick={() => { setTab('photos'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              tab === 'photos' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Subir y Gestionar Fotos
          </button>
          <button
            onClick={() => { setTab('new_gallery'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer ${
              tab === 'new_gallery' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Crear Nueva Galería
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {tab === 'photos' && (
            <div className="space-y-6">
              
              {/* Gallery selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-300">Galería activa a gestionar:</label>
                  <select
                    id="admin-gallery-select"
                    value={selectedGalleryId}
                    onChange={(e) => setSelectedGalleryId(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 rounded-lg px-3 py-1.5 outline-none focus:border-amber-400"
                  >
                    {galleries.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.photos.length} fotos) - {g.year}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedGallery && (
                  <button
                    onClick={handleDeleteGallery}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-300 text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar esta galería</span>
                  </button>
                )}
              </div>

              {/* Upload Photo Form */}
              <form onSubmit={handleAddPhoto} className="p-5 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-amber-400">
                  <Upload className="w-4 h-4" />
                  <span>Añadir Fotografía a "{selectedGallery?.name}"</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* File upload drag drop or select */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-300">Archivo de Imagen (Local / Dispositivo)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer bg-zinc-950 border border-zinc-800 rounded-xl p-2"
                    />
                  </div>

                  {/* Or URL */}
                  <div className="space-y-2">
                    <label className="block text-xs text-zinc-300">O Enlace / URL directa de alta resolución</label>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 outline-none"
                    />
                  </div>
                </div>

                {/* Preview if url exists */}
                {photoUrl && (
                  <div className="relative aspect-video max-h-36 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950">
                    <img src={photoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-zinc-300">
                      Vista previa de imagen
                    </span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs text-zinc-400">Título de la foto</label>
                  <input
                    type="text"
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="Ej: Amanecer en las Torres del Paine"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs text-zinc-400">Descripción / Historia (Opcional)</label>
                  <textarea
                    rows={2}
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="Detalles sobre el momento de la captura, luz, contexto..."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-zinc-100 outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPhotoCover}
                      onChange={(e) => setIsPhotoCover(e.target.checked)}
                      className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0"
                    />
                    <span>Asignar como portada de la galería (nombre archivo 00_)</span>
                  </label>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Subiendo...' : 'Guardar y Subir Foto'}
                  </button>
                </div>
              </form>

              {/* Photos List in Active Gallery */}
              {selectedGallery && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Fotografías en "{selectedGallery.name}" ({selectedGallery.photos.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {selectedGallery.photos.map((photo) => {
                      const isCover = photo.filename.startsWith('00') || photo.isCover;
                      return (
                        <div
                          key={photo.id}
                          className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 p-2 space-y-2 group"
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                            <img
                              src={photo.thumbnailUrl || photo.url}
                              alt={photo.title}
                              className="w-full h-full object-cover"
                            />
                            {isCover && (
                              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 text-[9px] font-bold">
                                00_ Cover
                              </span>
                            )}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-zinc-200 line-clamp-1">{photo.title}</p>
                            <p className="text-[10px] font-mono text-zinc-500 line-clamp-1">{photo.filename}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                            {!isCover && (
                              <button
                                onClick={() => handleSetCover(photo.id)}
                                className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                              >
                                Hacer 00_
                              </button>
                            )}
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="text-[10px] text-red-400 hover:underline ml-auto cursor-pointer"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {tab === 'new_gallery' && (
            <form onSubmit={handleCreateGallery} className="max-w-xl mx-auto space-y-4 py-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">
                  Nombre de la Galería <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newGalName}
                  onChange={(e) => setNewGalName(e.target.value)}
                  placeholder="Ej: Islandia en Invierno"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">Subtítulo / Lema</label>
                <input
                  type="text"
                  value={newGalSubtitle}
                  onChange={(e) => setNewGalSubtitle(e.target.value)}
                  placeholder="Ej: Auroras boreales, cascadas heladas y tierras volcánicas"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">Año de la colección</label>
                <input
                  type="number"
                  value={newGalYear}
                  onChange={(e) => setNewGalYear(Number(e.target.value))}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-zinc-300">Descripción detallada</label>
                <textarea
                  rows={3}
                  value={newGalDesc}
                  onChange={(e) => setNewGalDesc(e.target.value)}
                  placeholder="Una crónica fotográfica sobre la expedición..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-100 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium py-3 px-6 rounded-xl transition-all shadow-md cursor-pointer text-xs sm:text-sm"
              >
                {isLoading ? 'Creando...' : 'Crear Galería'}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
