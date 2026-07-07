import { useState, useEffect, useRef } from "react";
import { C, MONTHS, todayStr } from "./theme";
import { supabase } from "./supabaseClient";
import WeightChart from "./WeightChart";
import { DAY_LABELS, WEEK_ORDER } from "./workoutPlan";
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

// ── Workout page (renders the user's uploaded, day-wise plan) ──
function WorkoutPage({ plan, workoutDay, setWorkoutDay, onOpenUpload }) {
  const todayDow = new Date().getDay();
  const day = plan?.days?.[DAY_LABELS[workoutDay]] || null;
  const hasEx = day && Array.isArray(day.exercises) && day.exercises.length > 0;

  if (!plan) {
    return (
      <div key="workout" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
        <Card style={{ padding: "44px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
          <img src="/dumbbell.png" alt="" width={30} height={30} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No workout plan yet</div>
          <div style={{ fontSize: 13, color: C.faint, maxWidth: 260, lineHeight: 1.5 }}>Upload your plan as a PDF and we'll lay it out day by day.</div>
          <button onClick={onOpenUpload} style={{ marginTop: 6, background: C.text, color: C.bg, border: "none", borderRadius: 999, padding: "12px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>⤒ Upload plan</button>
        </Card>
      </div>
    );
  }

  return (
    <div key="workout" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Eyebrow>Workout plan</Eyebrow>
          <button onClick={onOpenUpload} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 12px", color: C.text, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>⤒ Upload</button>
        </div>
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
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>{hasEx ? (day.title || "Workout") : "Rest day"}</span>
            {workoutDay === todayDow && <span style={{ fontSize: 11, color: C.positive, fontWeight: 600 }}>· today</span>}
          </div>
          {hasEx && day.focus && <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>{day.focus}</div>}
        </div>
      </Card>

      {!hasEx ? (
        <Card style={{ padding: "48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <img src="/dumbbell.png" alt="" width={28} height={28} style={{ opacity: 0.4 }} />
          <div style={{ fontSize: 13, color: C.faint }}>Recovery day — no lifting.</div>
        </Card>
      ) : (
        <Card>
          {day.exercises.map((ex, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0", borderBottom: i < day.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 22, fontSize: 12, fontWeight: 700, color: C.faint, paddingTop: 2 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{ex.name}</span>
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

// ── Workout upload sheet: copy-a-prompt → upload PDF → preview → save ──
const WORKOUT_PROMPT = `Create my weekly workout plan as plain text I can save as a PDF.
Format it EXACTLY like this, Monday through Sunday:

Monday — Push (chest, shoulders, triceps)
1. Incline DB press — 4 x 8-10
2. Lateral raise — 3 x 12-15
Tuesday — Rest
Wednesday — Legs (quads, hams, glutes)
1. ...

Rules: one day per line block, day name + workout title, then a numbered list of exercises each as "name — sets x reps". Write "Rest" for rest days. Keep it plain, no extra commentary.`;

function WorkoutUploadSheet({ onClose, onParse, onSave }) {
  const [parsed, setParsed] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);

  const pick = async (file) => {
    if (!file) return;
    setBusy(true); setErr("");
    try { setParsed(await onParse(file)); }
    catch (e) { setErr(e.message || "Couldn't read that PDF"); }
    setBusy(false);
  };
  const copyPrompt = async () => {
    try { await navigator.clipboard.writeText(WORKOUT_PROMPT); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, maxHeight: "86vh", display: "flex", flexDirection: "column", background: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.border}`, padding: "22px 20px calc(env(safe-area-inset-bottom) + 20px)", animation: "tukaSheet 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <Eyebrow>{parsed ? "Review your plan" : "Upload workout plan"}</Eyebrow>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <input ref={fileRef} type="file" accept="application/pdf,.pdf" style={{ display: "none" }}
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; pick(f); }} />

        {!parsed ? (
          <div style={{ overflowY: "auto" }}>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
              Ask ChatGPT or Claude for your plan using the prompt below, save its reply as a <b style={{ color: C.text }}>PDF</b>, then upload it.
            </div>
            <div style={{ position: "relative", marginTop: 12, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 14px", fontSize: 12, color: C.muted, lineHeight: 1.5, whiteSpace: "pre-wrap", maxHeight: 180, overflowY: "auto" }}>
              {WORKOUT_PROMPT}
            </div>
            <button onClick={copyPrompt} style={{ width: "100%", marginTop: 10, background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12, padding: "11px", color: C.text, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{copied ? "Copied ✓" : "Copy prompt"}</button>

            {err && <div style={{ fontSize: 12, color: C.warning, marginTop: 12, textAlign: "center" }}>{err}</div>}

            <button onClick={() => fileRef.current?.click()} disabled={busy} style={{ width: "100%", marginTop: 12, background: C.text, color: C.bg, border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: busy ? 0.6 : 1 }}>
              {busy ? "Reading your PDF…" : "⤒ Choose PDF"}
            </button>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {WEEK_ORDER.map(dow => {
                const d = parsed.days?.[DAY_LABELS[dow]];
                const ex = d && Array.isArray(d.exercises) ? d.exercises : [];
                return (
                  <div key={dow} style={{ padding: "12px 0", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.faint, width: 34 }}>{DAY_LABELS[dow].toUpperCase()}</span>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{ex.length ? (d.title || "Workout") : "Rest"}</span>
                      {ex.length > 0 && <span style={{ fontSize: 11, color: C.faint }}>· {ex.length} exercises</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, paddingTop: 14 }}>
              <button onClick={() => { setParsed(null); setErr(""); }} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 16, padding: "15px", color: C.muted, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Try again</button>
              <button onClick={() => onSave(parsed)} style={{ flex: 1.4, background: C.text, color: C.bg, border: "none", borderRadius: 16, padding: "15px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Save plan</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Diet page (calorie + macro targets, computed from BMR or weight) ──
function DietPage({ weightKg, body }) {
  const numColor = { Protein: C.positive, Carbs: C.text, Fat: C.warning };
  const barColor = { Protein: C.positive, Carbs: C.muted, Fat: C.warning };

  const bmr = body?.stats?.bmr ? Number(body.stats.bmr) : null;
  const total = bmr ? Math.round(bmr) : (weightKg ? Math.round(weightKg * DIET.weightFactor) : null);
  const source = bmr
    ? "From your measured BMR."
    : (weightKg ? `Estimated from your weight (${weightKg} kg × ${DIET.weightFactor}). Add your InBody in the BMR tab for a precise number.` : null);

  const macros = total ? ["Protein", "Carbs", "Fat"].map(key => {
    const kcal = Math.round(total * DIET.macroSplit[key]);
    const grams = Math.round(kcal / DIET.kcalPerG[key]);
    return { key, grams, kcal, pct: Math.round(DIET.macroSplit[key] * 100) };
  }) : [];

  if (!total) {
    return (
      <div key="diet" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
        <Card style={{ padding: "40px 22px", textAlign: "center" }}>
          <Eyebrow>Daily target</Eyebrow>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 14 }}>Log a weigh-in (or add your BMR) to see your calorie & macro targets.</div>
        </Card>
      </div>
    );
  }

  return (
    <div key="diet" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      <Card style={{ padding: 22 }}>
        <Eyebrow>Daily target</Eyebrow>
        <div style={{ marginTop: 12 }}>
          <Metric value={total.toLocaleString()} unit="kcal" />
        </div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 14 }}>{source}</div>
      </Card>

      <Card>
        <Eyebrow>Macros</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {macros.map(m => (
            <div key={m.key} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: numColor[m.key], letterSpacing: "-0.02em" }}>
                {m.grams}<span style={{ fontSize: 11, fontStyle: "italic", color: C.muted }}> g</span>
              </div>
              <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 5 }}>{m.key}</div>
              <div style={{ fontSize: 10, color: C.faint, marginTop: 6 }}>{m.kcal} kcal · {m.pct}%</div>
            </div>
          ))}
        </div>

        {/* proportion bar */}
        <div style={{ display: "flex", height: 8, borderRadius: 999, overflow: "hidden", marginTop: 16 }}>
          {macros.map(m => (
            <div key={m.key} style={{ flex: m.kcal, background: barColor[m.key] }} />
          ))}
        </div>

        <div style={{ fontSize: 11, color: C.faint, marginTop: 14, lineHeight: 1.5 }}>
          Protein 30% · Carbs 45% · Fat 25% of your daily calories.
        </div>
      </Card>

      <Card>
        <Eyebrow>Key rule</Eyebrow>
        <div style={{ fontSize: 14, color: C.text, marginTop: 10 }}>{DIET.perMeal}</div>
      </Card>
    </div>
  );
}

// ── Body composition page (BMR + segmental lean/fat) ──
function BodyPage({ body, email, onEdit, onUpload, analyzing, onSignOut }) {
  const [mode, setMode] = useState("lean"); // lean | fat
  const fileRef = useRef(null);
  const segs = body ? (mode === "lean" ? body.lean : body.fat) : null;
  // figure reflects the person's build: under → thin, normal → lean, over → heavy
  const STATUS_IMG = { Under: "/under.png", Normal: "/lean.png", Over: "/fat.png" };
  const src = segs ? (STATUS_IMG[segs.trunk.status] || "/lean.png") : "/lean.png";
  return (
    <div key="bmr" style={{ display: "flex", flexDirection: "column", gap: 14, animation: "tukaIn 0.35s ease" }}>
      {/* account */}
      <Card style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.08em", textTransform: "uppercase" }}>Signed in</div>
          <div style={{ fontSize: 13, color: C.text, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email || "—"}</div>
        </div>
        <button onClick={onSignOut} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 999, padding: "8px 16px", color: C.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Sign out</button>
      </Card>

      {/* stats */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Eyebrow>Body composition</Eyebrow>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {body && <span style={{ fontSize: 10, color: C.faint, marginRight: 4 }}>{fmtDate(body.date)}</span>}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ""; if (f) onUpload(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={analyzing} style={{ background: C.text, border: "none", borderRadius: 999, padding: "6px 13px", color: C.bg, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: analyzing ? 0.6 : 1 }}>{analyzing ? "Reading…" : "⤒ Upload"}</button>
            <button onClick={onEdit} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 12px", color: C.text, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{body ? "Edit" : "Add"}</button>
          </div>
        </div>
        {!body ? (
          <div style={{ padding: "22px 0 6px", textAlign: "center", color: C.faint, fontSize: 13 }}>
            Add your InBody results to see your body composition.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
            {[
              { label: "Muscle (SMM)", value: body.stats.smm, unit: "kg" },
              { label: "Body fat", value: body.stats.pbf, unit: "%" },
              { label: "BMR", value: body.stats.bmr, unit: "kcal" },
            ].map(s => (
              <div key={s.label} style={{ background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 16, padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.value}<span style={{ fontSize: 10, fontStyle: "italic", color: C.muted }}> {s.unit}</span></div>
                <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {!body ? null : (
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
      )}
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

// ── Onboarding / auth: enter email, then a 4-digit code to be remembered ──
function AuthScreen({ onAuthed }) {
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [existing, setExisting] = useState(false); // does this email already have an account?
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const em = email.trim().toLowerCase();

  const nextFromEmail = async () => {
    if (!em.includes("@") || !em.includes(".")) { setErr("Enter a valid email"); return; }
    setBusy(true); setErr("");
    const { data, error } = await supabase.from("tuka_users").select("id").eq("email", em).maybeSingle();
    setBusy(false);
    if (error) { setErr("Something went wrong — try again"); return; }
    setExisting(!!data);
    setStep("code");
  };

  const submitCode = async () => {
    if (!/^\d{4}$/.test(code)) { setErr("Enter a 4-digit code"); return; }
    setBusy(true); setErr("");
    if (existing) {
      const { data } = await supabase.from("tuka_users").select("id").eq("email", em).eq("code", code).maybeSingle();
      setBusy(false);
      if (data) onAuthed({ id: data.id, email: em });
      else setErr("Wrong code for this email");
      return;
    }
    const id = crypto.randomUUID();
    const { error } = await supabase.from("tuka_users").insert({ id, email: em, code });
    setBusy(false);
    if (error) { setErr(error.code === "23505" ? "That code is taken — pick another" : "Couldn't create account — try again"); return; }
    onAuthed({ id, email: em });
  };

  const fld = {
    width: "100%", boxSizing: "border-box", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16,
    padding: "17px 18px", color: C.text, fontSize: 16, fontFamily: "inherit", outline: "none",
  };
  const cta = {
    width: "100%", boxSizing: "border-box", marginTop: 12, padding: "17px", borderRadius: 16, border: "none", cursor: "pointer",
    background: C.text, color: C.bg, fontSize: 16, fontWeight: 700, fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: `#0C0C0C url(/onboard.png) center top / cover no-repeat`, color: C.text, fontFamily: "'Inter', -apple-system, system-ui, sans-serif", WebkitFontSmoothing: "antialiased" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap" rel="stylesheet" />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "60px 22px calc(env(safe-area-inset-bottom) + 24px)", background: "linear-gradient(180deg, rgba(12,12,12,0) 0%, rgba(12,12,12,0.82) 26%, #0C0C0C 66%)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Start Your Fitness Journey</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 8 }}>
            {step === "email" ? "Enter your email to begin." : existing ? "Enter your code to sign in." : "Set a 4-digit code you'll remember."}
          </div>

          <div style={{ marginTop: 20 }}>
            {step === "email" ? (
              <input type="email" inputMode="email" autoCapitalize="off" autoCorrect="off" spellCheck={false}
                value={email} placeholder="Enter your email"
                onChange={e => { setEmail(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && nextFromEmail()} style={fld} />
            ) : (
              <input type="tel" inputMode="numeric" maxLength={4} autoFocus value={code} placeholder="• • • •"
                onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && submitCode()}
                style={{ ...fld, textAlign: "center", fontSize: 28, fontWeight: 700, letterSpacing: "0.5em", paddingLeft: 24 }} />
            )}

            {err && <div style={{ fontSize: 12, color: C.warning, marginTop: 10 }}>{err}</div>}

            <button onClick={step === "email" ? nextFromEmail : submitCode} disabled={busy} style={{ ...cta, opacity: busy ? 0.6 : 1 }}>
              {busy ? "…" : "Continue"} {!busy && <span style={{ fontSize: 18 }}>→</span>}
            </button>

            {step === "code" && (
              <button onClick={() => { setStep("email"); setCode(""); setErr(""); }} style={{ marginTop: 14, width: "100%", background: "transparent", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Use a different email
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Body composition editor ──
const BODY_PARTS = [["rightArm", "Right arm"], ["leftArm", "Left arm"], ["trunk", "Trunk"], ["rightLeg", "Right leg"], ["leftLeg", "Left leg"]];
const STATUSES = ["Normal", "Over", "Under"];
const statusCol = s => (s === "Over" ? C.warning : s === "Under" ? "#5AA9E6" : C.positive);

function BodyEditor({ initial, onClose, onSave }) {
  const [form, setForm] = useState(() => JSON.parse(JSON.stringify(initial || BODY)));
  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const setStat = (k, v) => setForm(f => ({ ...f, stats: { ...f.stats, [k]: v } }));
  const setSeg = (grp, part, field, v) => setForm(f => ({ ...f, [grp]: { ...f[grp], [part]: { ...f[grp][part], [field]: v } } }));
  const fld = { background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 15, fontFamily: "inherit", width: "100%" };

  const save = () => {
    const segClean = g => { const o = {}; BODY_PARTS.forEach(([k]) => { o[k] = { kg: num(form[g][k].kg), status: form[g][k].status }; }); return o; };
    onSave({
      date: form.date || todayStr(),
      stats: { smm: num(form.stats.smm), pbf: num(form.stats.pbf), bmr: num(form.stats.bmr) },
      lean: segClean("lean"),
      fat: segClean("fat"),
    });
  };

  const SegGroup = ({ grp, label }) => (
    <div style={{ marginTop: 18 }}>
      <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>{label} (kg)</div>
      {BODY_PARTS.map(([k, name]) => (
        <div key={k} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div style={{ width: 68, fontSize: 12, color: C.muted }}>{name}</div>
          <input type="number" inputMode="decimal" value={form[grp][k].kg} onChange={e => setSeg(grp, k, "kg", e.target.value)} style={{ ...fld, flex: 1, fontSize: 14, textAlign: "center" }} />
          <div style={{ display: "flex", gap: 4 }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setSeg(grp, k, "status", s)} title={s} style={{
                width: 30, height: 34, borderRadius: 8, cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 700,
                border: `1px solid ${form[grp][k].status === s ? statusCol(s) : C.border}`,
                background: form[grp][k].status === s ? statusCol(s) + "22" : "transparent",
                color: form[grp][k].status === s ? statusCol(s) : C.faint,
              }}>{s[0]}</button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, height: "88vh", display: "flex", flexDirection: "column", background: C.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, border: `1px solid ${C.border}`, padding: "22px 20px 0", animation: "tukaSheet 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <Eyebrow>Edit body data</Eyebrow>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingBottom: 12 }}>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 10, color: C.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Test date & stats</div>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={{ ...fld, fontSize: 13, marginBottom: 8 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["smm", "SMM kg"], ["pbf", "Fat %"], ["bmr", "BMR"]].map(([k, lab]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: C.faint, marginBottom: 5, textAlign: "center" }}>{lab}</div>
                  <input type="number" inputMode="decimal" value={form.stats[k]} onChange={e => setStat(k, e.target.value)} style={{ ...fld, fontSize: 14, textAlign: "center" }} />
                </div>
              ))}
            </div>
          </div>
          <SegGroup grp="lean" label="Lean mass" />
          <SegGroup grp="fat" label="Fat mass" />
        </div>

        <div style={{ padding: "12px 0 calc(env(safe-area-inset-bottom) + 16px)", background: C.surface }}>
          <button onClick={save} style={{ width: "100%", padding: "15px", borderRadius: 16, border: "none", cursor: "pointer", background: C.text, color: C.bg, fontSize: 15, fontWeight: 600, fontFamily: "inherit" }}>Save</button>
        </div>
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
  // Lightweight code-based login: the signed-in user is remembered on-device.
  const [user, setUser] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem("tuka_user") || "null"); return u && u.id ? u : null; }
    catch { return null; }
  });
  const [body, setBody] = useState(null);            // per-user body composition (from DB)
  const [showBodyEdit, setShowBodyEdit] = useState(false);
  const [bodyEditInitial, setBodyEditInitial] = useState(null); // data to prefill the editor
  const [analyzing, setAnalyzing] = useState(false);
  const [workout, setWorkout] = useState(null);      // per-user uploaded workout plan
  const [showWorkoutUpload, setShowWorkoutUpload] = useState(false);

  const userId = user?.id;

  const onAuthed = (u) => { localStorage.setItem("tuka_user", JSON.stringify(u)); setUser(u); };
  const signOut = () => { localStorage.removeItem("tuka_user"); setUser(null); setWeights([]); setTargets([]); setBody(null); setWorkout(null); };

  // Load this user's data (every query is scoped to their user_id).
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: w } = await supabase.from("tuka_weights").select("*").eq("user_id", user.id).order("date", { ascending: true });
      const { data: t } = await supabase.from("tuka_targets").select("*").eq("user_id", user.id).order("id", { ascending: true });
      const { data: b } = await supabase.from("tuka_body").select("data").eq("user_id", user.id).maybeSingle();
      const { data: wk } = await supabase.from("tuka_workout").select("data").eq("user_id", user.id).maybeSingle();
      setWeights(w || []);
      setTargets((t || []).map(r => ({ id: r.id, value: r.value })));
      setBody(b?.data ?? null);
      setWorkout(wk?.data ?? null);
    })();
  }, [user]);

  const saveBody = async (data) => {
    setBody(data);
    setShowBodyEdit(false);
    try {
      const { error } = await supabase.from("tuka_body").upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast("Body data saved");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };
  const openBodyEdit = (initial) => { setBodyEditInitial(initial); setShowBodyEdit(true); };

  // Downscale + compress an image to keep the upload small, return base64 (no prefix).
  const compressImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1600;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Upload an InBody photo → Gemini → open the editor prefilled for review.
  const analyzeBMR = async (file) => {
    if (!file || analyzing) return;
    setAnalyzing(true);
    showToast("Reading your InBody…");
    try {
      const base64 = await compressImage(file);
      const res = await fetch("/api/parse-bmr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: "image/jpeg" }),
      });
      const j = await res.json();
      if (!res.ok || !j.data) throw new Error(j.error || "Couldn't read that image");
      openBodyEdit(j.data);
      showToast("Check the values, then Save");
    } catch (err) {
      showToast(err.message || "Couldn't read that image");
    }
    setAnalyzing(false);
  };

  // Read a PDF file to base64 (no compression — plans are small).
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const parseWorkout = async (file) => {
    const pdf = await fileToBase64(file);
    const res = await fetch("/api/parse-workout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pdf, mimeType: file.type || "application/pdf" }),
    });
    const j = await res.json();
    if (!res.ok || !j.data) throw new Error(j.error || "Couldn't read that PDF");
    return j.data;
  };
  const saveWorkout = async (data) => {
    setWorkout(data);
    setShowWorkoutUpload(false);
    try {
      const { error } = await supabase.from("tuka_workout").upsert({ user_id: userId, data, updated_at: new Date().toISOString() });
      if (error) throw error;
      showToast("Workout plan saved");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };

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
      // one weigh-in per day — replace any existing row for this date (this user only)
      await supabase.from("tuka_weights").delete().eq("user_id", userId).eq("date", entry.date);
      const { error } = await supabase.from("tuka_weights").insert({ ...entry, user_id: userId });
      if (error) throw error;
      setWeights(prev => [...prev.filter(w => w.date !== entry.date), entry]);
      showToast("Logged");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };
  const removeWeight = async (id) => {
    setWeights(prev => prev.filter(w => w.id !== id));
    await supabase.from("tuka_weights").delete().eq("user_id", userId).eq("id", id);
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
      const { error } = await supabase.from("tuka_targets").insert({ ...row, user_id: userId });
      if (error) throw error;
      setTargets(prev => [...prev, row]);
      showToast("Target set");
    } catch (err) { showToast("Couldn't save: " + (err?.message || "error")); }
  };
  const removeTarget = async () => {
    const current = targets[targets.length - 1];
    setTargets(prev => prev.slice(0, -1));
    setShowTarget(false);
    if (current) await supabase.from("tuka_targets").delete().eq("user_id", userId).eq("id", current.id);
    showToast("Target removed");
  };

  const input = {
    background: C.surface2, border: `1px solid ${C.border}`, borderRadius: 12,
    padding: "12px 14px", color: C.text, fontSize: 15, fontFamily: "inherit", width: "100%",
  };

  if (!user) return <AuthScreen onAuthed={onAuthed} />;

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
      {view === "workout" && <WorkoutPage plan={workout} workoutDay={workoutDay} setWorkoutDay={setWorkoutDay} onOpenUpload={() => setShowWorkoutUpload(true)} />}

      {/* ── DIET ── */}
      {view === "diet" && <DietPage weightKg={latest ? Number(latest.kg) : null} body={body} />}

      {/* ── BMR / BODY ── */}
      {view === "bmr" && <BodyPage body={body} email={user.email} onEdit={() => openBodyEdit(body)} onUpload={analyzeBMR} analyzing={analyzing} onSignOut={signOut} />}

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

      {showBodyEdit && <BodyEditor initial={bodyEditInitial} onClose={() => setShowBodyEdit(false)} onSave={saveBody} />}

      {showWorkoutUpload && <WorkoutUploadSheet onClose={() => setShowWorkoutUpload(false)} onParse={parseWorkout} onSave={saveWorkout} />}

      <BottomNav view={view} setView={setView} />
    </div>
  );
}
