/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalculationResultData,
  CalculationType,
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionRuleConfig,
} from '../types/pension';
import { IrrfDeductionsConfig } from '../types/irrf';
import {
  CenarioSimulado,
  ConferenciaSistemaInputs,
  DiagnosticoDivergencia,
  EtapaConferenciaItem,
  LogAlteracaoItem,
  PadraoMemoriaEtapa,
  RelatorioConsolidacaoExportacao,
  ResultadoExecutivoConsolidado,
  SequenciaDependenciaItem,
  VersionRegistro,
} from '../types/consolidation';
import {
  buildBaseComparison,
  buildConferenceStages,
  buildDivergenceDiagnosis,
  buildDynamicSequence,
  buildExportPayload,
  buildExecutiveSummary,
  buildRuleComparison,
  buildStandard12StepMemory,
  calculateInverseConference,
  simulateScenarios,
} from '../utils/consolidationEngine';
import { formatBRL, parseBRLInput } from '../utils/formatters';
import {
  ShieldCheck,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  History,
  Activity,
  ArrowRight,
  HelpCircle,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';

interface ConsolidationSectionProps {
  result: CalculationResultData;
  identification: IdentificationData;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  rule: PensionRuleConfig;
  irrfConfig: IrrfDeductionsConfig;
  versionsHistory: VersionRegistro[];
  auditLogs: LogAlteracaoItem[];
  onRestoreVersion?: (version: VersionRegistro) => void;
}

export const ConsolidationSection: React.FC<ConsolidationSectionProps> = ({
  result,
  identification,
  earnings,
  deductions,
  rule,
  irrfConfig,
  versionsHistory,
  auditLogs,
  onRestoreVersion,
}) => {
  // Estado da Conferência Externa
  const [conferenceInputs, setConferenceInputs] = useState<ConferenciaSistemaInputs>({
    ativo: false,
    proventosSistema: undefined,
    inssSistema: undefined,
    irrfSistema: undefined,
    basePensaoSistema: undefined,
    pensaoSistema: undefined,
    liquidoSistema: undefined,
    toleranciaCentavos: 0.0,
    baseInformadaDetalhada: {},
    regraInformada: {
      tipo: rule.ruleType === 'valor_fixo' ? 'valor_fixo' : 'percentual',
      percentual: rule.percentage,
      baseTipo: rule.baseType,
    },
  });

  // Modo de Exibição (Seção 25): 'resumido' vs 'detalhado'
  const [displayMode, setDisplayMode] = useState<'resumido' | 'detalhado'>('detalhado');

  // Abas de Auditoria Especializada
  const [activeTab, setActiveTab] = useState<
    'memoria12' | 'conferencia' | 'bases' | 'regras' | 'inversa' | 'simulacoes' | 'versoes' | 'logs'
  >('memoria12');

  // Estado para copiar payload
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Cenário de simulação customizado
  const [customPctSim, setCustomPctSim] = useState<number>(25);

  // Cálculos da Camada de Consolidação
  const sequenceItems = buildDynamicSequence(result, rule, irrfConfig);
  const { etapas: conferenceStages, primeiraDivergencia } = buildConferenceStages(
    result,
    conferenceInputs
  );
  const diagnosis = buildDivergenceDiagnosis(
    result,
    conferenceInputs,
    primeiraDivergencia,
    conferenceStages
  );
  const baseComparison = buildBaseComparison(earnings, conferenceInputs.baseInformadaDetalhada);
  const ruleComparison = buildRuleComparison(
    rule,
    earnings,
    deductions,
    conferenceInputs.ativo ? conferenceInputs.regraInformada : undefined
  );
  const inverseResult = calculateInverseConference(result, conferenceInputs);
  const scenarios = simulateScenarios(result, earnings, deductions);
  const standard12Steps = buildStandard12StepMemory(
    result,
    identification,
    earnings,
    deductions,
    rule,
    irrfConfig,
    conferenceInputs,
    diagnosis
  );
  const executive = buildExecutiveSummary(result, identification, conferenceInputs, diagnosis);

  const handleUpdateConferenceField = (field: keyof ConferenciaSistemaInputs, value: any) => {
    setConferenceInputs((prev) => ({
      ...prev,
      ativo: true,
      [field]: value,
    }));
  };

  const handleUpdateBaseInformada = (componenteId: string, value: number) => {
    setConferenceInputs((prev) => ({
      ...prev,
      ativo: true,
      baseInformadaDetalhada: {
        ...(prev.baseInformadaDetalhada || {}),
        [componenteId]: value,
      },
    }));
  };

  const handleCopyExportDossier = () => {
    const payload = buildExportPayload(
      result,
      identification,
      earnings,
      deductions,
      rule,
      irrfConfig,
      conferenceStages,
      conferenceInputs,
      diagnosis,
      inverseResult
    );
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  return (
    <div id="painel-consolidacao" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
      {/* 1. CABEÇALHO OFICIAL DE IDENTIFICAÇÃO (Seção 4) */}
      <div className="p-5 border-b border-slate-200 bg-slate-900 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Fase 10 · Auditoria Central
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {executive.versaoConfiguracao}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Consolidação, Memória e Conferência dos Cálculos</span>
            </h2>
            <p className="text-xs text-slate-300">
              Rastreabilidade total das etapas, fórmulas, dependências e auditoria comparativa com tolerância configurável.
            </p>
          </div>

          {/* Dados de Identificação (Seção 4 - Strict LGPD: sem nome ou CPF) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-800/80 p-3 rounded-lg border border-slate-700/80 text-xs font-mono">
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Módulo:</span>
              <span className="font-semibold text-white truncate block">{executive.moduloRotulo}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Matrícula:</span>
              <span className="font-semibold text-emerald-400 truncate block">{executive.matricula}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Ano/Comp.:</span>
              <span className="font-semibold text-white">{identification.ano} · {identification.competencia}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block uppercase">Pagamento:</span>
              <span className="font-semibold text-white">{identification.dataPagamento || '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CARD DE RESULTADO EXECUTIVO (Seção 24) */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card: Pensão Calculada */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Pensão Calculada
            </span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
              {formatBRL(executive.pensaoCalculada)}
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              Regra: {result.regraTexto}
            </span>
          </div>

          {/* Card: Status da Auditoria */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Status da Auditoria
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {executive.temDivergencia ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className={`text-sm font-bold truncate ${executive.temDivergencia ? 'text-amber-800' : 'text-emerald-800'}`}>
                {executive.statusRotulo}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {conferenceInputs.ativo ? 'Conferência ativa vs Sistema' : 'Modo calculadora autônomo'}
            </span>
          </div>

          {/* Card: Diferença Apurada */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Diferença Apurada
            </span>
            <div className={`text-xl font-bold font-mono mt-1 ${executive.temDivergencia ? 'text-amber-600' : 'text-slate-800'}`}>
              {formatBRL(executive.diferencaPura)}
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Tolerância aceita: {formatBRL(conferenceInputs.toleranciaCentavos)}
            </span>
          </div>

          {/* Card: Primeira Divergência */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Primeira Divergência
            </span>
            <div className="text-sm font-bold font-mono text-slate-900 mt-1 truncate">
              {executive.primeiraDivergenciaEtapa || 'Nenhuma detectada'}
            </div>
            <span className="text-[10px] text-slate-500 block truncate mt-0.5">
              {executive.temDivergencia ? 'Isolada na cadeia de cálculo' : 'Fluxo 100% convergente'}
            </span>
          </div>
        </div>

        {/* Barra de Modos de Visualização e Ações Rápidas (Seção 25) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setDisplayMode('resumido')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'resumido'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modo Resumido
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('detalhado')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'detalhado'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modo Detalhado (12 Etapas)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyExportDossier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Copiar estrutura completa de dados em JSON para futura exportação"
            >
              {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copiedPayload ? 'Dossiê Copiado!' : 'Copiar Dossiê de Auditoria (JSON)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. FLUXO VISUAL: SEQUÊNCIA DE DEPENDÊNCIAS DINÂMICA (Seção 11) */}
      <div className="p-4 bg-slate-100/50 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Activity className="w-4 h-4 text-slate-600" />
            <span>Sequência de Dependências Dinâmica da Modalidade</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            Ordem de execução real respeitando interdependências
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 py-1">
          {sequenceItems.map((seq, idx) => (
            <React.Fragment key={seq.id}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-white shadow-2xs text-xs">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold">
                  {seq.ordem}
                </span>
                <span className="font-semibold text-slate-800">{seq.label}:</span>
                <span className="font-mono font-bold text-slate-900">{seq.valorFormatado}</span>
              </div>
              {idx < sequenceItems.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 4. BARRA DE NAVEGAÇÃO DE ABAS DE AUDITORIA */}
      <div className="flex border-b border-slate-200 bg-slate-50 px-4 overflow-x-auto gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('memoria12')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'memoria12'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Memória Padronizada (12 Etapas)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('conferencia')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'conferencia'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Conferência por Etapa & Tolerância
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bases')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'bases'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Comparar Bases
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('regras')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'regras'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Comparar Regras
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inversa')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'inversa'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Conferência Inversa
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simulacoes')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'simulacoes'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Cenários de Simulação
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('versoes')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'versoes'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Versões ({versionsHistory.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap cursor-pointer transition-all ${
            activeTab === 'logs'
              ? 'border-slate-900 text-slate-900 bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Log de Alterações ({auditLogs.length})
        </button>
      </div>

      {/* 5. CONTEÚDO DAS ABAS */}
      <div className="p-5">
        {/* ABA 1: MEMÓRIA PADRONIZADA EM 12 ETAPAS (Seção 3) */}
        {activeTab === 'memoria12' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Memória de Cálculo Padronizada em 12 Etapas
                </h3>
                <p className="text-xs text-slate-500">
                  Estrutura oficial obrigatória de auditoria: entradas, regras, verbas, bases e apurações
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {displayMode === 'resumido' ? 'Visão Sintética' : 'Visão Analítica Completa'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {standard12Steps
                .filter((st) => (displayMode === 'resumido' ? [1, 2, 8, 9, 11, 12].includes(st.numero) : true))
                .map((step) => (
                  <div
                    key={step.numero}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                            {step.numero}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            {step.titulo}
                          </h4>
                          {step.statusConferencia && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              step.statusConferencia === 'OK'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {step.statusConferencia}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 ml-7">
                          {step.subtitulo} · {step.descricao}
                        </p>
                      </div>

                      {step.resultadoDestaque && (
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs block">
                            {step.resultadoDestaque}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Detalhes da Etapa */}
                    {step.detalhes && step.detalhes.length > 0 && (
                      <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
                        {step.detalhes.map((d, i) => (
                          <div key={i} className="p-2 bg-white rounded border border-slate-200/80 text-[11px] space-y-0.5">
                            <div className="flex justify-between items-center text-slate-500">
                              <span>{d.label}</span>
                              {d.badge && (
                                <span className="text-[9px] bg-slate-100 px-1 rounded text-slate-600 font-semibold">
                                  {d.badge}
                                </span>
                              )}
                            </div>
                            <div className="font-mono font-bold text-slate-800 tabular-nums">
                              {d.value}
                            </div>
                            {d.extra && <div className="text-[10px] text-slate-400 italic">{d.extra}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Fórmula Operacional */}
                    {step.formula && (
                      <div className="ml-7 p-2 rounded bg-slate-100/90 border border-slate-200 text-[11px] font-mono text-slate-700">
                        <span className="text-slate-400 block text-[10px] uppercase font-sans font-semibold">Operação / Fórmula:</span>
                        <span className="whitespace-pre-line leading-relaxed block">{step.formula}</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ABA 2: CONFERÊNCIA POR ETAPA & TOLERÂNCIA (Seções 12, 13, 14, 15, 16 e 17) */}
        {activeTab === 'conferencia' && (
          <div className="space-y-6">
            {/* Seção de Entrada dos Valores do Sistema de Folha */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-slate-700" />
                    <span>Informar Valores do Sistema de Folha para Conferência</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Insira os valores processados na sua folha externa para apuração de divergências etapa a etapa
                  </p>
                </div>

                {/* Tolerância Configurável (Seção 13) */}
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                    Tolerância aceitável:
                  </span>
                  <div className="relative w-24">
                    <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-xs text-slate-400">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={conferenceInputs.toleranciaCentavos}
                      onChange={(e) => handleUpdateConferenceField('toleranciaCentavos', parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-0.5 text-xs font-mono font-bold border border-slate-300 rounded focus:border-slate-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Inputs de Conferência */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Proventos Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.proventosSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('proventosSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    INSS Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.inssSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('inssSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    IRRF Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.irrfSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('irrfSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Base Pensão Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.basePensaoSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('basePensaoSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-800 uppercase block mb-1">
                    Pensão Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.pensaoSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('pensaoSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono font-bold border border-emerald-300 bg-emerald-50/40 rounded focus:border-emerald-600 focus:outline-hidden text-emerald-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                    Líquido Sistema
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="R$ 0,00"
                    value={conferenceInputs.liquidoSistema ?? ''}
                    onChange={(e) => handleUpdateConferenceField('liquidoSistema', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Tabela de Conferência por Etapa (Seção 16) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Tabela Comparativa por Etapa
                </span>
                <span className="text-[11px] text-slate-500">
                  Destaque automático da 1ª divergência na cadeia causal
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                        Etapa
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        Calculadora
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        Informado
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        Diferença
                      </th>
                      <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900">
                        Status da Etapa
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {conferenceStages.map((st) => (
                      <tr
                        key={st.id}
                        className={`transition-colors ${
                          st.isFirstDivergence
                            ? 'bg-amber-50/80 font-bold'
                            : st.status === 'DIVERGENTE'
                            ? 'bg-rose-50/40'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-3 font-sans text-slate-800 flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] flex items-center justify-center font-bold">
                            {st.etapaNumero}
                          </span>
                          <span>{st.etapaNome}</span>
                          {st.isFirstDivergence && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-600 text-white font-bold uppercase">
                              1ª Divergência
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                          {formatBRL(st.calculadora)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-700 tabular-nums">
                          {st.informado !== undefined ? formatBRL(st.informado) : '—'}
                        </td>
                        <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                          st.status === 'DIVERGENTE'
                            ? 'text-amber-700'
                            : st.status === 'DENTRO_DA_TOLERANCIA'
                            ? 'text-indigo-700'
                            : 'text-emerald-700'
                        }`}>
                          {st.diferenca !== undefined ? formatBRL(st.diferenca) : '—'}
                          {st.diferencaPercentual !== undefined && (
                            <span className="text-[10px] text-slate-500 font-normal ml-1">
                              ({st.diferencaPercentual}%)
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right font-sans">
                          {st.status === 'OK' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>OK</span>
                            </span>
                          )}
                          {st.status === 'DENTRO_DA_TOLERANCIA' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">
                              <span>Na Tolerância</span>
                            </span>
                          )}
                          {st.status === 'DIVERGENTE' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Divergente</span>
                            </span>
                          )}
                          {st.status === 'NAO_INFORMADO' && (
                            <span className="text-[11px] text-slate-400 italic">Não informado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO DE DIAGNÓSTICO E FATOS VS HIPÓTESES (Seções 14, 15 e 17) */}
            {diagnosis.temDivergencia && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-amber-950">
                        Diagnóstico da Divergência: {diagnosis.categoriaTitulo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                        Etapa: {diagnosis.primeiraEtapaDivergente}
                      </span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      {diagnosis.descricaoDiagnostico}
                    </p>
                  </div>
                </div>

                {/* Fatos vs Hipóteses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/80 text-xs">
                  <div className="p-3 bg-white/90 rounded-lg border border-amber-200 space-y-1.5">
                    <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Fatos Apurados (Comprovados por Números)</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                      {diagnosis.fatoVsHipotese.fatos.map((f, idx) => (
                        <li key={idx}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-amber-200 space-y-1.5">
                    <span className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Hipóteses Investigativas (A Conferir no DP)</span>
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700 text-[11px]">
                      {diagnosis.fatoVsHipotese.hipoteses.map((h, idx) => (
                        <li key={idx}>{h}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Checklist do que conferir */}
                <div className="p-3 bg-amber-100/60 rounded-lg text-xs space-y-1 text-amber-950">
                  <span className="font-bold uppercase text-[10px] tracking-wider block">
                    Checklist Recomendado para Resolução no DP:
                  </span>
                  <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                    {diagnosis.pontosConferir.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ABA 3: COMPARAR BASES (Seção 18) */}
        {activeTab === 'bases' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Comparação Detalhada de Bases (Componente a Componente)
                </h3>
                <p className="text-xs text-slate-500">
                  Compare o valor que cada rubrica teve na base da calculadora contra a base do sistema externo
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-bold">
                Base Calculadora: {formatBRL(result.basePensao)}
              </span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                      Componente
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-36">
                      Calculadora
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Valor no Sistema
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-32">
                      Diferença
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900 w-28">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {baseComparison.map((item) => (
                    <tr key={item.componenteId} className="hover:bg-slate-50">
                      <td className="py-2.5 pl-4 pr-3 font-sans text-slate-800">
                        {item.label}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 font-bold tabular-nums">
                        {formatBRL(item.calculadora)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="relative">
                          <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-xs text-slate-400">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={item.informado ?? ''}
                            onChange={(e) => handleUpdateBaseInformada(item.componenteId, parseFloat(e.target.value) || 0)}
                            className="w-full pl-7 pr-2 py-1 text-xs font-mono text-right border border-slate-300 rounded focus:border-slate-900 focus:outline-hidden"
                          />
                        </div>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold tabular-nums ${
                        item.status === 'DIVERGENTE' ? 'text-amber-700' : 'text-slate-700'
                      }`}>
                        {formatBRL(item.diferenca)}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.status === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 4: COMPARAR REGRAS (Seção 19) */}
        {activeTab === 'regras' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Comparação Lado a Lado de Regras de Pensão
                </h3>
                <p className="text-xs text-slate-500">
                  Verifique divergências de premissas jurídicas (percentual, tipo de base, verbas e deduções)
                </p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900 w-48">
                      Parâmetro da Regra
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                      Calculadora (Ativa)
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                      Informado no Sistema
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900 w-36">
                      Status da Regra
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {ruleComparison.map((r, idx) => (
                    <tr key={idx} className={r.status === 'REGRA_DIFERENTE' ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 pl-4 pr-3 text-slate-900 font-medium">
                        {r.campo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        {r.calculadora}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {r.informado}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right">
                        {r.status === 'REGRA_DIFERENTE' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">
                            REGRA DIFERENTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            IGUAL
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 5: CONFERÊNCIA INVERSA (Seção 20) */}
        {activeTab === 'inversa' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Conferência Inversa ("Qual percentual produziria o valor informado?")
              </h3>
              <p className="text-xs text-slate-500">
                Instrumento de análise matemática para identificar alíquotas implícitas em valores de pensão fixados ou informados
              </p>
            </div>

            {inverseResult.aplicavel ? (
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-950 uppercase">
                    Resultado da Conferência Inversa
                  </span>
                  <span className="text-base font-bold font-mono text-emerald-800 bg-white px-3 py-1 rounded border border-emerald-300">
                    Alíquota Implícita: {inverseResult.percentualEquivalente}%
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-emerald-200/80 space-y-1.5 text-xs text-slate-700">
                  <div className="flex justify-between items-center">
                    <span>Valor da Pensão Informado pelo Sistema:</span>
                    <span className="font-mono font-bold text-slate-900">{formatBRL(inverseResult.valorInformadoPensao)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Base de Cálculo Apurada na Calculadora:</span>
                    <span className="font-mono font-bold text-slate-900">{formatBRL(inverseResult.baseUtilizada)}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 font-mono text-emerald-800 font-semibold">
                    Operação: {formatBRL(inverseResult.valorInformadoPensao)} ÷ {formatBRL(inverseResult.baseUtilizada)} = {inverseResult.percentualEquivalente}%
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900">
                  <strong>Aviso Oficial do DP:</strong> O percentual de <strong>{inverseResult.percentualEquivalente}%</strong> é estritamente o resultado matemático correspondente à divisão do valor informado pela base ativa. Ele serve para apontar se a empresa está utilizando um percentual diferente (ex: 25% em vez de 20%), não constituindo alteração automática do título executivo judicial.
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Conferência Inversa Indisponível
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Para utilizar a conferência inversa, informe o <strong>"Pensão Sistema"</strong> na aba de conferência e certifique-se de que a base calculada é maior que zero.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ABA 6: CENÁRIOS DE SIMULAÇÃO (Seção 21) */}
        {activeTab === 'simulacoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Simulação de Cenários Comparativos (Sem Alterar o Cálculo Original)
                </h3>
                <p className="text-xs text-slate-500">
                  Projeções de impacto financeiro com diferentes bases e alíquotas
                </p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                <thead className="bg-slate-50 font-sans">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                      Cenário
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                      Modalidade da Base
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      Base Valor
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      Alíquota
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                      Pensão Resultante
                    </th>
                    <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900">
                      Diferença p/ Atual
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {scenarios.map((sc) => (
                    <tr key={sc.id} className={sc.id === 'atual' ? 'bg-slate-50 font-bold' : 'hover:bg-slate-50'}>
                      <td className="py-2.5 pl-4 pr-3 font-sans text-slate-900">
                        {sc.nome}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {sc.baseTipo}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                        {formatBRL(sc.baseValor)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-800 tabular-nums">
                        {sc.percentual}%
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        {formatBRL(sc.pensaoCalculada)}
                      </td>
                      <td className="py-2.5 pl-3 pr-4 text-right tabular-nums text-slate-600">
                        {sc.diferencaParaAtual === 0 ? '—' : `${sc.diferencaParaAtual > 0 ? '+' : ''}${formatBRL(sc.diferencaParaAtual)}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulação Personalizada Interativa */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold uppercase text-slate-800 block">
                Simulador Rápido Personalizado
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-600">Testar percentual:</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customPctSim}
                  onChange={(e) => setCustomPctSim(parseFloat(e.target.value) || 0)}
                  className="w-20 px-2 py-1 text-xs font-mono font-bold border border-slate-300 rounded bg-white"
                />
                <span className="text-xs text-slate-600">% sobre a base ativa ({formatBRL(result.basePensao)}) = </span>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-white px-2 py-1 rounded border border-emerald-300">
                  {formatBRL(Math.round(result.basePensao * (customPctSim / 100) * 100) / 100)}
                </span>
                <span className="text-[11px] text-slate-500 italic">
                  (Diferença de {formatBRL(Math.round(result.basePensao * (customPctSim / 100) * 100) / 100 - result.valorPensao)} em relação ao cálculo atual)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ABA 7: VERSÕES DO CÁLCULO (Seção 22) */}
        {activeTab === 'versoes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Histórico de Versões do Cálculo (Seção 22)
                </h3>
                <p className="text-xs text-slate-500">
                  Preservação de cálculos anteriores evitando sobrescrições silenciosas
                </p>
              </div>
              <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded text-slate-700 font-bold">
                {versionsHistory.length} versão(ões) registrada(s)
              </span>
            </div>

            {versionsHistory.length > 0 ? (
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                        Identificador
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                        Data/Hora
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                        Módulo
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        Pensão
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900">
                        Líquido
                      </th>
                      <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {versionsHistory.map((ver) => (
                      <tr key={ver.versionId} className="hover:bg-slate-50">
                        <td className="py-2.5 pl-4 pr-3 font-bold text-slate-900">
                          {ver.versionId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-sans text-[11px]">
                          {ver.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-700">
                          {ver.moduloRotulo}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700 tabular-nums">
                          {formatBRL(ver.valorPensao)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-900 tabular-nums">
                          {formatBRL(ver.liquidoAposPensao)}
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ver.temDivergencia ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ver.statusGeral}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                O histórico registrará uma nova versão cada vez que você salvar a regra ou recalcular uma alteração relevante.
              </div>
            )}
          </div>
        )}

        {/* ABA 8: LOG DE ALTERAÇÕES (Seção 23) */}
        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Log de Alterações de Parâmetros (Seção 23)
                </h3>
                <p className="text-xs text-slate-500">
                  Rastreabilidade de modificações de regras, percentuais e verbas durante a sessão
                </p>
              </div>
            </div>

            {auditLogs.length > 0 ? (
              <div className="overflow-hidden border border-slate-200 rounded-lg">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900 w-36">
                        Data/Hora
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900 w-44">
                        Campo Alterado
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                        Valor Anterior
                      </th>
                      <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                        Novo Valor
                      </th>
                      <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900">
                        Ação Realizada
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-2.5 pl-4 pr-3 font-sans text-slate-500">
                          {log.timestamp}
                        </td>
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                          {log.campoAlterado}
                        </td>
                        <td className="py-2.5 px-3 text-rose-700">
                          {log.valorAnterior}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-700 font-bold">
                          {log.novoValor}
                        </td>
                        <td className="py-2.5 pl-3 pr-4 text-right font-sans text-slate-600">
                          {log.acaoRealizada}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
                Nenhuma alteração de parâmetro registrada até o momento nesta sessão.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
