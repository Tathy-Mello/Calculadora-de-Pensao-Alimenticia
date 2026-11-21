/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FeriasSplitInfo {
  isValid: boolean;
  spansTwoMonths: boolean;
  dataInicioIso: string;
  dataInicioBr: string;
  dataFimIso: string;
  dataFimBr: string;
  totalDias: number;
  mes1Ano: number;
  mes1Mes: number;
  mes1Rotulo: string; // Ex: "12/2026"
  mes1Nome: string;   // Ex: "Dezembro/2026"
  diasMes1: number;
  proporcaoMes1: number;
  mes2Ano: number;
  mes2Mes: number;
  mes2Rotulo: string; // Ex: "01/2027"
  mes2Nome: string;   // Ex: "Janeiro/2027"
  diasMes2: number;
  proporcaoMes2: number;
}

const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function getDaysInMonth(year: number, month1To12: number): number {
  return new Date(year, month1To12, 0).getDate();
}

/**
 * Faz o parse seguro de uma data ISO (YYYY-MM-DD) sem sofrer deslocamento de fuso horário.
 */
export function parseIsoDateParts(isoDate?: string): { year: number; month: number; day: number } | null {
  if (!isoDate || typeof isoDate !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (year < 1900 || year > 2100 || month < 1 || month > 12) return null;
  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
}

/**
 * Calcula automaticamente a divisão de dias entre competências para férias partidas
 * (ex: 28/12/2026 com 20 dias -> 28/12/2026 a 16/01/2027 = 4 dias em 12/2026 e 16 dias em 01/2027).
 */
export function computeFeriasSplitInfo(
  dataInicioFerias?: string,
  diasFerias?: number
): FeriasSplitInfo {
  const totalDias = Math.max(1, Math.min(30, Math.round(diasFerias || 30)));
  const parts = parseIsoDateParts(dataInicioFerias);

  if (!parts) {
    return {
      isValid: false,
      spansTwoMonths: false,
      dataInicioIso: dataInicioFerias || '',
      dataInicioBr: '—',
      dataFimIso: '',
      dataFimBr: '—',
      totalDias,
      mes1Ano: 0,
      mes1Mes: 0,
      mes1Rotulo: '—',
      mes1Nome: '—',
      diasMes1: totalDias,
      proporcaoMes1: 1,
      mes2Ano: 0,
      mes2Mes: 0,
      mes2Rotulo: '—',
      mes2Nome: '—',
      diasMes2: 0,
      proporcaoMes2: 0,
    };
  }

  const { year, month, day } = parts;
  const daysInStartMonth = getDaysInMonth(year, month);
  const remainingInStartMonth = daysInStartMonth - day + 1;
  const diasMes1 = Math.min(totalDias, remainingInStartMonth);
  const diasMes2 = Math.max(0, totalDias - diasMes1);
  const spansTwoMonths = diasMes2 > 0;

  // Data fim = início + (totalDias - 1) dias em UTC puro para evitar DST
  const startUtc = Date.UTC(year, month - 1, day);
  const endDate = new Date(startUtc + (totalDias - 1) * 86400000);
  const endYear = endDate.getUTCFullYear();
  const endMonth = endDate.getUTCMonth() + 1;
  const endDay = endDate.getUTCDate();

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  const mes1Rotulo = `${pad2(month)}/${year}`;
  const mes1Nome = `${MONTH_NAMES_PT[month - 1]}/${year}`;
  const mes2Rotulo = `${pad2(nextMonth)}/${nextYear}`;
  const mes2Nome = `${MONTH_NAMES_PT[nextMonth - 1]}/${nextYear}`;

  return {
    isValid: true,
    spansTwoMonths,
    dataInicioIso: `${year}-${pad2(month)}-${pad2(day)}`,
    dataInicioBr: `${pad2(day)}/${pad2(month)}/${year}`,
    dataFimIso: `${endYear}-${pad2(endMonth)}-${pad2(endDay)}`,
    dataFimBr: `${pad2(endDay)}/${pad2(endMonth)}/${endYear}`,
    totalDias,
    mes1Ano: year,
    mes1Mes: month,
    mes1Rotulo,
    mes1Nome,
    diasMes1,
    proporcaoMes1: diasMes1 / totalDias,
    mes2Ano: nextYear,
    mes2Mes: nextMonth,
    mes2Rotulo,
    mes2Nome,
    diasMes2,
    proporcaoMes2: diasMes2 / totalDias,
  };
}
