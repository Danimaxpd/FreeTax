function parseFormattedNumber(input: string): number | null {
  try {
    // First remove any spaces
    let cleanInput = input.trim().replace(/\s/g, '');

    // If there's a comma, it's a decimal separator - remove it and everything after
    if (cleanInput.includes(',')) {
      cleanInput = cleanInput.split(',')[0] || '';
    }

    // Remove all dots (thousand separators in Colombian format)
    cleanInput = cleanInput.replace(/\./g, '');

    // Check if it's a valid number after cleaning
    if (!/^\d+$/.test(cleanInput)) {
      return null;
    }

    return parseInt(cleanInput, 10);
  } catch {
    return null;
  }
}

function isValidNumber(input: string): boolean {
  const parsedNumber = parseFormattedNumber(input);
  return parsedNumber !== null && parsedNumber > 0;
}

export { isValidNumber, parseFormattedNumber };
