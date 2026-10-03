import { describe, expect, it } from "vitest";
import {
  buttonThrow,
  checkoutRoute,
  isMatchComplete,
  playerStats,
  allVisits,
} from "./matchTools";
import {
  applyDartThrow,
  applyVisitTotal,
  createGame,
  endTurn,
  nextLeg,
  replaceTurnDart,
  undoLastDart,
} from "./gameEngine";
import type { GameState } from "../types/game";

const game = (score = 40, bestOf = 3): GameState =>
  createGame({
    playerNames: ["Alice", "Bob"],
    mode: { type: "x01", startingScore: score, finishRule: "double-out" },
    bestOf,
  });
describe("match scoring and evidence", () => {
  it("maps every button to the matching real dartboard ring", () => {
    for (let n = 1; n <= 20; n++)
      for (const m of [1, 2, 3]) {
        const hit = buttonThrow(n, m).hit;
        expect(hit.segment).toBe(n);
        expect(hit.score).toBe(n * m);
        expect(hit.multiplier).toBe(m);
      }
    expect(buttonThrow(50).hit.isFinishDouble).toBe(true);
    expect(buttonThrow(25).hit.score).toBe(25);
    expect(buttonThrow(0).hit.score).toBe(0);
  });
  it("returns only legal checkout routes for both rules and each darts-left count", () => {
    for (const rule of ["straight", "double-out"] as const)
      for (const left of [1, 2, 3])
        for (let score = 1; score <= 180; score++) {
          const route = checkoutRoute(score, left, rule);
          if (!route) continue;
          expect(route.length).toBeLessThanOrEqual(left);
          expect(route.reduce((sum, h) => sum + h.score, 0)).toBe(score);
          if (rule === "double-out")
            expect(route.at(-1)?.isFinishDouble).toBe(true);
          let s = createGame({
            playerNames: ["A"],
            mode: { type: "x01", startingScore: score, finishRule: rule },
          });
          for (const hit of route)
            s = applyDartThrow(s, { ...buttonThrow(0), hit });
          expect(s.status).toBe("game_over");
        }
  });
  it("handles bogey numbers, bull finishes and changing dart counts", () => {
    for (const n of [159, 162, 163, 165, 166, 168, 169])
      expect(checkoutRoute(n, 3, "double-out")).toBeNull();
    expect(checkoutRoute(170, 3, "double-out")?.map((h) => h.score)).toEqual([
      60, 60, 50,
    ]);
    expect(checkoutRoute(100, 1, "double-out")).toBeNull();
    expect(checkoutRoute(100, 2, "double-out")?.map((h) => h.score)).toEqual([
      60, 40,
    ]);
    expect(checkoutRoute(1, 3, "double-out")).toBeNull();
  });
  it("alternates the starting player, preserves visits and ends best-of-three at two wins", () => {
    let s = applyDartThrow(game(), buttonThrow(20, 2));
    expect(s.match?.legsWon["player-1"]).toBe(1);
    expect(isMatchComplete(s)).toBe(false);
    const wonLeg = s;
    s = nextLeg(s);
    expect(s.currentPlayerIndex).toBe(1);
    expect(s.match?.leg).toBe(2);
    expect(s.players[0].score).toBe(40);
    expect(s.visits).toHaveLength(1);
    expect(undoLastDart(s)).toMatchObject({
      status: "game_over",
      match: wonLeg.match,
    });
    s = applyDartThrow(s, buttonThrow(0));
    s = endTurn(s);
    s = applyDartThrow(s, buttonThrow(20, 2));
    expect(isMatchComplete(s)).toBe(true);
    expect(s.match?.legsWon["player-1"]).toBe(2);
    expect(nextLeg(s)).toBe(s);
    expect(playerStats(s, "player-1").checkout).toBe(40);
  });
  it("undoes a win and removes the leg award", () => {
    const won = applyDartThrow(game(), buttonThrow(20, 2));
    const undone = undoLastDart(won);
    expect(undone.status).toBe("in_progress");
    expect(undone.match?.legsWon["player-1"]).toBe(0);
    expect(undone.turn.darts).toHaveLength(0);
  });
  it("corrects a winning dart without awarding the leg twice", () => {
    const won = applyDartThrow(game(), buttonThrow(20, 2));
    const corrected = replaceTurnDart(
      won,
      won.turn.darts[0].id,
      buttonThrow(20),
    );
    expect(corrected.status).toBe("in_progress");
    expect(corrected.match?.legsWon["player-1"]).toBe(0);
    expect(undoLastDart(corrected).match?.legsWon["player-1"]).toBe(1);
  });
  it("records visit totals without inventing individual darts", () => {
    let s = applyVisitTotal(game(301), 180, 3);
    expect(s.players[0].score).toBe(121);
    expect(s.turn.darts).toEqual([]);
    expect(playerStats(s, "player-1")).toMatchObject({
      average: 180,
      highest: 180,
      darts: 3,
      detailed: false,
    });
    s = endTurn(s);
    expect(s.visits).toHaveLength(1);
    s = undoLastDart(s);
    expect(s.players[0].score).toBe(301);
    expect(s.visits).toHaveLength(0);
    expect(s.currentPlayerIndex).toBe(0);
  });
  it("validates impossible totals and the declared finishing double", () => {
    for (const n of [179, 178, 176, 175, 173, 172, 169, 166, 163])
      expect(() => applyVisitTotal(game(501), n, 3)).toThrow("not possible");
    expect(() => applyVisitTotal(game(100), 100, 2)).toThrow(
      "finishing double",
    );
    expect(() => applyVisitTotal(game(100), 100, 2, 16)).toThrow(
      "does not fit",
    );
    const s = applyVisitTotal(game(100), 100, 2, 20);
    expect(s.status).toBe("game_over");
    expect(s.turn.finishHit?.label).toBe("D20");
    expect(playerStats(s, "player-1").average).toBe(150);
  });
  it("includes the full bust visit as zero points and its actual darts in the average", () => {
    let s = applyDartThrow(game(40), buttonThrow(20));
    s = applyDartThrow(s, buttonThrow(20, 2));
    expect(s.turn.isBust).toBe(true);
    expect(playerStats(s, "player-1")).toMatchObject({
      darts: 2,
      average: 0,
      highest: 0,
    });
    s = endTurn(s);
    expect(allVisits(s)).toHaveLength(1);
    expect(s.visits?.[0].total).toBe(0);
  });
  it("handles total-entry busts and straight-out finishes", () => {
    const bust = applyVisitTotal(game(20), 19, 1);
    expect(bust.turn.isBust).toBe(true);
    expect(bust.players[0].score).toBe(20);
    const straight = createGame({
      playerNames: ["A"],
      mode: { type: "x01", startingScore: 19, finishRule: "straight" },
    });
    expect(applyVisitTotal(straight, 19, 1).status).toBe("game_over");
    expect(applyVisitTotal(game(20), 20, 1, 0).turn.isBust).toBe(true);
    expect(() => applyVisitTotal(game(40), 40, 1, 0)).toThrow(
      "cannot end on a non-double",
    );
  });
  it("does not duplicate a current visit when moving to the next player", () => {
    let s = applyDartThrow(game(501), buttonThrow(20, 3));
    expect(allVisits(s)).toHaveLength(1);
    s = endTurn(s);
    expect(allVisits(s)).toHaveLength(1);
    s = applyDartThrow(s, buttonThrow(0));
    expect(allVisits(s)).toHaveLength(2);
    s = undoLastDart(s);
    expect(allVisits(s)).toHaveLength(1);
  });
});
