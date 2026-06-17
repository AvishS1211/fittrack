import { useState, useEffect } from "react";
import { C, MONTHS, todayStr } from "./theme";
import WeightChart from "./WeightChart";

const LS_WEIGHTS = "tuka_weights";
const LS_TARGETS = "tuka_targets";
const LS_TARGET_OLD = "tuka_target"; // pre-history single value (migrated on load)

const RANGES = [
  { id: "1M", label: "1M", days: 31 },
  { id: "3M", label: "3M", days: 92 },
  { id: "6M", label: "6M", days: 183 },
  { id: "1Y", label: "1Y", days: 366 },
  { id: "ALL", label: "ALL", days: Infinity },
];

const load = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v == null ? fallback : JSON.parse(v); }
  catch { return fallback; }
};

// Targets are kept as a chronological history [{ id, value }]; the last is current.
const loadTargets = () => {
  const arr = load(LS_TARGETS, null);
  if (Array.isArray(arr)) return arr;
  const old = load(LS_TARGET_OLD, null); // migrate legacy single target
  return old != null ? [{ id: Date.now(), value: old }] : [];
};

function fmtDate(ds) { const d = new Date(ds); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

// ── small building blocks ──
function Eyebrow({ children }) {
  return <div style={{ textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 11, fontWeight: 600, color: C.faint }}>{children}</div>;
}
function Card({ children, style }) {
  return <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 20, ...style }}>{children}</div>;
}
function Metric({ value, unit, size = 52, color = C.text }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 4, lineHeight: 1 }}>
      <span style={{ fontSize: size, fontWeight: 600, color, letterSpacing: "-0.02em" }}>{value}</span>
      <span style={{ fontSize: size * 0.32, fontStyle: "italic", color: C.muted }}>{unit}</span>
    </div>
  );
}

