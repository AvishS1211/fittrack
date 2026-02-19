import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://mwyredyryqtwlaqllbra.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13eXJlZHlyeXF0d2xhcWxsYnJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0OTM5MzYsImV4cCI6MjA4NzA2OTkzNn0.xrh4HK0VN979PcMa3Xjfvg_eVXOLh5KD7uuFZ40PZ3Q"
);

const CATEGORIES = [
  { name: "Chest", icon: "🏋️", color: "#FF3D00" },
  { name: "Back", icon: "💪", color: "#FF6D00" },
  { name: "Legs", icon: "🦵", color: "#FF9100" },
  { name: "Shoulders", icon: "🔝", color: "#FF3D00" },
  { name: "Arms", icon: "💥", color: "#FF6D00" },
  { name: "Core", icon: "⚡", color: "#FF9100" },
  { name: "Cardio", icon: "🏃", color: "#FF3D00" },
  { name: "Other", icon: "🎯", color: "#FF6D00" },
];

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmt(n) { return n < 10 ? `0${n}` : `${n}`; }
function todayStr() { const d = new Date(); return `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())}`; }
function formatDate(s) { const d = new Date(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; }

function StatRing({ value, max, size = 80, stroke = 7, color = "#FF3D00", label, sub }) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const dash = pct * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E1E1E" strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.34,1.56,0.64,1)", filter: `drop-shadow(0 0 8px ${color}99)` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>{Math.round(pct * 100)}%</div>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#666", letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 12, color, fontWeight: 700 }}>{sub}</div>
      </div>
    </div>
  );
}

