/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionBaseType,
  PensionRuleConfig,
  PensionRuleType,
  RescisaoAvisoPrevioConfig,
  RescisaoDecimoConfig,
  RescisaoFeriasProporcionaisItem,
  RescisaoFeriasVencidasItem,
  RescisaoMediaItem,
  RescisaoSaldoSalarioConfig,
  RescisaoTipoAviso,
  RescisaoTipoDesligamento,
  RoundingPolicy,
} from '../types/pension';
import { IrrfDeductionsConfig } from '../types/irrf';
import { RESCISAO_DESLIGAMENTO_LABELS } from '../utils/calculator';
import { formatBRL, parseBRLInput } from '../utils/formatters';
import { BeneficiarySplitControl } from './BeneficiarySplitControl';
import {
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Clock,
  Layers,
  Scale,
  Sparkles,
  Percent,
  Sliders,
  Users,
} from 'lucide-react';

interface RescisaoSectionProps {
  identification: IdentificationData;
  onUpdateIdentification: (field: keyof IdentificationData, value: any) => void;
  rule: PensionRuleConfig;
  onUpdateRule: (field: keyof PensionRuleConfig, value: any) => void;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  onToggleEarningInclusion: (id: string) => void;
  onToggleEarningInssIncidence: (id: string) => void;
  onToggleEarningIrrfIncidence: (id: string) => void;
  onUpdateEarningValue: (id: string, value: number) => void;
  onUpdateEarningObservation: (id: string, obs: string) => void;
  onAddEarning: (
    label: string,
    value: number,
    included: boolean,
    incideInss: boolean,
    incideIrrf: boolean,
    observation?: string
  ) => void;
  onRemoveEarning: (id: string) => void;

  onToggleDeductionInclusion: (id: string) => void;
  onToggleDeductionLiquido?: (id: string) => void;
  onToggleDeductionIrrf?: (id: string) => void;
  onUpdateDeductionValue: (id: string, value: number) => void;
  onUpdateDeductionOrder: (id: string, order: number) => void;
  onUpdateDeductionObservation: (id: string, obs: string) => void;
  onAddDeduction: (
    label: string,
    value: number,
    deductsPension: boolean,
    deduzDoLiquido: boolean,
    deduzDoIrrf: boolean,
    order: number,
    observation?: string
  ) => void;
  onRemoveDeduction: (id: string) => void;

  medias: RescisaoMediaItem[];
  onAddMedia: (media: RescisaoMediaItem) => void;
  onRemoveMedia: (id: string) => void;

  irrfConfig: IrrfDeductionsConfig;
  onUpdateIrrfConfig: (field: keyof IrrfDeductionsConfig, value: any) => void;

  hasError?: boolean;
}

const DESLIGAMENTO_OPTIONS: { id: RescisaoTipoDesligamento; label: string; desc: string }[] = [
  {
    id: 'dispensa_sem_justa_causa',
    label: 'Dispensa sem Justa Causa',
    desc: 'Saldo de salário, aviso-prévio, 13º proporcional, férias vencidas e proporcionais + 1/3',
  },
  {
    id: 'pedido_demissao',
    label: 'Pedido de Demissão',
    desc: 'Saldo de salário, 13º proporcional, férias vencidas e proporcionais + 1/3 (sem saque FGTS)',
  },
  {
    id: 'dispensa_com_justa_causa',
    label: 'Dispensa por Justa Causa',
    desc: 'Apenas saldo de salário e férias vencidas com 1/3 (art. 482 CLT)',
  },
  {
    id: 'termino_contrato',
    label: 'Término de Contrato',
    desc: 'Saldo de salário, 13º proporcional, férias proporcionais + 1/3 e vencidas',
  },
  {
    id: 'termino_antecipado',
    label: 'Término Antecipado de Contrato',
    desc: 'Verbas proporcionais e indenização do art. 479 ou 480 da CLT',
  },
  {
    id: 'acordo_art_484a',
    label: 'Acordo (Art. 484-A CLT)',
    desc: 'Aviso prévio pela metade (50%), 13º proporcional, férias + 1/3 e saque de 80% do FGTS',
  },
  {
    id: 'outros',
    label: 'Outros / Personalizado',
    desc: 'Configuração manual irrestrita de todas as rubricas e direitos',
  },
];

const BASE_TYPE_OPTIONS: { id: PensionBaseType; label: string; desc: string }[] = [
  {
    id: 'bruta',
    label: '1. Total Bruto',
    desc: 'Soma das verbas rescisórias participantes sem dedução de INSS, IRRF ou outros descontos',
  },
  {
    id: 'liquida',
    label: '2. Total Líquido',
    desc: 'Verbas participantes deduzidas de todos os descontos rescisórios',
  },
  {
    id: 'apos_inss',
    label: '3. Após INSS',
    desc: 'Verbas participantes deduzido o valor oficial do INSS rescisório apurado pelo motor',
  },
  {
    id: 'apos_inss_irrf',
    label: '4. Após INSS e IRRF',
    desc: 'Base líquida fiscal (verbas participantes deduzidas de INSS e IRRF apurados)',
  },
  {
    id: 'personalizada',
    label: '5. Base Personalizada',
    desc: 'Seleção manual de cada rubrica que entra ou não na pensão conforme mandado judicial',
  },
];

