// Changelog tab: loads one markdown file per iteration from recs/changelog/ and renders it.
// recs/changelog/index.json lists the tabs and files, newest iteration first.
const BASE = "recs/changelog/";
const tabs = document.getElementById("tabs"), doc = document.getElementById("doc");

const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s) {
  return esc(s)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/\[([^\]]+)\]\(((?:https?:\/\/|[\w./#-]+)[^)\s]*)\)/g, '<a href="$2" style="color:var(--brand-text)">$1</a>');
}

// Tiny markdown subset: headings, bullet/numbered lists, tables, paragraphs.
function md(src) {
  const lines = src.replace(/\r/g, "").split("\n");
  let html = "", list = null, para = [];
  const flushPara = () => { if (para.length) { html += "<p>" + inline(para.join(" ")) + "</p>"; para = []; } };
  const flushList = () => { if (list) { html += "</" + list + ">"; list = null; } };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if (!l.trim()) { flushPara(); flushList(); continue; }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) {
      flushPara(); flushList();
      html += "<h" + (m[1].length + 1) + ">" + inline(m[2]) + "</h" + (m[1].length + 1) + ">";
    } else if (l.startsWith("|")) {
      flushPara(); flushList();
      const rows = [];
      while (i < lines.length && lines[i].startsWith("|")) rows.push(lines[i++]);
      i--;
      const cells = r => r.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
      html += '<div class="tbl"><table class="eval"><thead><tr>' + cells(rows[0]).map(c => "<th>" + inline(c) + "</th>").join("") + "</tr></thead><tbody>" +
        rows.slice(2).map(r => "<tr>" + cells(r).map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>";
    } else if ((m = l.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/))) {
      flushPara();
      const kind = /^\s*\d/.test(l) ? "ol" : "ul";
      if (list !== kind) { flushList(); html += "<" + kind + ">"; list = kind; }
      html += "<li>" + inline(m[1]) + "</li>";
    } else {
      flushList(); para.push(l.trim());
    }
  }
  flushPara(); flushList();
  return html;
}

const cache = {};
async function show(entry, btn) {
  tabs.querySelectorAll("button").forEach(b => b.setAttribute("aria-selected", b === btn));
  doc.textContent = "Loading…";
  try {
    if (!cache[entry.file]) {
      const r = await fetch(BASE + entry.file);
      if (!r.ok) throw new Error(r.status);
      cache[entry.file] = await r.text();
    }
    doc.innerHTML = md(cache[entry.file]);
    history.replaceState(null, "", "#" + entry.file.replace(/\.md$/, ""));
  } catch (e) {
    doc.textContent = "Couldn't load " + entry.file + ". If you opened this page straight from disk, serve the docs/ folder over http instead (browsers block file loading from file://).";
  }
}

fetch(BASE + "index.json").then(r => r.json()).then(list => {
  const want = location.hash.slice(1);
  let first = null;
  list.forEach(entry => {
    const b = document.createElement("button");
    b.type = "button"; b.setAttribute("role", "tab"); b.textContent = entry.tab;
    b.addEventListener("click", () => show(entry, b));
    tabs.append(b);
    if (!first || entry.file.replace(/\.md$/, "") === want) first = [entry, b];
  });
  show(...first);
}).catch(() => {
  doc.textContent = "Couldn't load the changelog index. Serve the docs/ folder over http (not file://).";
});
