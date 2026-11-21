/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GeneralSettings } from '../types/phase11';
import { Settings, Save, RotateCcw, CheckCircle2, Sliders, Scale, FileText } from 'lucide-react';

interface SettingsSectionProps {
  settings: GeneralSettings;
  onUpdateSetting: <K extends keyof GeneralSettings>(field: K, value: GeneralSettings[K]) => void;
  onResetSettings: () => void;
  onSaveNotification?: string | null;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  settings,
  onUpdateSetting,
  onResetSettings,
  onSaveNotification,
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-6 animate-in fade-in duration-150">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-900">
              Configurações Gerais do Sistema
            </h2>
            <p className="text-xs text-slate-500">
              Parâmetros de cálculo, critérios de conferência e preferências de exibição da memória
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões</span>
          </button>
        </div>
      </div>

      {onSaveNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{onSaveNotification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. CONFIGURAÇÕES DE CÁLCULO (Seção 5) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Configurações de Cálculo
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Casas Decimais Monetárias
              </label>
              <select
                value={settings.casasDecimais}
                onChange={(e) => onUpdateSetting('casasDecimais', parseInt(e.target.value) || 2)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value={2}>2 Casas Decimais (Padrão Monetário BRL)</option>
                <option value={3}>3 Casas Decimais (Intermediário)</option>
                <option value={4}>4 Casas Decimais (Precisão Elevada)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Política de Arredondamento
              </label>
              <select
                value={settings.arredondamento}
                onChange={(e) => onUpdateSetting('arredondamento', e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value="padrao_2dec">Padrão ABNT / Bancário (Half-Up)</option>
                <option value="truncar">Truncamento Rígido (Sem arredondamento)</option>
                <option value="arredondar_cima">Sempre para cima (Ceil)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Formato Monetário
              </label>
              <select
                value={settings.formatoMonetario}
                onChange={(e) => onUpdateSetting('formatoMonetario', e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value="BRL">Real Brasileiro (R$ 1.234,56)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Exibição de Percentuais
              </label>
              <select
                value={settings.exibicaoPercentuais}
                onChange={(e) => onUpdateSetting('exibicaoPercentuais', e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value="duas_casas">2 Casas Decimais (Ex: 20,00%)</option>
                <option value="quatro_casas">4 Casas Decimais (Ex: 20,0000%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. CONFIGURAÇÕES DE CONFERÊNCIA (Seção 5) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900">
            <Scale className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Configurações de Conferência
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tolerância Aceitável em R$ (Padrão)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs text-slate-400">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settings.toleranciaReais}
                  onChange={(e) => onUpdateSetting('toleranciaReais', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:border-slate-900 focus:outline-hidden"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Diferenças menores ou iguais a este valor serão classificadas como "Dentro da Tolerância".
              </p>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Tolerância Percentual (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  value={settings.toleranciaPercentual}
                  onChange={(e) => onUpdateSetting('toleranciaPercentual', parseFloat(e.target.value) || 0)}
                  className="w-full pr-8 pl-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:border-slate-900 focus:outline-hidden"
                />
                <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400">%</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Casas Decimais para Comparação
              </label>
              <select
                value={settings.casasComparacao}
                onChange={(e) => onUpdateSetting('casasComparacao', parseInt(e.target.value) || 2)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value={2}>2 Casas (Centavos)</option>
                <option value={4}>4 Casas (Cálculo Fino)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. CONFIGURAÇÕES DE MEMÓRIA (Seção 5) */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900">
            <FileText className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider">
              Configurações de Memória
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Modo Padrão da Memória
              </label>
              <select
                value={settings.modoPadraoMemoria}
                onChange={(e) => onUpdateSetting('modoPadraoMemoria', e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs focus:border-slate-900 focus:outline-hidden"
              >
                <option value="detalhado">Modo Detalhado (Todas as 12 etapas)</option>
                <option value="resumido">Modo Resumido (Bases e fechamentos)</option>
              </select>
            </div>

            <div className="pt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.exibirFormulas}
                  onChange={(e) => onUpdateSetting('exibirFormulas', e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-700">Exibir fórmulas operacionais detalhadas</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.exibirFontes}
                  onChange={(e) => onUpdateSetting('exibirFontes', e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                />
                <span className="text-[11px] text-slate-700">Exibir fontes e atos legais em cada tabela</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
