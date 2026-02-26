import { useCallback, useRef, useState } from "react";
import { clamp } from "./math";
import {
  LEVEL_BASE_GOAL,
  LEVEL_BASE_MAX_ACTIVE,
  LEVEL_GOAL_PER_LEVEL,
  LEVEL_MAX_ACTIVE_PER_LEVEL,
  SPAWN_MAX_BODIES,
} from "./constants";

export function useLeveling() {
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);

  const [levelProgress, setLevelProgress] = useState(0);
  const levelProgressRef = useRef(0);

  const [levelGoal, setLevelGoal] = useState(LEVEL_BASE_GOAL);
  const levelGoalRef = useRef(LEVEL_BASE_GOAL);

  const computeLevelGoal = useCallback((lvl: number) => {
    return Math.max(1, LEVEL_BASE_GOAL + (lvl - 1) * LEVEL_GOAL_PER_LEVEL);
  }, []);

  const computeLevelMaxActiveBodies = useCallback((lvl: number) => {
    const raw = LEVEL_BASE_MAX_ACTIVE + (lvl - 1) * LEVEL_MAX_ACTIVE_PER_LEVEL;
    return clamp(raw, 1, SPAWN_MAX_BODIES);
  }, []);

  const resetLeveling = useCallback(() => {
    const lvl = 1;
    const goal = computeLevelGoal(lvl);

    levelRef.current = lvl;
    setLevel(lvl);

    levelProgressRef.current = 0;
    setLevelProgress(0);

    levelGoalRef.current = goal;
    setLevelGoal(goal);
  }, [computeLevelGoal]);

  const registerDestroyedBodies = useCallback(
    (count: number) => {
      if (count <= 0) return;

      let prog = levelProgressRef.current + count;
      let lvl = levelRef.current;
      let goal = levelGoalRef.current;

      while (prog >= goal) {
        prog -= goal;
        lvl += 1;
        goal = computeLevelGoal(lvl);
      }

      if (lvl !== levelRef.current) {
        levelRef.current = lvl;
        setLevel(lvl);
      }

      if (goal !== levelGoalRef.current) {
        levelGoalRef.current = goal;
        setLevelGoal(goal);
      }

      if (prog !== levelProgressRef.current) {
        levelProgressRef.current = prog;
        setLevelProgress(prog);
      }
    },
    [computeLevelGoal],
  );

  return {
    level,
    levelRef,
    levelProgress,
    levelProgressRef,
    levelGoal,
    levelGoalRef,
    computeLevelGoal,
    computeLevelMaxActiveBodies,
    resetLeveling,
    registerDestroyedBodies,
  };
}
