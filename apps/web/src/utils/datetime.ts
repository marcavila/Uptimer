export type TimeZone = string;

function safeDate(tsSec: number): Date | null {
  if (!Number.isFinite(tsSec)) return null;
  const d = new Date(tsSec * 1000);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function formatDateTime(tsSec: number, timeZone?: TimeZone): string {
  const d = safeDate(tsSec);
  if (!d) return '';

  try {
    return d.toLocaleString(undefined, timeZone ? { timeZone } : undefined);
  } catch {
    // Invalid/unsupported timeZone in this runtime; fall back to local.
    return d.toLocaleString();
  }
}

export function formatDate(tsSec: number, timeZone?: TimeZone): string {
  const d = safeDate(tsSec);
  if (!d) return '';

  try {
    return d.toLocaleDateString(undefined, timeZone ? { timeZone } : undefined);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatTime(
  tsSec: number,
  opts: { timeZone?: TimeZone; hour12?: boolean } = {},
): string {
  const d = safeDate(tsSec);
  if (!d) return '';

  try {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: opts.hour12,
      ...(opts.timeZone ? { timeZone: opts.timeZone } : {}),
    });
  } catch {
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: opts.hour12,
    });
  }
}
