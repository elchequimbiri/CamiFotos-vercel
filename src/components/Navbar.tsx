import React from 'react';
import { UserSession } from '../types';
import { 
  Sprout, 
  Shield, 
  Heart, 
  LogOut, 
  BarChart3, 
  Settings2, 
  BookOpen, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  session: UserSession;
  currentView: 'galleries' | 'gallery_detail';
  currentGalleryName?: string;
  onBackToGalleries: () => void;
  onOpenAdminPanel: () => void;
  onOpenStats: () => void;
  onOpenPublishingGuide: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  session,
  currentView,
  currentGalleryName,
  onBackToGalleries,
  onOpenAdminPanel,
  onOpenStats,
  onOpenPublishingGuide,
  onLogout,
}) => {
  const isAdmin = session.role === 'admin';

  return (
    <header 
      id="main-navbar" 
      className="sticky top-0 z-40 w-full bg-[#070709]/90 backdrop-blur-md border-b border-zinc-800/80 transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Left: Brand or Breadcrumb */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {currentView === 'gallery_detail' ? (
            <button
              id="nav-back-button"
              onClick={onBackToGalleries}
              className="inline-flex items-center space-x-2 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-lg transition-all cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Volver a Galerías</span>
            </button>
          ) : (
            <div 
              onClick={onBackToGalleries}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-800/80 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400/70 group-hover:bg-emerald-900/50 transition-all shadow-sm">
                <Sprout className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="text-lg sm:text-xl font-light text-white font-serif tracking-tight">
                    Cami Fotos
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-normal bg-zinc-800/90 text-zinc-400 border border-zinc-700/50">
                    4K
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 tracking-wider font-light">
                  Una historia en imágenes
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* User Role Badge */}
          <div 
            id="user-role-badge"
            className={`hidden md:inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
              isAdmin 
                ? 'bg-amber-950/30 text-amber-300 border-amber-800/40' 
                : 'bg-rose-950/20 text-rose-300 border-rose-800/30'
            }`}
          >
            {isAdmin ? (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Heart className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{isAdmin ? 'Administración' : 'Modo Familia'}</span>
          </div>

          {/* Admin panel button - ONLY if administrator */}
          {isAdmin && (
            <>
              <button
                id="nav-admin-panel-button"
                onClick={onOpenAdminPanel}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-zinc-200 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Administrar galerías y subir fotos"
              >
                <Settings2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Panel Admin</span>
              </button>

              <button
                id="nav-stats-button"
                onClick={onOpenStats}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer"
                title="Estadísticas de acceso y visualizaciones"
              >
                <BarChart3 className="w-4 h-4 text-sky-400" />
                <span className="hidden sm:inline">Estadísticas</span>
              </button>

              {/* Publishing & Hosting Guide - Admin Only */}
              <button
                id="nav-guide-button"
                onClick={onOpenPublishingGuide}
                className="inline-flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl transition-all cursor-pointer"
                title="Guía técnica para alojar y publicar el sitio"
              >
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <span className="hidden md:inline">Guía de Hosting</span>
              </button>
            </>
          )}

          {/* Logout button */}
          <button
            id="nav-logout-button"
            onClick={onLogout}
            className="inline-flex items-center space-x-1 text-xs sm:text-sm text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 p-2 sm:px-3 sm:py-2 rounded-xl transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline text-xs">Salir</span>
          </button>

        </div>

      </div>
    </header>
  );
};
