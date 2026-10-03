import { BOARD_SEGMENTS, getDartboardHitFromPoint } from "./dartboardScoring";
import type {
  DartThrowInput,
  FinishRule,
  GameState,
  Visit,
} from "../types/game";

export function buttonThrow(segment: number, multiplier = 1): DartThrowInput {
  let x = 0,
    y = 0;
  if (segment === 0) {
    x = 112;
  } else if (segment === 25) {
    x = 7;
  } else if (segment !== 50) {
    const angle =
      (BOARD_SEGMENTS.indexOf(segment as (typeof BOARD_SEGMENTS)[number]) *
        Math.PI) /
      10;
    const radius = multiplier === 3 ? 60.5 : multiplier === 2 ? 97.5 : 78;
    x = Math.sin(angle) * radius;
    y = -Math.cos(angle) * radius;
  }
  return {
    x,
    y,
    normalizedX: x / 100,
    normalizedY: y / 100,
    hit: getDartboardHitFromPoint(x / 100, y / 100),
  };
}

const scoringHits = [
  ...Array.from({ length: 20 }, (_, i) => buttonThrow(20 - i, 3).hit),
  ...Array.from({ length: 20 }, (_, i) => buttonThrow(20 - i).hit),
  ...Array.from({ length: 20 }, (_, i) => buttonThrow(20 - i, 2).hit),
  buttonThrow(50).hit,
  buttonThrow(25).hit,
];
const doubles = [
  16, 20, 18, 12, 10, 8, 6, 4, 2, 1, 14, 15, 17, 19, 11, 9, 7, 5, 3, 13,
]
  .map((n) => buttonThrow(n, 2).hit)
  .concat(buttonThrow(50).hit);

export function checkoutRoute(
  score: number,
  dartsLeft: number,
  rule: FinishRule,
) {
  if (
    score < 1 ||
    dartsLeft < 1 ||
    score > dartsLeft * 60 ||
    (rule === "double-out" && score === 1)
  )
    return null;
  const finishes = rule === "double-out" ? doubles : scoringHits;
  // Prefer the shortest finish; for longer routes favour high trebles and familiar doubles.
  for (let length = 1; length <= Math.min(3, dartsLeft); length++) {
    const search = (
      remaining: number,
      count: number,
    ): typeof scoringHits | null => {
      if (count === 1) {
        const finish = finishes.find((hit) => hit.score === remaining);
        return finish ? [finish] : null;
      }
      for (const hit of scoringHits) {
        const next = remaining - hit.score;
        if (next <= (rule === "double-out" ? 1 : 0)) continue;
        const tail = search(next, count - 1);
        if (tail) return [hit, ...tail];
      }
      return null;
    };
    const route = search(score, length);
    if (route) return route;
  }
  return null;
}

export function currentVisit(state: GameState): Visit | null {
  const turn = state.turn;
  if (!turn.darts.length && turn.visitScore === undefined) return null;
  const player = state.players.find((p) => p.id === turn.playerId)!;
  return {
    playerId: turn.playerId,
    turnIndex: turn.turnIndex,
    leg: state.match?.leg ?? 1,
    startingScore: turn.startingScore,
    endingScore: player.score,
    total: turn.isBust ? 0 : turn.turnTotal,
    dartsUsed: turn.dartsUsed ?? turn.darts.length,
    labels: turn.darts.map((d) => d.hit.label),
    isBust: turn.isBust,
    checkout: state.status === "game_over" && state.winnerId === turn.playerId,
    entry: turn.visitScore === undefined ? "darts" : "total",
  };
}

export function allVisits(state: GameState): Visit[] {
  const visit = currentVisit(state);
  return visit ? [...(state.visits ?? []), visit] : (state.visits ?? []);
}

export function playerStats(state: GameState, playerId: string) {
  const visits = allVisits(state).filter((v) => v.playerId === playerId);
  const darts = visits.reduce((n, v) => n + v.dartsUsed, 0);
  const points = visits.reduce((n, v) => n + v.total, 0);
  return {
    darts,
    average: darts ? (points * 3) / darts : 0,
    highest: Math.max(0, ...visits.map((v) => v.total)),
    visits: visits.length,
    checkout: Math.max(
      0,
      ...visits.filter((v) => v.checkout).map((v) => v.total),
    ),
    detailed: visits.every((v) => v.entry === "darts"),
  };
}

export function isMatchComplete(state: GameState) {
  return (
    state.status === "game_over" &&
    (!state.match ||
      Object.values(state.match.legsWon).some(
        (n) => n >= Math.floor(state.match!.bestOf / 2) + 1,
      ))
  );
}
