/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationType, RoundingPolicy } from './pension';

export interface IrrfBracket {
  faixaNumero: number;
  faixaInicial: number;
  faixaFinal: number; // 0 ou Infinity para última faixa
  aliquota: number; // 0, 7.5, 15, 22.5, 27.5
  parcelaADeduzir: number;
  observacao?: string;
}

export interface RedutorAdicionalConfig {
  ativo: boolean;
  limiteIsencaoTotal: number; // 5000.00
  valorReducaoFixa: number; // 312.89
  limiteReducaoGradual: number; // 7350.00
  constanteFormula: number; // 978.61
  fatorFormula: number; // 0.133145
}

export interface IrrfTable {
  id: string;
  ano: number;
  vigenciaInicial: string;
  vigenciaFinal: string;
  tipoCalculo: CalculationType | 'todos';
  deducaoPorDependente: number; // e.g. 189.59
  descontoSimplificadoMensal?: number; // e.g. 607.20
  faixas: IrrfBracket[];
  redutorAdicional?: RedutorAdicionalConfig;
  observacoes: string;
  fonte: string;
}

export type CircularCalculationOrder = 
  | 'simultaneo_algebrico' // Cálculo Simultâneo / Algébrico Oficial (Padrão dos Tribunais e Sistemas de Folha)
  | 'pensao_antes_irrf' // Pensão apurada primeiro; IRRF deduz a pensão
  | 'irrf_antes_pensao'; // IRRF apurado primeiro; Pensão deduz o IRRF

export interface IrrfDeductionsConfig {
  deduzirInss: boolean;
  deduzirDependentes: boolean;
  quantidadeDependentes: number;
  deduzirPensao: boolean;
  usarPensaoCalculadaPeloMotor: boolean;
  valorPensaoManual?: number;
  deduzirOutras: boolean;
  outrasDeducoesValor: number;
  outrasDeducoesDescricao?: string;
  ordemCalculoCircular?: CircularCalculationOrder;
}

export interface IrrfMemoryStep {
  stepNumber: number;
  title: string;
  description: string;
  details?: { label: string; value: string; extra?: string }[];
  formula?: string;
  resultHighlight?: string;
}

export interface IrrfCalculationResult {
  ano: number;
  competencia: string;
  tipoCalculo: CalculationType;
  tabelaUtilizada: IrrfTable;

  rendimentosTributaveis: number;
  verbasTributaveis: { label: string; valor: number; observacao?: string }[];
  verbasNaoTributaveis: { label: string; valor: number; motivo: string }[];

  deducoes: {
    inss: number;
    dependentes: { quantidade: number; valorUnitario: number; total: number };
    pensaoAlimenticia: number;
    outrasDeducoes: number;
    totalDeducoes: number;
  };

  baseIrrf: number;
  faixaAplicada: IrrfBracket;
  aliquotaAplicada: number;
  parcelaDeduzirAplicada: number;

  valorCalculadoAntesArredondamento: number;
  valorImpostoAntesRedutor?: number;
  valorRedutorAplicado?: number;
  regraArredondamento: string;
  valorIrrfFinal: number;

  memorySteps: IrrfMemoryStep[];
  calculatedAt: string;
}
