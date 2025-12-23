import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppState, Trigger, Highlight, Settings, Rect, RGB } from './types.ts';
import { getAverageColor, getDistance, rgbToHex } from './services/colorUtils.ts';

import HeaderBar from './components/HeaderBar.tsx';
import HighlightsSidebar from './components/HighlightsSidebar.tsx';
import VideoStage from './components/VideoStage.tsx';
import ConfigSidebar from './components/ConfigSidebar.tsx';
import NewTriggerModal from './components/NewTriggerModal.tsx';
import ExportOverlay from './components/ExportOverlay.tsx';

const App: React.FC = () => {
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

  const [pendingRect, setPendingRect] = useState<Rect | null>(null);
  const [pendingColor, setPendingColor] = useState<RGB | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastMatchTimeRef = useRef<number>(0);

  const waitForSeek = (video: HTMLVideoElement, time: number) => {
    return new Promise<void>((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        if ('requestVideoFrameCallback' in video) {
          (video as any).requestVideoFrameCallback(() => resolve());
        } else {
          setTimeout(resolve, 150);
        }
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = time;
    });
  };

  const handleReset = useCallback(() => {
    setHighlights([]);
    setTriggers([]);
    setProgress(0);
    lastMatchTimeRef.current = 0;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
      videoRef.current.pause();
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      handleReset();
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const handleRectangleDrawn = (rect: Rect) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

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

  const deleteTrigger = (id: string) => setTriggers(prev => prev.filter(t => t.id !== id));
  const deleteHighlight = (id: string) => setHighlights(prev => prev.filter(h => h.id !== id));

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
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

      for (const trigger of triggers) {
        const sourceX = trigger.rect.x * scaleX;
        const sourceY = trigger.rect.y * scaleY;
        const sourceW = trigger.rect.w * scaleX;
        const sourceH = trigger.rect.h * scaleY;

        const currentColor = getAverageColor(ctx, sourceX, sourceY, sourceW, sourceH);
        const distance = getDistance(currentColor, trigger.color);

        if (distance < trigger.tolerance) {
          if (video.currentTime - lastMatchTimeRef.current > 10) {
            addHighlight(video, trigger, canvas);
            lastMatchTimeRef.current = video.currentTime;
          }
        }
      }
    }, 100); 
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
    
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 160;
    thumbCanvas.height = 90;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      thumbCtx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
    }

    setHighlights(prev => [...prev, {
      id: crypto.randomUUID(),
      time: startTime,
      eventTime,
      type: trigger.label,
      thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.8)
    }]);
  };

  const startExport = async () => {
    if (!videoRef.current || highlights.length === 0) return;
    
    const video = videoRef.current;
    const originalRate = video.playbackRate;
    const originalMuted = video.muted;
    const originalTime = video.currentTime;

    setAppState('EXPORTING');
    setExportProgress(0);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = video.videoWidth;
    exportCanvas.height = video.videoHeight;
    const ctx = exportCanvas.getContext('2d', { alpha: false })!;

    const stream = exportCanvas.captureStream(30);
    
    try {
      const videoStream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
      if (videoStream && videoStream.getAudioTracks().length > 0) {
        stream.addTrack(videoStream.getAudioTracks()[0]);
      }
    } catch(e) { console.warn("Audio capture failed", e); }

    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
      ? 'video/webm;codecs=vp9,opus' 
      : 'video/webm';
    
    const recorder = new MediaRecorder(stream, { 
      mimeType, 
      videoBitsPerSecond: 12000000 
    });
    
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    
    const totalDurationMs = highlights.length * settings.clipDuration * 1000;

    const exportPromise = new Promise<void>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        if ((window as any).ysFixWebmDuration) {
          (window as any).ysFixWebmDuration(blob, totalDurationMs, (fixedBlob: Blob) => {
             const url = URL.createObjectURL(fixedBlob);
             const a = document.createElement('a');
             a.href = url;
             a.download = `cricket_highlights_${Date.now()}.webm`;
             a.click();
             resolve();
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `cricket_highlights_${Date.now()}.webm`;
          a.click();
          resolve();
        }
      };
    });

    recorder.start();
    video.muted = true;
    video.playbackRate = 1.0;

    const sortedHighlights = [...highlights].sort((a, b) => a.time - b.time);
    const clipDuration = settings.clipDuration;
    let lastFrame: ImageBitmap | null = null;

    for (let i = 0; i < sortedHighlights.length; i++) {
      const highlight = sortedHighlights[i];
      await waitForSeek(video, highlight.time);

      const startTime = video.currentTime;
      const endTime = Math.min(video.duration, startTime + clipDuration);
      const transitionDuration = 0.6;

      video.play();

      while (video.currentTime < endTime && !video.ended) {
        const currentRelative = video.currentTime - startTime;
        
        if (i > 0 && currentRelative < transitionDuration && lastFrame) {
          const t = currentRelative / transitionDuration;
          ctx.drawImage(lastFrame, 0, 0);
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, exportCanvas.width * t, exportCanvas.height);
          ctx.clip();
          ctx.drawImage(video, 0, 0);
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

        setExportProgress(((i + (currentRelative / clipDuration)) / sortedHighlights.length) * 100);
        await new Promise(r => requestAnimationFrame(r));
      }

      video.pause();
      if (lastFrame) lastFrame.close();
      lastFrame = await createImageBitmap(video);
    }

    recorder.stop();
    await exportPromise;

    video.muted = originalMuted;
    video.playbackRate = originalRate;
    video.currentTime = originalTime;
    setAppState('IDLE');
  };

  return (
    <div className="flex flex-col h-screen text-slate-100 overflow-hidden bg-[#020617]">
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
        <HighlightsSidebar 
          highlights={highlights}
          onJump={(time) => { if(videoRef.current) videoRef.current.currentTime = time; }}
          onDelete={deleteHighlight}
          onExport={startExport}
          isExporting={appState === 'EXPORTING'}
        />
        <VideoStage 
          videoUrl={videoUrl}
          videoRef={videoRef}
          triggers={triggers}
          onRectDrawn={handleRectangleDrawn}
        />
        <ConfigSidebar 
          settings={settings}
          setSettings={setSettings}
          triggers={triggers}
          onDeleteTrigger={deleteTrigger}
        />
      </main>
      {showModal && pendingColor && (
        <NewTriggerModal 
          color={pendingColor}
          onSave={saveTrigger}
          onCancel={() => { setShowModal(false); setPendingRect(null); }}
        />
      )}
      {appState === 'EXPORTING' && <ExportOverlay progress={exportProgress} />}
    </div>
  );
};

export default App;