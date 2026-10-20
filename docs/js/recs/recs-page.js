// Demo page: feed, taste panel, item detail, and image upload analysis.
import { makeCatalog } from "./catalog.js";
import { rasterize, featuresFromCanvas, describe } from "./features.js";
import { VERSIONS, buildIndex, recommend, similar, predictTags, profile } from "./engine.js";
import * as store from "./store.js";
import * as clip from "./clip.js";

const $ = id => document.getElementById(id);
const feedEl = $("feed"), tasteEl = $("taste"), statusEl = $("status");
const N = 240;

const items = makeCatalog(N);
let index = null, mode = "basic", events = store.load(), uploads = [];
const cache = { basic: null, clip: null };

// ---- building indexes -----------------------------------------------------
const setStatus = t => { statusEl.textContent = t; };

async function basicIndex() {
  if (cache.basic) return cache.basic;
  setStatus("Analysing images…");
  const canvases = await Promise.all(items.map(i => rasterize(i.svg)));
  const raw = canvases.map(featuresFromCanvas);
  cache.basic = buildIndex(items, raw);
  cache.basic.kind = "basic";
  return cache.basic;
}

async function clipIndex() {
  if (cache.clip) return cache.clip;
  await clip.loadClip(setStatus);
  const ids = items.map(i => i.id);
  let vecs = clip.readCache(ids);
  if (!vecs) {
    vecs = [];
    for (let i = 0; i < items.length; i++) {
      setStatus("Embedding catalog with CLIP… " + (i + 1) + "/" + items.length);
      const { canvas } = await rasterize(items[i].svg, 224);
      vecs.push(await clip.embedCanvas(canvas));
      if (i % 10 === 0) await new Promise(r => setTimeout(r));
    }
    clip.writeCache(ids, vecs);
  }
  cache.clip = buildIndex(items, vecs, { zscore: false, tagW: 0.5 });
  cache.clip.kind = "clip";
  return cache.clip;
}

// ---- rendering helpers ----------------------------------------------------
function media(it) {
  if (it.imgUrl) {
    const img = document.createElement("img");
    img.src = it.imgUrl; img.alt = it.title;
    return img;
  }
  const d = document.createElement("div");
  d.innerHTML = it.svg;
  const svg = d.firstChild;
  svg.setAttribute("aria-hidden", "true");
  svg.style.aspectRatio = it.w + " / " + it.h;
  return svg;
}

function thumb(it) {
  const m = media(it);
  m.removeAttribute("style");
  return m;
}

function savedSet() { return new Set(events.filter(e => e.type === "save").map(e => e.id)); }
const cfg = () => VERSIONS[$("algo").value];

function act(id, type) {
  if (type === "save" && savedSet().has(id)) events = store.remove(id, "save");
  else events = store.record(id, type);
  renderTaste();
  $("refresh").hidden = false;
}

function pin(rec) {
  const it = rec.item, a = document.createElement("div");
  a.className = "pin";
  const open = document.createElement("button");
  open.type = "button"; open.className = "pin-open";
  open.setAttribute("aria-label", "Open " + it.title);
  const box = document.createElement("div");
  box.className = "pin-img";
  box.append(media(it));
  open.append(box);
  open.addEventListener("click", () => openDetail(it));

  const acts = document.createElement("div");
  acts.className = "pin-acts";
  const save = document.createElement("button");
  save.type = "button"; save.textContent = "♥"; save.title = "Save";
  save.setAttribute("aria-label", "Save " + it.title);
  save.setAttribute("aria-pressed", savedSet().has(it.id));
  save.addEventListener("click", () => { act(it.id, "save"); save.setAttribute("aria-pressed", savedSet().has(it.id)); });
  const hide = document.createElement("button");
  hide.type = "button"; hide.textContent = "✕"; hide.title = "Not interested";
  hide.setAttribute("aria-label", "Not interested in " + it.title);
  hide.addEventListener("click", () => { act(it.id, "hide"); a.remove(); });
  acts.append(save, hide);

  const meta = document.createElement("div");
  meta.className = "pin-meta";
  const text = document.createElement("div");
  const b = document.createElement("b"); b.textContent = it.title;
  const s = document.createElement("span"); s.textContent = it.tags.join(" · ");
  text.append(b, s);
  meta.append(text);
  a.append(open, acts, meta);
  if (rec.reason) {
    const w = document.createElement("span");
    w.className = "why"; w.textContent = rec.reason;
    a.append(w);
  }
  return a;
}

function renderFeed() {
  const recs = recommend(index, events, cfg(), { limit: 28 });
  feedEl.replaceChildren(...recs.map(pin));
  $("refresh").hidden = true;
}

function renderTaste() {
  const prof = profile(index, events, cfg());
  if (!prof.interests.length) {
    tasteEl.innerHTML = '<p class="fine">Nothing yet. Save a few pins you like.</p>';
    return;
  }
  const frag = document.createDocumentFragment();
  prof.interests.forEach((int, n) => {
    const row = document.createElement("div");
    row.className = "interest";
    const th = document.createElement("div");
    th.className = "thumbs";
    int.members.slice().sort((a, b) => b.w - a.w).slice(0, 3).forEach(m => th.append(thumb(index.byId.get(m.id))));
    const label = document.createElement("div");
    const tagCount = new Map();
    int.members.forEach(m => index.byId.get(m.id).tags.forEach(t => tagCount.set(t, (tagCount.get(t) || 0) + m.w)));
    const top = [...tagCount].sort((a, b) => b[1] - a[1]).slice(0, 2).map(x => x[0]).join(", ");
    const strong = document.createElement("b");
    strong.textContent = "Interest " + (n + 1) + " · " + Math.round(int.weight * 100) + "%";
    const small = document.createElement("div");
    small.className = "fine"; small.textContent = top;
    label.append(strong, small);
    row.append(th, label);
    frag.append(row);
  });
  tasteEl.replaceChildren(frag);
}

