/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Formats a number to Brazilian Real currency format (R$ 1.234,56)
 */
export function formatBRL(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number to Brazilian Real without the 'R$' prefix (1.234,56)
 */
export function formatNumberBR(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a percentage value (e.g. 30 -> "30,00%")
 */
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0,00%';
  }
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * Parses user currency input string (e.g. "1.500,50" or "1500.50" or "R$ 1.500,50") into a clean number
 */
export function parseBRLInput(text: string): number {
  if (!text) return 0;
  
  // Remove currency prefix and whitespace
  let clean = text.replace(/R\$\s?/gi, '').trim();
  
  // If user used pt-BR standard: "1.234,56" -> replace dot with empty and comma with dot
  if (clean.includes(',') && clean.includes('.')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}
