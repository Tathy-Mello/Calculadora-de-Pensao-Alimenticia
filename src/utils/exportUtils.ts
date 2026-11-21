/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationResultData, CalculationType, EarningItem, DeductionItem, IdentificationData } from '../types/pension';
import { CalculoHistoricoCompleto } from '../types/phase11';
import { formatBRL, formatPercentage } from './formatters';

export interface ExportCalculationParams {
  result: CalculationResultData;
  identification: IdentificationData;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  moduleName: string;
}

/**
 * Exporta o cálculo atual em formato Excel (.xlsx) com múltiplas abas estruturadas
 */
export function exportCalculationToExcel(params: ExportCalculationParams) {
  const { result, identification, earnings, deductions, moduleName } = params;

  const wb = XLSX.utils.book_new();

  // 1. ABA RESUMO EXECUTIVO
  const resumoData = [
    ['CALCULADORA DE PENSÃO ALIMENTÍCIA — DEPARTAMENTO PESSOAL'],
    ['RELATÓRIO AUDITÁVEL DE APURAÇÃO E ENCARGOS'],
    [''],
    ['IDENTIFICAÇÃO DO CÁLCULO'],
    ['Matrícula do Colaborador:', identification.matricula || 'Sem matrícula'],
    ['Módulo de Apuração:', moduleName],
    ['Ano de Competência:', identification.ano],
    ['Competência:', identification.competencia],
    ['Data de Pagamento:', identification.dataPagamento || '—'],
    ['Data/Hora do Cálculo:', result.calculatedAt],
    [''],
    ['CONSOLIDAÇÃO FINANCEIRA (FOLHA & PENSÃO)', 'BASE DE CÁLCULO (R$)', 'VALOR APURADO (R$)', 'IMPACTO'],
    ['Total de Proventos Brutos', formatBRL(result.totalProventos), formatBRL(result.totalProventos), '(+) Crédito'],
    ['Contribuição Previdenciária (INSS)', formatBRL(result.baseInss), formatBRL(result.valorInss), '(-) Desconto Oficial'],
    ['Imposto de Renda Retido (IRRF)', formatBRL(result.baseIrrf), formatBRL(result.valorIrrf), '(-) Desconto Oficial'],
    [
      result.rateioBeneficiarios?.ativo && result.rateioBeneficiarios.somaPercentuais !== undefined
        ? `Pensão Alimentícia — Evento Único (Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)})`
        : 'Pensão Alimentícia Apurada',
      formatBRL(result.basePensao),
      formatBRL(result.valorPensao),
      '(-) Desconto Judicial',
    ],
    ['Outros Descontos da Folha', '—', formatBRL(result.outrosDescontos), '(-) Desconto'],
    ['VALOR LÍQUIDO FINAL A PAGAR', '—', formatBRL(result.liquidoAposPensao), '(=) Saldo Líquido'],
    [''],
    ['REGRA DA PENSÃO ALIMENTÍCIA'],
    ['Enquadramento Legal:', result.regraTexto],
    ['Base da Pensão:', formatBRL(result.basePensao)],
    ['Valor Apurado:', formatBRL(result.valorPensao)],
    ['Dedução Mútua IRRF / Pensão:', result.irrfResult?.deducoes.pensaoAlimenticia ? 'Sim (Resolução Algébrica Simultânea)' : 'Não'],
    ...(result.rateioBeneficiarios?.ativo
      ? [
          [''],
          ['CÁLCULO SEPARADO POR FILHO (CONSOLIDADO EM 1 EVENTO NA FOLHA)'],
          ...result.rateioBeneficiarios.beneficiarios.map((b) => [
            `${b.label} = ${b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)}`,
            b.percentual !== undefined
              ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
              : `Base: ${formatBRL(b.baseAplicada)}`,
            formatBRL(b.valorCalculado),
            `Pré-arredondamento: R$ ${b.valorAntesArredondamento.toFixed(4)}`,
          ]),
          [
            `TOTAL EVENTO ÚNICO NA FOLHA (${
              result.rateioBeneficiarios.somaPercentuais !== undefined
                ? `Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}`
                : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`
            })`,
            `${result.rateioBeneficiarios.quantidadeBeneficiarios} filhos somados`,
            formatBRL(result.rateioBeneficiarios.totalConsolidadoFolha),
            'Soma dos valores individuais por filho',
          ],
        ]
      : []),
    ...(result.feriasRateioInss?.ativo
      ? [
          [''],
          ['RATEIO DE INSS — FÉRIAS PARTIDAS ENTRE COMPETÊNCIAS'],
          ['Período de Gozo:', `${result.feriasRateioInss.dataInicio} a ${result.feriasRateioInss.dataFim} (${result.feriasRateioInss.totalDiasFerias} dias)`],
          [`Competência 1 (Recibo ${result.feriasRateioInss.competencia1Rotulo}):`, `${result.feriasRateioInss.diasMes1} dias · Base ${formatBRL(result.feriasRateioInss.baseTotalInssMes1)} · INSS no Recibo ${formatBRL(result.feriasRateioInss.inssNoReciboMes1)}`],
          [`Competência 2 (Recálculo ${result.feriasRateioInss.competencia2Rotulo}):`, `${result.feriasRateioInss.diasMes2} dias · Base Férias ${formatBRL(result.feriasRateioInss.baseInssFeriasMes2)} + Trabalhado ${formatBRL(result.feriasRateioInss.remuneracaoTrabalhadaMes2)} = Base ${formatBRL(result.feriasRateioInss.baseTotalInssMes2)} · INSS Recalculado ${formatBRL(result.feriasRateioInss.inssRecalculadoMes2)}`],
          ['Observação da Tabela Seguinte:', result.feriasRateioInss.tabelaMes2Observacao],
        ]
      : []),
  ];

  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
  wsResumo['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 25 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Executivo');

  // 2. ABA VERBAS E RUBRICAS
  const verbasHeaders = [
    'Código',
    'Descrição da Rubrica',
    'Tipo',
    'Incide INSS?',
    'Incide IRRF?',
    'Incide Pensão?',
    'Valor Nominal (R$)',
    'Observações',
  ];

  const verbasRows = earnings.map((v, idx) => [
    v.id.startsWith('custom') ? `V-${idx + 1}` : v.id,
    v.label,
    'Provento (+)',
    v.incideInss ? 'SIM' : 'NÃO',
    v.incideIrrf ? 'SIM' : 'NÃO',
    v.includedInPensionBase ? 'SIM' : 'NÃO',
    v.value,
    v.observation || '',
  ]);

  const wsVerbas = XLSX.utils.aoa_to_sheet([verbasHeaders, ...verbasRows]);
  wsVerbas['!cols'] = [
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsVerbas, 'Verbas e Rubricas');

  // 3. ABA DEDUÇÕES DA FOLHA
  const deducoesHeaders = [
    'Item de Desconto',
    'Ordem',
    'Deduz da Base da Pensão?',
    'Deduz do Líquido?',
    'Deduz da Base do IRRF?',
    'Valor (R$)',
    'Observação / Fonte',
  ];

  const deducoesRows = deductions.map((d) => [
    d.label,
    d.order,
    d.deductFromPensionBase ? 'SIM' : 'NÃO',
    d.deduzDoLiquido ? 'SIM' : 'NÃO',
    d.deduzDoIrrf ? 'SIM' : 'NÃO',
    d.id.includes('inss') ? result.valorInss : d.id.includes('irrf') ? result.valorIrrf : d.value,
    d.observation || '',
  ]);

  const wsDeducoes = XLSX.utils.aoa_to_sheet([deducoesHeaders, ...deducoesRows]);
  wsDeducoes['!cols'] = [
    { wch: 35 },
    { wch: 10 },
    { wch: 25 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 35 },
  ];
  XLSX.utils.book_append_sheet(wb, wsDeducoes, 'Deduções da Folha');

  // 4. ABA MEMÓRIA INSS (FAIXAS PROGRESSIVAS)
  if (result.inssResult) {
    const inssHeaders = [
      'Faixa',
      'Salário Inicial (R$)',
      'Salário Final (R$)',
      'Alíquota (%)',
      'Parcela a Deduzir (R$)',
      'Base Considerada na Faixa (R$)',
      'Contribuição da Faixa (R$)',
    ];

    const inssRows = result.inssResult.faixasCalculadas.map((fx) => {
      const tabelaFaixa = result.inssResult?.tabelaUtilizada.faixas.find((f) => f.faixaNumero === fx.faixaNumero);
      return [
        `Faixa ${fx.faixaNumero}`,
        fx.faixaInicial,
        fx.faixaFinal,
        `${fx.aliquota}%`,
        tabelaFaixa?.parcelaADeduzir || 0,
        fx.baseConsideradaNaFaixa,
        fx.contribuicaoDaFaixa,
      ];
    });

    inssRows.push([
      'TOTAL PREVIDENCIÁRIO EFETIVO',
      0,
      result.inssResult.tabelaUtilizada.tetoPrevidenciario,
      '—',
      0,
      result.inssResult.baseInssEfetiva,
      result.inssResult.valorInssFinal,
    ]);

    const wsInss = XLSX.utils.aoa_to_sheet([
      [`Tabela de INSS Oficial — Exercício ${result.inssResult.ano}`],
      [`Fonte: ${result.inssResult.tabelaUtilizada.fonte}`],
      [''],
      inssHeaders,
      ...inssRows,
    ]);
    wsInss['!cols'] = [
      { wch: 15 },
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 30 },
      { wch: 25 },
    ];
    XLSX.utils.book_append_sheet(wb, wsInss, 'Memória INSS');
  }

  // 5. ABA MEMÓRIA IRRF (TRIBUTAÇÃO RFB)
  if (result.irrfResult) {
    const irrfInfo = [
      ['MEMÓRIA DO IMPOSTO DE RENDA RETIDO NA FONTE (IRRF)'],
      ['Vigência / Ano:', result.irrfResult.ano],
      ['Fonte Legal:', result.irrfResult.tabelaUtilizada.fonte],
      [''],
      ['Item Tributário', 'Valor (R$)'],
      ['Rendimentos Tributáveis Brutos', result.irrfResult.rendimentosTributaveis],
      ['(-) Dedução de INSS Oficial', result.irrfResult.deducoes.inss],
      ['(-) Dedução de Dependentes', result.irrfResult.deducoes.dependentes.total],
      ['(-) Dedução de Pensão Alimentícia', result.irrfResult.deducoes.pensaoAlimenticia],
      ['(-) Outras Deduções Legais', result.irrfResult.deducoes.outrasDeducoes],
      ['(=) Base de Cálculo do IRRF', result.irrfResult.baseIrrf],
      ['Alíquota Efetiva da Faixa', `${result.irrfResult.aliquotaAplicada}%`],
      ['Parcela a Deduzir da Tabela', result.irrfResult.parcelaDeduzirAplicada],
      ['Imposto Bruto Apurado', result.irrfResult.valorImpostoAntesRedutor || result.irrfResult.valorIrrfFinal],
      [
        'Redutor Adicional 2026',
        result.irrfResult.valorRedutorAplicado || 0,
      ],
      ['TOTAL IRRF RETIDO FINAL', result.irrfResult.valorIrrfFinal],
    ];

    const wsIrrf = XLSX.utils.aoa_to_sheet(irrfInfo);
    wsIrrf['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsIrrf, 'Memória IRRF');
  }

  // Grava o arquivo XLSX
  const filename = `Pensao_${(identification.matricula || 'DP').replace(/\s+/g, '_')}_${identification.competencia}_${identification.ano}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Exporta o histórico completo de cálculos para Excel (.xlsx)
 */
export function exportHistoryToExcel(history: CalculoHistoricoCompleto[]) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'ID do Registro',
    'Versão',
    'Data/Hora',
    'Módulo',
    'Matrícula',
    'Ano',
    'Competência',
    'Data Pagamento',
    'Status',
    'Simulação?',
    'Total Proventos (R$)',
    'INSS Oficial (R$)',
    'IRRF Oficial (R$)',
    'Base Pensão (R$)',
    'Pensão Apurada (R$)',
    'Outros Descontos (R$)',
    'Líquido Final (R$)',
    'Regra Aplicada',
  ];

  const rows = history.map((item) => [
    item.id,
    `v${item.versaoNumero}`,
    item.dataHora,
    item.moduloRotulo,
    item.matricula,
    item.ano,
    item.competencia,
    item.dataPagamento || '—',
    item.statusCalculo.toUpperCase(),
    item.isSimulacao ? 'SIM' : 'NÃO',
    item.totalProventos,
    item.valorInss,
    item.valorIrrf,
    item.basePensao,
    item.valorPensao,
    item.outrosDescontos,
    item.liquidoAposPensao,
    item.regraNome,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([
    ['HISTÓRICO AUDITÁVEL DE CÁLCULOS — PENSÃO ALIMENTÍCIA DP'],
    [`Emitido em: ${new Date().toLocaleString('pt-BR')}`],
    [''],
    headers,
    ...rows,
  ]);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 10 },
    { wch: 20 },
    { wch: 15 },
    { wch: 18 },
    { wch: 8 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Cálculos');
  const filename = `Historico_Pensao_Alimenticia_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Gera e baixa diretamente o Dossiê/Relatório em PDF profissional
 */
export function exportCalculationToPdf(params: ExportCalculationParams, mode: 'completo' | 'resumido' = 'completo') {
  const { result, identification, earnings, deductions, moduleName } = params;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const emeraldColor: [number, number, number] = [5, 150, 105]; // Emerald 600
  const accentGray: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Cabeçalho Institucional
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CALCULADORA DE PENSÃO ALIMENTÍCIA — DP', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    mode === 'completo'
      ? 'DOSSIÊ EXECUTIVO DE APURAÇÃO, ENCARGOS E MEMÓRIA AUDITÁVEL'
      : 'DEMONSTRATIVO DE PAGAMENTO E RETENÇÃO DE PENSÃO ALIMENTÍCIA',
    14,
    18
  );

  doc.setFontSize(8);
  doc.text(`Data: ${result.calculatedAt}`, 196, 18, { align: 'right' });

  // 2. Cartão de Identificação
  let currentY = 30;

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS DE IDENTIFICAÇÃO E ENQUADRAMENTO', 14, currentY);

  currentY += 4;
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    head: [['Matrícula', 'Módulo', 'Competência', 'Ano de Referência', 'Data de Pagamento']],
    body: [
      [
        identification.matricula || 'Sem matrícula',
        moduleName,
        identification.competencia,
        String(identification.ano),
        identification.dataPagamento || '—',
      ],
    ],
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  // 3. Demonstrativo Financeiro Sintético
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DEMONSTRATIVO FINANCEIRO CONSOLIDADO', 14, currentY);

  currentY += 4;
  const pensaoRowLabel = result.rateioBeneficiarios?.ativo
    ? result.rateioBeneficiarios.somaPercentuais !== undefined
      ? `(-) Pensão Alimentícia — Evento Único (Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)})`
      : '(-) Pensão Alimentícia — Evento Único'
    : '(-) Pensão Alimentícia Apurada';

  const financeBody = [
    ['Total de Proventos Brutos', formatBRL(result.totalProventos), '(+) Vencimentos Salariais'],
    ['(-) Contribuição Previdenciária (INSS)', formatBRL(result.valorInss), 'Previdência Oficial RGPS'],
    ['(-) Imposto de Renda Retido (IRRF)', formatBRL(result.valorIrrf), 'Tributação RFB c/ Redutor 2026'],
    [pensaoRowLabel, formatBRL(result.valorPensao), result.regraTexto],
    ['(-) Outros Descontos da Folha', formatBRL(result.outrosDescontos), 'Benefícios / Adiantamentos'],
    ['(=) VALOR LÍQUIDO A PAGAR', formatBRL(result.liquidoAposPensao), 'Saldo Líquido após Pensão'],
  ];

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 2.2 },
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
    head: [['Item da Folha de Pagamento', 'Valor (R$)', 'Observações / Fundamentação']],
    body: financeBody,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 40 },
      2: { cellWidth: 72 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  if (result.feriasRateioInss?.ativo) {
    const r = result.feriasRateioInss;
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('2.1 RATEIO DE INSS — FÉRIAS PARTIDAS E RECÁLCULO NA FOLHA SEGUINTE', 14, currentY);

    currentY += 4;
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Competência / Etapa', 'Proporção / Dias', 'Base INSS (R$)', 'INSS Apurado (R$)']],
      body: [
        [
          `Recibo de Férias (${r.competencia1Rotulo})`,
          `${r.diasMes1}/${r.totalDiasFerias} dias`,
          formatBRL(r.baseTotalInssMes1),
          formatBRL(r.inssNoReciboMes1),
        ],
        [
          `Folha Seguinte (${r.competencia2Rotulo}) · Férias + Trab. (${formatBRL(r.remuneracaoTrabalhadaMes2)})`,
          `${r.diasMes2}/${r.totalDiasFerias} dias`,
          formatBRL(r.baseTotalInssMes2),
          formatBRL(r.inssRecalculadoMes2),
        ],
      ],
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  // 4. Detalhamento da Base da Pensão
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('3. COMPOSIÇÃO DA BASE DE CÁLCULO DA PENSÃO', 14, currentY);

  currentY += 4;
  const somaVerbasBase = result.verbasConsideradasNaBase.reduce((acc, c) => acc + c.value, 0);
  const somaDeducoesBase = result.deducoesAutorizadasNaBase.reduce((acc, c) => acc + c.value, 0);

  const basePensionBody = [
    ['Soma das Verbas com Incidência de Pensão', formatBRL(somaVerbasBase)],
    ['(-) Deduções Autorizadas na Base (INSS / IRRF)', `(-) ${formatBRL(somaDeducoesBase)}`],
    ['(=) BASE DE CÁLCULO EFETIVA DA PENSÃO', formatBRL(result.basePensao)],
    ['Regra / Alíquota Fixada', result.regraTexto],
    ['VALOR DA PENSÃO ALIMENTÍCIA DEVIDA', formatBRL(result.valorPensao)],
  ];

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    head: [['Parâmetro da Base de Pensão', 'Valor Apurado (R$)']],
    body: basePensionBody,
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold', textColor: [5, 150, 105] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 7;

  if (result.rateioBeneficiarios?.ativo) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('3.1 DESDOBRAMENTO POR BENEFICIÁRIO (1 EVENTO ÚNICO NA FOLHA)', 14, currentY);

    currentY += 4;
    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [49, 46, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Beneficiário / Cota', 'Cálculo Individual', 'Valor Pré-Arred.', 'Valor da Cota (R$)']],
      body: [
        ...result.rateioBeneficiarios.beneficiarios.map((b) => [
          b.label,
          b.percentual !== undefined
            ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
            : formatBRL(b.valorFixo || 0),
          `R$ ${b.valorAntesArredondamento.toFixed(4)}`,
          formatBRL(b.valorCalculado),
        ]),
        [
          'TOTAL CONSOLIDADO (EVENTO ÚNICO NA FOLHA)',
          result.rateioBeneficiarios.somaPercentuais !== undefined
            ? `Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)} (${result.rateioBeneficiarios.quantidadeBeneficiarios} filhos)`
            : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`,
          `R$ ${result.rateioBeneficiarios.somaAntesArredondamento.toFixed(4)}`,
          formatBRL(result.rateioBeneficiarios.totalConsolidadoFolha),
        ],
      ],
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;
  }

  if (mode === 'completo') {
    // 5. Tabela de Verbas Informadas
    if (currentY > 210) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('4. DISCRIMINAÇÃO DAS VERBAS E INCIDÊNCIAS', 14, currentY);

    currentY += 4;
    const verbasTable = earnings.map((v) => [
      v.label,
      v.incideInss ? 'SIM' : 'NÃO',
      v.incideIrrf ? 'SIM' : 'NÃO',
      v.includedInPensionBase ? 'SIM' : 'NÃO',
      formatBRL(v.value),
    ]);

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 1.8 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      head: [['Rubrica / Evento', 'Incide INSS?', 'Incide IRRF?', 'Incide Pensão?', 'Valor (R$)']],
      body: verbasTable,
      margin: { left: 14, right: 14 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'right', fontStyle: 'bold' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 7;

    // 6. Auditoria Tributária (INSS e IRRF)
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('5. AUDITORIA PREVIDENCIÁRIA E TRIBUTÁRIA (INSS + IRRF)', 14, currentY);

    currentY += 4;
    const tributosBody = [
      [
        `INSS: Base ${formatBRL(result.baseInss)}`,
        `Teto RGPS: ${result.inssResult?.tetoAplicado ? 'Sim (Atingido)' : 'Não'}`,
        `INSS Apurado: ${formatBRL(result.valorInss)}`,
      ],
      [
        `IRRF: Base ${formatBRL(result.baseIrrf)}`,
        `Redutor 2026: ${result.irrfResult?.valorRedutorAplicado ? formatBRL(result.irrfResult.valorRedutorAplicado) : 'Não'}`,
        `IRRF Retido: ${formatBRL(result.valorIrrf)}`,
      ],
      [
        'Interdependência Circular:',
        'Método Algébrico Simultâneo Exato',
        `Pensão Deduzida do IRRF: ${formatBRL(result.irrfResult?.deducoes.pensaoAlimenticia || 0)}`,
      ],
    ];

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      head: [['Encargo Previdenciário / Fiscal', 'Regra / Parâmetro', 'Resultado Efetivo']],
      body: tributosBody,
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // 7. Campo de Assinatura e Chancela de DP
  if (currentY > 240) {
    doc.addPage();
    currentY = 30;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 15, 95, currentY + 15);
  doc.line(115, currentY + 15, 196, currentY + 15);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Responsável pelo Departamento Pessoal', 54.5, currentY + 19, { align: 'center' });
  doc.text('Auditoria Trabalhista / RH', 155.5, currentY + 19, { align: 'center' });

  // Rodapé em todas as páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Calculadora de Pensão Alimentícia — Departamento Pessoal · Documento gerado com segurança e conformidade LGPD · Página ${i} de ${totalPages}`,
      105,
      290,
      { align: 'center' }
    );
  }

  const filename = `Dossie_Pensao_${(identification.matricula || 'DP').replace(/\s+/g, '_')}_${identification.competencia}_${identification.ano}.pdf`;
  doc.save(filename);
}
