export function formatMoney(value: number | string): string {
  if (value == null || isNaN(Number(value))) return '';

  const numericValue = typeof value === 'number' ? value : Number(value);

  // Use Intl.NumberFormat for reliable thousand separators
  return new Intl.NumberFormat('id-ID').format(numericValue);
}


export function parseMoney(value: string): number | bigint {
  if (!value) return 0;

  // Remove thousand separators (.)
  const cleanValue = value.replace(/\./g, '');

  // Convert to BigInt if the number is too large for JavaScript's safe range
  return BigInt(cleanValue) > BigInt(Number.MAX_SAFE_INTEGER)
    ? BigInt(cleanValue)
    : Number(cleanValue);
}

