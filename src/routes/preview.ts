import type { FastifyPluginAsync } from "fastify";

const PREVIEW_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>chartcn — Chart Preview</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #09090b;
    color: #fafafa;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 16px;
  }
  h1 { font-size: 24px; font-weight: 600; margin-bottom: 4px; }
  .subtitle { color: #a1a1aa; font-size: 14px; margin-bottom: 24px; }
  .container {
    display: flex;
    gap: 24px;
    width: 100%;
    max-width: 1200px;
    flex: 1;
  }
  .editor-panel, .preview-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  label { font-size: 13px; font-weight: 500; margin-bottom: 6px; color: #a1a1aa; }
  textarea {
    flex: 1;
    min-height: 400px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    color: #fafafa;
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 13px;
    padding: 16px;
    resize: none;
    line-height: 1.5;
  }
  textarea:focus { outline: none; border-color: #3b82f6; }
  .controls {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    align-items: center;
  }
  select, button {
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 6px;
    color: #fafafa;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
  }
  button.primary {
    background: #2563eb;
    border-color: #2563eb;
    font-weight: 500;
  }
  button.primary:hover { background: #1d4ed8; }
  .preview-frame {
    flex: 1;
    min-height: 400px;
    background: #18181b;
    border: 1px solid #27272a;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .preview-frame img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
  .preview-frame .placeholder {
    color: #52525b;
    font-size: 14px;
  }
  .error {
    color: #ef4444;
    font-size: 13px;
    margin-top: 8px;
  }
  .status {
    color: #22c55e;
    font-size: 13px;
    margin-top: 8px;
  }
  @media (max-width: 768px) {
    .container { flex-direction: column; }
  }
</style>
</head>
<body>
  <h1>chartcn</h1>
  <p class="subtitle">Paste your chart JSON config and click "Render" to preview</p>
  <div class="container">
    <div class="editor-panel">
      <label>Chart Configuration (JSON)</label>
      <textarea id="config" spellcheck="false">{
  "type": "area",
  "width": 600,
  "height": 400,
  "format": "png",
  "theme": "default",
  "config": {
    "title": "Monthly Revenue",
    "description": "Jan - Jun 2025",
    "xAxis": { "key": "month" },
    "data": [
      { "month": "Jan", "revenue": 186, "profit": 80 },
      { "month": "Feb", "revenue": 305, "profit": 200 },
      { "month": "Mar", "revenue": 237, "profit": 120 },
      { "month": "Apr", "revenue": 203, "profit": 190 },
      { "month": "May", "revenue": 209, "profit": 130 },
      { "month": "Jun", "revenue": 314, "profit": 140 }
    ],
    "series": [
      { "key": "revenue", "label": "Revenue", "fill": true },
      { "key": "profit", "label": "Profit", "fill": true }
    ],
    "legend": true,
    "grid": true,
    "curved": true
  }
}</textarea>
      <div class="controls">
        <select id="format">
          <option value="png">PNG</option>
          <option value="svg">SVG</option>
          <option value="pdf">PDF</option>
        </select>
        <button class="primary" id="render-btn">Render Chart</button>
        <button id="download-btn" disabled>Download</button>
      </div>
      <div id="message"></div>
    </div>
    <div class="preview-panel">
      <label>Preview</label>
      <div class="preview-frame" id="preview">
        <span class="placeholder">Chart preview will appear here</span>
      </div>
    </div>
  </div>
  <script>
    const configEl = document.getElementById("config");
    const formatEl = document.getElementById("format");
    const renderBtn = document.getElementById("render-btn");
    const downloadBtn = document.getElementById("download-btn");
    const previewEl = document.getElementById("preview");
    const messageEl = document.getElementById("message");
    let lastBlob = null;
    let lastFormat = "png";

    renderBtn.addEventListener("click", async () => {
      messageEl.textContent = "";
      try {
        const body = JSON.parse(configEl.value);
        body.format = formatEl.value;
        lastFormat = formatEl.value;
        renderBtn.disabled = true;
        renderBtn.textContent = "Rendering...";

        const res = await fetch("/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || "Render failed");
        }

        lastBlob = await res.blob();
        const url = URL.createObjectURL(lastBlob);

        if (lastFormat === "pdf") {
          previewEl.innerHTML = '<span class="placeholder">PDF generated — click Download</span>';
        } else {
          previewEl.innerHTML = "";
          const img = document.createElement("img");
          img.src = url;
          previewEl.appendChild(img);
        }

        downloadBtn.disabled = false;
        messageEl.className = "status";
        messageEl.textContent = "Rendered successfully (" + (lastBlob.size / 1024).toFixed(1) + " KB)";
      } catch (e) {
        messageEl.className = "error";
        messageEl.textContent = e.message;
      } finally {
        renderBtn.disabled = false;
        renderBtn.textContent = "Render Chart";
      }
    });

    downloadBtn.addEventListener("click", () => {
      if (!lastBlob) return;
      const ext = lastFormat;
      const url = URL.createObjectURL(lastBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "chart." + ext;
      a.click();
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>`;

export const previewRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get("/chart/preview", async (_request, reply) => {
    return reply.type("text/html").send(PREVIEW_HTML);
  });
};
