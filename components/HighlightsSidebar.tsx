
import React from 'react';
/* Add Play to the imports */
import { Layers, Download, Clock, Trash2, Video, Loader2, Play } from 'lucide-react';
import { Highlight } from '../types';

interface Props {
  highlights: Highlight[];
  onJump: (time: number) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  isExporting: boolean;
}

const HighlightsSidebar: React.FC<Props> = ({ highlights, onJump, onDelete, onExport, isExporting }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-72 glass border-r border-white/10 flex flex-col h-full z-40">
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-sm tracking-wide uppercase text-slate-400">Highlights</h2>
        </div>
        <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-500/30">
          {highlights.length} FOUND
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-2 opacity-50">
            <Video className="w-8 h-8" />
            <p className="text-xs text-center px-4">No highlights detected yet. Start scanning to capture events.</p>
          </div>
        ) : (
          highlights.map((h) => (
            <div 
              key={h.id}
              onClick={() => onJump(h.time)}
              className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl overflow-hidden cursor-pointer transition-all"
            >
              <div className="aspect-video w-full relative">
                <img src={h.thumbnail} className="w-full h-full object-cover" alt="Preview" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Play className="w-8 h-8 text-white fill-white" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                  {formatTime(h.time)}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter truncate max-w-[120px]">
                    {h.type}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(h.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {highlights.length > 0 && (
        <div className="p-4 bg-slate-900/50 border-t border-white/10">
          <button 
            onClick={onExport}
            disabled={isExporting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isExporting ? 'Stitching Reel...' : 'Export Reel'}
          </button>
        </div>
      )}
    </aside>
  );
};

export default HighlightsSidebar;
