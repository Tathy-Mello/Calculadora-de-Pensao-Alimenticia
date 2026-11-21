/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalculationType,
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionRuleConfig,
} from './pension';
import { IrrfDeductionsConfig } from './irrf';

export type StatusConferenciaEtapa =
  | 'OK'
  | 'DIVERGENTE'
  | 'NAO_INFORMADO'
  | 'DENTRO_DA_TOLERANCIA';

export interface ConferenciaSistemaInputs {
  ativo: boolean;
  proventosSistema?: number;
  inssSistema?: number;
  irrfSistema?: number;
  basePensaoSistema?: number;
  pensaoSistema?: number;
  liquidoSistema?: number;
  toleranciaCentavos: number; // R$ 0,00 ou tolerância definida pelo usuário
  baseInformadaDetalhada?: Record<string, number>;
  regraInformada?: {
    tipo?: 'percentual' | 'valor_fixo';
    percentual?: number;
    baseTipo?: string;
    verbasIncluidasTexto?: string;
    descontosTexto?: string;
  };
}

export interface EtapaConferenciaItem {
  id: string;
  etapaNumero: number;
  etapaNome: string;
  calculadora: number;
  informado?: number;
  diferenca?: number;
  diferencaPercentual?: number;
  tolerancia: number;
  status: StatusConferenciaEtapa;
  isFirstDivergence: boolean;
}

export type CategoriaDivergencia =
  | 'dados_entrada'
  | 'base_diferente'
  | 'incidencia_diferente'
  | 'regra_pensao_diferente'
  | 'tabela_diferente'
  | 'arredondamento'
  | 'valor_informado_incorreto'
  | 'inconclusivo';

export interface DiagnosticoDivergencia {
  temDivergencia: boolean;
  primeiraEtapaDivergente?: string;
  diferencaAbsoluta: number;
  diferencaPercentual?: number;
  categoriaProvavel: CategoriaDivergencia;
  categoriaTitulo: string;
  descricaoDiagnostico: string;
  possiveisMotivos: string[];
  pontosConferir: string[];
  fatoVsHipotese: {
    fatos: string[];
    hipoteses: string[];
  };
}

export interface ComparacaoBaseItem {
  componenteId: string;
  label: string;
  calculadora: number;
  informado?: number;
  diferenca: number;
  status: 'OK' | 'DIVERGENTE';
}

export interface ComparacaoRegraItem {
  campo: string;
  calculadora: string;
  informado: string;
  status: 'IGUAL' | 'REGRA_DIFERENTE';
}

export interface ConferenciaInversaResult {
  aplicavel: boolean;
  valorInformadoPensao: number;
  baseUtilizada: number;
  percentualEquivalente: number;
  explicacao: string;
}

export interface CenarioSimulado {
  id: string;
  nome: string;
  baseTipo: string;
  baseValor: number;
  percentual: number;
  pensaoCalculada: number;
  diferencaParaAtual: number;
}

export interface PadraoMemoriaEtapaDetalhe {
  label: string;
  value: string;
  extra?: string;
  badge?: string;
}

export interface PadraoMemoriaEtapa {
  numero: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  detalhes?: PadraoMemoriaEtapaDetalhe[];
  formula?: string;
  resultadoDestaque?: string;
  statusConferencia?: StatusConferenciaEtapa;
}

export interface SequenciaDependenciaItem {
  ordem: number;
  id: string;
  label: string;
  valorFormatado: string;
  tipo: 'entrada' | 'encargo' | 'base' | 'deducao' | 'resultado';
  observacao?: string;
}

export interface VersionRegistro {
  versionId: string; // Ex: "Cálculo #000001"
  timestamp: string;
  modulo: CalculationType;
  moduloRotulo: string;
  matricula: string;
  totalProventos: number;
  basePensao: number;
  valorPensao: number;
  liquidoAposPensao: number;
  statusGeral: string;
  temDivergencia: boolean;
}

export interface LogAlteracaoItem {
  id: string;
  timestamp: string;
  campoAlterado: string;
  valorAnterior: string;
  novoValor: string;
  acaoRealizada: string;
}

export type StatusExecutivoGeral =
  | 'OK'
  | 'DIVERGENCIA'
  | 'DADOS_INSUFICIENTES'
  | 'REGRA_NAO_CONFIGURADA'
  | 'ERRO_CALCULO';

export interface ResultadoExecutivoConsolidado {
  pensaoCalculada: number;
  statusGeral: StatusExecutivoGeral;
  statusRotulo: string;
  diferencaPura: number;
  temDivergencia: boolean;
  primeiraDivergenciaEtapa?: string;
  moduloRotulo: string;
  matricula: string;
  dataProcessamento: string;
  versaoConfiguracao: string;
}

export interface RelatorioConsolidacaoExportacao {
  versaoCalculo: string;
  dataHoraProcessamento: string;
  identificacao: IdentificationData;
  modulo: CalculationType;
  moduloRotulo: string;
  entradas: {
    salarioEVerbas: EarningItem[];
    descontosInformados: DeductionItem[];
    parametrosIrrf: IrrfDeductionsConfig;
  };
  regras: {
    regraPensao: PensionRuleConfig;
    origemRegra: string;
    tabelaInssUtilizada: string;
    tabelaIrrfUtilizada: string;
    arredondamento: string;
  };
  bases: {
    baseInss: number;
    baseIrrf: number;
    basePensao: number;
  };
  resultados: {
    totalBruto: number;
    inssCalculado: number;
    irrfCalculado: number;
    pensaoCalculada: number;
    outrosDescontos: number;
    liquidoFinal: number;
  };
  conferencia: {
    valoresInformados?: ConferenciaSistemaInputs;
    tabelaEtapas: EtapaConferenciaItem[];
    diagnostico?: DiagnosticoDivergencia;
    conferenciaInversa?: ConferenciaInversaResult;
  };
}
