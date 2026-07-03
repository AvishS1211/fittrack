import { C } from "./theme";

// Overlays segmental values on a 3D body image (1080×1920 framing shared by
// lean.png / fat.png). Labels sit in the dark margins with dotted leaders;
// the trunk value sits on the torso with a subtle pill for legibility.
const statusColor = s => (s === "Over" ? C.warning : s === "Under" ? "#5AA9E6" : C.positive);

const POS = {
  rightArm: { lx: 175, ly: 855, anchor: "end", lead: [195, 350] },
  leftArm: { lx: 905, ly: 855, anchor: "start", lead: [885, 730] },
  rightLeg: { lx: 175, ly: 1300, anchor: "end", lead: [195, 460] },
  leftLeg: { lx: 905, ly: 1300, anchor: "start", lead: [885, 625] },
};

export default function BodyMap({ src, segments, unit = "kg" }) {
  const Lbl = ({ k }) => {
    const p = POS[k];
    const seg = segments[k];
    return (
      <g>
        <line x1={p.lead[0]} y1={p.ly - 12} x2={p.lead[1]} y2={p.ly - 12} stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeDasharray="3 6" />
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
    <div style={{ background: "#080808", borderRadius: 16, overflow: "hidden" }}>
    <svg viewBox="-80 135 1240 1760" width="100%" style={{ display: "block" }}>
      <image href={src} x="20" y="0" width="1040" height="1920" preserveAspectRatio="xMidYMid slice" />
      {["rightArm", "leftArm", "rightLeg", "leftLeg"].map(k => <Lbl key={k} k={k} />)}

      {/* trunk value on the torso */}
      <rect x="418" y="560" width="244" height="88" rx="18" fill="rgba(12,12,12,0.55)" />
      <text x="540" y="608" textAnchor="middle" fill={C.text} fontSize="46" fontWeight="800">
        {segments.trunk.kg}<tspan fontSize="22" fontStyle="italic" fill={C.muted}> {unit}</tspan>
      </text>
      <text x="540" y="635" textAnchor="middle" fill={statusColor(segments.trunk.status)} fontSize="20" fontWeight="700" letterSpacing="1">
        {segments.trunk.status.toUpperCase()}
      </text>
    </svg>
    </div>
  );
}
