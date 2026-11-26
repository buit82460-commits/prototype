export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function formatTimeInZone(isoString: string | undefined, timeZone = 'Asia/Bangkok'): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      timeZone,
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString.slice(0, 16).replace('T', ' ');
  }
}

export function formatClockOnly(isoString: string | undefined, timeZone = 'Asia/Bangkok'): string {
  if (!isoString) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone,
      hour12: false,
    }).format(new Date(isoString));
  } catch {
    return isoString.slice(11, 19);
  }
}

export function formatNumberCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('en-US');
}
