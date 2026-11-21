/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DeductionItem,
  EarningItem,
  PensionBaseType,
  PensionRuleConfig,
  PensionRuleType,
  RoundingPolicy,
} from '../types/pension';
import { CircularCalculationOrder, IrrfDeductionsConfig } from '../types/irrf';
import { formatBRL, parseBRLInput } from '../utils/formatters';
import { BeneficiarySplitControl } from './BeneficiarySplitControl';
import {
  Percent,
  DollarSign,
  Plus,
  Trash2,
  Sliders,
  Scale,
  Shield,
  Layers,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

interface PensionRuleSectionProps {
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

  irrfConfig: IrrfDeductionsConfig;
  onUpdateIrrfConfig: (field: keyof IrrfDeductionsConfig, value: any) => void;

  calculationTypeName: string;
  hasRuleError?: boolean;
}

const COMMON_PERCENTAGES = [15, 20, 25, 30, 33.33, 50];

const BASE_TYPE_OPTIONS: { id: PensionBaseType; label: string; desc: string }[] = [
  {
    id: 'bruta',
    label: '1. Total Bruto',
    desc: 'Soma das verbas participantes sem dedução de INSS, IRRF ou outros descontos',
  },
  {
    id: 'liquida',
    label: '2. Total Líquido',
    desc: 'Verbas participantes deduzidas de todos os descontos informados na folha',
  },
  {
    id: 'apos_inss',
    label: '3. Após INSS',
    desc: 'Verbas participantes deduzido o valor oficial do INSS apurado pelo motor',
  },
  {
    id: 'apos_inss_irrf',
    label: '4. Após INSS e IRRF',
    desc: 'Base líquida fiscal (verbas participantes deduzidas de INSS e IRRF apurados)',
  },
  {
    id: 'personalizada',
    label: '5. Base Personalizada',
    desc: 'Configuração manual minuciosa de cada verba e dedução conforme mandado judicial',
  },
];

export const PensionRuleSection: React.FC<PensionRuleSectionProps> = ({
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
  irrfConfig,
  onUpdateIrrfConfig,
  calculationTypeName,
  hasRuleError,
}) => {
  // Modal / Formulário inline para nova verba
  const [showAddEarning, setShowAddEarning] = useState(false);
  const [newEarningLabel, setNewEarningLabel] = useState('');
  const [newEarningValue, setNewEarningValue] = useState('');
  const [newEarningIncluded, setNewEarningIncluded] = useState(true);
  const [newEarningIncideInss, setNewEarningIncideInss] = useState(true);
  const [newEarningIncideIrrf, setNewEarningIncideIrrf] = useState(true);
  const [newEarningObs, setNewEarningObs] = useState('');

  // Modal / Formulário inline para nova dedução
  const [showAddDeduction, setShowAddDeduction] = useState(false);
  const [newDeductionLabel, setNewDeductionLabel] = useState('');
  const [newDeductionValue, setNewDeductionValue] = useState('');
  const [newDeductionDeducts, setNewDeductionDeducts] = useState(true);
  const [newDeductionDeduzLiquido, setNewDeductionDeduzLiquido] = useState(true);
  const [newDeductionDeduzIrrf, setNewDeductionDeduzIrrf] = useState(false);
  const [newDeductionOrder, setNewDeductionOrder] = useState<number>(deductions.length + 1);
  const [newDeductionObs, setNewDeductionObs] = useState('');

  // Verificação de dependência circular (Seções 19 e 20)
  const isCircularActive =
    (rule.baseType === 'apos_inss_irrf' ||
      rule.baseType === 'liquida' ||
      deductions.some((d) => (d.id === 'irrf' || d.id.includes('irrf')) && d.deductFromPensionBase)) &&
    irrfConfig.deduzirPensao &&
    irrfConfig.usarPensaoCalculadaPeloMotor !== false;

  // Totais
  const includedEarnings = earnings.filter((e) => e.includedInPensionBase);
  const inssEarnings = earnings.filter((e) => e.incideInss === true);
  const irrfEarnings = earnings.filter((e) => e.incideIrrf === true);

  const somaBaseInssPrevia = inssEarnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const somaBaseIrrfPrevia = irrfEarnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const somaVerbasParticipantes = includedEarnings.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const handleAddEarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEarningLabel.trim()) return;
    const val = parseBRLInput(newEarningValue);
    onAddEarning(
      newEarningLabel.trim(),
      val,
      newEarningIncluded,
      newEarningIncideInss,
      newEarningIncideIrrf,
      newEarningObs.trim()
    );
    setNewEarningLabel('');
    setNewEarningValue('');
    setNewEarningIncluded(true);
    setNewEarningIncideInss(true);
    setNewEarningIncideIrrf(true);
    setNewEarningObs('');
    setShowAddEarning(false);
  };

  const handleAddDeductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeductionLabel.trim()) return;
    const val = parseBRLInput(newDeductionValue);
    onAddDeduction(
      newDeductionLabel.trim(),
      val,
      newDeductionDeducts,
      newDeductionDeduzLiquido,
      newDeductionDeduzIrrf,
      newDeductionOrder || 1,
      newDeductionObs.trim()
    );
    setNewDeductionLabel('');
    setNewDeductionValue('');
    setNewDeductionDeducts(true);
    setNewDeductionDeduzLiquido(true);
    setNewDeductionDeduzIrrf(false);
    setNewDeductionOrder(deductions.length + 2);
    setNewDeductionObs('');
    setShowAddDeduction(false);
  };

  return (
    <div id="secao-regra-pensao" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      {/* 1. Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Regra da Pensão, Tributação & Encargos Legais
            </h2>
            <span className="text-xs bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-medium">
              {calculationTypeName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuração integrada de Pensão, INSS (Fase 3) e IRRF (Fase 4)
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded border border-slate-200 font-medium">
          <Shield className="w-3.5 h-3.5 text-slate-600" />
          <span>Motores integrados e auditáveis</span>
        </div>
      </div>

      {/* 2. Tipo de Cálculo & Valores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bloco de Tipo de Regra (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-800">
            Tipo da Regra da Pensão *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onUpdateRule('ruleType', 'percentual')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                rule.ruleType === 'percentual'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Percent className="w-4 h-4 mb-1" />
              <span>Percentual (%)</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateRule('ruleType', 'valor_fixo')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                rule.ruleType === 'valor_fixo'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <DollarSign className="w-4 h-4 mb-1" />
              <span>Valor Fixo (R$)</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateRule('ruleType', 'percentual_adicional')}
              className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                rule.ruleType === 'percentual_adicional'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4 mb-1" />
              <span>Percentual + Fixo</span>
            </button>
          </div>

          {/* Campos Numéricos conforme Tipo (ocultos quando rateio por filhos está ativo) */}
          {!rule.rateioBeneficiariosAtivo && rule.ruleType === 'percentual' && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Percentual da pensão (%) *</span>
                <span className="text-[10px] text-slate-500">Ex: 30,00%</span>
              </label>
              <div className="relative mb-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rule.percentage === 0 ? '' : rule.percentage}
                  placeholder="30,00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateRule('percentage', isNaN(val) ? 0 : val);
                  }}
                  className={`w-full pr-8 pl-3 py-2 text-sm font-mono font-bold rounded-lg border bg-white focus:outline-none transition-colors ${
                    hasRuleError && (!rule.percentage || rule.percentage <= 0)
                      ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400'
                      : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                  }`}
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 font-bold text-sm pointer-events-none">
                  %
                </span>
              </div>

              {/* Atalhos Rápidos */}
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-slate-500 mr-1">Atalhos:</span>
                {COMMON_PERCENTAGES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onUpdateRule('percentage', p)}
                    className={`px-2 py-0.5 text-[11px] rounded border transition-colors cursor-pointer ${
                      rule.percentage === p
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {p.toString().replace('.', ',')}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {!rule.rateioBeneficiariosAtivo && rule.ruleType === 'valor_fixo' && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
                <span>Valor fixo da pensão (R$) *</span>
                <span className="text-[10px] text-slate-500">Ex: R$ 1.500,00</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-xs pointer-events-none">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rule.fixedValue === 0 ? '' : rule.fixedValue}
                  placeholder="0,00"
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    onUpdateRule('fixedValue', isNaN(val) ? 0 : val);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold rounded-lg border bg-white focus:outline-none transition-colors border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          )}

          {!rule.rateioBeneficiariosAtivo && rule.ruleType === 'percentual_adicional' && (
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Percentual base (%) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={rule.percentage === 0 ? '' : rule.percentage}
                    placeholder="20,00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateRule('percentage', isNaN(val) ? 0 : val);
                    }}
                    className="w-full pr-8 pl-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                  />
                  <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 font-bold text-xs pointer-events-none">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Valor fixo adicional (R$)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-mono text-xs pointer-events-none">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={rule.additionalValue === 0 ? '' : rule.additionalValue}
                    placeholder="0,00"
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onUpdateRule('additionalValue', isNaN(val) ? 0 : val);
                    }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rateio por Beneficiário (Cálculo Separado + 1 Evento Único na Folha) */}
          <BeneficiarySplitControl rule={rule} onUpdateRule={onUpdateRule} />
        </div>

        {/* Bloco de Definição da Base da Pensão (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <label className="block text-xs font-semibold text-slate-800">
            Definição da Base de Cálculo da Pensão *
          </label>
          <div className="space-y-1.5">
            {BASE_TYPE_OPTIONS.map((opt) => {
              const isSelected = rule.baseType === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-50/90 shadow-2xs ring-1 ring-slate-900/10'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="pension_base_type"
                    checked={isSelected}
                    onChange={() => onUpdateRule('baseType', opt.id)}
                    className="mt-0.5 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-slate-900">{opt.label}</div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {opt.desc}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. DADOS PARA IRRF & RESOLUÇÃO DE DEPENDÊNCIA CIRCULAR (SEÇÃO 5, 8, 18, 19 E 20 - FASE 4) */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-emerald-200/80 pb-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-emerald-900 text-white font-bold text-[10px] flex items-center justify-center">
              IR
            </span>
            <h3 className="text-xs font-bold text-slate-900 uppercase">
              Dados para o Cálculo do IRRF (Fase 4)
            </h3>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            Tabela progressiva e deduções legais oficiais
          </span>
        </div>

        {/* Alerta de Dependência Circular (Seção 20) */}
        {isCircularActive && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg space-y-2 text-xs text-amber-950">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong>Atenção: Dependência Circular Identificada</strong>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Foi identificada uma dependência entre os cálculos de IRRF e pensão (a pensão deduz o IRRF e o IRRF deduz a pensão). É necessário definir a ordem de cálculo aplicável à regra cadastrada:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <label
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  !irrfConfig.ordemCalculoCircular || irrfConfig.ordemCalculoCircular === 'simultaneo_algebrico'
                    ? 'border-emerald-800 bg-white font-semibold text-emerald-950 shadow-2xs ring-1 ring-emerald-800/20'
                    : 'border-amber-200 bg-amber-100/40 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="ordem_circular"
                    checked={!irrfConfig.ordemCalculoCircular || irrfConfig.ordemCalculoCircular === 'simultaneo_algebrico'}
                    onChange={() => onUpdateIrrfConfig('ordemCalculoCircular', 'simultaneo_algebrico')}
                    className="mt-0.5 text-emerald-800 focus:ring-emerald-800"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Cálculo Simultâneo / Algébrico <span className="text-[10px] text-emerald-800 font-semibold">(Recomendado)</span>
                    </span>
                    <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                      Padrão judicial/folha: Pensão sobre o líquido real e IRRF com dedução da pensão por equação de 1º grau.
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  irrfConfig.ordemCalculoCircular === 'pensao_antes_irrf'
                    ? 'border-slate-900 bg-white font-semibold text-slate-900 shadow-2xs'
                    : 'border-amber-200 bg-amber-100/40 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="ordem_circular"
                    checked={irrfConfig.ordemCalculoCircular === 'pensao_antes_irrf'}
                    onChange={() => onUpdateIrrfConfig('ordemCalculoCircular', 'pensao_antes_irrf')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">Pensão apurada 1º</span>
                    <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                      Pensão calculada sem deduzir IRRF; IRRF deduz a pensão calculada.
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  irrfConfig.ordemCalculoCircular === 'irrf_antes_pensao'
                    ? 'border-slate-900 bg-white font-semibold text-slate-900 shadow-2xs'
                    : 'border-amber-200 bg-amber-100/40 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="ordem_circular"
                    checked={irrfConfig.ordemCalculoCircular === 'irrf_antes_pensao'}
                    onChange={() => onUpdateIrrfConfig('ordemCalculoCircular', 'irrf_antes_pensao')}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-slate-900">IRRF apurado 1º</span>
                    <span className="block text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                      IRRF calculado sem deduzir pensão; Pensão deduz o IRRF calculado.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Grid de Parâmetros do IRRF */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Dependentes */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Dependentes</span>
              </span>
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirDependentes', !irrfConfig.deduzirDependentes)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium cursor-pointer ${
                  irrfConfig.deduzirDependentes ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirDependentes ? 'Ativo' : 'Inativo'}
              </button>
            </div>
            {irrfConfig.deduzirDependentes ? (
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Quantidade de dependentes:</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={irrfConfig.quantidadeDependentes || 0}
                  onChange={(e) => onUpdateIrrfConfig('quantidadeDependentes', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
                />
                <span className="text-[10px] text-emerald-800 block mt-1">
                  Dedução: R$ 189,59 por dependente
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Sem dependentes para dedução</p>
            )}
          </div>

          {/* Dedução de INSS no IRRF */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Deduzir INSS?</span>
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirInss', !irrfConfig.deduzirInss)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium cursor-pointer ${
                  irrfConfig.deduzirInss ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirInss ? 'Sim' : 'Não'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Utiliza automaticamente o valor calculado pelo motor oficial de INSS (Fase 3).
            </p>
          </div>

          {/* Dedução de Pensão Alimentícia no IRRF */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Deduzir Pensão?</span>
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirPensao', !irrfConfig.deduzirPensao)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium cursor-pointer ${
                  irrfConfig.deduzirPensao ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirPensao ? 'Sim' : 'Não'}
              </button>
            </div>
            {irrfConfig.deduzirPensao ? (
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={irrfConfig.usarPensaoCalculadaPeloMotor}
                    onChange={(e) => onUpdateIrrfConfig('usarPensaoCalculadaPeloMotor', e.target.checked)}
                  />
                  <span>Usar valor calculado pelo motor</span>
                </label>
                {!irrfConfig.usarPensaoCalculadaPeloMotor && (
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valor manual (R$)"
                    value={irrfConfig.valorPensaoManual === 0 ? '' : irrfConfig.valorPensaoManual}
                    onChange={(e) => onUpdateIrrfConfig('valorPensaoManual', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
                  />
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Pensão não deduzida do IRRF</p>
            )}
          </div>

          {/* Outras Deduções do IRRF */}
          <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Outras Deduções?</span>
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirOutras', !irrfConfig.deduzirOutras)}
                className={`px-2 py-0.5 text-[11px] rounded font-medium cursor-pointer ${
                  irrfConfig.deduzirOutras ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirOutras ? 'Sim' : 'Não'}
              </button>
            </div>
            {irrfConfig.deduzirOutras ? (
              <div className="space-y-1">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor (R$)"
                  value={irrfConfig.outrasDeducoesValor === 0 ? '' : irrfConfig.outrasDeducoesValor}
                  onChange={(e) => onUpdateIrrfConfig('outrasDeducoesValor', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
                />
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">Sem deduções adicionais</p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Tabela de Verbas: Incidência de INSS, Tributação de IRRF e Pensão (Fases 1, 2, 3 e 4) */}
      <div id="secao-tabela-verbas" className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                Tabela de Verbas: Incidência Previdenciária, Tributária e Pensão
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                ({inssEarnings.length} INSS · {irrfEarnings.length} IRRF · {includedEarnings.length} Pensão)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Configure independentemente se cada rubrica compõe a base do INSS, a base tributável do IRRF e a base da pensão
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddEarning(!showAddEarning)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADICIONAR VERBA</span>
          </button>
        </div>

        {/* Modal / Formulário inline para nova verba */}
        {showAddEarning && (
          <form
            onSubmit={handleAddEarningSubmit}
            className="p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>Nova Verba</span>
              <span className="text-[11px] text-slate-500 font-normal">Preencha os dados e incidências</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="text"
                placeholder="Nome da verba"
                value={newEarningLabel}
                onChange={(e) => setNewEarningLabel(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor (R$)"
                value={newEarningValue}
                onChange={(e) => setNewEarningValue(e.target.value)}
                className="px-2.5 py-1.5 font-mono rounded border border-slate-300 bg-white"
              />
              <select
                value={newEarningIncideInss ? 'sim' : 'nao'}
                onChange={(e) => setNewEarningIncideInss(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Incide INSS? Sim</option>
                <option value="nao">Incide INSS? Não</option>
              </select>
              <select
                value={newEarningIncideIrrf ? 'sim' : 'nao'}
                onChange={(e) => setNewEarningIncideIrrf(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Tributa IRRF? Sim</option>
                <option value="nao">Tributa IRRF? Não</option>
              </select>
              <select
                value={newEarningIncluded ? 'sim' : 'nao'}
                onChange={(e) => setNewEarningIncluded(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Entra na pensão? Sim</option>
                <option value="nao">Entra na pensão? Não</option>
              </select>
              <input
                type="text"
                placeholder="Observação"
                value={newEarningObs}
                onChange={(e) => setNewEarningObs(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddEarning(false)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Salvar Verba
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Verbas Estritamente Conforme Fase 4 */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-2.5 pl-4 pr-2 text-left font-semibold text-slate-900">
                  Verba
                </th>
                <th scope="col" className="py-2.5 px-2 text-right font-semibold text-slate-900 w-32">
                  Valor (R$)
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-indigo-900 w-28 bg-indigo-50/50">
                  Incide INSS?
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-emerald-900 w-28 bg-emerald-50/50">
                  Tributa IRRF?
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-slate-900 w-28">
                  Entra na pensão?
                </th>
                <th scope="col" className="py-2.5 px-2 text-left font-semibold text-slate-900">
                  Observação
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-slate-500 w-10">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {earnings.map((item) => {
                const incideInss = item.incideInss === true;
                const inssNaoDefinido = item.incideInss === null || item.incideInss === undefined;
                const incideIrrf = item.incideIrrf === true;
                const irrfNaoDefinido = item.incideIrrf === null || item.incideIrrf === undefined;
                const entraPensao = item.includedInPensionBase;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Verba */}
                    <td className="py-2 pl-4 pr-2 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.isCustom && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded">
                            custom
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Valor */}
                    <td className="py-2 px-2 text-right">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={item.value === 0 ? '' : item.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdateEarningValue(item.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-full pl-6 pr-1.5 py-1 text-right font-mono text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900 tabular-nums"
                        />
                      </div>
                    </td>

                    {/* Incide INSS? */}
                    <td className="py-2 px-2 text-center bg-indigo-50/20">
                      <button
                        type="button"
                        onClick={() => onToggleEarningInssIncidence(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          inssNaoDefinido
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : incideInss
                            ? 'bg-indigo-100 text-indigo-900 border border-indigo-300 hover:bg-indigo-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {inssNaoDefinido ? (
                          <span>Definir</span>
                        ) : incideInss ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-indigo-700" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Tributa IRRF? (Fase 4) */}
                    <td className="py-2 px-2 text-center bg-emerald-50/20">
                      <button
                        type="button"
                        onClick={() => onToggleEarningIrrfIncidence(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          irrfNaoDefinido
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : incideIrrf
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {irrfNaoDefinido ? (
                          <span>Definir</span>
                        ) : incideIrrf ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Entra na pensão? */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleEarningInclusion(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          entraPensao
                            ? 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800'
                            : 'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {entraPensao ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Observação */}
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        placeholder="Observação"
                        value={item.observation || item.inssObservation || item.irrfObservation || ''}
                        onChange={(e) => onUpdateEarningObservation(item.id, e.target.value)}
                        className="w-full px-2 py-0.5 text-xs rounded border border-slate-200 bg-transparent hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:outline-none"
                      />
                    </td>

                    {/* Ação */}
                    <td className="py-2 px-2 text-center">
                      {item.isCustom ? (
                        <button
                          type="button"
                          onClick={() => onRemoveEarning(item.id)}
                          className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Remover verba"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resumo Comparativo das Três Bases */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-indigo-900 font-semibold block">Soma Base INSS</span>
              <span className="text-[11px] text-indigo-700">{inssEarnings.length} verbas tributáveis</span>
            </div>
            <span className="font-mono font-bold text-sm text-indigo-950 tabular-nums">
              {formatBRL(somaBaseInssPrevia)}
            </span>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-emerald-900 font-semibold block">Soma Rendimentos IRRF</span>
              <span className="text-[11px] text-emerald-700">{irrfEarnings.length} verbas tributáveis</span>
            </div>
            <span className="font-mono font-bold text-sm text-emerald-950 tabular-nums">
              {formatBRL(somaBaseIrrfPrevia)}
            </span>
          </div>

          <div className="p-3 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-800 font-semibold block">Soma Verbas Pensão</span>
              <span className="text-[11px] text-slate-600">{includedEarnings.length} verbas selecionadas</span>
            </div>
            <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
              {formatBRL(somaVerbasParticipantes)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. OUTROS DESCONTOS (Seção 15 - Fase 5) */}
      <div id="secao-outros-descontos" className="space-y-3 pt-3 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-200 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900 uppercase">
                Outros Descontos
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                ({deductions.filter((d) => d.deductFromPensionBase).length} na Pensão · {deductions.filter((d) => d.deduzDoIrrf).length} no IRRF · {deductions.filter((d) => d.deduzDoLiquido !== false).length} no Líquido)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Descontos da folha configuráveis individualmente: participação na pensão, no IRRF e dedução do líquido
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDeduction(!showAddDeduction)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADICIONAR DESCONTO</span>
          </button>
        </div>

        {/* Modal / Formulário inline para novo desconto */}
        {showAddDeduction && (
          <form
            onSubmit={handleAddDeductionSubmit}
            className="p-3 bg-slate-100 rounded-lg border border-slate-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>Novo Desconto</span>
              <span className="text-[11px] text-slate-500 font-normal">Preencha as incidências e valores</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
              <input
                type="text"
                placeholder="Descrição do desconto"
                value={newDeductionLabel}
                onChange={(e) => setNewDeductionLabel(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor (R$)"
                value={newDeductionValue}
                onChange={(e) => setNewDeductionValue(e.target.value)}
                className="px-2.5 py-1.5 font-mono rounded border border-slate-300 bg-white"
              />
              <select
                value={newDeductionDeducts ? 'sim' : 'nao'}
                onChange={(e) => setNewDeductionDeducts(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Participa da Pensão? Sim</option>
                <option value="nao">Participa da Pensão? Não</option>
              </select>
              <select
                value={newDeductionDeduzIrrf ? 'sim' : 'nao'}
                onChange={(e) => setNewDeductionDeduzIrrf(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Participa do IRRF? Não</option>
                <option value="sim">Participa do IRRF? Sim</option>
              </select>
              <select
                value={newDeductionDeduzLiquido ? 'sim' : 'nao'}
                onChange={(e) => setNewDeductionDeduzLiquido(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Deduz do Líquido? Sim</option>
                <option value="nao">Deduz do Líquido? Não</option>
              </select>
              <input
                type="text"
                placeholder="Observação"
                value={newDeductionObs}
                onChange={(e) => setNewDeductionObs(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddDeduction(false)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Salvar Desconto
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Outros Descontos */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                  Descrição
                </th>
                <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-32">
                  Valor (R$)
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-slate-900 w-28">
                  Participa Pensão?
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-emerald-900 w-28 bg-emerald-50/40">
                  Participa IRRF?
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-indigo-900 w-28 bg-indigo-50/40">
                  Deduz Líquido?
                </th>
                <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                  Observação
                </th>
                <th scope="col" className="py-2.5 px-2 text-center font-semibold text-slate-500 w-12">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {deductions.map((item) => {
                const entraPensao = item.deductFromPensionBase;
                const entraIrrf = Boolean(item.deduzDoIrrf);
                const deduzLiquido = item.deduzDoLiquido !== false;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-2 pl-4 pr-3 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {(item.id === 'inss' || item.id === 'irrf') && (
                          <span className="text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded font-mono">
                            oficial
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3 text-right">
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={item.value === 0 ? '' : item.value}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            onUpdateDeductionValue(item.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-full pl-7 pr-2 py-1 text-right font-mono text-xs rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900 tabular-nums"
                        />
                      </div>
                    </td>

                    {/* Participa Pensão */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleDeductionInclusion(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          entraPensao
                            ? 'bg-slate-900 text-white border border-slate-900 hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {entraPensao ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Participa IRRF */}
                    <td className="py-2 px-2 text-center bg-emerald-50/20">
                      <button
                        type="button"
                        onClick={() => onToggleDeductionIrrf && onToggleDeductionIrrf(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          entraIrrf
                            ? 'bg-emerald-800 text-white border border-emerald-900 hover:bg-emerald-900'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {entraIrrf ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Deduz Líquido */}
                    <td className="py-2 px-2 text-center bg-indigo-50/20">
                      <button
                        type="button"
                        onClick={() => onToggleDeductionLiquido && onToggleDeductionLiquido(item.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                          deduzLiquido
                            ? 'bg-indigo-800 text-white border border-indigo-900 hover:bg-indigo-900'
                            : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {deduzLiquido ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-indigo-200" />
                            <span>Sim</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-400" />
                            <span>Não</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Observação"
                        value={item.observation || ''}
                        onChange={(e) => onUpdateDeductionObservation(item.id, e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-transparent hover:border-slate-300 focus:bg-white focus:border-slate-900 focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-2 text-center">
                      {item.isCustom ? (
                        <button
                          type="button"
                          onClick={() => onRemoveDeduction(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          title="Remover dedução"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-300 text-[10px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
