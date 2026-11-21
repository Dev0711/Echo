import { formatDistanceToNowStrict } from 'date-fns';

/**
 * The backend stores times in UTC and serialises Java LocalDateTime without a zone
 * ("2026-11-21T09:00:00"). Browsers would read that as *local* time, so we mark it as UTC.
 */
export function parseServerDate(value?: string | null): Date | null {
  if (!value) return null;
  const hasZone = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value);
  const d = new Date(hasZone ? value : value + 'Z');
  return isNaN(d.getTime()) ? null : d;
}

export function timeAgo(value?: string | null): string {
  const d = parseServerDate(value);
  if (!d) return '';
  if (Date.now() - d.getTime() < 45_000) return 'just now';
  return formatDistanceToNowStrict(d, { addSuffix: true });
}

export function formatDateTime(value?: string | null): string {
  const d = parseServerDate(value);
  return d
    ? d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '';
}
