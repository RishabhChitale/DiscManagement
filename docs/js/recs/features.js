// "Basic" image understanding with no ML model: rasterize to a small canvas and
// measure colour, brightness, layout and detail. Returns a plain number array.
// Everything runs in the browser; uploaded images never leave the device.

const N = 64;

function load(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = src;
  });
}

// src: svg markup string, Blob/File, or URL. Returns an N x N canvas (cover-cropped).
export async function rasterize(src, size = N) {
  let url, revoke = false;
  if (typeof src === "string" && src.trimStart().startsWith("<svg")) {
    url = URL.createObjectURL(new Blob([src], { type: "image/svg+xml" })); revoke = true;
  } else if (typeof src === "string") {
    url = src;
  } else {
    url = URL.createObjectURL(src); revoke = true;
  }
  try {
    const img = await load(url);
    const iw = img.naturalWidth || 400, ih = img.naturalHeight || 400;
    const s = Math.max(size / iw, size / ih), dw = iw * s, dh = ih * s;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    c.getContext("2d", { willReadFrequently: true }).drawImage(img, (size - dw) / 2, (size - dh) / 2, dw, dh);
    return { canvas: c, aspect: iw / ih };
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
}

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d + 6) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  return [h / 6, mx ? d / mx : 0, mx];
}

export const FEATURE_NAMES = [
  ...Array.from({ length: 12 }, (_, i) => "hue" + i),
  "sat", "val", "valSpread", "edgesX", "edgesY", "flat",
  ...Array.from({ length: 9 }, (_, i) => "cell" + i), "aspect"
];

export function featuresFromCanvas({ canvas, aspect }) {
  const { data } = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, N, N);
  const hue = new Array(12).fill(0), cell = new Array(9).fill(0), cellN = new Array(9).fill(0);
  const lum = new Float32Array(N * N);
  let sat = 0, val = 0, val2 = 0, hueMass = 0;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = (y * N + x) * 4, [h, s, v] = rgb2hsv(data[i], data[i + 1], data[i + 2]);
    const l = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    lum[y * N + x] = l / 255;
    hue[Math.min(11, Math.floor(h * 12))] += s * v; hueMass += s * v;
    sat += s; val += v; val2 += v * v;
    const c = Math.floor(y / (N / 3)) * 3 + Math.floor(x / (N / 3));
    cell[c] += l / 255; cellN[c]++;
  }
  const px = N * N;
  let ex = 0, ey = 0, flat = 0;
  for (let y = 0; y < N - 1; y++) for (let x = 0; x < N - 1; x++) {
    const a = lum[y * N + x], dx = Math.abs(a - lum[y * N + x + 1]), dy = Math.abs(a - lum[(y + 1) * N + x]);
    ex += dx; ey += dy;
    if (dx < 0.01 && dy < 0.01) flat++;
  }
  const m = val / px;
  return [
    ...hue.map(h => (hueMass ? h / hueMass : 0)),
    sat / px, m, Math.sqrt(Math.max(0, val2 / px - m * m)),
    ex / px * 4, ey / px * 4, flat / px,
    ...cell.map((c, i) => c / cellN[i]),
    Math.min(2, aspect) / 2
  ];
}

export async function imageFeatures(src) {
  return featuresFromCanvas(await rasterize(src));
}

// Plain-English colour/brightness description for the upload panel.
export function describe(f) {
  const names = ["red", "orange", "yellow", "lime", "green", "teal", "cyan", "blue", "indigo", "purple", "magenta", "pink"];
  const out = [];
  const top = f.slice(0, 12).map((v, i) => [v, i]).sort((a, b) => b[0] - a[0]);
  if (f[12] < 0.12) out.push("muted / greyscale");
  else out.push(names[top[0][1]] + " tones");
  out.push(f[13] > 0.65 ? "bright" : f[13] < 0.35 ? "dark" : "mid-brightness");
  out.push(f[17] > 0.6 ? "flat shapes" : f[15] + f[16] > 0.35 ? "high detail" : "soft detail");
  return out;
}