// ---- detail dialog --------------------------------------------------------
function openDetail(it) {
  act(it.id, "view");
  const body = $("detail-body");
  const h = document.createElement("h2"); h.textContent = it.title;
  const chips = document.createElement("div");
  chips.className = "tagchips";
  it.tags.forEach(t => { const p = document.createElement("span"); p.className = "pill"; p.textContent = t; chips.append(p); });
  const big = document.createElement("div"); big.className = "big"; big.append(thumb(it));
  const mh = document.createElement("h3"); mh.textContent = "More like this";
  const grid = document.createElement("div"); grid.className = "mlt";
  similar(index, it.id, 8).forEach(({ item }) => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("aria-label", "Open " + item.title);
    b.append(thumb(item));
    b.addEventListener("click", () => openDetail(item));
    grid.append(b);
  });
  body.replaceChildren(h, chips, big, mh, grid);
  const dlg = $("detail");
  if (!dlg.open) dlg.showModal();
}
$("close").addEventListener("click", () => $("detail").close());

// ---- upload analysis ------------------------------------------------------
$("file").addEventListener("change", async e => {
  const file = e.target.files[0];
  if (!file) return;
  const out = $("analysis");
  out.textContent = "Analysing…";
  try {
    const url = URL.createObjectURL(file);
    const { canvas, aspect } = await rasterize(file, index.kind === "clip" ? 224 : 64);
    let raw, zs = null;
    if (index.kind === "clip") {
      raw = await clip.embedCanvas(canvas);
      zs = await clip.zeroShot(raw);
    } else {
      raw = featuresFromCanvas({ canvas, aspect });
    }
    const guess = predictTags(index, raw);
    const frag = document.createDocumentFragment();
    const prev = document.createElement("img");
    prev.src = url; prev.alt = "Your upload"; prev.style.cssText = "width:100%;border-radius:12px;margin-top:8px";
    frag.append(prev);
    const addChips = (title, list) => {
      const h = document.createElement("b"); h.textContent = title;
      const c = document.createElement("div"); c.className = "tagchips";
      list.forEach(t => { const p = document.createElement("span"); p.className = "pill"; p.textContent = t; c.append(p); });
      frag.append(h, c);
    };
    if (index.kind === "basic") addChips("Looks like", describe(raw));
    if (zs) addChips("CLIP thinks", zs.map(z => z.label.replace(/^an? /, "") + " " + Math.round(z.p * 100) + "%"));
    addChips("Predicted tags", guess.tags.slice(0, 4).map(t => t.tag + " " + Math.round(t.score * 100) + "%"));
    const nh = document.createElement("b"); nh.textContent = "Most similar existing pins";
    const near = document.createElement("div"); near.className = "interest";
    const th = document.createElement("div"); th.className = "thumbs";
    guess.near.slice(0, 4).forEach(n => th.append(thumb(n.item)));
    near.append(th);
    const publish = document.createElement("button");
    publish.type = "button"; publish.className = "btn btn-primary"; publish.textContent = "Publish to feed (cold-start test)";
    publish.addEventListener("click", () => {
      const top = guess.tags.slice(0, 3).map(t => t.tag);
      const it = index.add({
        id: "u" + Date.now(), cat: top[0] || "upload", style: "", w: 400, h: Math.round(400 / aspect),
        title: file.name.replace(/\.[^.]+$/, "").slice(0, 40) || "My upload", tags: top,
        imgUrl: url, born: Date.now(), stats: { views: 0, saves: 0 }
      }, raw, top);
      uploads.push(it);
      publish.disabled = true; publish.textContent = "Published — it now gets a new-item boost";
      renderFeed();
    });
    frag.append(nh, near, publish);
    out.replaceChildren(frag);
  } catch (err) {
    out.textContent = "Couldn't read that image: " + err.message;
  }
});

// ---- wiring ---------------------------------------------------------------
Object.entries(VERSIONS).forEach(([v, c]) => {
  const o = document.createElement("option");
  o.value = v; o.textContent = c.label;
  $("algo").append(o);
});
$("algo").value = "0.3";
$("algo").addEventListener("change", () => { renderTaste(); renderFeed(); });
$("refresh").addEventListener("click", renderFeed);
$("reset").addEventListener("click", () => { store.clear(); events = []; renderTaste(); renderFeed(); });

$("embed").addEventListener("change", async e => {
  const want = e.target.value;
  e.target.disabled = true;
  try {
    index = want === "clip" ? await clipIndex() : await basicIndex();
    mode = want;
    uploads = [];
    setStatus(want === "clip" ? "Using CLIP." : "");
    renderTaste(); renderFeed();
  } catch (err) {
    console.error(err);
    e.target.value = mode;
    setStatus("Couldn't load CLIP (" + err.message + "). Staying on basic.");
  } finally {
    e.target.disabled = false;
  }
});

(async () => {
  index = await basicIndex();
  setStatus("");
  renderTaste();
  renderFeed();
  window.__recs = { get index() { return index; }, items, get events() { return events; } };
})();
