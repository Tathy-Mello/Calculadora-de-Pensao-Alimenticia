/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InssTable } from '../types/inss';
import { CalculationType } from '../types/pension';

export const OFFICIAL_INSS_TABLES: InssTable[] = [
  {
    id: 'inss_2026_oficial',
    ano: 2026,
    vigenciaInicial: '2026-01-01',
    vigenciaFinal: '2026-12-31',
    tipoCalculo: 'todos',
    tetoPrevidenciario: 8475.55,
    tetoMaximoContribuicao: 988.09,
    observacao: 'Tabela oficial do Regime Geral de Previdência Social (RGPS) válida a partir da competência janeiro de 2026',
    fonte: 'Portaria Interministerial MPS/MF - Exercício 2026 (Salário Mínimo R$ 1.621,00, Teto R$ 8.475,55)',
    faixas: [
      {
        faixaNumero: 1,
        faixaInicial: 0,
        faixaFinal: 1621.00,
        aliquota: 7.5,
        parcelaADeduzir: 0,
        observacao: 'Até R$ 1.621,00 (7,5%)',
      },
      {
        faixaNumero: 2,
        faixaInicial: 1621.01,
        faixaFinal: 2902.84,
        aliquota: 9.0,
        parcelaADeduzir: 24.32,
        observacao: 'De R$ 1.621,01 até R$ 2.902,84 (9,0%)',
      },
      {
        faixaNumero: 3,
        faixaInicial: 2902.85,
        faixaFinal: 4354.27,
        aliquota: 12.0,
        parcelaADeduzir: 111.40,
        observacao: 'De R$ 2.902,85 até R$ 4.354,27 (12,0%)',
      },
      {
        faixaNumero: 4,
        faixaInicial: 4354.28,
        faixaFinal: 8475.55,
        aliquota: 14.0,
        parcelaADeduzir: 198.49,
        observacao: 'De R$ 4.354,28 até R$ 8.475,55 (14,0% - Teto RGPS)',
      },
    ],
  },
  {
    id: 'inss_2025_oficial',
    ano: 2025,
    vigenciaInicial: '2025-01-01',
    vigenciaFinal: '2025-12-31',
    tipoCalculo: 'todos',
    tetoPrevidenciario: 8157.41,
    tetoMaximoContribuicao: 951.63,
    observacao: 'Tabela oficial do Regime Geral de Previdência Social (RGPS) para o exercício de 2025',
    fonte: 'Portaria Interministerial MPS/MF nº 6, de 10 de janeiro de 2025',
    faixas: [
      {
        faixaNumero: 1,
        faixaInicial: 0,
        faixaFinal: 1518.00,
        aliquota: 7.5,
        parcelaADeduzir: 0,
        observacao: 'Até 1 salário mínimo federal (R$ 1.518,00)',
      },
      {
        faixaNumero: 2,
        faixaInicial: 1518.01,
        faixaFinal: 2793.88,
        aliquota: 9.0,
        parcelaADeduzir: 22.77,
        observacao: 'De R$ 1.518,01 até R$ 2.793,88',
      },
      {
        faixaNumero: 3,
        faixaInicial: 2793.89,
        faixaFinal: 4190.83,
        aliquota: 12.0,
        parcelaADeduzir: 106.59,
        observacao: 'De R$ 2.793,89 até R$ 4.190,83',
      },
      {
        faixaNumero: 4,
        faixaInicial: 4190.84,
        faixaFinal: 8157.41,
        aliquota: 14.0,
        parcelaADeduzir: 190.40,
        observacao: 'De R$ 4.190,84 até o Teto Previdenciário (R$ 8.157,41)',
      },
    ],
  },
  {
    id: 'inss_2024_oficial',
    ano: 2024,
    vigenciaInicial: '2024-01-01',
    vigenciaFinal: '2024-12-31',
    tipoCalculo: 'todos',
    tetoPrevidenciario: 7786.02,
    tetoMaximoContribuicao: 908.86,
    observacao: 'Tabela oficial do Regime Geral de Previdência Social (RGPS) para o exercício de 2024',
    fonte: 'Portaria Interministerial MPS/MF nº 2, de 11 de janeiro de 2024',
    faixas: [
      {
        faixaNumero: 1,
        faixaInicial: 0,
        faixaFinal: 1412.00,
        aliquota: 7.5,
        parcelaADeduzir: 0,
        observacao: 'Até 1 salário mínimo federal (R$ 1.412,00)',
      },
      {
        faixaNumero: 2,
        faixaInicial: 1412.01,
        faixaFinal: 2666.68,
        aliquota: 9.0,
        parcelaADeduzir: 21.18,
        observacao: 'De R$ 1.412,01 até R$ 2.666,68',
      },
      {
        faixaNumero: 3,
        faixaInicial: 2666.69,
        faixaFinal: 4000.03,
        aliquota: 12.0,
        parcelaADeduzir: 101.18,
        observacao: 'De R$ 2.666,69 até R$ 4.000,03',
      },
      {
        faixaNumero: 4,
        faixaInicial: 4000.04,
        faixaFinal: 7786.02,
        aliquota: 14.0,
        parcelaADeduzir: 181.18,
        observacao: 'De R$ 4.000,04 até o Teto Previdenciário (R$ 7.786,02)',
      },
    ],
  },
];

/**
 * Busca a tabela de INSS correspondente estritamente ao Ano e Tipo de Cálculo informados.
 * NÃO inventa ou assume tabelas de outros anos sem correspondência explícita.
 */
export function findInssTable(ano: number, tipoCalculo: CalculationType): InssTable | null {
  // Procura por tabela específica para o tipo de cálculo ou geral ('todos')
  const specific = OFFICIAL_INSS_TABLES.find(
    (t) => t.ano === ano && t.tipoCalculo === tipoCalculo
  );
  if (specific) return specific;

  const general = OFFICIAL_INSS_TABLES.find(
    (t) => t.ano === ano && (t.tipoCalculo === 'todos' || !t.tipoCalculo)
  );
  return general || null;
}
