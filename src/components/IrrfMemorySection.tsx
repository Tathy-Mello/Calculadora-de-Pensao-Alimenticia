/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IrrfCalculationResult } from '../types/irrf';
import { formatBRL, formatPercentage } from '../utils/formatters';
import { ShieldCheck, ChevronDown, ChevronUp, Copy, Check, FileText } from 'lucide-react';

interface IrrfMemorySectionProps {
  irrfResult: IrrfCalculationResult | null | undefined;
}

export const IrrfMemorySection: React.FC<IrrfMemorySectionProps> = ({ irrfResult }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  if (!irrfResult) return null;

  const handleCopyIrrfMemory = () => {
    let text = `========================================================\n`;
    text += `MEMÓRIA DE CÁLCULO DO IRRF — FASE 4 (MOTOR OFICIAL)\n`;
    text += `Exercício / Ano: ${irrfResult.ano} | Competência: ${irrfResult.competencia}\n`;
    text += `Fonte Normativa: ${irrfResult.tabelaUtilizada.fonte}\n`;
    text += `Data da Apuração: ${irrfResult.calculatedAt}\n`;
    text += `========================================================\n\n`;

    irrfResult.memorySteps.forEach((step) => {
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
    text += `BASE DE CÁLCULO DO IRRF: ${formatBRL(irrfResult.baseIrrf)}\n`;
    text += `FAIXA DE ENQUADRAMENTO: Faixa ${irrfResult.faixaAplicada.faixaNumero} (${formatPercentage(irrfResult.aliquotaAplicada)})\n`;
    text += `PARCELA A DEDUZIR DO IMPOSTO: ${formatBRL(irrfResult.parcelaDeduzirAplicada)}\n`;
    text += `TOTAL DE IRRF RETIDO: ${formatBRL(irrfResult.valorIrrfFinal)}\n`;
    text += `========================================================\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="memoria-irrf" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-900 text-white flex items-center justify-center font-bold text-xs">
            IRRF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Memória de Cálculo — IRRF
              </h2>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-200 font-medium">
                Tabela Oficial {irrfResult.ano}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Cálculo progressivo oficial com deduções legais (INSS, dependentes, pensão) e parcelas a deduzir
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyIrrfMemory}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
            title="Copiar memória de cálculo do IRRF"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiada!' : 'Copiar Memória IRRF'}</span>
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
          {/* Card Resumo do IRRF */}
          <div className="p-4 bg-emerald-950 text-white rounded-lg border border-emerald-900 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-800/80 pb-2">
              <div>
                <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] block">
                  Demonstrativo do Imposto de Renda Retido na Fonte
                </span>
                <span className="text-[10px] text-emerald-400 font-sans">
                  Norma: {irrfResult.tabelaUtilizada.fonte}
                </span>
              </div>
              <span className="text-[11px] text-emerald-300">
                Faixa {irrfResult.faixaAplicada.faixaNumero} ({formatPercentage(irrfResult.aliquotaAplicada)})
              </span>
            </div>

            {/* Rendimentos e Deduções */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="font-bold text-emerald-400 block">RENDIMENTOS TRIBUTÁVEIS:</span>
                <div className="pl-3 space-y-0.5 text-emerald-100">
                  {irrfResult.verbasTributaveis.map((v, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="truncate pr-2">{v.label}:</span>
                      <span className="tabular-nums font-semibold text-white">{formatBRL(v.valor)}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-emerald-900 flex justify-between font-bold text-white">
                    <span>Total Rendimentos:</span>
                    <span className="text-emerald-300 tabular-nums">{formatBRL(irrfResult.rendimentosTributaveis)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-bold text-rose-300 block">DEDUÇÕES LEGAIS APLICADAS:</span>
                <div className="pl-3 space-y-0.5 text-emerald-100">
                  <div className="flex justify-between">
                    <span>Previdência Oficial (INSS):</span>
                    <span className="tabular-nums text-rose-200">(-) {formatBRL(irrfResult.deducoes.inss)}</span>
                  </div>
                  {irrfResult.deducoes.dependentes.total > 0 && (
                    <div className="flex justify-between">
                      <span>Dependentes ({irrfResult.deducoes.dependentes.quantidade}):</span>
                      <span className="tabular-nums text-rose-200">(-) {formatBRL(irrfResult.deducoes.dependentes.total)}</span>
                    </div>
                  )}
                  {irrfResult.deducoes.pensaoAlimenticia > 0 && (
                    <div className="flex justify-between">
                      <span>Pensão Alimentícia Judicial:</span>
                      <span className="tabular-nums text-rose-200">(-) {formatBRL(irrfResult.deducoes.pensaoAlimenticia)}</span>
                    </div>
                  )}
                  {irrfResult.deducoes.outrasDeducoes > 0 && (
                    <div className="flex justify-between">
                      <span>Outras Deduções Permitidas:</span>
                      <span className="tabular-nums text-rose-200">(-) {formatBRL(irrfResult.deducoes.outrasDeducoes)}</span>
                    </div>
                  )}
                  <div className="pt-1 border-t border-emerald-900 flex justify-between font-bold text-white">
                    <span>Total Deduções:</span>
                    <span className="text-rose-300 tabular-nums">(-) {formatBRL(irrfResult.deducoes.totalDeducoes)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Base Apurada & Cálculo */}
            <div className="pt-2 border-t border-emerald-800/80 space-y-1">
              <div className="flex justify-between font-bold text-white">
                <span>Base Efetiva do IRRF:</span>
                <span className="text-sm text-emerald-200 tabular-nums">{formatBRL(irrfResult.baseIrrf)}</span>
              </div>
              <div className="flex justify-between text-emerald-200">
                <span>Operação:</span>
                <span>
                  {irrfResult.aliquotaAplicada === 0
                    ? 'Isento de IRRF'
                    : `(${formatBRL(irrfResult.baseIrrf)} × ${formatPercentage(irrfResult.aliquotaAplicada)}) − ${formatBRL(irrfResult.parcelaDeduzirAplicada)}`}
                </span>
              </div>
            </div>

            {/* Resultado Final IRRF */}
            <div className="pt-3 border-t border-emerald-800 flex justify-between items-center text-sm font-bold text-white">
              <span className="uppercase text-emerald-400">TOTAL IRRF RETIDO:</span>
              <span className="text-base text-emerald-300 tabular-nums">
                {formatBRL(irrfResult.valorIrrfFinal)}
              </span>
            </div>
          </div>

          {/* Etapas Numeradas Detalhadas */}
          <div className="space-y-2.5">
            {irrfResult.memorySteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-900 text-white text-[11px] font-mono font-bold">
                      {step.stepNumber}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">{step.title}</h3>
                  </div>
                  {step.resultHighlight && (
                    <span className="text-xs font-mono font-semibold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 tabular-nums">
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
