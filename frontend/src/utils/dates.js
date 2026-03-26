export function fmtDate(v) {
  if (!v) return '\u2014';
  const d = new Date(v);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function fmtDT(v) {
  if (!v) return '\u2014';
  const d = new Date(v);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  );
}
