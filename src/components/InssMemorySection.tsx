/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InssCalculationResult } from '../types/inss';
import { FeriasRateioInssResumo } from '../types/pension';
import { formatBRL, formatPercentage } from '../utils/formatters';
import { ShieldCheck, ChevronDown, ChevronUp, Copy, Check, Table, AlertCircle } from 'lucide-react';

interface InssMemorySectionProps {
  inssResult: InssCalculationResult | null | undefined;
  feriasRateioInss?: FeriasRateioInssResumo;
}

export const InssMemorySection: React.FC<InssMemorySectionProps> = ({ inssResult, feriasRateioInss }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!inssResult) return null;

  const handleCopyInssMemory = () => {
    let text = `========================================================\n`;
    text += `MEMÓRIA DE CÁLCULO DO INSS — FASE 3 (MOTOR OFICIAL)\n`;
    text += `Exercício / Ano: ${inssResult.ano} | Competência: ${inssResult.competencia}\n`;
    text += `Fonte Oficial: ${inssResult.tabelaUtilizada.fonte}\n`;
    text += `Data da Apuração: ${inssResult.calculatedAt}\n`;
    text += `========================================================\n\n`;

    inssResult.memorySteps.forEach((step) => {
      text += `[${step.title.toUpperCase()}]\n`;
      text += `${step.description}\n`;
      if (step.details && step.details.length > 0) {
        step.details.forEach((d) => {
          text += `  • ${d.label}: ${d.value}${d.extra ? ` (${d.extra})` : ''}\n`;
        });
      }
      if (step.formula) {
        text += `  Fórmula / Operação:\n  ${step.formula.replace(/\n/g, '\n  ')}\n`;
      }
      if (step.resultHighlight) {
        text += `  Resultado: ${step.resultHighlight}\n`;
      }
      text += `\n`;
    });

    text += `========================================================\n`;
    text += `BASE PREVIDENCIÁRIA EFETIVA: ${formatBRL(inssResult.baseInssEfetiva)}\n`;
    text += `TOTAL DE INSS CALCULADO: ${formatBRL(inssResult.valorInssFinal)}\n`;
    text += `========================================================\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="memoria-inss" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-bold text-xs">
            INSS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Memória de Cálculo — INSS
              </h2>
              <span className="text-[11px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded border border-indigo-200 font-medium">
                Tabela Oficial {inssResult.ano}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo progressivo oficial por faixas (Emenda Constitucional 103/2019) e apuração de teto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyInssMemory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            title="Copiar memória de cálculo do INSS"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiada!' : 'Copiar Memória INSS'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Card Resumo do INSS */}
          <div className="p-4 bg-indigo-950 text-white rounded-lg border border-indigo-900 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2">
              <div>
                <span className="font-bold text-indigo-300 uppercase tracking-wider text-[11px] block">
                  Demonstrativo da Contribuição Previdenciária (RGPS)
                </span>
                <span className="text-[10px] text-indigo-400 font-sans">
                  Fonte: {inssResult.tabelaUtilizada.fonte}
                </span>
              </div>
              <span className="text-[11px] text-indigo-300">
                Teto RGPS: {formatBRL(inssResult.tabelaUtilizada.tetoPrevidenciario)}
              </span>
            </div>

            {/* Verbas com Incidência e Base */}
            <div className="space-y-1">
              <span className="font-bold text-emerald-400 block">VERBAS COM INCIDÊNCIA DE INSS:</span>
              <div className="pl-3 space-y-0.5 text-indigo-100">
                {inssResult.verbasComIncidencia.length > 0 ? (
                  inssResult.verbasComIncidencia.map((v, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{v.label}:</span>
                      <span className="tabular-nums font-semibold text-white">{formatBRL(v.valor)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-indigo-400 italic">Nenhuma verba com incidência de INSS</div>
                )}
              </div>
            </div>

            {/* Base Apurada vs Teto */}
            <div className="pt-2 border-t border-indigo-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <div>
                <span className="text-indigo-300">Base Previdenciária Original:</span>{' '}
                <span className="font-bold text-white tabular-nums">{formatBRL(inssResult.baseInssOriginal)}</span>
              </div>
              <div>
                <span className="text-indigo-300">Base Efetiva (Limitada ao Teto):</span>{' '}
                <span className="font-bold text-emerald-300 tabular-nums">{formatBRL(inssResult.baseInssEfetiva)}</span>
              </div>
            </div>

            {/* Tabela de Faixas Progressivas Calculadas */}
            {inssResult.faixasCalculadas.length > 0 && (
              <div className="pt-2 border-t border-indigo-800/80 space-y-1.5">
                <span className="font-bold text-indigo-300 block uppercase text-[10px]">
                  Detalhamento por Faixa Progressiva:
                </span>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-[11px] divide-y divide-indigo-900">
                    <thead>
                      <tr className="text-indigo-400">
                        <th className="text-left py-1">Faixa</th>
                        <th className="text-right py-1">Alíquota</th>
                        <th className="text-right py-1">Intervalo</th>
                        <th className="text-right py-1">Base na Faixa</th>
                        <th className="text-right py-1">Contribuição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-900/50">
                      {inssResult.faixasCalculadas.map((f) => (
                        <tr key={f.faixaNumero} className={f.baseConsideradaNaFaixa > 0 ? 'text-white' : 'text-indigo-500'}>
                          <td className="py-1">Faixa {f.faixaNumero}</td>
                          <td className="text-right py-1">{formatPercentage(f.aliquota)}</td>
                          <td className="text-right py-1 font-sans">
                            {formatBRL(f.faixaInicial)} a {formatBRL(f.faixaFinal)}
                          </td>
                          <td className="text-right py-1 tabular-nums font-semibold">
                            {formatBRL(f.baseConsideradaNaFaixa)}
                          </td>
                          <td className="text-right py-1 tabular-nums font-bold text-emerald-300">
                            {formatBRL(f.contribuicaoDaFaixa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Resultado Final INSS */}
            <div className="pt-3 border-t border-indigo-800 flex justify-between items-center text-sm font-bold text-white">
              <span className="uppercase text-emerald-400">
                {feriasRateioInss?.ativo
                  ? `TOTAL INSS NO RECIBO (${feriasRateioInss.competencia1Rotulo}):`
                  : 'TOTAL INSS CALCULADO:'}
              </span>
              <span className="text-base text-emerald-300 tabular-nums">
                {formatBRL(inssResult.valorInssFinal)}
              </span>
            </div>
          </div>

          {/* Card de Recálculo na Folha Seguinte (quando Férias Partidas ativo) */}
          {feriasRateioInss?.ativo && (
            <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 font-mono text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-2 gap-1">
                <div>
                  <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] block">
                    Recálculo do INSS na Folha Seguinte — {feriasRateioInss.competencia2Nome} ({feriasRateioInss.diasMes2}/{feriasRateioInss.totalDiasFerias} dias)
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {feriasRateioInss.tabelaMes2Observacao}
                  </span>
                </div>
                <span className="text-[11px] text-slate-300">
                  Base Folha {feriasRateioInss.competencia2Rotulo}: {formatBRL(feriasRateioInss.baseTotalInssMes2)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-800/70 border border-slate-700">
                  <span className="text-slate-400 block">Fração Férias ({feriasRateioInss.competencia2Rotulo})</span>
                  <span className="font-bold text-white tabular-nums">{formatBRL(feriasRateioInss.baseInssFeriasMes2)}</span>
                </div>
                <div className="p-2 rounded bg-slate-800/70 border border-slate-700">
                  <span className="text-slate-400 block">Remuneração Trabalhada ({feriasRateioInss.competencia2Rotulo})</span>
                  <span className="font-bold text-white tabular-nums">{formatBRL(feriasRateioInss.remuneracaoTrabalhadaMes2)}</span>
                </div>
                <div className="p-2 rounded bg-slate-800/70 border border-slate-700">
                  <span className="text-slate-400 block">Base Total INSS ({feriasRateioInss.competencia2Rotulo})</span>
                  <span className="font-bold text-emerald-300 tabular-nums">
                    {formatBRL(feriasRateioInss.baseTotalInssMes2)}
                    {feriasRateioInss.tetoAplicadoMes2 ? ' (Teto)' : ''}
                  </span>
                </div>
              </div>

              {feriasRateioInss.faixasMes2.length > 0 && (
                <div className="overflow-x-auto pt-1">
                  <table className="min-w-full text-[11px] divide-y divide-slate-800">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-1">Faixa</th>
                        <th className="text-right py-1">Alíquota</th>
                        <th className="text-right py-1">Intervalo</th>
                        <th className="text-right py-1">Base na Faixa</th>
                        <th className="text-right py-1">Contribuição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {feriasRateioInss.faixasMes2.map((f) => (
                        <tr key={f.faixaNumero} className={f.baseConsideradaNaFaixa > 0 ? 'text-white' : 'text-slate-600'}>
                          <td className="py-1">Faixa {f.faixaNumero}</td>
                          <td className="text-right py-1">{formatPercentage(f.aliquota)}</td>
                          <td className="text-right py-1 font-sans">
                            {formatBRL(f.faixaInicial)} a {formatBRL(f.faixaFinal)}
                          </td>
                          <td className="text-right py-1 tabular-nums font-semibold">
                            {formatBRL(f.baseConsideradaNaFaixa)}
                          </td>
                          <td className="text-right py-1 tabular-nums font-bold text-amber-300">
                            {formatBRL(f.contribuicaoDaFaixa)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="uppercase text-amber-300">INSS RECALCULADO NA FOLHA {feriasRateioInss.competencia2Rotulo}:</span>
                <span className="text-sm text-amber-300 tabular-nums">
                  {formatBRL(feriasRateioInss.inssRecalculadoMes2)}
                </span>
              </div>
            </div>
          )}

          {/* Etapas Numeradas Detalhadas */}
          <div className="space-y-2.5">
            {inssResult.memorySteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-900 text-white text-[11px] font-mono font-bold">
                      {step.stepNumber}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                  </div>
                  {step.resultHighlight && (
                    <span className="text-xs font-mono font-semibold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 tabular-nums">
                      {step.resultHighlight}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mb-2">{step.description}</p>

                {step.details && step.details.length > 0 && (
                  <div className="bg-white rounded border border-slate-200 p-2.5 text-xs font-mono space-y-1 mb-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-1">
                        <span className="text-slate-700">{detail.label}</span>
                        <div className="text-right">
                          <span className="text-slate-900 font-semibold tabular-nums">{detail.value}</span>
                          {detail.extra && (
                            <span className="block text-[10px] text-slate-500 font-sans">{detail.extra}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {step.formula && (
                  <div className="bg-slate-100/90 rounded border border-slate-300/80 p-2.5 text-xs font-mono text-slate-800 whitespace-pre-line leading-relaxed">
                    {step.formula}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
