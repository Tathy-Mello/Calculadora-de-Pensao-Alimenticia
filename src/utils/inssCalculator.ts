/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  InssBracketResult,
  InssCalculationResult,
  InssMemoryStep,
  InssTable,
} from '../types/inss';
import { CalculationType, EarningItem, RoundingPolicy, ValidationError } from '../types/pension';
import { formatBRL, formatPercentage } from './formatters';
import { findInssTable } from './inssTables';

/**
 * Validação prévia estrita do motor de INSS (Fase 3)
 */
export function validateInssInputs(
  ano: number,
  tipoCalculo: CalculationType,
  earnings: EarningItem[]
): { errors: ValidationError[]; table: InssTable | null } {
  const errors: ValidationError[] = [];

  // 1. Busca da tabela oficial correspondente ao Ano e Tipo de Cálculo
  const table = findInssTable(ano, tipoCalculo);
  if (!table) {
    errors.push({
      field: 'ano_inss',
      message:
        tipoCalculo === 'rescisao'
          ? 'Não é possível calcular o INSS porque não existe tabela oficial configurada para o período informado.'
          : `Não existe tabela de INSS configurada para o período informado (Ano: ${ano}). Não é permitido utilizar tabelas de outro período automaticamente.`,
    });
  }

  // 2. Verificação estrita de incidência de INSS em cada verba
  for (const item of earnings) {
    if (item.value > 0) {
      if (item.incideInss === undefined || item.incideInss === null) {
        errors.push({
          field: `incide_inss_${item.id}`,
          message:
            tipoCalculo === 'plr'
              ? 'A incidência de INSS da PLR não foi definida.'
              : tipoCalculo === 'rescisao'
              ? `A incidência de INSS da verba "${item.label}" não está definida. Revise a configuração antes de calcular.`
              : `A incidência de INSS da verba "${item.label}" não foi definida. Defina se incide INSS (Sim ou Não).`,
        });
      }
    }
  }

  return { errors, table };
}

/**
 * Aplica política de arredondamento ao INSS
 */
function applyInssRounding(
  value: number,
  policy: RoundingPolicy = 'padrao_2dec'
): { rounded: number; policyText: string } {
  if (policy === 'truncamento_2dec') {
    const truncated = Math.floor(value * 100) / 100;
    return {
      rounded: truncated,
      policyText: 'Truncamento matemático em 2 casas decimais',
    };
  }
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return {
    rounded,
    policyText: 'Arredondamento padrão bancário/fiscal (meio para cima em 2 casas decimais)',
  };
}

/**
 * MOTOR INDEPENDENTE DE CÁLCULO DO INSS (FASE 3)
 */
