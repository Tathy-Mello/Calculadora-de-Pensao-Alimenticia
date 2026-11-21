/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { OFFICIAL_INSS_TABLES } from '../utils/inssTables';
import { OFFICIAL_IRRF_TABLES } from '../utils/irrfTables';
import { InssTable } from '../types/inss';
import { IrrfTable } from '../types/irrf';
import {
  Table,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  Layers,
  ArrowUpRight,
  UserCheck,
  FileText,
} from 'lucide-react';
import { ContextHelp } from './ContextHelp';

export function TablesManagerSection() {
  const [activeTab, setActiveTab] = useState<'inss' | 'irrf'>('inss');
  const [selectedInssYear, setSelectedInssYear] = useState<number>(2026);
  const [selectedIrrfId, setSelectedIrrfId] = useState<string>('irrf_2026_geral');

  // Validador de consistência para Tabela de INSS
  const validateInssTable = (table: InssTable): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    if (!table.faixas || table.faixas.length === 0) {
      issues.push('A tabela não possui faixas de contribuição configuradas.');
    } else {
      // Verificar se a primeira faixa começa em 0
      if (table.faixas[0].faixaInicial !== 0) {
        issues.push(`A 1ª faixa deve iniciar em R$ 0,00 (iniciou em R$ ${table.faixas[0].faixaInicial}).`);
      }
      // Verificar ordenação e continuidade
      for (let i = 0; i < table.faixas.length - 1; i++) {
        const current = table.faixas[i];
        const next = table.faixas[i + 1];
        if (current.faixaFinal >= next.faixaInicial) {
          issues.push(
            `Sobreposição entre faixa ${current.faixaNumero} (fim: ${current.faixaFinal}) e faixa ${next.faixaNumero} (início: ${next.faixaInicial}).`
          );
        } else if (Math.abs(next.faixaInicial - current.faixaFinal - 0.01) > 0.02) {
          issues.push(
            `Lacuna entre faixa ${current.faixaNumero} (fim: ${current.faixaFinal}) e faixa ${next.faixaNumero} (início: ${next.faixaInicial}).`
          );
        }
      }
    }

    if (!table.tetoPrevidenciario || table.tetoPrevidenciario <= 0) {
      issues.push('Teto previdenciário não informado ou inválido.');
    }
    if (!table.vigenciaInicial || !table.vigenciaFinal) {
      issues.push('Período de vigência incompleto.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  // Validador de consistência para Tabela de IRRF
  const validateIrrfTable = (table: IrrfTable): { isValid: boolean; issues: string[] } => {
    const issues: string[] = [];
    if (!table.faixas || table.faixas.length === 0) {
      issues.push('A tabela não possui faixas tributárias configuradas.');
    } else {
      if (table.faixas[0].faixaInicial !== 0) {
        issues.push(`A 1ª faixa deve iniciar em R$ 0,00.`);
      }
      for (let i = 0; i < table.faixas.length - 1; i++) {
        const current = table.faixas[i];
        const next = table.faixas[i + 1];
        if (current.faixaFinal !== Infinity && current.faixaFinal >= next.faixaInicial) {
          issues.push(
            `Sobreposição entre faixa ${current.faixaNumero} (fim: ${current.faixaFinal}) e faixa ${next.faixaNumero} (início: ${next.faixaInicial}).`
          );
        }
      }
    }

    if (table.deducaoPorDependente < 0) {
      issues.push('Valor de dedução por dependente inválido.');
    }
    if (!table.vigenciaInicial) {
      issues.push('Vigência inicial não informada.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  };

  const currentInssTable = useMemo(() => {
    return OFFICIAL_INSS_TABLES.find((t) => t.ano === selectedInssYear) || OFFICIAL_INSS_TABLES[0];
  }, [selectedInssYear]);

  const currentIrrfTable = useMemo(() => {
    return OFFICIAL_IRRF_TABLES.find((t) => t.id === selectedIrrfId) || OFFICIAL_IRRF_TABLES[0];
  }, [selectedIrrfId]);

  const inssValidation = useMemo(() => validateInssTable(currentInssTable), [currentInssTable]);
  const irrfValidation = useMemo(() => validateIrrfTable(currentIrrfTable), [currentIrrfTable]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Tabelas Tributárias e Parâmetros Oficiais
                </h2>
                <ContextHelp
                  title="Tabelas Tributárias Oficiais"
                  content="As tabelas de INSS e IRRF são vinculadas ao Ano e Tipo de Cálculo informados. Elas contêm parâmetros auditáveis com faixas progressivas, tetos, alíquotas, deduções e regras de validação estritas."
                  impacto="Garante conformidade com as Portarias Ministeriais do MPS e Instruções Normativas da Receita Federal do Brasil."
                />
              </div>
              <p className="text-xs text-slate-500">
                Consulta, rastreabilidade de vigência, fontes legais e validação de consistência matemática
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('inss')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'inss'
                  ? 'bg-white text-indigo-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabelas de INSS (RGPS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('irrf')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === 'irrf'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tabelas de IRRF (RFB)
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'inss' && (
        <div className="space-y-6">
          {/* Seletor de Ano da Tabela de INSS */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2">Vigências Disponíveis:</span>
            {OFFICIAL_INSS_TABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedInssYear(t.ano)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedInssYear === t.ano
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Ano {t.ano}</span>
                {t.ano === 2026 && (
                  <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] rounded font-bold">
                    Vigente
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Validação de Consistência */}
          {!inssValidation.isValid ? (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900">
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>A tabela possui configuração incompleta ou inconsistente e não pode ser utilizada.</span>
              </div>
              <ul className="text-xs list-disc list-inside space-y-0.5 text-rose-800">
                {inssValidation.issues.map((iss, idx) => (
                  <li key={idx}>{iss}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Tabela consistente: Sem lacunas ou sobreposições. Pronta para apuração automática.
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-mono">Status: Consistente</span>
            </div>
          )}

          {/* Cartão de Metadados e Parâmetros Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Ano de Referência
              </span>
              <div className="text-xl font-bold text-slate-900">{currentInssTable.ano}</div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Vigência: {currentInssTable.vigenciaInicial} até {currentInssTable.vigenciaFinal}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Teto Previdenciário (RGPS)
              </span>
              <div className="text-xl font-bold text-indigo-700">
                R$ {currentInssTable.tetoPrevidenciario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Contribuição Máxima: R$ {currentInssTable.tetoMaximoContribuicao?.toFixed(2)}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Fonte Normativa
              </span>
              <div className="text-xs font-medium text-slate-800 line-clamp-2">
                {currentInssTable.fonte}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Regulamentação Oficial</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Modalidade de Aplicação
              </span>
              <div className="text-sm font-bold text-slate-800 capitalize">
                {currentInssTable.tipoCalculo === 'todos' ? 'Geral (Todas as Folhas)' : currentInssTable.tipoCalculo}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Progressividade Automática</span>
            </div>
          </div>

          {/* Tabela de Faixas Progressivas */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Faixas Progressivas de Contribuição Previdenciária
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cálculo fatiado por faixa salarial com alíquotas efetivas
                </p>
              </div>
              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs rounded-md font-mono font-medium">
                {currentInssTable.faixas.length} Faixas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-4 w-16">Faixa</th>
                    <th className="py-2.5 px-4">Salário de Contribuição (De / Até)</th>
                    <th className="py-2.5 px-4 text-center">Alíquota</th>
                    <th className="py-2.5 px-4 text-right">Parcela a Deduzir</th>
                    <th className="py-2.5 px-4">Descrição Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                  {currentInssTable.faixas.map((fx) => (
                    <tr key={fx.faixaNumero} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {fx.faixaNumero}ª Faixa
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {fx.faixaInicial === 0
                          ? `Até R$ ${fx.faixaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : `R$ ${fx.faixaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até R$ ${fx.faixaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded font-bold font-mono">
                          {fx.aliquota.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {(fx.parcelaADeduzir ?? 0) > 0
                          ? `R$ ${(fx.parcelaADeduzir || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {fx.observacao || 'Conforme portaria'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                <strong>Regra de Cálculo:</strong> O motor previdenciário fatia a base de cálculo real pelas faixas acima,
                respeitando o teto de R$ {currentInssTable.tetoPrevidenciario.toFixed(2)}. Não é permitida dedução retroativa nem estimativa arbitrária.
              </span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'irrf' && (
        <div className="space-y-6">
          {/* Seletor de Tabela de IRRF */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-2">Tabelas Disponíveis:</span>
            {OFFICIAL_IRRF_TABLES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedIrrfId(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedIrrfId === t.id
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs font-semibold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {t.tipoCalculo === 'plr' ? 'PLR Exclusivo' : `Geral ${t.ano}`}
                </span>
                {t.id === 'irrf_2026_geral' && (
                  <span className="px-1.5 py-0.2 bg-emerald-400 text-emerald-950 text-[10px] rounded font-bold">
                    Novo Redutor 2026
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Validação de Consistência */}
          {!irrfValidation.isValid ? (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900">
              <div className="flex items-center gap-2 font-bold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>A tabela possui configuração incompleta ou inconsistente e não pode ser utilizada.</span>
              </div>
              <ul className="text-xs list-disc list-inside space-y-0.5 text-rose-800">
                {irrfValidation.issues.map((iss, idx) => (
                  <li key={idx}>{iss}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  Tabela IRRF auditada: Parâmetros progressivos consistentes e compatíveis com a RFB.
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-mono">Status: Aprovado</span>
            </div>
          )}

          {/* Cartões de Parâmetros de IRRF */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Dedução por Dependente
              </span>
              <div className="text-xl font-bold text-slate-900">
                R$ {currentIrrfTable.deducaoPorDependente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {currentIrrfTable.deducaoPorDependente === 0
                  ? 'Não se aplica a esta tabela (PLR)'
                  : 'Por dependente legal comprovado'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Desconto Simplificado Mensal
              </span>
              <div className="text-xl font-bold text-emerald-700">
                {currentIrrfTable.descontoSimplificadoMensal
                  ? `R$ ${currentIrrfTable.descontoSimplificadoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Não aplicável'}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                Opção legal quando mais benéfica
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Redutor Adicional (2026)
              </span>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                {currentIrrfTable.redutorAdicional?.ativo ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    <span>Ativo (Até R$ 7.350,00)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block"></span>
                    <span className="text-slate-500">Inativo / Não previsto</span>
                  </>
                )}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {currentIrrfTable.redutorAdicional?.ativo
                  ? `Redução fixa R$ 312,89 até R$ 5.000`
                  : 'Tabela progressiva convencional'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Fonte Normativa
              </span>
              <div className="text-xs font-medium text-slate-800 line-clamp-2">
                {currentIrrfTable.fonte}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">RFB / Lei Federal</span>
            </div>
          </div>

          {/* Tabela de Faixas de IRRF */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Faixas Tributárias da Tabela Mensal do IRRF
                </h3>
                <p className="text-[11px] text-slate-500">
                  {currentIrrfTable.observacoes}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-md font-mono font-medium">
                {currentIrrfTable.faixas.length} Faixas
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-2.5 px-4 w-16">Faixa</th>
                    <th className="py-2.5 px-4">Base de Cálculo (De / Até)</th>
                    <th className="py-2.5 px-4 text-center">Alíquota</th>
                    <th className="py-2.5 px-4 text-right">Parcela a Deduzir</th>
                    <th className="py-2.5 px-4">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                  {currentIrrfTable.faixas.map((fx) => (
                    <tr key={fx.faixaNumero} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-600">
                        {fx.faixaNumero}ª Faixa
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        {fx.faixaFinal === Infinity
                          ? `Acima de R$ ${fx.faixaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : fx.faixaInicial === 0
                          ? `Até R$ ${fx.faixaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : `De R$ ${fx.faixaInicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} até R$ ${fx.faixaFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold font-mono ${
                            fx.aliquota === 0
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {fx.aliquota === 0 ? 'Isento' : `${fx.aliquota.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        {fx.parcelaADeduzir > 0
                          ? `R$ ${fx.parcelaADeduzir.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {fx.observacao || 'Conforme legislação RFB'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentIrrfTable.redutorAdicional?.ativo && (
              <div className="p-4 bg-emerald-50/60 border-t border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Regra Especial do Redutor Adicional 2026:</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  • <strong>Até R$ 5.000,00 de Rendimentos Tributáveis:</strong> Aplica-se redutor fixo de R$ 312,89, zerando o imposto devido para bases nessa faixa.
                  <br />
                  • <strong>De R$ 5.000,01 a R$ 7.350,00:</strong> Redução parcial calculada pela fórmula oficial: <code>R$ 978,61 − (0,133145 × Rendimento Tributável)</code>.
                  <br />
                  • <strong>Acima de R$ 7.350,00:</strong> Aplicação direta da tabela progressiva integral sem redução adicional.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
