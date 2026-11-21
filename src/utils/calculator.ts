/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalculationAuditLog,
  CalculationMemoryStep,
  CalculationResultData,
  CalculationType,
  DeductionItem,
  EarningItem,
  FeriasRateioInssResumo,
  IdentificationData,
  PensionBeneficiaryResultItem,
  PensionBeneficiarySplitResumo,
  PensionRuleConfig,
  PlrComparacaoSistema,
  PlrResumo,
  PlrTipoCalculo,
  ProventosComposicao,
  RescisaoResumo,
  RescisaoTipoDesligamento,
  ResumoEncargos,
  RoundingPolicy,
  TypeSpecificProfile,
  ValidationError,
} from '../types/pension';
import { IrrfDeductionsConfig } from '../types/irrf';
import { calculateInss, validateInssInputs } from './inssCalculator';
import { calculateIrrf, validateIrrfInputs } from './irrfCalculator';
import { findInssTable, OFFICIAL_INSS_TABLES } from './inssTables';
import { findIrrfTable } from './irrfTables';
import { formatBRL, formatPercentage } from './formatters';
import { computeFeriasSplitInfo } from './feriasSplit';

export const CALC_TYPE_LABELS: Record<CalculationType, string> = {
  folha_mensal: 'Folha Mensal',
  ferias: 'Férias',
  decimo_terceiro: '13º Salário',
  rescisao: 'Rescisão',
  plr: 'PLR',
};

export const RESCISAO_DESLIGAMENTO_LABELS: Record<RescisaoTipoDesligamento, string> = {
  dispensa_sem_justa_causa: 'Dispensa sem Justa Causa',
  pedido_demissao: 'Pedido de Demissão',
  dispensa_com_justa_causa: 'Dispensa por Justa Causa',
  termino_contrato: 'Término de Contrato',
  termino_antecipado: 'Término Antecipado de Contrato',
  acordo_art_484a: 'Acordo entre as Partes (Art. 484-A CLT)',
  outros: 'Outros / Personalizado',
};

/**
 * Validação prévia integrada (Pensão, INSS e IRRF - Fase 4)
 */
export function validateCalculationInputs(
  identification: IdentificationData,
  earnings: EarningItem[],
  deductions: DeductionItem[],
  rule: PensionRuleConfig,
  irrfConfig: IrrfDeductionsConfig
): ValidationError[] {
  const errors: ValidationError[] = [];

  // 1. Matrícula ou identificador
  if (!identification.matricula || !identification.matricula.trim()) {
    errors.push({
      field: 'matricula',
      message: 'Informe a matrícula ou identificador do colaborador para vincular o cálculo.',
    });
  }

  // 1.0 Parâmetros específicos de Férias Partidas
  if (identification.tipoCalculo === 'ferias') {
    const dias = identification.diasFerias ?? 30;
    if (dias < 1 || dias > 30) {
      errors.push({
        field: 'diasFerias',
        message: 'A quantidade de dias de férias deve estar entre 1 e 30 dias.',
      });
    }
    if (identification.ativarRateioInssFerias && !computeFeriasSplitInfo(identification.dataInicioFerias, dias).isValid) {
      errors.push({
        field: 'dataInicioFerias',
        message: 'Informe uma data de início das férias válida para aplicar o rateio proporcional de INSS por competência.',
      });
    }
  }

  // 1.1 Parâmetros específicos da Rescisão (Fase 8)
  if (identification.tipoCalculo === 'rescisao') {
    if (!identification.dataDesligamento) {
      errors.push({
        field: 'dataDesligamento',
        message: 'Informe a data de desligamento do colaborador para apuração da rescisão.',
      });
    }
    if (!identification.dataPagamento) {
      errors.push({
        field: 'dataPagamento',
        message: 'Informe a data de pagamento da rescisão (prazo legal: até 10 dias após o término).',
      });
    }
    if (!identification.tipoDesligamento) {
      errors.push({
        field: 'tipoDesligamento',
        message: 'Selecione o tipo de desligamento para parametrização das verbas rescisórias.',
      });
    }
  }

  // Validação específica para PLR (Fase 9)
  if (identification.tipoCalculo === 'plr') {
    if (!identification.matricula || !identification.matricula.trim()) {
      errors.push({
        field: 'matricula',
        message: 'A matrícula do colaborador é obrigatória para identificação do cálculo.',
      });
    }
    if (!identification.dataPagamento) {
      errors.push({
        field: 'dataPagamento',
        message: 'A data de pagamento da PLR é obrigatória.',
      });
    }
    const totalEarningsPlr = earnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
    if (totalEarningsPlr <= 0) {
      errors.push({
        field: 'regra_plr',
        message: 'Informe a regra utilizada para determinar o valor da PLR.',
      });
    }
    if (
      rule.ruleType === 'percentual' &&
      (rule.percentage === undefined || rule.percentage === null || isNaN(rule.percentage) || rule.percentage <= 0)
    ) {
      errors.push({
        field: 'regra_pensao_plr',
        message: 'Defina a regra de pensão aplicável à PLR.',
      });
    }
  }

  // 2. Validação da Tabela de INSS e Incidências de INSS (Fase 3)
  const { errors: inssErrors } = validateInssInputs(
    identification.ano,
    identification.tipoCalculo,
    earnings
  );
  errors.push(...inssErrors);

  // 3. Validação da Tabela de IRRF, Tributação de IRRF e Dependência Circular (Fase 4)
  const { errors: irrfErrors } = validateIrrfInputs(
    identification.ano,
    identification.tipoCalculo,
    earnings,
    irrfConfig,
    rule
  );
  errors.push(...irrfErrors);

  // 4. Verificação de valores negativos indevidos
  for (const item of earnings) {
    if (item.value < 0) {
      errors.push({
        field: item.id,
        message: `A verba "${item.label}" possui valor negativo (${formatBRL(item.value)}). Valores negativos não são permitidos.`,
      });
    }
  }

  for (const item of deductions) {
    if (item.value < 0) {
      errors.push({
        field: item.id,
        message: `O desconto "${item.label}" possui valor negativo (${formatBRL(item.value)}).`,
      });
    }
  }

  // 5. Verificação de verbas informadas
  const totalEarnings = earnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
  if (totalEarnings <= 0) {
    errors.push({
      field: 'proventos',
      message: 'Nenhum provento com valor positivo foi informado. Preencha ao menos uma verba.',
    });
  }

  // 5.1 Validação estrita das incidências de cada verba (Fase 5 - Seção 6)
  for (const item of earnings) {
    if (item.value > 0) {
      if (
        item.incideInss === undefined ||
        item.incideInss === null ||
        item.incideIrrf === undefined ||
        item.incideIrrf === null ||
        item.includedInPensionBase === undefined ||
        item.includedInPensionBase === null
      ) {
        errors.push({
          field: `config_${item.id}`,
          message: `A verba "${item.label}" precisa ter sua incidência configurada antes do cálculo.`,
        });
      }
    }
  }

  // 6. Validação da regra da pensão
  const isRateioBeneficiarios = Boolean(rule.rateioBeneficiariosAtivo && rule.beneficiarios && rule.beneficiarios.length > 0);
  const effectivePercentage = isRateioBeneficiarios
    ? (rule.beneficiarios || []).reduce((acc, b) => acc + (b.percentual || 0), 0)
    : rule.percentage;
  const effectiveFixedValue = isRateioBeneficiarios
    ? (rule.beneficiarios || []).reduce((acc, b) => acc + (b.valorFixo || 0), 0)
    : rule.fixedValue;

  if (!rule.ruleType) {
    errors.push({
      field: 'ruleType',
      message: 'Não foi possível calcular a pensão porque a regra da pensão não está suficientemente configurada. Selecione o tipo de cálculo da regra (Percentual, Valor Fixo ou Percentual + Adicional).',
    });
  } else if (rule.ruleType === 'percentual') {
    if (effectivePercentage === undefined || effectivePercentage === null || isNaN(effectivePercentage) || effectivePercentage <= 0) {
      errors.push({
        field: 'percentage',
        message: 'Não foi possível calcular a pensão porque a regra da pensão não está suficientemente configurada. Informe o percentual da pensão (ex: 30,00%).',
      });
    } else if (effectivePercentage > 100) {
      errors.push({
        field: 'percentage',
        message: 'O percentual da pensão alimentícia não pode ser superior a 100,00%.',
      });
    }
  } else if (rule.ruleType === 'valor_fixo') {
    if (!effectiveFixedValue || effectiveFixedValue <= 0) {
      errors.push({
        field: 'fixedValue',
        message: 'Não foi possível calcular a pensão porque a regra da pensão não está suficientemente configurada. Informe o valor fixo da pensão (R$).',
      });
    }
  } else if (rule.ruleType === 'percentual_adicional') {
    if (effectivePercentage === undefined || effectivePercentage === null || isNaN(effectivePercentage) || effectivePercentage <= 0) {
      errors.push({
        field: 'percentage',
        message: 'Informe o percentual da pensão para a regra combinada.',
      });
    } else if (effectivePercentage > 100) {
      errors.push({
        field: 'percentage',
        message: 'A soma dos percentuais da pensão alimentícia não pode ser superior a 100,00%.',
      });
    }
    const effectiveAddVal = isRateioBeneficiarios ? effectiveFixedValue : rule.additionalValue;
    if (effectiveAddVal === undefined || effectiveAddVal < 0) {
      errors.push({
        field: 'additionalValue',
        message: 'Informe o valor adicional da pensão em reais (R$).',
      });
    }
  }

  if (rule.rateioBeneficiariosAtivo) {
    const bens = rule.beneficiarios || [];
    if (bens.length < 2) {
      errors.push({
        field: 'beneficiarios',
        message: 'O rateio por beneficiário exige ao menos 2 beneficiários/cotas cadastrados.',
      });
    }
    bens.forEach((b, idx) => {
      if ((b.percentual || 0) < 0 || (b.valorFixo || 0) < 0) {
        errors.push({
          field: `beneficiario_${b.id}`,
          message: `A cota do ${b.label || `Beneficiário ${idx + 1}`} não pode possuir valor ou percentual negativo.`,
        });
      }
      if (rule.ruleType === 'percentual' && (b.percentual || 0) <= 0) {
        errors.push({
          field: `beneficiario_${b.id}`,
          message: `Informe um percentual positivo para "${b.label || `Beneficiário ${idx + 1}`}".`,
        });
      }
      if (rule.ruleType === 'valor_fixo' && (b.valorFixo || 0) <= 0) {
        errors.push({
          field: `beneficiario_${b.id}`,
          message: `Informe um valor fixo positivo para "${b.label || `Beneficiário ${idx + 1}`}".`,
        });
      }
    });
  }

  // 7. Verificação de verbas participantes da base da pensão
  const includedEarnings = earnings.filter((e) => e.includedInPensionBase && e.value > 0);
  if (includedEarnings.length === 0) {
    errors.push({
      field: 'base_pensao',
      message: 'Não foi possível calcular a pensão porque a regra da pensão não está suficientemente configurada. Informe quais verbas compõem a base da pensão (nenhuma verba positiva foi marcada como participante).',
    });
  }

  // 8. Validação de Mínimo e Teto
  if (rule.hasMinimum && (!rule.minimumValue || rule.minimumValue <= 0)) {
    errors.push({
      field: 'minimumValue',
      message: 'O valor mínimo da pensão foi ativado, mas nenhum valor mínimo válido foi informado.',
    });
  }

  if (rule.hasMaximum && (!rule.maximumValue || rule.maximumValue <= 0)) {
    errors.push({
      field: 'maximumValue',
      message: 'O teto máximo da pensão foi ativado, mas nenhum limite máximo válido foi informado.',
    });
  }

  if (rule.hasMinimum && rule.hasMaximum && rule.minimumValue > 0 && rule.maximumValue > 0) {
    if (rule.minimumValue > rule.maximumValue) {
      errors.push({
        field: 'minimum_maximum_conflict',
        message: `Inconsistência de parâmetros: o valor mínimo (${formatBRL(rule.minimumValue)}) não pode ser superior ao teto máximo (${formatBRL(rule.maximumValue)}).`,
      });
    }
  }

  return errors;
}

/**
 * Aplica política de arredondamento configurável
 */
function applyRounding(value: number, policy: RoundingPolicy): { rounded: number; policyText: string } {
  if (policy === 'truncamento_2dec') {
    const truncated = Math.floor(value * 100) / 100;
    return {
      rounded: truncated,
      policyText: 'Truncamento matemático em 2 casas decimais (descarte sem incremento)',
    };
  }
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return {
    rounded,
    policyText: 'Arredondamento padrão fiscal (meio para cima em 2 casas decimais)',
  };
}

/**
 * MOTOR DE CÁLCULO GERAL (ORQUESTRAÇÃO: INSS -> IRRF -> PENSÃO - FASE 4)
 */
