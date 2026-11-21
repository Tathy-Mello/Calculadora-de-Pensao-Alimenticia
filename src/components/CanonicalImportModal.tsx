/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CanonicalImportField } from '../types/phase11';
import {
  FileCode,
  Download,
  Copy,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
} from 'lucide-react';

export const CANONICAL_FIELDS: CanonicalImportField[] = [
  {
    campo: 'MATRICULA',
    descricao: 'Identificador único do colaborador no sistema de folha (identificador principal - LGPD seguro)',
    tipoDado: 'string',
    exemplo: 'DP-10492',
    obrigatorio: true,
  },
  {
    campo: 'TIPO_CALCULO',
    descricao: 'Modalidade de apuração: folha_mensal, ferias, decimo_terceiro, rescisao ou plr',
    tipoDado: 'string',
    exemplo: 'folha_mensal',
    obrigatorio: true,
  },
  {
    campo: 'ANO',
    descricao: 'Ano de referência para aplicação da tabela de INSS e IRRF correspondente',
    tipoDado: 'number',
    exemplo: '2026',
    obrigatorio: true,
  },
  {
    campo: 'COMPETENCIA',
    descricao: 'Mês ou competência de pagamento (ex: Janeiro, 13_segunda_parcela)',
    tipoDado: 'string',
    exemplo: 'Janeiro',
    obrigatorio: true,
  },
  {
    campo: 'DATA_PAGAMENTO',
    descricao: 'Data de efetivo pagamento (define regime de caixa para IRRF)',
    tipoDado: 'date',
    exemplo: '2026-02-05',
    obrigatorio: true,
  },
  {
    campo: 'COD_VERBA',
    descricao: 'Código numérico ou alfanumérico da rubrica na folha',
    tipoDado: 'string',
    exemplo: '001',
    obrigatorio: true,
  },
  {
    campo: 'DESC_VERBA',
    descricao: 'Descrição formal do evento salarial ou desconto',
    tipoDado: 'string',
    exemplo: 'Salário Base',
    obrigatorio: true,
  },
  {
    campo: 'TIPO_VERBA',
    descricao: 'Natureza da verba: provento (+) ou desconto (-)',
    tipoDado: 'string',
    exemplo: 'provento',
    obrigatorio: true,
  },
  {
    campo: 'VALOR',
    descricao: 'Valor monetário nominal da rubrica',
    tipoDado: 'number',
    exemplo: '6500.00',
    obrigatorio: true,
  },
  {
    campo: 'INCIDE_INSS',
    descricao: 'Indicador se a verba compõe a base do INSS',
    tipoDado: 'boolean',
    exemplo: 'true',
    obrigatorio: true,
  },
  {
    campo: 'INCIDE_IRRF',
    descricao: 'Indicador se a verba compõe a base tributável do IRRF',
    tipoDado: 'boolean',
    exemplo: 'true',
    obrigatorio: true,
  },
  {
    campo: 'INCIDE_PENSAO',
    descricao: 'Indicador se a verba entra na base de cálculo da pensão alimentícia',
    tipoDado: 'boolean',
    exemplo: 'true',
    obrigatorio: true,
  },
];

export interface CanonicalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CanonicalImportModal({ isOpen, onClose }: CanonicalImportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const samplePayload = {
    identificacao: {
      matricula: 'DP-10492',
      tipoCalculo: 'folha_mensal',
      ano: 2026,
      competencia: 'Janeiro',
      dataPagamento: '2026-02-05',
    },
    verbas: [
      {
        codigo: '001',
        descricao: 'Salário Base',
        tipo: 'provento',
        valor: 6500.0,
        incideInss: true,
        incideIrrf: true,
        incidePensao: true,
      },
      {
        codigo: '105',
        descricao: 'Horas Extras 50%',
        tipo: 'provento',
        valor: 850.0,
        incideInss: true,
        incideIrrf: true,
        incidePensao: true,
      },
      {
        codigo: '204',
        descricao: 'Ajuda de Custo Indenizatória',
        tipo: 'provento',
        valor: 1200.0,
        incideInss: false,
        incideIrrf: false,
        incidePensao: false,
      },
    ],
    regraPensao: {
      tipo: 'percentual',
      percentual: 30.0,
      base: 'apos_inss_irrf',
    },
    irrfConfig: {
      deduzirInss: true,
      deduzirDependentes: true,
      quantidadeDependentes: 1,
      deduzirPensao: true,
    },
  };

  const jsonStr = JSON.stringify(samplePayload, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'modelo_importacao_pensao.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Dicionário de Campos Canônicos (Preparação para Importação)
              </h3>
              <p className="text-[11px] text-slate-500">
                Padrão estruturado de interoperabilidade com sistemas de folha (TOTVS, Senior, ADP, Domínio)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Alerta LGPD */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-indigo-950 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Privacidade e Segurança (LGPD):</strong> O padrão canônico utiliza exclusivamente a{' '}
              <strong>MATRÍCULA</strong> como identificador do colaborador. Nunca exige ou armazena CPF, RG, dados bancários ou filiação.
            </span>
          </div>

          {/* Dicionário de Campos */}
          <div>
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-2">
              Campos Canônicos Normatizados
            </span>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2 px-3">Campo</th>
                    <th className="py-2 px-3">Tipo</th>
                    <th className="py-2 px-3">Obrigatório</th>
                    <th className="py-2 px-3">Descrição Funcional</th>
                    <th className="py-2 px-3 font-mono">Exemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {CANONICAL_FIELDS.map((f) => (
                    <tr key={f.campo}>
                      <td className="py-1.5 px-3 font-mono font-bold text-indigo-700">{f.campo}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-500">{f.tipoDado}</td>
                      <td className="py-1.5 px-3">
                        {f.obrigatorio ? (
                          <span className="text-rose-600 font-bold">Sim</span>
                        ) : (
                          <span className="text-slate-400">Não</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3 text-slate-700">{f.descricao}</td>
                      <td className="py-1.5 px-3 font-mono text-slate-600">{f.exemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Exemplo de Payload JSON */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Exemplo de Carga Canônica (JSON)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-2.5 py-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </button>
              </div>
            </div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[11px] overflow-x-auto max-h-56">
              {jsonStr}
            </pre>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
