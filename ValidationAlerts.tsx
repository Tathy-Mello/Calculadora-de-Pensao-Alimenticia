/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ValidationError } from '../types/pension';
import { AlertCircle, X, ShieldAlert, ArrowRight } from 'lucide-react';

interface ValidationAlertsProps {
  errors: ValidationError[];
  onDismiss: () => void;
}

interface StructuredErrorInfo {
  campo: string;
  problema: string;
  causaConhecida: string;
  acaoRecomendada: string;
}

function parseErrorDetails(err: ValidationError): StructuredErrorInfo {
  const f = err.field;
  const m = err.message;

  if (f === 'matricula') {
    return {
      campo: 'Matrícula do Colaborador',
      problema: 'Identificador do colaborador não informado.',
      causaConhecida: 'A matrícula é o identificador único e obrigatório de auditoria e cálculo.',
      acaoRecomendada: 'Preencha o campo "Matrícula" com o código funcional do colaborador no sistema.',
    };
  }
  if (f === 'percentage') {
    return {
      campo: 'Percentual da Pensão (%)',
      problema: 'Percentual não preenchido ou menor/igual a zero.',
      causaConhecida: 'A regra selecionada exige a definição do percentual determinado pelo juízo.',
      acaoRecomendada: 'Informe o percentual fixado (ex: 20%, 30%) no painel da regra de pensão.',
    };
  }
  if (f === 'fixedValue') {
    return {
      campo: 'Valor Fixo da Pensão (R$)',
      problema: 'Valor fixo não informado ou zerado.',
      causaConhecida: 'A modalidade de pensão por valor fixo requer a quantia nominal estipulada.',
      acaoRecomendada: 'Informe o valor em reais (R$) estipulado no termo de acordo ou sentença.',
    };
  }
  if (f === 'earnings') {
    return {
      campo: 'Verbas Salariais / Proventos',
      problema: 'Nenhum provento com valor positivo informado.',
      causaConhecida: 'A apuração de folha, encargos e pensão requer pelo menos uma verba de rendimento.',
      acaoRecomendada: 'Informe o salário base ou outra rubrica de remuneração no formulário.',
    };
  }
  if (f.startsWith('ano_')) {
    return {
      campo: 'Ano da Tabela Tributária (INSS/IRRF)',
      problema: 'Tabela oficial do ano informado não foi localizada.',
      causaConhecida: 'O sistema requer vigência explícita cadastrada para o ano informado.',
      acaoRecomendada: 'Selecione um ano de vigência com tabela cadastrada (ex: 2026, 2025 ou 2024).',
    };
  }
  if (f === 'dependencia_circular_irrf_pensao') {
    return {
      campo: 'Resolução Simultânea IRRF & Pensão',
      problema: 'Configuração circular inconsistente.',
      causaConhecida: 'Dedução mútua configurada sem base de cálculo convergente.',
      acaoRecomendada: 'Revise os parâmetros de dependentes ou dedução da pensão no motor de IRRF.',
    };
  }

  // Genérico estruturado
  return {
    campo: f || 'Dados de Entrada',
    problema: m,
    causaConhecida: 'Inconsistência nos parâmetros necessários para o cálculo seguro.',
    acaoRecomendada: 'Verifique e preencha os dados do campo indicado antes de acionar o cálculo.',
  };
}

export const ValidationAlerts: React.FC<ValidationAlertsProps> = ({ errors, onDismiss }) => {
  if (errors.length === 0) return null;

  return (
    <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                O que precisa ser corrigido para calcular:
              </h3>
              <p className="text-[11px] text-rose-700 mt-0.5">
                Em conformidade com as diretrizes do DP, a calculadora não inventa nem presume dados ausentes. Corrija os pontos abaixo:
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {errors.map((err, idx) => {
                const info = parseErrorDetails(err);
                return (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-lg border border-rose-200 text-xs text-slate-800 space-y-1 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-rose-800 uppercase tracking-wider text-[11px]">
                        Campo: {info.campo}
                      </span>
                    </div>
                    <div className="text-rose-900 font-semibold">
                      • Problema: {info.problema}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      • Causa conhecida: {info.causaConhecida}
                    </div>
                    <div className="text-emerald-800 font-medium text-[11px] flex items-center gap-1 mt-0.5">
                      <ArrowRight className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span><strong>Ação recomendada:</strong> {info.acaoRecomendada}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-700 p-1 rounded-md transition-colors cursor-pointer shrink-0"
          title="Fechar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