export const RescisaoSection: React.FC<RescisaoSectionProps> = ({
  identification,
  onUpdateIdentification,
  rule,
  onUpdateRule,
  earnings,
  deductions,
  onToggleEarningInclusion,
  onToggleEarningInssIncidence,
  onToggleEarningIrrfIncidence,
  onUpdateEarningValue,
  onUpdateEarningObservation,
  onAddEarning,
  onRemoveEarning,
  onToggleDeductionInclusion,
  onToggleDeductionLiquido,
  onToggleDeductionIrrf,
  onUpdateDeductionValue,
  onUpdateDeductionOrder,
  onUpdateDeductionObservation,
  onAddDeduction,
  onRemoveDeduction,
  medias,
  onAddMedia,
  onRemoveMedia,
  irrfConfig,
  onUpdateIrrfConfig,
  hasError,
}) => {
  // Estado local para Saldo de Salário
  const [salarioBaseMensal, setSalarioBaseMensal] = useState<number>(3000);
  const [diasSaldoSalario, setDiasSaldoSalario] = useState<number>(
    identification.diasTrabalhadosMesRescisao || 15
  );
  const [divisorSaldoSalario, setDivisorSaldoSalario] = useState<number>(30);
  const [outrasParcelasSaldo, setOutrasParcelasSaldo] = useState<number>(0);

  // Estado local para Aviso-Prévio
  const [tipoAviso, setTipoAviso] = useState<RescisaoTipoAviso>(
    identification.tipoAvisoPrevio || 'indenizado'
  );
  const [diasAviso, setDiasAviso] = useState<number>(identification.diasAvisoPrevio || 30);
  const [divisorAviso, setDivisorAviso] = useState<number>(30);

  // Estado local para Férias Rescisórias
  const [possuiFeriasVencidas, setPossuiFeriasVencidas] = useState<boolean>(false);
  const [periodosVencidos, setPeriodosVencidos] = useState<number>(1);
  const [diasVencidos, setDiasVencidos] = useState<number>(30);
  const [possuiFeriasProporcionais, setPossuiFeriasProporcionais] = useState<boolean>(true);
  const [avosFerias, setAvosFerias] = useState<number>(8);

  // Estado local para 13º Proporcional
  const [avosDecimo, setAvosDecimo] = useState<number>(9);

  // Form inline para nova verba
  const [showAddVerba, setShowAddVerba] = useState<boolean>(false);
  const [novaVerbaLabel, setNovaVerbaLabel] = useState<string>('');
  const [novaVerbaValor, setNovaVerbaValor] = useState<string>('');
  const [novaVerbaIncideInss, setNovaVerbaIncideInss] = useState<boolean>(false);
  const [novaVerbaIncideIrrf, setNovaVerbaIncideIrrf] = useState<boolean>(false);
  const [novaVerbaEntraPensao, setNovaVerbaEntraPensao] = useState<boolean>(false);
  const [novaVerbaObs, setNovaVerbaObs] = useState<string>('');

  // Form inline para nova média
  const [showAddMedia, setShowAddMedia] = useState<boolean>(false);
  const [novaMediaDescricao, setNovaMediaDescricao] = useState<string>('');
  const [novaMediaPeriodo, setNovaMediaPeriodo] = useState<string>('Últimos 12 meses');
  const [novaMediaQtd, setNovaMediaQtd] = useState<string>('12');
  const [novaMediaValor, setNovaMediaValor] = useState<string>('');
  const [novaMediaMetodologia, setNovaMediaMetodologia] = useState<string>(
    'Média aritmética simples'
  );
  const [novaMediaVerbaRelacionada, setNovaMediaVerbaRelacionada] = useState<string>('Horas Extras');
  const [novaMediaParticipaFerias, setNovaMediaParticipaFerias] = useState<boolean>(true);
  const [novaMediaParticipaDecimo, setNovaMediaParticipaDecimo] = useState<boolean>(true);
  const [novaMediaParticipaAviso, setNovaMediaParticipaAviso] = useState<boolean>(true);
  const [novaMediaParticipaPensao, setNovaMediaParticipaPensao] = useState<boolean>(true);
  const [novaMediaObs, setNovaMediaObs] = useState<string>('');

  // Form inline para novo desconto
  const [showAddDesconto, setShowAddDesconto] = useState<boolean>(false);
  const [novoDescontoDesc, setNovoDescontoDesc] = useState<string>('');
  const [novoDescontoValor, setNovoDescontoValor] = useState<string>('');
  const [novoDescontoDeduzPensao, setNovoDescontoDeduzPensao] = useState<boolean>(false);
  const [novoDescontoDeduzIrrf, setNovoDescontoDeduzIrrf] = useState<boolean>(false);
  const [novoDescontoDeduzLiquido, setNovoDescontoDeduzLiquido] = useState<boolean>(true);
  const [novoDescontoObs, setNovoDescontoObs] = useState<string>('');

  // Somas de médias que participam de cada base
  const somaMediasAviso = medias
    .filter((m) => m.participaAviso)
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const somaMediasFerias = medias
    .filter((m) => m.participaFerias)
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);
  const somaMediasDecimo = medias
    .filter((m) => m.participaDecimo)
    .reduce((acc, curr) => acc + (curr.valor || 0), 0);

  // Cálculos automáticos dos submódulos
  const valorSaldoSalarioCalculado =
    divisorSaldoSalario > 0
      ? ((salarioBaseMensal + outrasParcelasSaldo) / divisorSaldoSalario) * diasSaldoSalario
      : 0;

  const baseCalculoAviso = salarioBaseMensal + somaMediasAviso;
  const valorAvisoCalculado =
    tipoAviso !== 'nao_aplicavel' && divisorAviso > 0
      ? (baseCalculoAviso / divisorAviso) * diasAviso
      : 0;

  const baseCalculoFerias = salarioBaseMensal + somaMediasFerias;
  const valorFeriasVencidas = possuiFeriasVencidas
    ? (baseCalculoFerias / 30) * diasVencidos * periodosVencidos
    : 0;
  const valorFeriasProporcionais = possuiFeriasProporcionais
    ? (baseCalculoFerias / 12) * avosFerias
    : 0;
  const valorUmTercoCalculado = (valorFeriasVencidas + valorFeriasProporcionais) / 3;

  const baseCalculoDecimo = salarioBaseMensal + somaMediasDecimo;
  const valorDecimoProporcionalCalculado = (baseCalculoDecimo / 12) * avosDecimo;

  // Sincroniza saldo de salário na tabela de verbas
  const handleAplicarSaldoSalario = () => {
    const item = earnings.find(
      (e) => e.id === 'saldo_salario' || /saldo.*sal[aá]rio/i.test(e.label)
    );
    if (item) {
      onUpdateEarningValue(item.id, Math.round(valorSaldoSalarioCalculado * 100) / 100);
      onUpdateEarningObservation(
        item.id,
        `${diasSaldoSalario} dias trabalhados (Base: ${formatBRL(
          salarioBaseMensal + outrasParcelasSaldo
        )} ÷ ${divisorSaldoSalario} × ${diasSaldoSalario})`
      );
    }
  };

  // Sincroniza aviso prévio na tabela de verbas
  const handleAplicarAvisoPrevio = () => {
    const item = earnings.find(
      (e) => e.id === 'aviso_previo' || /aviso.*pr[eé]vio/i.test(e.label)
    );
    if (item) {
      onUpdateEarningValue(item.id, Math.round(valorAvisoCalculado * 100) / 100);
      onUpdateEarningObservation(
        item.id,
        `Aviso ${tipoAviso}: ${diasAviso} dias (Base: ${formatBRL(baseCalculoAviso)} ÷ ${divisorAviso})`
      );
    }
  };

  // Sincroniza férias e 1/3 na tabela de verbas
  const handleAplicarFerias = () => {
    const itemVenc = earnings.find(
      (e) => e.id === 'ferias_vencidas' || /f[eé]rias.*vencidas/i.test(e.label)
    );
    if (itemVenc) {
      onUpdateEarningValue(itemVenc.id, Math.round(valorFeriasVencidas * 100) / 100);
      onUpdateEarningObservation(
        itemVenc.id,
        possuiFeriasVencidas
          ? `${periodosVencidos} período(s) de ${diasVencidos} dias`
          : 'Sem direito a férias vencidas'
      );
    }

    const itemProp = earnings.find(
      (e) => e.id === 'ferias_proporcionais' || /f[eé]rias.*proporcionais/i.test(e.label)
    );
    if (itemProp) {
      onUpdateEarningValue(itemProp.id, Math.round(valorFeriasProporcionais * 100) / 100);
      onUpdateEarningObservation(
        itemProp.id,
        possuiFeriasProporcionais
          ? `${avosFerias}/12 avos proporcionais`
          : 'Sem direito a proporcionais'
      );
    }

    const itemTerco = earnings.find(
      (e) => e.id === 'um_terco_ferias' || /1\/3|ter[cç]o/i.test(e.label)
    );
    if (itemTerco) {
      onUpdateEarningValue(itemTerco.id, Math.round(valorUmTercoCalculado * 100) / 100);
      onUpdateEarningObservation(
        itemTerco.id,
        '1/3 Constitucional sobre vencidas e proporcionais (Art. 7º, XVII, CF/88)'
      );
    }
  };

  // Sincroniza 13º proporcional na tabela de verbas
  const handleAplicarDecimo = () => {
    const itemDec = earnings.find(
      (e) => e.id === 'decimo_proporcional' || /13.*proporcional|d[eé]cimo.*proporcional/i.test(e.label)
    );
    if (itemDec) {
      onUpdateEarningValue(itemDec.id, Math.round(valorDecimoProporcionalCalculado * 100) / 100);
      onUpdateEarningObservation(
        itemDec.id,
        `13º Proporcional: ${avosDecimo}/12 avos (calculado pelo módulo de 13º - Fase 7)`
      );
    }
  };

  // Aplicação de pré-configuração do tipo de desligamento
  const handleSelectTipoDesligamento = (tipo: RescisaoTipoDesligamento) => {
    onUpdateIdentification('tipoDesligamento', tipo);

    if (tipo === 'dispensa_sem_justa_causa') {
      setTipoAviso('indenizado');
      setPossuiFeriasProporcionais(true);
      onUpdateIdentification('tipoAvisoPrevio', 'indenizado');
    } else if (tipo === 'pedido_demissao') {
      setTipoAviso('nao_aplicavel');
      setPossuiFeriasProporcionais(true);
      onUpdateIdentification('tipoAvisoPrevio', 'nao_aplicavel');
    } else if (tipo === 'dispensa_com_justa_causa') {
      setTipoAviso('nao_aplicavel');
      setPossuiFeriasProporcionais(false);
      onUpdateIdentification('tipoAvisoPrevio', 'nao_aplicavel');
    } else if (tipo === 'acordo_art_484a') {
      setTipoAviso('indenizado');
      setPossuiFeriasProporcionais(true);
      onUpdateIdentification('tipoAvisoPrevio', 'indenizado');
    }
  };

  const handleAddVerbaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaVerbaLabel.trim()) return;
    const val = parseBRLInput(novaVerbaValor);
    onAddEarning(
      novaVerbaLabel.trim(),
      val,
      novaVerbaEntraPensao,
      novaVerbaIncideInss,
      novaVerbaIncideIrrf,
      novaVerbaObs.trim()
    );
    setNovaVerbaLabel('');
    setNovaVerbaValor('');
    setNovaVerbaIncideInss(false);
    setNovaVerbaIncideIrrf(false);
    setNovaVerbaEntraPensao(false);
    setNovaVerbaObs('');
    setShowAddVerba(false);
  };

  const handleAddMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMediaDescricao.trim()) return;
    const val = parseBRLInput(novaMediaValor);
    onAddMedia({
      id: `media_${Date.now()}`,
      descricao: novaMediaDescricao.trim(),
      periodo: novaMediaPeriodo.trim(),
      quantidade: parseFloat(novaMediaQtd) || 0,
      valor: val,
      metodologia: novaMediaMetodologia.trim(),
      verbaRelacionada: novaMediaVerbaRelacionada.trim(),
      participaFerias: novaMediaParticipaFerias,
      participaDecimo: novaMediaParticipaDecimo,
      participaAviso: novaMediaParticipaAviso,
      participaPensao: novaMediaParticipaPensao,
      observacao: novaMediaObs.trim(),
    });
    setNovaMediaDescricao('');
    setNovaMediaValor('');
    setNovaMediaObs('');
    setShowAddMedia(false);
  };

  const handleAddDescontoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoDescontoDesc.trim()) return;
    const val = parseBRLInput(novoDescontoValor);
    onAddDeduction(
      novoDescontoDesc.trim(),
      val,
      novoDescontoDeduzPensao,
      novoDescontoDeduzLiquido,
      novoDescontoDeduzIrrf,
      deductions.length + 1,
      novoDescontoObs.trim()
    );
    setNovoDescontoDesc('');
    setNovoDescontoValor('');
    setNovoDescontoDeduzPensao(false);
    setNovoDescontoDeduzIrrf(false);
    setNovoDescontoDeduzLiquido(true);
    setNovoDescontoObs('');
    setShowAddDesconto(false);
  };

  return (
    <div id="secao-rescisao" className="space-y-6">
      {/* 1. PAINEL DE IDENTIFICAÇÃO DO DESLIGAMENTO (Seções 2 e 3) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                R
              </span>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
                Identificação da Rescisão & Tipo de Desligamento
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Identificador do colaborador, datas contratuais e parametrização do desligamento (sem nome ou CPF)
            </p>
          </div>
          <span className="text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-semibold self-start sm:self-auto">
            Fase 8: Módulo de Rescisão Contratual
          </span>
        </div>

        {/* Grid de Identificação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex justify-between">
              <span>Matrícula / ID *</span>
              <span className="text-[10px] text-red-500">Obrigatório</span>
            </label>
            <input
              type="text"
              value={identification.matricula}
              onChange={(e) => onUpdateIdentification('matricula', e.target.value)}
              placeholder="Ex: 04512"
              className={`w-full px-3 py-2 text-xs font-mono rounded-lg border bg-white focus:outline-none ${
                hasError && !identification.matricula.trim()
                  ? 'border-red-400 bg-red-50/20'
                  : 'border-slate-300 focus:border-slate-900'
              }`}
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Identificador principal</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Ano *</label>
            <input
              type="number"
              min={2000}
              max={2050}
              value={identification.ano}
              onChange={(e) =>
                onUpdateIdentification('ano', parseInt(e.target.value) || new Date().getFullYear())
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Exercício fiscal</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Competência *</label>
            <input
              type="text"
              value={identification.competencia}
              onChange={(e) => onUpdateIdentification('competencia', e.target.value)}
              placeholder="Ex: Março"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Mês da rescisão</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Data de Admissão</label>
            <input
              type="date"
              value={identification.dataAdmissao || ''}
              onChange={(e) => onUpdateIdentification('dataAdmissao', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Início do contrato</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex justify-between">
              <span>Data de Desligamento *</span>
              <span className="text-[10px] text-red-500">Obrigatório</span>
            </label>
            <input
              type="date"
              value={identification.dataDesligamento || ''}
              onChange={(e) => onUpdateIdentification('dataDesligamento', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Término contratual</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1 flex justify-between">
              <span>Data de Pagamento *</span>
              <span className="text-[10px] text-slate-500 font-normal">Até 10 dias</span>
            </label>
            <input
              type="date"
              value={identification.dataPagamento || ''}
              onChange={(e) => onUpdateIdentification('dataPagamento', e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Fato gerador tributário</span>
          </div>
        </div>

        {/* Seletor de Tipo de Desligamento */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-800">
            Tipo de Desligamento (Determina as verbas rescisórias aplicáveis) *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {DESLIGAMENTO_OPTIONS.map((opt) => {
              const isSelected =
                (identification.tipoDesligamento || 'dispensa_sem_justa_causa') === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectTipoDesligamento(opt.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs truncate">{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <p
                    className={`text-[10px] line-clamp-2 leading-tight ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Motivo e Observações */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Motivo / Forma de Desligamento
            </label>
            <input
              type="text"
              value={identification.motivoDesligamento || ''}
              onChange={(e) => onUpdateIdentification('motivoDesligamento', e.target.value)}
              placeholder="Ex: Reestruturação do setor / iniciativa do colaborador"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Observações da Rescisão (Opcional)
            </label>
            <input
              type="text"
              value={identification.observacoesRescisao || ''}
              onChange={(e) => onUpdateIdentification('observacoesRescisao', e.target.value)}
              placeholder="Ex: Acordo homologado / desconto de aviso prévio negociado"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            />
          </div>
        </div>
      </div>

      {/* 2. SUBMÓDULOS DE APURAÇÃO: SALDO DE SALÁRIO, AVISO-PRÉVIO, FÉRIAS E 13º */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* SUBMÓDULO: SALDO DE SALÁRIO (Seção 5) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">
              1. Saldo de Salário (Seção 5)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-800">
              {formatBRL(valorSaldoSalarioCalculado)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Fórmula: Salário mensal ÷ divisor configurado × dias considerados = saldo de salário
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Salário Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={salarioBaseMensal || ''}
                onChange={(e) => setSalarioBaseMensal(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Dias Trabalhados</label>
              <input
                type="number"
                min="0"
                max="31"
                value={diasSaldoSalario}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setDiasSaldoSalario(val);
                  onUpdateIdentification('diasTrabalhadosMesRescisao', val);
                }}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Divisor (Configurável)</label>
              <input
                type="number"
                min="1"
                max="31"
                value={divisorSaldoSalario}
                onChange={(e) => setDivisorSaldoSalario(parseInt(e.target.value) || 30)}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Outras Parcelas (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={outrasParcelasSaldo || ''}
                onChange={(e) => setOutrasParcelasSaldo(parseFloat(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">Memória de Saldo de Salário:</span>
              <span className="font-semibold text-slate-800">
                ({formatBRL(salarioBaseMensal + outrasParcelasSaldo)} ÷ {divisorSaldoSalario}) ×{' '}
                {diasSaldoSalario} dias = {formatBRL(valorSaldoSalarioCalculado)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAplicarSaldoSalario}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
              title="Lança o saldo calculado na tabela de verbas rescisórias"
            >
              Aplicar na Tabela
            </button>
          </div>
        </div>

        {/* SUBMÓDULO: AVISO-PRÉVIO (Seção 6) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">
              2. Aviso-Prévio (Seção 6)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-800">
              {formatBRL(valorAvisoCalculado)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Modalidade</label>
              <select
                value={tipoAviso}
                onChange={(e) => {
                  const t = e.target.value as RescisaoTipoAviso;
                  setTipoAviso(t);
                  onUpdateIdentification('tipoAvisoPrevio', t);
                }}
                className="w-full px-2 py-1 text-xs rounded border border-slate-300 bg-white"
              >
                <option value="indenizado">Indenizado</option>
                <option value="trabalhado">Trabalhado</option>
                <option value="nao_aplicavel">Não Aplicável</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Dias de Aviso</label>
              <input
                type="number"
                min="0"
                max="90"
                value={diasAviso}
                onChange={(e) => {
                  const d = parseInt(e.target.value) || 0;
                  setDiasAviso(d);
                  onUpdateIdentification('diasAvisoPrevio', d);
                }}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Divisor</label>
              <input
                type="number"
                min="1"
                max="31"
                value={divisorAviso}
                onChange={(e) => setDivisorAviso(parseInt(e.target.value) || 30)}
                className="w-full px-2 py-1 text-xs font-mono rounded border border-slate-300"
              />
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">Memória de Aviso-Prévio:</span>
              <span className="font-semibold text-slate-800">
                {tipoAviso === 'nao_aplicavel'
                  ? 'Não aplicável (R$ 0,00)'
                  : `${formatBRL(baseCalculoAviso)} ÷ ${divisorAviso} × ${diasAviso} dias = ${formatBRL(
                      valorAvisoCalculado
                    )}`}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAplicarAvisoPrevio}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              Aplicar na Tabela
            </button>
          </div>
        </div>

        {/* SUBMÓDULO: FÉRIAS NA RESCISÃO (Seção 7) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">
              3. Férias Rescisórias & 1/3 (Seção 7)
            </span>
            <span className="text-xs font-mono font-bold text-emerald-800">
              Total Férias: {formatBRL(valorFeriasVencidas + valorFeriasProporcionais + valorUmTercoCalculado)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Vencidas */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Férias Vencidas</span>
                <input
                  type="checkbox"
                  checked={possuiFeriasVencidas}
                  onChange={(e) => setPossuiFeriasVencidas(e.target.checked)}
                  className="rounded text-slate-900 cursor-pointer"
                />
              </div>
              {possuiFeriasVencidas && (
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Períodos:</label>
                    <input
                      type="number"
                      min="1"
                      max="3"
                      value={periodosVencidos}
                      onChange={(e) => setPeriodosVencidos(parseInt(e.target.value) || 1)}
                      className="w-full px-1.5 py-0.5 rounded border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Dias:</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={diasVencidos}
                      onChange={(e) => setDiasVencidos(parseInt(e.target.value) || 30)}
                      className="w-full px-1.5 py-0.5 rounded border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              )}
              <div className="text-[11px] font-mono font-semibold text-slate-800 pt-1">
                Subtotal: {formatBRL(valorFeriasVencidas)}
              </div>
            </div>

            {/* Proporcionais */}
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Férias Proporcionais</span>
                <input
                  type="checkbox"
                  checked={possuiFeriasProporcionais}
                  onChange={(e) => setPossuiFeriasProporcionais(e.target.checked)}
                  className="rounded text-slate-900 cursor-pointer"
                />
              </div>
              {possuiFeriasProporcionais && (
                <div className="pt-1 text-[11px]">
                  <label className="text-[10px] text-slate-500 block">Fração de Avos (1 a 12):</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={avosFerias}
                    onChange={(e) => setAvosFerias(parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-0.5 rounded border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>
              )}
              <div className="text-[11px] font-mono font-semibold text-slate-800 pt-1">
                Subtotal: {formatBRL(valorFeriasProporcionais)}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">1/3 Constitucional:</span>
              <span className="font-semibold text-slate-800">{formatBRL(valorUmTercoCalculado)}</span>
            </div>
            <button
              type="button"
              onClick={handleAplicarFerias}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              Aplicar Férias e 1/3
            </button>
          </div>
        </div>

        {/* SUBMÓDULO: 13º PROPORCIONAL (Seção 8) */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase">
              4. 13º Proporcional (Seção 8)
            </span>
            <span className="text-xs font-mono font-bold text-indigo-800">
              {formatBRL(valorDecimoProporcionalCalculado)}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Apurado pelo motor oficial de 13º salário (Fase 7) com incidência exclusiva na rescisão.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Avos no Exercício (1 a 12)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={avosDecimo}
                onChange={(e) => setAvosDecimo(parseInt(e.target.value) || 0)}
                className="w-full px-2 py-1 text-xs font-mono font-bold rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Base Integral (Salário + Médias)</label>
              <div className="px-2 py-1 text-xs font-mono bg-slate-100 rounded border border-slate-200 text-slate-800">
                {formatBRL(baseCalculoDecimo)}
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 rounded-lg text-xs font-mono flex items-center justify-between border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 block">Fórmula do 13º Proporcional:</span>
              <span className="font-semibold text-slate-800">
                {formatBRL(baseCalculoDecimo)} ÷ 12 × {avosDecimo} avos ={' '}
                {formatBRL(valorDecimoProporcionalCalculado)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleAplicarDecimo}
              className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 cursor-pointer"
            >
              Aplicar 13º Proporcional
            </button>
          </div>
        </div>
      </div>

      {/* 3. MÉDIAS RESCISÓRIAS (Seção 9) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Médias Rescisórias (Seção 9)
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-semibold">
                {medias.length} cadastrada(s)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Horas extras, adicionais e comissões com destinação configurada para Férias, 13º, Aviso e Pensão
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddMedia(!showAddMedia)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADICIONAR MÉDIA</span>
          </button>
        </div>

        {/* Form inline para nova média */}
        {showAddMedia && (
          <form
            onSubmit={handleAddMediaSubmit}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-900">Cadastrar Nova Média Rescisória</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Descrição (ex: Média Horas Extras 50%)"
                value={novaMediaDescricao}
                onChange={(e) => setNovaMediaDescricao(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor (R$)"
                value={novaMediaValor}
                onChange={(e) => setNovaMediaValor(e.target.value)}
                className="px-2.5 py-1.5 font-mono rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="text"
                placeholder="Período (ex: 12 meses)"
                value={novaMediaPeriodo}
                onChange={(e) => setNovaMediaPeriodo(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
              <input
                type="text"
                placeholder="Metodologia (ex: Média simples)"
                value={novaMediaMetodologia}
                onChange={(e) => setNovaMediaMetodologia(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-700">
              <span className="font-semibold text-[11px]">Participa da Base de:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaMediaParticipaFerias}
                  onChange={(e) => setNovaMediaParticipaFerias(e.target.checked)}
                />
                <span>Férias</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaMediaParticipaDecimo}
                  onChange={(e) => setNovaMediaParticipaDecimo(e.target.checked)}
                />
                <span>13º Proporcional</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaMediaParticipaAviso}
                  onChange={(e) => setNovaMediaParticipaAviso(e.target.checked)}
                />
                <span>Aviso-Prévio</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={novaMediaParticipaPensao}
                  onChange={(e) => setNovaMediaParticipaPensao(e.target.checked)}
                />
                <span>Pensão Alimentícia</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddMedia(false)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Salvar Média
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Médias */}
        {medias.length === 0 ? (
          <div className="p-3 bg-slate-50 rounded-lg text-center text-xs text-slate-500">
            Nenhuma média rescisória cadastrada. Clique em "+ ADICIONAR MÉDIA" para incluir horas extras ou adicionais apurados.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="py-2 px-3 text-left font-semibold text-slate-800">Descrição</th>
                  <th className="py-2 px-3 text-right font-semibold text-slate-800">Valor (R$)</th>
                  <th className="py-2 px-3 text-center font-semibold text-slate-800">Férias</th>
                  <th className="py-2 px-3 text-center font-semibold text-slate-800">13º</th>
                  <th className="py-2 px-3 text-center font-semibold text-slate-800">Aviso</th>
                  <th className="py-2 px-3 text-center font-semibold text-slate-800">Pensão</th>
                  <th className="py-2 px-3 text-center font-semibold text-slate-800">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {medias.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 font-medium text-slate-900">{m.descricao}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      {formatBRL(m.valor)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {m.participaFerias ? (
                        <span className="text-emerald-700 font-bold">Sim</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {m.participaDecimo ? (
                        <span className="text-emerald-700 font-bold">Sim</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {m.participaAviso ? (
                        <span className="text-emerald-700 font-bold">Sim</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {m.participaPensao ? (
                        <span className="text-emerald-700 font-bold">Sim</span>
                      ) : (
                        <span className="text-slate-400">Não</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => onRemoveMedia(m.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remover média"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. CONFIGURAÇÃO DAS VERBAS RESCISÓRIAS (Seções 4 e 10) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Tabela de Verbas Rescisórias (Seções 4 e 10)
              </h3>
              <span className="text-xs bg-slate-900 text-white font-mono px-2 py-0.5 rounded font-medium">
                Incidências Independentes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cada verba rescisória possui incidência independente para INSS, IRRF e Pensão Alimentícia
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddVerba(!showAddVerba)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADICIONAR VERBA</span>
          </button>
        </div>

        {/* Form inline para nova verba personalizada */}
        {showAddVerba && (
          <form
            onSubmit={handleAddVerbaSubmit}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-900">Adicionar Nova Verba Rescisória</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Descrição da verba"
                value={novaVerbaLabel}
                onChange={(e) => setNovaVerbaLabel(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor (R$)"
                value={novaVerbaValor}
                onChange={(e) => setNovaVerbaValor(e.target.value)}
                className="px-2.5 py-1.5 font-mono rounded border border-slate-300 bg-white"
                required
              />
              <select
                value={novaVerbaIncideInss ? 'sim' : 'nao'}
                onChange={(e) => setNovaVerbaIncideInss(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Incide INSS? Não</option>
                <option value="sim">Incide INSS? Sim</option>
              </select>
              <select
                value={novaVerbaIncideIrrf ? 'sim' : 'nao'}
                onChange={(e) => setNovaVerbaIncideIrrf(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Incide IRRF? Não</option>
                <option value="sim">Incide IRRF? Sim</option>
              </select>
              <select
                value={novaVerbaEntraPensao ? 'sim' : 'nao'}
                onChange={(e) => setNovaVerbaEntraPensao(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Incide Pensão? Não</option>
                <option value="sim">Incide Pensão? Sim</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddVerba(false)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Adicionar Verba
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Verbas Rescisórias */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-2 px-3 text-left font-semibold text-slate-800">Verba</th>
                <th className="py-2 px-3 text-right font-semibold text-slate-800 w-36">Valor</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">Incide INSS?</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">Incide IRRF?</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">Incide Pensão?</th>
                <th className="py-2 px-3 text-left font-semibold text-slate-800">Observação</th>
                <th className="py-2 px-2 text-center font-semibold text-slate-800 w-12">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {earnings.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-semibold text-slate-900">{item.label}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 font-mono text-[10px]">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.value === 0 ? '' : item.value}
                        onChange={(e) =>
                          onUpdateEarningValue(item.id, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0,00"
                        className="w-full pl-6 pr-2 py-1 text-right font-mono font-bold text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </td>

                  {/* Incide INSS */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningInssIncidence(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        item.incideInss
                          ? 'bg-indigo-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.incideInss ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-indigo-200" />
                          <span>Sim</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Não</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Incide IRRF */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningIrrfIncidence(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        item.incideIrrf
                          ? 'bg-emerald-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.incideIrrf ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                          <span>Sim</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Não</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Incide Pensão */}
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleEarningInclusion(item.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        item.includedInPensionBase
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {item.includedInPensionBase ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Sim</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-slate-400" />
                          <span>Não</span>
                        </>
                      )}
                    </button>
                  </td>

                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Observação da verba"
                      value={item.observation || ''}
                      onChange={(e) => onUpdateEarningObservation(item.id, e.target.value)}
                      className="w-full px-2 py-0.5 text-xs rounded border border-slate-200 hover:border-slate-300 bg-transparent focus:bg-white"
                    />
                  </td>

                  <td className="py-2 px-2 text-center">
                    {item.isCustom ? (
                      <button
                        type="button"
                        onClick={() => onRemoveEarning(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remover verba"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. DESCONTOS DA RESCISÃO (Seção 15) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Descontos da Rescisão (Seção 15)
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-semibold">
                {deductions.length} desconto(s)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Adiantamentos, faltas, empréstimos e outros descontos configurados individualmente
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddDesconto(!showAddDesconto)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ ADICIONAR DESCONTO</span>
          </button>
        </div>

        {/* Form inline para novo desconto */}
        {showAddDesconto && (
          <form
            onSubmit={handleAddDescontoSubmit}
            className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs"
          >
            <div className="font-semibold text-slate-900">Cadastrar Novo Desconto Rescisório</div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <input
                type="text"
                placeholder="Descrição (ex: Adiantamento Salarial)"
                value={novoDescontoDesc}
                onChange={(e) => setNovoDescontoDesc(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor (R$)"
                value={novoDescontoValor}
                onChange={(e) => setNovoDescontoValor(e.target.value)}
                className="px-2.5 py-1.5 font-mono rounded border border-slate-300 bg-white"
                required
              />
              <select
                value={novoDescontoDeduzPensao ? 'sim' : 'nao'}
                onChange={(e) => setNovoDescontoDeduzPensao(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Incide na Pensão? Não</option>
                <option value="sim">Incide na Pensão? Sim</option>
              </select>
              <select
                value={novoDescontoDeduzIrrf ? 'sim' : 'nao'}
                onChange={(e) => setNovoDescontoDeduzIrrf(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="nao">Deduz do IRRF? Não</option>
                <option value="sim">Deduz do IRRF? Sim</option>
              </select>
              <select
                value={novoDescontoDeduzLiquido ? 'sim' : 'nao'}
                onChange={(e) => setNovoDescontoDeduzLiquido(e.target.value === 'sim')}
                className="px-2.5 py-1.5 rounded border border-slate-300 bg-white"
              >
                <option value="sim">Deduz do Líquido? Sim</option>
                <option value="nao">Deduz do Líquido? Não</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddDesconto(false)}
                className="px-3 py-1 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 cursor-pointer"
              >
                Salvar Desconto
              </button>
            </div>
          </form>
        )}

        {/* Tabela de Descontos */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="py-2 px-3 text-left font-semibold text-slate-800">Descrição</th>
                <th className="py-2 px-3 text-right font-semibold text-slate-800 w-36">Valor</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">Na Pensão?</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">No IRRF?</th>
                <th className="py-2 px-3 text-center font-semibold text-slate-800 w-28">No Líquido?</th>
                <th className="py-2 px-3 text-left font-semibold text-slate-800">Observação</th>
                <th className="py-2 px-2 text-center font-semibold text-slate-800 w-12">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {deductions.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="py-2 px-3 font-semibold text-slate-900">{d.label}</td>
                  <td className="py-2 px-3 text-right">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 font-mono text-[10px]">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={d.value === 0 ? '' : d.value}
                        onChange={(e) =>
                          onUpdateDeductionValue(d.id, parseFloat(e.target.value) || 0)
                        }
                        placeholder="0,00"
                        className="w-full pl-6 pr-2 py-1 text-right font-mono font-bold text-xs rounded border border-slate-300 bg-white"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleDeductionInclusion(d.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        d.deductFromPensionBase
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.deductFromPensionBase ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleDeductionIrrf && onToggleDeductionIrrf(d.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        d.deduzDoIrrf
                          ? 'bg-emerald-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.deduzDoIrrf ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleDeductionLiquido && onToggleDeductionLiquido(d.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                        d.deduzDoLiquido !== false
                          ? 'bg-indigo-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d.deduzDoLiquido !== false ? 'Sim' : 'Não'}
                    </button>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Observação"
                      value={d.observation || ''}
                      onChange={(e) => onUpdateDeductionObservation(d.id, e.target.value)}
                      className="w-full px-2 py-0.5 text-xs rounded border border-slate-200 hover:border-slate-300 bg-transparent focus:bg-white"
                    />
                  </td>
                  <td className="py-2 px-2 text-center">
                    {d.isCustom ? (
                      <button
                        type="button"
                        onClick={() => onRemoveDeduction(d.id)}
                        className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                        title="Remover desconto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-slate-300 text-[10px]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. REGRA DA PENSÃO SOBRE RESCISÃO & TRIBUTAÇÃO (Seção 13) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-slate-900" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Regra da Pensão Alimentícia sobre a Rescisão (Seção 13)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Escolha entre aplicar a regra geral cadastrada ou definir parâmetros específicos para a rescisão
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onUpdateRule('origemRegraRescisao', 'geral')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                rule.origemRegraRescisao !== 'especifica'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Usar regra geral
            </button>
            <button
              type="button"
              onClick={() => onUpdateRule('origemRegraRescisao', 'especifica')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                rule.origemRegraRescisao === 'especifica'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Usar regra específica para rescisão
            </button>
          </div>
        </div>

        {/* Tipo da Regra e Valores */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onUpdateRule('ruleType', 'percentual')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              rule.ruleType === 'percentual'
                ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Percentual (%)</span>
              <Percent className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] opacity-80">Incide sobre a base selecionada</p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateRule('ruleType', 'valor_fixo')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              rule.ruleType === 'valor_fixo'
                ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Valor Fixo (R$)</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] opacity-80">Valor determinado em decisão</p>
          </button>

          <button
            type="button"
            onClick={() => onUpdateRule('ruleType', 'percentual_adicional')}
            className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
              rule.ruleType === 'percentual_adicional'
                ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs">Percentual + Adicional</span>
              <Plus className="w-3.5 h-3.5" />
            </div>
            <p className="text-[10px] opacity-80">Percentual + parcela fixa em R$</p>
          </button>
        </div>

        {/* Inputs de Percentual / Valor Fixo */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          {!rule.rateioBeneficiariosAtivo && (rule.ruleType === 'percentual' || rule.ruleType === 'percentual_adicional') ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Percentual da Pensão (%)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={rule.percentage || ''}
                  onChange={(e) => onUpdateRule('percentage', parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-1 font-mono font-bold text-xs rounded border border-slate-300 bg-white"
                />
                <span className="font-mono text-xs font-bold text-slate-600">%</span>
              </div>
            </div>
          ) : null}

          {!rule.rateioBeneficiariosAtivo && rule.ruleType === 'valor_fixo' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Valor Fixo da Pensão (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rule.fixedValue || ''}
                onChange={(e) => onUpdateRule('fixedValue', parseFloat(e.target.value) || 0)}
                className="w-36 px-2 py-1 font-mono font-bold text-xs rounded border border-slate-300 bg-white"
              />
            </div>
          ) : null}

          {!rule.rateioBeneficiariosAtivo && rule.ruleType === 'percentual_adicional' ? (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Valor Adicional Fixo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={rule.additionalValue || ''}
                onChange={(e) => onUpdateRule('additionalValue', parseFloat(e.target.value) || 0)}
                className="w-36 px-2 py-1 font-mono font-bold text-xs rounded border border-slate-300 bg-white"
              />
            </div>
          ) : null}

          {/* Arredondamento */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Arredondamento
            </label>
            <select
              value={rule.roundingPolicy || 'padrao_2dec'}
              onChange={(e) => onUpdateRule('roundingPolicy', e.target.value as RoundingPolicy)}
              className="px-2.5 py-1 text-xs rounded border border-slate-300 bg-white"
            >
              <option value="padrao_2dec">Padrão Fiscal (2 decimais com arredondamento)</option>
              <option value="truncamento_2dec">Truncamento matemático (2 decimais sem arredondar)</option>
            </select>
          </div>
        </div>

        {/* Rateio por Beneficiário (Cálculo Separado + 1 Evento Único na Folha) */}
        <BeneficiarySplitControl rule={rule} onUpdateRule={onUpdateRule} />

        {/* Seleção da Base de Cálculo */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-800">
            Base de Cálculo da Pensão na Rescisão *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {BASE_TYPE_OPTIONS.map((opt) => {
              const isSelected = rule.baseType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onUpdateRule('baseType', opt.id)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-2xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="block font-bold text-xs truncate mb-1">{opt.label}</span>
                  <p
                    className={`text-[10px] leading-tight ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tributação IRRF na Rescisão */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">Dependentes no IRRF</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                value={irrfConfig.quantidadeDependentes || 0}
                onChange={(e) =>
                  onUpdateIrrfConfig('quantidadeDependentes', parseInt(e.target.value) || 0)
                }
                className="w-20 px-2 py-1 font-mono rounded border border-slate-300 bg-white"
              />
              <span className="text-[11px] text-slate-500">R$ 189,59 cada</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Deduzir INSS do IRRF?</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirInss', !irrfConfig.deduzirInss)}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  irrfConfig.deduzirInss ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirInss ? 'Sim' : 'Não'}
              </button>
              <span className="text-[11px] text-slate-500">Deduz INSS_RESCISAO_CALCULADO</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">Deduzir Pensão no IRRF?</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onUpdateIrrfConfig('deduzirPensao', !irrfConfig.deduzirPensao)}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer ${
                  irrfConfig.deduzirPensao ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {irrfConfig.deduzirPensao ? 'Sim' : 'Não'}
              </button>
              <span className="text-[11px] text-slate-500">Resolução simultânea oficial</span>
            </div>
          </div>
        </div>

        {/* 7. COMPARAÇÃO COM VALOR INFORMADO (Seção 19) */}
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-950 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Comparação com Pensão Esperada / Informada (Seção 19)</span>
            </span>
            <span className="text-[10px] text-amber-800 font-medium">Opcional para auditoria</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-tight">
            Informe opcionalmente o valor de pensão esperado (conforme recibo de rescisão da folha ou determinação) para confrontar com o valor apurado pelo motor.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <span className="font-semibold text-slate-800">Pensão informada pelo usuário:</span>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-mono text-[11px]">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                value={identification.valorPensaoEsperada === 0 ? '' : identification.valorPensaoEsperada || ''}
                onChange={(e) =>
                  onUpdateIdentification('valorPensaoEsperada', parseFloat(e.target.value) || 0)
                }
                className="pl-8 pr-3 py-1.5 font-mono font-bold text-xs rounded border border-amber-300 bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
