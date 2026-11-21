/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InssCalculationResult, InssTable } from './inss';
import { IrrfCalculationResult, IrrfDeductionsConfig } from './irrf';

export type CalculationType = 
  | 'folha_mensal'
  | 'ferias'
  | 'decimo_terceiro'
  | 'rescisao'
  | 'plr';

export interface CalculationTypeOption {
  id: CalculationType;
  label: string;
  description: string;
}

export type PensionRuleType = 'percentual' | 'valor_fixo' | 'percentual_adicional';

export type PensionBaseType = 
  | 'bruta'
  | 'liquida'
  | 'apos_inss'
  | 'apos_inss_irrf'
  | 'personalizada';

export type RoundingPolicy = 'padrao_2dec' | 'truncamento_2dec';

// Tipos de Desligamento para Rescisão (Fase 8)
export type RescisaoTipoDesligamento =
  | 'dispensa_sem_justa_causa'
  | 'pedido_demissao'
  | 'dispensa_com_justa_causa'
  | 'termino_contrato'
  | 'termino_antecipado'
  | 'acordo_art_484a'
  | 'outros';

export type RescisaoTipoAviso = 'trabalhado' | 'indenizado' | 'nao_aplicavel';

export interface IdentificationData {
  matricula: string;
  ano: number;
  competencia: string;
  dataPagamento: string;
  tipoCalculo: CalculationType;

  // Parâmetros de Férias (Fase 6 + Rateio de INSS em Férias Partidas)
  periodoAquisitivoOuReferencia?: string;
  dataInicioFerias?: string;
  diasFerias?: number; // Quantidade de dias de férias (ex: 30, 20, 15, 10)
  ativarRateioInssFerias?: boolean; // Quando true e férias cruzam meses, calcula INSS no recibo apenas proporcional ao mês de início
  remuneracaoTrabalhadaMes1Ferias?: number; // Opcional: saldo de salário/remuneração do mês 1 se desejar compor na simulação
  remuneracaoTrabalhadaMes2Ferias?: number; // Opcional: remuneração trabalhada na folha do mês seguinte para recálculo do INSS

  // Parâmetros de Rescisão (Fase 8)
  dataAdmissao?: string;
  dataDesligamento?: string;
  tipoDesligamento?: RescisaoTipoDesligamento;
  motivoDesligamento?: string;
  tipoAvisoPrevio?: RescisaoTipoAviso;
  diasTrabalhadosMesRescisao?: number;
  diasAvisoPrevio?: number;
  observacoesRescisao?: string;
  valorPensaoEsperada?: number; // Comparação com valor informado (Seção 19)

  // Parâmetros de PLR (Fase 9)
  periodoReferenciaPlr?: string;
  tipoCalculoPlr?: PlrTipoCalculo;
  numeroParcelaPlr?: string;
  observacoesPlr?: string;
  plrSistemaFolha?: {
    ativo?: boolean;
    plrBruta?: number;
    inss?: number;
    irrf?: number;
    pensao?: number;
    liquido?: number;
  };
}

export interface EarningItem {
  id: string;
  label: string;
  value: number;
  includedInPensionBase: boolean;
  observation?: string;
  isCustom?: boolean;
  categoria?:
    | 'salario'
    | 'hora_extra'
    | 'adicional'
    | 'comissao'
    | 'gratificacao'
    | 'outras'
    | 'media_hora_extra'
    | 'media_adicional'
    | 'media_comissao'
    | 'outras_medias'
    | 'um_terco'
    | 'abono'
    | 'um_terco_abono';

  // Parâmetros de Férias (Fase 6)
  participaRemuneracaoFerias?: boolean; // Participa da remuneração base das férias?
  geraUmTerco?: boolean; // Compõe a base de cálculo do 1/3 constitucional?
  
  // Parâmetros de Rescisão (Fase 8)
  compoeFerias?: boolean;
  compoeDecimo?: boolean;
  compoeAviso?: boolean;
  tipoVerbaRescisao?: 'saldo_salario' | 'aviso_previo' | 'ferias_vencidas' | 'ferias_proporcionais' | 'um_terco' | 'decimo_proporcional' | 'outras';

  // Parâmetros de PLR (Fase 9)
  tipoVerbaPlr?: 'parcela_base' | 'resultado_meta' | 'proporcionalidade' | 'outros';
  participaPlr?: boolean;

  // Incidência de INSS (Fase 3)
  incideInss?: boolean | null;
  inssObservation?: string;

  // Tributação de IRRF (Fase 4)
  incideIrrf?: boolean | null; // null = não definida
  irrfObservation?: string;
}

