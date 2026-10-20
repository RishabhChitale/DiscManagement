// Offline evaluation with simulated users. Each persona secretly likes a set of
// items; we let the recommender run for a few rounds and measure what it surfaces.
// This is a sanity check, not proof: simulated users are far simpler than real ones.

import { recommend, dot } from "./engine.js";
import { rng, CATS } from "./catalog.js";

export const PERSONAS = [
  { name: "Art only", groups: [it => it.cat === "Art"] },
  { name: "Music + Games", groups: [it => it.cat === "Music", it => it.cat === "Games"] },
  { name: "Art + Music + Writing", groups: [it => it.cat === "Art", it => it.cat === "Music", it => it.cat === "Writing"] },
  { name: "Pixel look (any category)", groups: [it => it.style === "pixels"] }
];


// Real catalogs have no hidden "style", so build personas from the categories present.
export function personasFor(index) {
  const counts = new Map();
  index.items.forEach(i => counts.set(i.cat, (counts.get(i.cat) || 0) + 1));
  const cats = [...counts].filter(([, n]) => n >= 10).sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const group = c => it => it.cat === c;
  const out = cats.slice(0, 2).map(c => ({ name: c + " only", groups: [group(c)] }));
  if (cats.length >= 2) out.push({ name: cats[0] + " + " + cats[1], groups: [group(cats[0]), group(cats[1])] });
  if (cats.length >= 3) out.push({ name: cats.slice(0, 3).join(" + "), groups: cats.slice(0, 3).map(group) });
  return out;
}
const ROUNDS = 5, LIMIT = 10;

function simulate(index, cfg, persona, seed) {
  const r = rng(seed * 2654435761 + 1);
  const now = Date.now(), events = [];
  const isRel = it => persona.groups.some(g => g(it));
  // Start with two saves per interest group.
  persona.groups.forEach(g => {
    const pool = index.items.filter(g);
    for (let i = 0; i < 2; i++) events.push({ id: pool[Math.floor(r() * pool.length)].id, type: "save", t: now });
  });
  let feed = [], precSum = 0;
  for (let round = 0; round < ROUNDS; round++) {
    feed = recommend(index, events, cfg, { now: now + round * 3600000, limit: LIMIT, rand: r });
    precSum += feed.filter(f => isRel(f.item)).length / Math.max(1, feed.length);
    for (const { item } of feed) {
      if (isRel(item)) events.push({ id: item.id, type: r() < 0.7 ? "save" : "view", t: now + round * 3600000 });
      else events.push({ id: item.id, type: r() < 0.15 ? "hide" : "view", t: now + round * 3600000 });
    }
  }
  const shown = feed.map(f => f.item);
  const precision = shown.filter(isRel).length / shown.length;
  const covered = persona.groups.filter(g => shown.filter(g).length >= 2).length / persona.groups.length;
  let sim = 0, pairs = 0;
  for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) { sim += dot(shown[i].vec, shown[j].vec); pairs++; }
  return { precision, avgPrecision: precSum / ROUNDS, covered, redundancy: pairs ? sim / pairs : 0 };
}

// versions: { name: cfg }. Returns one row per persona with averaged metrics.
export function runEval(index, versions, users = 30) {
  const rows = [];
  const personas = index.items.some(i => i.style) ? PERSONAS : personasFor(index);
  for (const persona of personas) {
    const row = { persona: persona.name, results: {} };
    for (const [name, cfg] of Object.entries(versions)) {
      let p = 0, c = 0, d = 0, a = 0;
      for (let u = 0; u < users; u++) {
        const m = simulate(index, cfg, persona, u + 1);
        p += m.precision; a += m.avgPrecision; c += m.covered; d += m.redundancy;
      }
      row.results[name] = { precision: p / users, avgPrecision: a / users, covered: c / users, redundancy: d / users };
    }
    rows.push(row);
  }
  return rows;
}
