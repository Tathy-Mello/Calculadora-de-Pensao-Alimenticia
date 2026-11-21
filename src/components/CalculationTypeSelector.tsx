/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculationType, CalculationTypeOption } from '../types/pension';
import { Calendar, Palmtree, Gift, FileText, TrendingUp } from 'lucide-react';

interface CalculationTypeSelectorProps {
  selectedType: CalculationType;
  onChange: (type: CalculationType) => void;
}

const CALCULATION_TYPES: (CalculationTypeOption & { icon: React.FC<{ className?: string }> })[] = [
  {
    id: 'folha_mensal',
    label: 'Folha Mensal',
    description: 'Salário regular, adicionais, horas extras e comissões da competência',
    icon: Calendar,
  },
  {
    id: 'ferias',
    label: 'Férias',
    description: 'Remuneração de férias e terço constitucional (1/3)',
    icon: Palmtree,
  },
  {
    id: 'decimo_terceiro',
    label: '13º Salário',
    description: 'Gratificação natalina integral ou parcelas (1ª e 2ª)',
    icon: Gift,
  },
  {
    id: 'rescisao',
    label: 'Rescisão',
    description: 'Verbas rescisórias, saldo de salário e proporcionais',
    icon: FileText,
  },
  {
    id: 'plr',
    label: 'PLR',
    description: 'Participação nos Lucros e Resultados (tributação exclusiva)',
    icon: TrendingUp,
  },
];

export const CalculationTypeSelector: React.FC<CalculationTypeSelectorProps> = ({
  selectedType,
  onChange,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            Tipo de Cálculo
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecione a modalidade da folha para conferência da incidência da pensão
          </p>
        </div>
        <span className="text-xs text-slate-500 mt-2 sm:mt-0 font-medium">
          Seleção única obrigatória
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {CALCULATION_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onChange(type.id)}
              className={`flex flex-col items-start p-3 rounded-lg border text-left transition-all ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5 w-full">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span className="font-semibold text-xs whitespace-nowrap truncate">{type.label}</span>
              </div>
              <p
                className={`text-[11px] leading-tight line-clamp-2 ${
                  isSelected ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {type.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
