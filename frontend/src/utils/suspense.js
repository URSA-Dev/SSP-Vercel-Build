const DEFAULT_TOTAL_MS = 48 * 3600 * 1000; // 48 hours

export function suspenseCalc(deadline, totalMs = DEFAULT_TOTAL_MS) {
  const now = Date.now();
  const dl = new Date(deadline).getTime();
  const remaining = dl - now;
  const over = remaining <= 0;

  const absDiff = Math.abs(remaining);
  const days = Math.floor(absDiff / (24 * 3600 * 1000));
  const hours = Math.floor((absDiff % (24 * 3600 * 1000)) / (3600 * 1000));
  const minutes = Math.floor((absDiff % (3600 * 1000)) / (60 * 1000));

  let text;
  if (days > 0) {
    text = `${days}d ${hours}h`;
  } else {
    text = `${hours}h ${minutes}m`;
  }
  if (over) text = '-' + text;

  const elapsed = totalMs - remaining;
  const pct = Math.max(0, Math.min(100, (elapsed / totalMs) * 100));

  let cls;
  if (over) {
    cls = 'over';
  } else if (pct >= 75) {
    cls = 'warn';
  } else {
    cls = 'ok';
  }

  return { text, over, pct, cls };
}

export function suspenseRing(pct, color) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return `<svg width="48" height="48" viewBox="0 0 48 48">
  <circle cx="24" cy="24" r="${radius}" fill="none" stroke="#e5e7eb" stroke-width="4"/>
  <circle cx="24" cy="24" r="${radius}" fill="none" stroke="${color}" stroke-width="4"
    stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
    stroke-linecap="round" transform="rotate(-90 24 24)"/>
  <text x="24" y="24" text-anchor="middle" dominant-baseline="central"
    font-size="11" font-weight="600" fill="${color}">${Math.round(pct)}%</text>
</svg>`;
}

export function suspenseColor(cls) {
  switch (cls) {
    case 'ok':
      return 'var(--color-green-500, #22c55e)';
    case 'warn':
      return 'var(--color-amber-500, #f59e0b)';
    case 'over':
      return 'var(--color-red-500, #ef4444)';
    default:
      return 'var(--color-gray-400, #9ca3af)';
  }
}
