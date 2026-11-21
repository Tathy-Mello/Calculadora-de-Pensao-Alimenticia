/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionBaseType,
  PensionRuleConfig,
  PensionRuleType,
  PlrCriterioItem,
  PlrFormaCalculo,
  PlrParcelamentoConfig,
  PlrRegraConfig,
  PlrTipoCalculo,
  RoundingPolicy,
} from '../types/pension';
import { IrrfDeductionsConfig } from '../types/irrf';
import { formatBRL, parseBRLInput } from '../utils/formatters';
import { BeneficiarySplitControl } from './BeneficiarySplitControl';
import {
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Scale,
  Sparkles,
  Percent,
  Sliders,
  Users,
  Target,
  Split,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PlrSectionProps {
  identification: IdentificationData;
  onUpdateIdentification: (field: keyof IdentificationData, value: any) => void;
  rule: PensionRuleConfig;
  onUpdateRule: (field: keyof PensionRuleConfig, value: any) => void;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  onToggleEarningInclusion: (id: string) => void;
  onToggleEarningInssIncidence: (id: string) => void;
  onToggleEarningIrrfIncidence: (id: string) => void;
  onUpdateEarningValue: (id: string, value: number) => void;
  onUpdateEarningObservation: (id: string, obs: string) => void;
  onAddEarning: (
    label: string,
    value: number,
    included: boolean,
    incideInss: boolean,
    incideIrrf: boolean,
    observation?: string
  ) => void;
  onRemoveEarning: (id: string) => void;

  onToggleDeductionInclusion: (id: string) => void;
  onToggleDeductionLiquido?: (id: string) => void;
  onToggleDeductionIrrf?: (id: string) => void;
  onUpdateDeductionValue: (id: string, value: number) => void;
  onUpdateDeductionOrder: (id: string, order: number) => void;
  onUpdateDeductionObservation: (id: string, obs: string) => void;
  onAddDeduction: (
    label: string,
    value: number,
    deductsPension: boolean,
    deduzDoLiquido: boolean,
    deduzDoIrrf: boolean,
    order: number,
    observation?: string
  ) => void;
  onRemoveDeduction: (id: string) => void;

  plrRegra: PlrRegraConfig;
  onUpdatePlrRegra: (field: keyof PlrRegraConfig, value: any) => void;
  plrParcelamento: PlrParcelamentoConfig;
  onUpdatePlrParcelamento: (field: keyof PlrParcelamentoConfig, value: any) => void;

  irrfConfig: IrrfDeductionsConfig;
  onUpdateIrrfConfig: (field: keyof IrrfDeductionsConfig, value: any) => void;

  hasError?: boolean;
}

const PLR_TIPO_OPTIONS: { id: PlrTipoCalculo; label: string; desc: string }[] = [
  { id: 'integral', label: 'PLR Integral', desc: 'Participação anual ou semestral de exercício completo' },
  { id: 'proporcional', label: 'PLR Proporcional', desc: 'Apuração fracionada por admissão, rescisão ou afastamento' },
  { id: 'simulacao', label: 'Simulação', desc: 'Projeção de valores para previsão de desembolso e pensão' },
  { id: 'conferencia', label: 'Conferência', desc: 'Validação e auditoria do valor processado pela folha' },
];

const FORMA_CALCULO_OPTIONS: { id: PlrFormaCalculo; label: string; desc: string }[] = [
  { id: 'valor_informado', label: 'Valor Informado', desc: 'Valor bruto fixado diretamente pelo usuário' },
  { id: 'percentual_base', label: 'Percentual s/ Base', desc: 'Percentual aplicado sobre salário ou remuneração base' },
  { id: 'criterios_indicadores', label: 'Critérios e Indicadores', desc: 'Ponderação por metas de lucratividade e metas individuais' },
  { id: 'calculo_proporcional', label: 'Cálculo Proporcional', desc: 'Base integral multiplicada por fator de proporcionalidade' },
  { id: 'formula_personalizada', label: 'Fórmula Personalizada', desc: 'Montagem customizada com os componentes informados' },
  { id: 'regra_cadastrada', label: 'Regra Cadastrada', desc: 'Regras convencionadas em Acordo Coletivo (ACT/CCT)' },
];

export const PlrSection: React.FC<PlrSectionProps> = ({
  identification,
  onUpdateIdentification,
  rule,
  onUpdateRule,
  earnings,
  deductions,
  onToggleEarningInclusion,
  onToggleEarningInssIncidence,
  onToggleEarningIrrfIncidence,
  onUpdateEarningValue,
  onUpdateEarningObservation,
  onAddEarning,
  onRemoveEarning,
  onToggleDeductionInclusion,
  onToggleDeductionLiquido,
  onToggleDeductionIrrf,
  onUpdateDeductionValue,
  onUpdateDeductionOrder,
  onUpdateDeductionObservation,
  onAddDeduction,
  onRemoveDeduction,
  plrRegra,
  onUpdatePlrRegra,
  plrParcelamento,
  onUpdatePlrParcelamento,
  irrfConfig,
  onUpdateIrrfConfig,
  hasError = false,
}) => {
  // Modal de Adicionar Componente
  const [showAddVerba, setShowAddVerba] = useState(false);
  const [novaVerbaLabel, setNovaVerbaLabel] = useState('');
  const [novaVerbaValor, setNovaVerbaValor] = useState('');
  const [novaVerbaInss, setNovaVerbaInss] = useState(false);
  const [novaVerbaIrrf, setNovaVerbaIrrf] = useState(true);
  const [novaVerbaPensao, setNovaVerbaPensao] = useState(true);
  const [novaVerbaObs, setNovaVerbaObs] = useState('');

  // Modal de Adicionar Desconto
  const [showAddDesconto, setShowAddDesconto] = useState(false);
  const [novoDescLabel, setNovoDescLabel] = useState('');
  const [novoDescValor, setNovoDescValor] = useState('');
  const [novoDescPensao, setNovoDescPensao] = useState(false);
  const [novoDescLiquido, setNovoDescLiquido] = useState(true);
  const [novoDescIrrf, setNovoDescIrrf] = useState(false);
  const [novoDescObs, setNovoDescObs] = useState('');

  // Adicionar Meta/Critério
  const [showAddCriterio, setShowAddCriterio] = useState(false);
  const [novoCritIndicador, setNovoCritIndicador] = useState('');
  const [novoCritPeso, setNovoCritPeso] = useState('50');
  const [novoCritMeta, setNovoCritMeta] = useState('100% da Meta EBITDA');
  const [novoCritAtingido, setNovoCritAtingido] = useState('100');
  const [novoCritValor, setNovoCritValor] = useState('');

  // Seção de Comparação com Folha (Seção 16)
  const [compAtiva, setCompAtiva] = useState(Boolean(identification.plrSistemaFolha?.ativo));
  const [compPlrBruta, setCompPlrBruta] = useState(identification.plrSistemaFolha?.plrBruta?.toString() || '');
  const [compInss, setCompInss] = useState(identification.plrSistemaFolha?.inss?.toString() || '0');
  const [compIrrf, setCompIrrf] = useState(identification.plrSistemaFolha?.irrf?.toString() || '');
  const [compPensao, setCompPensao] = useState(identification.plrSistemaFolha?.pensao?.toString() || '');
  const [compLiquido, setCompLiquido] = useState(identification.plrSistemaFolha?.liquido?.toString() || '');

  const totalBrutoPlr = earnings.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // Aplicação da forma de cálculo nos componentes
  const handleAplicarFormaCalculo = (forma: PlrFormaCalculo) => {
    onUpdatePlrRegra('formaCalculo', forma);
    if (forma === 'valor_informado') {
      const v = plrRegra.valorBrutoInformado || 0;
      const baseItem = earnings.find((e) => e.id === 'parcela_base');
      if (baseItem && v > 0) {
        onUpdateEarningValue(baseItem.id, v);
      }
    } else if (forma === 'percentual_base') {
      const base = plrRegra.baseCalculoPercentual || 0;
      const pct = plrRegra.percentualSobreBase || 100;
      const v = (base * pct) / 100;
      const baseItem = earnings.find((e) => e.id === 'parcela_base');
      if (baseItem) {
        onUpdateEarningValue(baseItem.id, v);
      }
    } else if (forma === 'calculo_proporcional') {
      const meses = plrRegra.mesesTrabalhados || 12;
      const totalMeses = plrRegra.totalMesesAno || 12;
      const fator = totalMeses > 0 ? meses / totalMeses : 1;
      onUpdatePlrRegra('fatorProporcionalidade', fator);
      const vIntegral = plrRegra.valorBrutoInformado || totalBrutoPlr || 0;
      const vProp = vIntegral * fator;
      const propItem = earnings.find((e) => e.id === 'proporcionalidade');
      if (propItem) {
        onUpdateEarningValue(propItem.id, vProp);
      }
    }
  };

  const handleSalvarNovaVerba = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaVerbaLabel.trim()) return;
    const val = parseBRLInput(novaVerbaValor);
    onAddEarning(novaVerbaLabel.trim(), val, novaVerbaPensao, novaVerbaInss, novaVerbaIrrf, novaVerbaObs.trim() || undefined);
    setNovaVerbaLabel('');
    setNovaVerbaValor('');
    setNovaVerbaObs('');
    setShowAddVerba(false);
  };

  const handleSalvarNovoDesconto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDescLabel.trim()) return;
    const val = parseBRLInput(novoDescValor);
    const maxOrder = deductions.reduce((max, d) => Math.max(max, d.order), 0);
    onAddDeduction(novoDescLabel.trim(), val, novoDescPensao, novoDescLiquido, novoDescIrrf, maxOrder + 1, novoDescObs.trim() || undefined);
    setNovoDescLabel('');
    setNovoDescValor('');
    setNovoDescObs('');
    setShowAddDesconto(false);
  };

  const handleAdicionarCriterio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoCritIndicador.trim()) return;
    const novoCrit: PlrCriterioItem = {
      id: `crit_${Date.now()}`,
      indicador: novoCritIndicador.trim(),
      peso: parseFloat(novoCritPeso) || 50,
      meta: novoCritMeta.trim(),
      resultadoAlcancado: parseFloat(novoCritAtingido) || 100,
      valorAtribuido: parseBRLInput(novoCritValor),
    };
    const listaAtualizada = [...(plrRegra.criteriosMetas || []), novoCrit];
    onUpdatePlrRegra('criteriosMetas', listaAtualizada);

    // Soma no resultado/meta
    const somaCriterios = listaAtualizada.reduce((acc, c) => acc + (c.valorAtribuido || 0), 0);
    const metaItem = earnings.find((e) => e.id === 'resultado_meta');
    if (metaItem) {
      onUpdateEarningValue(metaItem.id, somaCriterios);
    }

    setNovoCritIndicador('');
    setNovoCritValor('');
    setShowAddCriterio(false);
  };

  const handleRemoverCriterio = (id: string) => {
    const listaAtualizada = (plrRegra.criteriosMetas || []).filter((c) => c.id !== id);
    onUpdatePlrRegra('criteriosMetas', listaAtualizada);
    const somaCriterios = listaAtualizada.reduce((acc, c) => acc + (c.valorAtribuido || 0), 0);
    const metaItem = earnings.find((e) => e.id === 'resultado_meta');
    if (metaItem) {
      onUpdateEarningValue(metaItem.id, somaCriterios);
    }
  };

  const handleUpdateComparacao = (campo: string, valor: any) => {
    const atual = identification.plrSistemaFolha || {
      ativo: compAtiva,
      plrBruta: parseBRLInput(compPlrBruta),
      inss: parseBRLInput(compInss),
      irrf: parseBRLInput(compIrrf),
      pensao: parseBRLInput(compPensao),
      liquido: parseBRLInput(compLiquido),
    };

    const atualizado = {
      ...atual,
      [campo]: valor,
    };

    onUpdateIdentification('plrSistemaFolha', atualizado);
  };

  return (
    <div className="space-y-6">
      {/* 1. IDENTIFICAÇÃO DO CÁLCULO DA PLR (Seção 2) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                1. Identificação da PLR (Participação nos Lucros ou Resultados)
              </h2>
              <p className="text-xs text-slate-500">
                Matrícula funcional exclusiva, vigência e modalidade de apuração (Lei nº 10.101/2000)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            Fase 9 · Módulo de PLR
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Matrícula do Colaborador *
            </label>
            <input
              type="text"
              value={identification.matricula}
              onChange={(e) => onUpdateIdentification('matricula', e.target.value)}
              placeholder="Ex: PLR-2026-01"
              className="w-full px-3 py-2 text-xs font-mono font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Identificador principal (LGPD estrita: sem CPF ou nomes)
            </span>
          </div>

          {/* Ano de Competência */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Ano de Competência *
            </label>
            <select
              value={identification.ano}
              onChange={(e) => onUpdateIdentification('ano', parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white cursor-pointer"
            >
              <option value={2026}>2026 (Tabela Exclusiva RFB 2026)</option>
              <option value={2025}>2025 (Tabela Exclusiva RFB 2025)</option>
            </select>
          </div>

          {/* Período de Referência */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Período de Referência da PLR
            </label>
            <input
              type="text"
              value={identification.periodoReferenciaPlr || 'Exercício 2025'}
              onChange={(e) => onUpdateIdentification('periodoReferenciaPlr', e.target.value)}
              placeholder="Ex: Exercício 2025, 1º Semestre 2026"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white"
            />
          </div>

          {/* Data de Pagamento */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Data de Pagamento *
            </label>
            <input
              type="date"
              value={identification.dataPagamento}
              onChange={(e) => onUpdateIdentification('dataPagamento', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Fixa a tabela progressiva e vigência tributária
            </span>
          </div>
        </div>

        {/* Tipo de Cálculo da PLR e Parcela */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Cálculo da PLR
            </label>
            <select
              value={identification.tipoCalculoPlr || 'integral'}
              onChange={(e) => onUpdateIdentification('tipoCalculoPlr', e.target.value as PlrTipoCalculo)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white cursor-pointer"
            >
              {PLR_TIPO_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Número da Parcela
            </label>
            <input
              type="text"
              value={identification.numeroParcelaPlr || 'Parcela Única'}
              onChange={(e) => onUpdateIdentification('numeroParcelaPlr', e.target.value)}
              placeholder="Ex: Parcela Única, 1ª Parcela, Quitação Final"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observações do Cálculo
            </label>
            <input
              type="text"
              value={identification.observacoesPlr || ''}
              onChange={(e) => onUpdateIdentification('observacoesPlr', e.target.value)}
              placeholder="Ex: ACT 2025/2026 Cláusula 12ª"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-colors bg-white"
            />
          </div>
        </div>
      </section>

      {/* 2. REGRA DE CÁLCULO DA PLR (Seções 3 e 4) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                2. Regra de Cálculo da PLR & Forma de Apuração
              </h2>
              <p className="text-xs text-slate-500">
                Parametrização flexível da composição do benefício: valor informado, percentual, metas ou fórmula
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            Forma: {FORMA_CALCULO_OPTIONS.find((f) => f.id === plrRegra.formaCalculo)?.label}
          </span>
        </div>

        {/* Seleção da Forma de Cálculo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Selecione o Modelo de Apuração da PLR:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {FORMA_CALCULO_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAplicarFormaCalculo(opt.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  plrRegra.formaCalculo === opt.id
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${plrRegra.formaCalculo === opt.id ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {opt.label}
                  </span>
                  {plrRegra.formaCalculo === opt.id && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Painéis Dinâmicos conforme a Forma Selecionada */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          {plrRegra.formaCalculo === 'valor_informado' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Valor Bruto da PLR Informado Diretamente
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="sm:w-64">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Valor Bruto da PLR: R$
                  </label>
                  <input
                    type="text"
                    value={plrRegra.valorBrutoInformado ? formatBRL(plrRegra.valorBrutoInformado) : ''}
                    onChange={(e) => {
                      const val = parseBRLInput(e.target.value);
                      onUpdatePlrRegra('valorBrutoInformado', val);
                      const baseItem = earnings.find((i) => i.id === 'parcela_base');
                      if (baseItem) onUpdateEarningValue(baseItem.id, val);
                    }}
                    placeholder="R$ 0,00"
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <p className="text-xs text-slate-500 sm:pt-4">
                  O valor será atribuído diretamente à <strong>Parcela Base</strong> da PLR na tabela de componentes.
                </p>
              </div>
            </div>
          )}

          {plrRegra.formaCalculo === 'percentual_base' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Base de Cálculo da Remuneração (R$):
                </label>
                <input
                  type="text"
                  value={plrRegra.baseCalculoPercentual ? formatBRL(plrRegra.baseCalculoPercentual) : ''}
                  onChange={(e) => {
                    const base = parseBRLInput(e.target.value);
                    onUpdatePlrRegra('baseCalculoPercentual', base);
                    const pct = plrRegra.percentualSobreBase || 100;
                    const v = (base * pct) / 100;
                    const baseItem = earnings.find((i) => i.id === 'parcela_base');
                    if (baseItem) onUpdateEarningValue(baseItem.id, v);
                  }}
                  placeholder="Ex: R$ 5.000,00"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Percentual Aplicável (%):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={plrRegra.percentualSobreBase || ''}
                  onChange={(e) => {
                    const pct = parseFloat(e.target.value) || 0;
                    onUpdatePlrRegra('percentualSobreBase', pct);
                    const base = plrRegra.baseCalculoPercentual || 0;
                    const v = (base * pct) / 100;
                    const baseItem = earnings.find((i) => i.id === 'parcela_base');
                    if (baseItem) onUpdateEarningValue(baseItem.id, v);
                  }}
                  placeholder="Ex: 120 (%)"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                />
              </div>

              <div className="flex flex-col justify-end">
                <span className="text-[11px] text-slate-500">Resultado Calculado:</span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatBRL(((plrRegra.baseCalculoPercentual || 0) * (plrRegra.percentualSobreBase || 0)) / 100)}
                </span>
              </div>
            </div>
          )}

          {plrRegra.formaCalculo === 'calculo_proporcional' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Cálculo Proporcional da PLR (Seção 6)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Meses Trabalhados / Considerados:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={plrRegra.mesesTrabalhados || 12}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10) || 12;
                      onUpdatePlrRegra('mesesTrabalhados', m);
                      const fator = m / (plrRegra.totalMesesAno || 12);
                      onUpdatePlrRegra('fatorProporcionalidade', fator);
                      const base = plrRegra.valorBrutoInformado || totalBrutoPlr || 0;
                      const propItem = earnings.find((i) => i.id === 'proporcionalidade');
                      if (propItem) onUpdateEarningValue(propItem.id, base * fator);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Divisor Anual (Meses):
                  </label>
                  <input
                    type="number"
                    value={plrRegra.totalMesesAno || 12}
                    onChange={(e) => {
                      const div = parseInt(e.target.value, 10) || 12;
                      onUpdatePlrRegra('totalMesesAno', div);
                      const fator = (plrRegra.mesesTrabalhados || 12) / div;
                      onUpdatePlrRegra('fatorProporcionalidade', fator);
                    }}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <span className="text-[11px] text-slate-500">Fator de Proporcionalidade:</span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {((plrRegra.mesesTrabalhados || 12) / (plrRegra.totalMesesAno || 12)).toFixed(4)}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-slate-600 bg-white p-2 rounded border border-slate-200">
                Fórmula: PLR Integral × ({plrRegra.mesesTrabalhados || 12} ÷ {plrRegra.totalMesesAno || 12}) = PLR Proporcional
              </p>
            </div>
          )}

          {plrRegra.formaCalculo === 'criterios_indicadores' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Metas e Indicadores de Desempenho
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCriterio(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Adicionar Critério</span>
                </button>
              </div>

              {plrRegra.criteriosMetas && plrRegra.criteriosMetas.length > 0 ? (
                <div className="overflow-hidden border border-slate-200 rounded-lg bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="py-2 pl-3 text-left font-semibold text-slate-700">Indicador / Meta</th>
                        <th className="py-2 px-2 text-center font-semibold text-slate-700">Peso</th>
                        <th className="py-2 px-2 text-center font-semibold text-slate-700">Atingido (%)</th>
                        <th className="py-2 pr-3 text-right font-semibold text-slate-700">Valor (R$)</th>
                        <th className="py-2 pr-2 text-center font-semibold text-slate-700 w-10">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {plrRegra.criteriosMetas.map((c) => (
                        <tr key={c.id}>
                          <td className="py-2 pl-3 text-slate-900 font-medium">
                            {c.indicador}
                            <span className="block text-[10px] text-slate-500">{c.meta}</span>
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-700">{c.peso}%</td>
                          <td className="py-2 px-2 text-center font-mono text-slate-700">{c.resultadoAlcancado}%</td>
                          <td className="py-2 pr-3 text-right font-mono font-bold text-slate-900">
                            {formatBRL(c.valorAtribuido)}
                          </td>
                          <td className="py-2 pr-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoverCriterio(c.id)}
                              className="text-rose-500 hover:text-rose-700 p-1"
                              title="Remover indicador"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Nenhum indicador cadastrado. Clique em "+ Adicionar Critério" para detalhar pesos e metas da PLR.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 3. PARCELAMENTO DA PLR (Seção 7) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Split className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                3. Parcelamento da PLR & Pagamentos Anteriores (Seção 7)
              </h2>
              <p className="text-xs text-slate-500">
                Controle de adiantamentos, antecipações ou parcelamento semestral
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Modalidade de Pagamento
            </label>
            <select
              value={plrParcelamento.modalidade}
              onChange={(e) => onUpdatePlrParcelamento('modalidade', e.target.value as any)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white cursor-pointer"
            >
              <option value="unica">Parcela Única</option>
              <option value="duas">Duas Parcelas (Adiantamento + Saldo)</option>
              <option value="multiplas">Múltiplas Parcelas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Parcela Atual
            </label>
            <input
              type="number"
              min="1"
              value={plrParcelamento.parcelaAtual || 1}
              onChange={(e) => onUpdatePlrParcelamento('parcelaAtual', parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Valor Já Pago Anteriormente (R$)
            </label>
            <input
              type="text"
              value={plrParcelamento.valorJaPago ? formatBRL(plrParcelamento.valorJaPago) : ''}
              onChange={(e) => onUpdatePlrParcelamento('valorJaPago', parseBRLInput(e.target.value))}
              placeholder="R$ 0,00"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Deduz do total para apurar a parcela atual
            </span>
          </div>

          <div className="flex flex-col justify-end p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-600 font-semibold">Valor Restante / Parcela Atual:</span>
            <span className="text-sm font-mono font-bold text-slate-900">
              {formatBRL(Math.max(0, totalBrutoPlr - (plrParcelamento.valorJaPago || 0)))}
            </span>
          </div>
        </div>
      </section>

      {/* 4. TABELA DE COMPONENTES DA PLR (Seção 5) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                4. Componentes da PLR & Incidências Independentes (Seção 5)
              </h2>
              <p className="text-xs text-slate-500">
                Cada rubrica possui configuração independente para INSS, IRRF e Pensão Alimentícia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddVerba(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Adicionar componente</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="py-2.5 pl-4 pr-3 text-left font-semibold">Componente da PLR</th>
                <th className="py-2.5 px-3 text-right font-semibold w-36">Valor (R$)</th>
                <th className="py-2.5 px-2 text-center font-semibold w-28">Participa da PLR?</th>
                <th className="py-2.5 px-2 text-center font-semibold w-24">Incide INSS?</th>
                <th className="py-2.5 px-2 text-center font-semibold w-24">Incide IRRF?</th>
                <th className="py-2.5 px-2 text-center font-semibold w-28">Incide Pensão?</th>
                <th className="py-2.5 pr-4 pl-2 text-center font-semibold w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {earnings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 pl-4 pr-3 text-slate-900 font-medium">
                    {item.label}
                    {item.observation && (
                      <span className="block text-[10px] text-slate-400 font-normal">{item.observation}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="text"
                      value={item.value ? formatBRL(item.value) : ''}
                      onChange={(e) => onUpdateEarningValue(item.id, parseBRLInput(e.target.value))}
                      placeholder="R$ 0,00"
                      className="w-full text-right px-2 py-1 text-xs font-mono font-semibold rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Sim
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningInssIncidence(item.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        item.incideInss
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.incideInss ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningIrrfIncidence(item.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        item.incideIrrf
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.incideIrrf ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningInclusion(item.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${
                        item.includedInPensionBase
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                          : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {item.includedInPensionBase ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4 pl-2 text-center">
                    {item.isCustom ? (
                      <button
                        type="button"
                        onClick={() => onRemoveEarning(item.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Remover componente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-900 border-t-2 border-slate-200">
              <tr>
                <td className="py-2.5 pl-4 pr-3 text-left">Total Bruto da PLR</td>
                <td className="py-2.5 px-3 text-right font-mono text-sm text-slate-950 font-bold">
                  {formatBRL(totalBrutoPlr)}
                </td>
                <td colSpan={5} className="py-2.5 px-3 text-[11px] text-slate-500 italic text-right">
                  Base consolidada apurada a partir dos componentes ativos
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* 5. REGRA DA PENSÃO ALIMENTÍCIA SOBRE A PLR (Seções 10 e 11) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                5. Regra da Pensão Alimentícia sobre a PLR (Seções 10 e 11)
              </h2>
              <p className="text-xs text-slate-500">
                Regra independente para a PLR (geral vs específica), base de incidência e alíquotas
              </p>
            </div>
          </div>
        </div>

        {/* Escolha: Regra Geral vs Regra Específica */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onUpdateRule('origemRegraPlr', 'geral')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              rule.origemRegraPlr !== 'especifica'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Usar Regra Geral Cadastrada</span>
              {rule.origemRegraPlr !== 'especifica' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Aplica os mesmos parâmetros da folha mensal à participação nos lucros
            </p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateRule('origemRegraPlr', 'especifica')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              rule.origemRegraPlr === 'especifica'
                ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">Usar Regra Específica para PLR</span>
              {rule.origemRegraPlr === 'especifica' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Define percentual, base ou valor fixo exclusivo para a PLR
            </p>
          </button>
        </div>

        {/* Configuração da Regra */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Tipo de Regra */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tipo de Cálculo da Pensão
            </label>
            <select
              value={rule.ruleType}
              onChange={(e) => onUpdateRule('ruleType', e.target.value as PensionRuleType)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white cursor-pointer"
            >
              <option value="percentual">Percentual (%)</option>
              <option value="valor_fixo">Valor Fixo (R$)</option>
              <option value="percentual_adicional">Percentual + Parcela Adicional</option>
            </select>
          </div>

          {/* Percentual ou Valor Fixo (oculto quando rateio por filhos está ativo) */}
          {!rule.rateioBeneficiariosAtivo && (
            rule.ruleType === 'valor_fixo' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Valor Fixo da Pensão (R$)
                </label>
                <input
                  type="text"
                  value={rule.fixedValue ? formatBRL(rule.fixedValue) : ''}
                  onChange={(e) => onUpdateRule('fixedValue', parseBRLInput(e.target.value))}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Percentual da Pensão (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rule.percentage || ''}
                  onChange={(e) => onUpdateRule('percentage', parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 20,00"
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                />
              </div>
            )
          )}

          {/* Base da Pensão */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Base da Pensão sobre a PLR
            </label>
            <select
              value={rule.baseType}
              onChange={(e) => onUpdateRule('baseType', e.target.value as PensionBaseType)}
              className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 bg-white cursor-pointer"
            >
              <option value="bruta">Valor Bruto da PLR</option>
              <option value="apos_inss">PLR após INSS</option>
              <option value="apos_inss_irrf">PLR após INSS e IRRF</option>
              <option value="liquida">Valor Líquido</option>
              <option value="personalizada">Base Personalizada (Verbas Marcadas)</option>
            </select>
          </div>
        </div>

        {/* Rateio por Beneficiário (Cálculo Separado + 1 Evento Único na Folha) */}
        <BeneficiarySplitControl rule={rule} onUpdateRule={onUpdateRule} />
      </section>

      {/* 6. OUTROS DESCONTOS DA PLR (Seção 12) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                6. Outros Descontos da PLR (Seção 12)
              </h2>
              <p className="text-xs text-slate-500">
                Adiantamentos, taxas associativas ou outros descontos autorizados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDesconto(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-slate-600" />
            <span>+ Adicionar desconto</span>
          </button>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="py-2.5 pl-4 pr-3 text-left font-semibold">Descrição do Desconto</th>
                <th className="py-2.5 px-3 text-right font-semibold w-36">Valor (R$)</th>
                <th className="py-2.5 px-2 text-center font-semibold w-32">Reduz o Líquido?</th>
                <th className="py-2.5 px-2 text-center font-semibold w-32">Reduz a Base Pensão?</th>
                <th className="py-2.5 px-2 text-center font-semibold w-32">Participa do IRRF?</th>
                <th className="py-2.5 pr-4 pl-2 text-center font-semibold w-16">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {deductions.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 pl-4 pr-3 text-slate-900 font-medium">
                    {d.label}
                    {d.observation && (
                      <span className="block text-[10px] text-slate-400 font-normal">{d.observation}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {d.id === 'inss' || d.id === 'irrf' ? (
                      <span className="text-xs font-mono font-bold text-slate-500 italic">
                        [Calculado Oficial]
                      </span>
                    ) : (
                      <input
                        type="text"
                        value={d.value ? formatBRL(d.value) : ''}
                        onChange={(e) => onUpdateDeductionValue(d.id, parseBRLInput(e.target.value))}
                        placeholder="R$ 0,00"
                        className="w-full text-right px-2 py-1 text-xs font-mono font-semibold rounded border border-slate-300"
                      />
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      disabled={d.id === 'inss' || d.id === 'irrf'}
                      onClick={() => onToggleDeductionLiquido && onToggleDeductionLiquido(d.id)}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {d.deduzDoLiquido !== false ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleDeductionInclusion(d.id)}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                        d.deductFromPensionBase
                          ? 'bg-rose-50 text-rose-800 border border-rose-200 font-bold'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {d.deductFromPensionBase ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      disabled={d.id === 'inss' || d.id === 'irrf'}
                      onClick={() => onToggleDeductionIrrf && onToggleDeductionIrrf(d.id)}
                      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {d.deduzDoIrrf ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2.5 pr-4 pl-2 text-center">
                    {d.isCustom ? (
                      <button
                        type="button"
                        onClick={() => onRemoveDeduction(d.id)}
                        className="text-rose-500 hover:text-rose-700 p-1"
                        title="Remover desconto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-300 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. COMPARAÇÃO COM VALOR INFORMADO (Seção 16) */}
      <section className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                7. Conferência com Sistema de Folha (Opcional - Seção 16)
              </h2>
              <p className="text-xs text-slate-500">
                Informe os valores apurados pelo software de folha para comparar divergências matemáticas
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={compAtiva}
              onChange={(e) => {
                setCompAtiva(e.target.checked);
                handleUpdateComparacao('ativo', e.target.checked);
              }}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span>Ativar Comparação</span>
          </label>
        </div>

        {compAtiva && (
          <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-lg space-y-3">
            <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
              Valores Calculados pelo Sistema de Folha:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">PLR Bruta (R$)</label>
                <input
                  type="text"
                  value={compPlrBruta ? formatBRL(parseBRLInput(compPlrBruta)) : ''}
                  onChange={(e) => {
                    setCompPlrBruta(e.target.value);
                    handleUpdateComparacao('plrBruta', parseBRLInput(e.target.value));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">INSS (R$)</label>
                <input
                  type="text"
                  value={compInss ? formatBRL(parseBRLInput(compInss)) : ''}
                  onChange={(e) => {
                    setCompInss(e.target.value);
                    handleUpdateComparacao('inss', parseBRLInput(e.target.value));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">IRRF (R$)</label>
                <input
                  type="text"
                  value={compIrrf ? formatBRL(parseBRLInput(compIrrf)) : ''}
                  onChange={(e) => {
                    setCompIrrf(e.target.value);
                    handleUpdateComparacao('irrf', parseBRLInput(e.target.value));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Pensão (R$)</label>
                <input
                  type="text"
                  value={compPensao ? formatBRL(parseBRLInput(compPensao)) : ''}
                  onChange={(e) => {
                    setCompPensao(e.target.value);
                    handleUpdateComparacao('pensao', parseBRLInput(e.target.value));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Líquido (R$)</label>
                <input
                  type="text"
                  value={compLiquido ? formatBRL(parseBRLInput(compLiquido)) : ''}
                  onChange={(e) => {
                    setCompLiquido(e.target.value);
                    handleUpdateComparacao('liquido', parseBRLInput(e.target.value));
                  }}
                  placeholder="R$ 0,00"
                  className="w-full px-2 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
            <p className="text-[11px] text-amber-800">
              Ao clicar em <strong>"CALCULAR PLR"</strong>, a ferramenta apresentará o quadro comparativo matemático discriminando quaisquer diferenças de base, alíquota ou arredondamento.
            </p>
          </div>
        )}
      </section>

      {/* MODAL: ADICIONAR COMPONENTE DA PLR */}
      {showAddVerba && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                + Adicionar Componente da PLR
              </h3>
              <button
                type="button"
                onClick={() => setShowAddVerba(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovaVerba} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Componente *
                </label>
                <input
                  type="text"
                  required
                  value={novaVerbaLabel}
                  onChange={(e) => setNovaVerbaLabel(e.target.value)}
                  placeholder="Ex: Bônus Especial de Lucratividade"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={novaVerbaValor}
                  onChange={(e) => setNovaVerbaValor(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Incidências:</span>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaVerbaInss}
                      onChange={(e) => setNovaVerbaInss(e.target.checked)}
                    />
                    <span>Incide INSS</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaVerbaIrrf}
                      onChange={(e) => setNovaVerbaIrrf(e.target.checked)}
                    />
                    <span>Incide IRRF</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novaVerbaPensao}
                      onChange={(e) => setNovaVerbaPensao(e.target.checked)}
                    />
                    <span>Incide Pensão</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações</label>
                <input
                  type="text"
                  value={novaVerbaObs}
                  onChange={(e) => setNovaVerbaObs(e.target.value)}
                  placeholder="Ex: Previsto no aditivo do acordo"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddVerba(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Salvar Componente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR DESCONTO */}
      {showAddDesconto && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                + Adicionar Desconto da PLR
              </h3>
              <button
                type="button"
                onClick={() => setShowAddDesconto(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarNovoDesconto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descrição do Desconto *
                </label>
                <input
                  type="text"
                  required
                  value={novoDescLabel}
                  onChange={(e) => setNovoDescLabel(e.target.value)}
                  placeholder="Ex: Antecipação de PLR em folha anterior"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={novoDescValor}
                  onChange={(e) => setNovoDescValor(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-700 block">Classificação do Desconto:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoDescLiquido}
                      onChange={(e) => setNovoDescLiquido(e.target.checked)}
                    />
                    <span>Reduz Líquido</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoDescPensao}
                      onChange={(e) => setNovoDescPensao(e.target.checked)}
                    />
                    <span>Reduz Pensão</span>
                  </label>
                  <label className="flex items-center gap-1.5 p-2 bg-slate-50 rounded border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoDescIrrf}
                      onChange={(e) => setNovoDescIrrf(e.target.checked)}
                    />
                    <span>Abate IRRF</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDesconto(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Salvar Desconto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR CRITÉRIO/META */}
      {showAddCriterio && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                + Adicionar Critério / Indicador de PLR
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCriterio(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdicionarCriterio} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Indicador de Desempenho *
                </label>
                <input
                  type="text"
                  required
                  value={novoCritIndicador}
                  onChange={(e) => setNovoCritIndicador(e.target.value)}
                  placeholder="Ex: EBITDA Corporativo, Segurança, Produtividade"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Peso do Indicador (%)
                  </label>
                  <input
                    type="number"
                    value={novoCritPeso}
                    onChange={(e) => setNovoCritPeso(e.target.value)}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Atingimento (%)
                  </label>
                  <input
                    type="number"
                    value={novoCritAtingido}
                    onChange={(e) => setNovoCritAtingido(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Valor Resultante (R$) *
                </label>
                <input
                  type="text"
                  required
                  value={novoCritValor}
                  onChange={(e) => setNovoCritValor(e.target.value)}
                  placeholder="R$ 0,00"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCriterio(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Adicionar Critério
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
