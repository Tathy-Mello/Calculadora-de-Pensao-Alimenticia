/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CalculationType, IdentificationData } from '../types/pension';
import { Hash, CalendarDays, Clock, Tag, Split, Info } from 'lucide-react';
import { computeFeriasSplitInfo } from '../utils/feriasSplit';
import { formatPercentage } from '../utils/formatters';

interface IdentificationSectionProps {
  data: IdentificationData;
  onChange: (field: keyof IdentificationData, value: any) => void;
  hasError?: boolean;
}

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const CALC_LABELS: Record<CalculationType, string> = {
  folha_mensal: 'Folha Mensal',
  ferias: 'Férias',
  decimo_terceiro: '13º Salário',
  rescisao: 'Rescisão',
  plr: 'PLR',
};

export const IdentificationSection: React.FC<IdentificationSectionProps> = ({
  data,
  onChange,
  hasError,
}) => {
  const isFerias = data.tipoCalculo === 'ferias';
  const feriasSplit = isFerias ? computeFeriasSplitInfo(data.dataInicioFerias, data.diasFerias) : null;
  const rateioAtivo =
    isFerias &&
    Boolean(feriasSplit?.spansTwoMonths) &&
    data.ativarRateioInssFerias !== false;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
            {isFerias ? 'Dados das Férias' : 'Identificação do Cálculo'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isFerias
              ? 'Parâmetros de identificação, datas e quantidade de dias de férias (sem nome ou CPF)'
              : 'Dados mínimos de identificação para rastreabilidade (sem exigência de nome ou CPF)'}
          </p>
        </div>
        <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium mt-2 sm:mt-0">
          LGPD Compliance: Sem dados pessoais sensíveis
        </span>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFerias ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-4`}>
        {/* Matrícula ou Identificador (Obrigatório) */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
            <span>Matrícula / ID *</span>
            <span className="text-[10px] text-red-500 font-normal">Obrigatório</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Hash className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={data.matricula}
              onChange={(e) => onChange('matricula', e.target.value)}
              placeholder="Ex: 01482"
              className={`w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg border bg-white focus:outline-none transition-colors ${
                hasError && !data.matricula.trim()
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400 bg-red-50/20'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
              }`}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Identificador do colaborador
          </p>
        </div>

        {/* Ano */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Ano
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
            <input
              type="number"
              min={2000}
              max={2050}
              value={data.ano}
              onChange={(e) => onChange('ano', parseInt(e.target.value) || new Date().getFullYear())}
              className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Exercício do cálculo</p>
        </div>

        {/* Férias: Período de Referência / Folha: Competência */}
        {isFerias ? (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Período de Referência
            </label>
            <input
              type="text"
              value={data.periodoAquisitivoOuReferencia || ''}
              onChange={(e) => onChange('periodoAquisitivoOuReferencia', e.target.value)}
              placeholder="Ex: 2025/2026"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">Período aquisitivo / ref.</p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Competência
            </label>
            <select
              value={data.competencia}
              onChange={(e) => onChange('competencia', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            >
              <option value="">Selecione a competência</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Mês de apuração</p>
          </div>
        )}

        {/* Férias: Data de Início das Férias */}
        {isFerias && (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Início das Férias
            </label>
            <input
              type="date"
              value={data.dataInicioFerias || ''}
              onChange={(e) => onChange('dataInicioFerias', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">Primeiro dia de gozo</p>
          </div>
        )}

        {/* Data de Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
            <span>Data de Pagamento *</span>
            {isFerias && <span className="text-[10px] text-slate-500 font-normal">Até 2 dias antes</span>}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <input
              type="date"
              value={data.dataPagamento}
              onChange={(e) => onChange('dataPagamento', e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Fato gerador do IRRF</p>
        </div>

        {/* Férias: Quantidade de Dias de Férias */}
        {isFerias && (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center justify-between">
              <span>Dias de Férias *</span>
              <span className="text-[10px] text-indigo-700 font-semibold">Ex: 30, 20</span>
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={data.diasFerias || 30}
              onChange={(e) => onChange('diasFerias', parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <p className="text-[11px] text-slate-500 mt-1">Quantidade de dias gozados</p>
          </div>
        )}

        {/* Tipo de cálculo (Visual/Status) - caso folha mensal */}
        {!isFerias && (
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Tipo Selecionado
            </label>
            <div className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
              <Tag className="w-3.5 h-3.5 text-slate-600" />
              <span className="font-semibold truncate">{CALC_LABELS[data.tipoCalculo]}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Definido no seletor principal</p>
          </div>
        )}
      </div>

      {/* Painel Automático de Férias Partidas entre Competências (Rateio e Recálculo de INSS) */}
      {isFerias && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          {feriasSplit?.isValid && feriasSplit.spansTwoMonths ? (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center shrink-0">
                    <Split className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Férias Partidas entre Competências Detectadas
                    </h3>
                    <p className="text-[11px] text-indigo-800">
                      Período de gozo: <strong>{feriasSplit.dataInicioBr}</strong> a <strong>{feriasSplit.dataFimBr}</strong> ({feriasSplit.totalDias} dias)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded bg-white border border-indigo-200 text-indigo-950 font-semibold">
                    {feriasSplit.mes1Rotulo}: {feriasSplit.diasMes1}/{feriasSplit.totalDias} dias ({formatPercentage(feriasSplit.proporcaoMes1 * 100)})
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white border border-indigo-200 text-slate-800 font-semibold">
                    {feriasSplit.mes2Rotulo}: {feriasSplit.diasMes2}/{feriasSplit.totalDias} dias ({formatPercentage(feriasSplit.proporcaoMes2 * 100)})
                  </span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-indigo-200/80 cursor-pointer hover:border-indigo-300 transition-colors">
                <input
                  type="checkbox"
                  checked={rateioAtivo}
                  onChange={(e) => onChange('ativarRateioInssFerias', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-900 focus:ring-indigo-900"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 block">
                    Calcular no recibo apenas o INSS proporcional a {feriasSplit.mes1Rotulo} ({feriasSplit.diasMes1} de {feriasSplit.totalDias} dias)
                  </span>
                  <span className="text-[11px] text-slate-600">
                    O IRRF e a Pensão do recibo deduzirão este INSS proporcional de {feriasSplit.mes1Rotulo}, e o sistema demonstrará o recálculo do INSS na folha de {feriasSplit.mes2Rotulo} ({feriasSplit.diasMes2} de {feriasSplit.totalDias} dias).
                  </span>
                </div>
              </label>

              {rateioAtivo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-lg border border-indigo-200/80">
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Remuneração Trabalhada em {feriasSplit.mes2Rotulo} (para recálculo do INSS)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00 (ex: saldo de salário dos dias trabalhados)"
                        value={data.remuneracaoTrabalhadaMes2Ferias ? data.remuneracaoTrabalhadaMes2Ferias : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onChange('remuneracaoTrabalhadaMes2Ferias', isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white focus:outline-none focus:border-indigo-900"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Opcional: some os dias trabalhados em {feriasSplit.mes2Rotulo} para simular o INSS exato recalculado na folha seguinte.
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-indigo-200/80">
                    <label className="block text-[11px] font-semibold text-slate-800 mb-1">
                      Remuneração Trabalhada em {feriasSplit.mes1Rotulo} (Opcional — padrão R$ 0,00 no recibo)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-mono pointer-events-none">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00 (apenas INSS s/ férias de 12/2026)"
                        value={data.remuneracaoTrabalhadaMes1Ferias ? data.remuneracaoTrabalhadaMes1Ferias : ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onChange('remuneracaoTrabalhadaMes1Ferias', isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded border border-slate-300 bg-white focus:outline-none focus:border-indigo-900"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Deixe em R$ 0,00 para calcular no recibo exclusivamente o INSS proporcional das férias em {feriasSplit.mes1Rotulo}.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : feriasSplit?.isValid ? (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs text-slate-700">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Gozo integral na mesma competência (<strong>{feriasSplit.dataInicioBr}</strong> a <strong>{feriasSplit.dataFimBr}</strong> · {feriasSplit.mes1Rotulo}). O INSS incide integralmente no recibo.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                Dica de DP: Informe a <strong>Data de Início das Férias</strong> e os <strong>Dias de Férias</strong> (ex: 28/12/2026 e 20 dias) para habilitar automaticamente o rateio de INSS por competência e o recálculo da folha seguinte.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
