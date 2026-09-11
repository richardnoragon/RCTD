export function markStartupPhase(name: string): void {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }

  try {
    performance.mark(name);
  } catch {
    // Ignore browser timing failures during startup.
  }
}

export function measureStartupPhase(
  phaseName: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance === 'undefined' || typeof performance.measure !== 'function') {
    return null;
  }

  try {
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.measure(phaseName, startMark, endMark);

    const entries = performance.getEntriesByName(phaseName, 'measure');
    const duration = entries.at(-1)?.duration ?? 0;
    const rounded = Number(duration.toFixed(3));

    console.info('RCTD_STARTUP_PHASE', {
      phase: phaseName,
      durationMs: rounded,
    });

    performance.clearMeasures(phaseName);
    return rounded;
  } catch {
    return null;
  }
}

export function scheduleIdleTask(callback: () => void) {
  if (typeof globalThis === 'undefined') {
    callback();
    return undefined;
  }

  if (typeof globalThis.requestIdleCallback === 'function') {
    return globalThis.requestIdleCallback(() => callback()) as number;
  }

  return globalThis.setTimeout(callback, 0) as ReturnType<typeof setTimeout>;
}
