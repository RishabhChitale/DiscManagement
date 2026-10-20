// Shared bootstrap: catalog -> image features -> index.
import { makeCatalog } from "./catalog.js";
import { imageFeatures } from "./features.js";
import { buildIndex } from "./engine.js";

export async function loadCatalog(n = 120) {
  const items = makeCatalog(n);
  const raw = await Promise.all(items.map(i => imageFeatures(i.svg)));
  return { items, raw };
}

export async function buildBasicIndex(n = 120) {
  const { items, raw } = await loadCatalog(n);
  return { index: buildIndex(items, raw), items, raw };
}
