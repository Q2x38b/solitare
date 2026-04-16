export type Suit = "S" | "H" | "D" | "C";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
export type Color = "red" | "black";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export type PileId =
  | "stock"
  | "waste"
  | `f${0 | 1 | 2 | 3}`
  | `t${0 | 1 | 2 | 3 | 4 | 5 | 6}`;

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: [Card[], Card[], Card[], Card[]];
  tableau: [Card[], Card[], Card[], Card[], Card[], Card[], Card[]];
  drawCount: 1 | 3;
  moves: number;
  score: number;
  passes: number;
  startedAt: number | null;
  elapsedBefore: number;
  won: boolean;
  seed: number;
}

export interface Move {
  from: PileId;
  to: PileId;
  count: number;
  flipped?: boolean;
  recycled?: boolean;
  prevWaste?: Card[];
  prevStock?: Card[];
  scoreDelta: number;
}

export interface Settings {
  drawCount: 1 | 3;
  theme: "felt" | "paper";
  sound: boolean;
  autoMove: boolean;
  animations: boolean;
}

export interface Stats {
  gamesPlayed: number;
  gamesWon: number;
  bestTimeSec: number | null;
  bestMoves: number | null;
  bestScore: number | null;
  currentStreak: number;
  longestStreak: number;
}
