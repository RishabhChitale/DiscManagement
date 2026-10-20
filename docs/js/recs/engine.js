// Recommendation engine. Pure functions, no DOM, so the same code runs in the
// demo page and in the offline evaluation.
//
//   items + image features -> buildIndex -> vectors
//   events (view/save/hide) -> profile -> interests
//   interests + index      -> recommend -> ranked feed with reasons

export const VERSIONS = {
  "0.1": { label: "v0.1 single taste vector", multi: false, k: 1, mmr: 1, explore: 0, cold: 0, popW: 0.15 },
  "0.2": { label: "v0.2 multi-interest + diversity", multi: true, k: 3, mmr: 0.7, explore: 0.1, cold: 0.15, popW: 0.15 },
  "0.3": { label: "v0.3 clusters + overall taste blend", multi: true, k: 3, mmr: 0.7, explore: 0.1, cold: 0.15, popW: 0.15, minPer: 2, blend: 0.5 }
};

export const EVENT_WEIGHT = { view: 0.3, save: 2, hide: -1.5 };
const HALF_LIFE_DAYS = 14;
const DAY = 86400000;

// ---- vector helpers -------------------------------------------------------
export const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
export function normalize(v) {
  const n = Math.sqrt(dot(v, v)) || 1;
  return v.map(x => x / n);
}
function addScaled(acc, v, w) { for (let i = 0; i < acc.length; i++) acc[i] += v[i] * w; return acc; }

// ---- index ----------------------------------------------------------------
// visual: one feature array per item (from features.js or CLIP).
// Features are centred (and optionally z-scored) across the catalog so cosine
// measures what makes an item different from the average item.
const indexMethods = {
  visualVec(raw) {
    return normalize(raw.map((x, d) => (x - this.mean[d]) / this.std[d]));
  },
  tagVec(tags) {
    const t = new Array(this.vocab.length).fill(0);
    for (const g of tags) { const i = this.vocab.indexOf(g); if (i >= 0) t[i] = 1; }
    return normalize(t);
  },
  // Add an item later (e.g. a fresh upload) without recomputing the catalog statistics.
  add(item, rawVisual, tags = item.tags) {
    const vis = this.visualVec(rawVisual);
    const vec = normalize([...vis.map(x => x * this.visW), ...this.tagVec(tags).map(x => x * this.tagW)]);
    const entry = { ...item, vis, vec };
    this.items.push(entry);
    this.byId.set(entry.id, entry);
    return entry;
  }
};

export function buildIndex(items, visual, { visW = 1, tagW = 0.7, zscore = true } = {}) {
  const dv = visual[0].length, n = items.length;
  const mean = new Array(dv).fill(0), std = new Array(dv).fill(1);
  for (const v of visual) addScaled(mean, v, 1 / n);
  if (zscore) {
    std.fill(0);
    for (const v of visual) for (let d = 0; d < dv; d++) std[d] += (v[d] - mean[d]) ** 2 / n;
    for (let d = 0; d < dv; d++) std[d] = Math.sqrt(std[d]) || 1;
  }
  const index = Object.assign({ items: [], byId: new Map() }, indexMethods, {
    mean, std, dv, visW, tagW, vocab: [...new Set(items.flatMap(i => i.tags))].sort()
  });
  items.forEach((it, i) => index.add(it, visual[i]));
  return index;
}

// Auto-categorise an image with no metadata: look at its nearest catalog
// neighbours (visual part only) and let them vote on tags.
export function predictTags(index, rawVisual, k = 7) {
  const vis = index.visualVec(rawVisual);
  const near = index.items.map(it => ({ it, s: dot(vis, it.vis) })).sort((a, b) => b.s - a.s).slice(0, k);
  const votes = new Map();
  for (const { it, s } of near) for (const t of it.tags) votes.set(t, (votes.get(t) || 0) + Math.max(0, s));
  const total = near.reduce((a, b) => a + Math.max(0, b.s), 0) || 1;
  const tags = [...votes].map(([tag, v]) => ({ tag, score: v / total })).sort((a, b) => b.score - a.score);
  return { tags, near: near.map(({ it, s }) => ({ item: it, score: s })) };
}

