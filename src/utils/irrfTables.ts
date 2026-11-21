/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { IrrfTable } from '../types/irrf';
import { CalculationType } from '../types/pension';

export const OFFICIAL_IRRF_TABLES: IrrfTable[] = [
  // Tabela Geral (Folha, Férias, 13º, Rescisão) - 2026
  {
    id: 'irrf_2026_geral',
    ano: 2026,
    vigenciaInicial: '2026-01-01',
    vigenciaFinal: '2026-12-31',
    tipoCalculo: 'todos',
    deducaoPorDependente: 189.59,
    descontoSimplificadoMensal: 607.20,
    observacoes: 'Tabela progressiva mensal oficial do Imposto de Renda Retido na Fonte (IRRF) válida a partir de janeiro de 2026',
    fonte: 'Tabela de Incidência Mensal RFB / Regra de Redutor Adicional 2026',
    redutorAdicional: {
      ativo: true,
      limiteIsencaoTotal: 5000.00,
      valorReducaoFixa: 312.89,
      limiteReducaoGradual: 7350.00,
      constanteFormula: 978.61,
      fatorFormula: 0.133145,
    },
    faixas: [
      {
        faixaNumero: 1,
        faixaInicial: 0,
        faixaFinal: 2428.80,
        aliquota: 0,
        parcelaADeduzir: 0,
        observacao: 'Até R$ 2.428,80: Isento (-)',
      },
      {
        faixaNumero: 2,
        faixaInicial: 2428.81,
        faixaFinal: 2826.65,
        aliquota: 7.5,
        parcelaADeduzir: 182.16,
        observacao: 'De R$ 2.428,81 até R$ 2.826,65: 7,5%',
      },
      {
        faixaNumero: 3,
        faixaInicial: 2826.66,
        faixaFinal: 3751.05,
        aliquota: 15.0,
        parcelaADeduzir: 394.16,
        observacao: 'De R$ 2.826,66 até R$ 3.751,05: 15,0%',
      },
      {
        faixaNumero: 4,
        faixaInicial: 3751.06,
        faixaFinal: 4664.68,
        aliquota: 22.5,
        parcelaADeduzir: 675.49,
        observacao: 'De R$ 3.751,06 até R$ 4.664,68: 22,5%',
      },
      {
        faixaNumero: 5,
        faixaInicial: 4664.69,
        faixaFinal: Infinity,
        aliquota: 27.5,
        parcelaADeduzir: 908.73,
        observacao: 'Acima de R$ 4.664,68: 27,5%',
      },
    ],
  },
  // Tabela Exclusiva para PLR - 2026
  {
    id: 'irrf_2026_plr',
    ano: 2026,
    vigenciaInicial: '2026-01-01',
    vigenciaFinal: '2026-12-31',
    tipoCalculo: 'plr',
    deducaoPorDependente: 0, // Não se aplica dedução por dependente no regime exclusivo de PLR
    observacoes: 'Tabela progressiva de tributação exclusiva na fonte da Participação nos Lucros e Resultados (PLR)',
    fonte: 'Lei Federal nº 10.101/2000 (art. 3º, § 5º) com redação da Lei nº 12.832/2013 e atualizações RFB',
    faixas: [
      {
        faixaNumero: 1,
        faixaInicial: 0,
        faixaFinal: 7640.80,
        aliquota: 0,
        parcelaADeduzir: 0,
        observacao: 'Isento até R$ 7.640,80',
      },
      {
        faixaNumero: 2,
        faixaInicial: 7640.81,
        faixaFinal: 9922.28,
        aliquota: 7.5,
        parcelaADeduzir: 573.06,
        observacao: 'De R$ 7.640,81 até R$ 9.922,28',
      },
      {
        faixaNumero: 3,
        faixaInicial: 9922.29,
        faixaFinal: 13167.00,
        aliquota: 15.0,
        parcelaADeduzir: 1317.23,
        observacao: 'De R$ 9.922,29 até R$ 13.167,00',
      },
      {
        faixaNumero: 4,
        faixaInicial: 13167.01,
        faixaFinal: 16380.38,
        aliquota: 22.5,
        parcelaADeduzir: 2304.76,
        observacao: 'De R$ 13.167,01 até R$ 16.380,38',
      },
      {
        faixaNumero: 5,
        faixaInicial: 16380.39,
        faixaFinal: Infinity,
        aliquota: 27.5,
        parcelaADeduzir: 3123.78,
        observacao: 'Acima de R$ 16.380,38',
      },
    ],
  },
  // Tabela Geral - 2025
  {
    id: 'irrf_2025_geral',
    ano: 2025,
    vigenciaInicial: '2025-01-01',
    vigenciaFinal: '2025-12-31',
    tipoCalculo: 'todos',
    deducaoPorDependente: 189.59,
    descontoSimplificadoMensal: 564.80,
    observacoes: 'Tabela progressiva mensal oficial do IRRF para o exercício de 2025',
    fonte: 'Lei nº 14.973/2024 / Medida Provisória nº 1.206/2024',
    faixas: [
      { faixaNumero: 1, faixaInicial: 0, faixaFinal: 2259.20, aliquota: 0, parcelaADeduzir: 0, observacao: 'Isento' },
      { faixaNumero: 2, faixaInicial: 2259.21, faixaFinal: 2826.65, aliquota: 7.5, parcelaADeduzir: 169.44 },
      { faixaNumero: 3, faixaInicial: 2826.66, faixaFinal: 3751.05, aliquota: 15.0, parcelaADeduzir: 381.44 },
      { faixaNumero: 4, faixaInicial: 3751.06, faixaFinal: 4664.68, aliquota: 22.5, parcelaADeduzir: 662.77 },
      { faixaNumero: 5, faixaInicial: 4664.69, faixaFinal: Infinity, aliquota: 27.5, parcelaADeduzir: 896.00 },
    ],
  },
  // Tabela Geral - 2024
  {
    id: 'irrf_2024_geral',
    ano: 2024,
    vigenciaInicial: '2024-02-01',
    vigenciaFinal: '2024-12-31',
    tipoCalculo: 'todos',
    deducaoPorDependente: 189.59,
    descontoSimplificadoMensal: 564.80,
    observacoes: 'Tabela progressiva mensal oficial do IRRF a partir de fevereiro/2024',
    fonte: 'Medida Provisória nº 1.206/2024 convertida na Lei nº 14.973/2024',
    faixas: [
      { faixaNumero: 1, faixaInicial: 0, faixaFinal: 2259.20, aliquota: 0, parcelaADeduzir: 0, observacao: 'Isento' },
      { faixaNumero: 2, faixaInicial: 2259.21, faixaFinal: 2826.65, aliquota: 7.5, parcelaADeduzir: 169.44 },
      { faixaNumero: 3, faixaInicial: 2826.66, faixaFinal: 3751.05, aliquota: 15.0, parcelaADeduzir: 381.44 },
      { faixaNumero: 4, faixaInicial: 3751.06, faixaFinal: 4664.68, aliquota: 22.5, parcelaADeduzir: 662.77 },
      { faixaNumero: 5, faixaInicial: 4664.69, faixaFinal: Infinity, aliquota: 27.5, parcelaADeduzir: 896.00 },
    ],
  },
];

/**
 * Busca a tabela oficial de IRRF estritamente correspondente ao Ano e Tipo de Cálculo informados.
 * Não inventa ou supõe tabelas sem cadastro explícito.
 */
export function findIrrfTable(ano: number, tipoCalculo: CalculationType): IrrfTable | null {
  // Procura por tabela específica para o tipo de cálculo (ex: PLR)
  const specific = OFFICIAL_IRRF_TABLES.find(
    (t) => t.ano === ano && t.tipoCalculo === tipoCalculo
  );
  if (specific) return specific;

  // Procura por tabela geral ('todos')
  const general = OFFICIAL_IRRF_TABLES.find(
    (t) => t.ano === ano && (t.tipoCalculo === 'todos' || !t.tipoCalculo)
  );
  return general || null;
}
