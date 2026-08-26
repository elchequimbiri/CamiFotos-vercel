import React, { useState, useEffect } from 'react';
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
  SlidersHorizontal,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { api } from '../lib/api';
import { PRESET_COVERS, getStoredCoverPhoto } from '../lib/coverManager';

interface AdminPanelModalProps {
  galleries: Gallery[];
  activeGalleryId?: string;
  onClose: () => void;
  onRefreshGalleries: () => Promise<void>;
  onUpdateAppCover?: (url: string) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  galleries,
  activeGalleryId,
  onClose,
  onRefreshGalleries,
  onUpdateAppCover,
}) => {
  const [selectedGalleryId, setSelectedGalleryId] = useState<string>(
    activeGalleryId || (galleries[0]?.id || '')
  );
  const [tab, setTab] = useState<'photos' | 'new_gallery' | 'cover'>('photos');

  // Cover photo state
  const [activeCoverPhoto, setActiveCoverPhoto] = useState<string>(() => getStoredCoverPhoto());
  const [previewCoverPhoto, setPreviewCoverPhoto] = useState<string>('');
  const [coverGalleryFilter, setCoverGalleryFilter] = useState<string>(galleries[0]?.id || '');

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
  const filterGalleryForCover = galleries.find(g => g.id === coverGalleryFilter);

  useEffect(() => {
    api.getAppCoverPhoto().then((url) => {
      if (url) setActiveCoverPhoto(url);
    });
  }, []);

  // Handle local image file upload for gallery photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // Handle cover photo file upload
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        setPreviewCoverPhoto(loadEvt.target.result);
        setStatusMessage({ type: 'success', text: 'Imagen cargada para vista previa. Haga clic en "Guardar como Portada Principal" para confirmar.' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Save Cover Photo
  const handleSaveCoverPhoto = async (targetUrl?: string) => {
    const urlToSave = targetUrl || previewCoverPhoto;
    if (!urlToSave) {
      setStatusMessage({ type: 'error', text: 'Seleccione una imagen o archivo primero.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      await api.setAppCoverPhoto(urlToSave);
      setActiveCoverPhoto(urlToSave);
      setPreviewCoverPhoto('');
      if (onUpdateAppCover) {
        onUpdateAppCover(urlToSave);
      }
      setStatusMessage({ type: 'success', text: 'Foto de portada principal de inicio actualizada exitosamente.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al actualizar la foto de portada.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Cover Photo
  const handleResetCover = async () => {
    setIsLoading(true);
    try {
      const def = await api.resetAppCoverPhoto();
      setActiveCoverPhoto(def);
      setPreviewCoverPhoto('');
      if (onUpdateAppCover) {
        onUpdateAppCover(def);
      }
      setStatusMessage({ type: 'success', text: 'Foto de portada restablecida a la predeterminada.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al restablecer la portada.' });
    } finally {
      setIsLoading(false);
    }
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
      setStatusMessage({ type: 'error', text: 'Seleccione un archivo de imagen para subir.' });
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
          <button
            onClick={() => { setTab('cover'); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-all cursor-pointer flex items-center space-x-1.5 ${
              tab === 'cover' 
                ? 'border-amber-400 text-amber-300' 
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Foto de Portada</span>
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

                <div className="space-y-2">
                  <label className="block text-xs text-zinc-300">Archivo de Imagen (Local / Dispositivo)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer bg-zinc-950 border border-zinc-800 rounded-xl p-2.5"
                  />
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

          {tab === 'cover' && (
            <div className="space-y-8 py-2">
              
              {/* Header explanation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white flex items-center space-x-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span>Portada Principal de la Aplicación</span>
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Esta imagen se muestra en pantalla completa en el acceso y bienvenida de Cami Fotos.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetCover}
                  disabled={isLoading}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer predeterminada</span>
                </button>
              </div>

              {/* Current Active Cover & Upload Block */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Current Active Preview */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5" />
                      <span>Portada Activa en el Sitio</span>
                    </span>
                    <span className="text-[10px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      En vivo
                    </span>
                  </div>

                  <div className="relative aspect-[16/10] sm:aspect-video rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-inner">
                    <img 
                      src={activeCoverPhoto} 
                      alt="Portada activa" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <p className="text-xs font-serif text-white font-medium drop-shadow">Cami Fotos</p>
                      <p className="text-[10px] text-zinc-300 drop-shadow">Archivo Privado de Fotografía</p>
                    </div>
                  </div>
                </div>

                {/* Upload New Custom Cover */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-amber-400">
                      <Upload className="w-4 h-4" />
                      <span>Subir Nueva Foto desde tu Dispositivo</span>
                    </div>

                    <p className="text-xs text-zinc-400">
                      Selecciona una fotografía en alta resolución (.jpg, .jpeg, .png o .webp) desde tu ordenador o móvil.
                    </p>

                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="w-full text-xs text-zinc-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer bg-zinc-950 border border-zinc-800 rounded-xl p-2"
                      />
                    </div>

                    {previewCoverPhoto && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-300">
                          <span>Vista previa de la nueva imagen:</span>
                          <span className="text-amber-400">Sin guardar aún</span>
                        </div>
                        <div className="relative aspect-video max-h-36 rounded-lg overflow-hidden border border-amber-500/50 bg-zinc-950">
                          <img src={previewCoverPhoto} alt="Nueva portada" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>

                  {previewCoverPhoto && (
                    <button
                      type="button"
                      onClick={() => handleSaveCoverPhoto()}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-medium py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer text-xs font-sans mt-2"
                    >
                      {isLoading ? 'Guardando...' : 'Confirmar y Guardar como Portada Principal'}
                    </button>
                  )}
                </div>

              </div>

              {/* Predefined / Official Preset Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-zinc-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Portadas Predefinidas y Oficiales</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PRESET_COVERS.map((preset) => {
                    const isCurrent = activeCoverPhoto === preset.url;
                    return (
                      <div 
                        key={preset.id}
                        className={`group relative rounded-xl overflow-hidden border transition-all ${
                          isCurrent 
                            ? 'border-emerald-500/80 ring-2 ring-emerald-500/30 bg-emerald-950/20' 
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                        }`}
                      >
                        <div className="aspect-[16/10] overflow-hidden bg-zinc-900 relative">
                          <img 
                            src={preset.url} 
                            alt={preset.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                          {isCurrent && (
                            <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-medium px-2 py-0.5 rounded shadow">
                              Activa
                            </span>
                          )}
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <span className="text-xs text-zinc-200 truncate pr-2 font-medium">
                            {preset.name}
                          </span>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleSaveCoverPhoto(preset.url)}
                              disabled={isLoading}
                              className="text-[11px] font-medium text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-zinc-900 border border-zinc-700 hover:border-amber-400 cursor-pointer transition-colors shrink-0"
                            >
                              Aplicar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Select photo from Existing Galleries */}
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-zinc-300">
                    <Camera className="w-3.5 h-3.5 text-amber-400" />
                    <span>O seleccionar una foto de tus colecciones existentes:</span>
                  </div>

                  <select
                    value={coverGalleryFilter}
                    onChange={(e) => setCoverGalleryFilter(e.target.value)}
                    className="bg-zinc-950 border border-zinc-700 text-xs text-zinc-200 rounded-lg px-2.5 py-1 outline-none focus:border-amber-400"
                  >
                    {galleries.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.photos.length} fotos)
                      </option>
                    ))}
                  </select>
                </div>

                {filterGalleryForCover && filterGalleryForCover.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1 max-h-56 overflow-y-auto">
                    {filterGalleryForCover.photos.map((photo) => {
                      const isCurrent = activeCoverPhoto === photo.url;
                      return (
                        <div 
                          key={photo.id}
                          onClick={() => handleSaveCoverPhoto(photo.url)}
                          className={`group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-all ${
                            isCurrent 
                              ? 'border-emerald-500 ring-2 ring-emerald-500/40' 
                              : 'border-zinc-800 hover:border-amber-400 hover:opacity-90'
                          }`}
                        >
                          <img src={photo.thumbnailUrl || photo.url} alt={photo.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col justify-end p-1.5 transition-opacity">
                            <span className="text-[10px] text-white font-medium truncate">{photo.title}</span>
                            <span className="text-[9px] text-amber-300 font-semibold">Usar portada</span>
                          </div>
                          {isCurrent && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500 py-3 text-center">
                    Esta galería no contiene fotografías disponibles.
                  </p>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
