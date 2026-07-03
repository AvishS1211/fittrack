import { C } from "./theme";

// Full-bleed 3D body figure (1040×1920 lean.png / fat.png) with segmental
// values overlaid on the figure's dark side areas. Meant to sit as the
// background of the segmental-analysis section, controls layered on top.
const statusColor = s => (s === "Over" ? C.warning : s === "Under" ? "#5AA9E6" : C.positive);

const POS = {
  rightArm: { lx: 250, ly: 855, anchor: "end", lead: [262, 335] },
  leftArm: { lx: 790, ly: 855, anchor: "start", lead: [778, 705] },
  rightLeg: { lx: 250, ly: 1300, anchor: "end", lead: [262, 445] },
  leftLeg: { lx: 790, ly: 1300, anchor: "start", lead: [778, 615] },
};

export default function BodyMap({ src, segments, unit = "kg" }) {
  const Lbl = ({ k }) => {
    const p = POS[k];
    const seg = segments[k];
    return (
      <g>
        <line x1={p.lead[0]} y1={p.ly - 12} x2={p.lead[1]} y2={p.ly - 12} stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="3 6" />
        <text x={p.lx} y={p.ly} textAnchor={p.anchor} fill={C.text} fontSize="42" fontWeight="700">
          {seg.kg}<tspan fontSize="24" fontStyle="italic" fill={C.muted}> {unit}</tspan>
        </text>
        <text x={p.lx} y={p.ly + 32} textAnchor={p.anchor} fill={statusColor(seg.status)} fontSize="22" fontWeight="700" letterSpacing="1">
          {seg.status.toUpperCase()}
        </text>
      </g>
    );
  };
  return (
    <svg viewBox="0 120 1040 1740" width="100%" style={{ display: "block" }}>
      <image href={src} x="0" y="0" width="1040" height="1920" preserveAspectRatio="xMidYMid slice" />
      {["rightArm", "leftArm", "rightLeg", "leftLeg"].map(k => <Lbl key={k} k={k} />)}

      {/* trunk value on the torso */}
      <rect x="400" y="558" width="240" height="88" rx="18" fill="rgba(8,8,8,0.5)" />
      <text x="520" y="606" textAnchor="middle" fill={C.text} fontSize="46" fontWeight="800">
        {segments.trunk.kg}<tspan fontSize="22" fontStyle="italic" fill={C.muted}> {unit}</tspan>
      </text>
      <text x="520" y="633" textAnchor="middle" fill={statusColor(segments.trunk.status)} fontSize="20" fontWeight="700" letterSpacing="1">
        {segments.trunk.status.toUpperCase()}
      </text>
    </svg>
  );
}