export interface DeductionItem {
  id: string;
  label: string;
  value: number;
  deductFromPensionBase: boolean; // Participa do cálculo da pensão?
  order: number;
  observation?: string;
  isCustom?: boolean;

  // Parâmetros Fase 5 (Outros Descontos)
  deduzDoLiquido?: boolean; // Deduz do líquido? Sim/Não (padrão true)
  deduzDoIrrf?: boolean;    // Participa do cálculo do IRRF (dedução legal permitida)? Sim/Não
}

export interface PensionBeneficiaryItem {
  id: string;
  label: string;
  percentual: number;
  valorFixo: number;
}

export interface PensionBeneficiaryResultItem {
  id: string;
  label: string;
  percentual?: number;
  valorFixo?: number;
  baseAplicada: number;
  valorAntesArredondamento: number;
  valorCalculado: number;
}

export interface PensionBeneficiarySplitResumo {
  ativo: boolean;
  eventoUnicoFolha: boolean;
  rotuloEventoFolha: string;
  quantidadeBeneficiarios: number;
  somaPercentuais?: number;
  somaValoresFixos?: number;
  beneficiarios: PensionBeneficiaryResultItem[];
  somaAntesArredondamento: number;
  totalConsolidadoFolha: number;
  valorCalculoUnicoReferencia: number;
  diferencaArredondamento: number;
}

export interface PensionRuleConfig {
  ruleType: PensionRuleType;
  percentage: number;
  fixedValue: number;
  additionalValue?: number;
  baseType: PensionBaseType;
  
  // Regra de Valor Mínimo (Fase 2)
  hasMinimum: boolean;
  minimumValue: number;
  
  // Regra de Teto / Limite Máximo (Fase 2)
  hasMaximum: boolean;
  maximumValue: number;
  
  // Arredondamento
  roundingPolicy: RoundingPolicy;
  
  // Conexão com INSS Calculado (Fase 3)
  deduzirInssCalculado?: boolean;

  // Origem da regra para Rescisão (Fase 8)
  origemRegraRescisao?: 'geral' | 'especifica';

  // Origem da regra para PLR (Fase 9)
  origemRegraPlr?: 'geral' | 'especifica';

  // Rateio por beneficiário (cálculo separado consolidado em 1 evento único na folha)
  rateioBeneficiariosAtivo?: boolean;
  eventoUnicoFolha?: boolean;
  beneficiarios?: PensionBeneficiaryItem[];
}

export interface CalculationMemoryStep {
  stepNumber: number;
  title: string;
  description: string;
  formula?: string;
  details?: { label: string; value: string; extra?: string }[];
  resultHighlight?: string;
}

export interface CalculationAuditLog {
  id: string;
  tipoCalculo: CalculationType;
  tipoCalculoRotulo: string;
  regraTexto: string;
  ruleType: PensionRuleType;
  percentual?: number;
  baseSelecionada: PensionBaseType;
  verbasIncluidas: { label: string; valor: number; observacao?: string }[];
  verbasExcluidas: { label: string; valor: number; observacao?: string }[];
  deducoes: { label: string; valor: number; deduz: boolean; ordem: number; observacao?: string }[];
  basePensao: number;
  valorAntesArredondamento: number;
  regraArredondamento: string;
  valorPensao: number;
  minimoAplicado: boolean;
  tetoAplicado: boolean;
  totalProventos: number;
  liquidoAposPensao: number;
  calculatedAt: string;
}

export interface ResumoEncargos {
  baseInss: number;
  valorInss: number;
  inssStatus: 'calculado' | 'isento' | 'pendente';
  
  baseIrrf: number;
  valorIrrf: number;
  irrfStatus: 'calculado' | 'isento' | 'pendente';
  
  basePensao: number;
  valorPensao: number;

  totalEncargos: number;
  liquidoFinal: number;
}

export interface ProventosComposicao {
  salario: number;
  horasExtras: number;
  adicionais: number;
  outras: number;
  total: number;
}

export interface FeriasResumoProventos {
  remuneracaoConsiderada: number; // Remuneração base mensal considerada
  diasGozados: number;
  remuneracaoFerias: number; // Proporcional aos dias de férias: (Base ÷ 30) × Dias
  baseUmTerco: number; // Base sobre a qual incide 1/3
  umTercoConstitucional: number; // 1/3 da remuneração de férias
  abonoPecuniario: number; // Abono pecuniário (se houver venda de dias)
  umTercoAbono: number; // 1/3 do abono pecuniário
  outrasVerbas: number;
  totalBrutoFerias: number;
}

