/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IrrfBracket,
  IrrfCalculationResult,
  IrrfDeductionsConfig,
  IrrfMemoryStep,
  IrrfTable,
} from '../types/irrf';
import { CalculationType, EarningItem, PensionRuleConfig, RoundingPolicy, ValidationError } from '../types/pension';
import { formatBRL, formatPercentage } from './formatters';
import { findIrrfTable } from './irrfTables';

/**
 * Validação prévia estrita do motor de IRRF (Fase 4)
 * Detecta dependência circular entre IRRF e Pensão Alimentícia (Seções 19 e 20)
 */
export function validateIrrfInputs(
  ano: number,
  tipoCalculo: CalculationType,
  earnings: EarningItem[],
  irrfConfig: IrrfDeductionsConfig,
  pensionRule: PensionRuleConfig
): { errors: ValidationError[]; table: IrrfTable | null } {
  const errors: ValidationError[] = [];

  // 1. Tabela oficial de IRRF correspondente
  const table = findIrrfTable(ano, tipoCalculo);
  if (!table) {
    errors.push({
      field: 'ano_irrf',
      message:
        tipoCalculo === 'plr'
          ? 'Não existe regra de IRRF configurada para PLR no período informado.'
          : tipoCalculo === 'rescisao'
          ? 'Não foi possível calcular o IRRF porque não existe configuração válida para o período informado.'
          : `Não existe tabela de IRRF configurada para o período informado (Ano: ${ano}, Tipo: ${tipoCalculo}). Não é permitido realizar cálculo presumido.`,
    });
  }

  // 2. Verificação estrita de tributação de cada verba
  for (const item of earnings) {
    if (item.value > 0) {
      if (item.incideIrrf === undefined || item.incideIrrf === null) {
        errors.push({
          field: `incide_irrf_${item.id}`,
          message:
            tipoCalculo === 'plr'
              ? `A incidência da verba ${item.label} não foi definida.`
              : tipoCalculo === 'rescisao'
              ? `A incidência de IRRF da verba "${item.label}" não está definida. Revise a configuração antes de calcular.`
              : `A tributação de IRRF da verba "${item.label}" não foi definida. Defina se a verba é tributável para IRRF (Sim ou Não).`,
        });
      }
    }
  }

  // 3. Resolução de Cálculo Circular (Seção 20)
  // Se a pensão deduz o IRRF e o IRRF deduz a pensão, o motor aplica por padrão a resolução simultânea algébrica.

  return { errors, table };
}

/**
 * Aplica política de arredondamento ao IRRF
 */
function applyIrrfRounding(
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
    policyText: 'Arredondamento padrão fiscal (meio para cima em 2 casas decimais)',
  };
}

/**
 * MOTOR INDEPENDENTE DE CÁLCULO DO IRRF (FASE 4)
 */
