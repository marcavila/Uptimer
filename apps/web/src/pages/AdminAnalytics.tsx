import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useAuth } from '../app/AuthContext';
import {
  fetchAdminAnalyticsOverview,
  fetchAdminMonitors,
  fetchAdminMonitorAnalytics,
  fetchAdminMonitorOutages,
} from '../api/client';
import type { AnalyticsOverviewRange, AnalyticsRange } from '../api/types';
import { DailyLatencyChart } from '../components/DailyLatencyChart';
import { DailyUptimeChart } from '../components/DailyUptimeChart';
import { LatencyChart } from '../components/LatencyChart';

function formatPct(v: number): string {
  if (!Number.isFinite(v)) return '-';
  return `${v.toFixed(3)}%`;
}

function formatSec(v: number): string {
  if (!Number.isFinite(v)) return '-';
  if (v < 60) return `${v}s`;
  const m = Math.floor(v / 60);
  const s = v % 60;
  if (m < 60) return `${m}m ${s}s`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

export function AdminAnalytics() {
  const { logout } = useAuth();

  const [overviewRange, setOverviewRange] = useState<AnalyticsOverviewRange>('24h');
  const [monitorRange, setMonitorRange] = useState<AnalyticsRange>('24h');
  const [selectedMonitorId, setSelectedMonitorId] = useState<number | null>(null);

  const overviewQuery = useQuery({
    queryKey: ['admin-analytics-overview', overviewRange],
    queryFn: () => fetchAdminAnalyticsOverview(overviewRange),
  });

  const monitorsQuery = useQuery({
    queryKey: ['admin-monitors', 'for-analytics'],
    queryFn: () => fetchAdminMonitors(200),
  });

  const monitors = useMemo(() => monitorsQuery.data?.monitors ?? [], [monitorsQuery.data?.monitors]);

  useEffect(() => {
    if (selectedMonitorId !== null) return;
    const first = monitors[0];
    if (first) setSelectedMonitorId(first.id);
  }, [monitors, selectedMonitorId]);

  const selectedMonitor = useMemo(() => monitors.find((m) => m.id === selectedMonitorId) ?? null, [monitors, selectedMonitorId]);

  const monitorAnalyticsQuery = useQuery({
    queryKey: ['admin-monitor-analytics', selectedMonitorId, monitorRange],
    queryFn: () => fetchAdminMonitorAnalytics(selectedMonitorId as number, monitorRange),
    enabled: selectedMonitorId !== null,
  });

  const outagesQuery = useInfiniteQuery({
    queryKey: ['admin-monitor-outages', selectedMonitorId, monitorRange],
    queryFn: ({ pageParam }) => {
      const opts: { range: AnalyticsRange; limit: number; cursor?: number } = { range: monitorRange, limit: 50 };
      if (typeof pageParam === 'number') opts.cursor = pageParam;
      return fetchAdminMonitorOutages(selectedMonitorId as number, opts);
    },
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: selectedMonitorId !== null,
  });

  const outages = outagesQuery.data?.pages.flatMap((p) => p.outages) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Analytics</h1>
          <div className="flex gap-2 sm:gap-4">
            <Link to="/admin" className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg active:bg-gray-100">
              Dashboard
            </Link>
            <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg active:bg-gray-100">
              Status
            </Link>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800 px-2 py-1.5 rounded-lg active:bg-red-50">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6 sm:space-y-10">
        {/* Overview */}
        <section className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <h2 className="text-lg font-semibold">Overview</h2>
            <div className="flex gap-2">
              {(['24h', '7d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setOverviewRange(r)}
                  className={`px-3 py-1.5 rounded text-sm ${overviewRange === r ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {overviewQuery.isLoading ? (
            <div className="mt-4 text-gray-500">Loading...</div>
          ) : overviewQuery.data ? (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded">
                <div className="text-xs text-gray-500">Uptime</div>
                <div className="text-lg font-semibold">{formatPct(overviewQuery.data.totals.uptime_pct)}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-xs text-gray-500">Downtime</div>
                <div className="text-lg font-semibold">{formatSec(overviewQuery.data.totals.downtime_sec)}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-xs text-gray-500">Alerts</div>
                <div className="text-lg font-semibold">{overviewQuery.data.alerts.count}</div>
              </div>
              <div className="p-4 border rounded">
                <div className="text-xs text-gray-500">MTTR</div>
                <div className="text-lg font-semibold">{overviewQuery.data.outages.mttr_sec === null ? '-' : formatSec(overviewQuery.data.outages.mttr_sec)}</div>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-gray-500">Failed to load overview</div>
          )}
        </section>

        {/* Monitor */}
        <section className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-lg font-semibold">Monitor</h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedMonitorId ?? ''}
                onChange={(e) => setSelectedMonitorId(e.target.value ? Number(e.target.value) : null)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select a monitor…
                </option>
                {monitors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} (#{m.id})
                  </option>
                ))}
              </select>

              <select
                value={monitorRange}
                onChange={(e) => setMonitorRange(e.target.value as AnalyticsRange)}
                className="border rounded px-3 py-2 text-sm"
              >
                {(['24h', '7d', '30d', '90d'] as const).map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {monitorAnalyticsQuery.isLoading ? (
            <div className="text-gray-500">Loading…</div>
          ) : !monitorAnalyticsQuery.data ? (
            <div className="text-gray-500">Select a monitor to view analytics</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded">
                  <div className="text-xs text-gray-500">Uptime</div>
                  <div className="text-lg font-semibold">{formatPct(monitorAnalyticsQuery.data.uptime_pct)}</div>
                </div>
                <div className="p-4 border rounded">
                  <div className="text-xs text-gray-500">Unknown</div>
                  <div className="text-lg font-semibold">{formatPct(monitorAnalyticsQuery.data.unknown_pct)}</div>
                </div>
                <div className="p-4 border rounded">
                  <div className="text-xs text-gray-500">P95 Latency</div>
                  <div className="text-lg font-semibold">
                    {monitorAnalyticsQuery.data.p95_latency_ms === null ? '-' : `${monitorAnalyticsQuery.data.p95_latency_ms}ms`}
                  </div>
                </div>
                <div className="p-4 border rounded">
                  <div className="text-xs text-gray-500">P50 Latency</div>
                  <div className="text-lg font-semibold">
                    {monitorAnalyticsQuery.data.p50_latency_ms === null ? '-' : `${monitorAnalyticsQuery.data.p50_latency_ms}ms`}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="border rounded p-4">
                  <div className="text-sm font-medium mb-2">Uptime (Daily)</div>
                  {monitorRange === '24h' ? (
                    <div className="text-sm text-gray-500 h-[220px] flex items-center justify-center">
                      Daily rollup charts are available for 7d/30d/90d
                    </div>
                  ) : (
                    <DailyUptimeChart points={monitorAnalyticsQuery.data.daily} />
                  )}
                </div>
                <div className="border rounded p-4">
                  <div className="text-sm font-medium mb-2">Latency</div>
                  {monitorRange === '24h' ? (
                    <LatencyChart points={monitorAnalyticsQuery.data.points} />
                  ) : (
                    <DailyLatencyChart points={monitorAnalyticsQuery.data.daily} />
                  )}
                </div>
              </div>

              <div className="border rounded p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm font-medium">Outages</div>
                  {selectedMonitor && (
                    <div className="text-xs text-gray-500">
                      {selectedMonitor.name} (#{selectedMonitor.id})
                    </div>
                  )}
                </div>

                {outagesQuery.isLoading ? (
                  <div className="mt-3 text-gray-500">Loading outages…</div>
                ) : outages.length === 0 ? (
                  <div className="mt-3 text-gray-500">No outages in this range</div>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm min-w-[500px]">
                      <thead className="text-xs text-gray-500">
                        <tr>
                          <th className="text-left py-2 pr-4">Start</th>
                          <th className="text-left py-2 pr-4">End</th>
                          <th className="text-left py-2 pr-4">Initial error</th>
                          <th className="text-left py-2 pr-4">Last error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {outages.map((o) => (
                          <tr key={o.id}>
                            <td className="py-2 pr-4 whitespace-nowrap">{new Date(o.started_at * 1000).toLocaleString()}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">{o.ended_at ? new Date(o.ended_at * 1000).toLocaleString() : 'Ongoing'}</td>
                            <td className="py-2 pr-4 text-gray-600">{o.initial_error ?? '-'}</td>
                            <td className="py-2 pr-4 text-gray-600">{o.last_error ?? '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {outagesQuery.hasNextPage && (
                      <div className="mt-4">
                        <button
                          onClick={() => outagesQuery.fetchNextPage()}
                          disabled={outagesQuery.isFetchingNextPage}
                          className="px-3 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
                        >
                          {outagesQuery.isFetchingNextPage ? 'Loading…' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
