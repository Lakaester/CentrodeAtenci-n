/** PERF-002: Performance instrumentation — no business logic changes */

export interface PerfEntry {
  step: string;
  start: string;
  end: string;
  durationMs: number;
  detail?: Record<string, unknown>;
}

export class PerfLogger {
  private entries: PerfEntry[] = [];
  private timers = new Map<string, number>();
  private requestCount = 0;

  start(step: string): void {
    this.timers.set(step, Date.now());
    this.entries.push({ step, start: new Date().toISOString(), end: "", durationMs: 0 });
  }

  end(step: string, detail?: Record<string, unknown>): number {
    const t = this.timers.get(step);
    if (!t) return 0;
    const dur = Date.now() - t;
    const entry = this.entries.find((e) => e.step === step && !e.end);
    if (entry) {
      entry.end = new Date().toISOString();
      entry.durationMs = dur;
      if (detail) entry.detail = detail;
    }
    this.timers.delete(step);
    return dur;
  }

  countRequest(): void {
    this.requestCount++;
  }

  get totalMs(): number {
    const first = this.entries[0];
    const last = [...this.entries].reverse().find((e) => e.durationMs > 0);
    if (!first || !last) return 0;
    return (new Date(last.end).getTime() - new Date(first.start).getTime());
  }

  get totalRequests(): number {
    return this.requestCount;
  }

  report(ticketId: number): string {
    const lines: string[] = [];
    lines.push("=".repeat(60));
    lines.push(`[PERF] Ticket #${ticketId} — Performance Report`);
    lines.push(`Total requests: ${this.requestCount}`);
    lines.push(`Total time: ${this.totalMs}ms`);
    lines.push("=".repeat(60));

    const sorted = [...this.entries].filter((e) => e.durationMs > 0).sort((a, b) => b.durationMs - a.durationMs);
    const top10 = sorted.slice(0, 10);

    lines.push("");
    lines.push("── Timeline ──");
    let acc = 0;
    for (const e of this.entries) {
      if (e.durationMs > 0) {
        acc += e.durationMs;
        const pct = this.totalMs > 0 ? Math.round((e.durationMs / this.totalMs) * 100) : 0;
        const detail = e.detail ? " " + JSON.stringify(e.detail) : "";
        lines.push(`  ${e.step.padEnd(25)} ${String(e.durationMs).padStart(6)}ms (${String(pct).padStart(2)}%)${detail}`);
      } else {
        lines.push(`  ${e.step.padEnd(25)} pending...`);
      }
    }

    lines.push("");
    lines.push("── Top 10 slowest ──");
    for (const e of top10) {
      lines.push(`  ${String(e.durationMs).padStart(6)}ms  ${e.step}`);
    }

    lines.push("");
    lines.push("── Summary ──");
    lines.push(`  Total time:         ${this.totalMs}ms`);
    lines.push(`  HTTP requests:      ${this.requestCount}`);
    lines.push(`  Steps measured:     ${this.entries.length}`);

    if (this.totalMs > 2000) {
      lines.push(`  ⚠ EXCEEDS 2s TARGET by ${this.totalMs - 2000}ms`);
    } else {
      lines.push(`  ✓ Within 2s target`);
    }

    lines.push("=".repeat(60));
    return lines.join("\n");
  }

  toJSON() {
    return {
      totalMs: this.totalMs,
      totalRequests: this.requestCount,
      entries: this.entries.filter((e) => e.durationMs > 0).map((e) => ({
        step: e.step,
        durationMs: e.durationMs,
        detail: e.detail,
      })),
    };
  }
}

/** Wraps an async operation with perf logging */
export async function trace<T>(
  logger: PerfLogger,
  step: string,
  fn: () => Promise<T>,
  detail?: Record<string, unknown>,
): Promise<T> {
  logger.start(step);
  try {
    const result = await fn();
    logger.end(step, detail);
    return result;
  } catch (err: unknown) {
    logger.end(step, { ...detail, error: err instanceof Error ? err.message : String(err) });
    throw err;
  }
}
