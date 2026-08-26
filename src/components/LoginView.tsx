import React, { useState } from 'react';
import { Lock, ArrowRight, Shield, Heart, Eye, EyeOff, AlertCircle, Key } from 'lucide-react';
import { UserSession } from '../types';
import { api } from '../lib/api';
import portadaImg from '../assets/images/portada_cami_sunset_1787695138706.jpg';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Por favor, introduzca una contraseña para acceder.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const session = await api.login(password.trim());
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMessage(err.message || 'Contraseña incorrecta. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="login-screen" className="min-h-screen w-full bg-[#070709] text-zinc-100 flex flex-col lg:flex-row overflow-hidden relative selection:bg-amber-500/30 selection:text-amber-200">
      {/* Left side: Full size high-res cover image (.jpg) with atmospheric dark vignette */}
      <div className="relative w-full lg:w-[60%] xl:w-[65%] min-h-[45vh] lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 z-10">
        {/* Background high-resolution cover image */}
        <div 
          className="absolute inset-0 bg-cover bg-[center_top_15%] sm:bg-center transition-transform duration-1000 ease-out scale-100"
          style={{
            backgroundImage: `url(${portadaImg})`,
          }}
        />
        
        {/* Dark low-intensity overlays & cinematic gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/90 lg:to-[#070709] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/40 pointer-events-none" />

        {/* Top bar branding inside cover */}
        <div className="relative z-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="h-2 w-2 rounded-full bg-amber-400/90 ring-4 ring-amber-400/20 animate-pulse" />
            <span className="text-xs uppercase tracking-[0.25em] text-zinc-200 font-medium drop-shadow">
              Archivo Privado de Fotografía
            </span>
          </div>
        </div>

        {/* Bottom title overlay on cover */}
        <div className="relative z-20 mt-auto max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white font-serif leading-tight drop-shadow-md">
            Cami Fotos
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 font-light mt-1.5 tracking-wider drop-shadow">
            Una historia en imágenes
          </p>
        </div>
      </div>

      {/* Right side: Elegant authentication form */}
      <div className="w-full lg:w-[40%] xl:w-[35%] bg-[#09090c] border-t lg:border-t-0 lg:border-l border-zinc-800/80 flex flex-col justify-center px-6 sm:px-12 py-10 lg:py-16 relative z-20 shadow-2xl">
        <div className="w-full max-w-md mx-auto space-y-8">
          
          {/* Header */}
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-amber-400 shadow-inner mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal text-white tracking-tight font-serif">
              Acceso a la Galería
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label 
                htmlFor="password-input" 
                className="block text-xs font-medium uppercase tracking-wider text-zinc-300"
              >
                Contraseña de acceso
              </label>
              <div className="relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese la clave..."
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full bg-zinc-900/90 border border-zinc-700/80 focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/40 rounded-xl px-4 py-3.5 text-zinc-100 text-base placeholder:text-zinc-600 transition-all outline-none pr-12 shadow-inner"
                />
                <button
                  type="button"
                  id="toggle-password-visibility-button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors p-1"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div 
                id="login-error-message"
                className="p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start space-x-2.5 animate-fadeIn"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              id="enter-gallery-button"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-zinc-950 font-medium py-3.5 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-950/30 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2 text-sm font-semibold">
                  <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verificando acceso...</span>
                </div>
              ) : (
                <>
                  <span className="text-base tracking-wide font-medium">Entrar a la galería</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Access Modes Info (Informative overview of Family vs Admin roles) */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-zinc-400 font-medium">
                Niveles de acceso del sistema
              </span>
              <Key className="w-3.5 h-3.5 text-zinc-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Family mode info */}
              <div 
                id="info-mode-family"
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center space-x-2 text-amber-300 mb-1">
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-xs font-medium">Modo Familia</span>
                </div>
                <span className="text-[11px] text-zinc-400 leading-relaxed">
                  Visualización fluida a pantalla completa sin controles de edición.
                </span>
              </div>

              {/* Administration mode info */}
              <div 
                id="info-mode-admin"
                className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col justify-between"
              >
                <div className="flex items-center space-x-2 text-amber-300 mb-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-medium">Modo Administración</span>
                </div>
                <span className="text-[11px] text-zinc-400 leading-relaxed">
                  Panel de subida, asignación de portadas y registro de estadísticas.
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
