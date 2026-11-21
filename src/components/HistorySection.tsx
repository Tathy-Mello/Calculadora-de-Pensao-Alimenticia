/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CalculoHistoricoCompleto, StatusCalculoHistorico } from '../types/phase11';
import { CalculationType } from '../types/pension';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Copy,
  GitBranch,
  Trash2,
  FileText,
  Calendar,
  Layers,
  Clock,
  Printer,
  X,
  Scale,
  ShieldCheck,
  CheckCheck,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { ContextHelp } from './ContextHelp';
import { exportCalculationToExcel, exportCalculationToPdf, exportHistoryToExcel } from '../utils/exportUtils';

export interface HistorySectionProps {
  historico: CalculoHistoricoCompleto[];
  onOpenCalculo: (item: CalculoHistoricoCompleto) => void;
  onDuplicateCalculo: (item: CalculoHistoricoCompleto) => void;
  onNewVersionCalculo: (item: CalculoHistoricoCompleto) => void;
  onDeleteCalculo: (id: string) => void;
}

const STATUS_CONFIG: Record<
  StatusCalculoHistorico,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  calculado: {
    label: 'Calculado',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    icon: CheckCircle2,
  },
  atencao: {
    label: 'Atenção',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    icon: AlertTriangle,
  },
  bloqueado: {
    label: 'Bloqueado',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    icon: XCircle,
  },
  conferido: {
    label: 'Conferido',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    icon: CheckCheck,
  },
  divergente: {
    label: 'Divergente',
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    icon: Scale,
  },
};

