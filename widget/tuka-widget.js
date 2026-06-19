// Tuka — iOS home-screen widget for Scriptable (https://scriptable.app)
// Medium widget: current weight, difference since start, and a 7-day mini graph.
// Reads your live data straight from Supabase (same public anon key as the app).
//
// Setup:
//   1. Install "Scriptable" from the App Store (free).
//   2. Open Scriptable → "+" → paste this whole file → name it "Tuka".
//   3. Tap ▶ to test. Then long-press your home screen → add a "Scriptable"
//      widget (Medium) → tap it → set Script = "Tuka".

const SUPABASE_URL = "https://podamzsmvybrbdscqrks.supabase.co";
const ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvZGFtenNtdnlicmJkc2NxcmtzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTAwODIsImV4cCI6MjA5NzI2NjA4Mn0.1oZerymL7ahS_WA8sO_GgCdeubtcxzgzCWp5FpY2Vyw";

// Depth palette
const C = { bg: "#0C0C0C", text: "#F5F5F5", muted: "#A1A1A1", faint: "#6B6B6B", positive: "#3FCF8E", warning: "#E0A33E" };

async function getRows(table, query) {
  const req = new Request(`${SUPABASE_URL}/rest/v1/${table}?${query}`);
  req.headers = { apikey: ANON, Authorization: `Bearer ${ANON}` };
  const data = await req.loadJSON();
  return Array.isArray(data) ? data : [];
}

function round1(n) { return Math.round(n * 10) / 10; }

function drawChart(points, size, hex) {
  const ctx = new DrawContext();
  ctx.size = size;
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  if (points.length === 0) return ctx.getImage();

  const W = size.width, H = size.height;
  const padX = 6, padTop = 14, padBottom = 8;
  const vals = points.map(p => Number(p.kg));
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  const n = points.length;
  const x = i => (n === 1 ? W / 2 : padX + (i / (n - 1)) * (W - padX * 2));
  const y = v => padTop + (H - padTop - padBottom) * (1 - (v - lo) / (hi - lo));

  const path = new Path();
  points.forEach((p, i) => {
    const pt = new Point(x(i), y(Number(p.kg)));
    if (i === 0) path.move(pt); else path.addLine(pt);
  });
  ctx.setStrokeColor(new Color(hex));
  ctx.setLineWidth(6);
  ctx.addPath(path);
  ctx.strokePath();

  // emphasize the latest point
  const r = 11, lx = x(n - 1), ly = y(Number(points[n - 1].kg));
  ctx.setFillColor(new Color(hex));
  ctx.fillEllipse(new Rect(lx - r, ly - r, r * 2, r * 2));
  return ctx.getImage();
}

function finish(widget) {
  widget.refreshAfterDate = new Date(Date.now() + 30 * 60 * 1000); // ~30 min
  if (config.runsInWidget) Script.setWidget(widget);
  else widget.presentMedium();
  Script.complete();
}

const w = new ListWidget();
w.backgroundColor = new Color(C.bg);
w.setPadding(16, 18, 16, 18);

let weights = [];
try { weights = await getRows("tuka_weights", "select=id,kg,date&order=date.asc"); } catch (e) {}

if (weights.length === 0) {
  const t = w.addText("Open Tuka and log a weigh-in.");
  t.font = Font.systemFont(14);
  t.textColor = new Color(C.muted);
  finish(w);
} else {
  let targets = [];
  try { targets = await getRows("tuka_targets", "select=value&order=id.asc"); } catch (e) {}

  const current = Number(weights[weights.length - 1].kg);
  const start = Number(weights[0].kg);
  const diff = current - start;
  const target = targets.length ? Number(targets[targets.length - 1].value) : null;

  // color: toward target = green, away = amber; no target → loss green / gain amber
  let diffColor;
  if (target != null && weights.length > 1) {
    diffColor = Math.abs(current - target) < Math.abs(start - target) ? C.positive : C.warning;
  } else {
    diffColor = diff < 0 ? C.positive : diff > 0 ? C.warning : C.muted;
  }

  // last 7 days (fall back to last few readings if sparse)
  const cutoff = Date.now() - 7 * 86400000;
  let recent = weights.filter(p => new Date(p.date).getTime() >= cutoff);
  if (recent.length < 2) recent = weights.slice(-7);

  const row = w.addStack();
  row.layoutHorizontally();
  row.centerAlignContent();

  // ── left: text ──
  const left = row.addStack();
  left.layoutVertically();

  const eyebrow = left.addText("CURRENT");
  eyebrow.font = Font.semiboldSystemFont(10);
  eyebrow.textColor = new Color(C.faint);

  left.addSpacer(7);

  const valRow = left.addStack();
  valRow.layoutHorizontally();
  valRow.bottomAlignContent();
  const val = valRow.addText(`${round1(current)}`);
  val.font = Font.boldSystemFont(42);
  val.textColor = new Color(C.text);
  valRow.addSpacer(3);
  const unit = valRow.addText("kg");
  unit.font = Font.italicSystemFont(15);
  unit.textColor = new Color(C.muted);

  left.addSpacer(9);

  const arrow = diff < 0 ? "↓" : diff > 0 ? "↑" : "→";
  const d = left.addText(`${arrow} ${Math.abs(diff).toFixed(1)} kg since start`);
  d.font = Font.semiboldSystemFont(13);
  d.textColor = new Color(diffColor);

  row.addSpacer();

  // ── right: 7-day chart ──
  const right = row.addStack();
  right.layoutVertically();
  const cw = 150, ch = 86;
  const img = drawChart(recent, new Size(cw * 3, ch * 3), C.text);
  const wimg = right.addImage(img);
  wimg.imageSize = new Size(cw, ch);
  right.addSpacer(4);
  const cap = right.addText("LAST 7 DAYS");
  cap.font = Font.semiboldSystemFont(9);
  cap.textColor = new Color(C.faint);
  cap.centerAlignText();

  finish(w);
}
