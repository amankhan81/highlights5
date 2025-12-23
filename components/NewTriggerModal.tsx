
import React, { useState } from 'react';
import { RGB } from '../types';
import { rgbToHex } from '../services/colorUtils';
import { Zap, Check, X } from 'lucide-react';

interface Props {
  color: RGB;
  onSave: (label: string) => void;
  onCancel: () => void;
}

const NewTriggerModal: React.FC<Props> = ({ color, onSave, onCancel }) => {
  const [label, setLabel] = useState('Highlight Point');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass max-w-sm w-full rounded-3xl overflow-hidden border border-emerald-500/20 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
               <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Create Trigger</h3>
              <p className="text-xs text-slate-400 tracking-wide uppercase">AI Event Detection</p>
            </div>
          </div>

          <div className="space-y-4">
             <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl shadow-lg border-2 border-white/20"
                  style={{ backgroundColor: rgbToHex(color) }}
                />
                <div>
                   <label className="text-[10px] font-bold text-slate-500 uppercase">Detected Base Color</label>
                   <p className="font-mono text-xl font-bold text-emerald-400">{rgbToHex(color).toUpperCase()}</p>
                   <p className="text-[10px] text-slate-400 mt-1">AI will match this exact hue with 5% tolerance.</p>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase ml-2">Event Label</label>
                <input 
                  autoFocus
                  type="text" 
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  placeholder="e.g. Boundary, Wicket, Score Update"
                />
             </div>
          </div>

          <div className="flex gap-3">
             <button 
                onClick={onCancel}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-bold transition-all text-sm flex items-center justify-center gap-2"
             >
                <X className="w-4 h-4" />
                Cancel
             </button>
             <button 
                onClick={() => onSave(label)}
                className="flex-[2] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
             >
                <Check className="w-4 h-4" />
                Add Trigger
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewTriggerModal;
