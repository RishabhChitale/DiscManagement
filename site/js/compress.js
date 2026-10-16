// Compresses text in the browser using the built-in CompressionStream API.
async function compress(text, format) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream(format));
  return (await new Response(stream).arrayBuffer()).byteLength;
}

document.getElementById('run').addEventListener('click', async () => {
  const text = document.getElementById('input').value;
  const format = document.getElementById('algo').value;
  const original = new TextEncoder().encode(text).length;
  const t0 = performance.now();
  const compressed = await compress(text, format);
  const ms = (performance.now() - t0).toFixed(2);
  const saved = original ? (100 * (1 - compressed / original)).toFixed(1) : 0;
  document.getElementById('result').textContent =
    `Algorithm: ${format}\nOriginal:   ${original} bytes\nCompressed: ${compressed} bytes\nSaved:      ${saved}%\nTime:       ${ms} ms`;
});
