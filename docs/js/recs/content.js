// Real images: docs/content.json is built from docs/img by scripts/build-content.ps1.
// Falls back to the generated catalog (catalog.js) when it is missing or empty.

import { rng, DAY } from "./catalog.js";

export async function loadContent() {
  try {
    const r = await fetch("content.json", { cache: "no-cache" });
    if (!r.ok) return null;
    const c = await r.json();
    return c.items && c.items.length ? c : null;
  } catch { return null; }
}

function hash(s) {
  let h = 2166136261;
  for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Real files have no engagement data yet, so views and saves are simulated (seeded by id,
// so they stay the same on every load). They only feed the small popularity prior.
export function toItems(content) {
  return content.items.map(i => {
    const r = rng(hash(i.id));
    const views = Math.floor(50 + r() * r() * 4000);
    return {
      id: i.id, cat: i.cat, title: i.title, tags: i.tags, creator: i.creator,
      w: i.w, h: i.h, thumb: i.thumb, img: i.img,
      born: Date.parse(i.added) || Date.now() - Math.floor(r() * 60) * DAY,
      stats: { views, saves: Math.floor(views * (0.01 + r() * 0.12)) }
    };
  });
}

export async function loadItems(generatedCount = 120) {
  const { makeCatalog } = await import("./catalog.js");
  const content = await loadContent();
  return content ? { items: toItems(content), real: true } : { items: makeCatalog(generatedCount), real: false };
}
