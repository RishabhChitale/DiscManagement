// Roadmap page. All content comes from the data below; edit it when an iteration ships.
// status: done | next | later

const STATUS = {
  done: { label: "Done", icon: "✓" },
  next: { label: "Next", icon: "→" },
  later: { label: "Later", icon: "○" }
};

const MILESTONES = [
  { v: "v0.1", title: "Baseline", status: "done", metric: "75% avg precision",
    points: ["Image features from colour, layout and detail", "One taste vector from saves", "Upload analyser"] },
  { v: "v0.2", title: "Multi-interest", status: "done", metric: "+25 pts coverage, multi-interest users",
    points: ["Up to 3 interests per user", "Diversity re-ranking, exploration slots", "Boost for brand-new uploads"] },
  { v: "v0.3", title: "Steadier interests", status: "done", metric: "88% coverage",
    points: ["At least 2 saves per interest", "Blend with overall taste"] },
  { v: "v0.4", title: "CLIP image understanding", status: "done", metric: "91% last-round precision (was 55%)",
    points: ["In-browser CLIP model", "Zero-shot labels for uploads", "Cached embeddings"] },
  { v: "v0.5", title: "Tune and tag", status: "next", metric: "",
    points: ["Re-tune diversity per embedding type", "CLIP labels become tags for new uploads", "Adaptive number of interests", "Better evaluation set"] },
  { v: "v0.6", title: "Real data", status: "later", metric: "",
    points: ["Server with vector database", "Accounts and event logging", "Embed each upload once, on the server"] },
  { v: "v0.7", title: "Learn from users", status: "later", metric: "",
    points: ["Collaborative filtering", "Learned ranker", "A/B testing", "Dwell time and richer signals"] },
  { v: "v0.8", title: "Safety and scale", status: "later", metric: "",
    points: ["Upload moderation", "Near-duplicate detection", "Approximate nearest-neighbour index", "Captions from a vision-language model"] },
  { v: "Beyond", title: "Video and other media", status: "later", metric: "",
    points: ["Video embeddings and watch-time signals", "Audio and text embeddings", "A Jellyfin-style streaming layer (needs a server)"] }
];

// Measured results (see changelog v0.1 to v0.4). Percentages are 0 to 100.
const RESULTS = [
  { group: "Basic features", name: "v0.1", avg: 75, last: 55, cov: 74, red: 0.47 },
  { group: "Basic features", name: "v0.2", avg: 71, last: 58, cov: 84, red: 0.24 },
  { group: "Basic features", name: "v0.3", avg: 73, last: 62, cov: 88, red: 0.33 },
  { group: "CLIP features", name: "v0.1", avg: 94, last: 91, cov: 72, red: 0.46 },
  { group: "CLIP features", name: "v0.2", avg: 86, last: 85, cov: 81, red: 0.30 },
  { group: "CLIP features", name: "v0.3", avg: 87, last: 85, cov: 75, red: 0.34 }
];
const SERIES = [
  { key: "avg", label: "Avg precision (mean of 5 rounds)", css: "var(--series-1)" },
  { key: "last", label: "Last-round precision", css: "var(--series-2)" },
  { key: "cov", label: "Interest coverage", css: "var(--series-3)" }
];

