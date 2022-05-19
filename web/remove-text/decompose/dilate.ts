// https://github.com/kig/canvasfilters/blob/master/filters.js

const horizontalConvolve = function (
  pixels: ImageData,
  weightsVector: Float32Array,
  opaque: Boolean
) {
  const side = weightsVector.length;
  const halfSide = Math.floor(side / 2);

  const src = pixels.data;
  const sw = pixels.width;
  const sh = pixels.height;

  const w = sw;
  const h = sh;
  const dst = pixels.data;

  const alphaFac = opaque ? 1 : 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let cx = 0; cx < side; cx++) {
        const scy = sy;
        const scx = Math.min(sw - 1, Math.max(0, sx + cx - halfSide));
        const srcOff = (scy * sw + scx) * 4;
        const wt = weightsVector[cx];
        r += src[srcOff] * wt;
        g += src[srcOff + 1] * wt;
        b += src[srcOff + 2] * wt;
        a += src[srcOff + 3] * wt;
      }
      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = a + alphaFac * (255 - a);
    }
  }
  return pixels;
};

const verticalConvolveFloat32 = function (
  pixels: ImageData,
  weightsVector: Float32Array,
  opaque: Boolean
) {
  const side = weightsVector.length;
  const halfSide = Math.floor(side / 2);

  const src = pixels.data;
  const sw = pixels.width;
  const sh = pixels.height;

  const w = sw;
  const h = sh;
  const dst = pixels.data;

  const alphaFac = opaque ? 1 : 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const sy = y;
      const sx = x;
      const dstOff = (y * w + x) * 4;
      let r = 0,
        g = 0,
        b = 0,
        a = 0;
      for (let cy = 0; cy < side; cy++) {
        const scy = Math.min(sh - 1, Math.max(0, sy + cy - halfSide));
        const scx = sx;
        const srcOff = (scy * sw + scx) * 4;
        const wt = weightsVector[cy];
        r += src[srcOff] * wt;
        g += src[srcOff + 1] * wt;
        b += src[srcOff + 2] * wt;
        a += src[srcOff + 3] * wt;
      }
      dst[dstOff] = r;
      dst[dstOff + 1] = g;
      dst[dstOff + 2] = b;
      dst[dstOff + 3] = a + alphaFac * (255 - a);
    }
  }
  return pixels;
};

const separableConvolve = function (
  pixels: ImageData,
  horizWeights: Float32Array,
  vertWeights: Float32Array,
  opaque: Boolean
) {
  return horizontalConvolve(
    verticalConvolveFloat32(pixels, vertWeights, opaque),
    horizWeights,
    opaque
  );
};

const gaussianBlur = function (pixels: ImageData, diameter: number) {
  diameter = Math.abs(diameter);
  const radius = diameter / 2;
  const len = Math.ceil(diameter) + (1 - (Math.ceil(diameter) % 2));
  const weights = new Float32Array(len);
  const rho = (radius + 0.5) / 3;
  const rhoSq = rho * rho;
  const gaussianFactor = 1 / Math.sqrt(2 * Math.PI * rhoSq);
  const rhoFactor = -1 / (2 * rho * rho);
  const middle = Math.floor(len / 2);
  let wsum = 0;
  for (let i = 0; i < len; i++) {
    const x = i - middle;
    const gx = gaussianFactor * Math.exp(x * x * rhoFactor);
    weights[i] = gx;
    wsum += gx;
  }
  for (let i = 0; i < weights.length; i++) {
    weights[i] /= wsum;
  }
  return separableConvolve(pixels, weights, weights, false);
};

const threshold = function (
  pixels: ImageData,
  threshold: number = 0.5,
  high = 255,
  low = 0
) {
  const d = pixels.data;
  const dst = pixels.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const v = 0.3 * r + 0.59 * g + 0.11 * b >= threshold ? high : low;
    dst[i] = dst[i + 1] = dst[i + 2] = v;
    dst[i + 3] = d[i + 3];
  }
  return pixels;
};

export function dilate(ctx: CanvasRenderingContext2D, diameter: number = 30) {
  const pixels = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  gaussianBlur(pixels, diameter);
  threshold(pixels, 0.5);
  ctx.putImageData(pixels, 0, 0);
}