export interface FeriasRateioInssResumo {
  ativo: boolean;
  dataInicio: string; // DD/MM/AAAA
  dataFim: string;    // DD/MM/AAAA
  totalDiasFerias: number;

  competencia1Rotulo: string; // ex: "12/2026"
  competencia1Nome: string;   // ex: "Dezembro/2026"
  diasMes1: number;
  proporcaoMes1: number; // 0..1

  competencia2Rotulo: string; // ex: "01/2027"
  competencia2Nome: string;   // ex: "Janeiro/2027"
  diasMes2: number;
  proporcaoMes2: number; // 0..1

  baseInssTotalFerias: number;
  inssIntegralReferencia: number; // Quanto seria o INSS se cobrado integral no recibo

  baseInssFeriasMes1: number;
  remuneracaoTrabalhadaMes1: number;
  baseTotalInssMes1: number;
  inssNoReciboMes1: number;
  tabelaMes1Ano: number;

  baseInssFeriasMes2: number;
  remuneracaoTrabalhadaMes2: number;
  baseTotalInssMes2: number;
  inssRecalculadoMes2: number;
  tetoAplicadoMes2: boolean;
  faixasMes2: import('./inss').InssBracketResult[];
  tabelaMes2Ano: number;
  tabelaMes2Provisoria: boolean;
  tabelaMes2Observacao: string;

  diferencaInssReciboVsCheio: number; // INSS diferido do recibo para a folha seguinte
  inssTotalCombinadoDoisMeses: number;
  notaImpactoPensao: string;
}

// Configurações Específicas de Rescisão (Fase 8)
export interface RescisaoSaldoSalarioConfig {
  salarioMensal: number;
  diasTrabalhados: number;
  divisor: number; // ex: 30
  outrasParcelas: number;
  valorCalculado: number;
}

export interface RescisaoAvisoPrevioConfig {
  tipo: RescisaoTipoAviso;
  dias: number;
  baseCalculo: number;
  divisor: number; // ex: 30
  valorCalculado: number;
  incideInss: boolean;
  incideIrrf: boolean;
  incidePensao: boolean;
}

export interface RescisaoFeriasVencidasItem {
  possui: boolean;
  periodos: number;
  dias: number;
  remuneracao: number;
  umTerco: number;
  valorTotal: number;
  incideInss: boolean;
  incideIrrf: boolean;
  incidePensao: boolean;
}

export interface RescisaoFeriasProporcionaisItem {
  possui: boolean;
  avos: number;
  baseCalculo: number;
  valorProporcional: number;
  umTerco: number;
  valorTotal: number;
  incideInss: boolean;
  incideIrrf: boolean;
  incidePensao: boolean;
}

export interface RescisaoDecimoConfig {
  avos: number;
  baseCalculo: number;
  valorCalculado: number;
  incideInss: boolean;
  incideIrrf: boolean;
  incidePensao: boolean;
}

export interface RescisaoMediaItem {
  id: string;
  descricao: string;
  periodo: string;
  quantidade: number;
  valor: number;
  metodologia: string;
  verbaRelacionada: string;
  participaFerias: boolean;
  participaDecimo: boolean;
  participaAviso: boolean;
  participaPensao: boolean;
  observacao?: string;
}

export interface RescisaoResumo {
  tipoDesligamento: RescisaoTipoDesligamento;
  tipoDesligamentoRotulo: string;
  dataAdmissao?: string;
  dataDesligamento?: string;
  dataPagamento?: string;
  saldoSalario: number;
  avisoPrevio: number;
  feriasVencidas: number;
  feriasProporcionais: number;
  umTercoFerias: number;
  decimoProporcional: number;
  outrasVerbas: number;
  totalBruto: number;
  valorInss: number; // INSS_RESCISAO_CALCULADO
  baseIrrf: number;
  valorIrrf: number; // IRRF_RESCISAO_CALCULADO
  basePensao: number;
  valorPensao: number;
  outrosDescontos: number;
  valorLiquido: number;
  pensaoInformada?: number;
  diferencaPensao?: number;
  possuiDivergenciaPensao?: boolean;
}

export interface PlrCriterioItem {
  id: string;
  indicador: string;
  peso: number;
  meta: string;
  resultadoAlcancado: number; // percentual (ex: 100)
  valorAtribuido: number;
  observacao?: string;
}

export type PlrTipoCalculo = 'integral' | 'proporcional' | 'simulacao' | 'conferencia';

export type PlrFormaCalculo =
  | 'valor_informado'
  | 'percentual_base'
  | 'formula_personalizada'
  | 'criterios_indicadores'
  | 'calculo_proporcional'
  | 'regra_cadastrada';

