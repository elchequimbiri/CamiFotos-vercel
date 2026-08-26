import React, { useState, useEffect } from 'react';
import { UserSession, Gallery, Photo } from './types';
import { api } from './lib/api';
import { downloadGalleryAsZip, downloadAllGalleriesAsZip } from './lib/zipDownload';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { GalleriesView } from './components/GalleriesView';
import { GalleryDetailView } from './components/GalleryDetailView';
import { LightboxModal } from './components/LightboxModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { AccessStatsModal } from './components/AccessStatsModal';
import { PublishingGuideModal } from './components/PublishingGuideModal';
import { ZipDownloadModal, ZipDownloadState } from './components/ZipDownloadModal';

export default function App() {
  const [session, setSession] = useState<UserSession | null>(() => api.getStoredSession());
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null);
  const [currentView, setCurrentView] = useState<'galleries' | 'gallery_detail'>('galleries');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [isAutoSlideshow, setIsAutoSlideshow] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showPublishingGuide, setShowPublishingGuide] = useState(false);

  // ZIP Download State
  const [zipState, setZipState] = useState<ZipDownloadState>({
    isOpen: false,
    title: '',
    totalPhotos: 0,
    currentPhoto: 0,
    percent: 0,
    statusText: '',
    isComplete: false,
    error: null,
  });

  // Load galleries when session is active
  const loadGalleries = async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      const data = await api.getGalleries();
      setGalleries(data);
      // If currently in a gallery detail view, update that gallery instance
      if (selectedGallery) {
        const updated = data.find(g => g.id === selectedGallery.id || g.slug === selectedGallery.slug);
        if (updated) setSelectedGallery(updated);
      }
    } catch (err: any) {
      if (err.message?.includes('Sesión expirada') || err.message?.includes('401') || err.message?.includes('autorizada')) {
        handleLogout();
      } else {
        console.error('Error fetching galleries', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadGalleries();
    }
  }, [session?.token]);

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    setCurrentView('galleries');
    setSelectedGallery(null);
  };

  const handleLogout = async () => {
    await api.logout();
    setSession(null);
    setSelectedGallery(null);
    setCurrentView('galleries');
    setActiveLightboxIndex(null);
    setShowAdminPanel(false);
    setShowStatsModal(false);
    setShowPublishingGuide(false);
  };

  const handleSelectGallery = (gallery: Gallery) => {
    setSelectedGallery(gallery);
    setCurrentView('gallery_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Track view in access stats
    api.trackView('view_gallery', gallery.name);
  };

  const handleBackToGalleries = () => {
    setCurrentView('galleries');
    setSelectedGallery(null);
    setActiveLightboxIndex(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenPhoto = (photoIndex: number) => {
    setActiveLightboxIndex(photoIndex);
    setIsAutoSlideshow(false);
    if (selectedGallery && selectedGallery.photos[photoIndex]) {
      api.trackView('view_photo', selectedGallery.name, selectedGallery.photos[photoIndex].title);
    }
  };

  const handleStartSlideshow = () => {
    if (selectedGallery && selectedGallery.photos.length > 0) {
      setActiveLightboxIndex(0);
      setIsAutoSlideshow(true);
      api.trackView('view_photo', selectedGallery.name, selectedGallery.photos[0].title);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!selectedGallery) return;
    if (!confirm('¿Eliminar esta fotografía de la galería?')) return;
    try {
      await api.deletePhoto(selectedGallery.id, photoId);
      await loadGalleries();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la foto');
    }
  };

  const handleSetCoverPhoto = async (photoId: string) => {
    if (!selectedGallery) return;
    try {
      const updated = await api.setCoverPhoto(selectedGallery.id, photoId);
      setSelectedGallery(updated);
      await loadGalleries();
    } catch (err: any) {
      alert(err.message || 'Error al asignar foto como portada');
    }
  };

  const handleDownloadGalleryZip = async (gallery: Gallery) => {
    if (!gallery.photos || gallery.photos.length === 0) {
      alert('La galería no contiene fotografías para descargar.');
      return;
    }

    setZipState({
      isOpen: true,
      title: `${gallery.name} (${gallery.photos.length} fotos)`,
      totalPhotos: gallery.photos.length,
      currentPhoto: 0,
      percent: 0,
      statusText: 'Preparando archivo .ZIP...',
      isComplete: false,
      error: null,
    });

    try {
      await downloadGalleryAsZip(gallery, (progress) => {
        setZipState((prev) => ({
          ...prev,
          currentPhoto: progress.current,
          totalPhotos: progress.total,
          percent: progress.percent,
          statusText: progress.statusText,
        }));
      });

      setZipState((prev) => ({
        ...prev,
        percent: 100,
        statusText: '¡Descarga completada con éxito!',
        isComplete: true,
      }));
    } catch (err: any) {
      console.error('Error in ZIP download:', err);
      setZipState((prev) => ({
        ...prev,
        error: err.message || 'Ocurrió un problema al descargar las fotos.',
      }));
    }
  };

  const handleDownloadAllZip = async () => {
    const totalPhotos = galleries.reduce((acc, g) => acc + (g.photos ? g.photos.length : 0), 0);
    if (totalPhotos === 0) {
      alert('No hay fotografías disponibles para descargar.');
      return;
    }

    setZipState({
      isOpen: true,
      title: `Colección Completa (${galleries.length} galerías, ${totalPhotos} fotos)`,
      totalPhotos,
      currentPhoto: 0,
      percent: 0,
      statusText: 'Preparando descarga de todas las fotografías...',
      isComplete: false,
      error: null,
    });

    try {
      await downloadAllGalleriesAsZip(galleries, (progress) => {
        setZipState((prev) => ({
          ...prev,
          currentPhoto: progress.current,
          totalPhotos: progress.total,
          percent: progress.percent,
          statusText: progress.statusText,
        }));
      });

      setZipState((prev) => ({
        ...prev,
        percent: 100,
        statusText: '¡Descarga completa finalizada!',
        isComplete: true,
      }));
    } catch (err: any) {
      console.error('Error in full ZIP download:', err);
      setZipState((prev) => ({
        ...prev,
        error: err.message || 'Ocurrió un problema al descargar la colección.',
      }));
    }
  };

  // If unauthenticated: show login view
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200 font-sans">
      {/* Top Navbar */}
      <Navbar
        session={session}
        currentView={currentView}
        currentGalleryName={selectedGallery?.name}
        onBackToGalleries={handleBackToGalleries}
        onOpenAdminPanel={() => setShowAdminPanel(true)}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenPublishingGuide={() => setShowPublishingGuide(true)}
        onLogout={handleLogout}
      />

      {/* Main Views */}
      {currentView === 'galleries' && (
        <GalleriesView
          galleries={galleries}
          session={session}
          onSelectGallery={handleSelectGallery}
          onOpenCreateGallery={() => setShowAdminPanel(true)}
          onDownloadAllZip={handleDownloadAllZip}
          onDownloadGalleryZip={handleDownloadGalleryZip}
          isLoading={isLoading}
        />
      )}

      {currentView === 'gallery_detail' && selectedGallery && (
        <GalleryDetailView
          gallery={selectedGallery}
          session={session}
          onBack={handleBackToGalleries}
          onOpenPhoto={handleOpenPhoto}
          onStartSlideshow={handleStartSlideshow}
          onOpenAddPhoto={() => setShowAdminPanel(true)}
          onDeletePhoto={handleDeletePhoto}
          onSetCoverPhoto={handleSetCoverPhoto}
          onDownloadZip={handleDownloadGalleryZip}
        />
      )}

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && selectedGallery && (
        <LightboxModal
          photos={selectedGallery.photos}
          currentIndex={activeLightboxIndex}
          galleryName={selectedGallery.name}
          userRole={session.role}
          onClose={() => setActiveLightboxIndex(null)}
          onNavigate={(newIdx) => {
            setActiveLightboxIndex(newIdx);
            if (selectedGallery.photos[newIdx]) {
              api.trackView('view_photo', selectedGallery.name, selectedGallery.photos[newIdx].title);
            }
          }}
          isAutoSlideshow={isAutoSlideshow}
          onDownloadGalleryZip={() => handleDownloadGalleryZip(selectedGallery)}
        />
      )}

      {/* Admin Panel Modal */}
      {showAdminPanel && session.role === 'admin' && (
        <AdminPanelModal
          galleries={galleries}
          activeGalleryId={selectedGallery?.id}
          onClose={() => setShowAdminPanel(false)}
          onRefreshGalleries={loadGalleries}
        />
      )}

      {/* Access Stats Modal */}
      {showStatsModal && (
        <AccessStatsModal
          userRole={session.role}
          onClose={() => setShowStatsModal(false)}
        />
      )}

      {/* Publishing & Hosting Guide Modal */}
      {showPublishingGuide && (
        <PublishingGuideModal
          onClose={() => setShowPublishingGuide(false)}
        />
      )}

      {/* Zip Download Progress Modal */}
      <ZipDownloadModal
        state={zipState}
        onClose={() => setZipState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