export function executePensionCalculation(
  identification: IdentificationData,
  earnings: EarningItem[],
  deductions: DeductionItem[],
  rule: PensionRuleConfig,
  irrfConfig: IrrfDeductionsConfig
): CalculationResultData {
  const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

  const buildProportionalInssEarnings = (
    sourceEarnings: EarningItem[],
    ratio: number,
    targetBase: number,
    competenciaRotulo: string,
    diasNoMes: number,
    totalDias: number,
    remuneracaoTrabalhadaMes: number = 0
  ): EarningItem[] => {
    const inssItems = sourceEarnings.filter((e) => e.incideInss === true && e.value > 0);
    const nonInssItems = sourceEarnings.filter((e) => !(e.incideInss === true && e.value > 0));
    let runningSum = 0;
    const scaledInssItems = inssItems.map((item, idx) => {
      const scaledVal =
        idx === inssItems.length - 1
          ? Math.max(0, round2(targetBase - runningSum))
          : round2(item.value * ratio);
      runningSum = round2(runningSum + scaledVal);
      return {
        ...item,
        label: `${item.label} (Proporcional ${competenciaRotulo} · ${diasNoMes}/${totalDias} dias)`,
        value: scaledVal,
        inssObservation: `Férias partidas: ${diasNoMes} de ${totalDias} dias em ${competenciaRotulo} (${formatPercentage(
          ratio * 100
        )} de ${formatBRL(item.value)})`,
      };
    });

    const extraWorked: EarningItem[] =
      remuneracaoTrabalhadaMes > 0
        ? [
            {
              id: `remuneracao_trabalhada_${competenciaRotulo.replace('/', '_')}`,
              label: `Remuneração Trabalhada (${competenciaRotulo})`,
              value: round2(remuneracaoTrabalhadaMes),
              includedInPensionBase: false,
              incideInss: true,
              incideIrrf: false,
              inssObservation: `Saldo de salário / remuneração trabalhada na competência ${competenciaRotulo}`,
            },
          ]
        : [];

    return [...scaledInssItems, ...extraWorked, ...nonInssItems];
  };

  // ETAPA 1: CÁLCULO DO INSS (MÓDULO INDEPENDENTE FASE 3)
  const inssTable = findInssTable(identification.ano, identification.tipoCalculo);
  let inssResult = null;
  let inssCalculado = 0;
  let inssBaseEfetiva = 0;
  let feriasRateioInss: FeriasRateioInssResumo | undefined = undefined;

  const feriasSplit =
    identification.tipoCalculo === 'ferias'
      ? computeFeriasSplitInfo(identification.dataInicioFerias, identification.diasFerias)
      : null;

  const isFeriasPartidasRateio = Boolean(
    identification.tipoCalculo === 'ferias' &&
      feriasSplit?.isValid &&
      feriasSplit.spansTwoMonths &&
      identification.ativarRateioInssFerias !== false
  );

  if (isFeriasPartidasRateio && feriasSplit) {
    const inssTableMes1 = findInssTable(feriasSplit.mes1Ano, 'ferias') || inssTable;
    if (inssTableMes1) {
      const inssIntegralRef = calculateInss(
        feriasSplit.mes1Ano,
        feriasSplit.mes1Nome,
        'ferias',
        earnings,
        inssTableMes1,
        rule.roundingPolicy || 'padrao_2dec'
      );

      const baseInssTotalFerias = inssIntegralRef.baseInssOriginal;
      const baseInssFeriasMes1 = round2(baseInssTotalFerias * feriasSplit.proporcaoMes1);
      const remuneracaoMes1 = Math.max(0, round2(identification.remuneracaoTrabalhadaMes1Ferias || 0));

      const earningsInssMes1 = buildProportionalInssEarnings(
        earnings,
        feriasSplit.proporcaoMes1,
        baseInssFeriasMes1,
        feriasSplit.mes1Rotulo,
        feriasSplit.diasMes1,
        feriasSplit.totalDias,
        remuneracaoMes1
      );

      inssResult = calculateInss(
        feriasSplit.mes1Ano,
        feriasSplit.mes1Nome,
        'ferias',
        earningsInssMes1,
        inssTableMes1,
        rule.roundingPolicy || 'padrao_2dec'
      );

      inssCalculado = inssResult.valorInssFinal;
      inssBaseEfetiva = inssResult.baseInssEfetiva;

      // Recálculo de INSS na folha seguinte (Competência 2)
      const baseInssFeriasMes2 = round2(baseInssTotalFerias - baseInssFeriasMes1);
      const remuneracaoMes2 = Math.max(0, round2(identification.remuneracaoTrabalhadaMes2Ferias || 0));
      const officialMes2Table = findInssTable(feriasSplit.mes2Ano, 'folha_mensal');
      const latestFallbackTable =
        [...OFFICIAL_INSS_TABLES].sort((a, b) => b.ano - a.ano)[0] || inssTableMes1;
      const mes2Table = officialMes2Table || latestFallbackTable;
      const tabelaMes2Provisoria = !officialMes2Table;

      const earningsInssMes2 = buildProportionalInssEarnings(
        earnings,
        feriasSplit.proporcaoMes2,
        baseInssFeriasMes2,
        feriasSplit.mes2Rotulo,
        feriasSplit.diasMes2,
        feriasSplit.totalDias,
        remuneracaoMes2
      );

      const inssMes2Result = calculateInss(
        feriasSplit.mes2Ano,
        feriasSplit.mes2Nome,
        'folha_mensal',
        earningsInssMes2,
        mes2Table,
        rule.roundingPolicy || 'padrao_2dec'
      );

      const tabelaMes2Observacao = tabelaMes2Provisoria
        ? `Tabela RGPS ${mes2Table.ano} aplicada em caráter provisório para ${feriasSplit.mes2Rotulo} (portaria oficial de ${feriasSplit.mes2Ano} ainda não publicada)`
        : `Tabela oficial RGPS ${mes2Table.ano} aplicada para ${feriasSplit.mes2Rotulo}`;

      const diferencaInssReciboVsCheio = round2(inssIntegralRef.valorInssFinal - inssCalculado);
      const inssTotalCombinadoDoisMeses = round2(inssCalculado + inssMes2Result.valorInssFinal);

      const notaImpactoPensao =
        rule.baseType === 'apos_inss' || rule.baseType === 'apos_inss_irrf' || rule.baseType === 'liquida'
          ? `No recibo de férias, o IRRF e a Pensão consideram exclusivamente o INSS proporcional de ${feriasSplit.mes1Rotulo} (${formatBRL(inssCalculado)}). Na folha de ${feriasSplit.mes2Rotulo}, o INSS será recalculado sobre a fração restante das férias (${formatBRL(baseInssFeriasMes2)}) somada aos dias trabalhados no mês (${formatBRL(remuneracaoMes2)}).`
          : `No recibo de férias, o INSS retido corresponde apenas à proporção de ${feriasSplit.mes1Rotulo} (${formatBRL(inssCalculado)}), e o restante será recalculado na competência ${feriasSplit.mes2Rotulo}.`;

      feriasRateioInss = {
        ativo: true,
        dataInicio: feriasSplit.dataInicioBr,
        dataFim: feriasSplit.dataFimBr,
        totalDiasFerias: feriasSplit.totalDias,
        competencia1Rotulo: feriasSplit.mes1Rotulo,
        competencia1Nome: feriasSplit.mes1Nome,
        diasMes1: feriasSplit.diasMes1,
        proporcaoMes1: feriasSplit.proporcaoMes1,
        competencia2Rotulo: feriasSplit.mes2Rotulo,
        competencia2Nome: feriasSplit.mes2Nome,
        diasMes2: feriasSplit.diasMes2,
        proporcaoMes2: feriasSplit.proporcaoMes2,
        baseInssTotalFerias,
        inssIntegralReferencia: inssIntegralRef.valorInssFinal,
        baseInssFeriasMes1,
        remuneracaoTrabalhadaMes1: remuneracaoMes1,
        baseTotalInssMes1: inssResult.baseInssEfetiva,
        inssNoReciboMes1: inssCalculado,
        tabelaMes1Ano: inssTableMes1.ano,
        baseInssFeriasMes2,
        remuneracaoTrabalhadaMes2: remuneracaoMes2,
        baseTotalInssMes2: inssMes2Result.baseInssEfetiva,
        inssRecalculadoMes2: inssMes2Result.valorInssFinal,
        tetoAplicadoMes2: inssMes2Result.tetoAplicado,
        faixasMes2: inssMes2Result.faixasCalculadas,
        tabelaMes2Ano: mes2Table.ano,
        tabelaMes2Provisoria,
        tabelaMes2Observacao,
        diferencaInssReciboVsCheio,
        inssTotalCombinadoDoisMeses,
        notaImpactoPensao,
      };

      // Anota na memória do INSS o critério de Férias Partidas
      inssResult.memorySteps.unshift({
        stepNumber: 0,
        title: `Rateio por Competência — Férias Partidas (${feriasSplit.mes1Rotulo} e ${feriasSplit.mes2Rotulo})`,
        description: `Férias de ${feriasSplit.dataInicioBr} a ${feriasSplit.dataFimBr} (${feriasSplit.totalDias} dias). No recibo é cobrado apenas o INSS proporcional a ${feriasSplit.mes1Rotulo} (${feriasSplit.diasMes1}/${feriasSplit.totalDias} dias), sendo o saldo recalculado na folha de ${feriasSplit.mes2Rotulo}.`,
        details: [
          {
            label: `Base INSS Total das Férias (100%)`,
            value: formatBRL(baseInssTotalFerias),
            extra: `INSS caso fosse integral no recibo: ${formatBRL(inssIntegralRef.valorInssFinal)}`,
          },
          {
            label: `Fração ${feriasSplit.mes1Rotulo} (${feriasSplit.diasMes1}/${feriasSplit.totalDias} dias · ${formatPercentage(feriasSplit.proporcaoMes1 * 100)})`,
            value: formatBRL(baseInssFeriasMes1),
            extra: `INSS no Recibo: ${formatBRL(inssCalculado)}`,
          },
          {
            label: `Fração ${feriasSplit.mes2Rotulo} (${feriasSplit.diasMes2}/${feriasSplit.totalDias} dias · ${formatPercentage(feriasSplit.proporcaoMes2 * 100)})`,
            value: formatBRL(baseInssFeriasMes2),
            extra: `Base na folha ${feriasSplit.mes2Rotulo} c/ trabalhados (${formatBRL(remuneracaoMes2)}): ${formatBRL(inssMes2Result.baseInssEfetiva)} → INSS recalculado: ${formatBRL(inssMes2Result.valorInssFinal)}`,
          },
        ],
        resultHighlight: `INSS no Recibo (${feriasSplit.mes1Rotulo}): ${formatBRL(inssCalculado)} | Recálculo ${feriasSplit.mes2Rotulo}: ${formatBRL(inssMes2Result.valorInssFinal)}`,
      });
    }
  } else if (inssTable) {
    inssResult = calculateInss(
      identification.ano,
      identification.competencia,
      identification.tipoCalculo,
      earnings,
      inssTable,
      rule.roundingPolicy || 'padrao_2dec'
    );
    inssCalculado = inssResult.valorInssFinal;
    inssBaseEfetiva = inssResult.baseInssEfetiva;
  }

  const inssDisponivelParaIrrf = inssCalculado;

  // ETAPA 2: ORQUESTRAÇÃO DE CÁLCULO ENTRE IRRF E PENSÃO (SEÇÕES 18, 19 E 20)
  const irrfTable = findIrrfTable(identification.ano, identification.tipoCalculo);

  const totalProventos = earnings.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const verbasConsideradasNaBase = earnings.filter((e) => e.includedInPensionBase && e.value > 0);
  const verbasExcluidasDaBase = earnings.filter((e) => !e.includedInPensionBase && e.value > 0);
  const somaProventosBase = verbasConsideradasNaBase.reduce((acc, curr) => acc + curr.value, 0);
  const somaExclusoes = verbasExcluidasDaBase.reduce((acc, curr) => acc + curr.value, 0);

  const isSplitBeneficiaries = Boolean(
    rule.rateioBeneficiariosAtivo && rule.beneficiarios && rule.beneficiarios.length > 0
  );
  const totalSplitPercentage = isSplitBeneficiaries
    ? round2((rule.beneficiarios || []).reduce((acc, b) => acc + (b.percentual || 0), 0))
    : rule.percentage;
  const totalSplitFixedValue = isSplitBeneficiaries
    ? round2((rule.beneficiarios || []).reduce((acc, b) => acc + (b.valorFixo || 0), 0))
    : rule.fixedValue;
  const totalSplitAdditionalValue = isSplitBeneficiaries
    ? round2((rule.beneficiarios || []).reduce((acc, b) => acc + (b.valorFixo || 0), 0))
    : rule.additionalValue || 0;

  const effectiveRulePercentage = isSplitBeneficiaries ? totalSplitPercentage : rule.percentage;
  const effectiveRuleFixedValue = isSplitBeneficiaries ? totalSplitFixedValue : rule.fixedValue;
  const effectiveRuleAdditionalValue = isSplitBeneficiaries ? totalSplitAdditionalValue : (rule.additionalValue || 0);

  // Helper para calcular o valor da pensão dada uma dedução de IRRF e INSS
  const computePensionValue = (deducaoInssParaPensao: number, deducaoIrrfParaPensao: number) => {
    const deducoesParaBase = deductions
      .filter((d) => d.deductFromPensionBase)
      .map((d) => {
        if (d.id === 'inss') return { ...d, value: deducaoInssParaPensao };
        if (d.id === 'irrf') return { ...d, value: deducaoIrrfParaPensao };
        return d;
      });

    // Se a regra for explicitamente após INSS ou após INSS e IRRF, assegura inclusão
    let somaDeducoesBase = deducoesParaBase.reduce((acc, curr) => acc + (curr.value || 0), 0);
    if (rule.baseType === 'apos_inss' && !deducoesParaBase.some((d) => d.id === 'inss')) {
      somaDeducoesBase += deducaoInssParaPensao;
    }
    if (rule.baseType === 'apos_inss_irrf') {
      if (!deducoesParaBase.some((d) => d.id === 'inss')) somaDeducoesBase += deducaoInssParaPensao;
      if (!deducoesParaBase.some((d) => d.id === 'irrf')) somaDeducoesBase += deducaoIrrfParaPensao;
    }

    const basePensao = round2(Math.max(0, somaProventosBase - somaDeducoesBase));
    const policy = rule.roundingPolicy || 'padrao_2dec';

    let valorAntesArred = 0;
    let valFinal = 0;
    let valorCalculoUnicoRef = 0;
    let beneficiariesCalc: PensionBeneficiaryResultItem[] = [];

    if (isSplitBeneficiaries && rule.beneficiarios) {
      // Cálculo separado por filho: multiplica exclusivamente pelo percentual de cada filho e soma os valores apurados
      beneficiariesCalc = rule.beneficiarios.map((b, idx) => {
        const pct = b.percentual || 0;
        const fixo = b.valorFixo || 0;
        let rawShare = 0;
        if (rule.ruleType === 'percentual') {
          rawShare = basePensao * (pct / 100);
        } else if (rule.ruleType === 'valor_fixo') {
          rawShare = fixo;
        } else {
          rawShare = basePensao * (pct / 100) + fixo;
        }
        const { rounded: roundedShare } = applyRounding(rawShare, policy);
        return {
          id: b.id,
          label: b.label?.trim() || `Beneficiário ${idx + 1}`,
          percentual: rule.ruleType !== 'valor_fixo' ? pct : undefined,
          valorFixo: rule.ruleType !== 'percentual' ? fixo : undefined,
          baseAplicada: basePensao,
          valorAntesArredondamento: rawShare,
          valorCalculado: roundedShare,
        };
      });

      valorAntesArred = beneficiariesCalc.reduce((acc, item) => acc + item.valorAntesArredondamento, 0);
      valFinal = round2(beneficiariesCalc.reduce((acc, item) => acc + item.valorCalculado, 0));

      if (rule.hasMinimum && rule.minimumValue > 0 && valFinal < rule.minimumValue) {
        valFinal = rule.minimumValue;
      }
      if (rule.hasMaximum && rule.maximumValue > 0 && valFinal > rule.maximumValue) {
        valFinal = rule.maximumValue;
      }
      valorCalculoUnicoRef = valFinal;
    } else {
      // Regra para beneficiário único (sem rateio)
      if (rule.ruleType === 'percentual') {
        valorAntesArred = basePensao * (effectiveRulePercentage / 100);
      } else if (rule.ruleType === 'valor_fixo') {
        valorAntesArred = effectiveRuleFixedValue;
      } else if (rule.ruleType === 'percentual_adicional') {
        valorAntesArred = basePensao * (effectiveRulePercentage / 100) + effectiveRuleAdditionalValue;
      }
      const { rounded: valorUnicoRounded } = applyRounding(valorAntesArred, policy);
      valFinal = valorUnicoRounded;
      if (rule.hasMinimum && rule.minimumValue > 0 && valFinal < rule.minimumValue) {
        valFinal = rule.minimumValue;
      }
      if (rule.hasMaximum && rule.maximumValue > 0 && valFinal > rule.maximumValue) {
        valFinal = rule.maximumValue;
      }
      valorCalculoUnicoRef = valFinal;
    }

    return {
      basePensao,
      valorAntesArred,
      valFinal,
      somaDeducoesBase,
      beneficiariesCalc,
      valorCalculoUnicoRef,
    };
  };

  // Avaliação de dependência circular
  const pensaoDeduzIrrf =
    rule.baseType === 'apos_inss_irrf' ||
    rule.baseType === 'liquida' ||
    deductions.some((d) => (d.id === 'irrf' || d.id.includes('irrf')) && d.deductFromPensionBase);
  const irrfDeduzPensao = irrfConfig.deduzirPensao && irrfConfig.usarPensaoCalculadaPeloMotor !== false;

  let irrfCalculado = 0;
  let irrfBaseEfetiva = 0;
  let irrfResult = null;

  let basePensaoFinal = 0;
  let valorAntesArredondamentoPensao = 0;
  let valorPensaoFinal = 0;
  let somaDeducoesBasePensao = 0;
  let resolucaoSimultaneaAplicada = false;
  let beneficiariesCalcFinal: PensionBeneficiaryResultItem[] = [];
  let valorCalculoUnicoRefFinal = 0;

  if (pensaoDeduzIrrf && irrfDeduzPensao) {
    // Caso de Dependência Circular Resolvida pelo Operador (Seção 20)
    if (irrfConfig.ordemCalculoCircular === 'pensao_antes_irrf') {
      // 1. Pensão apurada primeiro (sem abater IRRF)
      const p1 = computePensionValue(inssCalculado, 0);
      basePensaoFinal = p1.basePensao;
      valorAntesArredondamentoPensao = p1.valorAntesArred;
      valorPensaoFinal = p1.valFinal;
      somaDeducoesBasePensao = p1.somaDeducoesBase;
      beneficiariesCalcFinal = p1.beneficiariesCalc;
      valorCalculoUnicoRefFinal = p1.valorCalculoUnicoRef;

      // 2. IRRF calculado abatendo a pensão apurada
      if (irrfTable) {
        irrfResult = calculateIrrf(
          identification.ano,
          identification.competencia,
          identification.tipoCalculo,
          earnings,
          irrfTable,
          irrfConfig,
          inssCalculado,
          valorPensaoFinal,
          rule.roundingPolicy || 'padrao_2dec'
        );
        irrfCalculado = irrfResult.valorIrrfFinal;
        irrfBaseEfetiva = irrfResult.baseIrrf;
      }
    } else if (irrfConfig.ordemCalculoCircular === 'irrf_antes_pensao') {
      // 'irrf_antes_pensao':
      // 1. IRRF apurado primeiro (sem abater pensão)
      if (irrfTable) {
        irrfResult = calculateIrrf(
          identification.ano,
          identification.competencia,
          identification.tipoCalculo,
          earnings,
          irrfTable,
          { ...irrfConfig, deduzirPensao: false },
          inssCalculado,
          0,
          rule.roundingPolicy || 'padrao_2dec'
        );
        irrfCalculado = irrfResult.valorIrrfFinal;
        irrfBaseEfetiva = irrfResult.baseIrrf;
      }

      // 2. Pensão apurada abatendo o IRRF calculado
      const p2 = computePensionValue(inssCalculado, irrfCalculado);
      basePensaoFinal = p2.basePensao;
      valorAntesArredondamentoPensao = p2.valorAntesArred;
      valorPensaoFinal = p2.valFinal;
      somaDeducoesBasePensao = p2.somaDeducoesBase;
      beneficiariesCalcFinal = p2.beneficiariesCalc;
      valorCalculoUnicoRefFinal = p2.valorCalculoUnicoRef;
    } else {
      // 'simultaneo_algebrico' (PADRÃO OFICIAL / RECOMENDADO):
      resolucaoSimultaneaAplicada = true;

      if (rule.ruleType === 'valor_fixo') {
        const pFixo = computePensionValue(inssCalculado, 0);
        basePensaoFinal = pFixo.basePensao;
        valorAntesArredondamentoPensao = pFixo.valorAntesArred;
        valorPensaoFinal = pFixo.valFinal;
        somaDeducoesBasePensao = pFixo.somaDeducoesBase;
        beneficiariesCalcFinal = pFixo.beneficiariesCalc;
        valorCalculoUnicoRefFinal = pFixo.valorCalculoUnicoRef;

        if (irrfTable) {
          irrfResult = calculateIrrf(
            identification.ano,
            identification.competencia,
            identification.tipoCalculo,
            earnings,
            irrfTable,
            irrfConfig,
            inssCalculado,
            valorPensaoFinal,
            rule.roundingPolicy || 'padrao_2dec'
          );
          irrfCalculado = irrfResult.valorIrrfFinal;
          irrfBaseEfetiva = irrfResult.baseIrrf;
        }
      } else {
        const verbasTributaveisIRRF = earnings
          .filter((e) => e.incideIrrf === true && e.value > 0)
          .reduce((acc, curr) => acc + curr.value, 0);
        const dedInssIRRF = irrfConfig.deduzirInss ? inssCalculado : 0;
        const qtdDep = irrfConfig.deduzirDependentes ? Math.max(0, irrfConfig.quantidadeDependentes || 0) : 0;
        const valorDep = irrfTable?.deducaoPorDependente || 0;
        const dedDepIRRF = qtdDep * valorDep;
        const dedOutrasIRRF = irrfConfig.deduzirOutras ? Math.max(0, irrfConfig.outrasDeducoesValor || 0) : 0;
        const baseIrrfSemPensao = Math.max(0, verbasTributaveisIRRF - (dedInssIRRF + dedDepIRRF + dedOutrasIRRF));

        const pSemIrrf = computePensionValue(inssCalculado, 0);
        const basePensaoSemIrrf = pSemIrrf.basePensao;

        const k = effectiveRulePercentage / 100;
        const addVal = rule.ruleType === 'percentual_adicional' ? effectiveRuleAdditionalValue : 0;

        let redutorValor = 0;
        if (irrfTable?.redutorAdicional?.ativo) {
          const red = irrfTable.redutorAdicional;
          if (verbasTributaveisIRRF <= red.limiteIsencaoTotal) {
            redutorValor = red.valorReducaoFixa;
          } else if (verbasTributaveisIRRF <= red.limiteReducaoGradual) {
            redutorValor = Math.max(0, red.constanteFormula - (red.fatorFormula * verbasTributaveisIRRF));
          }
        }

        let pAlgebrico = (basePensaoSemIrrf * k + addVal);
        if (irrfTable) {
          for (const faixa of irrfTable.faixas) {
            const aliquota = (faixa.aliquota || 0) / 100;
            const parcela = faixa.parcelaADeduzir || 0;
            const denominador = 1 - (k * aliquota);
            if (denominador <= 0) continue;

            const irrfZero = Math.max(0, baseIrrfSemPensao * aliquota - parcela - redutorValor);
            const pCand = (k * (basePensaoSemIrrf - irrfZero) + addVal) / denominador;
            const baseIrrfCand = baseIrrfSemPensao - pCand;

            const limiteMin = faixa.faixaInicial - 0.05;
            const limiteMax = (faixa.faixaFinal === Infinity || faixa.faixaFinal <= 0) ? Infinity : faixa.faixaFinal + 0.05;

            if (baseIrrfCand >= limiteMin && baseIrrfCand <= limiteMax) {
              pAlgebrico = pCand;
              break;
            }
          }
        }

        let pIter = pAlgebrico;
        for (let i = 0; i < 20; i++) {
          const irrfTemp = calculateIrrf(
            identification.ano,
            identification.competencia,
            identification.tipoCalculo,
            earnings,
            irrfTable!,
            irrfConfig,
            inssCalculado,
            pIter,
            rule.roundingPolicy || 'padrao_2dec'
          );
          const pTemp = computePensionValue(inssCalculado, irrfTemp.valorIrrfFinal);
          if (Math.abs(pTemp.valorAntesArred - pIter) < 0.0001) {
            pIter = pTemp.valorAntesArred;
            break;
          }
          pIter = pTemp.valorAntesArred;
        }

        let pAjustado: number;
        if (isSplitBeneficiaries) {
          const irrfCandidate = irrfTable
            ? calculateIrrf(
                identification.ano,
                identification.competencia,
                identification.tipoCalculo,
                earnings,
                irrfTable,
                irrfConfig,
                inssCalculado,
                applyRounding(pIter, rule.roundingPolicy || 'padrao_2dec').rounded,
                rule.roundingPolicy || 'padrao_2dec'
              )
            : null;
          pAjustado = computePensionValue(inssCalculado, irrfCandidate?.valorIrrfFinal || 0).valFinal;
          for (let kIter = 0; kIter < 5; kIter++) {
            const irrfCheck = irrfTable
              ? calculateIrrf(
                  identification.ano,
                  identification.competencia,
                  identification.tipoCalculo,
                  earnings,
                  irrfTable,
                  irrfConfig,
                  inssCalculado,
                  pAjustado,
                  rule.roundingPolicy || 'padrao_2dec'
                )
              : null;
            const pCheck = computePensionValue(inssCalculado, irrfCheck?.valorIrrfFinal || 0).valFinal;
            if (Math.abs(pCheck - pAjustado) < 0.001) break;
            pAjustado = pCheck;
          }
        } else {
          const { rounded: pFinal } = applyRounding(pIter, rule.roundingPolicy || 'padrao_2dec');
          pAjustado = pFinal;
          if (rule.hasMinimum && rule.minimumValue > 0 && pAjustado < rule.minimumValue) {
            pAjustado = rule.minimumValue;
          }
          if (rule.hasMaximum && rule.maximumValue > 0 && pAjustado > rule.maximumValue) {
            pAjustado = rule.maximumValue;
          }
        }

        if (irrfTable) {
          irrfResult = calculateIrrf(
            identification.ano,
            identification.competencia,
            identification.tipoCalculo,
            earnings,
            irrfTable,
            irrfConfig,
            inssCalculado,
            pAjustado,
            rule.roundingPolicy || 'padrao_2dec'
          );
          irrfCalculado = irrfResult.valorIrrfFinal;
          irrfBaseEfetiva = irrfResult.baseIrrf;
        }

        const pFinalRes = computePensionValue(inssCalculado, irrfCalculado);
        basePensaoFinal = pFinalRes.basePensao;
        valorAntesArredondamentoPensao = pFinalRes.valorAntesArred;
        valorPensaoFinal = pFinalRes.valFinal;
        somaDeducoesBasePensao = pFinalRes.somaDeducoesBase;
        beneficiariesCalcFinal = pFinalRes.beneficiariesCalc;
        valorCalculoUnicoRefFinal = pFinalRes.valorCalculoUnicoRef;
      }
    }
  } else if (irrfDeduzPensao) {
    // IRRF deduz pensão, mas pensão não deduz IRRF
    const p = computePensionValue(inssCalculado, 0);
    basePensaoFinal = p.basePensao;
    valorAntesArredondamentoPensao = p.valorAntesArred;
    valorPensaoFinal = p.valFinal;
    somaDeducoesBasePensao = p.somaDeducoesBase;
    beneficiariesCalcFinal = p.beneficiariesCalc;
    valorCalculoUnicoRefFinal = p.valorCalculoUnicoRef;

    if (irrfTable) {
      irrfResult = calculateIrrf(
        identification.ano,
        identification.competencia,
        identification.tipoCalculo,
        earnings,
        irrfTable,
        irrfConfig,
        inssCalculado,
        valorPensaoFinal,
        rule.roundingPolicy || 'padrao_2dec'
      );
      irrfCalculado = irrfResult.valorIrrfFinal;
      irrfBaseEfetiva = irrfResult.baseIrrf;
    }
  } else {
    // Fluxo padrão: IRRF calculado com INSS e dependentes -> Pensão calculada com INSS e IRRF (se aplicável)
    if (irrfTable) {
      irrfResult = calculateIrrf(
        identification.ano,
        identification.competencia,
        identification.tipoCalculo,
        earnings,
        irrfTable,
        irrfConfig,
        inssCalculado,
        0,
        rule.roundingPolicy || 'padrao_2dec'
      );
      irrfCalculado = irrfResult.valorIrrfFinal;
      irrfBaseEfetiva = irrfResult.baseIrrf;
    }

    const p = computePensionValue(inssCalculado, irrfCalculado);
    basePensaoFinal = p.basePensao;
    valorAntesArredondamentoPensao = p.valorAntesArred;
    valorPensaoFinal = p.valFinal;
    somaDeducoesBasePensao = p.somaDeducoesBase;
    beneficiariesCalcFinal = p.beneficiariesCalc;
    valorCalculoUnicoRefFinal = p.valorCalculoUnicoRef;
  }

  // ETAPA 3: ATUALIZAR DEDUÇÕES DA FOLHA COM VALORES OFICIAIS
  const updatedDeductions = deductions.map((d) => {
    if (d.id === 'inss') {
      return { ...d, value: inssCalculado, observation: 'Apurado pelo motor oficial de INSS (Fase 3)' };
    }
    if (d.id === 'irrf') {
      return { ...d, value: irrfCalculado, observation: 'Apurado pelo motor oficial de IRRF (Fase 4)' };
    }
    return d;
  });

  const outrosDescontosItems = updatedDeductions.filter((d) => d.id !== 'inss' && d.id !== 'irrf');
  const outrosDescontosQueDeduzemDoLiquido = outrosDescontosItems.filter((d) => d.deduzDoLiquido !== false);
  const valorOutrosDescontosLiquido = outrosDescontosQueDeduzemDoLiquido.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const valorTotalOutrosDescontos = outrosDescontosItems.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const totalDescontosSemPensao = inssCalculado + irrfCalculado + valorOutrosDescontosLiquido;
  const totalDescontosComPensao = totalDescontosSemPensao + valorPensaoFinal;
  const liquidoAposPensao = totalProventos - totalDescontosComPensao;

  // Composição dos Proventos (Seção 8 - Fase 5)
  const compSalario = earnings.filter((e) => e.categoria === 'salario' || e.id === 'salario').reduce((acc, curr) => acc + (curr.value || 0), 0);
  const compHorasExtras = earnings.filter((e) => e.categoria === 'hora_extra' || e.id.includes('hora_extra')).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const compAdicionais = earnings.filter((e) => e.categoria === 'adicional' || e.id.includes('adicional') || e.id.includes('insalubridade') || e.id.includes('periculosidade')).reduce((acc, curr) => acc + (curr.value || 0), 0);
  const compOutras = earnings.filter((e) => {
    const isSal = e.categoria === 'salario' || e.id === 'salario';
    const isHe = e.categoria === 'hora_extra' || e.id.includes('hora_extra');
    const isAdic = e.categoria === 'adicional' || e.id.includes('adicional') || e.id.includes('insalubridade') || e.id.includes('periculosidade');
    return !isSal && !isHe && !isAdic;
  }).reduce((acc, curr) => acc + (curr.value || 0), 0);

  const composicaoProventos: ProventosComposicao = {
    salario: compSalario,
    horasExtras: compHorasExtras,
    adicionais: compAdicionais,
    outras: compOutras,
    total: totalProventos,
  };

  // Rateio por beneficiário (cálculo separado -> evento único consolidado na folha)
  let rateioBeneficiarios: PensionBeneficiarySplitResumo | undefined = undefined;
  if (isSplitBeneficiaries && beneficiariesCalcFinal.length > 0) {
    rateioBeneficiarios = {
      ativo: true,
      eventoUnicoFolha: rule.eventoUnicoFolha !== false,
      rotuloEventoFolha:
        rule.ruleType === 'valor_fixo'
          ? `Pensão Alimentícia — Evento Único (${formatBRL(valorPensaoFinal)})`
          : `Pensão Alimentícia — Evento Único (Soma: ${formatPercentage(effectiveRulePercentage)})`,
      quantidadeBeneficiarios: beneficiariesCalcFinal.length,
      somaPercentuais: rule.ruleType !== 'valor_fixo' ? effectiveRulePercentage : undefined,
      somaValoresFixos: rule.ruleType !== 'percentual' ? effectiveRuleFixedValue : undefined,
      beneficiarios: beneficiariesCalcFinal,
      somaAntesArredondamento: valorAntesArredondamentoPensao,
      totalConsolidadoFolha: valorPensaoFinal,
      valorCalculoUnicoReferencia: valorPensaoFinal,
      diferencaArredondamento: 0,
    };
  }

  const buildSplitFormula = (prefixSimultaneo?: string) => {
    if (!rateioBeneficiarios?.ativo) return '';
    const linhasCotas = rateioBeneficiarios.beneficiarios.map((b) => {
      if (rule.ruleType === 'percentual') {
        return `${b.label} = ${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual || 0)} = ${formatBRL(b.valorCalculado)}`;
      }
      if (rule.ruleType === 'valor_fixo') {
        return `${b.label} = ${formatBRL(b.valorCalculado)}`;
      }
      return `${b.label} = (${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual || 0)}) + ${formatBRL(b.valorFixo || 0)} = ${formatBRL(b.valorCalculado)}`;
    });
    const somaRotulo =
      rateioBeneficiarios.somaPercentuais !== undefined
        ? `EVENTO ÚNICO (Soma: ${formatPercentage(rateioBeneficiarios.somaPercentuais)})`
        : 'EVENTO ÚNICO';
    const linhaSoma = `${somaRotulo} = ${rateioBeneficiarios.beneficiarios
      .map((b) => formatBRL(b.valorCalculado))
      .join(' + ')} = ${formatBRL(rateioBeneficiarios.totalConsolidadoFolha)}`;

    const deducoesDetalhadas: string[] = [];
    const inssNaBase = updatedDeductions.find((d) => d.id === 'inss' && d.deductFromPensionBase);
    const irrfNaBase = updatedDeductions.find((d) => d.id === 'irrf' && d.deductFromPensionBase);
    if (inssNaBase || rule.baseType === 'apos_inss' || rule.baseType === 'apos_inss_irrf') {
      deducoesDetalhadas.push(`${formatBRL(inssCalculado)} (INSS)`);
    }
    if (irrfNaBase || rule.baseType === 'apos_inss_irrf') {
      deducoesDetalhadas.push(`${formatBRL(irrfCalculado)} (IRRF)`);
    }
    updatedDeductions
      .filter((d) => d.deductFromPensionBase && d.id !== 'inss' && d.id !== 'irrf' && d.value > 0)
      .forEach((d) => deducoesDetalhadas.push(`${formatBRL(d.value)} (${d.label})`));

    const textoDeducoes =
      deducoesDetalhadas.length > 0 ? deducoesDetalhadas.join(' - ') : formatBRL(somaDeducoesBasePensao);

    return `${prefixSimultaneo ? `${prefixSimultaneo}\n` : ''}BASE DA PENSÃO = ${formatBRL(somaProventosBase)} - ${textoDeducoes} = ${formatBRL(basePensaoFinal)}\n${linhasCotas.join('\n')}\n${linhaSoma}`;
  };

  // Parâmetros de texto da pensão
  let regraTexto = '';
  if (rule.ruleType === 'percentual') {
    regraTexto = `${formatPercentage(effectiveRulePercentage)}`;
  } else if (rule.ruleType === 'valor_fixo') {
    regraTexto = formatBRL(effectiveRuleFixedValue);
  } else {
    regraTexto = `${formatPercentage(effectiveRulePercentage)} + ${formatBRL(effectiveRuleAdditionalValue)}`;
  }
  if (rateioBeneficiarios?.ativo) {
    const cotasResumo =
      rule.ruleType === 'valor_fixo'
        ? beneficiariesCalcFinal.map((b) => `${b.label}: ${formatBRL(b.valorFixo || 0)}`).join(' + ')
        : beneficiariesCalcFinal.map((b) => `${b.label}: ${formatPercentage(b.percentual || 0)}`).join(' + ');
    regraTexto = `${cotasResumo} (Soma: ${
      rule.ruleType === 'valor_fixo' ? formatBRL(valorPensaoFinal) : formatPercentage(effectiveRulePercentage)
    } · Evento único)`;
  }

  const { policyText: regraArredondamento } = applyRounding(
    valorAntesArredondamentoPensao,
    rule.roundingPolicy || 'padrao_2dec'
  );

  const minimoAplicado = Boolean(rule.hasMinimum && rule.minimumValue > 0 && valorPensaoFinal === rule.minimumValue);
  const tetoAplicado = Boolean(rule.hasMaximum && rule.maximumValue > 0 && valorPensaoFinal === rule.maximumValue);

  // RESUMO DOS ENCARGOS (Seção 22 - Fase 4 / Seção 16 - Fase 5)
  const resumoEncargos: ResumoEncargos = {
    baseInss: inssBaseEfetiva,
    valorInss: inssCalculado,
    inssStatus: identification.tipoCalculo === 'plr' ? 'isento' : 'calculado',
    baseIrrf: irrfBaseEfetiva,
    valorIrrf: irrfCalculado,
    irrfStatus: irrfCalculado === 0 && irrfBaseEfetiva <= (irrfTable?.faixas[0]?.faixaFinal || 0) ? 'isento' : 'calculado',
    basePensao: basePensaoFinal,
    valorPensao: valorPensaoFinal,
    totalEncargos: inssCalculado + irrfCalculado + valorPensaoFinal,
    liquidoFinal: liquidoAposPensao,
  };

  // Identificação e consolidação dos dados de Rescisão (Fase 8)
  const isRescisao = identification.tipoCalculo === 'rescisao';
  let rescisaoResumo: RescisaoResumo | undefined = undefined;

  if (isRescisao) {
    const findVerba = (idSubstring: string, labelRegex: RegExp) => {
      const match = earnings.find(
        (e) => e.id.toLowerCase().includes(idSubstring) || labelRegex.test(e.label.toLowerCase())
      );
      return match ? match.value : 0;
    };

    const saldoSalario = findVerba('saldo_salario', /saldo.*sal[aá]rio/i);
    const avisoPrevio = findVerba('aviso_previo', /aviso.*pr[eé]vio/i);
    const feriasVencidas = findVerba('ferias_vencidas', /f[eé]rias.*vencidas/i);
    const feriasProporcionais = findVerba('ferias_proporcionais', /f[eé]rias.*proporcionais/i);
    const umTercoFerias = findVerba('um_terco', /1\/3|ter[cç]o/i);
    const decimoProporcional = findVerba('decimo_proporcional', /13.*proporcional|d[eé]cimo.*proporcional/i);

    const mainIds = ['saldo_salario', 'aviso_previo', 'ferias_vencidas', 'ferias_proporcionais', 'um_terco', 'decimo_proporcional'];
    const outrasVerbas = earnings
      .filter(
        (e) =>
          !mainIds.some((mid) => e.id.toLowerCase().includes(mid)) &&
          !/saldo.*sal[aá]rio|aviso.*pr[eé]vio|f[eé]rias|1\/3|ter[cç]o|13.*proporcional/i.test(e.label)
      )
      .reduce((acc, curr) => acc + (curr.value || 0), 0);

    const pensaoInformada =
      identification.valorPensaoEsperada && identification.valorPensaoEsperada > 0
        ? identification.valorPensaoEsperada
        : undefined;
    const diferencaPensao = pensaoInformada !== undefined ? valorPensaoFinal - pensaoInformada : undefined;
    const possuiDivergenciaPensao = diferencaPensao !== undefined && Math.abs(diferencaPensao) > 0.01;

    rescisaoResumo = {
      tipoDesligamento: identification.tipoDesligamento || 'dispensa_sem_justa_causa',
      tipoDesligamentoRotulo:
        RESCISAO_DESLIGAMENTO_LABELS[identification.tipoDesligamento || 'dispensa_sem_justa_causa'] ||
        'Dispensa sem Justa Causa',
      dataAdmissao: identification.dataAdmissao,
      dataDesligamento: identification.dataDesligamento,
      dataPagamento: identification.dataPagamento,
      saldoSalario,
      avisoPrevio,
      feriasVencidas,
      feriasProporcionais,
      umTercoFerias,
      decimoProporcional,
      outrasVerbas,
      totalBruto: totalProventos,
      valorInss: inssCalculado,
      baseIrrf: irrfBaseEfetiva,
      valorIrrf: irrfCalculado,
      basePensao: basePensaoFinal,
      valorPensao: valorPensaoFinal,
      outrosDescontos: valorOutrosDescontosLiquido,
      valorLiquido: liquidoAposPensao,
      pensaoInformada,
      diferencaPensao,
      possuiDivergenciaPensao,
    };
  }

  const isPlr = identification.tipoCalculo === 'plr';
  let plrResumo: PlrResumo | undefined = undefined;

  if (isPlr) {
    const tipoCalcPlr = identification.tipoCalculoPlr || 'integral';
    const tipoRotulos: Record<PlrTipoCalculo, string> = {
      integral: 'PLR Integral',
      proporcional: 'PLR Proporcional',
      simulacao: 'Simulação de PLR',
      conferencia: 'Conferência de PLR',
    };
    const numParcelaRotulo = identification.numeroParcelaPlr || 'Parcela Única';
    const valoresPagosAnteriormente = 0;
    const plrParcelaAtual = totalProventos;

    let comparacaoSistema: PlrComparacaoSistema | undefined = undefined;
    if (identification.plrSistemaFolha && identification.plrSistemaFolha.ativo) {
      const s = identification.plrSistemaFolha;
      const difBruta = Math.abs((s.plrBruta || 0) - totalProventos);
      const difInss = Math.abs((s.inss || 0) - inssCalculado);
      const difIrrf = Math.abs((s.irrf || 0) - irrfCalculado);
      const difPensao = Math.abs((s.pensao || 0) - valorPensaoFinal);
      const difLiquido = Math.abs((s.liquido || 0) - liquidoAposPensao);
      const possuiDivergencia =
        difBruta > 0.01 || difInss > 0.01 || difIrrf > 0.01 || difPensao > 0.01 || difLiquido > 0.01;

      const pontosConferencia: string[] = [];
      if (difBruta > 0.01) pontosConferencia.push('Base bruta da PLR e critérios/componentes informados');
      if (difInss > 0.01) pontosConferencia.push('Incidência e alíquotas de INSS');
      if (difIrrf > 0.01) pontosConferencia.push('Enquadramento na tabela exclusiva de PLR (Lei 10.101/2000)');
      if (difPensao > 0.01) pontosConferencia.push('Regra de pensão (geral vs específica), base e deduções');
      if (difLiquido > 0.01) pontosConferencia.push('Outros descontos ou política de arredondamento');

      comparacaoSistema = {
        ativo: true,
        plrBrutaSistema: s.plrBruta || 0,
        inssSistema: s.inss || 0,
        irrfSistema: s.irrf || 0,
        pensaoSistema: s.pensao || 0,
        liquidoSistema: s.liquido || 0,
        diferencas: {
          plrBruta: difBruta,
          inss: difInss,
          irrf: difIrrf,
          pensao: difPensao,
          liquido: difLiquido,
        },
        possuiDivergencia,
        pontosConferencia,
      };
    }

    plrResumo = {
      tipoCalculo: tipoCalcPlr,
      tipoCalculoRotulo: tipoRotulos[tipoCalcPlr] || 'PLR Integral',
      periodoReferencia: identification.periodoReferenciaPlr || 'Exercício Corrente',
      dataPagamento: identification.dataPagamento || 'Não informada',
      numeroParcelaRotulo: numParcelaRotulo,
      regraUtilizada: rule.origemRegraPlr === 'especifica' ? 'Regra Específica de PLR' : 'Regra Geral',
      formaCalculoRotulo: 'Regra Configurada',
      plrBrutaTotal: totalProventos,
      valoresAnteriormentePagos: valoresPagosAnteriormente,
      plrParcelaAtual,
      valorInss: inssCalculado,
      baseIrrf: irrfBaseEfetiva,
      valorIrrf: irrfCalculado,
      basePensao: basePensaoFinal,
      valorPensao: valorPensaoFinal,
      outrosDescontos: valorOutrosDescontosLiquido,
      valorLiquido: liquidoAposPensao,
      comparacaoSistema,
    };
  }

  // MEMÓRIA DE CÁLCULO COMPLETA (Seção 18 da Fase 8 para Rescisão / Seção 17 Fase 5 para Folha)
  const memorySteps: CalculationMemoryStep[] = isRescisao
    ? [
        {
          stepNumber: 1,
          title: 'Etapa 1 — Identificação',
          description: 'Parâmetros oficiais do desligamento, prazos legais e regras cadastradas.',
          details: [
            { label: 'Matrícula', value: identification.matricula || 'Não informada' },
            {
              label: 'Tipo de Desligamento',
              value:
                RESCISAO_DESLIGAMENTO_LABELS[identification.tipoDesligamento || 'dispensa_sem_justa_causa'] ||
                'Não definido',
            },
            { label: 'Data de Admissão', value: identification.dataAdmissao || 'Não informada' },
            { label: 'Data de Desligamento', value: identification.dataDesligamento || 'Não informada' },
            { label: 'Data de Pagamento', value: identification.dataPagamento || 'Não informada' },
            {
              label: 'Aviso-Prévio',
              value:
                identification.tipoAvisoPrevio === 'indenizado'
                  ? 'Indenizado'
                  : identification.tipoAvisoPrevio === 'trabalhado'
                  ? 'Trabalhado'
                  : 'Não aplicável',
            },
            { label: 'Dias de Aviso-Prévio', value: `${identification.diasAvisoPrevio || 30} dias` },
            { label: 'Dias Trabalhados no Mês', value: `${identification.diasTrabalhadosMesRescisao || 0} dias` },
            {
              label: 'Regra de Pensão Utilizada',
              value:
                rule.origemRegraRescisao === 'especifica'
                  ? 'Regra específica para rescisão'
                  : 'Regra geral cadastrada da folha',
            },
            { label: 'Base Escolhida para Pensão', value: rule.baseType },
            { label: 'Alíquota / Valor da Pensão', value: regraTexto },
          ],
          resultHighlight: `Desligamento: ${
            RESCISAO_DESLIGAMENTO_LABELS[identification.tipoDesligamento || 'dispensa_sem_justa_causa'] ||
            'Rescisão contratual'
          }`,
        },
        {
          stepNumber: 2,
          title: 'Etapa 2 — Verbas',
          description:
            'Demonstrativo individualizado de cada verba rescisória apurada, valores e suas incidências independentes.',
          formula: `TOTAL DE PROVENTOS BRUTOS = ${earnings
            .filter((e) => e.value > 0)
            .map((e) => `${e.label} (${formatBRL(e.value)})`)
            .join(' + ')} = ${formatBRL(totalProventos)}`,
          details: earnings.map((v) => ({
            label: `• ${v.label}`,
            value: formatBRL(v.value),
            extra: `INSS: ${v.incideInss ? 'Sim' : 'Não'} | IRRF: ${v.incideIrrf ? 'Sim' : 'Não'} | Pensão: ${
              v.includedInPensionBase ? 'Sim' : 'Não'
            } ${v.observation ? `(${v.observation})` : ''}`,
          })),
          resultHighlight: `Total Bruto da Rescisão: ${formatBRL(totalProventos)}`,
        },
        {
          stepNumber: 3,
          title: 'Etapa 3 — Médias',
          description:
            'Médias rescisórias de horas extras, adicionais e comissões integradas aos proventos rescisórios.',
          details: [
            {
              label: 'Metodologia de Apuração',
              value: 'Apuradas conforme o período aquisitivo/exercício legal e convenção coletiva',
            },
            {
              label: 'Participação na Base de Férias',
              value: 'Médias devidas compõem a remuneração de férias vencidas e proporcionais',
            },
            {
              label: 'Participação no 13º Proporcional',
              value: 'Médias compõem o 13º salário calculado pelo módulo oficial de 13º (Fase 7)',
            },
            {
              label: 'Participação no Aviso-Prévio',
              value: 'Médias habituais integram a base de cálculo do aviso-prévio indenizado',
            },
            {
              label: 'Participação na Pensão Alimentícia',
              value: 'Integradas se configuradas como participantes da base da pensão',
            },
          ],
          resultHighlight: 'Médias rescisórias apuradas e integradas',
        },
        {
          stepNumber: 4,
          title: 'Etapa 4 — INSS (INSS_RESCISAO_CALCULADO)',
          description:
            'Cálculo progressivo oficial de INSS sobre as verbas rescisórias tributáveis apurado pelo motor da Fase 3.',
          formula: `BASE INSS RESCISÃO = ∑(Verbas com Incidência de INSS) = ${formatBRL(inssBaseEfetiva)}
INSS_RESCISAO_CALCULADO = ${formatBRL(inssCalculado)}${inssResult?.tetoAplicado ? ' (Limitado ao teto RGPS)' : ''}`,
          details: [
            {
              label: 'Verbas com Incidência Previdenciária',
              value: `${earnings.filter((e) => e.incideInss && e.value > 0).length} verba(s) (Base: ${formatBRL(
                inssBaseEfetiva
              )})`,
            },
            {
              label: 'Tabela Vigente RGPS',
              value: inssResult?.tabelaUtilizada ? `Tabela RGPS ${inssResult.tabelaUtilizada.ano}` : `Ano ${identification.ano}`,
            },
            {
              label: 'Alíquota Efetiva',
              value: formatPercentage(inssBaseEfetiva > 0 ? (inssCalculado / inssBaseEfetiva) * 100 : 0),
            },
            { label: 'INSS_RESCISAO_CALCULADO', value: formatBRL(inssCalculado) },
          ],
          resultHighlight: `INSS_RESCISAO_CALCULADO: ${formatBRL(inssCalculado)}`,
        },
        {
          stepNumber: 5,
          title: 'Etapa 5 — IRRF (IRRF_RESCISAO_CALCULADO)',
          description:
            'Tributação progressiva oficial sobre rendimentos tributáveis da rescisão com deduções legais (Fase 4).',
          formula: `BASE IRRF RESCISÃO = Rendimentos Tributáveis (${formatBRL(
            irrfResult?.rendimentosTributaveis || 0
          )}) - Deduções Legais (${formatBRL(irrfResult?.deducoes.totalDeducoes || 0)}) = ${formatBRL(irrfBaseEfetiva)}
IRRF_RESCISAO_CALCULADO = (Base × Alíquota ${formatPercentage(
            irrfResult?.aliquotaAplicada || 0
          )}) - Parcela a Deduzir (${formatBRL(irrfResult?.parcelaDeduzirAplicada || 0)}) = ${formatBRL(irrfCalculado)}`,
          details: [
            { label: 'Rendimentos Tributáveis no IRRF', value: formatBRL(irrfResult?.rendimentosTributaveis || 0) },
            { label: '(-) INSS_RESCISAO_CALCULADO', value: formatBRL(inssCalculado) },
            {
              label: '(-) Dedução por Dependentes',
              value: formatBRL(
                irrfResult?.deducoes.dependentes.total ??
                  (irrfConfig.quantidadeDependentes || 0) * (irrfTable?.deducaoPorDependente || 189.59)
              ),
            },
            { label: '(-) Pensão Alimentícia no IRRF', value: formatBRL(irrfResult?.deducoes.pensaoAlimenticia || 0) },
            { label: 'Base Efetiva do IRRF Rescisório', value: formatBRL(irrfBaseEfetiva) },
            {
              label: 'Faixa Aplicada',
              value: irrfResult?.faixaAplicada
                ? `Faixa ${irrfResult.faixaAplicada.faixaNumero} (${formatPercentage(irrfResult.aliquotaAplicada)})`
                : 'Isento',
            },
            { label: 'Parcela a Deduzir', value: formatBRL(irrfResult?.parcelaDeduzirAplicada || 0) },
            { label: 'IRRF_RESCISAO_CALCULADO', value: formatBRL(irrfCalculado) },
          ],
          resultHighlight: `IRRF_RESCISAO_CALCULADO: ${formatBRL(irrfCalculado)}`,
        },
        {
          stepNumber: 6,
          title: 'Etapa 6 — Pensão',
          description:
            'Apuração da base efetiva da pensão sobre as verbas rescisórias conforme regra selecionada e descontos permitidos.',
          formula: rateioBeneficiarios?.ativo
            ? buildSplitFormula(
                resolucaoSimultaneaAplicada
                  ? 'CÁLCULO SIMULTÂNEO (ALGÉBRICO): O IRRF (já deduzindo a soma das pensões) reduz a base aplicada igualmente a cada filho:'
                  : undefined
              )
            : resolucaoSimultaneaAplicada
            ? `CÁLCULO SIMULTÂNEO (ALGÉBRICO): Pensão e IRRF da rescisão calculados por resolução algébrica simultânea:
P = [ % × (Base Líquida antes do IRRF - IRRF_0) ] ÷ [ 1 - (% × Alíquota_IRRF) ]
BASE DA PENSÃO RESCISÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(
                basePensaoFinal
              )}
PENSÃO RESCISÃO = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(
                valorPensaoFinal
              )}`
            : rule.ruleType === 'percentual'
            ? `BASE DA PENSÃO RESCISÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(
                basePensaoFinal
              )}
PENSÃO RESCISÃO = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(
                valorPensaoFinal
              )}`
            : rule.ruleType === 'valor_fixo'
            ? `BASE DA PENSÃO RESCISÃO = ${formatBRL(basePensaoFinal)} | PENSÃO FIXA = ${formatBRL(effectiveRuleFixedValue)}`
            : `BASE DA PENSÃO RESCISÃO = ${formatBRL(basePensaoFinal)} | PENSÃO = (${formatBRL(
                basePensaoFinal
              )} × ${formatPercentage(effectiveRulePercentage)}) + ${formatBRL(effectiveRuleAdditionalValue)} = ${formatBRL(
                valorPensaoFinal
              )}`,
          details: [
            {
              label: 'Regra Utilizada',
              value:
                rule.origemRegraRescisao === 'especifica'
                  ? 'Regra específica cadastrada para rescisão'
                  : 'Regra geral cadastrada da folha',
            },
            { label: 'Base Escolhida', value: rule.baseType },
            {
              label: 'Verbas Incluídas na Base da Pensão',
              value: `${verbasConsideradasNaBase.length} verba(s) (Subtotal: ${formatBRL(somaProventosBase)})`,
            },
            {
              label: 'Verbas Excluídas da Base da Pensão',
              value: `${verbasExcluidasDaBase.length} verba(s) (Subtotal: ${formatBRL(somaExclusoes)})`,
            },
            { label: '(-) Descontos Autorizados a Abater a Pensão', value: formatBRL(somaDeducoesBasePensao) },
            { label: 'Base Efetiva da Pensão', value: formatBRL(basePensaoFinal) },
            { label: 'Percentual ou Valor Fixo', value: regraTexto },
            { label: 'Política de Arredondamento', value: regraArredondamento },
            ...(rateioBeneficiarios?.ativo
              ? rateioBeneficiarios.beneficiarios.map((b) => ({
                  label: `Cota Separada — ${b.label} (${b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)})`,
                  value: formatBRL(b.valorCalculado),
                  extra: `Sem arredondamento: R$ ${b.valorAntesArredondamento.toFixed(4)}`,
                }))
              : []),
            {
              label: rateioBeneficiarios?.ativo
                ? 'Total Consolidado (1 Evento Único na Folha)'
                : 'Valor da Pensão Apurado',
              value: formatBRL(valorPensaoFinal),
            },
          ],
          resultHighlight: `Pensão Alimentícia da Rescisão: ${formatBRL(valorPensaoFinal)}`,
        },
        {
          stepNumber: 7,
          title: 'Etapa 7 — Líquido',
          description:
            'Demonstrativo oficial do saldo líquido rescisório a pagar após INSS, IRRF, Pensão e outros descontos.',
          formula: `Total de proventos (${formatBRL(totalProventos)}) - INSS (${formatBRL(
            inssCalculado
          )}) - IRRF (${formatBRL(irrfCalculado)}) - Pensão (${formatBRL(
            valorPensaoFinal
          )}) - Outros descontos (${formatBRL(valorOutrosDescontosLiquido)}) = Líquido (${formatBRL(liquidoAposPensao)})`,
          details: [
            { label: 'Total de Proventos', value: formatBRL(totalProventos) },
            { label: '(-) INSS_RESCISAO_CALCULADO', value: formatBRL(inssCalculado) },
            { label: '(-) IRRF_RESCISAO_CALCULADO', value: formatBRL(irrfCalculado) },
            { label: '(-) Pensão Alimentícia', value: formatBRL(valorPensaoFinal) },
            { label: '(-) Outros Descontos Autorizados', value: formatBRL(valorOutrosDescontosLiquido) },
            { label: '(=) Valor Líquido da Rescisão', value: formatBRL(liquidoAposPensao) },
          ],
          resultHighlight: `Valor Líquido da Rescisão: ${formatBRL(liquidoAposPensao)}`,
        },
      ]
    : isPlr
    ? [
        {
          stepNumber: 1,
          title: '15.1 Identificação da PLR',
          description: 'Parâmetros oficiais da PLR, vigência, período de apuração e regras cadastradas.',
          details: [
            { label: 'Matrícula', value: identification.matricula || 'Não informada' },
            { label: 'Ano de Competência', value: String(identification.ano) },
            { label: 'Período de Referência', value: identification.periodoReferenciaPlr || 'Exercício Corrente' },
            { label: 'Data de Pagamento', value: identification.dataPagamento || 'Não informada' },
            {
              label: 'Tipo de Cálculo',
              value:
                identification.tipoCalculoPlr === 'proporcional'
                  ? 'PLR Proporcional'
                  : identification.tipoCalculoPlr === 'simulacao'
                  ? 'Simulação de PLR'
                  : identification.tipoCalculoPlr === 'conferencia'
                  ? 'Conferência de PLR'
                  : 'PLR Integral',
            },
            { label: 'Parcela', value: identification.numeroParcelaPlr || 'Parcela Única' },
            {
              label: 'Regra de Pensão Utilizada',
              value: rule.origemRegraPlr === 'especifica' ? 'Regra Específica de PLR' : 'Regra Geral da Folha',
            },
            ...(identification.observacoesPlr ? [{ label: 'Observações', value: identification.observacoesPlr }] : []),
          ],
          resultHighlight: 'Identificação da PLR validada',
        },
        {
          stepNumber: 2,
          title: '15.2 Formação da PLR',
          description: 'Discriminação dos componentes da PLR, metas, percentuais e critérios configurados.',
          formula: `PLR BRUTA = ∑(Componentes da PLR) = ${formatBRL(totalProventos)}`,
          details: [
            ...earnings.map((c) => ({
              label: `(+) ${c.label}`,
              value: formatBRL(c.value),
              extra: `Incide INSS: ${c.incideInss ? 'Sim' : 'Não'} | Incide IRRF: ${c.incideIrrf ? 'Sim' : 'Não'} | Incide Pensão: ${c.includedInPensionBase ? 'Sim' : 'Não'}`,
            })),
            { label: 'Total Bruto Apurado', value: formatBRL(totalProventos) },
          ],
          resultHighlight: `PLR Bruta: ${formatBRL(totalProventos)}`,
        },
        {
          stepNumber: 3,
          title: '15.3 Pagamentos Anteriores & Saldo',
          description: 'Demonstrativo de parcelamento, valores pagos em parcelas anteriores e saldo remanescente.',
          formula: `PLR da Parcela Atual = PLR Total (${formatBRL(totalProventos)}) - Valores Já Pagos (R$ 0,00) = ${formatBRL(totalProventos)}`,
          details: [
            { label: 'PLR Total Bruta', value: formatBRL(totalProventos) },
            { label: 'Valores Anteriormente Pagos', value: 'R$ 0,00' },
            { label: 'Parcela Atual', value: identification.numeroParcelaPlr || 'Parcela Única' },
            { label: 'Saldo Remanescente de PLR', value: 'R$ 0,00' },
          ],
          resultHighlight: `PLR Parcela Atual: ${formatBRL(totalProventos)}`,
        },
        {
          stepNumber: 4,
          title: '15.4 Contribuição Previdenciária (INSS)',
          description: 'Tratamento previdenciário da PLR com aplicação da legislação e regras configuradas.',
          formula:
            inssCalculado > 0
              ? `BASE INSS PLR = ${formatBRL(inssBaseEfetiva)} | INSS_PLR_CALCULADO = ${formatBRL(inssCalculado)}`
              : 'Isenção Previdenciária: Não há incidência de contribuição previdenciária sobre PLR (art. 3º da Lei Federal nº 10.101/2000).',
          details: [
            {
              label: 'Componentes com Incidência de INSS',
              value: `${earnings.filter((e) => e.incideInss && e.value > 0).length} verba(s)`,
            },
            { label: 'Base de Cálculo do INSS', value: formatBRL(inssBaseEfetiva) },
            { label: 'Enquadramento Legal', value: 'Art. 3º da Lei Federal nº 10.101/2000' },
            { label: 'INSS_PLR_CALCULADO', value: formatBRL(inssCalculado) },
          ],
          resultHighlight: `INSS_PLR_CALCULADO: ${formatBRL(inssCalculado)}`,
        },
        {
          stepNumber: 5,
          title: '15.5 Imposto de Renda Retido na Fonte (IRRF)',
          description: 'Tributação exclusiva na fonte com base na tabela progressiva especial da Lei nº 10.101/2000.',
          formula:
            irrfResult?.faixaAplicada?.aliquota === 0
              ? 'Rendimento situado na faixa de isenção da tabela exclusiva de PLR (Alíquota 0% / IRRF = R$ 0,00).'
              : `IRRF_PLR_CALCULADO = (Base de Cálculo × Alíquota) - Parcela a Deduzir
(${formatBRL(irrfBaseEfetiva)} × ${formatPercentage(irrfResult?.aliquotaAplicada || 0)}) - ${formatBRL(
                  irrfResult?.parcelaDeduzirAplicada || 0
                )} = ${formatBRL(irrfCalculado)}`,
          details: [
            { label: 'Tabela Aplicada', value: 'Tabela Progressiva Exclusiva de PLR (Lei nº 10.101/2000 e IN RFB)' },
            { label: 'Rendimentos Tributáveis de PLR', value: formatBRL(irrfResult?.rendimentosTributaveis || totalProventos) },
            { label: '(-) Dedução de INSS', value: formatBRL(inssCalculado) },
            { label: '(-) Pensão Alimentícia no IRRF', value: formatBRL(irrfResult?.deducoes.pensaoAlimenticia || 0) },
            { label: 'Base Efetiva do IRRF da PLR', value: formatBRL(irrfBaseEfetiva) },
            {
              label: 'Faixa de Enquadramento',
              value: irrfResult?.faixaAplicada
                ? `Faixa ${irrfResult.faixaAplicada.faixaNumero} (${formatPercentage(irrfResult.aliquotaAplicada)})`
                : 'Isento',
            },
            { label: 'Parcela a Deduzir da Faixa', value: formatBRL(irrfResult?.parcelaDeduzirAplicada || 0) },
            { label: 'IRRF_PLR_CALCULADO', value: formatBRL(irrfCalculado) },
          ],
          resultHighlight: `IRRF_PLR_CALCULADO: ${formatBRL(irrfCalculado)}`,
        },
        {
          stepNumber: 6,
          title: '15.6 Pensão Alimentícia sobre a PLR',
          description: 'Apuração da pensão alimentícia incidente sobre a PLR conforme regra configurada (geral ou específica).',
          formula: rateioBeneficiarios?.ativo
            ? buildSplitFormula(
                resolucaoSimultaneaAplicada
                  ? 'CÁLCULO SIMULTÂNEO (ALGÉBRICO): O IRRF (já deduzindo a soma das pensões) reduz a base aplicada igualmente a cada filho:'
                  : undefined
              )
            : resolucaoSimultaneaAplicada
            ? `CÁLCULO SIMULTÂNEO (ALGÉBRICO): Pensão e IRRF da PLR calculados por resolução simultânea:
P = [ % × (Base Líquida antes do IRRF - IRRF_0) ] ÷ [ 1 - (% × Alíquota_IRRF) ]
BASE DA PENSÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(basePensaoFinal)}
PENSÃO ALIMENTÍCIA = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(valorPensaoFinal)}`
            : rule.ruleType === 'percentual'
            ? `BASE DA PENSÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(basePensaoFinal)}
PENSÃO ALIMENTÍCIA = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(valorPensaoFinal)}`
            : rule.ruleType === 'valor_fixo'
            ? `BASE DA PENSÃO = ${formatBRL(basePensaoFinal)} | PENSÃO FIXA = ${formatBRL(effectiveRuleFixedValue)}`
            : `BASE DA PENSÃO = ${formatBRL(basePensaoFinal)} | PENSÃO = (${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)}) + ${formatBRL(effectiveRuleAdditionalValue)} = ${formatBRL(valorPensaoFinal)}`,
          details: [
            {
              label: 'Regra Aplicada',
              value: rule.origemRegraPlr === 'especifica' ? 'Regra Específica cadastrada para PLR' : 'Regra Geral cadastrada da folha',
            },
            { label: 'Base Escolhida', value: rule.baseType },
            {
              label: 'Componentes Incluídos na Pensão',
              value: `${verbasConsideradasNaBase.length} verba(s) (Subtotal: ${formatBRL(somaProventosBase)})`,
            },
            {
              label: 'Componentes Excluídos da Pensão',
              value: `${verbasExcluidasDaBase.length} verba(s) (Subtotal: ${formatBRL(somaExclusoes)})`,
            },
            { label: '(-) Deduções Autorizadas da Base', value: formatBRL(somaDeducoesBasePensao) },
            { label: 'Base Efetiva da Pensão', value: formatBRL(basePensaoFinal) },
            { label: 'Percentual / Regra', value: regraTexto },
            { label: 'Política de Arredondamento', value: regraArredondamento },
            ...(rateioBeneficiarios?.ativo
              ? rateioBeneficiarios.beneficiarios.map((b) => ({
                  label: `Cota Separada — ${b.label} (${b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)})`,
                  value: formatBRL(b.valorCalculado),
                  extra: `Sem arredondamento: R$ ${b.valorAntesArredondamento.toFixed(4)}`,
                }))
              : []),
            {
              label: rateioBeneficiarios?.ativo
                ? 'Total Consolidado (1 Evento Único na Folha)'
                : 'Pensão Alimentícia Apurada',
              value: formatBRL(valorPensaoFinal),
            },
          ],
          resultHighlight: `Pensão Alimentícia s/ PLR: ${formatBRL(valorPensaoFinal)}`,
        },
        {
          stepNumber: 7,
          title: '15.7 Demonstrativo do Líquido da PLR',
          description: 'Demonstrativo oficial do saldo líquido da PLR a pagar ao colaborador.',
          formula: `PLR Bruta (${formatBRL(totalProventos)}) - INSS (${formatBRL(inssCalculado)}) - IRRF (${formatBRL(
            irrfCalculado
          )}) - Pensão (${formatBRL(valorPensaoFinal)}) - Outros descontos (${formatBRL(
            valorOutrosDescontosLiquido
          )}) = PLR Líquida (${formatBRL(liquidoAposPensao)})`,
          details: [
            { label: 'PLR Bruta Total', value: formatBRL(totalProventos) },
            { label: '(-) INSS_PLR_CALCULADO', value: formatBRL(inssCalculado) },
            { label: '(-) IRRF_PLR_CALCULADO', value: formatBRL(irrfCalculado) },
            { label: '(-) Pensão Alimentícia', value: formatBRL(valorPensaoFinal) },
            { label: '(-) Outros Descontos Autorizados', value: formatBRL(valorOutrosDescontosLiquido) },
            { label: '(=) PLR Líquida', value: formatBRL(liquidoAposPensao) },
          ],
          resultHighlight: `PLR Líquida a Pagar: ${formatBRL(liquidoAposPensao)}`,
        },
      ]
    : [
        {
          stepNumber: 1,
          title: '1. Dados Informados & Identificação',
          description: 'Dados base informados do colaborador e parâmetros cadastrados da regra de pensão.',
          details: [
            { label: 'Matrícula', value: identification.matricula || 'Não informada' },
            { label: 'Competência / Ano', value: `${identification.competencia} / ${identification.ano}` },
            { label: 'Data de Pagamento', value: identification.dataPagamento || 'Não informada' },
            { label: 'Tipo de Cálculo', value: CALC_TYPE_LABELS[identification.tipoCalculo] || identification.tipoCalculo },
            ...(feriasRateioInss
              ? [
                  {
                    label: 'Período de Férias Partidas',
                    value: `${feriasRateioInss.dataInicio} a ${feriasRateioInss.dataFim} (${feriasRateioInss.totalDiasFerias} dias)`,
                    extra: `${feriasRateioInss.diasMes1}d em ${feriasRateioInss.competencia1Rotulo} + ${feriasRateioInss.diasMes2}d em ${feriasRateioInss.competencia2Rotulo}`,
                  },
                ]
              : []),
            { label: 'Quantidade de Dependentes (IRRF)', value: `${irrfConfig.quantidadeDependentes || 0} dependente(s)` },
            { label: 'Regra da Pensão', value: `${regraTexto} (Base: ${rule.baseType})` },
            { label: 'Ordem de Cálculo', value: irrfConfig.ordemCalculoCircular === 'irrf_antes_pensao' ? 'IRRF antes da Pensão' : irrfConfig.ordemCalculoCircular === 'pensao_antes_irrf' ? 'Pensão antes do IRRF' : 'Cálculo Simultâneo / Algébrico Oficial (Padrão Judicial)' },
          ],
          resultHighlight: `Identificação validada com sucesso`,
        },
        {
          stepNumber: 2,
          title: '2. Proventos & Composição da Folha',
          description: 'Demonstrativo discriminado de todas as rubricas salariais e sua classificação por categorias.',
          formula: `TOTAL DE PROVENTOS = Salário (${formatBRL(compSalario)}) + Horas Extras (${formatBRL(compHorasExtras)}) + Adicionais (${formatBRL(compAdicionais)}) + Outras (${formatBRL(compOutras)}) = ${formatBRL(totalProventos)}`,
          details: [
            { label: 'Salário Base', value: formatBRL(compSalario) },
            { label: 'Horas Extras', value: formatBRL(compHorasExtras) },
            { label: 'Adicionais (Noturno/Insalubridade/Periculosidade)', value: formatBRL(compAdicionais) },
            { label: 'Outras Verbas (Comissões/Gratificações/Diversas)', value: formatBRL(compOutras) },
            ...earnings.filter((e) => e.value > 0).map((v) => ({
              label: `• ${v.label}`,
              value: formatBRL(v.value),
              extra: `INSS: ${v.incideInss ? 'Sim' : 'Não'} | IRRF: ${v.incideIrrf ? 'Sim' : 'Não'} | Pensão: ${v.includedInPensionBase ? 'Sim' : 'Não'}`,
            })),
          ],
          resultHighlight: `Total de Proventos: ${formatBRL(totalProventos)}`,
        },
        {
          stepNumber: 3,
          title: feriasRateioInss
            ? `3. Contribuição Previdenciária (INSS — Rateio Férias Partidas ${feriasRateioInss.competencia1Rotulo})`
            : '3. Contribuição Previdenciária (INSS)',
          description: feriasRateioInss
            ? `Cálculo progressivo oficial apurado apenas sobre a parcela proporcional a ${feriasRateioInss.competencia1Rotulo} (${feriasRateioInss.diasMes1}/${feriasRateioInss.totalDiasFerias} dias), com projeção de recálculo em ${feriasRateioInss.competencia2Rotulo}.`
            : 'Cálculo progressivo oficial apurado pelo motor da Fase 3 sobre a base com incidência previdenciária.',
          formula: feriasRateioInss
            ? `BASE INSS RECIBO (${feriasRateioInss.competencia1Rotulo}) = ${formatBRL(feriasRateioInss.baseInssTotalFerias)} × (${feriasRateioInss.diasMes1} ÷ ${feriasRateioInss.totalDiasFerias}) = ${formatBRL(feriasRateioInss.baseInssFeriasMes1)}${
                feriasRateioInss.remuneracaoTrabalhadaMes1 > 0
                  ? ` + Trabalhado ${feriasRateioInss.competencia1Rotulo} (${formatBRL(feriasRateioInss.remuneracaoTrabalhadaMes1)}) = ${formatBRL(inssBaseEfetiva)}`
                  : ''
              }
INSS NO RECIBO (${feriasRateioInss.competencia1Rotulo}) = ${formatBRL(inssCalculado)}
RECÁLCULO FOLHA (${feriasRateioInss.competencia2Rotulo}): Base ${formatBRL(feriasRateioInss.baseInssFeriasMes2)} (férias ${feriasRateioInss.diasMes2}/${feriasRateioInss.totalDiasFerias}d) + ${formatBRL(feriasRateioInss.remuneracaoTrabalhadaMes2)} (trabalhado) = ${formatBRL(feriasRateioInss.baseTotalInssMes2)} → INSS ${formatBRL(feriasRateioInss.inssRecalculadoMes2)}`
            : `BASE INSS = ∑(Verbas com Incidência de INSS) = ${formatBRL(inssBaseEfetiva)}
VALOR DO INSS = ${formatBRL(inssCalculado)}${inssResult?.tetoAplicado ? ' (Limitado ao teto RGPS)' : ''}`,
          details: [
            { label: 'Verbas com Incidência Previdenciária', value: `${earnings.filter((e) => e.incideInss && e.value > 0).length} verba(s)` },
            ...(feriasRateioInss
              ? [
                  {
                    label: `Base INSS Integral das Férias (100%)`,
                    value: formatBRL(feriasRateioInss.baseInssTotalFerias),
                    extra: `INSS integral de referência: ${formatBRL(feriasRateioInss.inssIntegralReferencia)}`,
                  },
                  {
                    label: `Base Proporcional ${feriasRateioInss.competencia1Rotulo} (${feriasRateioInss.diasMes1}/${feriasRateioInss.totalDiasFerias} dias)`,
                    value: formatBRL(feriasRateioInss.baseTotalInssMes1),
                  },
                ]
              : [{ label: 'Base de Cálculo do INSS', value: formatBRL(inssBaseEfetiva) }]),
            { label: 'Tabela Vigente', value: inssResult?.tabelaUtilizada ? `Tabela RGPS ${inssResult.tabelaUtilizada.ano}` : `Ano ${identification.ano}` },
            { label: 'Alíquota Efetiva', value: formatPercentage(inssBaseEfetiva > 0 ? (inssCalculado / inssBaseEfetiva) * 100 : 0) },
            { label: feriasRateioInss ? `INSS no Recibo (${feriasRateioInss.competencia1Rotulo})` : 'INSS Calculado', value: formatBRL(inssCalculado) },
            ...(feriasRateioInss
              ? [
                  {
                    label: `INSS Recalculado na Folha ${feriasRateioInss.competencia2Rotulo}`,
                    value: formatBRL(feriasRateioInss.inssRecalculadoMes2),
                    extra: feriasRateioInss.tabelaMes2Observacao,
                  },
                ]
              : []),
          ],
          resultHighlight: feriasRateioInss
            ? `INSS no Recibo (${feriasRateioInss.competencia1Rotulo}): ${formatBRL(inssCalculado)} | Folha ${feriasRateioInss.competencia2Rotulo}: ${formatBRL(feriasRateioInss.inssRecalculadoMes2)}`
            : `INSS Apurado: ${formatBRL(inssCalculado)}`,
        },
        {
          stepNumber: 4,
          title: '4. Imposto de Renda Retido na Fonte (IRRF)',
          description: 'Cálculo progressivo oficial apurado pelo motor da Fase 4 com aplicação das deduções legais.',
          formula: `BASE IRRF = Rendimentos Tributáveis (${formatBRL(irrfResult?.rendimentosTributaveis || 0)}) - Deduções Legais (${formatBRL(irrfResult?.deducoes.totalDeducoes || 0)}) = ${formatBRL(irrfBaseEfetiva)}
VALOR DO IRRF = (Base × Alíquota ${formatPercentage(irrfResult?.aliquotaAplicada || 0)}) - Parcela a Deduzir (${formatBRL(irrfResult?.parcelaDeduzirAplicada || 0)}) = ${formatBRL(irrfCalculado)}`,
          details: [
            { label: 'Rendimentos Tributáveis (IRRF)', value: formatBRL(irrfResult?.rendimentosTributaveis || 0) },
            { label: '(-) INSS Oficial Considerado', value: formatBRL(inssCalculado) },
            { label: '(-) Dedução por Dependentes', value: formatBRL(irrfResult?.deducoes.dependentes.total ?? ((irrfConfig.quantidadeDependentes || 0) * (irrfTable?.deducaoPorDependente || 189.59))) },
            { label: '(-) Pensão Alimentícia no IRRF', value: formatBRL(irrfResult?.deducoes.pensaoAlimenticia || 0) },
            { label: 'Base Efetiva do IRRF', value: formatBRL(irrfBaseEfetiva) },
            { label: 'Faixa / Alíquota Aplicada', value: irrfResult?.faixaAplicada ? `Faixa ${irrfResult.faixaAplicada.faixaNumero} (${formatPercentage(irrfResult.aliquotaAplicada)})` : 'Isento' },
            { label: 'Parcela a Deduzir', value: formatBRL(irrfResult?.parcelaDeduzirAplicada || 0) },
            { label: 'IRRF Calculado', value: formatBRL(irrfCalculado) },
          ],
          resultHighlight: `IRRF Apurado: ${formatBRL(irrfCalculado)}`,
        },
        {
          stepNumber: 5,
          title: '5. Pensão Alimentícia (Motor da Fase 2)',
          description: 'Apuração da base efetiva da pensão e aplicação da regra cadastrada.',
          formula: rateioBeneficiarios?.ativo
            ? buildSplitFormula(
                resolucaoSimultaneaAplicada
                  ? 'CÁLCULO SIMULTÂNEO (ALGÉBRICO): O IRRF (já deduzindo a soma das pensões) reduz a base aplicada igualmente a cada filho (padrão judicial):'
                  : undefined
              )
            : resolucaoSimultaneaAplicada
            ? `CÁLCULO SIMULTÂNEO (ALGÉBRICO): Pensão e IRRF calculados por resolução algébrica simultânea (padrão judicial):
P = [ % × (Base Líquida antes do IRRF - IRRF_0) ] ÷ [ 1 - (% × Alíquota_IRRF) ]
BASE DA PENSÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(basePensaoFinal)}
PENSÃO = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(valorPensaoFinal)}`
            : rule.ruleType === 'percentual'
            ? `BASE DA PENSÃO = ${formatBRL(somaProventosBase)} - ${formatBRL(somaDeducoesBasePensao)} = ${formatBRL(basePensaoFinal)}
PENSÃO = ${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)} = ${formatBRL(valorPensaoFinal)}`
            : rule.ruleType === 'valor_fixo'
            ? `BASE DA PENSÃO = ${formatBRL(basePensaoFinal)} | PENSÃO FIXA = ${formatBRL(effectiveRuleFixedValue)}`
            : `BASE DA PENSÃO = ${formatBRL(basePensaoFinal)} | PENSÃO = (${formatBRL(basePensaoFinal)} × ${formatPercentage(effectiveRulePercentage)}) + ${formatBRL(effectiveRuleAdditionalValue)} = ${formatBRL(valorPensaoFinal)}`,
          details: [
            { label: 'Verbas Incluídas na Base', value: `${verbasConsideradasNaBase.length} verba(s) (Subtotal: ${formatBRL(somaProventosBase)})` },
            { label: 'Verbas Excluídas da Base', value: `${verbasExcluidasDaBase.length} verba(s) (Subtotal: ${formatBRL(somaExclusoes)})` },
            { label: '(-) Deduções Permitidas da Base', value: formatBRL(somaDeducoesBasePensao) },
            { label: 'Base Efetiva da Pensão', value: formatBRL(basePensaoFinal) },
            { label: 'Regra / Percentual Aplicado', value: regraTexto },
            ...(rateioBeneficiarios?.ativo
              ? rateioBeneficiarios.beneficiarios.map((b) => ({
                  label: `Cota Separada — ${b.label} (${b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)})`,
                  value: formatBRL(b.valorCalculado),
                  extra: `Sem arredondamento: R$ ${b.valorAntesArredondamento.toFixed(4)}`,
                }))
              : []),
            {
              label: rateioBeneficiarios?.ativo
                ? 'Total Consolidado (1 Evento Único na Folha)'
                : 'Valor da Pensão Apurado',
              value: formatBRL(valorPensaoFinal),
            },
          ],
          resultHighlight: rateioBeneficiarios?.ativo
            ? `Evento Único (${rateioBeneficiarios.quantidadeBeneficiarios} cotas): ${formatBRL(valorPensaoFinal)}`
            : `Pensão Alimentícia Definitiva: ${formatBRL(valorPensaoFinal)}`,
        },
        {
          stepNumber: 6,
          title: '6. Resultado Líquido da Folha',
          description: 'Demonstrativo do valor líquido remanescente após todas as deduções legais, outros descontos e pensão.',
          formula: `LÍQUIDO A PAGAR = Total Proventos (${formatBRL(totalProventos)}) - INSS (${formatBRL(inssCalculado)}) - IRRF (${formatBRL(irrfCalculado)}) - Outros Descontos (${formatBRL(valorOutrosDescontosLiquido)}) - Pensão (${formatBRL(valorPensaoFinal)}) = ${formatBRL(liquidoAposPensao)}`,
          details: [
            { label: 'Total de Proventos', value: formatBRL(totalProventos) },
            { label: '(-) INSS Oficial', value: formatBRL(inssCalculado) },
            { label: '(-) IRRF Oficial', value: formatBRL(irrfCalculado) },
            { label: '(-) Outros Descontos Autorizados', value: formatBRL(valorOutrosDescontosLiquido), extra: outrosDescontosItems.length > 0 ? `${outrosDescontosQueDeduzemDoLiquido.length} de ${outrosDescontosItems.length} deduzem do líquido` : 'Nenhum' },
            { label: '(-) Pensão Alimentícia', value: formatBRL(valorPensaoFinal) },
            { label: '(=) Líquido da Folha Mensal', value: formatBRL(liquidoAposPensao) },
          ],
          resultHighlight: `Saldo Líquido ao Colaborador: ${formatBRL(liquidoAposPensao)}`,
        },
      ];

  // LOG DA REGRA UTILIZADA
  const auditLog: CalculationAuditLog = {
    id: `log_${Date.now()}`,
    tipoCalculo: identification.tipoCalculo,
    tipoCalculoRotulo: CALC_TYPE_LABELS[identification.tipoCalculo] || identification.tipoCalculo,
    regraTexto,
    ruleType: rule.ruleType,
    percentual: rule.ruleType === 'percentual' || rule.ruleType === 'percentual_adicional' ? effectiveRulePercentage : undefined,
    baseSelecionada: rule.baseType,
    verbasIncluidas: verbasConsideradasNaBase.map((v) => ({ label: v.label, valor: v.value, observacao: v.observation })),
    verbasExcluidas: verbasExcluidasDaBase.map((v) => ({ label: v.label, valor: v.value, observacao: v.observation })),
    deducoes: updatedDeductions.filter((d) => d.deductFromPensionBase).map((d) => ({
      label: d.label,
      valor: d.value,
      deduz: d.deductFromPensionBase,
      ordem: d.order,
      observacao: d.observation,
    })),
    basePensao: basePensaoFinal,
    valorAntesArredondamento: valorAntesArredondamentoPensao,
    regraArredondamento,
    valorPensao: valorPensaoFinal,
    minimoAplicado,
    tetoAplicado,
    totalProventos,
    liquidoAposPensao,
    calculatedAt: new Date().toLocaleString('pt-BR'),
  };

  return {
    totalProventos,
    composicaoProventos,
    feriasRateioInss,
    rescisaoResumo,
    plrResumo,
    baseInss: inssBaseEfetiva,
    valorInss: inssCalculado,
    inssDisponivelParaIrrf,
    baseIrrf: irrfBaseEfetiva,
    valorIrrf: irrfCalculado,
    outrosDescontos: valorTotalOutrosDescontos,
    totalDescontosSemPensao,
    verbasConsideradasNaBase,
    verbasExcluidasDaBase,
    deducoesAutorizadasNaBase: updatedDeductions.filter((d) => d.deductFromPensionBase),
    basePensao: basePensaoFinal,
    regraTexto,
    valorAntesArredondamento: valorAntesArredondamentoPensao,
    valorPensao: valorPensaoFinal,
    totalDescontosComPensao,
    liquidoAposPensao,
    rateioBeneficiarios,
    minimoAplicado,
    tetoAplicado,
    memorySteps,
    auditLog,
    inssResult,
    irrfResult,
    resumoEncargos,
    calculatedAt: new Date().toLocaleString('pt-BR'),
  };
}

