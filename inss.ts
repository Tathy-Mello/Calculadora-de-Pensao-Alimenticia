/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationType, RoundingPolicy } from './pension';

export interface InssBracket {
  faixaNumero: number;
  faixaInicial: number;
  faixaFinal: number;
  aliquota: number; // ex: 7.5, 9, 12, 14
  parcelaADeduzir?: number;
  observacao?: string;
}

export interface InssTable {
  id: string;
  ano: number;
  vigenciaInicial: string; // ex: "2026-01-01"
  vigenciaFinal: string;   // ex: "2026-12-31"
  tipoCalculo: CalculationType | 'todos';
  tetoPrevidenciario: number; // ex: R$ 8.712,11
  tetoMaximoContribuicao: number; // ex: R$ 1.016,35
  faixas: InssBracket[];
  observacao: string;
  fonte: string;
}

export interface InssBracketResult {
  faixaNumero: number;
  faixaInicial: number;
  faixaFinal: number;
  aliquota: number;
  baseConsideradaNaFaixa: number;
  contribuicaoDaFaixa: number;
}

export interface InssMemoryStep {
  stepNumber: number;
  title: string;
  description: string;
  details?: { label: string; value: string; extra?: string }[];
  formula?: string;
  resultHighlight?: string;
}

export interface InssCalculationResult {
  ano: number;
  competencia: string;
  tipoCalculo: CalculationType;
  tabelaUtilizada: InssTable;
  
  verbasInformadas: { label: string; valor: number; incideInss: boolean; observacao?: string }[];
  verbasComIncidencia: { label: string; valor: number; observacao?: string }[];
  verbasSemIncidencia: { label: string; valor: number; motivo: string }[];
  
  baseInssOriginal: number;
  limitePrevidenciarioAplicavel: number;
  baseInssEfetiva: number;
  tetoAplicado: boolean;
  motivoLimitacao?: string;
  
  faixasCalculadas: InssBracketResult[];
  
  valorAntesArredondamento: number;
  regraArredondamento: string;
  valorInssFinal: number;
  
  memorySteps: InssMemoryStep[];
  calculatedAt: string;
}
