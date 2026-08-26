import React, { useState, useEffect } from 'react';
import { AccessStatsSummary, UserRole } from '../types';
import { 
  X, 
  BarChart3, 
  Users, 
  Eye, 
  Images, 
  Shield, 
  Heart, 
  Calendar, 
  Clock, 
  Trash2,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../lib/api';

interface AccessStatsModalProps {
  userRole: UserRole;
  onClose: () => void;
}

export const AccessStatsModal: React.FC<AccessStatsModalProps> = ({
  userRole,
  onClose,
}) => {
  const [stats, setStats] = useState<AccessStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<'all' | 'family' | 'admin'>('all');

  const isAdmin = userRole === 'admin';

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStatsSummary();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearLogs = async () => {
    if (!confirm('¿Desea restablecer todos los registros de auditoría de acceso?')) return;
    try {
      await api.clearStatsLogs();
      await loadStats();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = stats?.recentLogs.filter(log => {
    if (filterRole === 'all') return true;
    return log.role === filterRole;
  }) || [];

  return (
    <div 
      id="access-stats-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#0c0c10] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-normal text-white">
                Estadísticas de Acceso y Visualizaciones
              </h2>
              <p className="text-[11px] text-zinc-400">
                Auditoría en tiempo real de usuarios, fechas, galerías y fotografías visualizadas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center text-zinc-500">
              <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span className="text-xs font-mono">Cargando registros de auditoría...</span>
            </div>
          ) : !stats ? (
            <p className="text-xs text-zinc-400">No se pudieron cargar las estadísticas.</p>
          ) : (
            <>
              {/* Stat metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Inicios Totales</span>
                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="text-2xl font-serif text-white font-normal">
                    {stats.totalLogins}
                  </div>
                  <div className="text-[10px] text-zinc-500 flex items-center space-x-1.5">
                    <span className="text-rose-400 font-medium">{stats.familyLogins} Familia</span>
                    <span>·</span>
                    <span className="text-amber-400 font-medium">{stats.adminLogins} Admin</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Visitas a Galerías</span>
                    <Images className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="text-2xl font-serif text-white font-normal">
                    {stats.totalGalleryViews}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Vistas a carpetas individuales
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Fotos en Lightbox</span>
                    <Eye className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="text-2xl font-serif text-white font-normal">
                    {stats.totalPhotoViews}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Aperturas en pantalla completa
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between text-zinc-400 text-xs">
                    <span>Nivel de Seguridad</span>
                    <Shield className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-sm font-semibold text-emerald-400 font-mono mt-1">
                    Sesión Activa
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    Acceso protegido por token
                  </div>
                </div>
              </div>

              {/* Popularity & Top viewed */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Popular Galleries */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                    <Images className="w-3.5 h-3.5 text-amber-400" />
                    <span>Galerías Más Vistas</span>
                  </h3>
                  <div className="space-y-2">
                    {stats.galleryPopularity.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-0">
                        <span className="text-zinc-200 font-medium">{item.galleryName}</span>
                        <span className="font-mono text-zinc-400">{item.count} visitas</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Photos */}
                <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                    <Eye className="w-3.5 h-3.5 text-sky-400" />
                    <span>Fotografías Destacadas (Lightbox)</span>
                  </h3>
                  <div className="space-y-2">
                    {stats.photoPopularity.slice(0, 5).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-zinc-900 last:border-0">
                        <div className="truncate mr-2">
                          <span className="text-zinc-200 block truncate">{item.photoTitle}</span>
                          <span className="text-[10px] text-zinc-500 block truncate">{item.galleryName}</span>
                        </div>
                        <span className="font-mono text-amber-300 shrink-0">{item.count} vistas</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Real-time Activity Logs Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Registro Detallado de Actividad ({filteredLogs.length})</span>
                  </h3>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-xs">
                      <button
                        onClick={() => setFilterRole('all')}
                        className={`px-2 py-0.5 rounded ${filterRole === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
                      >
                        Todos
                      </button>
                      <button
                        onClick={() => setFilterRole('family')}
                        className={`px-2 py-0.5 rounded ${filterRole === 'family' ? 'bg-zinc-800 text-rose-300' : 'text-zinc-500'}`}
                      >
                        Familia
                      </button>
                      <button
                        onClick={() => setFilterRole('admin')}
                        className={`px-2 py-0.5 rounded ${filterRole === 'admin' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-500'}`}
                      >
                        Admin
                      </button>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={handleClearLogs}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 border border-zinc-800 transition-colors"
                        title="Restablecer registros"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950/60 max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] font-mono sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Fecha y Hora</th>
                        <th className="py-2.5 px-3">Usuario / Rol</th>
                        <th className="py-2.5 px-3">Acción</th>
                        <th className="py-2.5 px-3">Galería / Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900 font-mono text-[11px]">
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-900/40">
                          <td className="py-2 px-3 text-zinc-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                            <span className="text-zinc-600 text-[10px]">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] ${
                              log.role === 'admin' 
                                ? 'bg-amber-950/40 text-amber-300 border border-amber-800/40' 
                                : 'bg-rose-950/30 text-rose-300 border border-rose-800/30'
                            }`}>
                              {log.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Heart className="w-2.5 h-2.5" />}
                              <span>{log.role === 'admin' ? 'Administrador' : 'Familia'}</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap text-zinc-300">
                            {log.action === 'login' && 'Inicio de sesión'}
                            {log.action === 'view_gallery' && 'Apertura de galería'}
                            {log.action === 'view_photo' && 'Foto en Lightbox'}
                            {log.action === 'admin_action' && 'Gestión Admin'}
                          </td>
                          <td className="py-2 px-3 text-zinc-400">
                            {log.galleryName && <span className="text-zinc-200 font-medium mr-1.5">{log.galleryName}</span>}
                            {log.photoTitle && <span className="text-amber-300/90 mr-1.5">"{log.photoTitle}"</span>}
                            {log.details && <span className="text-zinc-500">{log.details}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