/**
 * Perfis iniciais independentes por modalidade (Fase 4: INSS + IRRF)
 */
export function getInitialProfiles(): Record<CalculationType, TypeSpecificProfile> {
  const defaultIrrfConfig: IrrfDeductionsConfig = {
    deduzirInss: true,
    deduzirDependentes: false,
    quantidadeDependentes: 0,
    deduzirPensao: true,
    usarPensaoCalculadaPeloMotor: true,
    valorPensaoManual: 0,
    deduzirOutras: false,
    outrasDeducoesValor: 0,
    ordemCalculoCircular: 'simultaneo_algebrico',
  };

  return {
    folha_mensal: {
      pensionRule: {
        ruleType: 'percentual',
        percentage: 30,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'apos_inss_irrf',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: true,
      },
      irrfConfig: { ...defaultIrrfConfig },
      earnings: [
        { id: 'salario', label: 'Salário', value: 0, categoria: 'salario', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Salário base contratual' },
        { id: 'horas_extras', label: 'Hora extra', value: 0, categoria: 'hora_extra', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Horas extras 50%/100%' },
        { id: 'adicional_noturno', label: 'Adicional noturno', value: 0, categoria: 'adicional', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Trabalho noturno' },
        { id: 'adicional_insalubridade', label: 'Insalubridade', value: 0, categoria: 'adicional', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Grau mínimo/médio/máximo' },
        { id: 'adicional_periculosidade', label: 'Periculosidade', value: 0, categoria: 'adicional', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: '30% sobre salário' },
        { id: 'comissoes', label: 'Comissão', value: 0, categoria: 'comissao', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Comissões habituais' },
        { id: 'gratificacoes', label: 'Gratificação', value: 0, categoria: 'gratificacao', includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Gratificação de função/cargo' },
        { id: 'outras_verbas', label: 'Outras', value: 0, categoria: 'outras', includedInPensionBase: false, incideInss: false, incideIrrf: false, observation: 'Aferir determinação do ofício' },
      ],
      deductions: [
        { id: 'inss', label: 'INSS (Oficial RGPS)', value: 0, deductFromPensionBase: true, deduzDoLiquido: true, deduzDoIrrf: true, order: 1, observation: 'Previdência oficial apurada pelo motor' },
        { id: 'irrf', label: 'IRRF (Oficial)', value: 0, deductFromPensionBase: true, deduzDoLiquido: true, deduzDoIrrf: false, order: 2, observation: 'Tributação fiscal apurada pelo motor' },
        { id: 'outros_descontos', label: 'Outros Descontos', value: 0, deductFromPensionBase: false, deduzDoLiquido: true, deduzDoIrrf: false, order: 3 },
      ],
    },
    ferias: {
      pensionRule: {
        ruleType: 'percentual',
        percentage: 30,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'apos_inss_irrf',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: true,
      },
      irrfConfig: { ...defaultIrrfConfig },
      earnings: [
        { id: 'ferias_gozadas', label: 'Férias Gozadas', value: 0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Remuneração de férias' },
        { id: 'terco_constitucional', label: '1/3 Constitucional de Férias', value: 0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Adicional constitucional tributável' },
        { id: 'abono_pecuniario', label: 'Abono Pecuniário (Venda de 10 dias)', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: false, observation: 'Isento: art. 6º Lei 7.713/88 e Súmula 125 STJ (SC COSIT nº 209/2021)' },
        { id: 'terco_abono', label: '1/3 do Abono Pecuniário', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: true, observation: 'Tributa IRRF conforme SC COSIT nº 209/2021 (isento de INSS)', irrfObservation: 'Tributável pelo IRRF no curso do contrato (Solução de Consulta COSIT nº 209/2021)' },
        { id: 'outras_verbas_ferias', label: 'Outras Verbas de Férias', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: false },
      ],
      deductions: [
        { id: 'inss', label: 'INSS s/ Férias', value: 0, deductFromPensionBase: true, order: 1 },
        { id: 'irrf', label: 'IRRF s/ Férias', value: 0, deductFromPensionBase: true, order: 2 },
        { id: 'adiantamento_ferias', label: 'Adiantamento de Férias', value: 0, deductFromPensionBase: false, order: 3 },
      ],
    },
    decimo_terceiro: {
      pensionRule: {
        ruleType: 'percentual',
        percentage: 30,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'apos_inss_irrf',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: true,
      },
      irrfConfig: { ...defaultIrrfConfig },
      earnings: [
        { id: 'decimo_integral', label: '13º Salário (Integral ou 2ª Parcela)', value: 0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Gratificação natalina' },
        { id: 'medias_horas_extras_13', label: 'Médias Horas Extras 13º', value: 0, includedInPensionBase: true, incideInss: true, incideIrrf: true },
        { id: 'medias_adicionais_13', label: 'Médias Adicionais 13º', value: 0, includedInPensionBase: true, incideInss: true, incideIrrf: true },
        { id: 'outras_verbas_13', label: 'Outras Verbas 13º', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: false },
      ],
      deductions: [
        { id: 'inss', label: 'INSS s/ 13º', value: 0, deductFromPensionBase: true, order: 1 },
        { id: 'irrf', label: 'IRRF s/ 13º', value: 0, deductFromPensionBase: true, order: 2 },
        { id: 'adiantamento_13', label: 'Adiantamento 1ª Parcela 13º', value: 0, deductFromPensionBase: false, order: 3 },
      ],
    },
    rescisao: {
      pensionRule: {
        ruleType: 'percentual',
        percentage: 30,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'personalizada',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: true,
        origemRegraRescisao: 'especifica',
      },
      irrfConfig: { ...defaultIrrfConfig },
      regraEspecificaRescisaoAtiva: true,
      earnings: [
        {
          id: 'saldo_salario',
          label: 'Saldo de salário',
          value: 0,
          includedInPensionBase: true,
          incideInss: true,
          incideIrrf: true,
          tipoVerbaRescisao: 'saldo_salario',
          observation: 'Dias trabalhados no mês do desligamento',
        },
        {
          id: 'aviso_previo',
          label: 'Aviso-prévio',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: false,
          tipoVerbaRescisao: 'aviso_previo',
          observation: 'Aviso indenizado ou trabalhado conforme configuração',
        },
        {
          id: 'ferias_vencidas',
          label: 'Férias vencidas',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: false,
          tipoVerbaRescisao: 'ferias_vencidas',
          observation: 'Período aquisitivo completo adquirido',
        },
        {
          id: 'ferias_proporcionais',
          label: 'Férias proporcionais',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: false,
          tipoVerbaRescisao: 'ferias_proporcionais',
          observation: 'Fração de avos no exercício (Lei 4.074/62)',
        },
        {
          id: 'um_terco_ferias',
          label: '1/3 de férias',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: false,
          tipoVerbaRescisao: 'um_terco',
          observation: 'Adicional de 1/3 constitucional sobre férias rescisórias',
        },
        {
          id: 'decimo_proporcional',
          label: '13º proporcional',
          value: 0,
          includedInPensionBase: true,
          incideInss: true,
          incideIrrf: true,
          tipoVerbaRescisao: 'decimo_proporcional',
          observation: 'Gratificação natalina proporcional apurada pelo módulo de 13º',
        },
        {
          id: 'outras_verbas_rescisao',
          label: 'Outras verbas',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: false,
          tipoVerbaRescisao: 'outras',
          observation: 'Outras rubricas rescisórias personalizadas',
        },
      ],
      deductions: [
        {
          id: 'inss',
          label: 'INSS s/ Rescisão (RGPS)',
          value: 0,
          deductFromPensionBase: true,
          deduzDoLiquido: true,
          deduzDoIrrf: true,
          order: 1,
          observation: 'Previdência oficial apurada pelo motor (INSS_RESCISAO_CALCULADO)',
        },
        {
          id: 'irrf',
          label: 'IRRF s/ Rescisão',
          value: 0,
          deductFromPensionBase: true,
          deduzDoLiquido: true,
          deduzDoIrrf: false,
          order: 2,
          observation: 'Tributação fiscal apurada pelo motor (IRRF_RESCISAO_CALCULADO)',
        },
        {
          id: 'outros_descontos_rescisao',
          label: 'Outros Descontos da Rescisão',
          value: 0,
          deductFromPensionBase: false,
          deduzDoLiquido: true,
          deduzDoIrrf: false,
          order: 3,
          observation: 'Adiantamentos, benefícios e outros descontos autorizados',
        },
      ],
      rescisaoMedias: [],
      rescisaoSaldoSalario: {
        salarioMensal: 0,
        diasTrabalhados: 0,
        divisor: 30,
        outrasParcelas: 0,
        valorCalculado: 0,
      },
      rescisaoAvisoPrevio: {
        tipo: 'indenizado',
        dias: 30,
        baseCalculo: 0,
        divisor: 30,
        valorCalculado: 0,
        incideInss: false,
        incideIrrf: false,
        incidePensao: false,
      },
      rescisaoFeriasVencidas: {
        possui: false,
        periodos: 1,
        dias: 30,
        remuneracao: 0,
        umTerco: 0,
        valorTotal: 0,
        incideInss: false,
        incideIrrf: false,
        incidePensao: false,
      },
      rescisaoFeriasProporcionais: {
        possui: true,
        avos: 0,
        baseCalculo: 0,
        valorProporcional: 0,
        umTerco: 0,
        valorTotal: 0,
        incideInss: false,
        incideIrrf: false,
        incidePensao: false,
      },
      rescisaoDecimo: {
        avos: 0,
        baseCalculo: 0,
        valorCalculado: 0,
        incideInss: true,
        incideIrrf: true,
        incidePensao: true,
      },
    },
    plr: {
      pensionRule: {
        ruleType: 'percentual',
        percentage: 20,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'personalizada',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: false,
        origemRegraPlr: 'especifica',
      },
      irrfConfig: {
        ...defaultIrrfConfig,
        deduzirInss: false,
        deduzirDependentes: false,
      },
      regraEspecificaPlrAtiva: true,
      earnings: [
        {
          id: 'parcela_base',
          label: 'Parcela base',
          value: 0,
          includedInPensionBase: true,
          incideInss: false,
          incideIrrf: true,
          observation: 'Parcela fixa base da PLR estipulada em acordo coletivo',
        },
        {
          id: 'resultado_meta',
          label: 'Resultado/meta',
          value: 0,
          includedInPensionBase: true,
          incideInss: false,
          incideIrrf: true,
          observation: 'Parcela atrelada a indicadores e metas de lucratividade',
        },
        {
          id: 'proporcionalidade',
          label: 'Proporcionalidade',
          value: 0,
          includedInPensionBase: true,
          incideInss: false,
          incideIrrf: true,
          observation: 'Ajuste de proporcionalidade aos meses trabalhados',
        },
        {
          id: 'outros_plr',
          label: 'Outros',
          value: 0,
          includedInPensionBase: false,
          incideInss: false,
          incideIrrf: true,
          observation: 'Demais componentes da apuração da PLR',
        },
      ],
      deductions: [
        {
          id: 'inss',
          label: 'INSS s/ PLR (se aplicável)',
          value: 0,
          deductFromPensionBase: true,
          deduzDoLiquido: true,
          deduzDoIrrf: true,
          order: 1,
          observation: 'Previdência oficial apurada pelo motor (INSS_PLR_CALCULADO)',
        },
        {
          id: 'irrf',
          label: 'IRRF Exclusivo s/ PLR (Lei 10.101/2000)',
          value: 0,
          deductFromPensionBase: true,
          deduzDoLiquido: true,
          deduzDoIrrf: false,
          order: 2,
          observation: 'Tributação exclusiva na fonte apurada pelo motor (IRRF_PLR_CALCULADO)',
        },
        {
          id: 'outros_descontos_plr',
          label: 'Outros Descontos da PLR',
          value: 0,
          deductFromPensionBase: false,
          deduzDoLiquido: true,
          deduzDoIrrf: false,
          order: 3,
        },
      ],
      plrRegraConfig: {
        formaCalculo: 'valor_informado',
        descricaoRegra: 'PLR conforme acordo coletivo de trabalho',
        periodoApuracao: 'Exercício 2025',
        periodoReferencia: '2025/2026',
        valorBrutoInformado: 0,
        baseCalculoPercentual: 0,
        percentualSobreBase: 100,
        criteriosMetas: [],
        possuiMinimo: false,
        valorMinimo: 0,
        possuiMaximo: false,
        valorMaximo: 0,
        mesesTrabalhados: 12,
        totalMesesAno: 12,
        fatorProporcionalidade: 1,
        valorCalculadoRegra: 0,
      },
      plrParcelamento: {
        modalidade: 'unica',
        quantidadeParcelas: 1,
        parcelaAtual: 1,
        valorJaPago: 0,
        valorParcelaAtual: 0,
        saldoRestante: 0,
      },
    },
  };
}
