/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalculationResultData } from '../types/pension';
import { formatBRL, formatPercentage } from '../utils/formatters';
import { FileText, Copy, Check, ChevronDown, ChevronUp, ShieldCheck, Terminal, AlertTriangle } from 'lucide-react';

interface CalculationMemoryProps {
  result: CalculationResultData | null;
}

export const CalculationMemory: React.FC<CalculationMemoryProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showRawLog, setShowRawLog] = useState(false);

  const handleCopyFullMemory = () => {
    if (!result) return;

    let text = `========================================================\n`;
    text += `MEMÓRIA DE CÁLCULO DE PENSÃO ALIMENTÍCIA — FASE 2\n`;
    text += `Modalidade: ${result.auditLog.tipoCalculoRotulo}\n`;
    text += `Data da Apuração: ${result.calculatedAt}\n`;
    text += `========================================================\n\n`;

    result.memorySteps.forEach((step) => {
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
    text += `POLÍTICA DE ARREDONDAMENTO & LIMITES:\n`;
    text += `Valor pré-arredondamento: R$ ${result.valorAntesArredondamento.toFixed(4)}\n`;
    text += `Regra de arredondamento: ${result.auditLog.regraArredondamento}\n`;
    text += `Piso mínimo aplicado: ${result.minimoAplicado ? 'SIM' : 'NÃO'}\n`;
    text += `Teto máximo aplicado: ${result.tetoAplicado ? 'SIM' : 'NÃO'}\n`;
    text += `--------------------------------------------------------\n`;
    text += `RESULTADO DEFINITIVO:\n`;
    text += `Base da Pensão: ${formatBRL(result.basePensao)}\n`;
    text += `Regra / Alíquota: ${result.regraTexto}\n`;
    if (result.rateioBeneficiarios?.ativo) {
      text += `RATEIO POR BENEFICIÁRIO (CÁLCULO SEPARADO -> 1 EVENTO ÚNICO NA FOLHA):\n`;
      result.rateioBeneficiarios.beneficiarios.forEach((b) => {
        const quota = b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0);
        text += `  • ${b.label} (${quota}): ${formatBRL(b.valorCalculado)} (bruto cota: R$ ${b.valorAntesArredondamento.toFixed(4)})\n`;
      });
      text += `TOTAL CONSOLIDADO (1 EVENTO NA FOLHA): ${formatBRL(result.valorPensao)}\n`;
    } else {
      text += `PENSÃO ALIMENTÍCIA: ${formatBRL(result.valorPensao)}\n`;
    }
    text += `LÍQUIDO DISPONÍVEL AO COLABORADOR: ${formatBRL(result.liquidoAposPensao)}\n`;
    text += `========================================================\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="memoria-calculo" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Memória do Cálculo da Pensão
            </h2>
            <p className="text-xs text-slate-500">
              Demonstração explícita de cada operação: verbas consideradas, exclusões, deduções e regras
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {result && (
            <>
              <button
                type="button"
                onClick={() => setShowRawLog(!showRawLog)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showRawLog
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                }`}
                title="Ver registro interno de auditoria da regra"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showRawLog ? 'Ocultar Log' : 'Log da Regra'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyFullMemory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                title="Copiar memória de cálculo formatada"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiada!' : 'Copiar Memória'}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 transition-colors"
            title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!result ? (
        <div className="p-8 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs space-y-1">
          <p className="font-semibold text-slate-700">
            Nenhuma memória de cálculo gerada
          </p>
          <p>
            Configure a regra da pensão, verbas e deduções e acione <strong>"CALCULAR PENSÃO"</strong> para visualizar a decomposição matemática completa.
          </p>
        </div>
      ) : isExpanded ? (
        <div className="space-y-4">
          {/* Card Resumo Modelo da Seção 9 */}
          <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-800 font-mono text-xs space-y-3">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Demonstrativo Sequencial do Motor (Fase 2)
              </span>
              <span className="text-slate-400 text-[10px]">
                {result.auditLog.tipoCalculoRotulo} · {result.calculatedAt}
              </span>
            </div>

            {/* Verbas Consideradas */}
            <div>
              <span className="font-bold text-emerald-400 block mb-1">VERBAS CONSIDERADAS:</span>
              <div className="pl-3 space-y-0.5 text-slate-300">
                {result.verbasConsideradasNaBase.map((v) => (
                  <div key={v.id} className="flex justify-between">
                    <span>{v.label}:</span>
                    <span className="tabular-nums text-white font-semibold">{formatBRL(v.value)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-1 pt-1 border-t border-slate-800 flex justify-between font-bold text-white">
                <span>Subtotal:</span>
                <span className="tabular-nums text-emerald-300">
                  {formatBRL(result.verbasConsideradasNaBase.reduce((a, b) => a + b.value, 0))}
                </span>
              </div>
            </div>

            {/* Verbas Excluídas */}
            {result.verbasExcluidasDaBase.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="font-bold text-rose-400 block mb-1">VERBAS EXCLUÍDAS:</span>
                <div className="pl-3 space-y-0.5 text-slate-400">
                  {result.verbasExcluidasDaBase.map((v) => (
                    <div key={v.id} className="flex justify-between">
                      <span>{v.label} (excluída conforme regra):</span>
                      <span className="tabular-nums">{formatBRL(v.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deduções */}
            <div className="pt-2 border-t border-slate-800">
              <span className="font-bold text-indigo-400 block mb-1">DEDUÇÕES AUTORIZADAS:</span>
              <div className="pl-3 space-y-0.5 text-slate-300">
                {result.deducoesAutorizadasNaBase.length > 0 ? (
                  result.deducoesAutorizadasNaBase.map((d) => (
                    <div key={d.id} className="flex justify-between">
                      <span>{d.label} [Ordem {d.order}]:</span>
                      <span className="tabular-nums text-rose-300">(-) {formatBRL(d.value)}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 italic">Nenhuma dedução autorizada a abater a base</div>
                )}
              </div>
            </div>

            {/* Base da Pensão e Aplicação da Regra */}
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <div className="flex justify-between font-bold text-slate-200">
                <span>Base da pensão:</span>
                <span className="text-white text-sm tabular-nums">{formatBRL(result.basePensao)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Aplicação da regra:</span>
                <span className="text-emerald-400 font-semibold">{result.regraTexto}</span>
              </div>

              {result.minimoAplicado && (
                <div className="text-amber-300 text-[11px] flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Piso mínimo acionado: valor ajustado para o mínimo configurado.</span>
                </div>
              )}

              {result.tetoAplicado && (
                <div className="text-amber-300 text-[11px] flex items-center gap-1.5 pt-1">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Teto máximo acionado: valor limitado ao teto configurado.</span>
                </div>
              )}
            </div>

            {/* Rateio por Beneficiário (quando ativo) */}
            {result.rateioBeneficiarios?.ativo && (
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 block">
                  CÁLCULO SEPARADO POR FILHO → SOMA EM 1 EVENTO ÚNICO NA FOLHA:
                </span>
                <div className="pl-3 space-y-0.5 text-slate-300">
                  {result.rateioBeneficiarios.beneficiarios.map((b) => (
                    <div key={b.id} className="flex justify-between">
                      <span>
                        {b.label} ={' '}
                        {b.percentual !== undefined
                          ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
                          : formatBRL(b.valorFixo || 0)}
                      </span>
                      <span className="tabular-nums text-white font-semibold">
                        = {formatBRL(b.valorCalculado)}{' '}
                        <span className="text-[10px] text-slate-400">
                          (pré-arred: R$ {b.valorAntesArredondamento.toFixed(4)})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado Final Destaque */}
            <div className="pt-3 border-t border-slate-700 flex justify-between items-center text-sm font-bold text-white">
              <span className="uppercase text-emerald-400">
                {result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                  ? `EVENTO PENSÃO (SOMA: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}):`
                  : result.rateioBeneficiarios?.ativo
                  ? 'PENSÃO ALIMENTÍCIA (1 EVENTO ÚNICO NA FOLHA):'
                  : 'PENSÃO ALIMENTÍCIA:'}
              </span>
              <span className="text-base text-emerald-300 tabular-nums">{formatBRL(result.valorPensao)}</span>
            </div>
          </div>

          {/* Log Interno de Auditoria (Seção 16) */}
          {showRawLog && (
            <div className="p-3 bg-slate-950 text-slate-200 rounded-lg font-mono text-[11px] space-y-1.5 overflow-x-auto border border-slate-800">
              <div className="text-slate-400 font-bold border-b border-slate-800 pb-1 flex items-center justify-between">
                <span>LOG DA REGRA UTILIZADA (AUDITORIA INTERNA)</span>
                <span>ID: {result.auditLog.id}</span>
              </div>
              <pre className="text-[10px] text-slate-300 whitespace-pre-wrap">
                {JSON.stringify(result.auditLog, null, 2)}
              </pre>
            </div>
          )}

          {/* Etapas Numeradas Detalhadas */}
          <div className="space-y-2.5">
            {result.memorySteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-white transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[11px] font-mono font-bold">
                      {step.stepNumber}
                    </span>
                    <h3 className="text-xs font-bold text-slate-900">
                      {step.title}
                    </h3>
                  </div>
                  {step.resultHighlight && (
                    <span className="text-xs font-mono font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 tabular-nums">
                      {step.resultHighlight}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 mb-2">
                  {step.description}
                </p>

                {step.details && step.details.length > 0 && (
                  <div className="bg-white rounded border border-slate-200 p-2.5 text-xs font-mono space-y-1 mb-2">
                    {step.details.map((detail, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] gap-1">
                        <span className="text-slate-700">{detail.label}</span>
                        <div className="text-right">
                          <span className="text-slate-900 font-semibold tabular-nums">
                            {detail.value}
                          </span>
                          {detail.extra && (
                            <span className="block text-[10px] text-slate-500 font-sans">
                              {detail.extra}
                            </span>
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

          <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-start gap-2 border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p>
              <strong>Fidelidade do Motor:</strong> Nenhuma regra, incidência ou alíquota foi presumida. Todas as operações decorrem estritamente da regra de pensão cadastrada e autorizada para esta modalidade.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-600">
            Memória de cálculo disponível com {result.memorySteps.length} etapas registradas.
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="text-slate-900 font-semibold hover:underline"
          >
            Ver Memória de Cálculo
          </button>
        </div>
      )}
    </div>
  );
};
