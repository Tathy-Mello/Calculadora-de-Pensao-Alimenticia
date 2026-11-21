/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { CalculationResultData, EarningItem, DeductionItem, IdentificationData } from '../types/pension';
import { exportCalculationToExcel, exportCalculationToPdf } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  FileText,
  Printer,
  ChevronDown,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ExportReportMenuProps {
  result: CalculationResultData | null;
  identification: IdentificationData;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  moduleName: string;
  onPrint?: () => void;
  onCalculateIfNeeded?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const ExportReportMenu: React.FC<ExportReportMenuProps> = ({
  result,
  identification,
  earnings,
  deductions,
  moduleName,
  onPrint,
  onCalculateIfNeeded,
  size = 'md',
}) => {
  const [isPdfDropdownOpen, setIsPdfDropdownOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<{ type: 'success' | 'warn'; message: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsPdfDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showFeedback = (message: string, type: 'success' | 'warn' = 'success') => {
    setExportNotice({ type, message });
    setTimeout(() => setExportNotice(null), 3500);
  };

  const ensureResult = (): boolean => {
    if (!result) {
      if (onCalculateIfNeeded) {
        onCalculateIfNeeded();
        showFeedback('Calculando parâmetros para exportação...', 'warn');
        return false;
      }
      showFeedback('Clique em "CALCULAR" antes de exportar o relatório.', 'warn');
      return false;
    }
    return true;
  };

  const handleExportExcel = () => {
    if (!ensureResult() || !result) return;
    try {
      exportCalculationToExcel({
        result,
        identification,
        earnings,
        deductions,
        moduleName,
      });
      showFeedback('Planilha Excel (.xlsx) baixada com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar planilha Excel.', 'warn');
    }
  };

  const handleExportPdfFull = () => {
    if (!ensureResult() || !result) return;
    try {
      exportCalculationToPdf(
        {
          result,
          identification,
          earnings,
          deductions,
          moduleName,
        },
        'completo'
      );
      setIsPdfDropdownOpen(false);
      showFeedback('Dossiê em PDF (.pdf) gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar relatório PDF.', 'warn');
    }
  };

  const handleExportPdfReceipt = () => {
    if (!ensureResult() || !result) return;
    try {
      exportCalculationToPdf(
        {
          result,
          identification,
          earnings,
          deductions,
          moduleName,
        },
        'resumido'
      );
      setIsPdfDropdownOpen(false);
      showFeedback('Comprovante em PDF (.pdf) gerado com sucesso!');
    } catch (err) {
      console.error(err);
      showFeedback('Erro ao gerar comprovante PDF.', 'warn');
    }
  };

  const handleBrowserPrint = () => {
    if (!ensureResult() || !result) return;
    setIsPdfDropdownOpen(false);
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const buttonPadding =
    size === 'lg'
      ? 'px-4 py-2.5 text-xs'
      : size === 'sm'
      ? 'px-2.5 py-1 text-[11px]'
      : 'px-3.5 py-2 text-xs';

  return (
    <div className="relative inline-flex items-center gap-2 flex-wrap">
      {/* Toast Feedback */}
      {exportNotice && (
        <div
          className={`fixed bottom-5 right-5 z-50 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs flex items-center gap-2 border animate-in fade-in duration-150 ${
            exportNotice.type === 'warn'
              ? 'bg-amber-900 border-amber-700'
              : 'bg-slate-900 border-slate-700'
          }`}
        >
          {exportNotice.type === 'warn' ? (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="font-medium">{exportNotice.message}</span>
        </div>
      )}

      {/* 1. Botão "Exportar em Excel" */}
      <button
        type="button"
        onClick={handleExportExcel}
        className={`inline-flex items-center gap-2 font-bold text-white bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 border border-emerald-800 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer ${buttonPadding}`}
        title="Exportar todos os dados deste cálculo para planilha Excel (.xlsx)"
      >
        <FileSpreadsheet className="w-4 h-4 text-emerald-200 shrink-0" />
        <span>Exportar em Excel</span>
      </button>

      {/* 2. Menu Dropdown "Salvar em PDF" */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            if (!result && onCalculateIfNeeded) {
              onCalculateIfNeeded();
            }
            setIsPdfDropdownOpen(!isPdfDropdownOpen);
          }}
          className={`inline-flex items-center gap-2 font-bold text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-sm hover:shadow transition-all cursor-pointer ${buttonPadding}`}
          title="Opções de emissão do relatório em PDF"
        >
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
          <span>Salvar em PDF</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
              isPdfDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isPdfDropdownOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-50 text-xs animate-in fade-in duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
              Opções do Relatório em PDF
            </div>

            <button
              type="button"
              onClick={handleExportPdfFull}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-start gap-2.5 text-slate-800 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                  <span>Dossiê Completo (.pdf)</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded">Oficial</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  12 etapas, verbas, memória INSS/IRRF e chancelas para auditoria de DP.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleExportPdfReceipt}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-start gap-2.5 text-slate-800 cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                  <span>Comprovante Resumido (.pdf)</span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-50 text-emerald-700 font-bold rounded">Recibo</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  Demonstrativo sintético da pensão alimentícia e saldo líquido.
                </div>
              </div>
            </button>

            <div className="border-t border-slate-100 my-1" />

            <button
              type="button"
              onClick={handleBrowserPrint}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 flex items-center gap-2.5 text-slate-700 cursor-pointer transition-colors font-medium text-xs"
            >
              <Printer className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Imprimir / Salvar pelo Navegador</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
