import { buildBasicIndex } from "./setup.js";
import { runEval } from "./eval.js";
import { VERSIONS } from "./engine.js";

const out = document.getElementById("out"), status = document.getElementById("status");
const pct = x => (x * 100).toFixed(0) + "%";

document.getElementById("run").addEventListener("click", async () => {
  status.textContent = "Building index…";
  const { index } = await buildBasicIndex(240);
  status.textContent = "Simulating…";
  await new Promise(r => setTimeout(r));
  const versions = Object.fromEntries(Object.entries(VERSIONS).map(([k, v]) => ["v" + k, v]));
  const rows = runEval(index, versions);
  const names = Object.keys(versions);
  let html = '<table class="eval"><thead><tr><th>Persona</th>' + names.map(n => "<th>" + n + " precision / coverage / redundancy</th>").join("") + "</tr></thead><tbody>";
  for (const row of rows) {
    html += "<tr><td>" + row.persona + "</td>" + names.map(n => {
      const m = row.results[n];
      return "<td>" + pct(m.avgPrecision) + " (last " + pct(m.precision) + ") / " + pct(m.covered) + " / " + m.redundancy.toFixed(2) + "</td>";
    }).join("") + "</tr>";
  }
  out.innerHTML = html + "</tbody></table>";
  window.__evalRows = rows;
  status.textContent = "Done.";
});