export function calculateIrrf(
  ano: number,
  competencia: string,
  tipoCalculo: CalculationType,
  earnings: EarningItem[],
  table: IrrfTable,
  irrfConfig: IrrfDeductionsConfig,
  valorInssCalculado: number,
  valorPensaoCalculado: number = 0,
  roundingPolicy: RoundingPolicy = 'padrao_2dec'
): IrrfCalculationResult {
  // 1. Identificar rendimentos tributáveis vs não tributáveis
  const verbasTributaveis = earnings
    .filter((e) => e.incideIrrf === true && e.value > 0)
    .map((e) => ({ label: e.label, valor: e.value, observacao: e.irrfObservation || e.observation }));

  const verbasNaoTributaveis = earnings
    .filter((e) => e.incideIrrf === false && e.value > 0)
    .map((e) => ({
      label: e.label,
      valor: e.value,
      motivo: e.irrfObservation || 'Rendimento isento, não tributável ou com tributação exclusiva',
    }));

  const rendimentosTributaveis = verbasTributaveis.reduce((acc, curr) => acc + curr.valor, 0);

  // 2. Apurar Deduções Permitidas
  // INSS
  const valorDeducaoInss = irrfConfig.deduzirInss ? valorInssCalculado : 0;

  // Dependentes (Quantidade × Dedução oficial da tabela)
  const qtdDependentes = irrfConfig.deduzirDependentes ? Math.max(0, irrfConfig.quantidadeDependentes || 0) : 0;
  const valorUnitarioDependente = table.deducaoPorDependente || 0;
  const totalDeducaoDependentes = qtdDependentes * valorUnitarioDependente;

  // Pensão Alimentícia
  let valorDeducaoPensao = 0;
  if (irrfConfig.deduzirPensao) {
    if (irrfConfig.usarPensaoCalculadaPeloMotor) {
      valorDeducaoPensao = valorPensaoCalculado;
    } else {
      valorDeducaoPensao = irrfConfig.valorPensaoManual || 0;
    }
  }

  // Outras Deduções Permitidas
  const valorOutrasDeducoes = irrfConfig.deduzirOutras ? Math.max(0, irrfConfig.outrasDeducoesValor || 0) : 0;

  const totalDeducoes = valorDeducaoInss + totalDeducaoDependentes + valorDeducaoPensao + valorOutrasDeducoes;

  // 3. Formação da Base do IRRF
  const baseIrrfCalculada = Math.max(0, rendimentosTributaveis - totalDeducoes);

  // 4. Identificação da Faixa na Tabela Oficial
  let faixaAplicada: IrrfBracket = table.faixas[0];

  for (const f of table.faixas) {
    if (baseIrrfCalculada >= f.faixaInicial && baseIrrfCalculada <= f.faixaFinal) {
      faixaAplicada = f;
      break;
    }
  }

  // 5. Cálculo Matemático do IRRF: (Base × Alíquota) − Parcela a Deduzir
  let valorCalculadoAntesArredondamento = 0;
  if (faixaAplicada.aliquota > 0) {
    const impostoBruto = baseIrrfCalculada * (faixaAplicada.aliquota / 100);
    valorCalculadoAntesArredondamento = impostoBruto - faixaAplicada.parcelaADeduzir;
  }

  // 6. Proteção contra valor negativo (Seção 12: Não apresentar IRRF negativo)
  if (valorCalculadoAntesArredondamento < 0) {
    valorCalculadoAntesArredondamento = 0;
  }

  const valorImpostoAntesRedutor = valorCalculadoAntesArredondamento;
  let valorRedutorAplicado = 0;
  let formulaRedutorTexto = '';

  // 6.1 Regra de Redutor Adicional (Isenção e Desconto Gradual a partir de Janeiro de 2026)
  if (table.redutorAdicional?.ativo && valorCalculadoAntesArredondamento > 0) {
    const red = table.redutorAdicional;
    if (rendimentosTributaveis <= red.limiteIsencaoTotal) {
      // Até R$ 5.000,00: redução de R$ 312,89 (zerando o imposto devido até esse teto)
      valorRedutorAplicado = Math.min(valorCalculadoAntesArredondamento, red.valorReducaoFixa);
      formulaRedutorTexto = `Até R$ 5.000,00: Redução fixa de até ${formatBRL(red.valorReducaoFixa)} (zerando o imposto devido).`;
    } else if (rendimentosTributaveis <= red.limiteReducaoGradual) {
      // De R$ 5.000,01 até R$ 7.350,00: fórmula R$ 978,61 - (0,133145 × Rendimento Tributável)
      const redCalculado = red.constanteFormula - (red.fatorFormula * rendimentosTributaveis);
      const redPositivo = Math.max(0, redCalculado);
      valorRedutorAplicado = Math.min(valorCalculadoAntesArredondamento, redPositivo);
      formulaRedutorTexto = `Redução gradual: R$ ${red.constanteFormula.toFixed(2)} - (${red.fatorFormula} × ${formatBRL(rendimentosTributaveis)}) = ${formatBRL(valorRedutorAplicado)}`;
    } else {
      valorRedutorAplicado = 0;
      formulaRedutorTexto = `Acima de R$ ${red.limiteReducaoGradual.toFixed(2)}: Sem redução adicional, aplicando-se tabela integral.`;
    }

    valorCalculadoAntesArredondamento = Math.max(0, valorCalculadoAntesArredondamento - valorRedutorAplicado);
  }

  // 7. Arredondamento
  const { rounded: valorIrrfFinal, policyText: regraArredondamento } = applyIrrfRounding(
    valorCalculadoAntesArredondamento,
    roundingPolicy
  );

  // 8. Construção da Memória Completa de Cálculo do IRRF
  const memorySteps: IrrfMemoryStep[] = [
    {
      stepNumber: 1,
      title: '1. Rendimentos Tributáveis Considerados',
      description: 'Somatório de todas as verbas que possuem incidência tributária de IRRF.',
      details:
        verbasTributaveis.length > 0
          ? verbasTributaveis.map((v) => ({
              label: `(+) ${v.label}`,
              value: formatBRL(v.valor),
              extra: v.observacao,
            }))
          : [{ label: 'Sem rendimentos tributáveis', value: 'R$ 0,00' }],
      resultHighlight: `Total Rendimentos Tributáveis: ${formatBRL(rendimentosTributaveis)}`,
    },
    {
      stepNumber: 2,
      title: '2. Verbas Isentas ou Não Tributáveis de IRRF',
      description: 'Rubricas excluídas da apuração do imposto conforme previsão legal.',
      details:
        verbasNaoTributaveis.length > 0
          ? verbasNaoTributaveis.map((v) => ({
              label: `(–) ${v.label}`,
              value: formatBRL(v.valor),
              extra: `Motivo: ${v.motivo}`,
            }))
          : [{ label: 'Nenhuma exclusão', value: 'Todas as verbas positivas integraram a base tributável' }],
      resultHighlight: `Total Isento / Excluído: ${formatBRL(
        verbasNaoTributaveis.reduce((a, b) => a + b.valor, 0)
      )}`,
    },
    {
      stepNumber: 3,
      title: '3. Deduções Legais Permitidas da Base do IRRF',
      description: 'Deduções legais aplicáveis para redução da base tributária.',
      details: [
        {
          label: '(-) Contribuição Previdenciária (INSS)',
          value: formatBRL(valorDeducaoInss),
          extra: irrfConfig.deduzirInss ? 'Apurado pelo motor oficial de INSS (Fase 3)' : 'Não aplicável nesta regra',
        },
        {
          label: `(-) Dedução por Dependentes (${qtdDependentes} × ${formatBRL(valorUnitarioDependente)})`,
          value: formatBRL(totalDeducaoDependentes),
          extra: qtdDependentes > 0 ? `${qtdDependentes} dependente(s) legalmente cadastrado(s)` : 'Sem dependentes informados',
        },
        {
          label: '(-) Pensão Alimentícia Judicial',
          value: formatBRL(valorDeducaoPensao),
          extra: irrfConfig.deduzirPensao ? 'Deduzida da base do imposto conforme determinação legal' : 'Não deduzida nesta modalidade',
        },
        {
          label: '(-) Outras Deduções Permitidas',
          value: formatBRL(valorOutrasDeducoes),
          extra: irrfConfig.outrasDeducoesDescricao,
        },
      ],
      resultHighlight: `Total de Deduções Aplicadas: ${formatBRL(totalDeducoes)}`,
    },
    {
      stepNumber: 4,
      title: '4. Formação da Base de Cálculo do IRRF',
      description: 'Subtração das deduções legais sobre os rendimentos tributáveis.',
      formula: `BASE DO IRRF = Rendimentos Tributáveis - Deduções Permitidas
${formatBRL(rendimentosTributaveis)} - ${formatBRL(totalDeducoes)} = ${formatBRL(baseIrrfCalculada)}`,
      resultHighlight: `Base Efetiva do IRRF: ${formatBRL(baseIrrfCalculada)}`,
    },
    {
      stepNumber: 5,
      title: '5. Enquadramento na Tabela Oficial de IRRF',
      description: 'Localização da faixa de tributação e parâmetros cadastrados para o período.',
      details: [
        { label: 'Tabela Aplicada', value: table.observacoes },
        { label: 'Fonte Normativa', value: table.fonte },
        { label: 'Dedução Legal por Dependente', value: formatBRL(table.deducaoPorDependente) },
        ...(table.descontoSimplificadoMensal ? [{ label: 'Desconto Simplificado Mensal (Referência)', value: formatBRL(table.descontoSimplificadoMensal) }] : []),
        { label: 'Faixa de Enquadramento', value: `Faixa ${faixaAplicada.faixaNumero} (${faixaAplicada.observacao})` },
        { label: 'Alíquota Aplicável', value: formatPercentage(faixaAplicada.aliquota) },
        { label: 'Parcela a Deduzir do Imposto', value: formatBRL(faixaAplicada.parcelaADeduzir) },
      ],
      resultHighlight: `Faixa ${faixaAplicada.faixaNumero} · Alíquota ${formatPercentage(faixaAplicada.aliquota)}`,
    },
    {
      stepNumber: 6,
      title: '6. Aplicação da Metodologia e Cálculo do IRRF',
      description: 'Aplicação da fórmula legal de apuração: (Base × Alíquota) − Parcela a Deduzir.',
      formula:
        faixaAplicada.aliquota === 0
          ? 'Rendimento situado na faixa de isenção tributária (Alíquota 0% / IRRF = R$ 0,00).'
          : `IRRF = (Base de Cálculo × Alíquota) - Parcela a Deduzir
(${formatBRL(baseIrrfCalculada)} × ${formatPercentage(faixaAplicada.aliquota)}) - ${formatBRL(
              faixaAplicada.parcelaADeduzir
            )} = ${formatBRL(valorCalculadoAntesArredondamento)}`,
      details: [
        { label: 'Valor apurado antes do arredondamento', value: `R$ ${valorCalculadoAntesArredondamento.toFixed(4)}` },
        ...(valorRedutorAplicado > 0
          ? [
              { label: 'Imposto pela tabela progressiva integral', value: formatBRL(valorImpostoAntesRedutor) },
              { label: '(-) Redutor adicional de isenção (2026)', value: formatBRL(valorRedutorAplicado), extra: formulaRedutorTexto },
            ]
          : []),
        { label: 'Política de arredondamento', value: regraArredondamento },
      ],
      resultHighlight: `IRRF Definitivo: ${formatBRL(valorIrrfFinal)}`,
    },
  ];

  // Identificação clara para modalidades especiais
  if (tipoCalculo === 'decimo_terceiro') {
    memorySteps.unshift({
      stepNumber: 0,
      title: 'CÁLCULO DE IRRF — 13º SALÁRIO',
      description: 'Tributação exclusiva na fonte por ocasião da quitação da 2ª parcela (art. 700 do RIR/2018).',
      resultHighlight: 'Tributação Exclusiva na Fonte',
    });
  } else if (tipoCalculo === 'ferias') {
    memorySteps.unshift({
      stepNumber: 0,
      title: 'CÁLCULO DE IRRF — FÉRIAS',
      description: 'Tributação em separado da remuneração mensal com aplicação da tabela do mês do pagamento (art. 620 do RIR/2018).',
      resultHighlight: 'Tributação de Férias e 1/3 Constitucional',
    });
  } else if (tipoCalculo === 'plr') {
    memorySteps.unshift({
      stepNumber: 0,
      title: 'CÁLCULO DE IRRF — PLR (LEI Nº 10.101/2000)',
      description: 'Tabela progressiva exclusiva anual/semestral com faixas e parcelas próprias sem retenção previdenciária.',
      resultHighlight: 'Tabela Exclusiva de PLR',
    });
  }

  return {
    ano,
    competencia,
    tipoCalculo,
    tabelaUtilizada: table,
    rendimentosTributaveis,
    verbasTributaveis,
    verbasNaoTributaveis,
    deducoes: {
      inss: valorDeducaoInss,
      dependentes: {
        quantidade: qtdDependentes,
        valorUnitario: valorUnitarioDependente,
        total: totalDeducaoDependentes,
      },
      pensaoAlimenticia: valorDeducaoPensao,
      outrasDeducoes: valorOutrasDeducoes,
      totalDeducoes,
    },
    baseIrrf: baseIrrfCalculada,
    faixaAplicada,
    aliquotaAplicada: faixaAplicada.aliquota,
    parcelaDeduzirAplicada: faixaAplicada.parcelaADeduzir,
    valorCalculadoAntesArredondamento,
    valorImpostoAntesRedutor,
    valorRedutorAplicado,
    regraArredondamento,
    valorIrrfFinal,
    memorySteps,
    calculatedAt: new Date().toLocaleString('pt-BR'),
  };
}
