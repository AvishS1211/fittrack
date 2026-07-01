// Diet targets from the user's plan PDF.
// The plan specifies calories (~2,200) and protein (~170 g). Fat and carbs are
// derived to fill the remaining calories (protein 4 kcal/g, carb 4, fat 9):
//   protein 170 g = 680 kcal · fat 60 g = 540 kcal · carbs 245 g = 980 kcal ≈ 2,200.
export const DIET = {
  calories: 2200,
  note: "Moderate deficit — steady fat loss while keeping muscle.",
  macros: [
    { key: "Protein", grams: 170, kcalPerG: 4 },
    { key: "Carbs", grams: 245, kcalPerG: 4 },
    { key: "Fat", grams: 60, kcalPerG: 9 },
  ],
  // shown small under the macros, since only cals + protein were prescribed
  derivedNote: "Calories & protein are from your plan; carbs & fat are a suggested split to hit the target — run past your dietician.",
  perMeal: "Aim for ~30–50 g protein at every meal.",
};
