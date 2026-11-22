const MAX_MONETARY_PAISE = 999_999_999_999; // 9,999,999,999.99 (NUMERIC(12,2) max)

const MONEY_PATTERN = /^-?\d+(?:\.\d{1,2})?$/;

/**
 * Parses a decimal string or number (max 2 decimal places) into exact integer paise.
 * Avoids floating-point arithmetic drift during financial aggregations.
 */
export function parseMoneyToPaise(input: string | number): number {
  const normalized =
    typeof input === 'number'
      ? Number.isFinite(input)
        ? input.toFixed(2)
        : ''
      : input.trim().replace(/,/g, '');

  if (!MONEY_PATTERN.test(normalized)) {
    throw new Error(`Invalid monetary value: "${String(input)}"`);
  }

  const isNegative = normalized.startsWith('-');
  const unsigned = isNegative ? normalized.slice(1) : normalized;
  const [wholePart = '0', fracPart = ''] = unsigned.split('.');
  const paddedFrac = (fracPart + '00').slice(0, 2);

  const paise = Number(wholePart) * 100 + Number(paddedFrac);
  if (!Number.isSafeInteger(paise) || paise > MAX_MONETARY_PAISE) {
    throw new Error('Monetary value exceeds NUMERIC(12,2) precision limit.');
  }

  return isNegative ? -paise : paise;
}

export function isValidMoneyInput(input: unknown): boolean {
  if (typeof input === 'number') {
    if (!Number.isFinite(input) || input < 0) return false;
    // Ensure at most 2 decimals when passed as number
    const scaled = input * 100;
    return Math.abs(scaled - Math.round(scaled)) < 1e-6 && Math.round(scaled) <= MAX_MONETARY_PAISE;
  }

  if (typeof input === 'string') {
    const cleaned = input.trim().replace(/,/g, '');
    if (!/^\d+(?:\.\d{1,2})?$/.test(cleaned)) return false;
    try {
      const paise = parseMoneyToPaise(cleaned);
      return paise >= 0 && paise <= MAX_MONETARY_PAISE;
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Formats integer paise into an exact 2-decimal string (e.g. "125000.50", "-500.00").
 */
export function formatPaiseToDecimal(paise: number): string {
  const rounded = Math.round(paise);
  const sign = rounded < 0 ? '-' : '';
  const abs = Math.abs(rounded);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${sign}${whole}.${frac}`;
}
