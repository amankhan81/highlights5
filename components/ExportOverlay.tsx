import React from 'react';
import { Loader2, Download, Zap, Film } from 'lucide-react';

interface Props {
  progress: number;
}

const ExportOverlay: React.FC<Props> = ({ progress }) => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative w-24 h-24 mx-auto">
           <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
           <div className="relative bg-emerald-500/20 w-full h-full rounded-3xl border border-emerald-500/40 flex items-center justify-center shadow-2xl">
              <Film className="w-10 h-10 text-emerald-400 animate-bounce" />
           </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">
            Stitching <span className="text-emerald-500">Highlight Reel</span>
          </h2>
          <p className="text-slate-400 text-sm font-medium">Please keep this window active. We're processing frames at high fidelity.</p>
        </div>

        <div className="space-y-4">
          <div className="w-full h-4 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-1">
             <div 
               className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-300 relative shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
               style={{ width: `${progress}%` }}
             >
               <div className="absolute inset-0 bg-white/20 animate-shimmer" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)', backgroundSize: '200% 100%' }} />
             </div>
          </div>
          <div className="flex justify-between items-center px-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">Rendering Frames</span>
            <span className="text-lg font-mono font-black text-emerald-400">{progress.toFixed(0)}%</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] font-bold tracking-widest uppercase">
          <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400">Native Resolution</div>
          <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-slate-400">WebM VP9</div>
          <div className="bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 text-emerald-500">30 FPS</div>
        </div>
      </div>
    </div>
  );
};

export default ExportOverlay;