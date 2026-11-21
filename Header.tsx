/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RotateCcw, FileSpreadsheet, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  onLoadSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onLoadSample }) => {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Brand & Titles */}
          <div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white font-mono font-bold text-sm">
                DP
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 uppercase">
                CALCULADORA DE PENSÃO ALIMENTÍCIA
              </h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Cálculo e memória de cálculo para Folha, Férias, 13º, Rescisão e PLR
            </p>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="hidden sm:inline-flex items-center text-xs font-medium text-slate-500 mr-2">
              Fase 1 · Estrutura & Conferência
            </span>
            <button
              type="button"
              onClick={onLoadSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Preenche dados de um caso real para conferência imediata"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Carregar Exemplo</span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-md transition-colors"
              title="Limpar todos os campos e reiniciar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
