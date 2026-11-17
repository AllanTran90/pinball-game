import type { InputState } from "./engine";

type Action = keyof InputState;

const KEY_MAP: Record<string, Action> = {
  ArrowLeft: "left",
  KeyA: "left",
  KeyZ: "left",
  ShiftLeft: "left",
  ArrowRight: "right",
  KeyD: "right",
  Slash: "right",
  ShiftRight: "right",
  Space: "plunger",
  ArrowDown: "plunger",
  KeyS: "plunger",
};

/**
 * Wires keyboard and touch/mouse input to `input`.
 * Touch: left half = left flipper, right half = right flipper + plunger.
 * `onStart` fires on any press while no game is running.
 */
export function bindInput(
  input: InputState,
  surface: HTMLElement,
  isPlaying: () => boolean,
  onStart: () => void,
) {
  const set = (action: Action, down: boolean) => (input[action] = down);

  const onKey = (down: boolean) => (e: KeyboardEvent) => {
    const action = KEY_MAP[e.code];
    if (!action && e.code !== "Enter") return;
    e.preventDefault(); // keep Space/arrows from scrolling the page
    if (down && !e.repeat && !isPlaying()) return onStart();
    if (action) set(action, down);
  };

  const pointers = new Map<number, Action[]>();
  const actionsFor = (e: PointerEvent): Action[] => {
    const rect = surface.getBoundingClientRect();
    return e.clientX - rect.left < rect.width / 2 ? ["left"] : ["right", "plunger"];
  };
  const releasePointer = (e: PointerEvent) => {
    pointers.get(e.pointerId)?.forEach((a) => set(a, false));
    pointers.delete(e.pointerId);
  };
  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    if (!isPlaying()) return onStart();
    const actions = actionsFor(e);
    pointers.set(e.pointerId, actions);
    actions.forEach((a) => set(a, true));
  };

  const listeners: [EventTarget, string, EventListener][] = [
    [window, "keydown", onKey(true) as EventListener],
    [window, "keyup", onKey(false) as EventListener],
    [surface, "pointerdown", onPointerDown as EventListener],
    [window, "pointerup", releasePointer as EventListener],
    [window, "pointercancel", releasePointer as EventListener],
    // Release everything if the tab loses focus mid-press.
    [window, "blur", () => (Object.keys(input) as Action[]).forEach((a) => set(a, false))],
  ];
  listeners.forEach(([t, type, fn]) => t.addEventListener(type, fn));
  return () => listeners.forEach(([t, type, fn]) => t.removeEventListener(type, fn));
}
