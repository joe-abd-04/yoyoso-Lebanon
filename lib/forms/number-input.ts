import type { KeyboardEvent, WheelEvent } from "react";

/**
 * Spread onto an <input type="number"> to stop ACCIDENTAL value changes — the
 * classic "scrolled the page and the price ticked down a cent" bug:
 *   • mouse wheel while focused → we blur instead (the page scrolls, the value
 *     is left untouched), and
 *   • Arrow Up / Arrow Down → blocked (they nudge the value by the step).
 * Pair with the `.no-spinner` class to also hide the up/down spinner buttons.
 * Typing works normally; validation is unchanged. The value can only be typed.
 */
export const numberInputGuard = {
  onWheel: (e: WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  },
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
  },
};
