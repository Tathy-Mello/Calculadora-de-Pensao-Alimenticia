/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { VerbaCadastrada } from '../types/phase11';
import {
  Coins,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import { ContextHelp } from './ContextHelp';

export interface EarningsManagerSectionProps {
  verbas: VerbaCadastrada[];
  onAddVerba: (verba: Omit<VerbaCadastrada, 'id'>) => void;
  onUpdateVerba: (id: string, verba: Partial<VerbaCadastrada>) => void;
  onDeleteVerba: (id: string) => void;
}

export function EarningsManagerSection({
  verbas,
  onAddVerba,
  onUpdateVerba,
  onDeleteVerba,
}: EarningsManagerSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<'todos' | 'provento' | 'desconto'>('todos');
  const [filterNatureza, setFilterNatureza] = useState<string>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formTipo, setFormTipo] = useState<'provento' | 'desconto'>('provento');
  const [formNatureza, setFormNatureza] = useState<VerbaCadastrada['natureza']>('salarial');
  const [formIncideInss, setFormIncideInss] = useState(true);
  const [formIncideIrrf, setFormIncideIrrf] = useState(true);
  const [formIncidePensao, setFormIncidePensao] = useState(true);
  const [formParticipaFerias, setFormParticipaFerias] = useState(true);
  const [formParticipaDecimo, setFormParticipaDecimo] = useState(true);
  const [formParticipaRescisao, setFormParticipaRescisao] = useState(true);
  const [formParticipaPlr, setFormParticipaPlr] = useState(false);
  const [formStatus, setFormStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [formObservacao, setFormObservacao] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setFormCodigo('');
    setFormDescricao('');
    setFormTipo('provento');
    setFormNatureza('salarial');
    setFormIncideInss(true);
    setFormIncideIrrf(true);
    setFormIncidePensao(true);
    setFormParticipaFerias(true);
    setFormParticipaDecimo(true);
    setFormParticipaRescisao(true);
    setFormParticipaPlr(false);
    setFormStatus('ativa');
    setFormObservacao('');
    setFormError(null);
    setEditingId(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v: VerbaCadastrada) => {
    setEditingId(v.id);
    setFormCodigo(v.codigo);
    setFormDescricao(v.descricao);
    setFormTipo(v.tipo);
    setFormNatureza(v.natureza);
    setFormIncideInss(v.incideInss);
    setFormIncideIrrf(v.incideIrrf);
    setFormIncidePensao(v.incidePensao);
    setFormParticipaFerias(v.participaFerias);
    setFormParticipaDecimo(v.participaDecimo);
    setFormParticipaRescisao(v.participaRescisao);
    setFormParticipaPlr(v.participaPlr);
    setFormStatus(v.status);
    setFormObservacao(v.observacao || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCodigo.trim()) {
      setFormError('Informe o código da verba (ex: 001, 105, 210).');
      return;
    }
    if (!formDescricao.trim()) {
      setFormError('Informe a descrição da verba.');
      return;
    }

    if (editingId) {
      onUpdateVerba(editingId, {
        codigo: formCodigo.trim(),
        descricao: formDescricao.trim(),
        tipo: formTipo,
        natureza: formNatureza,
        incideInss: formIncideInss,
        incideIrrf: formIncideIrrf,
        incidePensao: formIncidePensao,
        participaFerias: formParticipaFerias,
        participaDecimo: formParticipaDecimo,
        participaRescisao: formParticipaRescisao,
        participaPlr: formParticipaPlr,
        status: formStatus,
        observacao: formObservacao.trim() || undefined,
      });
    } else {
      onAddVerba({
        codigo: formCodigo.trim(),
        descricao: formDescricao.trim(),
        tipo: formTipo,
        natureza: formNatureza,
        incideInss: formIncideInss,
        incideIrrf: formIncideIrrf,
        incidePensao: formIncidePensao,
        participaFerias: formParticipaFerias,
        participaDecimo: formParticipaDecimo,
        participaRescisao: formParticipaRescisao,
        participaPlr: formParticipaPlr,
        status: formStatus,
        observacao: formObservacao.trim() || undefined,
      });
    }

    setIsModalOpen(false);
    resetForm();
  };

  const filteredVerbas = verbas.filter((v) => {
    const matchSearch =
      v.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.observacao && v.observacao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTipo = filterTipo === 'todos' || v.tipo === filterTipo;
    const matchNatureza = filterNatureza === 'todos' || v.natureza === filterNatureza;
    return matchSearch && matchTipo && matchNatureza;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Catálogo de Verbas e Incidências
                </h2>
                <ContextHelp
                  title="Catálogo Central de Verbas"
                  content="Cada verba possui parametrizações tributárias e trabalhistas próprias. As incidências de INSS, IRRF, Pensão e a participação em Férias, 13º, Rescisão e PLR são configuradas de forma estritamente independente."
                  impacto="Evita presunções errôneas e padroniza a composição das bases em todos os módulos da calculadora."
                />
              </div>
              <p className="text-xs text-slate-500">
                Cadastro corporativo de rubricas, proventos, descontos e parâmetros fiscais/trabalhistas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Nova Verba</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código ou descrição da verba..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Tipo:</span>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value as any)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="provento">Proventos (+)</option>
              <option value="desconto">Descontos (-)</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500 font-medium">Natureza:</span>
            <select
              value={filterNatureza}
              onChange={(e) => setFilterNatureza(e.target.value)}
              className="text-xs py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium cursor-pointer"
            >
              <option value="todos">Todas as Naturezas</option>
              <option value="salarial">Salarial</option>
              <option value="indenizatoria">Indenizatória</option>
              <option value="variavel">Variável</option>
              <option value="beneficio">Benefício</option>
              <option value="outras">Outras</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 px-2 font-mono">
            {filteredVerbas.length} {filteredVerbas.length === 1 ? 'verba' : 'verbas'}
          </span>
        </div>
      </div>

      {/* Tabela de Verbas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-semibold">
                <th className="py-2.5 px-4 w-20">Código</th>
                <th className="py-2.5 px-4">Descrição da Verba</th>
                <th className="py-2.5 px-3">Tipo / Natureza</th>
                <th className="py-2.5 px-2 text-center" title="Incidência Previdenciária">INSS</th>
                <th className="py-2.5 px-2 text-center" title="Incidência Tributária RFB">IRRF</th>
                <th className="py-2.5 px-2 text-center" title="Composição da Base da Pensão">Pensão</th>
                <th className="py-2.5 px-2 text-center" title="Participa do cálculo de Férias">Férias</th>
                <th className="py-2.5 px-2 text-center" title="Participa do cálculo de 13º Salário">13º</th>
                <th className="py-2.5 px-2 text-center" title="Participa de Verbas Rescisórias">Rescisão</th>
                <th className="py-2.5 px-2 text-center" title="Participa da Apuração da PLR">PLR</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredVerbas.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-xs text-slate-400">
                    Nenhuma verba encontrada com os filtros informados.
                  </td>
                </tr>
              ) : (
                filteredVerbas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-700">
                      {v.codigo}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{v.descricao}</div>
                      {v.observacao && (
                        <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {v.observacao}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            v.tipo === 'provento'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {v.tipo === 'provento' ? 'Provento (+)' : 'Desconto (-)'}
                        </span>
                        <span className="text-[10px] text-slate-500 capitalize">
                          {v.natureza}
                        </span>
                      </div>
                    </td>

                    {/* Incidências */}
                    <td className="py-2.5 px-2 text-center">
                      {v.incideInss ? (
                        <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200">
                          Sim
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.incideIrrf ? (
                        <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                          Sim
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.incidePensao ? (
                        <span className="inline-block px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 font-bold text-[10px] border border-amber-200">
                          Sim
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.participaFerias ? (
                        <span className="text-emerald-600 font-bold text-[11px]">✓</span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">·</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.participaDecimo ? (
                        <span className="text-emerald-600 font-bold text-[11px]">✓</span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">·</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.participaRescisao ? (
                        <span className="text-emerald-600 font-bold text-[11px]">✓</span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">·</span>
                      )}
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      {v.participaPlr ? (
                        <span className="text-purple-600 font-bold text-[11px]">✓</span>
                      ) : (
                        <span className="text-slate-300 font-mono text-[11px]">·</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          v.status === 'ativa'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {v.status === 'ativa' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>

                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          title="Editar Verba"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteVerba(v.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Excluir Verba"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Verba */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Editar Verba Cadastrada' : 'Cadastrar Nova Verba'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Código <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    placeholder="Ex: 001"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-slate-400"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Descrição da Verba <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDescricao}
                    onChange={(e) => setFormDescricao(e.target.value)}
                    placeholder="Ex: Adicional Noturno 20%"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="provento">Provento (+)</option>
                    <option value="desconto">Desconto (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Natureza</label>
                  <select
                    value={formNatureza}
                    onChange={(e) => setFormNatureza(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="salarial">Salarial</option>
                    <option value="indenizatoria">Indenizatória</option>
                    <option value="variavel">Variável</option>
                    <option value="beneficio">Benefício</option>
                    <option value="outras">Outras</option>
                  </select>
                </div>
              </div>

              {/* Incidências Fiscais e Previdenciárias */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Incidências Independentes
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIncideInss}
                      onChange={(e) => setFormIncideInss(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="font-semibold text-slate-700">Incide INSS</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIncideIrrf}
                      onChange={(e) => setFormIncideIrrf(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-0"
                    />
                    <span className="font-semibold text-slate-700">Incide IRRF</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIncidePensao}
                      onChange={(e) => setFormIncidePensao(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span className="font-semibold text-slate-700">Incide Pensão</span>
                  </label>
                </div>
              </div>

              {/* Participação em Módulos */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Participação em Módulos de Cálculo
                </span>
                <div className="grid grid-cols-4 gap-2">
                  <label className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParticipaFerias}
                      onChange={(e) => setFormParticipaFerias(e.target.checked)}
                      className="rounded text-slate-700 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Férias</span>
                  </label>

                  <label className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParticipaDecimo}
                      onChange={(e) => setFormParticipaDecimo(e.target.checked)}
                      className="rounded text-slate-700 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-slate-700">13º Salário</span>
                  </label>

                  <label className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParticipaRescisao}
                      onChange={(e) => setFormParticipaRescisao(e.target.checked)}
                      className="rounded text-slate-700 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Rescisão</span>
                  </label>

                  <label className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formParticipaPlr}
                      onChange={(e) => setFormParticipaPlr(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className="text-[11px] font-medium text-slate-700">PLR</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Observações e Fundamentação
                </label>
                <textarea
                  rows={2}
                  value={formObservacao}
                  onChange={(e) => setFormObservacao(e.target.value)}
                  placeholder="Ex: Conforme art. 457 § 1º da CLT e Súmula 264 do TST."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações' : 'Cadastrar Verba'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
