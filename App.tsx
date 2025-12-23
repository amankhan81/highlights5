
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Video, Play, Square, Upload, RefreshCw, Layers, 
  Settings as SettingsIcon, Zap, Download, Trash2, 
  Clock, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { AppState, Trigger, Highlight, Settings, Rect, RGB } from './types';
import { getAverageColor, getDistance, rgbToHex } from './services/colorUtils';

import HeaderBar from './components/HeaderBar';
import HighlightsSidebar from './components/HighlightsSidebar';
import VideoStage from './components/VideoStage';
import ConfigSidebar from './components/ConfigSidebar';
import NewTriggerModal from './components/NewTriggerModal';
import ExportOverlay from './components/ExportOverlay';

const App: React.FC = () => {
  // Global State
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [progress, setProgress] = useState(0);
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [settings, setSettings] = useState<Settings>({
    scanSpeed: 4,
    preRoll: 5,
    clipDuration: 10
  });

  // UI State
  const [pendingRect, setPendingRect] = useState<Rect | null>(null);
  const [pendingColor, setPendingColor] = useState<RGB | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastMatchTimeRef = useRef<number>(0);

  // Reset
  const handleReset = useCallback(() => {
    setHighlights([]);
    setTriggers([]);
    setProgress(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
      videoRef.current.pause();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleReset();
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  // Drawing & Triggers
  const handleRectangleDrawn = (rect: Rect) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create a canvas to sample color from the current frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Map display rect to video source rect
    const videoRect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const sourceRect = {
      x: rect.x * scaleX,
      y: rect.y * scaleY,
      w: rect.w * scaleX,
      h: rect.h * scaleY
    };

    const avgColor = getAverageColor(ctx, sourceRect.x, sourceRect.y, sourceRect.w, sourceRect.h);
    
    setPendingRect(rect);
    setPendingColor(avgColor);
    setShowModal(true);
  };

  const saveTrigger = (label: string) => {
    if (!pendingRect || !pendingColor) return;
    const newTrigger: Trigger = {
      id: crypto.randomUUID(),
      label,
      rect: pendingRect,
      color: pendingColor,
      tolerance: 50
    };
    setTriggers(prev => [...prev, newTrigger]);
    setShowModal(false);
    setPendingRect(null);
    setPendingColor(null);
  };

  const deleteTrigger = (id: string) => {
    setTriggers(prev => prev.filter(t => t.id !== id));
  };

  const deleteHighlight = (id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id));
  };

  // Scanning Logic
  const startScan = () => {
    if (!videoRef.current || triggers.length === 0) return;
    setAppState('SCANNING');
    const video = videoRef.current;
    video.muted = true;
    video.playbackRate = settings.scanSpeed;
    video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const videoRect = video.getBoundingClientRect();
    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    scanIntervalRef.current = window.setInterval(() => {
      if (video.ended) {
        stopScan();
        return;
      }

      ctx.drawImage(video, 0, 0);
      setProgress((video.currentTime / video.duration) * 100);

      // Check each trigger
      for (const trigger of triggers) {
        const sourceX = trigger.rect.x * scaleX;
        const sourceY = trigger.rect.y * scaleY;
        const sourceW = trigger.rect.w * scaleX;
        const sourceH = trigger.rect.h * scaleY;

        const currentColor = getAverageColor(ctx, sourceX, sourceY, sourceW, sourceH);
        const distance = getDistance(currentColor, trigger.color);

        if (distance < trigger.tolerance) {
          // Cooldown 10 seconds
          if (video.currentTime - lastMatchTimeRef.current > 10) {
            addHighlight(video, trigger, canvas);
            lastMatchTimeRef.current = video.currentTime;
          }
        }
      }
    }, 500);
  };

  const stopScan = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setAppState('IDLE');
    if (videoRef.current) {
      videoRef.current.playbackRate = 1;
      videoRef.current.muted = false;
      videoRef.current.pause();
    }
  };

  const addHighlight = (video: HTMLVideoElement, trigger: Trigger, canvas: HTMLCanvasElement) => {
    const eventTime = video.currentTime;
    const startTime = Math.max(0, eventTime - settings.preRoll);
    
    // Generate thumbnail
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 90;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }

    const newHighlight: Highlight = {
      id: crypto.randomUUID(),
      time: startTime,
      eventTime,
      type: trigger.label,
      thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.7)
    };
    setHighlights(prev => [...prev, newHighlight]);
  };

  // Export Logic
  const startExport = async () => {
    if (!videoRef.current || highlights.length === 0) return;
    setAppState('EXPORTING');
    setExportProgress(0);

    const video = videoRef.current;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = video.videoWidth;
    exportCanvas.height = video.videoHeight;
    const ctx = exportCanvas.getContext('2d')!;

    // MediaRecorder setup
    const stream = exportCanvas.captureStream(60);
    
    // Attempt to get audio stream
    try {
      const audioStream = (video as any).captureStream ? (video as any).captureStream() : null;
      if (audioStream && audioStream.getAudioTracks().length > 0) {
        stream.addTrack(audioStream.getAudioTracks()[0]);
      }
    } catch(e) { console.warn("Audio capture not supported", e); }

    const options = { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 10000000 };
    let recorder: MediaRecorder;
    try {
       recorder = new MediaRecorder(stream, options);
    } catch (e) {
       recorder = new MediaRecorder(stream, { mimeType: 'video/webm', videoBitsPerSecond: 10000000 });
    }
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      
      // Fix duration if library available
      if ((window as any).ysFixWebmDuration) {
        (window as any).ysFixWebmDuration(blob, 0, (fixedBlob: Blob) => {
           downloadBlob(fixedBlob);
        });
      } else {
        downloadBlob(blob);
      }
      setAppState('IDLE');
    };

    recorder.start();

    // Stitching logic
    const sortedHighlights = [...highlights].sort((a, b) => a.time - b.time);
    const duration = settings.clipDuration;
    
    let lastFrame: ImageBitmap | null = null;

    for (let i = 0; i < sortedHighlights.length; i++) {
      const highlight = sortedHighlights[i];
      video.currentTime = highlight.time;
      
      // Wait for seek
      await new Promise(resolve => {
        const handler = () => {
          video.removeEventListener('seeked', handler);
          resolve(null);
        };
        video.addEventListener('seeked', handler);
      });

      const startTime = Date.now();
      const endTime = startTime + duration * 1000;
      const transitionDuration = 600;

      while (Date.now() < endTime) {
        const elapsed = Date.now() - startTime;
        
        // Transition effect (Wipe)
        if (i > 0 && elapsed < transitionDuration && lastFrame) {
          const t = elapsed / transitionDuration;
          ctx.drawImage(lastFrame, 0, 0);
          
          // Wipe from left
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, exportCanvas.width * t, exportCanvas.height);
          ctx.clip();
          ctx.drawImage(video, 0, 0);
          
          // Glow line
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 10;
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#10b981';
          ctx.beginPath();
          ctx.moveTo(exportCanvas.width * t, 0);
          ctx.lineTo(exportCanvas.width * t, exportCanvas.height);
          ctx.stroke();
          ctx.restore();
        } else {
          ctx.drawImage(video, 0, 0);
        }

        setExportProgress(((i + (elapsed / (duration * 1000))) / sortedHighlights.length) * 100);
        await new Promise(r => requestAnimationFrame(r));
      }

      // Capture last frame for next transition
      lastFrame = await createImageBitmap(video);
    }

    recorder.stop();
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cricket_highlights.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen text-slate-100 overflow-hidden">
      <HeaderBar 
        appState={appState}
        progress={progress}
        videoLoaded={!!videoUrl}
        onUpload={handleFileUpload}
        onStartScan={startScan}
        onStopScan={stopScan}
        onReset={handleReset}
        canScan={triggers.length > 0}
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Highlights */}
        <HighlightsSidebar 
          highlights={highlights}
          onJump={(time) => { if(videoRef.current) videoRef.current.currentTime = time; }}
          onDelete={deleteHighlight}
          onExport={startExport}
          isExporting={appState === 'EXPORTING'}
        />

        {/* Center - Video Stage */}
        <VideoStage 
          videoUrl={videoUrl}
          videoRef={videoRef}
          triggers={triggers}
          onRectDrawn={handleRectangleDrawn}
        />

        {/* Right Sidebar - Config */}
        <ConfigSidebar 
          settings={settings}
          setSettings={setSettings}
          triggers={triggers}
          onDeleteTrigger={deleteTrigger}
        />
      </main>

      {/* Overlays/Modals */}
      {showModal && pendingColor && (
        <NewTriggerModal 
          color={pendingColor}
          onSave={saveTrigger}
          onCancel={() => { setShowModal(false); setPendingRect(null); }}
        />
      )}

      {appState === 'EXPORTING' && (
        <ExportOverlay progress={exportProgress} />
      )}
    </div>
  );
};

export default App;