export interface PlrRegraConfig {
  formaCalculo: PlrFormaCalculo;
  descricaoRegra: string;
  periodoApuracao: string;
  periodoReferencia: string;
  valorBrutoInformado: number;
  baseCalculoPercentual: number;
  percentualSobreBase: number;
  criteriosMetas: PlrCriterioItem[];
  possuiMinimo: boolean;
  valorMinimo: number;
  possuiMaximo: boolean;
  valorMaximo: number;
  mesesTrabalhados: number;
  totalMesesAno: number;
  fatorProporcionalidade: number;
  formulaPersonalizadaTexto?: string;
  valorCalculadoRegra: number;
}

export interface PlrParcelamentoConfig {
  modalidade: 'unica' | 'duas' | 'multiplas';
  quantidadeParcelas: number;
  parcelaAtual: number;
  valorJaPago: number;
  valorParcelaAtual: number;
  saldoRestante: number;
}

export interface PlrComparacaoSistema {
  ativo: boolean;
  plrBrutaSistema: number;
  inssSistema: number;
  irrfSistema: number;
  pensaoSistema: number;
  liquidoSistema: number;
  diferencas: {
    plrBruta: number;
    inss: number;
    irrf: number;
    pensao: number;
    liquido: number;
  };
  possuiDivergencia: boolean;
  pontosConferencia: string[];
}

export interface PlrResumo {
  tipoCalculo: PlrTipoCalculo;
  tipoCalculoRotulo: string;
  periodoReferencia: string;
  dataPagamento: string;
  numeroParcelaRotulo: string;
  regraUtilizada: string;
  formaCalculoRotulo: string;
  plrBrutaTotal: number;
  valoresAnteriormentePagos: number;
  plrParcelaAtual: number;
  valorInss: number; // INSS_PLR_CALCULADO
  baseIrrf: number;
  valorIrrf: number; // IRRF_PLR_CALCULADO
  basePensao: number;
  valorPensao: number;
  outrosDescontos: number;
  valorLiquido: number;
  comparacaoSistema?: PlrComparacaoSistema;
}

export interface CalculationResultData {
  totalProventos: number;
  composicaoProventos?: ProventosComposicao;
  feriasResumo?: FeriasResumoProventos;
  feriasRateioInss?: FeriasRateioInssResumo;
  rescisaoResumo?: RescisaoResumo;
  plrResumo?: PlrResumo;
  baseInss: number;
  valorInss: number; // INSS_CALCULADO
  inssDisponivelParaIrrf: number; // INSS_DISPONIVEL_PARA_IRRF
  
  baseIrrf: number;
  valorIrrf: number; // IRRF_CALCULADO
  outrosDescontos: number;
  totalDescontosSemPensao: number;
  
  verbasConsideradasNaBase: EarningItem[];
  verbasExcluidasDaBase: EarningItem[];
  deducoesAutorizadasNaBase: DeductionItem[];
  
  basePensao: number;
  regraTexto: string;
  valorAntesArredondamento: number;
  valorPensao: number;
  totalDescontosComPensao: number;
  liquidoAposPensao: number;
  rateioBeneficiarios?: PensionBeneficiarySplitResumo;
  
  minimoAplicado: boolean;
  tetoAplicado: boolean;
  
  memorySteps: CalculationMemoryStep[];
  auditLog: CalculationAuditLog;
  
  // Motores Integrados (Fases 3 e 4)
  inssResult?: InssCalculationResult | null;
  irrfResult?: IrrfCalculationResult | null;
  resumoEncargos: ResumoEncargos;
  
  calculatedAt: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface TypeSpecificProfile {
  pensionRule: PensionRuleConfig;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  irrfConfig: IrrfDeductionsConfig;
  regraEspecificaFeriasAtiva?: boolean;
  regraEspecificaRescisaoAtiva?: boolean;
  regraEspecificaPlrAtiva?: boolean;
  rescisaoMedias?: RescisaoMediaItem[];
  rescisaoSaldoSalario?: RescisaoSaldoSalarioConfig;
  rescisaoAvisoPrevio?: RescisaoAvisoPrevioConfig;
  rescisaoFeriasVencidas?: RescisaoFeriasVencidasItem;
  rescisaoFeriasProporcionais?: RescisaoFeriasProporcionaisItem;
  rescisaoDecimo?: RescisaoDecimoConfig;
  plrRegraConfig?: PlrRegraConfig;
  plrParcelamento?: PlrParcelamentoConfig;
}
