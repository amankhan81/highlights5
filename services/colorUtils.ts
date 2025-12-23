
import { RGB } from '../types';

export const getAverageColor = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): RGB => {
  const imageData = ctx.getImageData(x, y, w, h);
  const data = imageData.data;
  let r = 0, g = 0, b = 0;

  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  const count = data.length / 4;
  return {
    r: Math.floor(r / count),
    g: Math.floor(g / count),
    b: Math.floor(b / count)
  };
};

export const getDistance = (c1: RGB, c2: RGB): number => {
  return Math.sqrt(
    Math.pow(c1.r - c2.r, 2) +
    Math.pow(c1.g - c2.g, 2) +
    Math.pow(c1.b - c2.b, 2)
  );
};

export const rgbToHex = (c: RGB): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
};