// effort and impact are 1 (low) to 5 (high): estimates.
const ITEMS = [
  { lane: "Image understanding", title: "Basic colour and layout features", status: "done" },
  { lane: "Image understanding", title: "CLIP embeddings in the browser", status: "done" },
  { lane: "Image understanding", title: "Zero-shot labels for uploads", status: "done" },
  { lane: "Image understanding", title: "CLIP labels as upload tags", status: "next", effort: 1, impact: 3, note: "Replace the odd nearest-neighbour tags with CLIP's labels." },
  { lane: "Image understanding", title: "Captions from a vision-language model", status: "later", effort: 3, impact: 3, note: "Rich tags and descriptions at upload time." },
  { lane: "Image understanding", title: "Near-duplicate detection", status: "later", effort: 2, impact: 2, note: "Stop reposts flooding a feed (perceptual hashing)." },
  { lane: "Image understanding", title: "OCR for text inside images", status: "later", effort: 2, impact: 2, note: "Posters, comics and covers." },

  { lane: "Behaviour signals", title: "Save, view and hide events", status: "done" },
  { lane: "Behaviour signals", title: "Onboarding picks for new users", status: "later", effort: 1, impact: 3, note: "Choose 5 things you like to skip the empty start." },
  { lane: "Behaviour signals", title: "Dwell time and richer signals", status: "later", effort: 2, impact: 4, note: "Closeups and scroll-past say more than a click." },
  { lane: "Behaviour signals", title: "Reasons for not interested", status: "later", effort: 2, impact: 2, note: "Topic, creator or style." },
  { lane: "Behaviour signals", title: "Follows and board affinity", status: "later", effort: 3, impact: 3, note: "More from creators you follow." },

  { lane: "Ranking and learning", title: "Multiple interests per user", status: "done" },
  { lane: "Ranking and learning", title: "Diversity re-ranking and exploration", status: "done" },
  { lane: "Ranking and learning", title: "Boost for new uploads", status: "done" },
  { lane: "Ranking and learning", title: "Re-tune per embedding type", status: "next", effort: 1, impact: 4, note: "Diversity settings were tuned on basic features." },
  { lane: "Ranking and learning", title: "Adaptive number of interests", status: "next", effort: 2, impact: 2, note: "Choose k from the data instead of a fixed rule." },
  { lane: "Ranking and learning", title: "Smarter exploration (bandit)", status: "later", effort: 3, impact: 2, note: "Explore where the system is least sure." },
  { lane: "Ranking and learning", title: "Collaborative filtering", status: "later", effort: 4, impact: 4, note: "People who saved this also saved that. Needs real users." },
  { lane: "Ranking and learning", title: "Learned ranker", status: "later", effort: 4, impact: 4, note: "Predict save probability from logged behaviour." },

  { lane: "Engineering and scale", title: "Better offline evaluation", status: "next", effort: 2, impact: 3, note: "More personas, noisier users, real-photo catalog." },
  { lane: "Engineering and scale", title: "Server with vector database", status: "later", effort: 4, impact: 4, note: "FastAPI plus pgvector or Qdrant." },
  { lane: "Engineering and scale", title: "A/B testing and logging", status: "later", effort: 3, impact: 4, note: "Judge changes on real behaviour." },
  { lane: "Engineering and scale", title: "Approximate nearest-neighbour index", status: "later", effort: 3, impact: 2, note: "Needed past roughly 50,000 items." },

  { lane: "Safety", title: "Upload moderation", status: "later", effort: 3, impact: 5, note: "NSFW and abuse checks. Required before real user uploads." },

  { lane: "Compression", title: "Compare vector sizes", status: "later", effort: 2, impact: 2, note: "float32 vs float16 vs int8 for size and quality. (Int8 already used for the cache.)" },
  { lane: "Compression", title: "AVIF and WebP thumbnails", status: "later", effort: 2, impact: 2, note: "Smaller feed images, measured." },

  { lane: "Other media", title: "Video recommendations", status: "later", effort: 5, impact: 4, note: "Frame embeddings, watch time. Needs a server for streaming." },
  { lane: "Other media", title: "Music and writing embeddings", status: "later", effort: 4, impact: 3, note: "One taste profile across every content type." }
];

// ---- tiny DOM helpers ------------------------------------------------------
const SVGNS = "http://www.w3.org/2000/svg";
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === "text" ? (el.textContent = v) : el.setAttribute(k, v);
  el.append(...kids.flat().filter(Boolean));
  return el;
}
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) k === "text" ? (el.textContent = v) : el.setAttribute(k, v);
  el.append(...kids.flat().filter(Boolean));
  return el;
}
const $ = id => document.getElementById(id);

// ---- tooltip ---------------------------------------------------------------
const tip = $("tip");
function showTip(target, lines) {
  tip.replaceChildren(...lines.map((l, i) => h(i ? "div" : "b", { text: l })));
  tip.hidden = false;
  const r = target.getBoundingClientRect(), t = tip.getBoundingClientRect();
  const x = Math.min(window.innerWidth - t.width - 8, Math.max(8, r.left + r.width / 2 - t.width / 2));
  const y = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
  tip.style.left = x + "px";
  tip.style.top = y + "px";
}
function hideTip() { tip.hidden = true; }
function hoverable(el, lines) {
  el.setAttribute("tabindex", "0");
  el.addEventListener("mouseenter", () => showTip(el, lines));
  el.addEventListener("focus", () => showTip(el, lines));
  el.addEventListener("mouseleave", hideTip);
  el.addEventListener("blur", hideTip);
}
document.addEventListener("keydown", e => { if (e.key === "Escape") hideTip(); });

