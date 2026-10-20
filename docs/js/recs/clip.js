// Optional CLIP embeddings (v0.4). Runs entirely in the browser through transformers.js;
// the model (~90 MB) is downloaded once from the Hugging Face hub and cached by the browser.
// Nothing about the images is sent anywhere.

import { normalize } from "./engine.js";

const LIB = "https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2";
const MODEL = "Xenova/clip-vit-base-patch32";
let lib, processor, vision, tokenizer, text, labelVecs;

export const LABELS = [
  "a landscape painting", "a portrait", "an ink drawing", "a pencil sketch", "a watercolor painting", "digital art",
  "pixel art", "a video game screenshot", "a game sprite sheet", "a 3D render", "an anime illustration", "a cartoon",
  "an album cover", "a music studio", "a concert", "handwritten lyrics", "sheet music",
  "a book cover", "a fantasy map", "a page of text", "a poem", "typography",
  "a photograph of nature", "a photograph of a person", "a photograph of food", "a photograph of a city", "an animal",
  "abstract shapes", "a colorful gradient", "a minimalist design", "a logo", "a meme"
];

export async function loadClip(onStatus = () => {}) {
  if (vision) return;
  onStatus("Loading CLIP library…");
  lib ||= await import(LIB);
  lib.env.allowLocalModels = false;
  onStatus("Downloading CLIP model (about 90 MB, cached afterwards)…");
  [processor, vision, tokenizer, text] = await Promise.all([
    lib.AutoProcessor.from_pretrained(MODEL),
    lib.CLIPVisionModelWithProjection.from_pretrained(MODEL),
    lib.AutoTokenizer.from_pretrained(MODEL),
    lib.CLIPTextModelWithProjection.from_pretrained(MODEL)
  ]);
}

export async function embedCanvas(canvas) {
  const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
  const img = await lib.RawImage.fromBlob(blob);
  const { image_embeds } = await vision(await processor(img));
  return Array.from(normalize(Array.from(image_embeds.data)));
}

async function embedTexts(strings) {
  const { text_embeds } = await text(tokenizer(strings, { padding: true, truncation: true }));
  const d = text_embeds.dims[1];
  return strings.map((_, i) => normalize(Array.from(text_embeds.data.slice(i * d, (i + 1) * d))));
}

// Zero-shot labelling: compare the image vector with a text vector per label.
export async function zeroShot(imgVec, top = 5) {
  labelVecs ||= await embedTexts(LABELS);
  const sims = labelVecs.map(v => 100 * v.reduce((s, x, i) => s + x * imgVec[i], 0));
  const m = Math.max(...sims), exps = sims.map(s => Math.exp(s - m)), z = exps.reduce((a, b) => a + b, 0);
  return LABELS.map((l, i) => ({ label: l, p: exps[i] / z })).sort((a, b) => b.p - a.p).slice(0, top);
}

// Catalog embeddings are cached (8-bit quantised) so the second visit is instant.
const CACHE = "f95.recs.clip.v1";
export function readCache(ids) {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE));
    if (!c || c.ids !== ids.join(",")) return null;
    return c.vecs.map(s => Array.from(atob(s), ch => (ch.charCodeAt(0) - 127) / 127 * c.scale));
  } catch { return null; }
}
export function writeCache(ids, vecs) {
  try {
    const scale = Math.max(...vecs.flat().map(Math.abs));
    const enc = v => btoa(String.fromCharCode(...v.map(x => Math.round(x / scale * 127) + 127)));
    localStorage.setItem(CACHE, JSON.stringify({ ids: ids.join(","), scale, vecs: vecs.map(enc) }));
  } catch { /* cache is optional */ }
}
