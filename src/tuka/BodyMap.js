import { C } from "./theme";

// 3D-shaded segmental body figure. Each segment is tinted by its status
// (green Normal / amber Over / blue Under) with a cylindrical light→dark
// gradient so it reads as a rounded 3D mannequin. Grayscale head/neck.
const GRAD = {
  Normal: ["#7FE7BA", "#3FCF8E", "#1C7A50"],
  Over: ["#F2CD82", "#E0A33E", "#8A5E17"],
  Under: ["#9BCEF2", "#5AA9E6", "#2E5F8A"],
  body: ["#CBCDD2", "#9A9DA5", "#54575E"],
};
const statusColor = s => (s === "Over" ? C.warning : s === "Under" ? "#5AA9E6" : C.positive);

export default function BodyMap({ segments, unit = "kg" }) {
  const { rightArm, leftArm, trunk, rightLeg, leftLeg } = segments;
  const grad = (id, stops) => (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={stops[0]} />
      <stop offset="48%" stopColor={stops[1]} />
      <stop offset="100%" stopColor={stops[2]} />
    </linearGradient>
  );
  const fill = seg => `url(#bm-${seg.status})`;

  const Label = ({ x, y, anchor, seg }) => (
    <g>
      <text x={x} y={y} textAnchor={anchor} fill={C.text} fontSize="13" fontWeight="700">
        {seg.kg}<tspan fontSize="8" fontStyle="italic" fill={C.muted}> {unit}</tspan>
      </text>
      <text x={x} y={y + 12} textAnchor={anchor} fill={statusColor(seg.status)} fontSize="8" fontWeight="700" letterSpacing="0.5">
        {seg.status.toUpperCase()}
      </text>
    </g>
  );

  const leader = (x1, x2, y) => (
    <line x1={x1} y1={y} x2={x2} y2={y} stroke={C.border} strokeWidth="1" strokeDasharray="2 3" />
  );

  return (
    <svg viewBox="0 0 260 350" width="100%" style={{ display: "block" }}>
      <defs>
        {grad("bm-Normal", GRAD.Normal)}
        {grad("bm-Over", GRAD.Over)}
        {grad("bm-Under", GRAD.Under)}
        {grad("bm-body", GRAD.body)}
      </defs>

      {/* head + neck */}
      <circle cx="130" cy="38" r="21" fill="url(#bm-body)" />
      <rect x="121" y="56" width="18" height="16" rx="6" fill="url(#bm-body)" />

      {/* trunk (shoulders + torso + hip) */}
      <rect x="92" y="70" width="76" height="28" rx="14" fill={fill(trunk)} />
      <rect x="101" y="90" width="58" height="98" rx="18" fill={fill(trunk)} />
      <rect x="101" y="180" width="58" height="22" rx="11" fill={fill(trunk)} />

      {/* arms — subject Right is viewer-left */}
      <rect x="72" y="78" width="19" height="114" rx="9.5" fill={fill(rightArm)} />
      <rect x="169" y="78" width="19" height="114" rx="9.5" fill={fill(leftArm)} />

      {/* legs */}
      <rect x="104" y="196" width="23" height="126" rx="11.5" fill={fill(rightLeg)} />
      <rect x="133" y="196" width="23" height="126" rx="11.5" fill={fill(leftLeg)} />

      {/* leader lines + labels (arms) */}
      {leader(66, 72, 126)}
      <Label x="63" y="130" anchor="end" seg={rightArm} />
      {leader(188, 194, 126)}
      <Label x="197" y="130" anchor="start" seg={leftArm} />

      {/* leader lines + labels (legs) */}
      {leader(66, 104, 276)}
      <Label x="63" y="280" anchor="end" seg={rightLeg} />
      {leader(156, 194, 276)}
      <Label x="197" y="280" anchor="start" seg={leftLeg} />

      {/* trunk label — dark text over the tinted torso */}
      <text x="130" y="137" textAnchor="middle" fill="#0C0C0C" fontSize="15" fontWeight="800">{trunk.kg}</text>
      <text x="130" y="149" textAnchor="middle" fill="#0C0C0C" fontSize="8" fontWeight="700" opacity="0.65" letterSpacing="0.5">{trunk.status.toUpperCase()}</text>
    </svg>
  );
}
