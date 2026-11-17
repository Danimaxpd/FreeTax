export interface CurrencyParseOptions {
  allowZero?: boolean;
  min?: number;
  max?: number;
}

export interface CurrencyParseResult {
  value: number | null;
  error?: string;
}

function normalizeNumericString(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/\$/g, '')
    .replace(/cop/gi, '')
    .replace(/\s+/g, '');

  if (!cleaned) {
    return null;
  }

  // Handle optional leading sign
  const signMatch = cleaned.match(/^([+-])?(.*)$/);
  const sign = signMatch?.[1] === '-' ? -1 : 1;
  const unsigned = signMatch?.[2] ?? '';

  if (!unsigned || !/^[0-9.,]+$/.test(unsigned)) {
    return null;
  }

  let normalized = unsigned;

  // Pattern 1: Colombian/EU thousand dots e.g. 15.000.000 or 1.234,56
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(unsigned)) {
    normalized = unsigned.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(unsigned)) {
    // Pattern 2: US thousand commas e.g. 15,000,000 or 15,000,000.50
    normalized = unsigned.replace(/,/g, '');
  } else if (unsigned.includes(',') && !unsigned.includes('.')) {
    // Single comma: if exactly 3 digits after comma and >= 1000 style? Wait: 1,500 could be 1500 or 1.5
    // Treat single comma with 1-2 decimals as decimal separator, or 3 digits as thousand separator when integer-like
    const parts = unsigned.split(',');
    if (parts.length === 2 && (parts[1]?.length ?? 0) <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else if (parts.length === 2 && parts[1]?.length === 3 && (parts[0]?.length ?? 0) <= 3) {
      normalized = `${parts[0]}${parts[1]}`;
    } else {
      return null;
    }
  } else if (unsigned.includes('.') && !unsigned.includes(',')) {
    const parts = unsigned.split('.');
    if (parts.length === 2 && parts[1]?.length === 3 && (parts[0]?.length ?? 0) <= 3) {
      // e.g. 500.000 or 1.500 -> Colombian thousand separator
      normalized = `${parts[0]}${parts[1]}`;
    } else if (parts.length === 2) {
      // e.g. 1500000.50
      normalized = unsigned;
    } else {
      return null;
    }
  } else if (unsigned.includes('.') && unsigned.includes(',')) {
    return null;
  }

  const parsed = Number(normalized) * sign;
  if (!Number.isFinite(parsed) || Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
}

export function parseCurrencyInput(
  input: string | number,
  options: CurrencyParseOptions = {},
): CurrencyParseResult {
  const { allowZero = true, min, max } = options;

  let parsed: number | null;
  if (typeof input === 'number') {
    parsed = Number.isFinite(input) && !Number.isNaN(input) ? input : null;
  } else if (typeof input === 'string') {
    if (!input.trim()) {
      return { value: null, error: 'El valor es obligatorio.' };
    }
    parsed = normalizeNumericString(input);
  } else {
    parsed = null;
  }

  if (parsed === null) {
    return {
      value: null,
      error: 'Formato numérico inválido. Usa dígitos y separadores válidos (ej: 15.000.000).',
    };
  }

  if (parsed < 0) {
    return { value: null, error: 'El valor no puede ser negativo.' };
  }

  if (!allowZero && parsed === 0) {
    return { value: null, error: 'El valor debe ser mayor a cero.' };
  }

  if (min !== undefined && parsed < min) {
    return {
      value: null,
      error: `El valor mínimo permitido es $${Math.round(min).toLocaleString('es-CO')}.`,
    };
  }

  if (max !== undefined && parsed > max) {
    return {
      value: null,
      error: `El valor máximo permitido es $${Math.round(max).toLocaleString('es-CO')}.`,
    };
  }

  return { value: parsed };
}

export function parseFormattedNumber(input: string): number | null {
  try {
    const result = parseCurrencyInput(input, { allowZero: false });
    if (result.value === null) {
      return null;
    }

    const integerValue = Math.trunc(result.value);
    if (integerValue <= 1000000) {
      return null;
    }

    return integerValue;
  } catch {
    return null;
  }
}

export function isValidNumber(input: string): boolean {
  const parsedNumber = parseFormattedNumber(input);
  return parsedNumber !== null && parsedNumber > 0;
}
