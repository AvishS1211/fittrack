// PPL ×2 (6 days/week), transcribed from the user's workout plan PDF.
// Mon/Thu = Push, Tue/Fri = Pull, Wed/Sat = Legs, Sun = Rest.

// Indexed by JS getDay() (0 = Sunday … 6 = Saturday)
export const SPLIT_BY_DAY = ["Rest", "Push", "Pull", "Legs", "Push", "Pull", "Legs"];

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Display order Mon → Sun for the selector
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const WORKOUTS = {
  Push: {
    subtitle: "chest · shoulders · triceps",
    exercises: [
      { name: "Incline DB / machine press", sets: "4 × 8–10", note: "Main chest builder" },
      { name: "Flat chest press", sets: "3 × 10" },
      { name: "Seated shoulder press", sets: "3 × 8–10" },
      { name: "Lateral raise", sets: "3 × 12–15", note: "Light, controlled" },
      { name: "Triceps pushdown (cable)", sets: "3 × 12–15" },
      { name: "Overhead triceps extension", sets: "2 × 12" },
      { name: "Farmer's carry", sets: "3 × 40 m", note: "Heavy DBs, brace core", tag: "Functional" },
      { name: "Plank", sets: "3 × 45 sec", tag: "Core" },
      { name: "Pallof press (cable)", sets: "3 × 12 / side", note: "Anti-rotation", tag: "Core" },
    ],
  },
  Pull: {
    subtitle: "back · biceps · rear delts",
    exercises: [
      { name: "Lat pulldown", sets: "4 × 8–10", note: "Full stretch at top" },
      { name: "Seated cable row", sets: "3 × 10", note: "Squeeze shoulder blades" },
      { name: "Chest-supported DB row", sets: "3 × 10", note: "Saves your lower back" },
      { name: "Face pull (cable)", sets: "3 × 15", note: "Rear delts / posture" },
      { name: "DB bicep curl", sets: "3 × 10–12" },
      { name: "Hammer curl", sets: "2 × 12" },
      { name: "Suitcase carry", sets: "3 × 40 m / side", note: "One DB, fight the lean", tag: "Functional" },
      { name: "Dead bug", sets: "3 × 10 / side", note: "Slow, controlled", tag: "Core" },
      { name: "Cable woodchop", sets: "3 × 12 / side", tag: "Core" },
    ],
  },
  Legs: {
    subtitle: "quads · hams · glutes · calves",
    exercises: [
      { name: "Leg press", sets: "4 × 10", note: "Joint-friendly, go heavy" },
      { name: "Goblet squat", sets: "3 × 10", note: "Or DB squat" },
      { name: "Romanian deadlift (DB/bar)", sets: "3 × 10", note: "Hinge, don't round" },
      { name: "Leg curl", sets: "3 × 12" },
      { name: "Leg extension", sets: "3 × 12" },
      { name: "Standing calf raise", sets: "4 × 15" },
      { name: "Low box step-up", sets: "3 × 10 / leg", note: "No jumping — control the step", tag: "Functional" },
      { name: "Lying knee raise", sets: "3 × 15", tag: "Core" },
      { name: "Side plank", sets: "3 × 30 sec / side", tag: "Core" },
    ],
  },
};
