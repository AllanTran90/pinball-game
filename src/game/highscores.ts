export type HighScore = { name: string; score: number; date: string };

const KEY = "pinball-high-scores";
/** Single best score saved by earlier versions of the game. */
const LEGACY_KEY = "pinball-high-score";
export const MAX_ENTRIES = 5;
export const MAX_NAME_LENGTH = 10;

const sortAndTrim = (list: HighScore[]) =>
  [...list].sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES);

export function loadHighScores(): HighScore[] {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return sortAndTrim(JSON.parse(saved));
    const legacy = Number(localStorage.getItem(LEGACY_KEY));
    return legacy > 0 ? [{ name: "???", score: legacy, date: "" }] : [];
  } catch {
    return []; // storage unavailable (private mode etc.) or corrupt data
  }
}

export function qualifies(score: number, list: HighScore[]) {
  return score > 0 && (list.length < MAX_ENTRIES || score > list[list.length - 1].score);
}

/** Adds an entry and returns the new list plus the entry's position in it. */
export function addHighScore(name: string, score: number) {
  const entry: HighScore = {
    name: name.trim().slice(0, MAX_NAME_LENGTH) || "???",
    score,
    date: new Date().toISOString().slice(0, 10),
  };
  const list = sortAndTrim([...loadHighScores(), entry]);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Can't persist — the list still shows for this session.
  }
  return { list, rank: list.indexOf(entry) };
}
