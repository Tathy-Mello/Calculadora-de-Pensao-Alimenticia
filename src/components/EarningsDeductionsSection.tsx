/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DeductionItem, EarningItem } from '../types/pension';
import { formatBRL, parseBRLInput } from '../utils/formatters';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface EarningsDeductionsSectionProps {
  earnings: EarningItem[];
  deductions: DeductionItem[];
  onUpdateEarning: (id: string, value: number) => void;
  onUpdateDeduction: (id: string, value: number) => void;
  onAddCustomEarning: (label: string, value: number) => void;
  onRemoveCustomEarning: (id: string) => void;
  onAddCustomDeduction: (label: string, value: number) => void;
  onRemoveCustomDeduction: (id: string) => void;
}

export const EarningsDeductionsSection: React.FC<EarningsDeductionsSectionProps> = ({
  earnings,
  deductions,
  onUpdateEarning,
  onUpdateDeduction,
  onAddCustomEarning,
  onRemoveCustomEarning,
  onAddCustomDeduction,
  onRemoveCustomDeduction,
}) => {
  const [newEarningLabel, setNewEarningLabel] = useState('');
  const [newEarningValue, setNewEarningValue] = useState('');
  const [isAddingEarning, setIsAddingEarning] = useState(false);

  const [newDeductionLabel, setNewDeductionLabel] = useState('');
  const [newDeductionValue, setNewDeductionValue] = useState('');
  const [isAddingDeduction, setIsAddingDeduction] = useState(false);

  const totalProventos = earnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalDescontos = deductions.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const handleAddEarningSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEarningLabel.trim()) return;
    const val = parseBRLInput(newEarningValue);
    onAddCustomEarning(newEarningLabel.trim(), val);
    setNewEarningLabel('');
    setNewEarningValue('');
    setIsAddingEarning(false);
  };

  const handleAddDeductionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeductionLabel.trim()) return;
    const val = parseBRLInput(newDeductionValue);
    onAddCustomDeduction(newDeductionLabel.trim(), val);
    setNewDeductionLabel('');
    setNewDeductionValue('');
    setIsAddingDeduction(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Dados para o Cálculo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Informe os valores de proventos e descontos apurados para a competência
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono mt-2 sm:mt-0">
          <span className="text-emerald-700 font-medium">
            Proventos: {formatBRL(totalProventos)}
          </span>
          <span className="text-rose-700 font-medium">
            Descontos: {formatBRL(totalDescontos)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna de Proventos (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Proventos (Vencimentos)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingEarning(!isAddingEarning)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Verba</span>
              </button>
            </div>

            {/* Modal/Form inline para nova verba */}
            {isAddingEarning && (
              <form
                onSubmit={handleAddEarningSubmit}
                className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Nome da verba (ex: DSR)"
                  value={newEarningLabel}
                  onChange={(e) => setNewEarningLabel(e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  autoFocus
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor (R$)"
                  value={newEarningValue}
                  onChange={(e) => setNewEarningValue(e.target.value)}
                  className="w-full sm:w-28 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-900 text-white text-xs rounded font-medium hover:bg-slate-800"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingEarning(false)}
                    className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Grid de proventos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {earnings.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={`earning-${item.id}`}
                      className="text-xs font-medium text-slate-800 truncate"
                      title={item.label}
                    >
                      {item.label}
                    </label>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomEarning(item.id)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Remover verba personalizada"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                      R$
                    </span>
                    <input
                      id={`earning-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.value === 0 ? '' : item.value}
                      placeholder="0,00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateEarning(item.id, isNaN(val) ? 0 : val);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono text-right rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Subtotal de Proventos:</span>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
              {formatBRL(totalProventos)}
            </span>
          </div>
        </div>

        {/* Coluna de Descontos (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-4 lg:pt-0 lg:pl-6">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase">
                  Descontos da Folha
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingDeduction(!isAddingDeduction)}
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Desconto</span>
              </button>
            </div>

            {/* Nota de transparência de Fase 1 */}
            <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-lg flex items-start gap-2 text-[11px] text-amber-900">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Nesta fase, insira os valores de INSS e IRRF já apurados pela folha. Alíquotas fictícias não serão inventadas.
              </span>
            </div>

            {/* Modal/Form inline para novo desconto */}
            {isAddingDeduction && (
              <form
                onSubmit={handleAddDeductionSubmit}
                className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Nome (ex: Vale Refeição)"
                  value={newDeductionLabel}
                  onChange={(e) => setNewDeductionLabel(e.target.value)}
                  className="flex-1 w-full px-2.5 py-1.5 text-xs rounded border border-slate-300 bg-white"
                  autoFocus
                />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor (R$)"
                  value={newDeductionValue}
                  onChange={(e) => setNewDeductionValue(e.target.value)}
                  className="w-full sm:w-28 px-2.5 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white"
                />
                <div className="flex items-center gap-1 w-full sm:w-auto">
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-slate-900 text-white text-xs rounded font-medium hover:bg-slate-800"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingDeduction(false)}
                    className="px-2 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {/* Lista de descontos */}
            <div className="space-y-2.5">
              {deductions.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor={`deduction-${item.id}`}
                      className="text-xs font-medium text-slate-800 truncate"
                      title={item.label}
                    >
                      {item.label}
                    </label>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomDeduction(item.id)}
                        className="text-slate-400 hover:text-red-600 p-0.5"
                        title="Remover desconto personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                      R$
                    </span>
                    <input
                      id={`deduction-${item.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.value === 0 ? '' : item.value}
                      placeholder="0,00"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onUpdateDeduction(item.id, isNaN(val) ? 0 : val);
                      }}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono text-right rounded border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 tabular-nums"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Subtotal de Descontos:</span>
            <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
              {formatBRL(totalDescontos)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
