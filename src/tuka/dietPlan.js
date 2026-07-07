// Diet targets are computed per user:
//   calories = measured BMR (from InBody) if available, else weight(kg) × 24
//   macros   = split of those calories (protein 4 kcal/g, carb 4, fat 9)
export const DIET = {
  weightFactor: 24, // calories ≈ weight(kg) × 24 when no measured BMR
  macroSplit: { Protein: 0.30, Carbs: 0.45, Fat: 0.25 }, // share of calories
  kcalPerG: { Protein: 4, Carbs: 4, Fat: 9 },
  perMeal: "Aim for ~30–50 g protein at every meal.",
};
