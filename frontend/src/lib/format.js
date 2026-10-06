const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0
});

export function formatCurrency(value) {
  return clp.format(Number(value || 0));
}

export function formatDate(value, withTime = false) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  });
}

export function formatNumber(value) {
  return new Intl.NumberFormat('es-CL').format(Number(value || 0));
}
