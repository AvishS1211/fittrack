import { useState } from "react";
import { C, MONTHS } from "./theme";

// Apple-Health-style weight line chart with a dashed target reference line.
// `target` is the current goal (green); `prevTargets` are up to 2 prior goals (grey).
export default function WeightChart({ data, target, prevTargets = [] }) {
  const [sel, setSel] = useState(null); // selected reading index (within `data`)

  const W = 360, H = 210;
  const padL = 8, padR = 40, padT = 28, padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  if (data.length === 0) {
    return (
      <div style={{ height: 150, display: "flex", alignItems: "center", justifyContent: "center", color: C.faint, fontSize: 13 }}>
        Log a weigh-in to see your trend.
      </div>
    );
  }

  const vals = data.map(d => Number(d.kg));
  let lo = Math.min(...vals);
  let hi = Math.max(...vals);
  const allTargets = [target, ...prevTargets].filter(t => t != null);
  for (const t of allTargets) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
  const pad = (hi - lo) * 0.18 || 1;
  const yMin = lo - pad;
  const yMax = hi + pad;

  const t0 = +new Date(data[0].date);
  const t1 = +new Date(data[data.length - 1].date);
  const span = t1 - t0 || 1;
  const x = d => data.length === 1 ? padL + innerW / 2 : padL + ((+new Date(d.date) - t0) / span) * innerW;
  const y = v => padT + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const pts = data.map((d, i) => ({ ...d, i, cx: x(d), cy: y(Number(d.kg)) }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].cx.toFixed(1)},${(padT + innerH).toFixed(1)} L${pts[0].cx.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  const active = sel != null && pts[sel] ? pts[sel] : pts[pts.length - 1];

  const fmtDay = ds => { const d = new Date(ds); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible", display: "block", touchAction: "none" }}>
      <defs>
        <linearGradient id="tukaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.text} stopOpacity="0.14" />
          <stop offset="100%" stopColor={C.text} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* horizontal gridlines */}
      {[0, 0.5, 1].map(t => (
        <line key={t} x1={padL} y1={padT + innerH * t} x2={padL + innerW} y2={padT + innerH * t}
          stroke={C.border} strokeWidth="1" />
      ))}
      {/* y labels (right) */}
      <text x={W - padR + 6} y={padT + 4} fill={C.faint} fontSize="9">{Math.round(yMax)}</text>
      <text x={W - padR + 6} y={padT + innerH + 3} fill={C.faint} fontSize="9">{Math.round(yMin)}</text>

      {/* previous targets (grey) */}
      {prevTargets.map((t, i) => (
        <g key={`pt-${i}`}>
          <line x1={padL} y1={y(t)} x2={padL + innerW} y2={y(t)} stroke={C.faint} strokeWidth="1" strokeDasharray="2 5" opacity="0.6" />
          <text x={W - padR + 6} y={y(t) + 3} fill={C.faint} fontSize="9">{t}</text>
        </g>
      ))}

      {/* current target (green) */}
      {target != null && (
        <g>
          <line x1={padL} y1={y(target)} x2={padL + innerW} y2={y(target)} stroke={C.positive} strokeWidth="1.25" strokeDasharray="3 4" opacity="0.9" />
          <text x={W - padR + 6} y={y(target) + 3} fill={C.positive} fontSize="9" fontWeight="600">{target}</text>
        </g>
      )}

      {pts.length > 1 && <path d={area} fill="url(#tukaFill)" />}
      <path d={line} fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* selected guide */}
      <line x1={active.cx} y1={padT} x2={active.cx} y2={padT + innerH} stroke={C.border} strokeWidth="1" />

      {/* points (tap targets) */}
      {pts.map((p) => {
        const isActive = p.i === active.i;
        return (
          <g key={p.id} onClick={() => setSel(p.i)} style={{ cursor: "pointer" }}>
            <circle cx={p.cx} cy={p.cy} r="11" fill="transparent" />
            <circle cx={p.cx} cy={p.cy} r={isActive ? 4.5 : 2.5}
              fill={isActive ? C.text : C.bg} stroke={C.text} strokeWidth={isActive ? 0 : 1.5} />
          </g>
        );
      })}

      {/* floating readout for the active point */}
      <text x={Math.min(Math.max(active.cx, padL + 18), padL + innerW - 18)} y={padT - 14}
        textAnchor="middle" fill={C.text} fontSize="14" fontWeight="700">
        {active.kg}<tspan fontSize="9" fontStyle="italic" fill={C.muted}> kg</tspan>
      </text>
      <text x={Math.min(Math.max(active.cx, padL + 18), padL + innerW - 18)} y={padT - 3}
        textAnchor="middle" fill={C.faint} fontSize="8">{fmtDay(active.date)}</text>
    </svg>
  );
}
