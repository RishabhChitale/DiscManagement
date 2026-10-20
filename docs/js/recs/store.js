// User events (view / save / hide) kept in localStorage. Wrapped in try/catch because
// storage can be blocked (private windows, strict browser settings).

const KEY = "f95.recs.events.v1";
let memory = [];

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return memory; }
}
function save(list) {
  memory = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* keep in memory */ }
}
export function record(id, type, t = Date.now()) {
  const list = load();
  list.push({ id, type, t });
  save(list);
  return list;
}
// Undo a save/hide (toggle).
export function remove(id, type) {
  const list = load().filter(e => !(e.id === id && e.type === type));
  save(list);
  return list;
}
export function clear() { save([]); }
