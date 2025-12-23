
import React from 'react';
import { Video, Upload, Play, Square, RefreshCw, Zap, User } from 'lucide-react';
import { AppState } from '../types';

interface Props {
  appState: AppState;
  progress: number;
  videoLoaded: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStartScan: () => void;
  onStopScan: () => void;
  onReset: () => void;
  canScan: boolean;
}

const HeaderBar: React.FC<Props> = ({ 
  appState, progress, videoLoaded, onUpload, onStartScan, onStopScan, onReset, canScan 
}) => {
  return (
    <header className="h-20 glass flex items-center justify-between px-6 border-b border-white/10 z-50">
      <div className="flex items-center gap-4">
        <div className="bg-emerald-500/20 p-2.5 rounded-xl border border-emerald-500/30">
          <Zap className="w-6 h-6 text-emerald-400 fill-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            Cricket<span className="text-emerald-500">Scan</span> AI
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">Pro Edition</p>
        </div>
      </div>

      <div className="hidden md:flex bg-white/5 border border-white/10 px-4 py-1.5 rounded-full items-center gap-2">
        <User className="w-4 h-4 text-slate-400" />
        <span className="text-xs font-semibold text-slate-300">Created by Amanullah Khan</span>
      </div>

      <div className="flex items-center gap-3">
        {!videoLoaded ? (
          <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl cursor-pointer transition-all shadow-lg shadow-emerald-500/20 font-bold active:scale-95">
            <Upload className="w-4 h-4" />
            Upload Video
            <input type="file" accept="video/*" className="hidden" onChange={onUpload} />
          </label>
        ) : appState === 'SCANNING' ? (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
               <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
               </div>
               <span className="text-xs font-mono font-bold text-emerald-400">{progress.toFixed(1)}%</span>
            </div>
            <button 
              onClick={onStopScan}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-red-500/20 font-bold active:scale-95"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop Scan
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
             <button 
              onClick={onReset}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              title="Reset All"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={onStartScan}
              disabled={!canScan}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${
                canScan 
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              Start Scan
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default HeaderBar;