// ---- user profile ---------------------------------------------------------
function decay(t, now) { return Math.pow(0.5, Math.max(0, now - t) / DAY / HALF_LIFE_DAYS); }

// Sum event weights per item (newer events count more).
export function itemWeights(events, now) {
  const w = new Map();
  for (const e of events) w.set(e.id, (w.get(e.id) || 0) + (EVENT_WEIGHT[e.type] ?? 0) * decay(e.t, now));
  return w;
}

// Spherical k-means over positively weighted items. Deterministic seeding:
// start from the heaviest item, then repeatedly take the point least like any chosen centre.
function kmeans(points, k) {
  if (points.length <= k) return points.map(p => ({ vec: p.vec, members: [p] }));
  const centres = [points.reduce((a, b) => (b.w > a.w ? b : a)).vec];
  while (centres.length < k) {
    let best = null, bestSim = 2;
    for (const p of points) {
      const s = Math.max(...centres.map(c => dot(c, p.vec)));
      if (s < bestSim) { bestSim = s; best = p; }
    }
    centres.push(best.vec);
  }
  let groups = [];
  for (let iter = 0; iter < 8; iter++) {
    groups = centres.map(() => []);
    for (const p of points) {
      let bi = 0, bs = -2;
      centres.forEach((c, i) => { const s = dot(c, p.vec); if (s > bs) { bs = s; bi = i; } });
      groups[bi].push(p);
    }
    groups.forEach((g, i) => {
      if (!g.length) return;
      const acc = new Array(g[0].vec.length).fill(0);
      g.forEach(p => addScaled(acc, p.vec, p.w));
      centres[i] = normalize(acc);
    });
  }
  return groups.map((g, i) => ({ vec: centres[i], members: g })).filter(g => g.members.length);
}

export function profile(index, events, cfg, now = Date.now()) {
  const weights = itemWeights(events, now);
  const pos = [], neg = [];
  for (const [id, w] of weights) {
    const it = index.byId.get(id);
    if (!it) continue;
    if (w > 0.05) pos.push({ id, vec: it.vec, w });
    else if (w < -0.05) neg.push({ id, vec: it.vec, w });
  }
  if (!pos.length) return { interests: [], neg, pos, global: null };
  const total = pos.reduce((a, p) => a + p.w, 0);
  // Rocchio: move toward what they liked, a little away from what they hid.
  const acc = new Array(pos[0].vec.length).fill(0);
  pos.forEach(p => addScaled(acc, p.vec, p.w));
  neg.forEach(p => addScaled(acc, p.vec, 0.5 * p.w));
  const global = normalize(acc);
  let interests;
  if (!cfg.multi) {
    interests = [{ vec: global, weight: 1, members: pos }];
  } else {
    const k = Math.max(1, Math.min(cfg.k, Math.floor(pos.length / (cfg.minPer || 1))));
    const groups = kmeans(pos, k);
    interests = groups
      .map(g => ({ vec: g.vec, members: g.members, weight: g.members.reduce((a, p) => a + p.w, 0) / total }))
      .filter(g => g.weight >= 0.12)
      .sort((a, b) => b.weight - a.weight);
  }
  return { interests, neg, pos, global };
}

// ---- ranking --------------------------------------------------------------
function popularity(index) {
  const raw = index.items.map(it => (it.stats.saves + 2) / (it.stats.views + 40));
  const sorted = [...raw].sort((a, b) => a - b);
  return new Map(index.items.map((it, i) => [it.id, sorted.indexOf(raw[i]) / Math.max(1, sorted.length - 1)]));
}

