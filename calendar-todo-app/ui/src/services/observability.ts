import { invoke } from '@tauri-apps/api/tauri';

type InvokeArgs = Record<string, unknown>;

interface ObservabilityOptions {
  includeTraceContext?: boolean;
  uiAction?: string;
}

interface TraceContext {
  traceId: string;
  uiAction: string;
}

let traceCounter = 0;

function isJestRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env !== undefined &&
    process.env.JEST_WORKER_ID !== undefined
  );
}

function shouldLogUiTiming(): boolean {
  if (isJestRuntime()) {
    return false;
  }

  const override = (globalThis as any).__RCTD_UI_TIMING_ENABLED;
  if (typeof override === 'boolean') {
    return override;
  }

  return true;
}

function shouldPropagateTraceContext(): boolean {
  if (isJestRuntime()) {
    return false;
  }

  const override = (globalThis as any).__RCTD_TRACE_PROPAGATION_ENABLED;
  if (typeof override === 'boolean') {
    return override;
  }

  return true;
}

function buildTraceContext(command: string, options?: ObservabilityOptions): TraceContext {
  const timestamp = Date.now();
  traceCounter += 1;
  const generatedId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${timestamp}-${traceCounter}`;

  return {
    traceId: `${command}-${generatedId}`,
    uiAction: options?.uiAction ?? command,
  };
}

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

export async function timedInvoke<T>(
  command: string,
  args?: InvokeArgs,
  options?: ObservabilityOptions
): Promise<T> {
  const traceContext = buildTraceContext(command, options);
  const includeTraceContext =
    options?.includeTraceContext === true && shouldPropagateTraceContext();
  const started = nowMs();

  if (shouldLogUiTiming()) {
    console.info('RCTD_UI_FETCH_START', {
      command,
      traceId: traceContext.traceId,
      uiAction: traceContext.uiAction,
    });
  }

  let payload = args;
  if (includeTraceContext) {
    payload = args ? { ...args, traceContext } : { traceContext };
  }

  try {
    const result = (await (payload ? invoke(command, payload) : invoke(command))) as T;

    if (shouldLogUiTiming()) {
      console.info('RCTD_UI_FETCH_TIMING', {
        command,
        traceId: traceContext.traceId,
        durationMs: Number((nowMs() - started).toFixed(3)),
        success: true,
      });
    }

    return result;
  } catch (error) {
    if (shouldLogUiTiming()) {
      console.warn('RCTD_UI_FETCH_TIMING', {
        command,
        traceId: traceContext.traceId,
        durationMs: Number((nowMs() - started).toFixed(3)),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    throw error;
  }
}
