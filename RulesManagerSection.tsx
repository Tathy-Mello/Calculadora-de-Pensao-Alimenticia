/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { RegraPensaoCadastrada } from '../types/phase11';
import { CalculationType, PensionBaseType, PensionRuleType } from '../types/pension';
import { formatBRL } from '../utils/formatters';
import {
  Sliders,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  X,
  Layers,
  Sparkles,
} from 'lucide-react';

interface RulesManagerSectionProps {
  regras: RegraPensaoCadastrada[];
  onAddRegra: (regra: RegraPensaoCadastrada) => void;
  onUpdateRegra: (regra: RegraPensaoCadastrada) => void;
  onDeleteRegra: (id: string) => void;
}

const MODULOS_LABEL: Record<CalculationType, string> = {
  folha_mensal: 'Folha',
  ferias: 'Férias',
  decimo_terceiro: '13º',
  rescisao: 'Rescisão',
  plr: 'PLR',
};

export const RulesManagerSection: React.FC<RulesManagerSectionProps> = ({
  regras,
  onAddRegra,
  onUpdateRegra,
  onDeleteRegra,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraPensaoCadastrada | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<PensionRuleType>('percentual');
  const [percentual, setPercentual] = useState<number>(20);
  const [valorFixo, setValorFixo] = useState<number>(0);
  const [base, setBase] = useState<PensionBaseType>('apos_inss_irrf');
  const [prioridade, setPrioridade] = useState<'padrao' | 'especifica'>('especifica');
  const [status, setStatus] = useState<'ativa' | 'inativa'>('ativa');
  const [temMinimo, setTemMinimo] = useState(false);
  const [minimoValor, setMinimoValor] = useState(0);
  const [temMaximo, setTemMaximo] = useState(false);
  const [maximoValor, setMaximoValor] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [vinculacaoModulos, setVinculacaoModulos] = useState<CalculationType[]>(['folha_mensal']);

  const handleOpenNewModal = () => {
    setEditingRegra(null);
    setNome('');
    setDescricao('');
    setTipo('percentual');
    setPercentual(20);
    setValorFixo(0);
    setBase('apos_inss_irrf');
    setPrioridade('especifica');
    setStatus('ativa');
    setTemMinimo(false);
    setMinimoValor(0);
    setTemMaximo(false);
    setMaximoValor(0);
    setObservacoes('');
    setVinculacaoModulos(['folha_mensal']);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (r: RegraPensaoCadastrada) => {
    setEditingRegra(r);
    setNome(r.nome);
    setDescricao(r.descricao);
    setTipo(r.tipo);
    setPercentual(r.percentual);
    setValorFixo(r.valorFixo);
    setBase(r.base);
    setPrioridade(r.prioridade);
    setStatus(r.status);
    setTemMinimo(r.temMinimo);
    setMinimoValor(r.minimoValor);
    setTemMaximo(r.temMaximo);
    setMaximoValor(r.maximoValor);
    setObservacoes(r.observacoes || '');
    setVinculacaoModulos(r.vinculacaoModulos);
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    const dataObj: RegraPensaoCadastrada = {
      id: editingRegra ? editingRegra.id : `regra_${Date.now()}`,
      nome: nome.trim(),
      descricao: descricao.trim(),
      tipo,
      percentual: tipo === 'percentual' ? percentual : 0,
      valorFixo: tipo === 'valor_fixo' ? valorFixo : 0,
      base,
      verbasIncluidasIds: [],
      verbasExcluidasIds: [],
      descontosPermitidosIds: [],
      temMinimo,
      minimoValor,
      temMaximo,
      maximoValor,
      arredondamento: 'padrao_2dec',
      observacoes,
      status,
      prioridade,
      vinculacaoModulos,
      dataCadastro: editingRegra ? editingRegra.dataCadastro : new Date().toLocaleDateString('pt-BR'),
      atualizadoEm: new Date().toLocaleDateString('pt-BR'),
    };

    if (editingRegra) {
      onUpdateRegra(dataObj);
    } else {
      onAddRegra(dataObj);
    }
    setIsModalOpen(false);
  };

  const toggleModulo = (mod: CalculationType) => {
    if (vinculacaoModulos.includes(mod)) {
      setVinculacaoModulos(vinculacaoModulos.filter((m) => m !== mod));
    } else {
      setVinculacaoModulos([...vinculacaoModulos, mod]);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 animate-in fade-in duration-150">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Cadastro de Regras de Pensão Alimentícia (Seção 6, 7 e 8)
            </h2>
            <p className="text-xs text-slate-500">
              Gerencie regras gerais e específicas por modalidade com definição de prioridades (Hierarquia: Cálculo &gt; Módulo &gt; Geral)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>+ Nova Regra</span>
        </button>
      </div>

      {/* Tabela de Regras */}
      <div className="overflow-hidden border border-slate-200 rounded-xl">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 font-sans">
            <tr>
              <th scope="col" className="py-2.5 pl-4 pr-3 text-left font-semibold text-slate-900">
                Regra / Título
              </th>
              <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                Alíquota / Valor
              </th>
              <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                Base
              </th>
              <th scope="col" className="py-2.5 px-3 text-left font-semibold text-slate-900">
                Módulos Vinculados
              </th>
              <th scope="col" className="py-2.5 px-3 text-center font-semibold text-slate-900">
                Prioridade
              </th>
              <th scope="col" className="py-2.5 px-3 text-center font-semibold text-slate-900">
                Status
              </th>
              <th scope="col" className="py-2.5 pl-3 pr-4 text-right font-semibold text-slate-900">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {regras.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pl-4 pr-3 font-medium text-slate-900">
                  <div>{r.nome}</div>
                  <div className="text-[10px] text-slate-500 font-normal">{r.descricao}</div>
                </td>
                <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                  {r.tipo === 'percentual' ? `${r.percentual}%` : formatBRL(r.valorFixo)}
                </td>
                <td className="py-3 px-3 text-slate-700">
                  {r.base === 'bruta'
                    ? 'Bruta'
                    : r.base === 'apos_inss'
                    ? 'Após INSS'
                    : r.base === 'apos_inss_irrf'
                    ? 'Após INSS e IRRF'
                    : r.base === 'liquida'
                    ? 'Líquido'
                    : 'Personalizada'}
                </td>
                <td className="py-3 px-3">
                  <div className="flex flex-wrap gap-1">
                    {r.vinculacaoModulos.map((m) => (
                      <span
                        key={m}
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {MODULOS_LABEL[m]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.prioridade === 'especifica'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    {r.prioridade === 'especifica' ? 'Específica' : 'Padrão'}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    r.status === 'ativa'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {r.status === 'ativa' ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="py-3 pl-3 pr-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(r)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                      title="Editar regra"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteRegra(r.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                      title="Excluir regra"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação / Edição de Regra */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in duration-150 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                {editingRegra ? 'Editar Regra de Pensão' : 'Cadastrar Nova Regra de Pensão'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Nome da Regra *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Regra Judicial 20% após INSS e IRRF"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Descrição / Fundamentação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Conforme acordo homologado na 2ª Vara de Família"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Tipo de Pensão
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="percentual">Percentual (%)</option>
                    <option value="valor_fixo">Valor Fixo (R$)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    {tipo === 'percentual' ? 'Percentual (%)' : 'Valor Fixo (R$)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={tipo === 'percentual' ? percentual : valorFixo}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (tipo === 'percentual') setPercentual(v);
                      else setValorFixo(v);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold focus:border-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Modalidade da Base de Cálculo
                </label>
                <select
                  value={base}
                  onChange={(e) => setBase(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                >
                  <option value="apos_inss_irrf">Após INSS e IRRF (Líquido Legal)</option>
                  <option value="apos_inss">Após INSS</option>
                  <option value="bruta">Remuneração Bruta</option>
                  <option value="liquida">Líquido Total da Folha</option>
                  <option value="personalizada">Personalizada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Prioridade da Regra
                  </label>
                  <select
                    value={prioridade}
                    onChange={(e) => setPrioridade(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="especifica">Específica (Prioridade Máxima)</option>
                    <option value="padrao">Padrão Geral</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white focus:border-slate-900 focus:outline-hidden"
                  >
                    <option value="ativa">Ativa</option>
                    <option value="inativa">Inativa</option>
                  </select>
                </div>
              </div>

              {/* Módulos de vinculação */}
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                  Vincular aos Módulos:
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['folha_mensal', 'ferias', 'decimo_terceiro', 'rescisao', 'plr'] as CalculationType[]).map((m) => {
                    const isChecked = vinculacaoModulos.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleModulo(m)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                          isChecked
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {MODULOS_LABEL[m]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Observações adicionais
                </label>
                <textarea
                  rows={2}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Anotações internas do DP..."
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded shadow-xs"
                >
                  Gravar Regra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