// ---- progress and timeline -------------------------------------------------
function renderTimeline() {
  const done = MILESTONES.filter(m => m.status === "done").length;
  $("progress").append(
    h("div", { class: "rm-bar", role: "img", "aria-label": done + " of " + MILESTONES.length + " milestones done" },
      ...MILESTONES.map(m => h("span", { class: "rm-seg " + m.status, title: m.v + " " + m.title }))),
    h("p", { class: "fine", text: done + " of " + MILESTONES.length + " milestones done. Next up: " + MILESTONES.find(m => m.status === "next").title + "." })
  );
  $("timeline").append(...MILESTONES.map(m => {
    const st = STATUS[m.status];
    return h("li", { class: "rm-ms " + m.status },
      h("span", { class: "rm-node", "aria-hidden": "true", text: st.icon }),
      h("div", { class: "rm-ms-card card" },
        h("div", { class: "rm-ms-top" },
          h("b", { text: m.v + " · " + m.title }),
          h("span", { class: "rm-tag " + m.status, text: st.icon + " " + st.label })),
        m.metric ? h("p", { class: "rm-metric", text: m.metric }) : null,
        h("ul", {}, ...m.points.map(p => h("li", { text: p })))));
  }));
}

// ---- grouped bar chart -----------------------------------------------------
function renderChart() {
  const svg = $("chart"), W = 760, H = 340, L = 44, R = 12, T = 16, B = 64;
  const pw = W - L - R, ph = H - T - B;
  const y = v => T + ph - (v / 100) * ph;
  svg.append(s("title", { id: "chart-t", text: "Grouped bar chart of recommendation quality by version" }),
    s("desc", { id: "chart-d", text: "Average precision, last-round precision and interest coverage for six algorithm and feature combinations. CLIP features score highest on precision. A table is available below the chart." }));

  for (const v of [0, 25, 50, 75, 100]) {
    svg.append(s("line", { x1: L, x2: W - R, y1: y(v), y2: y(v), class: "viz-grid" }),
      s("text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", class: "viz-axis", text: v + "%" }));
  }
  const gw = pw / RESULTS.length, bw = 20, gap = 2, inner = SERIES.length * bw + (SERIES.length - 1) * gap;
  RESULTS.forEach((r, gi) => {
    const x0 = L + gi * gw + (gw - inner) / 2;
    SERIES.forEach((se, si) => {
      const v = r[se.key], x = x0 + si * (bw + gap), top = y(v), base = y(0), rad = 4;
      // rounded data end (top), square at the baseline
      const d = "M" + x + " " + base + "V" + (top + rad) + "Q" + x + " " + top + " " + (x + rad) + " " + top +
        "H" + (x + bw - rad) + "Q" + (x + bw) + " " + top + " " + (x + bw) + " " + (top + rad) + "V" + base + "Z";
      const bar = s("path", { d, fill: se.css, class: "viz-bar" });
      hoverable(bar, [r.group + " " + r.name, se.label + ": " + v + "%"]);
      bar.setAttribute("aria-label", r.group + " " + r.name + ", " + se.label + " " + v + " percent");
      svg.append(bar);
    });
    svg.append(s("text", { x: L + gi * gw + gw / 2, y: H - B + 20, "text-anchor": "middle", class: "viz-axis", text: r.name }));
  });
  // group labels under each feature set
  ["Basic features", "CLIP features"].forEach(g => {
    const idx = RESULTS.map((r, i) => (r.group === g ? i : -1)).filter(i => i >= 0);
    const x1 = L + idx[0] * gw + 8, x2 = L + (idx[idx.length - 1] + 1) * gw - 8;
    svg.append(s("line", { x1, x2, y1: H - B + 32, y2: H - B + 32, class: "viz-grid" }),
      s("text", { x: (x1 + x2) / 2, y: H - B + 50, "text-anchor": "middle", class: "viz-axis-strong", text: g }));
  });
  svg.append(s("line", { x1: L, x2: W - R, y1: y(0), y2: y(0), class: "viz-base" }));

  $("legend").append(...SERIES.map(se => h("span", { class: "viz-key" },
    h("i", { style: "background:" + se.css }), se.label)));

  const rows = RESULTS.map(r => h("tr", {}, h("td", { text: r.group }), h("td", { text: r.name }),
    h("td", { text: r.avg + "%" }), h("td", { text: r.last + "%" }), h("td", { text: r.cov + "%" }), h("td", { text: r.red.toFixed(2) })));
  $("chart-table").append(h("table", { class: "eval" },
    h("thead", {}, h("tr", {}, ...["Features", "Version", "Avg precision", "Last-round precision", "Coverage", "Redundancy (lower = more varied)"].map(t => h("th", { text: t })))),
    h("tbody", {}, ...rows)));
}

