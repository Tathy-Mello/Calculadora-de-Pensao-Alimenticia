/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalculationResultData,
  CalculationType,
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionBaseType,
  PensionRuleConfig,
  PensionRuleType,
  RoundingPolicy,
} from './pension';
import { IrrfDeductionsConfig } from './irrf';
import { ConferenciaSistemaInputs, DiagnosticoDivergencia } from './consolidation';

export type AppNavView =
  | 'inicio'
  | 'folha'
  | 'ferias'
  | 'decimo'
  | 'rescisao'
  | 'plr'
  | 'historico'
  | 'regras'
  | 'tabelas'
  | 'verbas'
  | 'configuracoes';

export type StatusCalculoHistorico =
  | 'calculado'  // 🟢 Calculado: dados válidos e apurados
  | 'atencao'    // 🟡 Atenção: avisos que não impedem cálculo
  | 'bloqueado'  // 🔴 Bloqueado: erro impeditivo ou dados ausentes
  | 'conferido'  // 🔵 Conferido: revisado pelo usuário
  | 'divergente'; // 🟠 Divergente: diferença acima da tolerância

export type NivelAlerta = 'info' | 'atencao' | 'erro';

export interface AlertaRico {
  id: string;
  nivel: NivelAlerta;
  campo: string;
  problema: string;
  causaConhecida: string;
  acaoRecomendada: string;
}

export type OrigemRegraAplicada = 'calculo' | 'modulo' | 'geral';

export interface GeneralSettings {
  // Configurações de Cálculo (Seção 5)
  casasDecimais: number;
  arredondamento: RoundingPolicy;
  formatoMonetario: 'BRL' | 'USD';
  separadorDecimal: 'virgula' | 'ponto';
  exibicaoPercentuais: 'duas_casas' | 'quatro_casas';

  // Configurações de Conferência (Seção 5)
  toleranciaReais: number; // ex: 0.00 ou configurável
  toleranciaPercentual: number; // ex: 0.1%
  casasComparacao: number; // ex: 2

  // Configurações de Memória (Seção 5)
  modoPadraoMemoria: 'resumido' | 'detalhado';
  exibirFormulas: boolean;
  exibirFontes: boolean;
}

export interface RegraPensaoCadastrada {
  id: string;
  nome: string;
  descricao: string;
  tipo: PensionRuleType;
  percentual: number;
  valorFixo: number;
  base: PensionBaseType;
  verbasIncluidasIds: string[];
  verbasExcluidasIds: string[];
  descontosPermitidosIds: string[];
  temMinimo: boolean;
  minimoValor: number;
  temMaximo: boolean;
  maximoValor: number;
  arredondamento: RoundingPolicy;
  observacoes?: string;
  status: 'ativa' | 'inativa';
  prioridade: 'padrao' | 'especifica';
  vinculacaoModulos: CalculationType[];
  dataCadastro: string;
  atualizadoEm: string;
}

export interface VerbaCadastrada {
  id: string;
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  natureza: 'salarial' | 'indenizatoria' | 'variavel' | 'beneficio' | 'outras';
  incideInss: boolean;
  incideIrrf: boolean;
  incidePensao: boolean;
  participaFerias: boolean;
  participaDecimo: boolean;
  participaRescisao: boolean;
  participaPlr: boolean;
  status: 'ativa' | 'inativa';
  observacao?: string;
}

export interface CalculoHistoricoCompleto {
  id: string; // Ex: "CALC-000001"
  versaoNumero: number;
  dataHora: string;
  modulo: CalculationType;
  moduloRotulo: string;
  matricula: string;
  ano: number;
  competencia: string;
  dataPagamento: string;
  statusCalculo: StatusCalculoHistorico;
  isSimulacao: boolean;

  // Entradas
  identification: IdentificationData;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  rule: PensionRuleConfig;
  irrfConfig: IrrfDeductionsConfig;

  // Regra e Origem
  regraNome: string;
  origemRegra: OrigemRegraAplicada;

  // Resultados
  totalProventos: number;
  baseInss: number;
  valorInss: number;
  baseIrrf: number;
  valorIrrf: number;
  basePensao: number;
  valorPensao: number;
  outrosDescontos: number;
  liquidoAposPensao: number;

  // Auditoria e Conferência
  conferencia?: ConferenciaSistemaInputs;
  diagnostico?: DiagnosticoDivergencia;
  conferidoPorUsuario: boolean;
  resultadoSnapshot: CalculationResultData;
}

export interface CanonicalImportField {
  campo: string;
  descricao: string;
  tipoDado: 'string' | 'number' | 'boolean' | 'date';
  exemplo: string;
  obrigatorio: boolean;
}