export function calculateInss(
  ano: number,
  competencia: string,
  tipoCalculo: CalculationType,
  earnings: EarningItem[],
  table: InssTable,
  roundingPolicy: RoundingPolicy = 'padrao_2dec'
): InssCalculationResult {
  // Caso Especial: PLR (Lei nº 10.101/2000, art. 3º: isenção legal absoluta de encargos previdenciários)
  if (tipoCalculo === 'plr') {
    const memorySteps: InssMemoryStep[] = [
      {
        stepNumber: 1,
        title: 'Tratamento Previdenciário Específico — PLR',
        description: 'A Participação nos Lucros e Resultados possui imunidade previdenciária expressa por lei federal.',
        details: [
          { label: 'Tipo de Cálculo', value: 'PLR (Participação nos Lucros e Resultados)' },
          { label: 'Dispositivo Legal', value: 'Art. 3º da Lei Federal nº 10.101/2000' },
          { label: 'Incidência de INSS', value: 'ISENTO / NÃO INCIDE' },
          { label: 'Base de Cálculo do INSS', value: 'R$ 0,00' },
        ],
        formula: 'PLR não integra a remuneração para fins previdenciários (INSS = R$ 0,00).',
        resultHighlight: 'INSS Calculado sobre PLR: R$ 0,00',
      },
    ];

    return {
      ano,
      competencia,
      tipoCalculo,
      tabelaUtilizada: table,
      verbasInformadas: earnings.map((e) => ({
        label: e.label,
        valor: e.value,
        incideInss: false,
        observacao: e.inssObservation || 'Isento conforme Lei 10.101/2000',
      })),
      verbasComIncidencia: [],
      verbasSemIncidencia: earnings
        .filter((e) => e.value > 0)
        .map((e) => ({
          label: e.label,
          valor: e.value,
          motivo: 'Isenção de INSS sobre PLR (Lei nº 10.101/2000)',
        })),
      baseInssOriginal: 0,
      limitePrevidenciarioAplicavel: table.tetoPrevidenciario,
      baseInssEfetiva: 0,
      tetoAplicado: false,
      faixasCalculadas: [],
      valorAntesArredondamento: 0,
      regraArredondamento: 'Isenção Legal',
      valorInssFinal: 0,
      memorySteps,
      calculatedAt: new Date().toLocaleString('pt-BR'),
    };
  }

  // 1. Identificar todas as verbas informadas
  const verbasInformadas = earnings.map((e) => ({
    label: e.label,
    valor: e.value || 0,
    incideInss: Boolean(e.incideInss),
    observacao: e.inssObservation || e.observation,
  }));

  // 2 e 3. Verbas com incidência vs sem incidência
  const verbasComIncidencia = earnings
    .filter((e) => e.incideInss === true && e.value > 0)
    .map((e) => ({ label: e.label, valor: e.value, observacao: e.inssObservation || e.observation }));

  const verbasSemIncidencia = earnings
    .filter((e) => e.incideInss === false && e.value > 0)
    .map((e) => ({
      label: e.label,
      valor: e.value,
      motivo: e.inssObservation || 'Verba configurada sem incidência de INSS pelo operador do DP',
    }));

  // 4. Somar a base original
  const baseInssOriginal = verbasComIncidencia.reduce((acc, curr) => acc + curr.valor, 0);

  // 5. Aplicar limite / teto previdenciário
  const limitePrevidenciario = table.tetoPrevidenciario;
  const tetoAplicado = baseInssOriginal > limitePrevidenciario;
  const baseInssEfetiva = tetoAplicado ? limitePrevidenciario : baseInssOriginal;
  const motivoLimitacao = tetoAplicado
    ? `Base apurada (${formatBRL(baseInssOriginal)}) superior ao teto do RGPS (${formatBRL(
        limitePrevidenciario
      )}). Conforme legislação previdenciária, a base de cálculo fica limitada ao teto.`
    : undefined;

  // 6. Cálculo Progressivo por Faixas
  const faixasCalculadas: InssBracketResult[] = [];
  let valorAntesArredondamento = 0;

  for (const faixa of table.faixas) {
    const inicioFaixa = faixa.faixaInicial === 0 ? 0 : faixa.faixaInicial - 0.01;
    const fimFaixa = faixa.faixaFinal;

    if (baseInssEfetiva <= inicioFaixa) {
      // Base não atingiu esta faixa
      faixasCalculadas.push({
        faixaNumero: faixa.faixaNumero,
        faixaInicial: faixa.faixaInicial,
        faixaFinal: faixa.faixaFinal,
        aliquota: faixa.aliquota,
        baseConsideradaNaFaixa: 0,
        contribuicaoDaFaixa: 0,
      });
    } else {
      // Base atinge esta faixa parcial ou totalmente
      const baseConsiderada = Math.min(baseInssEfetiva, fimFaixa) - inicioFaixa;
      const contribuicao = baseConsiderada * (faixa.aliquota / 100);

      valorAntesArredondamento += contribuicao;

      faixasCalculadas.push({
        faixaNumero: faixa.faixaNumero,
        faixaInicial: faixa.faixaInicial,
        faixaFinal: faixa.faixaFinal,
        aliquota: faixa.aliquota,
        baseConsideradaNaFaixa: baseConsiderada,
        contribuicaoDaFaixa: contribuicao,
      });
    }
  }

  // Se atingiu o teto máximo de contribuição estipulado
  if (tetoAplicado && table.tetoMaximoContribuicao > 0) {
    valorAntesArredondamento = Math.min(valorAntesArredondamento, table.tetoMaximoContribuicao);
  }

  // 7. Política de Arredondamento
  const { rounded: valorInssFinal, policyText: regraArredondamento } = applyInssRounding(
    valorAntesArredondamento,
    roundingPolicy
  );

  // 8. Construção da Memória Completa de Cálculo do INSS
  const memorySteps: InssMemoryStep[] = [
    {
      stepNumber: 1,
      title: '1. Verbas Informadas e Mapeamento de Incidência',
      description: 'Discriminação de todas as rubricas informadas para apuração previdenciária.',
      details: verbasInformadas.map((v) => ({
        label: v.label,
        value: formatBRL(v.valor),
        extra: v.incideInss ? 'Incide INSS: SIM' : 'Incide INSS: NÃO (Excluída)',
      })),
      resultHighlight: `Total de Verbas: ${verbasInformadas.length}`,
    },
    {
      stepNumber: 2,
      title: '2. Verbas com Incidência Previdenciária Integrantes',
      description: 'Rubricas remuneratórias que legalmente e conforme parametrização compõem a base do INSS.',
      details:
        verbasComIncidencia.length > 0
          ? verbasComIncidencia.map((v) => ({
              label: `(+) ${v.label}`,
              value: formatBRL(v.valor),
              extra: v.observacao,
            }))
          : [{ label: 'Nenhuma verba com incidência', value: 'R$ 0,00' }],
      resultHighlight: `Soma das Verbas Tributáveis: ${formatBRL(baseInssOriginal)}`,
    },
    {
      stepNumber: 3,
      title: '3. Verbas sem Incidência de INSS (Exclusões)',
      description: 'Verbas de natureza indenizatória, isenta ou não tributável previdenciariamente.',
      details:
        verbasSemIncidencia.length > 0
          ? verbasSemIncidencia.map((v) => ({
              label: `(–) ${v.label}`,
              value: formatBRL(v.valor),
              extra: `Motivo: ${v.motivo}`,
            }))
          : [{ label: 'Nenhuma exclusão', value: 'Todas as verbas positivas integraram a base' }],
      resultHighlight: `Total Excluído: ${formatBRL(
        verbasSemIncidencia.reduce((a, b) => a + b.valor, 0)
      )}`,
    },
    {
      stepNumber: 4,
      title: '4. Formação da Base de Cálculo do INSS e Teto Oficial',
      description: 'Apuração da base efetiva de contribuição e verificação do teto do RGPS.',
      details: [
        { label: 'Base Original Apurada', value: formatBRL(baseInssOriginal) },
        { label: 'Teto Previdenciário Oficial', value: formatBRL(limitePrevidenciario) },
        {
          label: 'Base Efetivamente Utilizada',
          value: formatBRL(baseInssEfetiva),
          extra: tetoAplicado ? motivoLimitacao : 'Dentro do limite do teto previdenciário',
        },
      ],
      resultHighlight: `Base Final do INSS: ${formatBRL(baseInssEfetiva)}`,
    },
    {
      stepNumber: 5,
      title: '5. Tabela Oficial de INSS Aplicada',
      description: 'Parâmetros oficiais aplicados conforme Ano, Competência e Modalidade.',
      details: [
        { label: 'Ano / Exercício', value: `${table.ano}` },
        { label: 'Vigência', value: `${table.vigenciaInicial} até ${table.vigenciaFinal}` },
        { label: 'Fonte Oficial', value: table.fonte },
        { label: 'Teto Máximo de Contribuição', value: formatBRL(table.tetoMaximoContribuicao) },
      ],
      resultHighlight: table.observacao,
    },
    {
      stepNumber: 6,
      title: '6. Cálculo Progressivo por Faixas (Emenda Constitucional 103/2019)',
      description: 'Incidência progressiva de cada alíquota sobre a respectiva fatia salarial.',
      details: faixasCalculadas.map((f) => ({
        label: `Faixa ${f.faixaNumero} (${formatPercentage(f.aliquota)}) [${formatBRL(
          f.faixaInicial
        )} a ${formatBRL(f.faixaFinal)}]`,
        value: formatBRL(f.contribuicaoDaFaixa),
        extra: `Base na faixa: ${formatBRL(f.baseConsideradaNaFaixa)} × ${formatPercentage(f.aliquota)} = ${formatBRL(
          f.contribuicaoDaFaixa
        )}`,
      })),
      formula: `INSS TOTAL = ∑(Contribuições das Faixas)
${faixasCalculadas
  .filter((f) => f.baseConsideradaNaFaixa > 0)
  .map((f) => `${formatBRL(f.contribuicaoDaFaixa)} (Faixa ${f.faixaNumero})`)
  .join(' + ')} = ${formatBRL(valorAntesArredondamento)}`,
      resultHighlight: `Subtotal Progressivo: ${formatBRL(valorAntesArredondamento)}`,
    },
    {
      stepNumber: 7,
      title: '7. Resultado e Arredondamento do INSS',
      description: 'Aplicação da política de arredondamento configurada para o cálculo de folha.',
      details: [
        { label: 'Valor apurado antes do arredondamento', value: `R$ ${valorAntesArredondamento.toFixed(4)}` },
        { label: 'Política aplicada', value: regraArredondamento },
      ],
      resultHighlight: `INSS Definitivo: ${formatBRL(valorInssFinal)}`,
    },
  ];

  // Adiciona anotação específica do 13º Salário se aplicável
  if (tipoCalculo === 'decimo_terceiro') {
    memorySteps.unshift({
      stepNumber: 0,
      title: 'Especificidade Legal: INSS sobre 13º Salário',
      description: 'O 13º salário possui tributação previdenciária exclusiva na fonte, não se comunicando com a folha regular.',
      details: [
        { label: 'Regime de Tributação', value: 'Exclusiva na fonte (Quitação 2ª Parcela)' },
        { label: 'Compensação de Adiantamento', value: '1ª Parcela isenta de desconto de INSS' },
      ],
      resultHighlight: 'Cálculo de INSS sobre 13º salário',
    });
  }

  return {
    ano,
    competencia,
    tipoCalculo,
    tabelaUtilizada: table,
    verbasInformadas,
    verbasComIncidencia,
    verbasSemIncidencia,
    baseInssOriginal,
    limitePrevidenciarioAplicavel: limitePrevidenciario,
    baseInssEfetiva,
    tetoAplicado,
    motivoLimitacao,
    faixasCalculadas,
    valorAntesArredondamento,
    regraArredondamento,
    valorInssFinal,
    memorySteps,
    calculatedAt: new Date().toLocaleString('pt-BR'),
  };
}