// ---- impact vs effort matrix ----------------------------------------------
function renderMatrix() {
  const svg = $("matrix"), W = 760, H = 440, L = 56, R = 16, T = 16, B = 52;
  const pw = W - L - R, ph = H - T - B;
  const X = e => L + ((e - 0.5) / 5) * pw, Y = i => T + ph - ((i - 0.5) / 5) * ph;
  const upcoming = ITEMS.filter(i => i.status !== "done");
  svg.append(s("title", { id: "matrix-t", text: "Impact versus effort for upcoming roadmap items. The numbered list beside the chart names each dot." }));

  // quadrants
  const mx = X(3.5), my = Y(3.5);
  svg.append(s("rect", { x: L, y: T, width: mx - L, height: my - T, class: "viz-quad hot" }));
  [["Quick wins", L + 10, T + 22], ["Big bets", mx + 10, T + 22], ["Fill-ins", L + 10, T + ph - 10], ["Maybe later", mx + 10, T + ph - 10]]
    .forEach(([t, x, yy]) => svg.append(s("text", { x, y: yy, class: "viz-quad-label", text: t })));
  svg.append(s("line", { x1: mx, x2: mx, y1: T, y2: T + ph, class: "viz-grid" }),
    s("line", { x1: L, x2: W - R, y1: my, y2: my, class: "viz-grid" }),
    s("line", { x1: L, x2: L, y1: T, y2: T + ph, class: "viz-base" }),
    s("line", { x1: L, x2: W - R, y1: T + ph, y2: T + ph, class: "viz-base" }));
  for (let v = 1; v <= 5; v++) {
    svg.append(s("text", { x: X(v), y: T + ph + 18, "text-anchor": "middle", class: "viz-axis", text: v }),
      s("text", { x: L - 10, y: Y(v) + 4, "text-anchor": "end", class: "viz-axis", text: v }));
  }
  svg.append(s("text", { x: L + pw / 2, y: H - 10, "text-anchor": "middle", class: "viz-axis-strong", text: "Effort (1 low, 5 high) →" }),
    s("text", { x: 14, y: T + ph / 2, "text-anchor": "middle", class: "viz-axis-strong", transform: "rotate(-90 14 " + (T + ph / 2) + ")", text: "Impact (1 low, 5 high) →" }));

  // spread dots that share a cell
  const cells = new Map();
  upcoming.forEach((it, n) => { it.n = n + 1; const k = it.effort + "," + it.impact; cells.set(k, [...(cells.get(k) || []), it]); });
  const key = $("matrix-key");
  upcoming.forEach(it => {
    const group = cells.get(it.effort + "," + it.impact), i = group.indexOf(it), cols = Math.min(group.length, 3);
    const dx = ((i % 3) - (cols - 1) / 2) * 30, dy = Math.floor(i / 3) * 30 - (Math.ceil(group.length / 3) - 1) * 15;
    const cx = X(it.effort) + dx, cy = Y(it.impact) + dy;
    const dot = s("g", { class: "viz-dot " + it.status, "aria-label": it.n + ". " + it.title + ", effort " + it.effort + ", impact " + it.impact },
      s("circle", { cx, cy, r: 12 }), s("text", { x: cx, y: cy + 4, "text-anchor": "middle", text: it.n }));
    hoverable(dot, [it.title, "Effort " + it.effort + "/5 · Impact " + it.impact + "/5", it.note]);
    svg.append(dot);
    key.append(h("li", { value: it.n },
      h("b", { text: it.title }), " ", h("span", { class: "rm-tag " + it.status, text: STATUS[it.status].icon + " " + STATUS[it.status].label }),
      h("span", { class: "fine", text: it.note })));
  });
}

// ---- lanes -----------------------------------------------------------------
function renderLanes() {
  $("lanes").previousElementSibling.append(...Object.entries(STATUS).map(([k, v]) =>
    h("span", { class: "rm-tag " + k, text: v.icon + " " + v.label })));
  const lanes = [...new Set(ITEMS.map(i => i.lane))];
  $("lanes").append(...lanes.map(l => h("section", { class: "rm-lane card" },
    h("h3", { text: l }),
    h("ul", {}, ...ITEMS.filter(i => i.lane === l).map(i => h("li", { class: i.status },
      h("span", { class: "rm-tag " + i.status, text: STATUS[i.status].icon + " " + STATUS[i.status].label }),
      h("span", { text: i.title })))))));
}

renderTimeline();
renderChart();
renderMatrix();
renderLanes();
