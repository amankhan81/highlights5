
import React, { useState, useRef } from 'react';
import { MousePointer2, Info, Maximize2, Video, Zap } from 'lucide-react';
import { Trigger, Rect } from '../types';

interface Props {
  videoUrl: string | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  triggers: Trigger[];
  onRectDrawn: (rect: Rect) => void;
}

const VideoStage: React.FC<Props> = ({ videoUrl, videoRef, triggers, onRectDrawn }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!videoUrl || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const left = Math.min(x, startPos.x);
    const top = Math.min(y, startPos.y);
    const width = Math.abs(x - startPos.x);
    const height = Math.abs(y - startPos.y);

    setCurrentRect({ x: left, y: top, w: width, h: height });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentRect && currentRect.w > 10 && currentRect.h > 10) {
      onRectDrawn(currentRect);
    }
    setIsDrawing(false);
    setCurrentRect(null);
  };

  return (
    <div className="flex-1 bg-black/40 p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {!videoUrl ? (
        <div className="max-w-md w-full glass p-10 rounded-3xl border border-white/10 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/20">
            <Video className="w-10 h-10 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">New Project</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Upload a cricket match video to begin analyzing frames and generating highlights automatically.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-left">
             <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-emerald-400 font-bold text-xs mb-1">STEP 1</div>
                <div className="text-[10px] text-slate-300">Upload high quality MP4/WebM match source.</div>
             </div>
             <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="text-emerald-400 font-bold text-xs mb-1">STEP 2</div>
                <div className="text-[10px] text-slate-300">Draw boxes on scoreboard score updates.</div>
             </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
          <div 
            ref={containerRef}
            className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none group"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full"
              controls
              playsInline
              crossOrigin="anonymous"
              preload="auto"
              style={{ pointerEvents: isDrawing ? 'none' : 'auto' }}
            />

            {/* Triggers Overlay */}
            {triggers.map((t) => (
              <div 
                key={t.id}
                className="absolute border-2 border-yellow-400/80 bg-yellow-400/10 pointer-events-none"
                style={{
                  left: t.rect.x,
                  top: t.rect.y,
                  width: t.rect.w,
                  height: t.rect.h
                }}
              >
                <div className="absolute -top-6 left-0 bg-yellow-400 text-black text-[10px] px-1.5 py-0.5 font-bold rounded flex items-center gap-1 shadow-lg whitespace-nowrap">
                   <Info className="w-3 h-3" />
                   {t.label}
                </div>
              </div>
            ))}

            {/* Current Drawing Box */}
            {currentRect && (
              <div 
                className="absolute border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none"
                style={{
                  left: currentRect.x,
                  top: currentRect.y,
                  width: currentRect.w,
                  height: currentRect.h
                }}
              />
            )}

            {/* Controls HUD Helper */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-6 py-3 glass rounded-2xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 flex items-center gap-4 pointer-events-none">
               <div className="flex items-center gap-2 text-xs font-medium text-slate-300">
                 <MousePointer2 className="w-4 h-4 text-emerald-400" />
                 Drag anywhere to create trigger
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStage;
