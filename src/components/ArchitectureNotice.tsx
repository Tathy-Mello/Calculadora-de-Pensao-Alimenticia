/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layers, ChevronDown, ChevronUp, CheckCircle2, CircleDashed } from 'lucide-react';

export const ArchitectureNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-slate-100/80 border border-slate-200/90 rounded-xl p-4 text-xs text-slate-600">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          <span className="font-semibold text-slate-800">
            Arquitetura & Mapeamento de Fases do Departamento Pessoal
          </span>
          <span className="text-[11px] bg-emerald-900 text-white px-2 py-0.5 rounded font-mono font-medium">
            Fase 10: Concluída
          </span>
        </div>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-800 p-1 cursor-pointer"
          aria-label={isOpen ? 'Recolher detalhes da arquitetura' : 'Expandir detalhes da arquitetura'}
        >
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-200 space-y-3">
          <p className="text-[11px] text-slate-600">
            A estrutura do sistema foi projetada de forma modular e tipada em TypeScript para suportar a injeção progressiva das regras especializadas de Departamento Pessoal:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fases 1 a 10: Concluídas</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                <li>Motor do INSS independente com tabelas oficiais progressivas (Fase 3)</li>
                <li>Motor do IRRF independente com tabelas oficiais RFB (Fase 4)</li>
                <li>Módulos de Folha Mensal, Férias, 13º, Rescisão e PLR (Fases 5 a 9)</li>
                <li>Memória de cálculo padronizada oficial em 12 etapas (Fase 10)</li>
                <li>Conferência explicável com tolerância configurável (Fase 10)</li>
                <li>Diagnóstico causal isolando a 1ª divergência encontrada (Fase 10)</li>
                <li>Comparação detalhada de bases e comparação lado a lado de regras (Fase 10)</li>
                <li>Conferência inversa e cenários de simulação sem alterar cálculo (Fase 10)</li>
                <li>Versionamento do cálculo e log de alterações da sessão (Fase 10)</li>
              </ul>
            </div>

            <div className="p-2.5 bg-white rounded border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Emissão e Exportação de Relatórios (PDF & Excel)</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                <li>Geração de Dossiê Executivo e Comprovante em PDF (.pdf)</li>
                <li>Exportação de cálculos e histórico em planilhas Excel (.xlsx)</li>
                <li>Estrutura de interoperabilidade com sistemas de folha</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