export function recommend(index, events, cfg, { now = Date.now(), limit = 24, rand = Math.random, minAgeDays = 0 } = {}) {
  const prof = profile(index, events, cfg, now);
  const seen = new Map();
  for (const e of events) {
    const s = seen.get(e.id) || {};
    if (e.type === "save") s.saved = true;
    if (e.type === "hide") s.hidden = true;
    if (e.type === "view") s.viewed = true;
    seen.set(e.id, s);
  }
  const pop = popularity(index);
  const maxW = Math.max(...prof.interests.map(i => i.weight), 1e-9);
  const hiddenVecs = prof.neg.map(n => n.vec);

  const scored = [];
  for (const it of index.items) {
    const s = seen.get(it.id) || {};
    if (s.saved || s.hidden) continue;
    let rel = 0, interest = null;
    for (const int of prof.interests) {
      const r = dot(int.vec, it.vec) * (0.75 + 0.25 * int.weight / maxW);
      if (!interest || r > rel) { rel = r; interest = int; }
    }
    if (cfg.blend && prof.global) rel = (1 - cfg.blend) * rel + cfg.blend * dot(prof.global, it.vec);
    let score = rel + cfg.popW * pop.get(it.id);
    const ageDays = (now - it.born) / DAY;
    const fresh = cfg.cold * Math.exp(-ageDays / 3);
    score += fresh;
    if (cfg.multi && hiddenVecs.length) {
      const p = Math.max(...hiddenVecs.map(h => dot(h, it.vec)));
      score -= 0.3 * Math.max(0, (p - 0.7) / 0.3);
    }
    if (s.viewed) score -= 0.15;
    scored.push({ item: it, score, rel, fresh, interest });
  }
  scored.sort((a, b) => b.score - a.score);

  // Reserve some slots for exploration (random picks from the unranked tail).
  const mmrW = cfg.mmr;
  const nExplore = Math.round(cfg.explore * limit);
  const poolSize = Math.min(scored.length, limit * 4);
  const pool = scored.slice(0, poolSize), tail = scored.slice(poolSize);
  const mainSlots = limit - Math.min(nExplore, tail.length);

  // MMR: greedily pick the best score, penalising similarity to what is already chosen.
  const lo = pool.length ? pool[pool.length - 1].score : 0, hi = pool.length ? pool[0].score : 1;
  const span = hi - lo || 1;
  const chosen = [];
  const left = pool.slice();
  while (chosen.length < mainSlots && left.length) {
    let bi = 0, bv = -Infinity;
    left.forEach((c, i) => {
      const redundancy = chosen.length ? Math.max(...chosen.map(x => dot(x.item.vec, c.item.vec))) : 0;
      const v = mmrW * ((c.score - lo) / span) - (1 - mmrW) * redundancy;
      if (v > bv) { bv = v; bi = i; }
    });
    chosen.push(left.splice(bi, 1)[0]);
  }
  chosen.forEach(c => { c.reason = explain(index, prof, c, now); });

  const out = chosen.slice();
  for (let i = 0; i < nExplore && tail.length; i++) {
    const pick = tail.splice(Math.floor(rand() * tail.length), 1)[0];
    pick.reason = "Something different";
    // spread exploration through the feed instead of putting it all at the end
    out.splice(Math.min(out.length, 3 + i * Math.floor(limit / (nExplore + 1))), 0, pick);
  }
  return out;
}

function explain(index, prof, c, now) {
  if (c.interest && c.rel > 0.05) {
    let best = null, bs = -2;
    for (const m of c.interest.members) {
      const s = dot(m.vec, c.item.vec);
      if (s > bs) { bs = s; best = m; }
    }
    const anchor = best && index.byId.get(best.id);
    if (anchor) return "Because you saved “" + anchor.title + "”";
  }
  if (c.fresh > 0.08) return "New on F95";
  return "Popular right now";
}

// "More like this" for an item detail view.
export function similar(index, id, n = 8) {
  const base = index.byId.get(id);
  return index.items.filter(it => it.id !== id)
    .map(it => ({ item: it, score: dot(base.vec, it.vec) }))
    .sort((a, b) => b.score - a.score).slice(0, n);
}
