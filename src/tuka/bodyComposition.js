// InBody segmental data — editable. When new results come in, update the
// numbers/status here and both body diagrams re-render.
// status: "Normal" | "Over" | "Under"
export const BODY = {
  date: "2026-06-20",
  stats: { smm: 40.7, pbf: 42.6, bmr: 1920 }, // Skeletal Muscle Mass, % Body Fat, Basal Metabolic Rate
  lean: {
    rightArm: { kg: 4.47, status: "Normal" },
    leftArm: { kg: 4.37, status: "Normal" },
    trunk: { kg: 33.4, status: "Normal" },
    rightLeg: { kg: 11.27, status: "Normal" },
    leftLeg: { kg: 11.09, status: "Normal" },
  },
  fat: {
    rightArm: { kg: 5.6, status: "Over" },
    leftArm: { kg: 5.7, status: "Over" },
    trunk: { kg: 26.7, status: "Over" },
    rightLeg: { kg: 6.8, status: "Over" },
    leftLeg: { kg: 6.7, status: "Over" },
  },
};
