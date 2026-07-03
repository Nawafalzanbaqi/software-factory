import "server-only";

/**
 * Frontend analytics seam (§9 NoOp rule): the dashboard widget renders
 * whatever an IAnalyticsProvider returns, and the system must boot and pass
 * tests with ZERO analytics keys set — hence the NoOp default. Wiring a real
 * provider is a one-line swap in getAnalyticsProvider().
 *
 * // TODO(phase-6): UmamiAnalyticsProvider (UMAMI_API_URL/UMAMI_API_KEY) —
 * // same interface, real numbers from the Umami stats API.
 */

export interface AnalyticsTopPage {
  path: string;
  pageviews: number;
}

export interface AnalyticsSource {
  source: string;
  visitors: number;
}

export interface AnalyticsSummary {
  /** ISO date range the summary covers. */
  from: string;
  to: string;
  visitors: number;
  pageviews: number;
  topPages: AnalyticsTopPage[];
  sources: AnalyticsSource[];
  /** False for NoOp — lets the widget render an honest "not connected" note. */
  connected: boolean;
}

export interface IAnalyticsProvider {
  getSummary(days: number): Promise<AnalyticsSummary>;
}

/** Deterministic empty summary — no API keys, no network, never throws. */
export class NoOpAnalyticsProvider implements IAnalyticsProvider {
  async getSummary(days: number): Promise<AnalyticsSummary> {
    const to = new Date();
    const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString(),
      to: to.toISOString(),
      visitors: 0,
      pageviews: 0,
      topPages: [],
      sources: [],
      connected: false,
    };
  }
}

/** DI-lite: the active provider for this deployment. */
export function getAnalyticsProvider(): IAnalyticsProvider {
  // TODO(phase-6): return new UmamiAnalyticsProvider() when UMAMI_* env is set.
  return new NoOpAnalyticsProvider();
}
