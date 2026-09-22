import { describe, expect, it } from "vitest";
import { createBattle, deploy, tickBattle } from "../src/lib/game";

describe("CIV battle engine", () => {
  it("does not deploy a card without enough energy", () => {
    const state = { ...createBattle(), playerEnergy: 0 };
    expect(deploy(state, "player", "mage", 0).units).toHaveLength(0);
  });

  it("spends energy and creates a unit", () => {
    const state = createBattle();
    const next = deploy(state, "player", "legion", 1);
    expect(next.units).toHaveLength(1);
    expect(next.playerEnergy).toBe(2);
  });

  it("regenerates energy without exceeding ten", () => {
    const state = { ...createBattle(), playerEnergy: 9.9 };
    const next = tickBattle(state, 1);
    expect(next.playerEnergy).toBeLessThanOrEqual(10);
    expect(next.playerEnergy).toBeGreaterThan(9.9);
  });

  it("ends a timed-out battle deterministically", () => {
    const state = { ...createBattle(), timeLeft: 0.01, enemyCitadel: 1000 };
    const next = tickBattle(state, 0.1);
    expect(next.winner).toBe("player");
  });
});
