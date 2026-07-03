import { useState, useEffect } from "react";
import { C, MONTHS, todayStr } from "./theme";
import { supabase } from "./supabaseClient";
import WeightChart from "./WeightChart";
import { SPLIT_BY_DAY, DAY_LABELS, WEEK_ORDER, WORKOUTS } from "./workoutPlan";
import { DIET } from "./dietPlan";
import { BODY } from "./bodyComposition";
import BodyMap from "./BodyMap";

const RANGES = [
  { id: "1M", label: "1M", days: 31 },
  { id: "3M", label: "3M", days: 92 },
  { id: "6M", label: "6M", days: 183 },
  { id: "1Y", label: "1Y", days: 366 },
  { id: "ALL", label: "ALL", days: Infinity },
];

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

// ── Workout page (day-wise PPL split) ──
function WorkoutPage({ workoutDay, setWorkoutDay }) {
  const type = SPLIT_BY_DAY[workoutDay];
  const plan = WORKOUTS[type];
  const todayDow = new Date().getDay();
  return (
    <div key="workout" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      <Card>
        <Eyebrow>Workout plan</Eyebrow>
        <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
          {WEEK_ORDER.map(dow => {
            const active = dow === workoutDay;
            const isToday = dow === todayDow;
            return (
              <button key={dow} onClick={() => setWorkoutDay(dow)} style={{
                flex: 1, padding: "8px 0", borderRadius: 10, border: `1px solid ${active ? C.text : C.border}`,
                background: active ? C.text : "transparent", color: active ? C.bg : (isToday ? C.text : C.faint),
                fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>{DAY_LABELS[dow][0]}</button>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{type === "Rest" ? "Rest day" : type}</span>
            {workoutDay === todayDow && <span style={{ fontSize: 11, color: C.positive, fontWeight: 600 }}>· today</span>}
          </div>
          {plan && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{plan.subtitle}</div>}
        </div>
      </Card>

      {!plan ? (
        <Card style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img src="/dumbbell.png" alt="" width={28} height={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 13, color: C.faint }}>Recovery day — no lifting.</div>
        </Card>
      ) : (
        <Card>
          {plan.exercises.map((ex, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: i < plan.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: C.faint, paddingTop: 2 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</span>
                  {ex.tag && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 999, padding: "2px 7px" }}>{ex.tag}</span>}
                </div>
                {ex.note && <div style={{ fontSize: 11, color: C.faint, marginTop: 3 }}>{ex.note}</div>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: "nowrap", paddingTop: 1 }}>{ex.sets}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ── Diet page (calorie + macro targets) ──
function DietPage() {
  const total = DIET.calories;
  const numColor = { Protein: C.positive, Carbs: C.text, Fat: C.warning };
  const barColor = { Protein: C.positive, Carbs: C.muted, Fat: C.warning };
  return (
    <div key="diet" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      <Card style={{ padding: 22 }}>
        <Eyebrow>Daily target</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <Metric value={total.toLocaleString()} unit="kcal" />
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 14 }}>{DIET.note}</div>
      </Card>

      <Card>
        <Eyebrow>Macros</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {DIET.macros.map(m => {
            const kcal = m.grams * m.kcalPerG;
            const pct = Math.round((kcal / total) * 100);
            return (
              <div key={m.key} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: numColor[m.key], letterSpacing: "-0.02em" }}>
                  {m.grams}<span style={{ fontSize: 11, fontStyle: "italic", color: C.muted }}> g</span>
                </div>
                <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 5 }}>{m.key}</div>
                <div style={{ fontSize: 10, color: C.faint, marginTop: 6 }}>{kcal} kcal · {pct}%</div>
              </div>
            );
          })}
        </div>

        {/* proportion bar */}
        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 16 }}>
          {DIET.macros.map(m => (
            <div key={m.key} style={{ flex: m.grams * m.kcalPerG, background: barColor[m.key] }} />
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.faint, marginTop: 14, lineHeight: 1.5 }}>{DIET.derivedNote}</div>
      </Card>

      <Card>
        <Eyebrow>Key rule</Eyebrow>
        <div style={{ fontSize: 14, color: C.text, marginTop: 10 }}>{DIET.perMeal}</div>
      </Card>
    </div>
  );
}

// ── Body composition page (BMR + segmental lean/fat) ──
function BodyPage() {
  const [mode, setMode] = useState("lean"); // lean | fat
  const segs = mode === "lean" ? BODY.lean : BODY.fat;
  const src = mode === "lean" ? "/lean.png" : "/fat.png";
  return (
    <div key="bmr" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      {/* stats */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Eyebrow>Body composition</Eyebrow>
          <span style={{ fontSize: 10, color: C.faint }}>{fmtDate(BODY.date)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {[
            { label: "Muscle (SMM)", value: BODY.stats.smm, unit: "kg" },
            { label: "Body fat", value: BODY.stats.pbf, unit: "%" },
            { label: "BMR", value: BODY.stats.bmr, unit: "kcal" },
          ].map(s => (
            <div key={s.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.value}<span style={{ fontSize: 10, fontStyle: "italic", color: C.muted }}> {s.unit}</span></div>
              <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 5 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* segmental analysis — figure as full-bleed background, controls on top */}
      <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.border}`, background: "#080808" }}>
        <BodyMap src={src} segments={segs} />

        {/* top: title + lean/fat toggle */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: "16px 16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(180deg, rgba(8,8,8,0.9) 20%, rgba(8,8,8,0))" }}>
          <Eyebrow>Segmental analysis</Eyebrow>
          <div style={{ display: "flex", background: "rgba(28,28,30,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: `1px solid ${C.border}`, borderRadius: 999, padding: 3 }}>
            {["lean", "fat"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "6px 16px", borderRadius: 999, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                background: mode === m ? C.text : "transparent", color: mode === m ? C.bg : C.muted,
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* bottom: legend */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "26px 16px 14px", display: "flex", justifyContent: "center", gap: 16, background: "linear-gradient(0deg, rgba(8,8,8,0.9) 30%, rgba(8,8,8,0))" }}>
          {[["Normal", C.positive], ["Over", C.warning], ["Under", "#5AA9E6"]].map(([label, col]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: C.muted }}>
              <span style={{ width: 8, height: 8, borderRadius: 3, background: col }} />{label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Liquid-glass bottom navigation ──
function BottomNav({ view, setView }) {
  const tabs = [
    { id: "weight", icon: "/weigher.png" },
    { id: "workout", icon: "/dumbbell.png" },
    { id: "diet", icon: "/diet.png" },
    { id: "bmr", icon: "/body.png" },
  ];
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom) + 18px)", display: "flex", justifyContent: "center", zIndex: 150, pointerEvents: "none" }}>
      <div style={{
        display: "flex", gap: 6, alignItems: "center", padding: 7,
        background: "rgba(28,28,30,0.55)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: 999,
        boxShadow: "0 12px 34px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.14)",
        pointerEvents: "auto",
      }}>
        {tabs.map(t => {
          const active = view === t.id;
          return (
            <button key={t.id} onClick={() => setView(t.id)} aria-label={t.id} style={{
              position: "relative", width: 62, height: 52, borderRadius: 999, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", background: "transparent",
              WebkitTapHighlightColor: "transparent",
            }}>
              {active && (
                <span style={{
                  position: "absolute", inset: 0, borderRadius: 999, pointerEvents: "none",
                  background: "linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.06))",
                  border: "1px solid rgba(255,255,255,0.22)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), 0 3px 10px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
                }} />
              )}
              <img src={t.icon} alt="" width={24} height={24} style={{ position: "relative", opacity: active ? 1 : 0.5, transition: "opacity 0.2s" }} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TukaApp() {
  const [view, setView] = useState("weight"); // weight | workout | diet
  const [weights, setWeights] = useState([]);
  const [targets, setTargets] = useState([]);
  const [range, setRange] = useState("6M");
  const [wInput, setWInput] = useState("");
  const [dInput, setDInput] = useState(todayStr());
  const [tInput, setTInput] = useState("");
  const [showTarget, setShowTarget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [workoutDay, setWorkoutDay] = useState(new Date().getDay()); // 0=Sun..6=Sat
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Load everything from Supabase on mount.
  useEffect(() => {
    (async () => {
      const { data: w } = await supabase.from("tuka_weights").select("*").order("date", { ascending: true });
      const { data: t } = await supabase.from("tuka_targets").select("*").order("id", { ascending: true });
      if (w) setWeights(w);
      if (t) setTargets(t.map(r => ({ id: r.id, value: r.value })));
    })();
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  // Tap the logo to pull the latest deploy without deleting/re-adding the PWA.
  const forceRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    showToast("Updating…");
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.update()));
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
    } catch {}
    window.location.reload();
  };

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

  const logWeight = async () => {
    const kg = parseFloat(wInput);
    if (!kg || kg <= 0) { showToast("Enter a weight"); return; }
    const entry = { id: Date.now(), kg: Math.round(kg * 10) / 10, date: dInput };
    setWInput("");
    setDInput(todayStr());
    try {
      // one weigh-in per day — replace any existing row for this date
      await supabase.from("tuka_weights").delete().eq("date", entry.date);
      const { error } = await supabase.from("tuka_weights").insert(entry);
      if (error) throw error;
      setWeights(prev => [...prev.filter(w => w.date !== entry.date), entry]);
      showToast("Logged");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };
  const removeWeight = async (id) => {
    setWeights(prev => prev.filter(w => w.id !== id));
    await supabase.from("tuka_weights").delete().eq("id", id);
  };

  const openTarget = () => { setTInput(target != null ? String(target) : ""); setShowTarget(true); };
  const saveTarget = async () => {
    const t = parseFloat(tInput);
    if (!t || t <= 0) { showToast("Enter a target"); return; }
    const value = Math.round(t * 10) / 10;
    if (value === target) { setShowTarget(false); return; }
    const row = { id: Date.now(), value };
    setShowTarget(false);
    try {
      const { error } = await supabase.from("tuka_targets").insert(row);
      if (error) throw error;
      setTargets(prev => [...prev, row]);
      showToast("Target set");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };
  const removeTarget = async () => {
    const current = targets[targets.length - 1];
    setTargets(prev => prev.slice(0, -1));
    setShowTarget(false);
    if (current) await supabase.from("tuka_targets").delete().eq("id", current.id);
    showToast("Target removed");
  };

  const input = {
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: "12px 14px", color: C.text, fontSize: 15, fontFamily: "inherit", width: "100%",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, system-ui, sans-serif", maxWidth: 480, margin: "0 auto", padding: "0 16px calc(env(safe-area-inset-bottom) + 104px)", position: "relative", WebkitFontSmoothing: "antialiased" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400..700;1,14..32,400..600&display=swap" rel="stylesheet" />
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        input { outline: none; }
        input[type=date] { color-scheme: dark; }
        @keyframes tukaIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes tukaPop { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes tukaSheet { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes tukaSpin { to { transform: rotate(360deg); } }
      `}</style>

      {toast && (
        <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 14px)", left: "50%", transform: "translateX(-50%)", zIndex: 99, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "9px 18px", fontSize: 13, color: C.text, backdropFilter: "blur(12px)" }}>
          {toast}
        </div>
      )}

      {/* Header — note the safe-area top padding so it clears the notch */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(env(safe-area-inset-top) + 26px) 2px 22px", minHeight: 96 }}>
        <div role="button" aria-label="Refresh app" onClick={forceRefresh} title="Tap to update to the latest version" style={{ display: "flex", alignItems: "center", gap: 11, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          <img src="/tuka-icon.png" alt="" width={34} height={34} style={{ borderRadius: 9, animation: refreshing ? "tukaSpin 0.8s linear infinite" : "none" }} />
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>tuka</div>
        </div>
        {view === "weight" && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setShowHistory(true)} aria-label="Weight history" style={{
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              width: 48, height: 48, borderRadius: "50%", padding: 0,
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <img src="/chart.png" alt="" width={22} height={22} />
            </button>
            <button onClick={openTarget} aria-label="Set target" style={{
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              width: 48, height: 48, borderRadius: "50%", padding: 0,
              background: C.surface, border: `1px solid ${C.border}`,
            }}>
              <img src="/target.png" alt="" width={22} height={22} />
            </button>
          </div>
        )}
      </header>

      {/* ── WEIGHT ── */}
      {view === "weight" && (
        <main key="weight" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
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
              width: "100%", marginTop: 12, padding: "14px", borderRadius: 20, border: "none", cursor: "pointer",
              background: C.text, color: C.bg, fontSize: 14, fontWeight: 600, fontFamily: "inherit",
            }}>Log weight</button>
          </Card>
        </main>
      )}

      {/* ── WORKOUT ── */}
      {view === "workout" && <WorkoutPage workoutDay={workoutDay} setWorkoutDay={setWorkoutDay} />}

      {/* ── DIET ── */}
      {view === "diet" && <DietPage />}

      {/* ── BMR / BODY ── */}
      {view === "bmr" && <BodyPage />}

      {/* Target popup */}
      {showTarget && (
        <div onClick={() => setShowTarget(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 380, background: C.surface, borderRadius: 24, border: `1px solid ${C.border}`, padding: 24, animation: "tukaPop 0.25s ease" }}>
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

      {/* History popup — bottom sheet */}
      {showHistory && (
        <div onClick={() => setShowHistory(false)} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, height: "75vh", display: "flex", flexDirection: "column", background: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.border}`, padding: "24px 20px calc(env(safe-area-inset-bottom) + 24px)", animation: "tukaSheet 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Eyebrow>Weight history</Eyebrow>
              <button onClick={() => setShowHistory(false)} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            {sorted.length === 0 ? (
              <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 13 }}>No weigh-ins yet.</div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflowY: "auto", marginTop: 4 }}>
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
                      <button onClick={() => removeWeight(w.id)} aria-label="Delete" style={{ background: "transparent", border: "none", cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src="/trash.png" alt="" width={18} height={18} style={{ opacity: 0.65 }} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <BottomNav view={view} setView={setView} />
    </div>
  );
}
