import React from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, X, Archive, FileArchive } from 'lucide-react';

export interface ZipDownloadState {
  isOpen: boolean;
  title: string;
  totalPhotos: number;
  currentPhoto: number;
  percent: number;
  statusText: string;
  isComplete: boolean;
  error: string | null;
}

interface ZipDownloadModalProps {
  state: ZipDownloadState;
  onClose: () => void;
}

export const ZipDownloadModal: React.FC<ZipDownloadModalProps> = ({ state, onClose }) => {
  if (!state.isOpen) return null;

  return (
    <div 
      id="zip-download-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div 
        id="zip-download-modal"
        className="w-full max-w-md bg-[#0e0e13] border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5 text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              state.isComplete
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                : state.error
                ? 'bg-red-950/40 border-red-800 text-red-400'
                : 'bg-amber-950/40 border-amber-800 text-amber-400'
            }`}>
              {state.isComplete ? (
                <CheckCircle className="w-5 h-5" />
              ) : state.error ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <FileArchive className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-base font-medium text-white font-serif">
                {state.isComplete ? 'Descarga lista' : state.error ? 'Error en la descarga' : 'Descargando Fotografías (.ZIP)'}
              </h3>
              <p className="text-xs text-zinc-400 font-light truncate max-w-[240px]">
                {state.title}
              </p>
            </div>
          </div>

          {(state.isComplete || state.error) && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress Bar & Status */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center space-x-1.5">
              {!state.isComplete && !state.error && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              )}
              <span className="truncate max-w-[260px]">{state.statusText}</span>
            </span>
            <span className={`font-semibold ${state.isComplete ? 'text-emerald-400' : 'text-amber-400'}`}>
              {state.percent}%
            </span>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                state.isComplete
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : state.error
                  ? 'bg-red-500'
                  : 'bg-gradient-to-r from-amber-500 to-amber-400'
              }`}
              style={{ width: `${Math.max(4, Math.min(100, state.percent))}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1">
            <span>
              {state.currentPhoto} / {state.totalPhotos} fotos procesadas
            </span>
            <span>Formato .ZIP alta resolución</span>
          </div>
        </div>

        {/* Error message */}
        {state.error && (
          <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/50 text-xs text-red-300 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-2 flex justify-end">
          {state.isComplete ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-medium text-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Cerrar</span>
            </button>
          ) : state.error ? (
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          ) : (
            <div className="text-[11px] text-zinc-500 text-center w-full">
              Por favor mantenga esta pestaña abierta mientras se empaqueta el archivo comprimido.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