export function HistorySection({
  historico,
  onOpenCalculo,
  onDuplicateCalculo,
  onNewVersionCalculo,
  onDeleteCalculo,
}: HistorySectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModulo, setFilterModulo] = useState<string>('todos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'oficial' | 'simulacao'>('todos');
  const [detailItem, setDetailItem] = useState<CalculoHistoricoCompleto | null>(null);

  const filteredHistory = useMemo(() => {
    return historico.filter((item) => {
      const matchSearch =
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.competencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.moduloRotulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.regraNome.toLowerCase().includes(searchTerm.toLowerCase());

      const matchModulo = filterModulo === 'todos' || item.modulo === filterModulo;
      const matchStatus = filterStatus === 'todos' || item.statusCalculo === filterStatus;
      const matchTipo =
        filterTipo === 'todos' ||
        (filterTipo === 'simulacao' && item.isSimulacao) ||
        (filterTipo === 'oficial' && !item.isSimulacao);

      return matchSearch && matchModulo && matchStatus && matchTipo;
    });
  }, [historico, searchTerm, filterModulo, filterStatus, filterTipo]);

  const handleExportJSON = (item: CalculoHistoricoCompleto) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(item, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${item.id}_${item.matricula}_dossie.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Histórico Auditável de Cálculos
                </h2>
                <ContextHelp
                  title="Histórico e Preservação de Versões"
                  content="Cada cálculo realizado gera um registro inalterável com versão, data/hora, matrícula, entradas originais, parâmetros e resultados. Recalcular não apaga o histórico: cria uma nova versão rastreável."
                  impacto="Segurança e conformidade trabalhista: permite resgatar e comprovar o cálculo exato realizado para auditoria de DP."
                />
              </div>
              <p className="text-xs text-slate-500">
                Consulta, duplicidade, versionamento e auditoria completa de pensões calculadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => exportHistoryToExcel(filteredHistory)}
              disabled={filteredHistory.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Baixar todos os registros filtrados em planilha Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>Exportar Histórico em Excel (.xlsx)</span>
            </button>
            <span className="text-xs font-mono px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold">
              Total: {historico.length} {historico.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por matrícula, ID, competência ou regra..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Módulo:</span>
            <select
              value={filterModulo}
              onChange={(e) => setFilterModulo(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
            >
              <option value="todos">Todos os Módulos</option>
              <option value="folha_mensal">Folha Mensal</option>
              <option value="ferias">Férias</option>
              <option value="decimo_terceiro">13º Salário</option>
              <option value="rescisao">Rescisão</option>
              <option value="plr">PLR</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="calculado">🟢 Calculado</option>
              <option value="atencao">🟡 Atenção</option>
              <option value="bloqueado">🔴 Bloqueado</option>
              <option value="conferido">🔵 Conferido</option>
              <option value="divergente">🟠 Divergente</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Natureza:</span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="text-xs py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
            >
              <option value="todos">Todos</option>
              <option value="oficial">Cálculos Oficiais</option>
              <option value="simulacao">Simulações</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-4 w-28">ID / Versão</th>
                <th className="py-2.5 px-4">Data / Hora</th>
                <th className="py-2.5 px-3">Módulo</th>
                <th className="py-2.5 px-3 font-mono">Matrícula</th>
                <th className="py-2.5 px-3">Competência</th>
                <th className="py-2.5 px-3 text-right">Proventos</th>
                <th className="py-2.5 px-3 text-right">INSS + IRRF</th>
                <th className="py-2.5 px-3 text-right font-bold text-amber-900">Pensão</th>
                <th className="py-2.5 px-3 text-right font-bold text-slate-900">Líquido</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-xs text-slate-400">
                    Nenhum cálculo registrado ou encontrado com os filtros atuais.
                    <br />
                    Execute um cálculo em qualquer módulo para gerar registros automáticos.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((item) => {
                  const statusConf = STATUS_CONFIG[item.statusCalculo] || STATUS_CONFIG.calculado;
                  const StatusIcon = statusConf.icon;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-mono font-bold text-slate-800">{item.id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          v{item.versaoNumero} {item.isSimulacao && '· Simulação'}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.dataHora}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {item.moduloRotulo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {item.matricula || 'Sem matrícula'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {item.competencia}/{item.ano}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        R$ {item.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                        R$ {(item.valorInss + item.valorIrrf).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                        R$ {item.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        R$ {item.liquidoAposPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConf.label}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              exportCalculationToExcel({
                                result: item.resultadoSnapshot,
                                identification: item.identification,
                                earnings: item.earnings,
                                deductions: item.deductions,
                                moduleName: item.moduloRotulo,
                              })
                            }
                            className="p-1 text-emerald-700 hover:text-emerald-950 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Exportar este cálculo para Excel (.xlsx)"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              exportCalculationToPdf(
                                {
                                  result: item.resultadoSnapshot,
                                  identification: item.identification,
                                  earnings: item.earnings,
                                  deductions: item.deductions,
                                  moduleName: item.moduloRotulo,
                                },
                                'completo'
                              )
                            }
                            className="p-1 text-rose-700 hover:text-rose-950 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Baixar Dossiê em PDF (.pdf)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailItem(item)}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Visualizar Dossiê do Cálculo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenCalculo(item)}
                            className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                            title="Abrir no Módulo de Cálculo"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateCalculo(item)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                            title="Duplicar Cálculo"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onNewVersionCalculo(item)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                            title="Criar Nova Versão (Recalcular)"
                          >
                            <GitBranch className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCalculo(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Dossiê e Detalhes do Cálculo */}
      {detailItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Dossiê Auditável — {detailItem.id} (v{detailItem.versaoNumero})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Matrícula: {detailItem.matricula} · {detailItem.moduloRotulo} · {detailItem.competencia}/{detailItem.ano}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    exportCalculationToExcel({
                      result: detailItem.resultadoSnapshot,
                      identification: detailItem.identification,
                      earnings: detailItem.earnings,
                      deductions: detailItem.deductions,
                      moduleName: detailItem.moduloRotulo,
                    })
                  }
                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border border-emerald-300 rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Baixar em formato Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    exportCalculationToPdf(
                      {
                        result: detailItem.resultadoSnapshot,
                        identification: detailItem.identification,
                        earnings: detailItem.earnings,
                        deductions: detailItem.deductions,
                        moduleName: detailItem.moduloRotulo,
                      },
                      'completo'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 rounded-lg flex items-center gap-1 cursor-pointer"
                  title="Baixar Dossiê em PDF (.pdf)"
                >
                  <FileText className="w-3.5 h-3.5 text-rose-600" />
                  <span>PDF (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExportJSON(detailItem)}
                  className="px-2.5 py-1 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-2.5 py-1 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">
              {/* Resumo Financeiro */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Proventos</span>
                  <span className="text-base font-bold font-mono text-slate-900">
                    R$ {detailItem.totalProventos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 uppercase font-semibold block">INSS Apurado</span>
                  <span className="text-base font-bold font-mono text-indigo-900">
                    R$ {detailItem.valorInss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-700 uppercase font-semibold block">IRRF Apurado</span>
                  <span className="text-base font-bold font-mono text-emerald-900">
                    R$ {detailItem.valorIrrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-300">
                  <span className="text-[10px] text-amber-800 uppercase font-semibold block">Pensão Alimentícia</span>
                  <span className="text-base font-bold font-mono text-amber-900">
                    R$ {detailItem.valorPensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Regra de Pensão Aplicada */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Regra de Pensão Aplicada
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-mono text-[10px]">
                    Origem: {detailItem.origemRegra.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-900">{detailItem.regraNome}</div>
                <div className="text-slate-600 leading-relaxed font-sans">
                  {detailItem.resultadoSnapshot.regraTexto}
                </div>
              </div>

              {/* Composição das Verbas */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Verbas Informadas ({detailItem.earnings.length})
                </span>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Rubrica</th>
                        <th className="py-2 px-3 text-center">Incide INSS</th>
                        <th className="py-2 px-3 text-center">Incide IRRF</th>
                        <th className="py-2 px-3 text-center">Incide Pensão</th>
                        <th className="py-2 px-3 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailItem.earnings.map((e) => (
                        <tr key={e.id}>
                          <td className="py-1.5 px-3 font-medium text-slate-800">{e.label}</td>
                          <td className="py-1.5 px-3 text-center">{e.incideInss ? 'Sim' : 'Não'}</td>
                          <td className="py-1.5 px-3 text-center">{e.incideIrrf ? 'Sim' : 'Não'}</td>
                          <td className="py-1.5 px-3 text-center">{e.includedInPensionBase ? 'Sim' : 'Não'}</td>
                          <td className="py-1.5 px-3 text-right font-mono">
                            R$ {e.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botões do Dossiê */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    onOpenCalculo(detailItem);
                    setDetailItem(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Abrir este Cálculo no Módulo
                </button>
                <button
                  type="button"
                  onClick={() => setDetailItem(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
