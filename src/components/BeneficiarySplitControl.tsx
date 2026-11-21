/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PensionBeneficiaryItem, PensionRuleConfig } from '../types/pension';
import { formatBRL, formatPercentage } from '../utils/formatters';
import { Users, Plus, Trash2, Split, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BeneficiarySplitControlProps {
  rule: PensionRuleConfig;
  onUpdateRule: (field: keyof PensionRuleConfig, value: any) => void;
}

export const BeneficiarySplitControl: React.FC<BeneficiarySplitControlProps> = ({
  rule,
  onUpdateRule,
}) => {
  const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
  const isActive = Boolean(rule.rateioBeneficiariosAtivo);
  const beneficiaries: PensionBeneficiaryItem[] = rule.beneficiarios || [];

  const totalPct = round2(beneficiaries.reduce((acc, b) => acc + (b.percentual || 0), 0));
  const totalFixed = round2(beneficiaries.reduce((acc, b) => acc + (b.valorFixo || 0), 0));

  const buildEqualList = (count: number): PensionBeneficiaryItem[] => {
    const targetPct = rule.percentage > 0 ? rule.percentage : totalPct > 0 ? totalPct : 30;
    const targetFix =
      rule.ruleType === 'valor_fixo'
        ? rule.fixedValue > 0
          ? rule.fixedValue
          : totalFixed
        : (rule.additionalValue || 0) > 0
        ? rule.additionalValue || 0
        : totalFixed;

    const basePct = round2(targetPct / count);
    const baseFix = round2(targetFix / count);
    let accPct = 0;
    let accFix = 0;

    return Array.from({ length: count }, (_, idx) => {
      const pct = idx === count - 1 ? round2(Math.max(0, targetPct - accPct)) : basePct;
      const fix = idx === count - 1 ? round2(Math.max(0, targetFix - accFix)) : baseFix;
      accPct = round2(accPct + pct);
      accFix = round2(accFix + fix);
      const existing = beneficiaries[idx];
      return {
        id: existing?.id || `ben_${Date.now()}_${idx + 1}`,
        label: existing?.label || `${idx + 1}º Filho`,
        percentual: pct,
        valorFixo: fix,
      };
    });
  };

  const handleSetChildrenCount = (count: number) => {
    if (count <= 1) {
      onUpdateRule('rateioBeneficiariosAtivo', false);
      return;
    }
    if (!isActive) {
      onUpdateRule('rateioBeneficiariosAtivo', true);
    }
    onUpdateRule('beneficiarios', buildEqualList(count));
  };

  const handleUpdateItem = (
    id: string,
    field: keyof PensionBeneficiaryItem,
    value: string | number
  ) => {
    const next = beneficiaries.map((b) => (b.id === id ? { ...b, [field]: value } : b));
    onUpdateRule('beneficiarios', next);
  };

  const handleAddBeneficiary = () => {
    const nextIndex = beneficiaries.length + 1;
    const newItem: PensionBeneficiaryItem = {
      id: `ben_${Date.now()}_${nextIndex}`,
      label: `${nextIndex}º Filho`,
      percentual: 0,
      valorFixo: 0,
    };
    onUpdateRule('beneficiarios', [...beneficiaries, newItem]);
  };

  const handleRemoveBeneficiary = (id: string) => {
    if (beneficiaries.length <= 2) return;
    onUpdateRule(
      'beneficiarios',
      beneficiaries.filter((b) => b.id !== id)
    );
  };

  const handleEqualSplit = () => {
    const count = Math.max(2, beneficiaries.length);
    onUpdateRule('beneficiarios', buildEqualList(count));
  };

  const pctExceeds100 = rule.ruleType !== 'valor_fixo' && totalPct > 100;

  return (
    <div className="p-3.5 bg-indigo-50/50 border border-indigo-200 rounded-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-start gap-2">
          <div className="w-6 h-6 rounded bg-indigo-900 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-900">
                Pensão para Mais de 1 Filho (Cálculo Separado → 1 Evento na Folha)
              </span>
              {isActive && (
                <span className="text-[10px] font-semibold bg-indigo-900 text-white px-2 py-0.5 rounded">
                  Soma no Evento Único
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
              Ex.: 1º filho = 15% + 2º filho = 15%. O cálculo é feito separado por filho e o evento de pensão exibe a soma dos percentuais (30%) e dos valores.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => handleSetChildrenCount(1)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
              !isActive
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
          >
            1 filho
          </button>
          <button
            type="button"
            onClick={() => handleSetChildrenCount(2)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
              isActive && beneficiaries.length === 2
                ? 'bg-indigo-900 text-white border-indigo-900'
                : 'bg-white text-indigo-950 border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            2 filhos
          </button>
          <button
            type="button"
            onClick={() => handleSetChildrenCount(3)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
              isActive && beneficiaries.length >= 3
                ? 'bg-indigo-900 text-white border-indigo-900'
                : 'bg-white text-indigo-950 border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            3+ filhos
          </button>
        </div>
      </div>

      {isActive && (
        <div className="space-y-2.5 pt-2 border-t border-indigo-200/80">
          {/* Barra de ações rápidas */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-600">
              Informe o percentual de cada filho: a base é multiplicada individualmente por cada percentual e somada em 1 evento único.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleEqualSplit}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-white border border-indigo-300 text-indigo-900 rounded hover:bg-indigo-100/70 transition-colors cursor-pointer"
                title="Dividir o total igualmente entre os filhos"
              >
                <Split className="w-3 h-3" />
                <span>Dividir igualmente</span>
              </button>
              <button
                type="button"
                onClick={handleAddBeneficiary}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Filho</span>
              </button>
            </div>
          </div>

          {/* Lista de Beneficiários */}
          <div className="space-y-2">
            {beneficiaries.map((ben, idx) => (
              <div
                key={ben.id}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 bg-white rounded-md border border-indigo-200/80"
              >
                <div className="sm:col-span-6">
                  <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                    Filho / Beneficiário {idx + 1}
                  </label>
                  <input
                    type="text"
                    value={ben.label}
                    onChange={(e) => handleUpdateItem(ben.id, 'label', e.target.value)}
                    placeholder={`${idx + 1}º Filho`}
                    className="w-full px-2.5 py-1 text-xs font-medium rounded border border-slate-300 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {rule.ruleType !== 'valor_fixo' && (
                  <div className={rule.ruleType === 'percentual' ? 'sm:col-span-5' : 'sm:col-span-3'}>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      Percentual (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={ben.percentual === 0 ? '' : ben.percentual}
                        placeholder="15,00"
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          handleUpdateItem(ben.id, 'percentual', isNaN(v) ? 0 : v);
                        }}
                        className="w-full pr-6 pl-2.5 py-1 text-xs font-mono font-bold rounded border border-slate-300 focus:border-slate-900 focus:outline-none tabular-nums"
                      />
                      <span className="absolute inset-y-0 right-0 pr-2 flex items-center text-[11px] font-bold text-slate-500 pointer-events-none">
                        %
                      </span>
                    </div>
                  </div>
                )}

                {rule.ruleType !== 'percentual' && (
                  <div className={rule.ruleType === 'valor_fixo' ? 'sm:col-span-5' : 'sm:col-span-2'}>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                      {rule.ruleType === 'valor_fixo' ? 'Valor Fixo (R$)' : 'Adicional (R$)'}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-[10px] font-mono text-slate-500 pointer-events-none">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ben.valorFixo === 0 ? '' : ben.valorFixo}
                        placeholder="0,00"
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          handleUpdateItem(ben.id, 'valorFixo', isNaN(v) ? 0 : v);
                        }}
                        className="w-full pl-7 pr-2 py-1 text-xs font-mono font-bold rounded border border-slate-300 focus:border-slate-900 focus:outline-none tabular-nums"
                      />
                    </div>
                  </div>
                )}

                <div className="sm:col-span-1 flex justify-end sm:pt-4">
                  <button
                    type="button"
                    disabled={beneficiaries.length <= 2}
                    onClick={() => handleRemoveBeneficiary(ben.id)}
                    title={
                      beneficiaries.length <= 2
                        ? 'Mínimo de 2 filhos para rateio'
                        : 'Remover filho'
                    }
                    className={`p-1 rounded transition-colors ${
                      beneficiaries.length <= 2
                        ? 'text-slate-300 cursor-not-allowed'
                        : 'text-slate-400 hover:text-rose-600 cursor-pointer'
                    }`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Rodapé de conferência do rateio */}
          <div
            className={`p-2 rounded border text-[11px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 ${
              pctExceeds100
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-white border-indigo-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {pctExceeds100 ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              )}
              <span>
                Soma no Evento de Pensão ({beneficiaries.length} filhos):{' '}
                <strong className="font-mono text-slate-900">
                  {rule.ruleType === 'percentual'
                    ? `${formatPercentage(totalPct)} (${beneficiaries
                        .map((b) => formatPercentage(b.percentual || 0))
                        .join(' + ')})`
                    : rule.ruleType === 'valor_fixo'
                    ? formatBRL(totalFixed)
                    : `${formatPercentage(totalPct)} + ${formatBRL(totalFixed)}`}
                </strong>
              </span>
            </div>
            <span className="text-[10px] font-semibold text-indigo-900">
              Cálculo separado: Base × % de cada filho → Soma em 1 evento único na folha
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
