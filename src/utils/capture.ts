type FrameSource = HTMLVideoElement | HTMLCanvasElement;

function sourceSize(src: FrameSource): { w: number; h: number } {
  return src instanceof HTMLVideoElement
    ? { w: src.videoWidth, h: src.videoHeight }
    : { w: src.width, h: src.height };
}

// Variance of the Laplacian on a small grayscale copy: higher = sharper,
// motion-blurred frames score noticeably lower.
export function sharpnessScore(src: FrameSource, probe: HTMLCanvasElement): number {
  const { w, h } = sourceSize(src);
  const side = Math.min(w, h);
  const ctx = probe.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, probe.width, probe.height);
  const { data } = ctx.getImageData(0, 0, probe.width, probe.height);
  const n = probe.width;
  const gray = new Float32Array(n * n);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114;
  }
  let sum = 0;
  let sumSq = 0;
  let count = 0;
  for (let y = 1; y < n - 1; y++) {
    for (let x = 1; x < n - 1; x++) {
      const i = y * n + x;
      const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - n] - gray[i + n];
      sum += lap;
      sumSq += lap * lap;
      count++;
    }
  }
  const mean = sum / count;
  return sumSq / count - mean * mean;
}

// Grabs several frames over a short window and keeps the sharpest one, so the
// shake caused by tapping the shutter does not end up in the saved photo.
export async function captureSharpestSquare(
  src: FrameSource,
  { frames = 8, intervalMs = 45, quality = 0.95 } = {}
): Promise<Blob> {
  const { w, h } = sourceSize(src);
  const side = Math.min(w, h);
  const probe = document.createElement("canvas");
  probe.width = 160;
  probe.height = 160;
  const best = document.createElement("canvas");
  best.width = side;
  best.height = side;
  const bestCtx = best.getContext("2d")!;

  let bestScore = -1;
  for (let i = 0; i < frames; i++) {
    const score = sharpnessScore(src, probe);
    if (score > bestScore) {
      bestScore = score;
      bestCtx.drawImage(src, (w - side) / 2, (h - side) / 2, side, side, 0, 0, side, side);
    }
    if (i < frames - 1) await new Promise((r) => setTimeout(r, intervalMs));
  }

  return new Promise((resolve, reject) =>
    best.toBlob((b) => (b ? resolve(b) : reject(new Error("capture failed"))), "image/jpeg", quality)
  );
}
