export type Lane = 0 | 1;
export type Side = "player" | "enemy";

export type Card = {
  id: string;
  name: string;
  icon: string;
  cost: number;
  hp: number;
  damage: number;
  speed: number;
  range: number;
  cooldown: number;
  blurb: string;
};

export type Unit = {
  id: string;
  cardId: string;
  side: Side;
  lane: Lane;
  x: number;
  hp: number;
  maxHp: number;
  cooldown: number;
};

export type BattleState = {
  timeLeft: number;
  playerEnergy: number;
  enemyEnergy: number;
  playerCitadel: number;
  enemyCitadel: number;
  playerTowers: [number, number];
  enemyTowers: [number, number];
  units: Unit[];
  winner: Side | "draw" | null;
  nextId: number;
};

export const CARDS: Card[] = [
  { id: "legion", name: "Legion", icon: "⚔", cost: 3, hp: 270, damage: 38, speed: 5.2, range: 5, cooldown: 0.8, blurb: "Reliable frontline infantry." },
  { id: "archers", name: "Archers", icon: "➹", cost: 3, hp: 150, damage: 44, speed: 4.2, range: 14, cooldown: 1.0, blurb: "Long-range pressure." },
  { id: "cavalry", name: "Cavalry", icon: "♞", cost: 4, hp: 330, damage: 62, speed: 8.0, range: 5, cooldown: 1.1, blurb: "Fast tower threat." },
  { id: "guard", name: "Guard", icon: "⬟", cost: 2, hp: 410, damage: 22, speed: 3.4, range: 4, cooldown: 1.0, blurb: "Cheap defensive wall." },
  { id: "mage", name: "Mage", icon: "✦", cost: 5, hp: 190, damage: 88, speed: 3.6, range: 13, cooldown: 1.25, blurb: "Heavy ranged damage." },
  { id: "raiders", name: "Raiders", icon: "◆", cost: 2, hp: 125, damage: 34, speed: 8.8, range: 4, cooldown: 0.65, blurb: "Fast cycle unit." },
  { id: "ram", name: "War Ram", icon: "▰", cost: 4, hp: 360, damage: 78, speed: 6.2, range: 4, cooldown: 1.3, blurb: "Built to crack structures." },
  { id: "oracle", name: "Oracle", icon: "◉", cost: 3, hp: 180, damage: 50, speed: 4.0, range: 10, cooldown: 0.85, blurb: "Flexible support fighter." }
];

const cardMap = new Map(CARDS.map((c) => [c.id, c]));
export const getCard = (id: string) => cardMap.get(id) ?? CARDS[0];

export function createBattle(): BattleState {
  return {
    timeLeft: 180,
    playerEnergy: 5,
    enemyEnergy: 5,
    playerCitadel: 1800,
    enemyCitadel: 1800,
    playerTowers: [850, 850],
    enemyTowers: [850, 850],
    units: [],
    winner: null,
    nextId: 1,
  };
}

export function deploy(state: BattleState, side: Side, cardId: string, lane: Lane): BattleState {
  if (state.winner) return state;
  const card = getCard(cardId);
  const energyKey = side === "player" ? "playerEnergy" : "enemyEnergy";
  if (state[energyKey] + 1e-6 < card.cost) return state;
  const unit: Unit = {
    id: `u${state.nextId}`,
    cardId,
    side,
    lane,
    x: side === "player" ? 8 : 92,
    hp: card.hp,
    maxHp: card.hp,
    cooldown: 0,
  };
  return {
    ...state,
    [energyKey]: Math.max(0, state[energyKey] - card.cost),
    units: [...state.units, unit],
    nextId: state.nextId + 1,
  };
}

function nearestEnemy(unit: Unit, units: Unit[]) {
  const direction = unit.side === "player" ? 1 : -1;
  return units
    .filter((u) => u.side !== unit.side && u.lane === unit.lane && (u.x - unit.x) * direction >= -1)
    .sort((a, b) => Math.abs(a.x - unit.x) - Math.abs(b.x - unit.x))[0];
}

export function tickBattle(input: BattleState, dt: number): BattleState {
  if (input.winner) return input;
  const dtSafe = Math.min(Math.max(dt, 0), 0.25);
  let state: BattleState = {
    ...input,
    timeLeft: Math.max(0, input.timeLeft - dtSafe),
    playerEnergy: Math.min(10, input.playerEnergy + dtSafe * 0.72),
    enemyEnergy: Math.min(10, input.enemyEnergy + dtSafe * 0.72),
    units: input.units.map((u) => ({ ...u, cooldown: Math.max(0, u.cooldown - dtSafe) })),
    playerTowers: [...input.playerTowers] as [number, number],
    enemyTowers: [...input.enemyTowers] as [number, number],
  };

  const damage = new Map<string, number>();
  const nextUnits = state.units.map((unit) => {
    const card = getCard(unit.cardId);
    const target = nearestEnemy(unit, state.units);
    const direction = unit.side === "player" ? 1 : -1;
    if (target && Math.abs(target.x - unit.x) <= card.range) {
      if (unit.cooldown <= 0) {
        damage.set(target.id, (damage.get(target.id) ?? 0) + card.damage);
        return { ...unit, cooldown: card.cooldown };
      }
      return unit;
    }

    const enemyTowerHp = unit.side === "player" ? state.enemyTowers[unit.lane] : state.playerTowers[unit.lane];
    const towerX = unit.side === "player" ? 84 : 16;
    const citadelX = unit.side === "player" ? 96 : 4;
    const towerAlive = enemyTowerHp > 0;
    const targetX = towerAlive ? towerX : citadelX;
    if (Math.abs(targetX - unit.x) <= card.range + 1.2) {
      if (unit.cooldown <= 0) {
        if (towerAlive) {
          if (unit.side === "player") state.enemyTowers[unit.lane] = Math.max(0, state.enemyTowers[unit.lane] - card.damage);
          else state.playerTowers[unit.lane] = Math.max(0, state.playerTowers[unit.lane] - card.damage);
        } else {
          if (unit.side === "player") state.enemyCitadel = Math.max(0, state.enemyCitadel - card.damage);
          else state.playerCitadel = Math.max(0, state.playerCitadel - card.damage);
        }
        return { ...unit, cooldown: card.cooldown };
      }
      return unit;
    }
    return { ...unit, x: Math.max(2, Math.min(98, unit.x + direction * card.speed * dtSafe)) };
  });

  state.units = nextUnits
    .map((u) => ({ ...u, hp: u.hp - (damage.get(u.id) ?? 0) }))
    .filter((u) => u.hp > 0);

  if (state.enemyCitadel <= 0) state.winner = "player";
  else if (state.playerCitadel <= 0) state.winner = "enemy";
  else if (state.timeLeft <= 0) {
    const playerScore = state.playerCitadel + state.playerTowers[0] + state.playerTowers[1];
    const enemyScore = state.enemyCitadel + state.enemyTowers[0] + state.enemyTowers[1];
    state.winner = playerScore === enemyScore ? "draw" : playerScore > enemyScore ? "player" : "enemy";
  }
  return state;
}

export function chooseAiMove(state: BattleState): { cardId: string; lane: Lane } | null {
  const affordable = CARDS.filter((c) => c.cost <= state.enemyEnergy);
  if (!affordable.length) return null;
  const weakerLane: Lane = state.playerTowers[0] <= state.playerTowers[1] ? 0 : 1;
  const index = (Math.floor(state.timeLeft) + state.units.length + state.nextId) % affordable.length;
  return { cardId: affordable[index].id, lane: state.units.length % 3 === 0 ? weakerLane : ((state.nextId % 2) as Lane) };
}
