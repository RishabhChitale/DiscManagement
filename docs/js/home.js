// Home page: masonry collage of sample posts with original generated artwork.
const CATS = ["All", "Art", "Music", "Games", "Writing"];
const CREATORS = [
  { name: "Mira Okafor", init: "M", color: "#5b4bff", cat: "Art" },
  { name: "The Tide Collective", init: "T", color: "#ff8a5b", cat: "Music" },
  { name: "Jun Park", init: "J", color: "#00a38d", cat: "Games" },
  { name: "Elan Reyes", init: "E", color: "#a259ff", cat: "Writing" }
];
const TITLES = {
  Art: ["Lighthouse study", "Ink wash practice", "Character sheet", "Desk setup", "Colour palette test"],
  Music: ["Demo, track 4", "Studio session", "Lyric draft", "Live rehearsal", "Cover art sketch"],
  Games: ["Pixel tileset", "Boss fight WIP", "Level 3 layout", "Sprite sheet", "Dev log #12"],
  Writing: ["Chapter opening", "Worldbuilding map", "Short story cover", "Plot board", "Reading list"]
};
const PALETTES = [
  ["#5b4bff", "#00c2a8"], ["#ff8a5b", "#ffcf5b"], ["#1fa2ff", "#a259ff"],
  ["#14142b", "#5b4bff"], ["#00a38d", "#d7f7ef"], ["#ff5b8a", "#ffcf5b"], ["#2a2a6a", "#ff8a5b"]
];

// Small seeded PRNG so the collage looks the same on every load.
function rng(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
}

function art(seed, w, h) {
  const r = rng(seed), [c1, c2] = PALETTES[Math.floor(r() * PALETTES.length)];
  let s = '<svg viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
    '<defs><linearGradient id="g' + seed + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c1 +
    '"/><stop offset="1" stop-color="' + c2 + '"/></linearGradient></defs><rect width="' + w + '" height="' + h +
    '" fill="url(#g' + seed + ')"/>';
  for (let i = 0; i < 5; i++) {
    const x = r() * w, y = r() * h, size = 30 + r() * 110, o = (0.12 + r() * 0.3).toFixed(2);
    s += r() < 0.5
      ? '<circle cx="' + x.toFixed(0) + '" cy="' + y.toFixed(0) + '" r="' + size.toFixed(0) + '" fill="#fff" opacity="' + o + '"/>'
      : '<rect x="' + x.toFixed(0) + '" y="' + y.toFixed(0) + '" width="' + size.toFixed(0) + '" height="' + (size * (0.5 + r())).toFixed(0) +
        '" rx="' + (r() * 30).toFixed(0) + '" fill="#14142b" opacity="' + o + '" transform="rotate(' + (r() * 60 - 30).toFixed(0) + " " + x.toFixed(0) + " " + y.toFixed(0) + ')"/>';
  }
  return s + "</svg>";
}

const POSTS = [];
for (let i = 0; i < 40; i++) {
  const r = rng(i * 97 + 13), c = CREATORS[i % CREATORS.length];
  const w = 400, h = Math.round(w * (0.7 + r() * 0.9));
  POSTS.push({
    id: i, creator: c, w, h,
    title: TITLES[c.cat][Math.floor(r() * 5)],
    members: r() < 0.35
  });
}

const grid = document.getElementById("masonry");
function render(cat) {
  const list = POSTS.filter(p => cat === "All" || p.creator.cat === cat);
  grid.replaceChildren(...list.map(p => {
    const a = document.createElement("a");
    a.className = "pin";
    a.href = "creator.html";
    a.innerHTML = '<div class="pin-img">' + art(p.id + 1, p.w, p.h) + (p.members ? '<span class="lock">Members</span>' : "") + "</div>" +
      '<div class="pin-meta"><span class="mini" style="background:' + p.creator.color + '">' + p.creator.init + '</span><div><b></b><span></span></div></div>';
    a.querySelector("svg").style.aspectRatio = p.w + " / " + p.h;
    a.querySelector("b").textContent = p.title;
    a.querySelector(".pin-meta span:not(.mini)").textContent = p.creator.name;
    return a;
  }));
}

const cats = document.getElementById("cats");
CATS.forEach((c, i) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip" + (i ? "" : " on");
  b.textContent = c;
  b.addEventListener("click", () => {
    cats.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === b));
    render(c);
  });
  cats.append(b);
});
render("All");
