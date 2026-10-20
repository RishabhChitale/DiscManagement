// Shared bootstrap: catalog -> image features -> index.
import { imageFeatures } from "./features.js";
import { buildIndex } from "./engine.js";
import { loadItems } from "./content.js";

export async function loadCatalog(n = 120) {
  const { items, real } = await loadItems(n);
  const raw = await Promise.all(items.map(i => imageFeatures(i.svg || i.thumb)));
  return { items, raw, real };
}

export async function buildBasicIndex(n = 120) {
  const { items, raw, real } = await loadCatalog(n);
  return { index: buildIndex(items, raw), items, raw, real };
}
