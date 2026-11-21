/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppNavView } from '../types/phase11';
import {
  Calendar,
  Palmtree,
  Gift,
  FileText,
  TrendingUp,
  History,
  Sliders,
  TableProperties,
  Settings,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Layers,
  HelpCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface HomeScreenProps {
  onNavigate: (view: AppNavView) => void;
  totalCalculos: number;
  totalRegras: number;
  totalVerbas: number;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  totalCalculos,
  totalRegras,
  totalVerbas,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* 1. HERO / TÍTULO DA TELA INICIAL (Seção 2) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Departamento Pessoal · RH e Cálculos Trabalhistas</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Calculadora de Pensão Alimentícia — DP
          </h1>

          <p className="text-sm sm:text-base text-slate-600 font-medium">
            Calcule, confira e visualize a memória de cálculo da pensão alimentícia.
          </p>

          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            Plataforma de alta precisão com motores independentes de INSS e IRRF, regras gerais e específicas,
            tolerância configurável de auditoria, conferência explicável por etapa e memória analítica padronizada em 12 etapas.
          </p>
        </div>

        {/* Resumo Rápido de Contadores no Card */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Cálculos Salvos</span>
            <span className="text-xl font-bold font-mono text-slate-900">{totalCalculos}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Regras Cadastradas</span>
            <span className="text-xl font-bold font-mono text-emerald-700">{totalRegras}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Verbas Catalogadas</span>
            <span className="text-xl font-bold font-mono text-indigo-700">{totalVerbas}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase">Vigência Tributária</span>
            <span className="text-sm font-bold font-mono text-slate-900 mt-1 block">2026 (Oficial RFB)</span>
          </div>
        </div>
      </div>

      {/* Destaque de Exportação em PDF e Excel */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-2">
              <span>Emissão e Exportação de Relatórios (PDF & Excel)</span>
              <span className="text-[10px] px-2 py-0.2 bg-emerald-200 text-emerald-900 font-bold rounded-full">
                Disponível
              </span>
            </h3>
            <p className="text-[11px] text-emerald-800 mt-0.5">
              Todos os módulos contam com botões permanentes para <strong>Exportar em Excel (.xlsx)</strong> e <strong>Salvar em PDF (.pdf)</strong> (Dossiê Completo ou Comprovante Resumido).
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('historico')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer self-start sm:self-auto shrink-0"
        >
          <History className="w-3.5 h-3.5" />
          <span>Ver Histórico e Exportações</span>
        </button>
      </div>

      {/* 2. CINCO MÓDULOS PRINCIPAIS DE CÁLCULO (Seção 2) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
            Módulos Principais de Cálculo
          </h2>
          <span className="text-xs text-slate-500">Selecione para iniciar o preenchimento</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Card: Folha Mensal */}
          <button
            type="button"
            onClick={() => onNavigate('folha')}
            className="flex flex-col justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-700 transition-colors">
                Folha Mensal
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Salário base, horas extras, adicionais legais e resolução de dependência circular simultânea.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-700">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card: Férias */}
          <button
            type="button"
            onClick={() => onNavigate('ferias')}
            className="flex flex-col justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Palmtree className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                Férias
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Remuneração de férias, médias, 1/3 constitucional, abono pecuniário e regras específicas de incidência.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card: 13º Salário */}
          <button
            type="button"
            onClick={() => onNavigate('decimo')}
            className="flex flex-col justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Gift className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-amber-700 transition-colors">
                13º Salário
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Gratificação natalina integral, 1ª e 2ª parcelas, médias anuais, avos proporcionais e tributação exclusiva.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-amber-700">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card: Rescisão */}
          <button
            type="button"
            onClick={() => onNavigate('rescisao')}
            className="flex flex-col justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-rose-700 transition-colors">
                Rescisão
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Saldo de salário, aviso-prévio, férias proporcionais/vencidas, 13º proporcional com incidências autônomas.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-700">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Card: PLR */}
          <button
            type="button"
            onClick={() => onNavigate('plr')}
            className="flex flex-col justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-400 rounded-xl text-left transition-all group shadow-2xs cursor-pointer"
          >
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors">
                PLR
              </h3>
              <p className="text-[11px] text-slate-500 leading-snug">
                Participação nos Lucros (Lei 10.101/00), tributação exclusiva, parcelamento e ponderação por metas.
              </p>
            </div>
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
              <span>Abrir Módulo</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. QUATRO SEÇÕES RÁPIDAS DE GESTÃO E PARÂMETROS (Seção 2) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
          Ferramentas de Gestão, Regras e Auditoria
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Histórico de Cálculos */}
          <div
            onClick={() => onNavigate('historico')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <History className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">{totalCalculos} registros</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900">Histórico de Cálculos</h3>
            <p className="text-[11px] text-slate-500">
              Pesquise cálculos anteriores por matrícula, ano ou status, visualize versões e duplique simulações.
            </p>
          </div>

          {/* 2. Regras de Pensão */}
          <div
            onClick={() => onNavigate('regras')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Sliders className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700">{totalRegras} ativas</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900">Regras de Pensão</h3>
            <p className="text-[11px] text-slate-500">
              Cadastre e vincule regras gerais ou específicas por modalidade com definição de base, percentuais e limites.
            </p>
          </div>

          {/* 3. Tabelas e Parâmetros */}
          <div
            onClick={() => onNavigate('tabelas')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <TableProperties className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Oficial RFB</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900">Tabelas e Parâmetros</h3>
            <p className="text-[11px] text-slate-500">
              Consulte as tabelas progressivas de INSS e IRRF (2026/2025), fontes, faixas e regras de validação.
            </p>
          </div>

          {/* 4. Configurações Gerais */}
          <div
            onClick={() => onNavigate('configuracoes')}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <Settings className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">Ajustes</span>
            </div>
            <h3 className="font-bold text-xs text-slate-900">Configurações Gerais</h3>
            <p className="text-[11px] text-slate-500">
              Defina a tolerância de auditoria em R$, arredondamento monetário, modo de memória e formato de exibição.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
