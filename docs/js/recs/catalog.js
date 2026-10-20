// Sample catalog for the recommendation demo: original generated artwork with hidden
// "style" (what it looks like) and public tags (what the creator typed).
// Style correlates with category but not perfectly, like real uploads.

export const CATS = ["Art", "Music", "Games", "Writing"];

const THEMES = {
  Art: ["landscape", "portrait", "ink", "sketch", "palette"],
  Music: ["studio", "live", "lyrics", "cover-art", "demo"],
  Games: ["pixel", "level", "sprite", "devlog", "boss"],
  Writing: ["map", "chapter", "cover", "notes", "poetry"]
};
const TITLES = {
  Art: ["Lighthouse study", "Ink wash practice", "Character sheet", "Desk setup", "Colour palette test"],
  Music: ["Demo, track 4", "Studio session", "Lyric draft", "Live rehearsal", "Cover art sketch"],
  Games: ["Pixel tileset", "Boss fight WIP", "Level 3 layout", "Sprite sheet", "Dev log #12"],
  Writing: ["Chapter opening", "Worldbuilding map", "Short story cover", "Plot board", "Reading list"]
};
const PALETTES = [
  ["#5b4bff", "#00c2a8"], ["#ff8a5b", "#ffcf5b"], ["#1fa2ff", "#a259ff"], ["#14142b", "#5b4bff"],
  ["#00a38d", "#d7f7ef"], ["#ff5b8a", "#ffcf5b"], ["#2a2a6a", "#ff8a5b"], ["#e8e4d9", "#6b5b3e"]
];
// Each category mostly uses one drawing style; ~25% of items cross over.
export const STYLES = ["blobs", "waves", "pixels", "lines"];
const HOME_STYLE = { Art: "blobs", Music: "waves", Games: "pixels", Writing: "lines" };

export const DAY = 86400000;

// Small seeded PRNG so the catalog is identical on every load.
export function rng(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}

const f = n => n.toFixed(1);

function drawing(style, r, w, h, c1, c2) {
  let s = "";
  if (style === "pixels") {
    const cell = 20, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const v = r();
      if (v < 0.35) s += '<rect x="' + x * cell + '" y="' + y * cell + '" width="' + cell + '" height="' + cell +
        '" fill="' + (v < 0.12 ? "#14142b" : "#fff") + '" opacity="' + f(0.25 + r() * 0.5) + '"/>';
    }
  } else if (style === "waves") {
    for (let i = 0; i < 7; i++) {
      const y = (i + 0.5) * h / 7, a = 10 + r() * 40, k = 1 + Math.floor(r() * 4);
      let d = "M0 " + f(y);
      for (let x = 0; x <= w; x += 20) d += " L" + x + " " + f(y + Math.sin(x / w * k * Math.PI * 2) * a);
      s += '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="' + f(3 + r() * 6) + '" opacity="' + f(0.3 + r() * 0.5) + '"/>';
    }
  } else if (style === "lines") {
    const n = 14 + Math.floor(r() * 10);
    for (let i = 0; i < n; i++) {
      const y = (i + 0.5) * h / n, x1 = r() * w * 0.3, x2 = w - r() * w * 0.4;
      s += '<rect x="' + f(x1) + '" y="' + f(y) + '" width="' + f(x2 - x1) + '" height="' + f(2 + r() * 4) +
        '" fill="' + (r() < 0.2 ? "#14142b" : "#fff") + '" opacity="' + f(0.35 + r() * 0.5) + '"/>';
    }
  } else {
    for (let i = 0; i < 5; i++) {
      const x = r() * w, y = r() * h, size = 30 + r() * 110, o = f(0.12 + r() * 0.3);
      s += r() < 0.5
        ? '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(size) + '" fill="#fff" opacity="' + o + '"/>'
        : '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(size) + '" height="' + f(size * (0.5 + r())) +
          '" rx="' + f(r() * 30) + '" fill="#14142b" opacity="' + o + '"/>';
    }
  }
  return s;
}

export function art(seed, w, h, style, palette) {
  const r = rng(seed * 7919 + 5), [c1, c2] = palette;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice">' +
    '<defs><linearGradient id="g' + seed + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 +
    '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="' + w + '" height="' + h +
    '" fill="url(#g' + seed + ')"/>' + drawing(style, r, w, h, c1, c2) + "</svg>";
}

export function makeCatalog(n = 120, now = Date.now()) {
  const items = [];
  for (let i = 0; i < n; i++) {
    const r = rng(i * 97 + 13);
    const cat = CATS[i % CATS.length];
    const style = r() < 0.75 ? HOME_STYLE[cat] : STYLES[Math.floor(r() * STYLES.length)];
    const palette = PALETTES[Math.floor(r() * PALETTES.length)];
    const w = 400, h = Math.round(w * (0.7 + r() * 0.9));
    const themes = THEMES[cat];
    const t1 = themes[Math.floor(r() * themes.length)];
    let t2 = themes[Math.floor(r() * themes.length)];
    if (t2 === t1) t2 = themes[(themes.indexOf(t1) + 1) % themes.length];
    // Seeded engagement stats so the popularity prior has something to chew on.
    const views = Math.floor(50 + r() * r() * 4000), saves = Math.floor(views * (0.01 + r() * 0.12));
    items.push({
      id: i, cat, style, w, h,
      title: TITLES[cat][Math.floor(r() * 5)],
      tags: [cat.toLowerCase(), t1, t2],
      svg: art(i + 1, w, h, style, palette),
      born: now - Math.floor(r() * 60) * DAY,
      stats: { views, saves }
    });
  }
  return items;
}