export default function FitnessTracker() {
  const [view, setView] = useState("dashboard");
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);
  const [goals, setGoals] = useState({ calories: 2500, protein: 150, workoutsPerWeek: 5 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("workout"); // workout | meal for add view
  const [aiQ, setAiQ] = useState("");
  const [aiMsg, setAiMsg] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showGoals, setShowGoals] = useState(false);

  const [wForm, setWForm] = useState({ exercise: "", category: "Chest", sets: "", reps: "", weight: "", duration: "", date: todayStr(), note: "" });
  const [mForm, setMForm] = useState({ name: "", type: "Breakfast", calories: "", protein: "", carbs: "", fat: "", date: todayStr() });

  // ── Load from Supabase ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: w } = await supabase.from("fit_workouts").select("*").order("date", { ascending: false });
        const { data: m } = await supabase.from("fit_meals").select("*").order("date", { ascending: false });
        const { data: a } = await supabase.from("fit_ai").select("*").order("created_at", { ascending: false }).limit(10);
        const { data: g } = await supabase.from("fit_goals").select("*").eq("id", 1).single();
        if (w) setWorkouts(w);
        if (m) setMeals(m);
        if (a) setAiHistory(a);
        if (g) setGoals({ calories: g.calories, protein: g.protein, workoutsPerWeek: g.workouts_per_week });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  // ── Today's stats ──
  const todayWorkouts = workouts.filter(w => w.date === todayStr());
  const todayMeals = meals.filter(m => m.date === todayStr());
  const todayCalories = todayMeals.reduce((s, m) => s + Number(m.calories || 0), 0);
  const todayProtein = todayMeals.reduce((s, m) => s + Number(m.protein || 0), 0);

  // ── This week's workouts ──
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekWorkouts = workouts.filter(w => new Date(w.date) >= weekStart).length;

  // ── Weekly chart data ──
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = `${d.getFullYear()}-${fmt(d.getMonth()+1)}-${fmt(d.getDate())}`;
    const cal = meals.filter(m => m.date === ds).reduce((s, m) => s + Number(m.calories || 0), 0);
    const worked = workouts.some(w => w.date === ds);
    return { label: DAYS[d.getDay()], cal, worked, isToday: i === 6 };
  });
  const maxCal = Math.max(...weekDays.map(d => d.cal), goals.calories);

  // ── Add Workout ──
  const addWorkout = async () => {
    if (!wForm.exercise.trim()) { showToast("Enter exercise name", "error"); return; }
    const entry = { id: Date.now(), ...wForm, sets: Number(wForm.sets) || 0, reps: Number(wForm.reps) || 0, weight: Number(wForm.weight) || 0, duration: Number(wForm.duration) || 0 };
    console.log("Saving workout:", JSON.stringify(entry));
    try {
      const { data, error } = await supabase.from("fit_workouts").insert(entry).select();
      console.log("Supabase data:", JSON.stringify(data), "error:", JSON.stringify(error));
      if (error) throw error;
      setWorkouts(prev => [entry, ...prev]);
      setWForm({ exercise: "", category: "Chest", sets: "", reps: "", weight: "", duration: "", date: todayStr(), note: "" });
      showToast("Workout logged! 💪");
      setView("dashboard");
    } catch (err) {
      console.log("Error:", JSON.stringify(err));
      showToast("Failed: " + (err?.message || "Unknown error"), "error");
    }
  };

  // ── Add Meal ──
  const addMeal = async () => {
    if (!mForm.name.trim()) { showToast("Enter meal name", "error"); return; }
    const entry = { id: Date.now(), ...mForm, calories: Number(mForm.calories) || 0, protein: Number(mForm.protein) || 0, carbs: Number(mForm.carbs) || 0, fat: Number(mForm.fat) || 0 };
    try {
      const { error } = await supabase.from("fit_meals").insert(entry);
      if (error) throw error;
      setMeals(prev => [entry, ...prev]);
      setMForm({ name: "", type: "Breakfast", calories: "", protein: "", carbs: "", fat: "", date: todayStr() });
      showToast("Meal logged! 🍎");
      setView("dashboard");
    } catch { showToast("Failed to save", "error"); }
  };

  // ── Delete ──
  const deleteWorkout = async (id) => {
    await supabase.from("fit_workouts").delete().eq("id", id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
    showToast("Deleted", "info");
  };
  const deleteMeal = async (id) => {
    await supabase.from("fit_meals").delete().eq("id", id);
    setMeals(prev => prev.filter(m => m.id !== id));
    showToast("Deleted", "info");
  };

  // ── AI Coach ──
  const askAI = async () => {
    if (!aiQ.trim()) return;
    setAiLoading(true);
    setAiMsg("");
    const summary = `Goals: ${goals.calories} cal/day, ${goals.protein}g protein, ${goals.workoutsPerWeek} workouts/week. Today: ${todayCalories} cal eaten, ${todayProtein}g protein, ${todayWorkouts.length} workouts done. This week: ${weekWorkouts} workouts completed. Recent workouts: ${workouts.slice(0,5).map(w => `${w.exercise} (${w.category})`).join(", ") || "none"}.`;
    const prompt = `You are an elite personal fitness coach. Give sharp, motivating, actionable advice. Keep it under 200 words. Use bullet points. Be direct and energetic like a real coach.\n\nUser data: ${summary}\n\nQuestion: ${aiQ}`;
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      const answer = data?.answer || "Couldn't get a response.";
      setAiMsg(answer);
      await supabase.from("fit_ai").insert({ question: aiQ, answer });
      setAiHistory(prev => [{ question: aiQ, answer, created_at: new Date().toISOString() }, ...prev].slice(0, 10));
    } catch { setAiMsg("Network error. Try again."); }
    setAiLoading(false);
  };

  const QUICK_Q = ["Am I on track today?", "What should I eat now?", "Best workout for today?", "How to reach my goal faster?"];

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔥</div>
      <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, color: "#FF3D00", letterSpacing: 4 }}>LOADING...</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", color: "#fff", paddingBottom: 80, maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes fadeUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideIn { from { transform: translateY(-12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        input, textarea { outline: none; }
        button { cursor: pointer; border: none; }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 999, background: toast.type === "error" ? "#FF3D0022" : toast.type === "info" ? "#33333399" : "#FF3D0022", border: `1px solid ${toast.type === "error" ? "#FF3D00" : toast.type === "info" ? "#555" : "#FF6D00"}`, borderRadius: 50, padding: "10px 24px", color: "#fff", fontSize: 13, fontWeight: 600, backdropFilter: "blur(12px)", animation: "slideIn 0.3s ease", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "48px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 36, letterSpacing: 3, lineHeight: 1, background: "linear-gradient(135deg, #FF3D00, #FF9100)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FITTRACK</div>
          <div style={{ fontSize: 12, color: "#555", letterSpacing: 2, marginTop: 4 }}>{new Date().toDateString().toUpperCase()}</div>
        </div>
        <button onClick={() => setShowGoals(!showGoals)} style={{ background: "#1A1A1A", border: "1px solid #2A2A2A", borderRadius: 12, padding: "8px 14px", color: "#888", fontSize: 12, letterSpacing: 1 }}>
          🎯 GOALS
        </button>
      </div>

      {/* Goals Editor */}
      {showGoals && (
        <div style={{ margin: "0 20px 20px", background: "#111", borderRadius: 20, padding: 20, border: "1px solid #FF3D0033", animation: "fadeUp 0.3s ease" }}>
          <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 2, color: "#FF3D00", marginBottom: 16 }}>SET YOUR GOALS</div>
          {[
            { label: "Daily Calories", key: "calories", unit: "kcal" },
            { label: "Daily Protein", key: "protein", unit: "g" },
            { label: "Workouts/Week", key: "workoutsPerWeek", unit: "days" }
          ].map(g => (
            <div key={g.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#888" }}>{g.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={goals[g.key]} onChange={e => setGoals(prev => ({ ...prev, [g.key]: Number(e.target.value) }))}
                  style={{ width: 70, background: "#1A1A1A", border: "1px solid #333", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 14, textAlign: "right" }} />
                <div style={{ fontSize: 11, color: "#555", width: 28 }}>{g.unit}</div>
              </div>
            </div>
          ))}
          <button onClick={() => { supabase.from("fit_goals").upsert({ id: 1, calories: goals.calories, protein: goals.protein, workouts_per_week: goals.workoutsPerWeek }); setShowGoals(false); showToast("Goals saved! 🎯"); }}
            style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, #FF3D00, #FF9100)", color: "#fff", fontSize: 14, fontFamily: "'Bebas Neue'", letterSpacing: 2, marginTop: 4 }}>
            SAVE GOALS
          </button>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "0 20px" }}>

        {/* ── DASHBOARD ── */}
        {view === "dashboard" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* Today's Rings */}
            <div style={{ background: "#111", borderRadius: 24, padding: "24px 20px", border: "1px solid #1E1E1E", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 20 }}>TODAY'S PROGRESS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <StatRing value={todayCalories} max={goals.calories} color="#FF3D00" label="Calories" sub={`${todayCalories} kcal`} />
                <StatRing value={todayProtein} max={goals.protein} color="#FF9100" label="Protein" sub={`${todayProtein}g`} />
                <StatRing value={weekWorkouts} max={goals.workoutsPerWeek} color="#FF6D00" label="Workouts" sub={`${weekWorkouts}/${goals.workoutsPerWeek}`} />
              </div>
            </div>

            {/* Quick Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ background: "#111", borderRadius: 20, padding: 18, border: "1px solid #1E1E1E" }}>
                <div style={{ fontSize: 28, fontFamily: "'Bebas Neue'", color: "#FF3D00", letterSpacing: 2 }}>{todayWorkouts.length}</div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginTop: 2 }}>EXERCISES TODAY</div>
                {todayWorkouts.length > 0 && <div style={{ fontSize: 11, color: "#FF6D00", marginTop: 6 }}>{todayWorkouts[0].exercise}</div>}
              </div>
              <div style={{ background: "#111", borderRadius: 20, padding: 18, border: "1px solid #1E1E1E" }}>
                <div style={{ fontSize: 28, fontFamily: "'Bebas Neue'", color: "#FF9100", letterSpacing: 2 }}>{todayMeals.length}</div>
                <div style={{ fontSize: 11, color: "#555", letterSpacing: 1, marginTop: 2 }}>MEALS TODAY</div>
                {todayMeals.length > 0 && <div style={{ fontSize: 11, color: "#FF9100", marginTop: 6 }}>{goals.calories - todayCalories > 0 ? `${goals.calories - todayCalories} cal left` : "Goal reached! 🔥"}</div>}
              </div>
            </div>

            {/* Weekly Calorie Chart */}
            <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid #1E1E1E", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 16 }}>7-DAY CALORIES</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
                {weekDays.map((d, i) => {
                  const h = maxCal > 0 ? (d.cal / maxCal) * 64 : 0;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      {d.worked && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#FF3D00", boxShadow: "0 0 6px #FF3D00" }} />}
                      <div style={{ width: "100%", height: `${Math.max(h, 4)}px`, background: d.isToday ? "linear-gradient(180deg, #FF3D00, #FF9100)" : "#1E1E1E", borderRadius: "6px 6px 0 0", boxShadow: d.isToday ? "0 0 12px #FF3D0066" : "none", transition: "height 0.6s ease", border: d.cal >= goals.calories ? "1px solid #FF3D00" : "none" }} />
                      <div style={{ fontSize: 9, color: d.isToday ? "#FF6D00" : "#333", fontWeight: d.isToday ? 700 : 400 }}>{d.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#444" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FF3D00" }} /> workout day</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#444" }}><div style={{ width: 10, height: 6, borderRadius: 2, border: "1px solid #FF3D00" }} /> goal reached</div>
              </div>
            </div>

            {/* Recent Workouts */}
            {workouts.filter(w => w.date === todayStr()).length > 0 && (
              <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid #1E1E1E", marginBottom: 16 }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 16 }}>TODAY'S WORKOUTS</div>
                {workouts.filter(w => w.date === todayStr()).map((w, i) => {
                  const cat = CATEGORIES.find(c => c.name === w.category) || CATEGORIES[7];
                  return (
                    <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < todayWorkouts.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{cat.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{w.exercise}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          {w.sets > 0 && `${w.sets} sets`}{w.reps > 0 && ` × ${w.reps} reps`}{w.weight > 0 && ` · ${w.weight}kg`}{w.duration > 0 && ` · ${w.duration}min`}
                        </div>
                      </div>
                      <button onClick={() => deleteWorkout(w.id)} style={{ background: "#1A1A1A", border: "none", borderRadius: 8, color: "#444", width: 28, height: 28, fontSize: 12 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Today's Meals */}
            {meals.filter(m => m.date === todayStr()).length > 0 && (
              <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid #1E1E1E" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 16 }}>TODAY'S MEALS</div>
                {meals.filter(m => m.date === todayStr()).map((m, i) => {
                  const todayM = meals.filter(me => me.date === todayStr());
                  return (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < todayM.length - 1 ? "1px solid #1A1A1A" : "none" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FF910018", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                        {m.type === "Breakfast" ? "🌅" : m.type === "Lunch" ? "☀️" : m.type === "Dinner" ? "🌙" : "🍎"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          {m.calories > 0 && `${m.calories} kcal`}{m.protein > 0 && ` · ${m.protein}g protein`}{m.carbs > 0 && ` · ${m.carbs}g carbs`}
                        </div>
                      </div>
                      <button onClick={() => deleteMeal(m.id)} style={{ background: "#1A1A1A", border: "none", borderRadius: 8, color: "#444", width: 28, height: 28, fontSize: 12 }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}

            {workouts.length === 0 && meals.length === 0 && (
              <div style={{ background: "#111", borderRadius: 24, padding: 40, border: "1px solid #1E1E1E", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🔥</div>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 20, letterSpacing: 2, color: "#FF3D00", marginBottom: 8 }}>LET'S GET STARTED</div>
                <div style={{ fontSize: 13, color: "#555" }}>Log your first workout or meal to begin tracking</div>
              </div>
            )}
          </div>
        )}

        {/* ── ADD ── */}
        {view === "add" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Tab Toggle */}
            <div style={{ background: "#111", borderRadius: 16, padding: 4, display: "flex", marginBottom: 20, border: "1px solid #1E1E1E" }}>
              {[{ id: "workout", label: "💪 WORKOUT" }, { id: "meal", label: "🍎 MEAL" }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ flex: 1, padding: "12px", borderRadius: 12, background: activeTab === t.id ? "linear-gradient(135deg, #FF3D00, #FF9100)" : "transparent", color: activeTab === t.id ? "#fff" : "#555", fontSize: 12, fontFamily: "'Bebas Neue'", letterSpacing: 2, transition: "all 0.2s", boxShadow: activeTab === t.id ? "0 4px 16px #FF3D0044" : "none" }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Workout Form */}
            {activeTab === "workout" && (
              <div style={{ background: "#111", borderRadius: 24, padding: 24, border: "1px solid #1E1E1E" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 3, color: "#FF3D00", marginBottom: 20 }}>LOG WORKOUT</div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>EXERCISE NAME</div>
                  <input value={wForm.exercise} onChange={e => setWForm(f => ({ ...f, exercise: e.target.value }))} placeholder="e.g. Bench Press" style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 15, fontWeight: 600 }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>MUSCLE GROUP</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {CATEGORIES.map(cat => (
                      <button key={cat.name} onClick={() => setWForm(f => ({ ...f, category: cat.name }))} style={{ padding: "8px 4px", borderRadius: 10, background: wForm.category === cat.name ? `${cat.color}22` : "#0A0A0A", border: `1px solid ${wForm.category === cat.name ? cat.color + "88" : "#222"}`, color: wForm.category === cat.name ? cat.color : "#555", fontSize: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, transition: "all 0.2s" }}>
                        <span style={{ fontSize: 16 }}>{cat.icon}</span>
                        <span>{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[{ label: "SETS", key: "sets", ph: "4" }, { label: "REPS", key: "reps", ph: "12" }, { label: "WEIGHT (kg)", key: "weight", ph: "60" }].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6 }}>{f.label}</div>
                      <input type="number" value={wForm[f.key]} onChange={e => setWForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 16, fontFamily: "'Bebas Neue'", letterSpacing: 1, textAlign: "center" }} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>DURATION (min)</div>
                  <input type="number" value={wForm.duration} onChange={e => setWForm(f => ({ ...f, duration: e.target.value }))} placeholder="30" style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14 }} />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>DATE</div>
                  <input type="date" value={wForm.date} onChange={e => setWForm(f => ({ ...f, date: e.target.value }))} style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14 }} />
                </div>

                <button onClick={addWorkout} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "linear-gradient(135deg, #FF3D00, #FF9100)", color: "#fff", fontSize: 16, fontFamily: "'Bebas Neue'", letterSpacing: 3, boxShadow: "0 8px 24px #FF3D0044" }}>
                  LOG WORKOUT 💪
                </button>
              </div>
            )}

            {/* Meal Form */}
            {activeTab === "meal" && (
              <div style={{ background: "#111", borderRadius: 24, padding: 24, border: "1px solid #1E1E1E" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 3, color: "#FF9100", marginBottom: 20 }}>LOG MEAL</div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>MEAL NAME</div>
                  <input value={mForm.name} onChange={e => setMForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken & Rice" style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 15, fontWeight: 600 }} />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>MEAL TYPE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                    {MEAL_TYPES.map(t => (
                      <button key={t} onClick={() => setMForm(f => ({ ...f, type: t }))} style={{ padding: "10px 4px", borderRadius: 10, background: mForm.type === t ? "#FF910022" : "#0A0A0A", border: `1px solid ${mForm.type === t ? "#FF910088" : "#222"}`, color: mForm.type === t ? "#FF9100" : "#555", fontSize: 10, transition: "all 0.2s" }}>
                        {t === "Breakfast" ? "🌅" : t === "Lunch" ? "☀️" : t === "Dinner" ? "🌙" : "🍎"}<br />{t}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                  {[{ label: "CALORIES", key: "calories", ph: "500" }, { label: "PROTEIN (g)", key: "protein", ph: "40" }, { label: "CARBS (g)", key: "carbs", ph: "60" }, { label: "FAT (g)", key: "fat", ph: "15" }].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, marginBottom: 6 }}>{f.label}</div>
                      <input type="number" value={mForm[f.key]} onChange={e => setMForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 10, padding: "10px 12px", color: "#fff", fontSize: 16, fontFamily: "'Bebas Neue'", letterSpacing: 1, textAlign: "center" }} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, marginBottom: 8 }}>DATE</div>
                  <input type="date" value={mForm.date} onChange={e => setMForm(f => ({ ...f, date: e.target.value }))} style={{ width: "100%", background: "#0A0A0A", border: "1px solid #222", borderRadius: 12, padding: "12px 16px", color: "#fff", fontSize: 14 }} />
                </div>

                <button onClick={addMeal} style={{ width: "100%", padding: "16px", borderRadius: 16, background: "linear-gradient(135deg, #FF6D00, #FF9100)", color: "#fff", fontSize: 16, fontFamily: "'Bebas Neue'", letterSpacing: 3, boxShadow: "0 8px 24px #FF910044" }}>
                  LOG MEAL 🍎
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY ── */}
        {view === "history" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* Workouts */}
            <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid #1E1E1E", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 16 }}>WORKOUT HISTORY</div>
              {workouts.length === 0 ? (
                <div style={{ textAlign: "center", color: "#333", fontSize: 13, padding: 20 }}>No workouts logged yet</div>
              ) : workouts.slice(0, 10).map((w, i) => {
                const cat = CATEGORIES.find(c => c.name === w.category) || CATEGORIES[7];
                return (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < Math.min(workouts.length, 10) - 1 ? "1px solid #1A1A1A" : "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cat.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{cat.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{w.exercise}</div>
                      <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{w.category} · {formatDate(w.date)} {w.sets > 0 && `· ${w.sets}×${w.reps}`}</div>
                    </div>
                    <button onClick={() => deleteWorkout(w.id)} style={{ background: "#1A1A1A", border: "none", borderRadius: 8, color: "#333", width: 26, height: 26, fontSize: 11 }}>✕</button>
                  </div>
                );
              })}
            </div>

            {/* Meals */}
            <div style={{ background: "#111", borderRadius: 24, padding: 20, border: "1px solid #1E1E1E" }}>
              <div style={{ fontFamily: "'Bebas Neue'", fontSize: 14, letterSpacing: 3, color: "#444", marginBottom: 16 }}>MEAL HISTORY</div>
              {meals.length === 0 ? (
                <div style={{ textAlign: "center", color: "#333", fontSize: 13, padding: 20 }}>No meals logged yet</div>
              ) : meals.slice(0, 10).map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < Math.min(meals.length, 10) - 1 ? "1px solid #1A1A1A" : "none" }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: "#FF910018", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {m.type === "Breakfast" ? "🌅" : m.type === "Lunch" ? "☀️" : m.type === "Dinner" ? "🌙" : "🍎"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{m.type} · {formatDate(m.date)} · {m.calories} kcal</div>
                  </div>
                  <button onClick={() => deleteMeal(m.id)} style={{ background: "#1A1A1A", border: "none", borderRadius: 8, color: "#333", width: 26, height: 26, fontSize: 11 }}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI COACH ── */}
        {view === "ai" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <div style={{ background: "linear-gradient(135deg, #1A0A00, #110800)", borderRadius: 24, padding: 20, border: "1px solid #FF3D0033", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>🤖</span>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue'", fontSize: 18, letterSpacing: 3, color: "#FF3D00" }}>AI FITNESS COACH</div>
                  <div style={{ fontSize: 11, color: "#555" }}>Powered by Gemini 2.5 Flash</div>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              {QUICK_Q.map(q => (
                <button key={q} onClick={() => setAiQ(q)} style={{ background: "#111", border: `1px solid ${aiQ === q ? "#FF3D0066" : "#1E1E1E"}`, borderRadius: 12, padding: "12px", color: aiQ === q ? "#FF6D00" : "#555", fontSize: 11, textAlign: "left", transition: "all 0.2s", lineHeight: 1.4 }}>
                  {q}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
              <input value={aiQ} onChange={e => setAiQ(e.target.value)} onKeyDown={e => e.key === "Enter" && askAI()} placeholder="Ask your coach anything..." style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: 12, padding: "13px 16px", color: "#fff", fontSize: 13 }} />
              <button onClick={askAI} disabled={aiLoading} style={{ background: aiLoading ? "#1A1A1A" : "linear-gradient(135deg, #FF3D00, #FF9100)", border: "none", borderRadius: 12, padding: "13px 18px", color: "#fff", fontSize: 18, boxShadow: aiLoading ? "none" : "0 4px 16px #FF3D0044", transition: "all 0.2s" }}>
                {aiLoading ? "⏳" : "→"}
              </button>
            </div>

            {aiLoading && (
              <div style={{ background: "#111", borderRadius: 16, padding: 20, border: "1px solid #FF3D0022", textAlign: "center" }}>
                <div style={{ color: "#FF3D00", fontSize: 13, fontFamily: "'Bebas Neue'", letterSpacing: 2, animation: "pulse 1.5s infinite" }}>COACH IS THINKING...</div>
              </div>
            )}

            {aiMsg && !aiLoading && (
              <div style={{ background: "#111", borderRadius: 16, padding: 20, border: "1px solid #FF3D0033", marginBottom: 16, animation: "fadeUp 0.4s ease" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 12, color: "#FF3D00", letterSpacing: 2, marginBottom: 12 }}>🔥 COACH SAYS</div>
                <div style={{ fontSize: 13, color: "#ccc", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{aiMsg}</div>
              </div>
            )}

            {aiHistory.length > 0 && (
              <div style={{ background: "#111", borderRadius: 16, padding: 20, border: "1px solid #1E1E1E" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: 12, color: "#333", letterSpacing: 2, marginBottom: 14 }}>PAST SESSIONS</div>
                {aiHistory.slice(0, 4).map((h, i) => (
                  <div key={i} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: i < 3 ? "1px solid #1A1A1A" : "none" }}>
                    <div style={{ fontSize: 11, color: "#FF6D00", marginBottom: 4 }}>Q: {h.question}</div>
                    <div style={{ fontSize: 11, color: "#444", lineHeight: 1.5 }}>{h.answer.slice(0, 100)}...</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#0A0A0A", borderTop: "1px solid #1A1A1A", padding: "12px 20px 24px", display: "flex", justifyContent: "space-around", backdropFilter: "blur(20px)" }}>
        {[
          { id: "dashboard", icon: "📊", label: "TODAY" },
          { id: "add", icon: "➕", label: "LOG" },
          { id: "history", icon: "📋", label: "HISTORY" },
          { id: "ai", icon: "🤖", label: "COACH" }
        ].map(tab => (
          <button key={tab.id} onClick={() => setView(tab.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", padding: "6px 16px", borderRadius: 12, background: view === tab.id ? "#FF3D0015" : "transparent", transition: "all 0.2s" }}>
            <span style={{ fontSize: tab.id === "add" ? 22 : 18 }}>{tab.icon}</span>
            <span style={{ fontSize: 9, fontFamily: "'Bebas Neue'", letterSpacing: 1.5, color: view === tab.id ? "#FF3D00" : "#333" }}>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}