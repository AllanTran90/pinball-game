/**
 * Goals that award extra balls. Each goal has steps: reaching a step's value
 * awards one extra ball, then the next step becomes the target.
 * To add a goal, add a row here and report its value from the engine.
 */
export const GOAL_DEFS = [
  { id: "score", label: "Replay", hint: "Nå poänggränsen", steps: [75_000, 200_000, 500_000] },
  { id: "bumpers", label: "Bumper-storm", hint: "Träffa bumpers", steps: [60, 200] },
  { id: "targets", label: "Target-mästare", hint: "Fäll alla 3 targets", steps: [3, 8] },
  { id: "multiplier", label: "Max multi", hint: "Nå multiplikator ×5", steps: [5] },
] as const;

export type GoalId = (typeof GOAL_DEFS)[number]["id"];

export type GoalProgress = {
  id: GoalId;
  label: string;
  hint: string;
  value: number;
  /** Current target, or null when every step is done. */
  target: number | null;
  /** Previous step (or 0), so the UI can show progress towards `target`. */
  from: number;
  earned: number;
  total: number;
};

export type Goals = Record<GoalId, { value: number; earned: number }>;

export const createGoals = (): Goals =>
  Object.fromEntries(GOAL_DEFS.map((g) => [g.id, { value: 0, earned: 0 }])) as Goals;

/** Updates a goal's value and returns how many extra balls it just earned. */
export function setGoal(goals: Goals, id: GoalId, value: number) {
  const goal = goals[id];
  const steps = GOAL_DEFS.find((g) => g.id === id)!.steps;
  goal.value = value;
  let newlyEarned = 0;
  while (goal.earned < steps.length && value >= steps[goal.earned]) {
    goal.earned++;
    newlyEarned++;
  }
  return newlyEarned;
}

export const goalProgress = (goals: Goals): GoalProgress[] =>
  GOAL_DEFS.map(({ id, label, hint, steps }) => {
    const { value, earned } = goals[id];
    return {
      id,
      label,
      hint,
      value,
      target: steps[earned] ?? null,
      from: earned > 0 ? steps[earned - 1] : 0,
      earned,
      total: steps.length,
    };
  });
