// Depth-derived design tokens (see Tuka/design.md). Dark-first, mono, restrained.
export const C = {
  bg: "#0C0C0C",
  surface: "#141414",
  surface2: "#1C1C1E",
  border: "rgba(255,255,255,0.10)",
  text: "#F5F5F5",
  muted: "#A1A1A1",
  faint: "#6B6B6B",
  positive: "#3FCF8E", // moving toward target / optimal
  warning: "#E0A33E",  // drifting away
  accent: "#F5F5F5",
};

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad2 = n => (n < 10 ? `0${n}` : `${n}`);
export const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
