// @ts-nocheck
/**
 * Deterministic time utilities for integration tests
 *
 * Provides helpers to freeze, advance, and reset the clock using Jest modern timers.
 * Intended for use in date/time and recurrence tests to ensure reproducibility.
 *
 * Created: 2025-09-07
 */

type TimeLike = string | number | Date;

const asDate = (t: TimeLike): Date => (t instanceof Date ? t : new Date(t));

/**
 * freezeClock()
 * Freeze time at the provided moment using Jest modern fake timers.
 * Subsequent Date.now(), new Date(), setTimeout, etc. will use the frozen clock.
 */
export function freezeClock(at: TimeLike): void {
  const date = asDate(at);
  // Use modern fake timers with a specific system time
  jest.useFakeTimers({
    now: date,
    doNotFake: ['nextTick', 'setImmediate', 'performance'], // avoid faking perf metrics by default
  });
}

/**
 * setClock()
 * Set the fake system time to a specific instant without switching mode.
 * If fake timers are not active, this will implicitly enable them.
 */
export function setClock(at: TimeLike): void {
  const date = asDate(at);
  try {
    jest.setSystemTime(date);
  } catch {
    // If fake timers are not active, enable them and try again
    jest.useFakeTimers({ now: date });
  }
}

/**
 * advanceClock()
 * Advance the fake timers by the specified milliseconds.
 */
export function advanceClock(ms: number): void {
  jest.advanceTimersByTime(ms);
}

/**
 * resetClock()
 * Restore real timers. Call at the end of suites that froze time.
 */
export function resetClock(): void {
  jest.useRealTimers();
}

/**
 * nowISO()
 * Returns the current time (fake or real) as an ISO string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * withFrozenClock()
 * Convenience helper to freeze time for the duration of an async function and then reset.
 */
export async function withFrozenClock<T>(at: TimeLike, fn: () => Promise<T> | T): Promise<T> {
  freezeClock(at);
  try {
    return await fn();
  } finally {
    resetClock();
  }
}