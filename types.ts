
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface Trigger {
  id: string;
  label: string;
  rect: Rect;
  color: RGB;
  tolerance: number;
}

export interface Highlight {
  id: string;
  time: number; // Start time
  eventTime: number; // When detected
  type: string; // Trigger label
  thumbnail: string; // Data URL
}

export interface Settings {
  scanSpeed: number;
  preRoll: number;
  clipDuration: number;
}

export type AppState = 'IDLE' | 'SCANNING' | 'EXPORTING';
