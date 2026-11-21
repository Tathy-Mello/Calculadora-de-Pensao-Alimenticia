/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CalculationResultData } from '../types/pension';
import { formatBRL, formatPercentage } from '../utils/formatters';
import {
  Calculator,
  Check,
  Copy,
  Printer,
  PieChart,
  DollarSign,
  TrendingDown,
  Shield,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Split,
} from 'lucide-react';
import { EarningItem, DeductionItem, IdentificationData } from '../types/pension';
import { ExportReportMenu } from './ExportReportMenu';

interface CalculationResultProps {
  result: CalculationResultData | null;
  identification?: IdentificationData;
  earnings?: EarningItem[];
  deductions?: DeductionItem[];
  moduleName?: string;
  onPrint?: () => void;
  onViewMemory?: () => void;
  isOutdated?: boolean;
  onRecalculate?: () => void;
}

export const CalculationResult: React.FC<CalculationResultProps> = ({
  result,
  identification,
  earnings = [],
  deductions = [],
  moduleName = 'Folha Mensal',
  onPrint,
  onViewMemory,
  isOutdated = false,
  onRecalculate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    if (!result) return;
    const splitSummaryText = result.rateioBeneficiarios?.ativo
      ? `\nRATEIO POR FILHO (CÁLCULO SEPARADO → 1 EVENTO ÚNICO NA FOLHA):\n${result.rateioBeneficiarios.beneficiarios
          .map((b) =>
            b.percentual !== undefined
              ? `• ${b.label} = ${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)} = ${formatBRL(b.valorCalculado)}`
              : `• ${b.label} = ${formatBRL(b.valorFixo || 0)} = ${formatBRL(b.valorCalculado)}`
          )
          .join('\n')}\n• Evento de Pensão (Soma: ${
          result.rateioBeneficiarios.somaPercentuais !== undefined
            ? formatPercentage(result.rateioBeneficiarios.somaPercentuais)
            : formatBRL(result.rateioBeneficiarios.totalConsolidadoFolha)
        }): ${formatBRL(result.rateioBeneficiarios.totalConsolidadoFolha)}\n`
      : '';

    if (result.plrResumo) {
      const pr = result.plrResumo;
      const comp = pr.comparacaoSistema;
      const text = `=== RESULTADO DA PLR (PARTICIPAÇÃO NOS LUCROS OU RESULTADOS) ===
TIPO DE CÁLCULO: ${pr.tipoCalculoRotulo}
PERÍODO DE REFERÊNCIA: ${pr.periodoReferencia || '—'} | DATA PAGAMENTO: ${pr.dataPagamento || '—'}
PARCELA: ${pr.numeroParcelaRotulo} | FORMA DE CÁLCULO: ${pr.formaCalculoRotulo}

1. PLR bruta: ${formatBRL(pr.plrBrutaTotal)}
2. (-) Valores anteriormente pagos: ${formatBRL(pr.valoresAnteriormentePagos)}
3. (=) PLR da parcela atual: ${formatBRL(pr.plrParcelaAtual)}
4. (-) INSS (INSS_PLR_CALCULADO): ${formatBRL(pr.valorInss)}
5. Base IRRF: ${formatBRL(pr.baseIrrf)}
6. (-) IRRF (IRRF_PLR_CALCULADO): ${formatBRL(pr.valorIrrf)}
7. Base da pensão alimentícia: ${formatBRL(pr.basePensao)}
8. (-) Pensão alimentícia apurada: ${formatBRL(pr.valorPensao)} (Regra: ${result.regraTexto})${splitSummaryText}
9. (-) Outros descontos: ${formatBRL(pr.outrosDescontos)}
----------------------------------------------------------------
10. VALOR LÍQUIDO DA PLR: ${formatBRL(pr.valorLiquido)}
${comp ? `\nCOMPARAÇÃO COM SISTEMA DE FOLHA:
• PLR Bruta: Calculado ${formatBRL(pr.plrParcelaAtual)} | Sistema ${formatBRL(comp.plrBrutaSistema)} | Dif: ${formatBRL(comp.diferencas.plrBruta)}
• INSS: Calculado ${formatBRL(pr.valorInss)} | Sistema ${formatBRL(comp.inssSistema)} | Dif: ${formatBRL(comp.diferencas.inss)}
• IRRF: Calculado ${formatBRL(pr.valorIrrf)} | Sistema ${formatBRL(comp.irrfSistema)} | Dif: ${formatBRL(comp.diferencas.irrf)}
• Pensão: Calculado ${formatBRL(pr.valorPensao)} | Sistema ${formatBRL(comp.pensaoSistema)} | Dif: ${formatBRL(comp.diferencas.pensao)}
• Líquido: Calculado ${formatBRL(pr.valorLiquido)} | Sistema ${formatBRL(comp.liquidoSistema)} | Dif: ${formatBRL(comp.diferencas.liquido)}
${comp.possuiDivergencia ? 'ALERTA: Existe divergência entre o valor calculado e o valor do sistema de folha.' : 'Conferência exata sem divergências.'}` : ''}

Data/Hora da Apuração: ${result.calculatedAt}
================================================================`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    if (result.rescisaoResumo) {
      const rr = result.rescisaoResumo;
      const text = `=== RESULTADO DA RESCISÃO CONTRATUAL — CALCULADORA DE PENSÃO ALIMENTÍCIA ===
TIPO DE DESLIGAMENTO: ${rr.tipoDesligamentoRotulo}
DATA DESLIGAMENTO: ${rr.dataDesligamento || '—'} | DATA PAGAMENTO: ${rr.dataPagamento || '—'}

1. Saldo de salário: ${formatBRL(rr.saldoSalario)}
2. Aviso-prévio: ${formatBRL(rr.avisoPrevio)}
3. Férias vencidas: ${formatBRL(rr.feriasVencidas)}
4. Férias proporcionais: ${formatBRL(rr.feriasProporcionais)}
5. 1/3 de férias: ${formatBRL(rr.umTercoFerias)}
6. 13º proporcional: ${formatBRL(rr.decimoProporcional)}
7. Outras verbas: ${formatBRL(rr.outrasVerbas)}
----------------------------------------------------------------
8. TOTAL BRUTO RESCISÓRIO: ${formatBRL(rr.totalBruto)}
----------------------------------------------------------------
9. INSS (INSS_RESCISAO_CALCULADO): (-) ${formatBRL(rr.valorInss)}
10. IRRF (IRRF_RESCISAO_CALCULADO): (-) ${formatBRL(rr.valorIrrf)}
11. Base da pensão alimentícia: ${formatBRL(rr.basePensao)}
12. Pensão alimentícia apurada: (-) ${formatBRL(rr.valorPensao)} (Regra: ${result.regraTexto})${splitSummaryText}
13. Outros descontos rescisórios: (-) ${formatBRL(rr.outrosDescontos)}
----------------------------------------------------------------
14. VALOR LÍQUIDO DA RESCISÃO: ${formatBRL(rr.valorLiquido)}
${rr.pensaoInformada !== undefined ? `\nCOMPARAÇÃO COM PENSÃO INFORMADA:
• Calculado: ${formatBRL(rr.valorPensao)}
• Informado: ${formatBRL(rr.pensaoInformada)}
• Diferença: ${formatBRL(rr.diferencaPensao || 0)}
${rr.possuiDivergenciaPensao ? 'ALERTA: Existe divergência entre o valor calculado e o valor informado.' : 'Conferência exata sem divergências.'}` : ''}

Data/Hora da Apuração: ${result.calculatedAt}
================================================================`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return;
    }

    const comp = result.composicaoProventos || {
      salario: 0,
      horasExtras: 0,
      adicionais: 0,
      outras: 0,
      total: result.totalProventos,
    };

    const rateioText = result.feriasRateioInss?.ativo
      ? `\nRATEIO DE INSS — FÉRIAS PARTIDAS (${result.feriasRateioInss.dataInicio} a ${result.feriasRateioInss.dataFim}):
• Competência 1 (${result.feriasRateioInss.competencia1Rotulo}): ${result.feriasRateioInss.diasMes1}/${result.feriasRateioInss.totalDiasFerias} dias (${formatPercentage(result.feriasRateioInss.proporcaoMes1 * 100)}) | Base INSS: ${formatBRL(result.feriasRateioInss.baseTotalInssMes1)} | INSS no Recibo: ${formatBRL(result.feriasRateioInss.inssNoReciboMes1)}
• Competência 2 (${result.feriasRateioInss.competencia2Rotulo}): ${result.feriasRateioInss.diasMes2}/${result.feriasRateioInss.totalDiasFerias} dias (${formatPercentage(result.feriasRateioInss.proporcaoMes2 * 100)}) | Base Férias: ${formatBRL(result.feriasRateioInss.baseInssFeriasMes2)} + Trabalhado: ${formatBRL(result.feriasRateioInss.remuneracaoTrabalhadaMes2)} = Base ${formatBRL(result.feriasRateioInss.baseTotalInssMes2)} | INSS Recalculado: ${formatBRL(result.feriasRateioInss.inssRecalculadoMes2)}
• ${result.feriasRateioInss.tabelaMes2Observacao}`
      : '';

    const text = `=== RESUMO (${moduleName.toUpperCase()}) — CALCULADORA DE PENSÃO ALIMENTÍCIA ===
TOTAL DE PROVENTOS: ${formatBRL(result.totalProventos)}
• Salário: ${formatBRL(comp.salario)}
• Horas extras: ${formatBRL(comp.horasExtras)}
• Adicionais: ${formatBRL(comp.adicionais)}
• Outras: ${formatBRL(comp.outras)}

RESUMO DO CÁLCULO (ITEM | BASE | VALOR):
• Proventos: Base — | Valor: ${formatBRL(result.totalProventos)}
• INSS${result.feriasRateioInss?.ativo ? ` (Proporcional ${result.feriasRateioInss.competencia1Rotulo})` : ''}: Base: ${formatBRL(result.baseInss)} | Valor: ${formatBRL(result.valorInss)}
• IRRF: Base: ${formatBRL(result.baseIrrf)} | Valor: ${formatBRL(result.valorIrrf)}
• Pensão${
      result.rateioBeneficiarios?.ativo
        ? ` (Evento Único · ${
            result.rateioBeneficiarios.somaPercentuais !== undefined
              ? `Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}`
              : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`
          })`
        : ''
    }: Base: ${formatBRL(result.basePensao)} | Valor: ${formatBRL(result.valorPensao)}
• Outros descontos: Base — | Valor: ${formatBRL(result.outrosDescontos)}
• LÍQUIDO A PAGAR: Base — | Valor: ${formatBRL(result.liquidoAposPensao)}
${rateioText}

BASE DA PENSÃO: ${formatBRL(result.basePensao)}
• Verbas incluídas: ${formatBRL(result.verbasConsideradasNaBase.reduce((acc, c) => acc + c.value, 0))}
• Verbas excluídas: ${formatBRL(result.verbasExcluidasDaBase.reduce((acc, c) => acc + c.value, 0))}
• Deduções permitidas: ${formatBRL(result.deducoesAutorizadasNaBase.reduce((acc, c) => acc + c.value, 0))}
• Regra aplicada: ${result.regraTexto}
• PENSÃO ALIMENTÍCIA APURADA: ${formatBRL(result.valorPensao)}
${splitSummaryText}

DEMONSTRATIVO DO LÍQUIDO:
Total de proventos (${formatBRL(result.totalProventos)}) - INSS (${formatBRL(result.valorInss)}) - IRRF (${formatBRL(result.valorIrrf)}) - Pensão (${formatBRL(result.valorPensao)}) - Outros descontos (${formatBRL(result.totalDescontosComPensao - result.valorInss - result.valorIrrf - result.valorPensao)}) = Líquido (${formatBRL(result.liquidoAposPensao)})

Data/Hora da Apuração: ${result.calculatedAt}
================================================================`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const comp = result?.composicaoProventos || {
    salario: 0,
    horasExtras: 0,
    adicionais: 0,
    outras: 0,
    total: result?.totalProventos || 0,
  };

  const somaVerbasIncluidas = result
    ? result.verbasConsideradasNaBase.reduce((acc, c) => acc + (c.value || 0), 0)
    : 0;
  const somaVerbasExcluidas = result
    ? result.verbasExcluidasDaBase.reduce((acc, c) => acc + (c.value || 0), 0)
    : 0;
  const somaDeducoesBase = result
    ? result.deducoesAutorizadasNaBase.reduce((acc, c) => acc + (c.value || 0), 0)
    : 0;

  const valorOutrosDescontosAplicados = result
    ? Math.max(0, result.totalDescontosComPensao - result.valorInss - result.valorIrrf - result.valorPensao)
    : 0;

  return (
    <div id="resultado-calculo" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6">
      {/* Cabeçalho do Resultado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              {result?.plrResumo
                ? 'Resultado da PLR (Participação nos Lucros ou Resultados)'
                : result?.rescisaoResumo
                ? 'Resultado da Rescisão Contratual'
                : identification?.tipoCalculo === 'ferias' || result?.feriasRateioInss
                ? 'Resultado do Recibo de Férias'
                : identification?.tipoCalculo === 'decimo_terceiro'
                ? 'Resultado do 13º Salário'
                : 'Resultado da Folha Mensal'}
            </h2>
            <p className="text-xs text-slate-500">
              {result?.plrResumo
                ? `Demonstrativo oficial de PLR (${result.plrResumo.tipoCalculoRotulo} - ${result.plrResumo.numeroParcelaRotulo}) — Apuração de encargos exclusivos e pensão`
                : result?.rescisaoResumo
                ? `Demonstrativo oficial de rescisão (${result.rescisaoResumo.tipoDesligamentoRotulo}) — Apuração de encargos e pensão`
                : result?.feriasRateioInss?.ativo
                ? `Férias Partidas (${result.feriasRateioInss.dataInicio} a ${result.feriasRateioInss.dataFim}) — Recibo com INSS proporcional a ${result.feriasRateioInss.competencia1Rotulo} e recálculo em ${result.feriasRateioInss.competencia2Rotulo}`
                : 'Demonstrativo consolidado dos proventos, encargos, base de pensão e líquido a pagar'}
            </p>
          </div>
        </div>

        {result && (
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {/* Menu Salvar em PDF e Exportar em Excel */}
            <ExportReportMenu
              result={result}
              identification={identification || {
                matricula: '',
                ano: 2026,
                competencia: 'Janeiro',
                dataPagamento: '',
                tipoCalculo: 'folha_mensal',
              }}
              earnings={earnings}
              deductions={deductions}
              moduleName={moduleName}
              onPrint={onPrint}
            />

            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              title="Copiar resumo para a área de transferência"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Resumo'}</span>
            </button>
            {onViewMemory && (
              <button
                type="button"
                onClick={onViewMemory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Ver Memória</span>
              </button>
            )}
          </div>
        )}
      </div>

      {result && isOutdated && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Regra ou valores alterados após este cálculo</span>
              <span className="text-[11px] text-amber-800">
                Os valores exibidos abaixo ainda correspondem ao cálculo anterior. Clique para atualizar com os novos parâmetros.
              </span>
            </div>
          </div>
          {onRecalculate && (
            <button
              type="button"
              onClick={onRecalculate}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>ATUALIZAR CÁLCULO AGORA</span>
            </button>
          )}
        </div>
      )}

      {/* RENDERIZAÇÃO ESPECÍFICA: PLR (Fase 9 - Seção 14 e Seção 16) */}
      {result?.plrResumo ? (
        <div className="space-y-6">
          {/* PAINEL DE RESULTADO DA PLR — 10 ITENS OFICIAIS (Seção 14) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                <PieChart className="w-4 h-4 text-slate-700" />
                <span>Painel de Resultado da PLR</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {result.plrResumo.tipoCalculoRotulo} • {result.plrResumo.numeroParcelaRotulo}
              </span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                      Item Oficial
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Base / Referência
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* 1. PLR bruta */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800 font-medium">1. PLR bruta total</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {formatBRL(result.plrResumo.plrBrutaTotal)}
                    </td>
                  </tr>

                  {/* 2. Valores anteriormente pagos */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-700">2. Valores anteriormente pagos</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-rose-700 tabular-nums">
                      (-) {formatBRL(result.plrResumo.valoresAnteriormentePagos)}
                    </td>
                  </tr>

                  {/* 3. PLR da parcela atual */}
                  <tr className="bg-slate-50/80 font-semibold border-t border-b border-slate-200">
                    <td className="py-2.5 pl-4 pr-3 font-bold text-slate-900">3. PLR da parcela atual</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950 tabular-nums">
                      {formatBRL(result.plrResumo.plrParcelaAtual)}
                    </td>
                  </tr>

                  {/* 4. INSS */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>4. INSS (INSS_PLR_CALCULADO)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.baseInss)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      (-) {formatBRL(result.plrResumo.valorInss)}
                    </td>
                  </tr>

                  {/* 5. Base IRRF */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">5. Base IRRF (Tributação Exclusiva)</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.plrResumo.baseIrrf)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.plrResumo.baseIrrf)}
                    </td>
                  </tr>

                  {/* 6. IRRF */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>6. IRRF (IRRF_PLR_CALCULADO)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.plrResumo.baseIrrf)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      (-) {formatBRL(result.plrResumo.valorIrrf)}
                    </td>
                  </tr>

                  {/* 7. Base da pensão */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/30">
                    <td className="py-2.5 pl-4 pr-3 font-semibold text-emerald-950">
                      7. Base da pensão alimentícia
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.plrResumo.basePensao)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatBRL(result.plrResumo.basePensao)}
                    </td>
                  </tr>

                  {/* 8. Pensão alimentícia */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/40">
                    <td className="py-2.5 pl-4 pr-3 font-bold text-emerald-950 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>
                        {result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                          ? `8. Pensão alimentícia — Evento Único (Soma: ${formatPercentage(
                              result.rateioBeneficiarios.somaPercentuais
                            )})`
                          : result.rateioBeneficiarios?.ativo
                          ? `8. Pensão alimentícia — Evento Único (${result.rateioBeneficiarios.quantidadeBeneficiarios} filhos)`
                          : `8. Pensão alimentícia (${result.regraTexto})`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.plrResumo.basePensao)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      (-) {formatBRL(result.plrResumo.valorPensao)}
                    </td>
                  </tr>
                  {result.rateioBeneficiarios?.ativo &&
                    result.rateioBeneficiarios.beneficiarios.map((b) => (
                      <tr key={b.id} className="bg-indigo-50/30 text-[11px] text-slate-600">
                        <td className="py-1.5 pl-9 pr-3">
                          ↳ Cálculo separado: <strong className="text-slate-800">{b.label}</strong> ={' '}
                          <span className="font-mono font-semibold text-indigo-950">
                            {b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                          {formatBRL(b.baseAplicada)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-indigo-900 tabular-nums">
                          (-) {formatBRL(b.valorCalculado)}
                        </td>
                      </tr>
                    ))}

                  {/* 9. Outros descontos */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">9. Outros descontos</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      (-) {formatBRL(result.plrResumo.outrosDescontos)}
                    </td>
                  </tr>

                  {/* 10. Valor líquido */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-3 pl-4 pr-3 text-xs uppercase tracking-wider text-emerald-400 font-bold">
                      10. Valor líquido da PLR
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-3 px-3 text-right font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      {formatBRL(result.plrResumo.valorLiquido)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPARAÇÃO COM VALOR INFORMADO PELO SISTEMA DE FOLHA (Seção 16) */}
          {result.plrResumo.comparacaoSistema && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Comparação com o Sistema de Folha (Seção 16)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Auditoria e Conferência
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th scope="col" className="py-2 pl-3 pr-2 text-left font-semibold text-slate-900">
                        Item
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-slate-900">
                        Calculadora
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-slate-900">
                        Sistema
                      </th>
                      <th scope="col" className="py-2 pr-3 pl-2 text-right font-semibold text-slate-900">
                        Diferença
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* PLR Bruta */}
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-sans font-medium text-slate-800">PLR Bruta</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatBRL(result.plrResumo.plrParcelaAtual)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBRL(result.plrResumo.comparacaoSistema.plrBrutaSistema)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        Math.abs(result.plrResumo.comparacaoSistema.diferencas.plrBruta) > 0.01 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.plrResumo.comparacaoSistema.diferencas.plrBruta)}
                      </td>
                    </tr>

                    {/* INSS */}
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-sans font-medium text-slate-800">INSS</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 tabular-nums">
                        {formatBRL(result.plrResumo.valorInss)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBRL(result.plrResumo.comparacaoSistema.inssSistema)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        Math.abs(result.plrResumo.comparacaoSistema.diferencas.inss) > 0.01 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.plrResumo.comparacaoSistema.diferencas.inss)}
                      </td>
                    </tr>

                    {/* IRRF */}
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-sans font-medium text-slate-800">IRRF</td>
                      <td className="py-2 px-3 text-right font-bold text-rose-700 tabular-nums">
                        {formatBRL(result.plrResumo.valorIrrf)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBRL(result.plrResumo.comparacaoSistema.irrfSistema)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        Math.abs(result.plrResumo.comparacaoSistema.diferencas.irrf) > 0.01 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.plrResumo.comparacaoSistema.diferencas.irrf)}
                      </td>
                    </tr>

                    {/* Pensão */}
                    <tr className="bg-emerald-50/20">
                      <td className="py-2 pl-3 pr-2 font-sans font-bold text-emerald-950">Pensão Alimentícia</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        {formatBRL(result.plrResumo.valorPensao)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBRL(result.plrResumo.comparacaoSistema.pensaoSistema)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        Math.abs(result.plrResumo.comparacaoSistema.diferencas.pensao) > 0.01 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.plrResumo.comparacaoSistema.diferencas.pensao)}
                      </td>
                    </tr>

                    {/* Líquido */}
                    <tr className="bg-slate-100/80 font-bold">
                      <td className="py-2 pl-3 pr-2 font-sans font-bold text-slate-900">Líquido</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-800 tabular-nums">
                        {formatBRL(result.plrResumo.valorLiquido)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {formatBRL(result.plrResumo.comparacaoSistema.liquidoSistema)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        Math.abs(result.plrResumo.comparacaoSistema.diferencas.liquido) > 0.01 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.plrResumo.comparacaoSistema.diferencas.liquido)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.plrResumo.comparacaoSistema.possuiDivergencia ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Existe divergência entre o valor calculado e o valor informado pelo sistema de folha.</span>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Divergência na pensão: <strong>{formatBRL(result.plrResumo.comparacaoSistema.diferencas.pensao)}</strong> | 
                        Divergência no líquido: <strong>{formatBRL(result.plrResumo.comparacaoSistema.diferencas.liquido)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pl-6 pt-1 text-[11px] text-amber-800">
                    <span className="font-semibold block mb-1">Possíveis pontos para conferência recomendados:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {result.plrResumo.comparacaoSistema.pontosConferencia.map((ponto, idx) => (
                        <li key={idx}>{ponto}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Conferência validada: Todos os valores da calculadora coincidem exatamente com o sistema de folha.</span>
                </div>
              )}
            </div>
          )}

          {/* CARDS RESUMO DA PLR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco: COMPOSIÇÃO DA PLR */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Composição da Parcela da PLR
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatBRL(result.plrResumo.plrParcelaAtual)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>PLR Bruta Total:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.plrResumo.plrBrutaTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-700">
                  <span>Valores anteriormente pagos:</span>
                  <span className="font-mono tabular-nums">(-) {formatBRL(result.plrResumo.valoresAnteriormentePagos)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Forma de apuração:</span>
                  <span className="font-semibold text-slate-800">{result.plrResumo.formaCalculoRotulo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Período de referência:</span>
                  <span className="font-mono text-slate-800">{result.plrResumo.periodoReferencia || '—'}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Parcela Atual a Pagar:</span>
                <span className="font-mono text-sm text-slate-950 tabular-nums">
                  {formatBRL(result.plrResumo.plrParcelaAtual)}
                </span>
              </div>
            </div>

            {/* Bloco: BASE DA PENSÃO SOBRE PLR */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Base da Pensão sobre PLR
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {formatBRL(result.plrResumo.basePensao)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="font-semibold text-slate-700 text-[11px]">Componentes incluídos na base:</div>
                <div className="pl-2 space-y-0.5">
                  {result.verbasConsideradasNaBase.map((v) => (
                    <div key={v.id} className="flex justify-between text-[11px]">
                      <span className="truncate pr-2">{v.label}:</span>
                      <span className="font-mono text-slate-800 tabular-nums">{formatBRL(v.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-slate-800 pt-0.5 text-[11px]">
                    <span>Subtotal verbas:</span>
                    <span className="font-mono">{formatBRL(somaVerbasIncluidas)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                  <span>Deduções autorizadas (INSS/IRRF):</span>
                  <span className="font-mono text-rose-700 tabular-nums">(-) {formatBRL(somaDeducoesBase)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Base Final Apurada:</span>
                <span className="font-mono text-sm text-emerald-800 tabular-nums">
                  {formatBRL(result.plrResumo.basePensao)}
                </span>
              </div>
            </div>

            {/* Bloco: RESULTADO DA PENSÃO SOBRE PLR */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pensão sobre PLR</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                  {result.regraTexto}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Regra aplicada:</span>
                  <span className="font-bold text-slate-900">{result.regraTexto}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Base apurada:</span>
                  <span className="font-mono text-slate-800">{formatBRL(result.plrResumo.basePensao)}</span>
                </div>
                <div className="p-2 bg-white/80 rounded border border-emerald-200/60 text-[11px] font-mono text-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Cálculo:</span>
                  {result.rateioBeneficiarios?.ativo ? (
                    <div className="space-y-0.5">
                      {result.rateioBeneficiarios.beneficiarios.map((b) => (
                        <div key={b.id} className="flex justify-between gap-2">
                          <span>
                            {b.label} ={' '}
                            {b.percentual !== undefined
                              ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
                              : formatBRL(b.valorFixo || 0)}
                          </span>
                          <span className="font-semibold text-slate-950 shrink-0">= {formatBRL(b.valorCalculado)}</span>
                        </div>
                      ))}
                      <div className="pt-1 mt-1 border-t border-emerald-200/80 flex flex-wrap justify-between gap-1 font-bold text-emerald-900">
                        <span>
                          EVENTO ÚNICO (Soma:{' '}
                          {result.rateioBeneficiarios.somaPercentuais !== undefined
                            ? formatPercentage(result.rateioBeneficiarios.somaPercentuais)
                            : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`}
                          )
                        </span>
                        <span>
                          = {result.rateioBeneficiarios.beneficiarios.map((b) => formatBRL(b.valorCalculado)).join(' + ')} = {formatBRL(result.plrResumo.valorPensao)}
                        </span>
                      </div>
                    </div>
                  ) : result.auditLog.ruleType === 'valor_fixo' ? (
                    <span>Valor Fixo Determinado = {formatBRL(result.plrResumo.valorPensao)}</span>
                  ) : (
                    <span>
                      {formatBRL(result.plrResumo.basePensao)} × {result.regraTexto} = {formatBRL(result.plrResumo.valorPensao)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-950">
                <span className="uppercase tracking-wider">
                  {result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                    ? `Evento Pensão (${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}):`
                    : result.rateioBeneficiarios?.ativo
                    ? 'Pensão (Evento Único):'
                    : 'Pensão Alimentícia:'}
                </span>
                <span className="font-mono text-base text-emerald-700 font-bold tabular-nums">
                  {formatBRL(result.plrResumo.valorPensao)}
                </span>
              </div>
            </div>

            {/* Bloco: DEMONSTRATIVO DO LÍQUIDO DA PLR */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Líquido da Parcela de PLR
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatBRL(result.plrResumo.valorLiquido)}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>PLR da parcela atual:</span>
                  <span className="font-mono text-white tabular-nums">{formatBRL(result.plrResumo.plrParcelaAtual)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− INSS PLR:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.plrResumo.valorInss)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− IRRF PLR:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.plrResumo.valorIrrf)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span>− Pensão PLR:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.plrResumo.valorPensao)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>− Outros descontos:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.plrResumo.outrosDescontos)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="text-white uppercase tracking-wider">= Líquido a pagar:</span>
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {formatBRL(result.plrResumo.valorLiquido)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : result?.rescisaoResumo ? (
        <div className="space-y-6">
          {/* PAINEL DE RESULTADO DA RESCISÃO — 14 ITENS OFICIAIS (Seção 17) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                <PieChart className="w-4 h-4 text-slate-700" />
                <span>Painel de Resultado da Rescisão</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {result.rescisaoResumo.tipoDesligamentoRotulo}
              </span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                      Campo Oficial
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Base / Referência
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* 1. Saldo de salário */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">1. Saldo de salário</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.saldoSalario)}
                    </td>
                  </tr>

                  {/* 2. Aviso-prévio */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">2. Aviso-prévio</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.avisoPrevio)}
                    </td>
                  </tr>

                  {/* 3. Férias vencidas */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">3. Férias vencidas</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.feriasVencidas)}
                    </td>
                  </tr>

                  {/* 4. Férias proporcionais */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">4. Férias proporcionais</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.feriasProporcionais)}
                    </td>
                  </tr>

                  {/* 5. 1/3 de férias */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">5. 1/3 de férias</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.umTercoFerias)}
                    </td>
                  </tr>

                  {/* 6. 13º proporcional */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">6. 13º proporcional</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.decimoProporcional)}
                    </td>
                  </tr>

                  {/* 7. Outras verbas */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">7. Outras verbas</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900 tabular-nums">
                      {formatBRL(result.rescisaoResumo.outrasVerbas)}
                    </td>
                  </tr>

                  {/* 8. Total bruto */}
                  <tr className="bg-slate-100/80 font-semibold border-t-2 border-slate-300">
                    <td className="py-2.5 pl-4 pr-3 font-bold text-slate-900">8. Total bruto rescisório</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-950 tabular-nums">
                      {formatBRL(result.rescisaoResumo.totalBruto)}
                    </td>
                  </tr>

                  {/* 9. INSS */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>9. INSS (INSS_RESCISAO_CALCULADO)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.baseInss)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      (-) {formatBRL(result.rescisaoResumo.valorInss)}
                    </td>
                  </tr>

                  {/* 10. IRRF */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>10. IRRF (IRRF_RESCISAO_CALCULADO)</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.baseIrrf)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      (-) {formatBRL(result.rescisaoResumo.valorIrrf)}
                    </td>
                  </tr>

                  {/* 11. Base da pensão */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/30">
                    <td className="py-2.5 pl-4 pr-3 font-semibold text-emerald-950">
                      11. Base da pensão alimentícia
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.rescisaoResumo.basePensao)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 tabular-nums">
                      {formatBRL(result.rescisaoResumo.basePensao)}
                    </td>
                  </tr>

                  {/* 12. Pensão alimentícia */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/40">
                    <td className="py-2.5 pl-4 pr-3 font-bold text-emerald-950 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>
                        {result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                          ? `12. Pensão alimentícia — Evento Único (Soma: ${formatPercentage(
                              result.rateioBeneficiarios.somaPercentuais
                            )})`
                          : `12. Pensão alimentícia (${result.regraTexto})`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {formatBRL(result.rescisaoResumo.basePensao)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      (-) {formatBRL(result.rescisaoResumo.valorPensao)}
                    </td>
                  </tr>
                  {result.rateioBeneficiarios?.ativo &&
                    result.rateioBeneficiarios.beneficiarios.map((b) => (
                      <tr key={b.id} className="bg-indigo-50/30 text-[11px] text-slate-600">
                        <td className="py-1.5 pl-9 pr-3">
                          ↳ Cálculo separado: <strong className="text-slate-800">{b.label}</strong> ={' '}
                          <span className="font-mono font-semibold text-indigo-950">
                            {b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                          {formatBRL(b.baseAplicada)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-indigo-900 tabular-nums">
                          (-) {formatBRL(b.valorCalculado)}
                        </td>
                      </tr>
                    ))}

                  {/* 13. Outros descontos */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 text-slate-800">13. Outros descontos</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      (-) {formatBRL(result.rescisaoResumo.outrosDescontos)}
                    </td>
                  </tr>

                  {/* 14. Valor líquido */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-3 pl-4 pr-3 text-xs uppercase tracking-wider text-emerald-400 font-bold">
                      14. Valor líquido da rescisão
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">—</td>
                    <td className="py-3 px-3 text-right font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      {formatBRL(result.rescisaoResumo.valorLiquido)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPARAÇÃO COM PENSÃO INFORMADA (Seção 19) */}
          {result.rescisaoResumo.pensaoInformada !== undefined && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Comparação com Pensão Informada (Seção 19)
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">
                  Conferência de Cálculo
                </span>
              </div>

              <div className="overflow-hidden border border-slate-200 rounded-lg bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                  <thead className="bg-slate-50 font-sans">
                    <tr>
                      <th scope="col" className="py-2 pl-3 pr-2 text-left font-semibold text-slate-900">
                        Item
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-slate-900">
                        Calculado
                      </th>
                      <th scope="col" className="py-2 px-3 text-right font-semibold text-slate-900">
                        Informado
                      </th>
                      <th scope="col" className="py-2 pr-3 pl-2 text-right font-semibold text-slate-900">
                        Diferença
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2 pl-3 pr-2 font-sans font-medium text-slate-800">
                        Pensão Alimentícia
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700 tabular-nums">
                        {formatBRL(result.rescisaoResumo.valorPensao)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-800 tabular-nums">
                        {formatBRL(result.rescisaoResumo.pensaoInformada)}
                      </td>
                      <td className={`py-2 pr-3 pl-2 text-right font-bold tabular-nums ${
                        result.rescisaoResumo.possuiDivergenciaPensao ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {formatBRL(result.rescisaoResumo.diferencaPensao || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {result.rescisaoResumo.possuiDivergenciaPensao ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Existe divergência entre o valor calculado e o valor informado.</span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Diferença apurada: <strong>{formatBRL(result.rescisaoResumo.diferencaPensao || 0)}</strong>.
                      Verifique se a base de incidência, dedução de INSS/IRRF ou alíquota cadastrada coincidem com a determinação judicial.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Conferência validada: O valor calculado coincide exatamente com o valor informado.</span>
                </div>
              )}
            </div>
          )}

          {/* CARDS RESUMO DA RESCISÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco: TOTAL BRUTO RESCISÓRIO */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Composição do Bruto Rescisório
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatBRL(result.rescisaoResumo.totalBruto)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Saldo de salário:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.saldoSalario)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Aviso-prévio:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.avisoPrevio)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Férias vencidas:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.feriasVencidas)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Férias proporcionais + 1/3:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.feriasProporcionais + result.rescisaoResumo.umTercoFerias)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>13º proporcional:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.decimoProporcional)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Outras verbas:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(result.rescisaoResumo.outrasVerbas)}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Total Bruto:</span>
                <span className="font-mono text-sm text-slate-950 tabular-nums">
                  {formatBRL(result.rescisaoResumo.totalBruto)}
                </span>
              </div>
            </div>

            {/* Bloco: BASE DA PENSÃO RESCISÓRIA */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Base da Pensão Rescisória
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {formatBRL(result.rescisaoResumo.basePensao)}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="font-semibold text-slate-700 text-[11px]">Verbas incluídas na base:</div>
                <div className="pl-2 space-y-0.5">
                  {result.verbasConsideradasNaBase.map((v) => (
                    <div key={v.id} className="flex justify-between text-[11px]">
                      <span className="truncate pr-2">{v.label}:</span>
                      <span className="font-mono text-slate-800 tabular-nums">{formatBRL(v.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold text-slate-800 pt-0.5 text-[11px]">
                    <span>Subtotal verbas:</span>
                    <span className="font-mono">{formatBRL(somaVerbasIncluidas)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200">
                  <span>Deduções autorizadas (INSS/IRRF):</span>
                  <span className="font-mono text-rose-700 tabular-nums">(-) {formatBRL(somaDeducoesBase)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Base Final Apurada:</span>
                <span className="font-mono text-sm text-emerald-800 tabular-nums">
                  {formatBRL(result.rescisaoResumo.basePensao)}
                </span>
              </div>
            </div>

            {/* Bloco: RESULTADO DA PENSÃO RESCISÓRIA */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pensão s/ Rescisão</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                  {result.regraTexto}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Regra aplicada:</span>
                  <span className="font-bold text-slate-900">{result.regraTexto}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Base apurada:</span>
                  <span className="font-mono text-slate-800">{formatBRL(result.rescisaoResumo.basePensao)}</span>
                </div>
                <div className="p-2 bg-white/80 rounded border border-emerald-200/60 text-[11px] font-mono text-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Cálculo:</span>
                  {result.rateioBeneficiarios?.ativo ? (
                    <div className="space-y-0.5">
                      {result.rateioBeneficiarios.beneficiarios.map((b) => (
                        <div key={b.id} className="flex justify-between gap-2">
                          <span>
                            {b.label} ={' '}
                            {b.percentual !== undefined
                              ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
                              : formatBRL(b.valorFixo || 0)}
                          </span>
                          <span className="font-semibold text-slate-950 shrink-0">= {formatBRL(b.valorCalculado)}</span>
                        </div>
                      ))}
                      <div className="pt-1 mt-1 border-t border-emerald-200/80 flex flex-wrap justify-between gap-1 font-bold text-emerald-900">
                        <span>
                          EVENTO ÚNICO (Soma:{' '}
                          {result.rateioBeneficiarios.somaPercentuais !== undefined
                            ? formatPercentage(result.rateioBeneficiarios.somaPercentuais)
                            : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`}
                          )
                        </span>
                        <span>
                          = {result.rateioBeneficiarios.beneficiarios.map((b) => formatBRL(b.valorCalculado)).join(' + ')} = {formatBRL(result.rescisaoResumo.valorPensao)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span>
                      {formatBRL(result.rescisaoResumo.basePensao)} × {result.regraTexto} = {formatBRL(result.rescisaoResumo.valorPensao)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-950">
                <span className="uppercase tracking-wider">
                  {result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                    ? `Evento Pensão (${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}):`
                    : result.rateioBeneficiarios?.ativo
                    ? 'Pensão (Evento Único):'
                    : 'Pensão Alimentícia:'}
                </span>
                <span className="font-mono text-base text-emerald-700 font-bold tabular-nums">
                  {formatBRL(result.rescisaoResumo.valorPensao)}
                </span>
              </div>
            </div>

            {/* Bloco: DEMONSTRATIVO DO LÍQUIDO RESCISÓRIO */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Líquido da Rescisão
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {formatBRL(result.rescisaoResumo.valorLiquido)}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Total bruto rescisório:</span>
                  <span className="font-mono text-white tabular-nums">{formatBRL(result.rescisaoResumo.totalBruto)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− INSS rescisão:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.rescisaoResumo.valorInss)}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− IRRF rescisão:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.rescisaoResumo.valorIrrf)}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span>− Pensão rescisão:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.rescisaoResumo.valorPensao)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>− Outros descontos:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(result.rescisaoResumo.outrosDescontos)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="text-white uppercase tracking-wider">= Líquido a pagar:</span>
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {formatBRL(result.rescisaoResumo.valorLiquido)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 1. PAINEL: RESUMO DA FOLHA MENSAL (Seção 16 - Fase 5) */
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase">
                <PieChart className="w-4 h-4 text-slate-700" />
                <span>
                  {identification?.tipoCalculo === 'ferias' || result?.feriasRateioInss
                    ? 'Resumo do Recibo de Férias'
                    : identification?.tipoCalculo === 'decimo_terceiro'
                    ? 'Resumo do 13º Salário'
                    : 'Resumo da Folha'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {result?.feriasRateioInss?.ativo
                  ? `Férias Partidas · INSS proporcional a ${result.feriasRateioInss.competencia1Rotulo} (${result.feriasRateioInss.diasMes1}/${result.feriasRateioInss.totalDiasFerias} dias)`
                  : `Tabela oficial de fechamento — ${moduleName}`}
              </span>
            </div>

            <div className="overflow-hidden border border-slate-200 rounded-lg">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                      Item
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Base
                    </th>
                    <th scope="col" className="py-2.5 px-3 text-right font-semibold text-slate-900 w-44">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {/* Proventos */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-semibold text-slate-900">
                      Proventos
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {result ? formatBRL(result.totalProventos) : 'R$ 0,00'}
                    </td>
                  </tr>

                  {/* INSS */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>
                        {result?.feriasRateioInss?.ativo
                          ? `INSS (Proporcional ${result.feriasRateioInss.competencia1Rotulo} · ${result.feriasRateioInss.diasMes1}/${result.feriasRateioInss.totalDiasFerias}d)`
                          : 'INSS'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {result ? formatBRL(result.baseInss) : 'R$ 0,00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      {result ? formatBRL(result.valorInss) : 'R$ 0,00'}
                    </td>
                  </tr>

                  {/* IRRF */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>IRRF</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {result ? formatBRL(result.baseIrrf) : 'R$ 0,00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-rose-700 tabular-nums">
                      {result ? formatBRL(result.valorIrrf) : 'R$ 0,00'}
                    </td>
                  </tr>

                  {/* Pensão */}
                  <tr className="hover:bg-slate-50/60 transition-colors bg-emerald-50/20">
                    <td className="py-2.5 pl-4 pr-3 font-semibold text-emerald-950 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      <span>
                        {result?.rateioBeneficiarios?.ativo
                          ? result.rateioBeneficiarios.somaPercentuais !== undefined
                            ? `Pensão Alimentícia — Evento Único (Soma: ${formatPercentage(
                                result.rateioBeneficiarios.somaPercentuais
                              )})`
                            : `Pensão Alimentícia — Evento Único (${result.rateioBeneficiarios.quantidadeBeneficiarios} filhos)`
                          : 'Pensão'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {result ? formatBRL(result.basePensao) : 'R$ 0,00'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 tabular-nums">
                      {result ? formatBRL(result.valorPensao) : 'R$ 0,00'}
                    </td>
                  </tr>
                  {result?.rateioBeneficiarios?.ativo &&
                    result.rateioBeneficiarios.beneficiarios.map((b) => (
                      <tr key={b.id} className="bg-indigo-50/30 text-[11px] text-slate-600">
                        <td className="py-1.5 pl-9 pr-3">
                          ↳ Cálculo separado: <strong className="text-slate-800">{b.label}</strong> ={' '}
                          <span className="font-mono font-semibold text-indigo-950">
                            {b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                          {formatBRL(b.baseAplicada)}
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono font-semibold text-indigo-900 tabular-nums">
                          {formatBRL(b.valorCalculado)}
                        </td>
                      </tr>
                    ))}

                  {/* Outros descontos */}
                  <tr className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 pl-4 pr-3 font-medium text-slate-800">
                      Outros descontos
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 tabular-nums">
                      —
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700 tabular-nums">
                      {result ? formatBRL(result.outrosDescontos) : 'R$ 0,00'}
                    </td>
                  </tr>

                  {/* LÍQUIDO */}
                  <tr className="bg-slate-900 text-white font-bold">
                    <td className="py-3 pl-4 pr-3 text-xs uppercase tracking-wider text-emerald-400 font-bold">
                      Líquido
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-400 tabular-nums">
                      —
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-sm font-bold text-emerald-400 tabular-nums">
                      {result ? formatBRL(result.liquidoAposPensao) : 'R$ 0,00'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* PAINEL DEDICADO: FÉRIAS PARTIDAS — INSS PROPORCIONAL NO RECIBO E RECÁLCULO NA FOLHA SEGUINTE */}
          {result?.feriasRateioInss?.ativo && (
            <div className="border border-indigo-200 rounded-xl p-4 bg-indigo-50/50 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-indigo-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-indigo-900 text-white flex items-center justify-center shrink-0">
                    <Split className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                      Rateio de INSS — Férias Partidas ({result.feriasRateioInss.dataInicio} a {result.feriasRateioInss.dataFim})
                    </h3>
                    <p className="text-[11px] text-indigo-800">
                      No recibo incide apenas o INSS proporcional a <strong>{result.feriasRateioInss.competencia1Rotulo}</strong>; a fração restante é recalculada na folha de <strong>{result.feriasRateioInss.competencia2Rotulo}</strong>.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono bg-white border border-indigo-200 px-2.5 py-1 rounded text-indigo-950 font-semibold self-start sm:self-auto">
                  {result.feriasRateioInss.totalDiasFerias} dias ({result.feriasRateioInss.diasMes1}d em {result.feriasRateioInss.competencia1Rotulo} + {result.feriasRateioInss.diasMes2}d em {result.feriasRateioInss.competencia2Rotulo})
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Competência 1 — Recibo de Férias */}
                <div className="p-3.5 bg-white rounded-lg border border-indigo-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-indigo-950 uppercase text-[11px]">
                      1. Recibo de Férias ({result.feriasRateioInss.competencia1Rotulo})
                    </span>
                    <span className="font-mono text-[11px] bg-indigo-50 text-indigo-900 px-2 py-0.5 rounded border border-indigo-200 font-semibold">
                      {result.feriasRateioInss.diasMes1}/{result.feriasRateioInss.totalDiasFerias} dias ({formatPercentage(result.feriasRateioInss.proporcaoMes1 * 100)})
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Base INSS integral das férias (100%):</span>
                      <span className="font-mono tabular-nums">{formatBRL(result.feriasRateioInss.baseInssTotalFerias)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fração férias {result.feriasRateioInss.competencia1Rotulo} ({formatPercentage(result.feriasRateioInss.proporcaoMes1 * 100)}):</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">{formatBRL(result.feriasRateioInss.baseInssFeriasMes1)}</span>
                    </div>
                    {result.feriasRateioInss.remuneracaoTrabalhadaMes1 > 0 && (
                      <div className="flex justify-between">
                        <span>(+) Remuneração trabalhada {result.feriasRateioInss.competencia1Rotulo}:</span>
                        <span className="font-mono tabular-nums">{formatBRL(result.feriasRateioInss.remuneracaoTrabalhadaMes1)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Base INSS aplicada no recibo:</span>
                      <span className="font-mono font-semibold text-indigo-950 tabular-nums">{formatBRL(result.feriasRateioInss.baseTotalInssMes1)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>INSS se cobrado integral (referência):</span>
                      <span className="font-mono tabular-nums">{formatBRL(result.feriasRateioInss.inssIntegralReferencia)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-indigo-950">
                    <span>INSS cobrado no Recibo ({result.feriasRateioInss.competencia1Rotulo}):</span>
                    <span className="font-mono text-sm text-rose-700 tabular-nums">
                      {formatBRL(result.feriasRateioInss.inssNoReciboMes1)}
                    </span>
                  </div>
                </div>

                {/* Competência 2 — Recálculo na Folha Seguinte */}
                <div className="p-3.5 bg-white rounded-lg border border-indigo-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900 uppercase text-[11px]">
                      2. Recálculo na Folha ({result.feriasRateioInss.competencia2Rotulo})
                    </span>
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200 font-semibold">
                      {result.feriasRateioInss.diasMes2}/{result.feriasRateioInss.totalDiasFerias} dias ({formatPercentage(result.feriasRateioInss.proporcaoMes2 * 100)})
                    </span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <div className="flex justify-between">
                      <span>Fração férias em {result.feriasRateioInss.competencia2Rotulo} ({formatPercentage(result.feriasRateioInss.proporcaoMes2 * 100)}):</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">{formatBRL(result.feriasRateioInss.baseInssFeriasMes2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(+) Remuneração trabalhada em {result.feriasRateioInss.competencia2Rotulo}:</span>
                      <span className="font-mono tabular-nums">{formatBRL(result.feriasRateioInss.remuneracaoTrabalhadaMes2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>(=) Base INSS recalculada ({result.feriasRateioInss.competencia2Rotulo}):</span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums">
                        {formatBRL(result.feriasRateioInss.baseTotalInssMes2)}
                        {result.feriasRateioInss.tetoAplicadoMes2 ? ' (Teto)' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Diferença diferida do recibo vs integral:</span>
                      <span className="font-mono tabular-nums">{formatBRL(result.feriasRateioInss.diferencaInssReciboVsCheio)}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                    <span>INSS Recalculado na Folha {result.feriasRateioInss.competencia2Rotulo}:</span>
                    <span className="font-mono text-sm text-indigo-900 tabular-nums">
                      {formatBRL(result.feriasRateioInss.inssRecalculadoMes2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-white/90 border border-indigo-200/80 rounded-lg text-[11px] text-slate-700 space-y-1">
                <p>
                  <strong>Reflexo no IRRF e na Pensão do Recibo:</strong> {result.feriasRateioInss.notaImpactoPensao}
                </p>
                {result.feriasRateioInss.tabelaMes2Provisoria && (
                  <p className="text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{result.feriasRateioInss.tabelaMes2Observacao}.</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 2. GRID DE COMPONENTES DETALHADOS (Seções 8, 12, 13 e 14) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco: TOTAL DE PROVENTOS (Seção 8) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Total de Proventos
                </span>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {result ? formatBRL(result.totalProventos) : 'R$ 0,00'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Salário:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(comp.salario)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Horas extras:</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(comp.horasExtras)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Adicionais (Noturno/Insalubridade/Periculosidade):</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(comp.adicionais)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Outras (Comissão/Gratificação/Diversas):</span>
                  <span className="font-mono text-slate-800 tabular-nums">{formatBRL(comp.outras)}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Total:</span>
                <span className="font-mono text-sm text-slate-950 tabular-nums">
                  {result ? formatBRL(result.totalProventos) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            {/* Bloco: BASE DA PENSÃO (Seção 12) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                <span className="text-xs font-bold text-slate-900 uppercase">
                  Base da Pensão
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800">
                  {result ? formatBRL(result.basePensao) : 'R$ 0,00'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <div>
                  <div className="font-semibold text-slate-700 text-[11px]">Verbas incluídas:</div>
                  <div className="pl-2 space-y-0.5 mt-0.5">
                    {result && result.verbasConsideradasNaBase.length > 0 ? (
                      result.verbasConsideradasNaBase.slice(0, 3).map((v) => (
                        <div key={v.id} className="flex justify-between text-[11px]">
                          <span>{v.label}:</span>
                          <span className="font-mono text-slate-800">{formatBRL(v.value)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">Nenhuma verba ativa</span>
                    )}
                    {result && result.verbasConsideradasNaBase.length > 3 && (
                      <div className="text-[10px] text-slate-500 italic">
                        + {result.verbasConsideradasNaBase.length - 3} outra(s) verba(s)
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-slate-800 pt-0.5 text-[11px]">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatBRL(somaVerbasIncluidas)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] pt-1">
                  <span>Verbas excluídas:</span>
                  <span className="font-mono text-slate-700">{formatBRL(somaVerbasExcluidas)}</span>
                </div>

                <div className="flex justify-between items-center text-[11px]">
                  <span>Deduções permitidas (INSS/IRRF):</span>
                  <span className="font-mono text-rose-700">(-) {formatBRL(somaDeducoesBase)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex justify-between items-center text-xs font-bold text-slate-900">
                <span>Base final:</span>
                <span className="font-mono text-sm text-emerald-800 tabular-nums">
                  {result ? formatBRL(result.basePensao) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            {/* Bloco: RESULTADO DA PENSÃO (Seção 13) */}
            <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                <span className="text-xs font-bold text-emerald-950 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Resultado da Pensão</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-800 font-semibold">
                  Regra: {result ? result.regraTexto : '—'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Percentual / Regra:</span>
                  <span className="font-bold text-slate-900">{result ? result.regraTexto : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Base apurada:</span>
                  <span className="font-mono text-slate-800">{result ? formatBRL(result.basePensao) : 'R$ 0,00'}</span>
                </div>
                <div className="p-2 bg-white/80 rounded border border-emerald-200/60 text-[11px] font-mono text-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px]">Cálculo:</span>
                  {result?.rateioBeneficiarios?.ativo ? (
                    <div className="space-y-0.5">
                      {result.rateioBeneficiarios.beneficiarios.map((b) => (
                        <div key={b.id} className="flex justify-between gap-2">
                          <span>
                            {b.label} ={' '}
                            {b.percentual !== undefined
                              ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
                              : formatBRL(b.valorFixo || 0)}
                          </span>
                          <span className="font-semibold text-slate-950 shrink-0">= {formatBRL(b.valorCalculado)}</span>
                        </div>
                      ))}
                      <div className="pt-1 mt-1 border-t border-emerald-200/80 flex flex-wrap justify-between gap-1 font-bold text-emerald-900">
                        <span>
                          EVENTO ÚNICO (Soma:{' '}
                          {result.rateioBeneficiarios.somaPercentuais !== undefined
                            ? formatPercentage(result.rateioBeneficiarios.somaPercentuais)
                            : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`}
                          )
                        </span>
                        <span>
                          = {result.rateioBeneficiarios.beneficiarios.map((b) => formatBRL(b.valorCalculado)).join(' + ')} = {formatBRL(result.valorPensao)}
                        </span>
                      </div>
                    </div>
                  ) : result?.auditLog.ruleType === 'valor_fixo' ? (
                    <span>Valor Fixo Determinado = {formatBRL(result.valorPensao)}</span>
                  ) : (
                    <span>
                      {formatBRL(result?.basePensao || 0)} × {result?.regraTexto || '0%'} = {formatBRL(result?.valorPensao || 0)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-950">
                <span className="uppercase tracking-wider">
                  {result?.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
                    ? `Evento Pensão (${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}):`
                    : result?.rateioBeneficiarios?.ativo
                    ? 'Total Consolidado (1 Evento):'
                    : 'Pensão Alimentícia:'}
                </span>
                <span className="font-mono text-base text-emerald-700 font-bold tabular-nums">
                  {result ? formatBRL(result.valorPensao) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            {/* Bloco: RESULTADO LÍQUIDO (Seção 14) */}
            <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Resultado Líquido
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {result ? formatBRL(result.liquidoAposPensao) : 'R$ 0,00'}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span>Total de proventos:</span>
                  <span className="font-mono text-white tabular-nums">{result ? formatBRL(result.totalProventos) : 'R$ 0,00'}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− INSS:</span>
                  <span className="font-mono tabular-nums">− {result ? formatBRL(result.valorInss) : 'R$ 0,00'}</span>
                </div>
                <div className="flex justify-between items-center text-rose-300">
                  <span>− IRRF:</span>
                  <span className="font-mono tabular-nums">− {result ? formatBRL(result.valorIrrf) : 'R$ 0,00'}</span>
                </div>
                <div className="flex justify-between items-center text-emerald-300">
                  <span>− Pensão:</span>
                  <span className="font-mono tabular-nums">− {result ? formatBRL(result.valorPensao) : 'R$ 0,00'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>− Outros descontos aplicáveis:</span>
                  <span className="font-mono tabular-nums">− {formatBRL(valorOutrosDescontosAplicados)}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs font-bold">
                <span className="text-white uppercase tracking-wider">= Líquido:</span>
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {result ? formatBRL(result.liquidoAposPensao) : 'R$ 0,00'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
          Preencha os proventos, encargos e regras acima e clique em <strong>"CALCULAR"</strong> para apurar os valores oficiais de INSS, IRRF, Pensão e Líquido.
        </div>
      )}
    </div>
  );
};
