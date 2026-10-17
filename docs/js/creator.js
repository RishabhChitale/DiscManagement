// Creator page: tabs, post feed, filters, follow toggle.
const POSTS = [
  { title: "Chapter 12: The Long Tide", meta: "Members · 2h ago", access: "members", g: "g1", text: "The keeper finally reaches the lower decks. Full-colour pages inside." },
  { title: "Studio tour and desk setup", meta: "Public · yesterday", access: "public", g: "g2", text: "A quick look at the tools I use every week, from pencils to tablet." },
  { title: "Sketchbook, October", meta: "Members · 4d ago", access: "members", g: "g3", text: "Thirty pages of rough ideas, character studies and failed experiments." },
  { title: "Q&A: how I plan a chapter", meta: "Public · 1w ago", access: "public", g: "g1", text: "Your questions about thumbnails, pacing and deadlines, answered." },
  { title: "Chapter 11 commentary", meta: "Members · 2w ago", access: "members", g: "g2", text: "Panel-by-panel notes on the hardest scene I have drawn so far." }
];

function postCard(p) {
  const locked = p.access === "members";
  const el = document.createElement("article");
  el.className = "card post";
  el.dataset.access = p.access;
  el.innerHTML =
    '<div class="thumb ' + p.g + '"></div>' +
    '<div class="post-body"><h3></h3><span class="fine"></span><p></p>' +
    (locked ? '<a class="btn btn-ghost" href="#join-tiers" data-tab="membership">Unlock with membership</a>' : '') +
    "</div>";
  el.querySelector("h3").textContent = p.title;
  el.querySelector(".fine").textContent = p.meta;
  el.querySelector("p").textContent = locked ? p.text.slice(0, 40) + "…" : p.text;
  return el;
}

function render(list, target) {
  target.replaceChildren(...list.map(postCard));
}

const homeFeed = document.getElementById("feed-home");
const allFeed = document.getElementById("feed-all");
render(POSTS.slice(0, 3), homeFeed);
render(POSTS, allFeed);

// Tabs
const tabs = [...document.querySelectorAll('[role="tab"]')];
function showTab(name) {
  tabs.forEach(t => {
    const on = t.id === "t-" + name;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  });
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => showTab(t.id.slice(2)));
  t.addEventListener("keydown", e => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    next.focus();
    showTab(next.id.slice(2));
  });
});
document.addEventListener("click", e => {
  const go = e.target.closest("[data-tab]");
  if (go) showTab(go.dataset.tab);
});

// Filters
document.querySelectorAll(".chip").forEach(c => c.addEventListener("click", () => {
  document.querySelectorAll(".chip").forEach(x => x.classList.toggle("on", x === c));
  const f = c.dataset.f;
  render(POSTS.filter(p => f === "all" || p.access === f), allFeed);
}));

// Follow
const follow = document.getElementById("follow");
follow.addEventListener("click", () => {
  const on = follow.getAttribute("aria-pressed") !== "true";
  follow.setAttribute("aria-pressed", on);
  follow.textContent = on ? "Following" : "Follow";
});
