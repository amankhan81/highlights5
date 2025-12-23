import React from 'react';
import { Settings as SettingsIcon, Zap, Trash2 } from 'lucide-react';
import { Settings, Trigger } from '../types.ts';
import { rgbToHex } from '../services/colorUtils.ts';

interface Props {
  settings: Settings;
  setSettings: (s: Settings) => void;
  triggers: Trigger[];
  onDeleteTrigger: (id: string) => void;
}

const ConfigSidebar: React.FC<Props> = ({ settings, setSettings, triggers, onDeleteTrigger }) => {
  return (
    <aside className="w-80 glass border-l border-white/10 flex flex-col h-full z-40 overflow-y-auto">
      <div className="p-5 border-b border-white/10 flex items-center gap-2">
        <SettingsIcon className="w-4 h-4 text-emerald-400" />
        <h2 className="font-bold text-sm tracking-wide uppercase text-slate-400">Settings</h2>
      </div>

      <div className="p-6 space-y-8">
        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scan Speed</label>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{settings.scanSpeed}x</span>
            </div>
            <input 
              type="range" min="1" max="8" step="1" 
              value={settings.scanSpeed} 
              onChange={(e) => setSettings({...settings, scanSpeed: parseInt(e.target.value)})}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pre-Roll</label>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{settings.preRoll}s</span>
            </div>
            <input 
              type="range" min="0" max="30" step="1" 
              value={settings.preRoll} 
              onChange={(e) => setSettings({...settings, preRoll: parseInt(e.target.value)})}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clip Length</label>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{settings.clipDuration}s</span>
            </div>
            <input 
              type="range" min="5" max="60" step="1" 
              value={settings.clipDuration} 
              onChange={(e) => setSettings({...settings, clipDuration: parseInt(e.target.value)})}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        {/* Trigger List */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
               <Zap className="w-4 h-4 text-emerald-400" />
               <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Triggers</h3>
             </div>
             <span className="text-[10px] text-slate-500 font-bold">{triggers.length}</span>
          </div>

          {triggers.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-6 text-center">
               <p className="text-[10px] text-slate-500 italic">No triggers active. Draw a box on the scoreboard to begin detection.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {triggers.map(t => (
                <div key={t.id} className="group bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: rgbToHex(t.color) }}
                    />
                    <div>
                      <p className="text-[11px] font-bold text-slate-200">{t.label}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{rgbToHex(t.color).toUpperCase()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => onDeleteTrigger(t.id)}
                    className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ConfigSidebar;