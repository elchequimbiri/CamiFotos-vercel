import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  Server, 
  Cloud, 
  Lock, 
  Image as ImageIcon, 
  Terminal, 
  Check, 
  Copy,
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';

interface PublishingGuideModalProps {
  onClose: () => void;
}

export const PublishingGuideModal: React.FC<PublishingGuideModalProps> = ({ onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      id="publishing-guide-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="bg-[#0c0c10] border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-normal text-white">
                Guía de Publicación & Hosting (Cami Fotos)
              </h2>
              <p className="text-[11px] text-zinc-400">
                Instrucciones técnicas paso a paso para desplegar y alojar el sitio en cualquier proveedor.
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-xs sm:text-sm leading-relaxed">
          
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center space-x-2">
              <Layers className="w-4 h-4" />
              <span>Arquitectura del Proyecto</span>
            </h3>
            <p className="text-xs text-zinc-300">
              Cami Fotos está construido con una arquitectura híbrida de alta velocidad (Express + React + Tailwind + Vite). El servidor Node.js protege estrictamente todas las fotografías mediante verificación de token en cada solicitud de API antes de entregar los recursos.
            </p>
          </div>

          {/* Section 1: Variables de Entorno */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>1. Variables de Entorno Requeridas (.env)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Configure las siguientes variables en el panel de su proveedor de hosting o en el archivo <code className="text-amber-300">.env</code> de su servidor:
            </p>

            <div className="relative rounded-xl bg-zinc-950 border border-zinc-800 p-4 font-mono text-xs text-zinc-200">
              <button
                onClick={() => copyToClipboard(`FAMILY_PASSWORD="family_photo_2026"\nADMIN_PASSWORD="admin_cami_secure"\nPORT=3000\nNODE_ENV="production"`, 'env')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
                title="Copiar configuración .env"
              >
                {copiedId === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <pre className="overflow-x-auto text-[11px] leading-5">
{`# Contraseñas de acceso
FAMILY_PASSWORD="family_photo_2026"
ADMIN_PASSWORD="admin_cami_secure"

# Puerto y entorno
PORT=3000
NODE_ENV="production"`}
              </pre>
            </div>
          </div>

          {/* Section 2: Hosting Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-sky-400" />
              <span>2. Opciones de Despliegue Recomendadas</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Option A: Vercel */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2 text-white font-medium text-xs">
                  <Cloud className="w-4 h-4 text-white" />
                  <span>A. Vercel (Serverless)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Totalmente configurado mediante <code className="text-zinc-300">vercel.json</code> y <code className="text-zinc-300">api/index.ts</code>.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-500 space-y-1">
                  <div>1. Conectar repositorio a Vercel.</div>
                  <div>2. En <strong>Settings &gt; Environment Variables</strong>, agregar:</div>
                  <div className="text-amber-300 font-semibold pl-2">• FAMILY_PASSWORD</div>
                  <div className="text-amber-300 font-semibold pl-2">• ADMIN_PASSWORD</div>
                  <div>3. Vercel creará las funciones Serverless automáticamente.</div>
                </div>
              </div>

              {/* Option B: Cloud Run / Render / Railway */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2 text-white font-medium text-xs">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>B. Cloud Run / Render / Railway</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Servidor Node.js persistente con contenedor Docker o Nixpacks.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-500 space-y-1">
                  <div>1. Build: <code className="text-zinc-300">npm run build</code></div>
                  <div>2. Start: <code className="text-zinc-300">npm start</code></div>
                  <div>3. Configurar variables en el panel.</div>
                </div>
              </div>

              {/* Option C: VPS / Nginx */}
              <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2 text-white font-medium text-xs">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span>C. VPS Propio (Ubuntu + Nginx)</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Control total sobre almacenamiento en disco local y PM2.
                </p>
                <div className="pt-2 text-[11px] font-mono text-zinc-500 space-y-1">
                  <div>1. PM2: <code className="text-zinc-300">pm2 start dist/server.cjs</code></div>
                  <div>2. Nginx proxy pass a <code className="text-zinc-300">:3000</code></div>
                  <div>3. SSL con Certbot.</div>
                </div>
              </div>

            </div>
          </div>

          {/* Section 3: Regla de Portada 00_ */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white flex items-center space-x-2">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>3. Estructura de Carpetas e Imágenes (Regla 00_)</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Para que el sistema asigne automáticamente la portada de cada galería, el archivo debe comenzar con el prefijo <code className="text-amber-300 font-mono">00_</code> (por ejemplo <code className="text-zinc-200 font-mono">00_portada_amanecer.jpg</code>).
            </p>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400">
              <div className="text-zinc-200 font-semibold">/galerias/patagonia/</div>
              <div>├── 00_torres_del_paine_portada.jpg  ← <span className="text-amber-400">Portada automática</span></div>
              <div>├── 01_glaciar_perito_moreno.jpg</div>
              <div>├── 02_fitz_roy_estrellas.jpg</div>
              <div>└── 03_guanaco_estepa.jpg</div>
            </div>
          </div>

          {/* Section 4: Almacenamiento y CDN */}
          <div className="space-y-2 pt-2 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-white">4. Almacenamiento de Gran Escala & CDN</h3>
            <p className="text-xs text-zinc-400">
              Para galerías con miles de fotos en resolución 4K/8K, se recomienda conectar un bucket de almacenamiento compatible con S3 como <strong>Cloudflare R2</strong> (sin costos de egress) o <strong>AWS S3</strong> junto con Cloudflare CDN para entrega ultra rápida y protección contra accesos no autorizados.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs text-zinc-500">
          <span>Cami Fotos · Documentación de Despliegue</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
};
