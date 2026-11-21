/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppNavView } from '../types/phase11';
import {
  Home,
  Calendar,
  Palmtree,
  Gift,
  FileText,
  TrendingUp,
  History,
  Sliders,
  TableProperties,
  Settings,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';

interface NavigationProps {
  activeView: AppNavView;
  onNavigate: (view: AppNavView) => void;
  isSimulationMode: boolean;
  onToggleSimulationMode: () => void;
  historyCount: number;
}

const NAV_ITEMS: {
  id: AppNavView;
  label: string;
  icon: React.FC<{ className?: string }>;
  group: 'main' | 'modules' | 'system';
  badge?: string;
}[] = [
  { id: 'inicio', label: 'Início', icon: Home, group: 'main' },
  { id: 'folha', label: 'Folha', icon: Calendar, group: 'modules' },
  { id: 'ferias', label: 'Férias', icon: Palmtree, group: 'modules' },
  { id: 'decimo', label: '13º', icon: Gift, group: 'modules' },
  { id: 'rescisao', label: 'Rescisão', icon: FileText, group: 'modules' },
  { id: 'plr', label: 'PLR', icon: TrendingUp, group: 'modules' },
  { id: 'historico', label: 'Histórico', icon: History, group: 'system' },
  { id: 'regras', label: 'Regras', icon: Sliders, group: 'system' },
  { id: 'tabelas', label: 'Tabelas', icon: TableProperties, group: 'system' },
  { id: 'verbas', label: 'Verbas', icon: Layers, group: 'system' },
  { id: 'configuracoes', label: 'Configurações', icon: Settings, group: 'system' },
];

export const Navigation: React.FC<NavigationProps> = ({
  activeView,
  onNavigate,
  isSimulationMode,
  onToggleSimulationMode,
  historyCount,
}) => {
  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('inicio')}
              className="flex items-center gap-2 text-left cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shadow-xs">
                DP
              </div>
              <div>
                <span className="font-bold text-xs sm:text-sm tracking-tight text-white block">
                  Calculadora Pensão
                </span>
                <span className="text-[10px] text-emerald-400 block -mt-0.5 font-medium">
                  Departamento Pessoal
                </span>
              </div>
            </button>
          </div>

          {/* Links de Navegação Desktop */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.id === 'historico' && historyCount > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-slate-800 text-emerald-300 border border-slate-700">
                      {historyCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Ações Rápidas: Modo Simulação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleSimulationMode}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-tight transition-all cursor-pointer border ${
                isSimulationMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
              }`}
              title="Ativa o modo de simulação livre sem gravar ou sobrescrever cálculos oficiais"
            >
              <Sparkles className="w-3 h-3 text-current" />
              <span>{isSimulationMode ? 'SIMULAÇÃO ATIVA' : 'Modo Simulação'}</span>
            </button>
          </div>
        </div>

        {/* Barra de Navegação Mobile */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/60 no-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Banner de Aviso de Modo Simulação (Seção 29) */}
      {isSimulationMode && (
        <div className="bg-amber-500 text-slate-950 px-4 py-1 text-center text-xs font-bold tracking-wider uppercase border-t border-amber-400 shadow-2xs">
          ⚠️ SIMULAÇÃO — NÃO ALTERA CÁLCULOS SALVOS NO HISTÓRICO OFICIAL
        </div>
      )}
    </nav>
  );
};