export default function TukaApp() {
  const [weights, setWeights] = useState(() => load(LS_WEIGHTS, []));
  const [targets, setTargets] = useState(loadTargets);
  const [range, setRange] = useState("6M");
  const [wInput, setWInput] = useState("");
  const [dInput, setDInput] = useState(todayStr());
  const [tInput, setTInput] = useState("");
  const [showTarget, setShowTarget] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem(LS_WEIGHTS, JSON.stringify(weights)); }, [weights]);
  useEffect(() => { localStorage.setItem(LS_TARGETS, JSON.stringify(targets)); }, [targets]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const target = targets.length ? targets[targets.length - 1].value : null;        // current goal
  const prevTargets = targets.slice(0, -1).slice(-2).map(t => t.value).reverse();   // up to 2 prior

  const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted[sorted.length - 1] || null;
  const first = sorted[0] || null;

  // range-filtered series for the chart + trend
  const days = RANGES.find(r => r.id === range).days;
  const cutoff = days === Infinity ? -Infinity : Date.now() - days * 86400000;
  const ranged = sorted.filter(w => +new Date(w.date) >= cutoff);
  const series = ranged.length >= 1 ? ranged : sorted;

  const rangeFirst = series[0] || null;
  const rangeChange = latest && rangeFirst ? Number(latest.kg) - Number(rangeFirst.kg) : 0;

  // direction: are we moving toward the target?
  let toGo = null, towardTarget = null;
  if (target != null && latest) {
    toGo = Number(latest.kg) - target; // + means above target, - means below
    if (rangeFirst && series.length > 1) {
      const before = Math.abs(Number(rangeFirst.kg) - target);
      const now = Math.abs(Number(latest.kg) - target);
      towardTarget = now < before;
    }
  }
  const trendColor = towardTarget == null ? C.muted : towardTarget ? C.positive : C.warning;

  const logWeight = () => {
    const kg = parseFloat(wInput);
    if (!kg || kg <= 0) { showToast("Enter a weight"); return; }
    const entry = { id: Date.now(), kg: Math.round(kg * 10) / 10, date: dInput };
    setWeights(prev => [...prev.filter(w => w.date !== entry.date), entry]); // one per day
    setWInput("");
    setDInput(todayStr());
    showToast("Logged");
  };
  const removeWeight = (id) => setWeights(prev => prev.filter(w => w.id !== id));

  const openTarget = () => { setTInput(target != null ? String(target) : ""); setShowTarget(true); };
  const saveTarget = () => {
    const t = parseFloat(tInput);
    if (!t || t <= 0) { showToast("Enter a target"); return; }
    const value = Math.round(t * 10) / 10;
    if (value === target) { setShowTarget(false); return; }
    setTargets(prev => [...prev, { id: Date.now(), value }]);
    setShowTarget(false);
    showToast("Target set");
  };
  const removeTarget = () => { setTargets(prev => prev.slice(0, -1)); setShowTarget(false); showToast("Target removed"); };

  const input = {
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: "12px 14px", color: C.text, fontSize: 15, fontFamily: "inherit", width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, system-ui, sans-serif", maxWidth: 480, margin: "0 auto", padding: "0 16px 56px", position: "relative", WebkitFontSmoothing: "antialiased" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        input { outline: none; }
        input[type=date] { color-scheme: dark; }
        @keyframes tukaIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes tukaPop { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 14px)", left: "50%", transform: "translateX(-50%)", zIndex: 99, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "9px 18px", fontSize: 13, color: C.text, backdropFilter: "blur(12px)" }}>
          {toast}
        </div>
      )}

      {/* Header — note the safe-area top padding so it clears the notch */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top) + 26px) 2px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <img src="/tuka-icon.png" alt="" width={34} height={34} style={{ borderRadius: 9 }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>tuka</div>
            <div style={{ fontSize: 11, color: C.faint, marginTop: 1 }}>Know where you're <em>going</em>.</div>
          </div>
        </div>
        <button onClick={openTarget} aria-label="Set target" style={{
          display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 999,
          padding: target != null ? "7px 13px 7px 11px" : "8px 11px", color: C.text, fontFamily: "inherit",
        }}>
          <span style={{ fontSize: 15, lineHeight: 1 }}>🎯</span>
          {target != null && <span style={{ fontSize: 12, fontWeight: 600 }}>{target}<span style={{ fontSize: 9, fontStyle: "italic", color: C.muted }}> kg</span></span>}
        </button>
      </header>

      <main style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.4s ease" }}>

        {/* Hero — current weight */}
        <Card style={{ padding: 22 }}>
          <Eyebrow>Current</Eyebrow>
          <div style={{ marginTop: 12 }}>
            <Metric value={latest ? latest.kg : "—"} unit="kg" />
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, color: C.faint }}>{range} change</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: series.length > 1 ? trendColor : C.muted, marginTop: 3 }}>
                {series.length > 1 ? `${rangeChange > 0 ? "↑" : rangeChange < 0 ? "↓" : ""} ${Math.abs(rangeChange).toFixed(1)} kg` : "—"}
              </div>
            </div>
            {toGo != null && (
              <div>
                <div style={{ fontSize: 11, color: C.faint }}>To target</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: Math.abs(toGo) < 0.1 ? C.positive : C.text, marginTop: 3 }}>
                  {Math.abs(toGo) < 0.1 ? "Reached 🎯" : `${Math.abs(toGo).toFixed(1)} kg to ${toGo > 0 ? "lose" : "gain"}`}
                </div>
              </div>
            )}
            {first && (
              <div>
                <div style={{ fontSize: 11, color: C.faint }}>Since start</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginTop: 3 }}>
                  {(Number(latest.kg) - Number(first.kg) > 0 ? "↑ " : Number(latest.kg) - Number(first.kg) < 0 ? "↓ " : "") + Math.abs(Number(latest.kg) - Number(first.kg)).toFixed(1)} kg
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Chart */}
        <Card>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <Eyebrow>Trend</Eyebrow>
            {target != null && (
              <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
                <span style={{ color: C.positive }}>— target {target}</span>
                {prevTargets.length > 0 && <span style={{ color: C.faint }}>— past</span>}
              </div>
            )}
          </div>
          <WeightChart data={series} target={target} prevTargets={prevTargets} />
          <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
            {RANGES.map(r => (
              <button key={r.id} onClick={() => setRange(r.id)} style={{
                flex: 1, padding: "7px 0", borderRadius: 9, fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                cursor: "pointer", border: "none",
                background: range === r.id ? C.surface2 : "transparent",
                color: range === r.id ? C.text : C.faint,
              }}>{r.label}</button>
            ))}
          </div>
        </Card>

        {/* Log weight */}
        <Card>
          <Eyebrow>Log a weigh-in</Eyebrow>
          <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
            <input type="number" inputMode="decimal" value={wInput} placeholder="weight"
              onChange={e => setWInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && logWeight()}
              style={{ ...input, flex: 1, fontSize: 18, fontWeight: 600 }} />
            <input type="date" value={dInput} onChange={e => setDInput(e.target.value)} style={{ ...input, flex: 1.1, fontSize: 13 }} />
          </div>
          <button onClick={logWeight} style={{
            width: "100%", marginTop: 12, padding: "13px", borderRadius: 999, border: "none", cursor: "pointer",
            background: C.text, color: C.bg, fontSize: 14, fontWeight: 600, fontFamily: "inherit",
          }}>Log weight</button>
        </Card>

        {/* History */}
        {sorted.length > 0 && (
          <Card>
            <Eyebrow>History</Eyebrow>
            <div style={{ marginTop: 8 }}>
              {[...sorted].reverse().map((w, i, arr) => {
                const prev = arr[i + 1];
                const diff = prev ? Number(w.kg) - Number(prev.kg) : null;
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{w.kg}<span style={{ fontSize: 11, fontStyle: "italic", color: C.muted }}> kg</span></div>
                      <div style={{ fontSize: 11, color: C.faint, marginTop: 2 }}>{fmtDate(w.date)}</div>
                    </div>
                    {diff != null && (
                      <div style={{ fontSize: 12, fontWeight: 600, color: diff < 0 ? C.positive : diff > 0 ? C.warning : C.faint }}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </div>
                    )}
                    <button onClick={() => removeWeight(w.id)} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 14, width: 26 }}>✕</button>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <div style={{ textAlign: "center", fontSize: 11, color: C.faint, paddingTop: 6 }}>
          Stored privately on this device.
        </div>
      </main>

      {/* Target popup */}
      {showTarget && (
        <div onClick={() => setShowTarget(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.border}`, padding: "24px 20px calc(env(safe-area-inset-bottom) + 24px)", animation: "tukaPop 0.25s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Eyebrow>Target weight</Eyebrow>
              <button onClick={() => setShowTarget(false)} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input autoFocus type="number" inputMode="decimal" value={tInput} placeholder="e.g. 75"
                onChange={e => setTInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveTarget()}
                style={{ ...input, flex: 1, fontSize: 20, fontWeight: 600 }} />
              <button onClick={saveTarget} style={{
                padding: "0 26px", borderRadius: 12, border: "none", cursor: "pointer",
                background: C.text, color: C.bg, fontSize: 15, fontWeight: 600, fontFamily: "inherit",
              }}>Save</button>
            </div>
            <div style={{ fontSize: 12, color: C.faint, marginTop: 12 }}>Shown as the green dashed line on your trend. Your last two targets stay on the chart in grey.</div>

            {targets.length > 0 && (
              <div style={{ marginTop: 18 }}>
                <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Recent targets</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {[...targets].reverse().slice(0, 3).map((t, i) => (
                    <div key={t.id} style={{ fontSize: 13, fontWeight: 600, padding: "6px 12px", borderRadius: 999, background: C.surface2, border: `1px solid ${i === 0 ? C.positive + "66" : C.border}`, color: i === 0 ? C.positive : C.muted }}>
                      {t.value}<span style={{ fontSize: 10, fontStyle: "italic" }}> kg</span>{i === 0 ? " · now" : ""}
                    </div>
                  ))}
                </div>
                <button onClick={removeTarget} style={{ marginTop: 14, background: "transparent", border: "none", color: C.warning, cursor: "pointer", fontSize: 12, fontFamily: "inherit", padding: 0 }}>
                  Remove current target
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
