/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  CalculationResultData,
  CalculationType,
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionRuleConfig,
} from '../types/pension';
import { IrrfDeductionsConfig } from '../types/irrf';
import {
  CenarioSimulado,
  ComparacaoBaseItem,
  ComparacaoRegraItem,
  ConferenciaInversaResult,
  ConferenciaSistemaInputs,
  DiagnosticoDivergencia,
  EtapaConferenciaItem,
  PadraoMemoriaEtapa,
  RelatorioConsolidacaoExportacao,
  ResultadoExecutivoConsolidado,
  SequenciaDependenciaItem,
  StatusConferenciaEtapa,
  StatusExecutivoGeral,
} from '../types/consolidation';
import { formatBRL, formatPercentage } from './formatters';

const MODULO_NOMES: Record<CalculationType, string> = {
  folha_mensal: 'Folha Mensal',
  ferias: 'Férias',
  decimo_terceiro: '13º Salário',
  rescisao: 'Rescisão Contratual',
  plr: 'PLR (Participação nos Lucros ou Resultados)',
};

/**
 * 1. Constrói a Sequência de Dependências Dinâmica conforme a regra real aplicada (Seção 11)
 */
export function buildDynamicSequence(
  result: CalculationResultData,
  rule: PensionRuleConfig,
  irrfConfig: IrrfDeductionsConfig
): SequenciaDependenciaItem[] {
  const isCircular =
    rule.baseType === 'apos_inss_irrf' &&
    irrfConfig.deduzirPensao &&
    irrfConfig.usarPensaoCalculadaPeloMotor;

  if (isCircular) {
    return [
      {
        ordem: 1,
        id: 'proventos',
        label: 'Proventos Brutos',
        valorFormatado: formatBRL(result.totalProventos),
        tipo: 'entrada',
        observacao: 'Soma dos vencimentos e verbas da competência',
      },
      {
        ordem: 2,
        id: 'inss',
        label: 'INSS (Oficial RGPS)',
        valorFormatado: `(-) ${formatBRL(result.valorInss)}`,
        tipo: 'encargo',
        observacao: 'Previdência apurada de forma autônoma sem influência do IRRF',
      },
      {
        ordem: 3,
        id: 'circular',
        label: 'Resolução Circular Simultânea (IRRF ↔ Pensão)',
        valorFormatado: 'Sistema Algébrico 2x2',
        tipo: 'base',
        observacao: 'Pensão deduz IRRF da base e IRRF deduz Pensão da base simultaneamente',
      },
      {
        ordem: 4,
        id: 'base_pensao',
        label: 'Base da Pensão Apurada',
        valorFormatado: formatBRL(result.basePensao),
        tipo: 'base',
        observacao: 'Base final após dedução do INSS e do IRRF simultâneo',
      },
      {
        ordem: 5,
        id: 'pensao',
        label: 'Pensão Alimentícia',
        valorFormatado: `(-) ${formatBRL(result.valorPensao)}`,
        tipo: 'resultado',
        observacao: `${result.regraTexto}`,
      },
      {
        ordem: 6,
        id: 'irrf',
        label: 'IRRF Definitivo',
        valorFormatado: `(-) ${formatBRL(result.valorIrrf)}`,
        tipo: 'encargo',
        observacao: 'Imposto retido na fonte com dedução da pensão apurada',
      },
      {
        ordem: 7,
        id: 'outros',
        label: 'Outros Descontos Autorizados',
        valorFormatado: `(-) ${formatBRL(result.outrosDescontos)}`,
        tipo: 'deducao',
        observacao: 'Deduções adicionais do colaborador',
      },
      {
        ordem: 8,
        id: 'liquido',
        label: 'Valor Líquido a Pagar',
        valorFormatado: formatBRL(result.liquidoAposPensao),
        tipo: 'resultado',
        observacao: 'Proventos − INSS − IRRF − Pensão − Outros',
      },
    ];
  }

  // Sequência padrão para base bruta ou após INSS
  return [
    {
      ordem: 1,
      id: 'proventos',
      label: 'Proventos Brutos',
      valorFormatado: formatBRL(result.totalProventos),
      tipo: 'entrada',
      observacao: 'Composição de verbas da modalidade',
    },
    {
      ordem: 2,
      id: 'inss',
      label: 'INSS (Oficial)',
      valorFormatado: `(-) ${formatBRL(result.valorInss)}`,
      tipo: 'encargo',
      observacao: 'Previdência apurada pelo motor oficial',
    },
    {
      ordem: 3,
      id: 'base_pensao',
      label: 'Base da Pensão',
      valorFormatado: formatBRL(result.basePensao),
      tipo: 'base',
      observacao: `Regra: ${rule.baseType}`,
    },
    {
      ordem: 4,
      id: 'pensao',
      label: 'Pensão Alimentícia',
      valorFormatado: `(-) ${formatBRL(result.valorPensao)}`,
      tipo: 'resultado',
      observacao: `${result.regraTexto}`,
    },
    {
      ordem: 5,
      id: 'irrf',
      label: 'IRRF',
      valorFormatado: `(-) ${formatBRL(result.valorIrrf)}`,
      tipo: 'encargo',
      observacao: 'Imposto retido na fonte',
    },
    {
      ordem: 6,
      id: 'outros',
      label: 'Outros Descontos',
      valorFormatado: `(-) ${formatBRL(result.outrosDescontos)}`,
      tipo: 'deducao',
      observacao: 'Descontos autorizados no líquido',
    },
    {
      ordem: 7,
      id: 'liquido',
      label: 'Valor Líquido',
      valorFormatado: formatBRL(result.liquidoAposPensao),
      tipo: 'resultado',
      observacao: 'Fechamento final da modalidade',
    },
  ];
}

/**
 * 2. Constrói a Tabela de Conferência por Etapas (Seções 12, 13 e 16)
 */
export function buildConferenceStages(
  result: CalculationResultData,
  inputs: ConferenciaSistemaInputs
): { etapas: EtapaConferenciaItem[]; primeiraDivergencia?: EtapaConferenciaItem } {
  const tol = Math.max(0, inputs.toleranciaCentavos || 0);

  const rawStages: {
    id: string;
    numero: number;
    nome: string;
    calculadora: number;
    informado?: number;
  }[] = [
    {
      id: 'proventos',
      numero: 1,
      nome: 'Proventos Brutos',
      calculadora: result.totalProventos,
      informado: inputs.proventosSistema,
    },
    {
      id: 'inss',
      numero: 2,
      nome: 'INSS',
      calculadora: result.valorInss,
      informado: inputs.inssSistema,
    },
    {
      id: 'irrf',
      numero: 3,
      nome: 'IRRF',
      calculadora: result.valorIrrf,
      informado: inputs.irrfSistema,
    },
    {
      id: 'base_pensao',
      numero: 4,
      nome: 'Base da Pensão',
      calculadora: result.basePensao,
      informado: inputs.basePensaoSistema,
    },
    {
      id: 'pensao',
      numero: 5,
      nome: 'Pensão Alimentícia',
      calculadora: result.valorPensao,
      informado: inputs.pensaoSistema,
    },
    {
      id: 'liquido',
      numero: 6,
      nome: 'Valor Líquido',
      calculadora: result.liquidoAposPensao,
      informado: inputs.liquidoSistema,
    },
  ];

  let foundFirst = false;
  let primeiraDivergencia: EtapaConferenciaItem | undefined = undefined;

  const etapas: EtapaConferenciaItem[] = rawStages.map((st) => {
    if (st.informado === undefined || isNaN(st.informado)) {
      return {
        id: st.id,
        etapaNumero: st.numero,
        etapaNome: st.nome,
        calculadora: st.calculadora,
        informado: undefined,
        diferenca: undefined,
        diferencaPercentual: undefined,
        tolerancia: tol,
        status: 'NAO_INFORMADO',
        isFirstDivergence: false,
      };
    }

    const dif = Math.round((st.calculadora - st.informado) * 100) / 100;
    const absDif = Math.abs(dif);
    const pct =
      st.informado > 0
        ? Math.round((absDif / st.informado) * 10000) / 100
        : undefined;

    let status: StatusConferenciaEtapa = 'OK';
    if (absDif === 0) {
      status = 'OK';
    } else if (absDif <= tol) {
      status = 'DENTRO_DA_TOLERANCIA';
    } else {
      status = 'DIVERGENTE';
    }

    const isFirst = status === 'DIVERGENTE' && !foundFirst;
    if (isFirst) {
      foundFirst = true;
    }

    const item: EtapaConferenciaItem = {
      id: st.id,
      etapaNumero: st.numero,
      etapaNome: st.nome,
      calculadora: st.calculadora,
      informado: st.informado,
      diferenca: dif,
      diferencaPercentual: pct,
      tolerancia: tol,
      status,
      isFirstDivergence: isFirst,
    };

    if (isFirst) {
      primeiraDivergencia = item;
    }

    return item;
  });

  return { etapas, primeiraDivergencia };
}

/**
 * 3. Diagnóstico e Classificação da Divergência (Seções 14, 15 e 17)
 */
export function buildDivergenceDiagnosis(
  result: CalculationResultData,
  inputs: ConferenciaSistemaInputs,
  primeiraDivergencia?: EtapaConferenciaItem,
  etapas?: EtapaConferenciaItem[]
): DiagnosticoDivergencia {
  if (!primeiraDivergencia) {
    return {
      temDivergencia: false,
      diferencaAbsoluta: 0,
      categoriaProvavel: 'inconclusivo',
      categoriaTitulo: 'Sem Divergências',
      descricaoDiagnostico:
        'Todos os valores informados pelo sistema coincidem com o cálculo da calculadora (ou estão estritamente dentro da tolerância configurada).',
      possiveisMotivos: [],
      pontosConferir: [],
      fatoVsHipotese: {
        fatos: ['Cálculo validado em todas as etapas comparadas.'],
        hipoteses: [],
      },
    };
  }

  const dif = Math.abs(primeiraDivergencia.diferenca || 0);
  const etapaId = primeiraDivergencia.id;

  // Lógica de auditoria para classificar a provável causa
  let categoria: DiagnosticoDivergencia['categoriaProvavel'] = 'inconclusivo';
  let categoriaTitulo = 'Divergência a Apurar';
  let descricao = '';
  const motivos: string[] = [];
  const pontosConferir: string[] = [];
  const fatos: string[] = [];
  const hipoteses: string[] = [];

  fatos.push(
    `Primeira divergência detectada na etapa: "${primeiraDivergencia.etapaNome}".`
  );
  fatos.push(
    `Valor da calculadora: ${formatBRL(primeiraDivergencia.calculadora)} vs Valor informado: ${formatBRL(primeiraDivergencia.informado || 0)}.`
  );
  fatos.push(
    `Diferença apurada: ${formatBRL(primeiraDivergencia.diferenca || 0)} (Tolerância configurada: ${formatBRL(primeiraDivergencia.tolerancia)}).`
  );

  // Análise 1: Diferença de arredondamento (centavos)
  if (dif <= 0.05) {
    categoria = 'arredondamento';
    categoriaTitulo = 'Arredondamento de Centavos';
    descricao =
      'A diferença identificada é de poucos centavos (≤ R$ 0,05), típica de momentos ou métodos distintos de truncamento/arredondamento nas parcelas intermediárias.';
    motivos.push('Arredondamento em 2 casas decimais nas alíquotas intermediárias.');
    motivos.push('Truncamento do sistema de folha vs arredondamento padrão matemático (half-up).');
    pontosConferir.push('Política de arredondamento do sistema de folha de pagamento.');
    pontosConferir.push('Configuração da tolerância aceitável na conferência.');
    hipoteses.push('O sistema externo pode estar truncando os centavos em vez de arredondar pela norma ABNT.');
  } else if (etapaId === 'proventos') {
    categoria = 'dados_entrada';
    categoriaTitulo = 'Dados de Entrada / Vencimentos Diferentes';
    descricao =
      'O total de proventos brutos informado diverge do total de vencimentos da calculadora. Como os proventos alimentam toda a cadeia de cálculo, essa diferença se propaga para INSS, IRRF e Pensão.';
    motivos.push('Falta de inclusão de alguma verba na calculadora ou no sistema.');
    motivos.push('Valor de salário base, adicionais, horas extras ou médias digitado com divergência.');
    pontosConferir.push('Verifique o contracheque ou espelho de cálculo original do colaborador.');
    pontosConferir.push('Confira a digitação de cada provento cadastrado.');
    hipoteses.push('Pode haver rubrica variável adicional paga na folha que não foi lançada na calculadora.');
  } else if (etapaId === 'inss') {
    categoria = 'tabela_diferente';
    categoriaTitulo = 'Base ou Tabela de INSS Divergente';
    descricao =
      'O INSS apurado na calculadora diverge do INSS do sistema antes de qualquer divergência em Pensão ou IRRF.';
    motivos.push('Ano/competência da tabela progressiva do INSS diferente (ex: 2025 vs 2026).');
    motivos.push('Incidência previdenciária de alguma verba configurada incorretamente.');
    motivos.push('Aplicação de teto máximo do INSS ou alíquotas progressivas divergentes.');
    pontosConferir.push('Tabela de INSS utilizada no sistema de folha para o ano de vigência.');
    pontosConferir.push('Incidência de INSS em cada verba informada.');
    hipoteses.push('O sistema de folha pode ter considerado verba indenizatória na base do INSS.');
  } else if (etapaId === 'irrf') {
    categoria = 'tabela_diferente';
    categoriaTitulo = 'Base ou Tabela de IRRF Divergente';
    descricao =
      'O imposto de renda retido na fonte divergiu antes da pensão ou em desacordo com as deduções legais.';
    motivos.push('Aplicação da nova regra de redutor adicional de 2026 vs tabela tradicional.');
    motivos.push('Critério do desconto simplificado mensal vs deduções legais completas.');
    motivos.push('Quantidade de dependentes ou dedução de pensão no IRRF divergente.');
    pontosConferir.push('Verifique se o sistema utilizou o Desconto Simplificado ou Deduções Legais.');
    pontosConferir.push('Confira se a pensão alimentícia já está deduzida na base do IRRF do sistema.');
    hipoteses.push('O sistema pode não estar aplicando a regra de redutor gradativo de 2026.');
  } else if (etapaId === 'base_pensao') {
    categoria = 'base_diferente';
    categoriaTitulo = 'Composição da Base da Pensão Divergente';
    descricao =
      'A base de cálculo da pensão diverge do valor apurado pela calculadora, indicando que uma ou mais verbas ou deduções foram consideradas diferentemente.';
    motivos.push('Verbas como horas extras, adicionais ou gratificações incluídas no sistema e excluídas na calculadora (ou vice-versa).');
    motivos.push('Dedução de INSS e/ou IRRF permitida pela determinação judicial não aplicada no sistema.');
    motivos.push('Dedução de outros descontos (ex: vale transporte, plano de saúde) na base da pensão.');
    pontosConferir.push('Termo do acordo ou sentença judicial para verificar as verbas expressamente integrantes da pensão.');
    pontosConferir.push('Verifique a ferramenta "Comparar Bases" abaixo para localizar o item exato.');
    hipoteses.push('O sistema de folha pode estar utilizando base bruta em vez de líquida de encargos.');
  } else if (etapaId === 'pensao') {
    categoria = 'regra_pensao_diferente';
    categoriaTitulo = 'Regra ou Percentual de Pensão Divergente';
    descricao =
      'A base de cálculo está correta ou próxima, mas o valor final da pensão divergiu, indicando diferença de percentual, valor fixo, piso ou teto.';
    motivos.push('Percentual de pensão divergente (ex: 20% vs 25% ou 30%).');
    motivos.push('Piso mínimo estipulado em salários mínimos ou teto máximo judicial aplicado.');
    motivos.push('Regra de valor fixo + adicional não cadastrada.');
    pontosConferir.push('Ofício judicial de alimentos com a regra exata fixada pelo juiz.');
    pontosConferir.push('Verifique a "Conferência Inversa" para identificar o percentual equivalente.');
    hipoteses.push('Pode haver acréscimo de despesa extraordinária (ex: educação/saúde) somada ao valor.');
  } else if (etapaId === 'liquido') {
    categoria = 'valor_informado_incorreto';
    categoriaTitulo = 'Divergência nos Descontos ou Líquido';
    descricao =
      'A pensão e os encargos coincidem, mas o valor líquido da folha divergiu, provavelmente por outros descontos não informados.';
    motivos.push('Descontos adicionais na folha (farmácia, previdência privada, consignado, etc.)');
    motivos.push('Arredondamento final de folha.');
    pontosConferir.push('Lançamentos de descontos facultativos no holerite.');
    hipoteses.push('O colaborador pode ter adiantamento quinzenal ou desconto de benefícios lançado na folha.');
  } else {
    categoria = 'inconclusivo';
    categoriaTitulo = 'Divergência Inconclusiva';
    descricao =
      'Foi identificada uma diferença, mas os dados disponíveis não permitem determinar sua causa com segurança.';
    motivos.push('Multiplicidade de variáveis divergentes sem padrão isolado.');
    pontosConferir.push('Base de cálculo utilizada no sistema de folha;');
    pontosConferir.push('Incidência de verbas ou adicionais;');
    pontosConferir.push('Regra ou percentual de pensão aplicado;');
    pontosConferir.push('Tabela de IRRF ou dedução utilizada;');
    pontosConferir.push('Arredondamento e momento de aplicação;');
    pontosConferir.push('Valores de entrada informados.');
    hipoteses.push('Recomenda-se preencher todas as etapas da conferência para isolar o ponto de desvio.');
  }

  return {
    temDivergencia: true,
    primeiraEtapaDivergente: primeiraDivergencia.etapaNome,
    diferencaAbsoluta: dif,
    diferencaPercentual: primeiraDivergencia.diferencaPercentual,
    categoriaProvavel: categoria,
    categoriaTitulo,
    descricaoDiagnostico: descricao,
    possiveisMotivos: motivos,
    pontosConferir,
    fatoVsHipotese: { fatos, hipoteses },
  };
}

/**
 * 4. Comparação Detalhada de Bases Componente a Componente (Seção 18)
 */
export function buildBaseComparison(
  earnings: EarningItem[],
  baseInformada?: Record<string, number>
): ComparacaoBaseItem[] {
  if (!baseInformada) {
    return earnings.map((e) => ({
      componenteId: e.id,
      label: e.label,
      calculadora: e.includedInPensionBase ? e.value : 0,
      informado: undefined,
      diferenca: 0,
      status: 'OK',
    }));
  }

  return earnings.map((e) => {
    const calcVal = e.includedInPensionBase ? e.value : 0;
    const infVal = baseInformada[e.id];

    if (infVal === undefined) {
      return {
        componenteId: e.id,
        label: e.label,
        calculadora: calcVal,
        informado: undefined,
        diferenca: 0,
        status: 'OK',
      };
    }

    const dif = Math.round((calcVal - infVal) * 100) / 100;
    return {
      componenteId: e.id,
      label: e.label,
      calculadora: calcVal,
      informado: infVal,
      diferenca: dif,
      status: Math.abs(dif) > 0.01 ? 'DIVERGENTE' : 'OK',
    };
  });
}

/**
 * 5. Comparação Lado a Lado de Regras (Seção 19)
 */
export function buildRuleComparison(
  rule: PensionRuleConfig,
  earnings: EarningItem[],
  deductions: DeductionItem[],
  regraInformada?: ConferenciaSistemaInputs['regraInformada']
): ComparacaoRegraItem[] {
  const verbasCalc = earnings
    .filter((e) => e.includedInPensionBase && e.value > 0)
    .map((e) => e.label)
    .join(', ') || 'Nenhuma verba ativa';

  const descCalc = deductions
    .filter((d) => d.deductFromPensionBase && d.value > 0)
    .map((d) => d.label)
    .join(', ') || 'Nenhum desconto ativo';

  const baseRotuloCalc =
    rule.baseType === 'bruta'
      ? 'Remuneração Bruta'
      : rule.baseType === 'apos_inss'
      ? 'Após INSS'
      : rule.baseType === 'apos_inss_irrf'
      ? 'Após INSS e IRRF (Líquido Legal)'
      : rule.baseType === 'liquida'
      ? 'Líquido Total'
      : 'Personalizada';

  const isSplitRule = Boolean(
    rule.rateioBeneficiariosAtivo && rule.beneficiarios && rule.beneficiarios.length > 0
  );
  const splitSumPct = isSplitRule
    ? Math.round((rule.beneficiarios || []).reduce((acc, b) => acc + (b.percentual || 0), 0) * 100) / 100
    : rule.percentage;
  const splitSumFixed = isSplitRule
    ? Math.round((rule.beneficiarios || []).reduce((acc, b) => acc + (b.valorFixo || 0), 0) * 100) / 100
    : rule.fixedValue;

  const pctValorCalculadora = isSplitRule
    ? rule.ruleType === 'valor_fixo'
      ? `${(rule.beneficiarios || [])
          .map((b) => `${b.label}: ${formatBRL(b.valorFixo || 0)}`)
          .join(' + ')} (Soma: ${formatBRL(splitSumFixed)} · Evento único)`
      : rule.ruleType === 'percentual_adicional'
      ? `${(rule.beneficiarios || [])
          .map((b) => `${b.label}: ${formatPercentage(b.percentual || 0)} + ${formatBRL(b.valorFixo || 0)}`)
          .join(' + ')} (Soma: ${formatPercentage(splitSumPct)} · Evento único)`
      : `${(rule.beneficiarios || [])
          .map((b) => `${b.label}: ${formatPercentage(b.percentual || 0)}`)
          .join(' + ')} (Soma: ${formatPercentage(splitSumPct)} · Evento único)`
    : rule.ruleType === 'percentual'
    ? formatPercentage(rule.percentage)
    : rule.ruleType === 'valor_fixo'
    ? formatBRL(rule.fixedValue)
    : `${formatPercentage(rule.percentage)} + ${formatBRL(rule.additionalValue || 0)}`;

  if (!regraInformada) {
    return [
      { campo: 'Tipo de Regra', calculadora: rule.ruleType === 'percentual' ? 'Percentual' : rule.ruleType === 'valor_fixo' ? 'Valor Fixo' : 'Percentual + Fixo', informado: '—', status: 'IGUAL' },
      { campo: 'Percentual / Valor', calculadora: pctValorCalculadora, informado: '—', status: 'IGUAL' },
      { campo: 'Modalidade da Base', calculadora: baseRotuloCalc, informado: '—', status: 'IGUAL' },
      { campo: 'Verbas Integrantes', calculadora: verbasCalc, informado: '—', status: 'IGUAL' },
      { campo: 'Deduções Autorizadas', calculadora: descCalc, informado: '—', status: 'IGUAL' },
    ];
  }

  const tipoInformado = regraInformada.tipo === 'percentual' ? 'Percentual' : regraInformada.tipo === 'valor_fixo' ? 'Valor Fixo' : '—';
  const pctInformado = regraInformada.percentual !== undefined ? formatPercentage(regraInformada.percentual) : '—';
  const baseInformada = regraInformada.baseTipo || '—';
  const verbasInf = regraInformada.verbasIncluidasTexto || '—';
  const descInf = regraInformada.descontosTexto || '—';

  const items: ComparacaoRegraItem[] = [
    {
      campo: 'Tipo de Regra',
      calculadora: rule.ruleType === 'percentual' ? 'Percentual' : rule.ruleType === 'valor_fixo' ? 'Valor Fixo' : 'Percentual + Fixo',
      informado: tipoInformado,
      status: regraInformada.tipo && regraInformada.tipo !== rule.ruleType ? 'REGRA_DIFERENTE' : 'IGUAL',
    },
    {
      campo: 'Percentual / Valor',
      calculadora: pctValorCalculadora,
      informado: pctInformado,
      status:
        regraInformada.percentual !== undefined &&
        Math.abs(regraInformada.percentual - splitSumPct) > 0.01
          ? 'REGRA_DIFERENTE'
          : 'IGUAL',
    },
    {
      campo: 'Modalidade da Base',
      calculadora: baseRotuloCalc,
      informado: baseInformada,
      status:
        baseInformada !== '—' && baseInformada.toLowerCase() !== baseRotuloCalc.toLowerCase()
          ? 'REGRA_DIFERENTE'
          : 'IGUAL',
    },
    {
      campo: 'Verbas Integrantes',
      calculadora: verbasCalc,
      informado: verbasInf,
      status: verbasInf !== '—' && verbasInf !== verbasCalc ? 'REGRA_DIFERENTE' : 'IGUAL',
    },
    {
      campo: 'Deduções Autorizadas',
      calculadora: descCalc,
      informado: descInf,
      status: descInf !== '—' && descInf !== descCalc ? 'REGRA_DIFERENTE' : 'IGUAL',
    },
  ];

  return items;
}

/**
 * 6. Conferência Inversa: "Qual percentual produziria o valor informado?" (Seção 20)
 */
export function calculateInverseConference(
  result: CalculationResultData,
  inputs: ConferenciaSistemaInputs
): ConferenciaInversaResult {
  const pensaoInformada = inputs.pensaoSistema;
  const base = result.basePensao;

  if (
    pensaoInformada === undefined ||
    isNaN(pensaoInformada) ||
    pensaoInformada <= 0 ||
    base <= 0
  ) {
    return {
      aplicavel: false,
      valorInformadoPensao: 0,
      baseUtilizada: base,
      percentualEquivalente: 0,
      explicacao:
        'A conferência inversa requer que a pensão informada e a base de cálculo da pensão sejam maiores que zero.',
    };
  }

  const pct = Math.round((pensaoInformada / base) * 10000) / 100;

  return {
    aplicavel: true,
    valorInformadoPensao: pensaoInformada,
    baseUtilizada: base,
    percentualEquivalente: pct,
    explicacao: `Percentual matematicamente equivalente ao valor informado: ${formatBRL(pensaoInformada)} ÷ ${formatBRL(base)} = ${pct}%.\nNota oficial: Esta alíquota representa exclusivamente a razão matemática com a base da calculadora para auxílio na conferência, não substituindo o título judicial.`,
  };
}

/**
 * 7. Simulação de Cenários Comparativos (Seção 21)
 */
export function simulateScenarios(
  result: CalculationResultData,
  earnings: EarningItem[],
  deductions: DeductionItem[]
): CenarioSimulado[] {
  const baseAposInss = Math.max(0, result.totalProventos - result.valorInss);
  const baseAposInssIrrf = result.basePensao; // atual calculada
  const baseBruta = result.totalProventos;

  const cenarios: CenarioSimulado[] = [
    {
      id: 'atual',
      nome: 'Cenário Atual (Calculado)',
      baseTipo: result.regraTexto.includes('bruta')
        ? 'Bruta'
        : result.regraTexto.includes('INSS e IRRF')
        ? 'Após INSS e IRRF'
        : 'Configuração Ativa',
      baseValor: result.basePensao,
      percentual: result.auditLog.percentual || 0,
      pensaoCalculada: result.valorPensao,
      diferencaParaAtual: 0,
    },
    {
      id: 'sim_apos_inss_20',
      nome: 'Simulação: 20% após INSS',
      baseTipo: 'Após INSS',
      baseValor: baseAposInss,
      percentual: 20,
      pensaoCalculada: Math.round(baseAposInss * 0.2 * 100) / 100,
      diferencaParaAtual:
        Math.round((baseAposInss * 0.2 - result.valorPensao) * 100) / 100,
    },
    {
      id: 'sim_apos_inss_30',
      nome: 'Simulação: 30% após INSS',
      baseTipo: 'Após INSS',
      baseValor: baseAposInss,
      percentual: 30,
      pensaoCalculada: Math.round(baseAposInss * 0.3 * 100) / 100,
      diferencaParaAtual:
        Math.round((baseAposInss * 0.3 - result.valorPensao) * 100) / 100,
    },
    {
      id: 'sim_bruta_20',
      nome: 'Simulação: 20% s/ Remuneração Bruta',
      baseTipo: 'Bruta',
      baseValor: baseBruta,
      percentual: 20,
      pensaoCalculada: Math.round(baseBruta * 0.2 * 100) / 100,
      diferencaParaAtual:
        Math.round((baseBruta * 0.2 - result.valorPensao) * 100) / 100,
    },
    {
      id: 'sim_apos_inss_irrf_33',
      nome: 'Simulação: 33,33% (1/3) após INSS + IRRF',
      baseTipo: 'Após INSS e IRRF',
      baseValor: baseAposInssIrrf,
      percentual: 33.33,
      pensaoCalculada: Math.round(baseAposInssIrrf * (1 / 3) * 100) / 100,
      diferencaParaAtual:
        Math.round((baseAposInssIrrf * (1 / 3) - result.valorPensao) * 100) / 100,
    },
  ];

  return cenarios;
}

/**
 * 8. Memória Padronizada Oficial em 12 Etapas (Seção 3)
 */
export function buildStandard12StepMemory(
  result: CalculationResultData,
  identification: IdentificationData,
  earnings: EarningItem[],
  deductions: DeductionItem[],
  rule: PensionRuleConfig,
  irrfConfig: IrrfDeductionsConfig,
  inputs?: ConferenciaSistemaInputs,
  diagnostico?: DiagnosticoDivergencia
): PadraoMemoriaEtapa[] {
  const moduloRotulo = MODULO_NOMES[identification.tipoCalculo] || 'Folha Mensal';

  const etapas: PadraoMemoriaEtapa[] = [
    // Etapa 1 — Dados de entrada
    {
      numero: 1,
      titulo: 'Etapa 1 — Dados de entrada',
      subtitulo: 'Parâmetros informados sem alterações silenciosas',
      descricao:
        'Registro fiel dos dados cadastrais e operacionais fornecidos para o processamento deste cálculo.',
      detalhes: [
        { label: 'Matrícula', value: identification.matricula || 'Não informada' },
        { label: 'Módulo / Tipo', value: moduloRotulo },
        { label: 'Ano de Competência', value: String(identification.ano) },
        { label: 'Competência', value: identification.competencia },
        { label: 'Data de Pagamento', value: identification.dataPagamento || '—' },
        {
          label: 'Dependentes de IRRF',
          value: `${irrfConfig.quantidadeDependentes || 0} dependente(s)`,
        },
      ],
      resultadoDestaque: `Módulo: ${moduloRotulo} | Ano: ${identification.ano}`,
    },

    // Etapa 2 — Regras aplicadas
    {
      numero: 2,
      titulo: 'Etapa 2 — Regras aplicadas',
      subtitulo: 'Fundamentação das regras de pensão, INSS e IRRF',
      descricao:
        'Especificação de cada diretriz legal e judicial aplicada nesta apuração.',
      detalhes: [
        { label: 'Regra da Pensão', value: result.regraTexto },
        {
          label: 'Tipo de Base',
          value:
            rule.baseType === 'bruta'
              ? 'Remuneração Bruta'
              : rule.baseType === 'apos_inss'
              ? 'Após INSS'
              : rule.baseType === 'apos_inss_irrf'
              ? 'Após INSS e IRRF (Líquido Legal)'
              : rule.baseType === 'liquida'
              ? 'Líquido Total'
              : 'Personalizada',
        },
        {
          label: result.rateioBeneficiarios?.ativo
            ? 'Alíquota por Filho (Evento Único)'
            : 'Alíquota / Valor Fixo',
          value: result.rateioBeneficiarios?.ativo
            ? result.regraTexto
            : rule.ruleType === 'percentual'
            ? formatPercentage(rule.percentage)
            : rule.ruleType === 'valor_fixo'
            ? formatBRL(rule.fixedValue)
            : `${formatPercentage(rule.percentage)} + ${formatBRL(rule.additionalValue || 0)}`,
        },
        {
          label: 'Regra de INSS',
          value: `Tabela Progressiva Oficial RGPS ${identification.ano}`,
        },
        {
          label: 'Regra de IRRF',
          value: `Tabela Progressiva RFB ${identification.ano} (com Redutor Gradativo / Simplificado)`,
        },
        {
          label: 'Arredondamento',
          value: 'Padrão Monetário ABNT (2 casas decimais, half-up)',
        },
      ],
      resultadoDestaque: `Diretriz: ${result.regraTexto} (Base: ${rule.baseType})`,
    },

    // Etapa 3 — Composição das verbas
    {
      numero: 3,
      titulo: 'Etapa 3 — Composição das verbas',
      subtitulo: 'Discriminação de cada provento recebido',
      descricao:
        'Relação de todos os vencimentos, adicionais e médias que formam o montante bruto.',
      detalhes: earnings
        .filter((e) => e.value > 0)
        .map((e) => ({
          label: e.label,
          value: formatBRL(e.value),
          badge: e.includedInPensionBase ? 'Entra na pensão' : 'Fora da pensão',
          extra: e.observation,
        })),
      formula: `Total Bruto = ${earnings
        .filter((e) => e.value > 0)
        .map((e) => `${formatBRL(e.value)}`)
        .join(' + ') || 'R$ 0,00'}`,
      resultadoDestaque: `Total Proventos: ${formatBRL(result.totalProventos)}`,
    },

    // Etapa 4 — Base de INSS
    {
      numero: 4,
      titulo: 'Etapa 4 — Base de INSS',
      subtitulo: 'Verbas sujeitas à contribuição previdenciária oficial',
      descricao:
        'Soma dos componentes com incidência ativa para a Previdência Social (RGPS).',
      detalhes: earnings
        .filter((e) => e.incideInss && e.value > 0)
        .map((e) => ({
          label: e.label,
          value: formatBRL(e.value),
          badge: 'Incide INSS',
        })),
      formula: `Base INSS = ${earnings
        .filter((e) => e.incideInss && e.value > 0)
        .map((e) => formatBRL(e.value))
        .join(' + ') || 'R$ 0,00'}`,
      resultadoDestaque: `Base INSS Apurada: ${formatBRL(result.baseInss)}`,
    },

    // Etapa 5 — INSS
    {
      numero: 5,
      titulo: 'Etapa 5 — INSS',
      subtitulo: 'Cálculo progressivo por faixas oficiais',
      descricao:
        'Apuração autônoma executada pelo Motor de INSS conforme tabela oficial vigente.',
      detalhes: result.inssResult?.faixasCalculadas?.map((f) => ({
        label: `Faixa ${f.faixaNumero} (${f.aliquota}% sobre ${formatBRL(f.baseConsideradaNaFaixa)})`,
        value: formatBRL(f.contribuicaoDaFaixa),
        extra: `Faixa de ${formatBRL(f.faixaInicial)} até ${formatBRL(f.faixaFinal)}`,
      })) || [
        { label: 'INSS Apurado', value: formatBRL(result.valorInss) },
      ],
      formula: `INSS = Soma das faixas progressivas (Teto RGPS: ${result.inssResult?.tetoAplicado ? 'Atingido' : 'Não atingido'})`,
      resultadoDestaque: `INSS_CALCULADO = ${formatBRL(result.valorInss)}`,
    },

    // Etapa 6 — Base de IRRF
    {
      numero: 6,
      titulo: 'Etapa 6 — Base de IRRF',
      subtitulo: 'Rendimentos tributáveis e deduções legais autorizadas',
      descricao:
        'Apuração da base tributável considerando proventos tributáveis menos deduções da lei fiscal.',
      detalhes: [
        { label: 'Rendimentos Tributáveis', value: formatBRL(result.irrfResult?.rendimentosTributaveis || (result.baseIrrf + result.valorInss)) },
        { label: '(-) INSS Deduzido', value: `(-) ${formatBRL(result.irrfResult?.deducoes.inss || result.inssDisponivelParaIrrf || result.valorInss)}` },
        {
          label: '(-) Dependentes de IRRF',
          value: `(-) ${formatBRL((result.irrfResult?.deducoes.dependentes.total || 0))}`,
        },
        {
          label: '(-) Pensão Alimentícia no IRRF',
          value: `(-) ${formatBRL((result.irrfResult?.deducoes.pensaoAlimenticia || 0))}`,
          ...(result.rateioBeneficiarios?.ativo && (result.irrfResult?.deducoes.pensaoAlimenticia || 0) > 0
            ? {
                extra: `Soma consolidada: ${result.rateioBeneficiarios.beneficiarios
                  .map((b) => `${b.label} (${formatBRL(b.valorCalculado)})`)
                  .join(' + ')}`,
              }
            : {}),
        },
      ],
      formula: 'Base IRRF = Rendimentos Tributáveis − INSS − Dependentes − Pensão − Outras deduções',
      resultadoDestaque: `Base IRRF = ${formatBRL(result.baseIrrf)}`,
    },

    // Etapa 7 — IRRF
    {
      numero: 7,
      titulo: 'Etapa 7 — IRRF',
      subtitulo: 'Tributação fiscal apurada pelo Motor de IRRF',
      descricao:
        'Aplicação da tabela da RFB com análise comparativa de benefício fiscal (Simplificado vs Legal).',
      detalhes: [
        {
          label: 'Método / Tabela',
          value: `Tabela RFB ${result.irrfResult?.ano || 2026}`,
          badge: 'Critério oficial mais benéfico',
        },
        {
          label: 'Alíquota da Faixa',
          value: `${result.irrfResult?.aliquotaAplicada || 0}% (Faixa ${result.irrfResult?.faixaAplicada?.faixaNumero || 1})`,
        },
        {
          label: 'Parcela a Deduzir',
          value: formatBRL(result.irrfResult?.parcelaDeduzirAplicada || 0),
        },
        {
          label: 'Redutor Gradativo / Isenção 2026',
          value: formatBRL(result.irrfResult?.valorRedutorAplicado || 0),
        },
      ],
      formula: 'IRRF = (Base × Alíquota) − Parcela a Deduzir − Redutor Gradativo',
      resultadoDestaque: `IRRF_CALCULADO = ${formatBRL(result.valorIrrf)}`,
    },

    // Etapa 8 — Base de pensão
    {
      numero: 8,
      titulo: 'Etapa 8 — Base de pensão',
      subtitulo: 'Montante definitivo que servirá de incidência à pensão',
      descricao:
        'Soma das verbas expressamente integrantes menos as deduções legalmente autorizadas.',
      detalhes: [
        ...result.verbasConsideradasNaBase.map((v) => ({
          label: `(+) ${v.label}`,
          value: formatBRL(v.value),
          badge: 'Verba integrante',
        })),
        ...result.deducoesAutorizadasNaBase.map((d) => ({
          label: `(-) ${d.label}`,
          value: `(-) ${formatBRL(d.value)}`,
          badge: 'Dedução autorizada',
        })),
      ],
      formula: `Base da Pensão = ${formatBRL(result.verbasConsideradasNaBase.reduce((acc, v) => acc + v.value, 0))}${
        result.deducoesAutorizadasNaBase.length > 0
          ? ` ${result.deducoesAutorizadasNaBase
              .map((d) => `− ${formatBRL(d.value)} (${d.id === 'inss' ? 'INSS' : d.id === 'irrf' ? 'IRRF' : d.label})`)
              .join(' ')}`
          : ` − ${formatBRL(0)}`
      } = ${formatBRL(result.basePensao)}`,
      resultadoDestaque: `Base Final da Pensão = ${formatBRL(result.basePensao)}`,
    },

    // Etapa 9 — Pensão
    {
      numero: 9,
      titulo: 'Etapa 9 — Pensão alimentícia',
      subtitulo: 'Aplicação da regra judicial e limites estipulados',
      descricao: result.rateioBeneficiarios?.ativo
        ? 'Cálculo separado multiplicando a base pelo percentual de cada filho e consolidando a soma em um evento único na folha.'
        : 'Multiplicação da base pela alíquota estipulada em acordo/sentença ou fixação de valor estipulado.',
      detalhes: [
        {
          label: 'Base Utilizada',
          value: formatBRL(result.basePensao),
          ...(result.deducoesAutorizadasNaBase.length > 0
            ? {
                extra: `Após dedução de: ${result.deducoesAutorizadasNaBase
                  .map((d) => `${d.id === 'inss' ? 'INSS' : d.id === 'irrf' ? 'IRRF' : d.label} (${formatBRL(d.value)})`)
                  .join(' e ')}`,
              }
            : {}),
        },
        { label: 'Regra Aplicada', value: result.regraTexto },
        ...(result.rateioBeneficiarios?.ativo
          ? result.rateioBeneficiarios.beneficiarios.map((b) => ({
              label: `${b.label} (${b.percentual !== undefined ? formatPercentage(b.percentual) : formatBRL(b.valorFixo || 0)})`,
              value: formatBRL(b.valorCalculado),
              extra:
                b.percentual !== undefined
                  ? `${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)}`
                  : 'Cota fixa',
            }))
          : []),
        {
          label: 'Valor Pré-Arredondamento',
          value: `R$ ${result.valorAntesArredondamento.toFixed(4)}`,
        },
        {
          label: 'Piso Mínimo Aplicado?',
          value: result.minimoAplicado ? 'Sim' : 'Não',
        },
        {
          label: 'Teto Máximo Aplicado?',
          value: result.tetoAplicado ? 'Sim' : 'Não',
        },
      ],
      formula: result.rateioBeneficiarios?.ativo
        ? `${result.rateioBeneficiarios.beneficiarios
            .map((b) =>
              b.percentual !== undefined
                ? `${b.label} = ${formatBRL(b.baseAplicada)} × ${formatPercentage(b.percentual)} = ${formatBRL(b.valorCalculado)}`
                : `${b.label} = ${formatBRL(b.valorCalculado)}`
            )
            .join('\n')}\nEVENTO ÚNICO (${
            result.rateioBeneficiarios.somaPercentuais !== undefined
              ? `Soma: ${formatPercentage(result.rateioBeneficiarios.somaPercentuais)}`
              : `${result.rateioBeneficiarios.quantidadeBeneficiarios} cotas`
          }) = ${result.rateioBeneficiarios.beneficiarios
            .map((b) => formatBRL(b.valorCalculado))
            .join(' + ')} = ${formatBRL(result.valorPensao)}`
        : rule.ruleType === 'percentual'
        ? `Pensão = ${formatBRL(result.basePensao)} × ${formatPercentage(rule.percentage)} = ${formatBRL(result.valorPensao)}`
        : rule.ruleType === 'valor_fixo'
        ? `Pensão = Valor Fixo Estipulado = ${formatBRL(result.valorPensao)}`
        : `Pensão = (${formatBRL(result.basePensao)} × ${formatPercentage(rule.percentage)}) + ${formatBRL(rule.additionalValue || 0)} = ${formatBRL(result.valorPensao)}`,
      resultadoDestaque: `PENSÃO ALIMENTÍCIA APURADA = ${formatBRL(result.valorPensao)}`,
    },

    // Etapa 10 — Outros descontos
    {
      numero: 10,
      titulo: 'Etapa 10 — Outros descontos',
      subtitulo: 'Deduções operacionais e benefícios no líquido',
      descricao:
        'Descontos facultativos ou contratuais que incidem sobre o líquido do colaborador.',
      detalhes: deductions
        .filter((d) => !d.id.includes('inss') && !d.id.includes('irrf') && d.value > 0)
        .map((d) => ({
          label: d.label,
          value: formatBRL(d.value),
          extra: d.observation,
        })),
      formula: `Outros Descontos = ${formatBRL(result.outrosDescontos)}`,
      resultadoDestaque: `Outros Descontos: ${formatBRL(result.outrosDescontos)}`,
    },

    // Etapa 11 — Valor líquido
    {
      numero: 11,
      titulo: 'Etapa 11 — Valor líquido',
      subtitulo: 'Fechamento financeiro da folha / saldo disponível',
      descricao:
        'Demonstrativo exato do montante final a ser creditado ao colaborador após todas as retenções.',
      detalhes: [
        { label: '(+) Total de Proventos', value: formatBRL(result.totalProventos) },
        { label: '(-) INSS', value: `(-) ${formatBRL(result.valorInss)}` },
        { label: '(-) IRRF', value: `(-) ${formatBRL(result.valorIrrf)}` },
        { label: '(-) Pensão Alimentícia', value: `(-) ${formatBRL(result.valorPensao)}` },
        { label: '(-) Outros Descontos', value: `(-) ${formatBRL(result.outrosDescontos)}` },
      ],
      formula: `Líquido = ${formatBRL(result.totalProventos)} − ${formatBRL(result.valorInss)} − ${formatBRL(result.valorIrrf)} − ${formatBRL(result.valorPensao)} − ${formatBRL(result.outrosDescontos)}`,
      resultadoDestaque: `VALOR LÍQUIDO A PAGAR = ${formatBRL(result.liquidoAposPensao)}`,
    },

    // Etapa 12 — Conferência
    {
      numero: 12,
      titulo: 'Etapa 12 — Conferência e Rastreabilidade',
      subtitulo: 'Auditoria comparativa entre a Calculadora e o Sistema de Folha',
      descricao:
        inputs?.ativo
          ? 'Comparação dos valores calculados contra os dados informados do sistema de folha de pagamento.'
          : 'Aguardando inserção de dados externos do sistema de folha para auditoria comparativa.',
      detalhes: inputs?.ativo
        ? [
            {
              label: 'Status Geral',
              value: diagnostico?.temDivergencia ? 'Divergência Detectada' : 'Validado sem Divergências',
              badge: diagnostico?.temDivergencia ? 'Alerta DP' : 'Conforme',
            },
            {
              label: 'Pensão Calculada vs Sistema',
              value: `${formatBRL(result.valorPensao)} vs ${formatBRL(inputs.pensaoSistema || 0)}`,
              extra: `Diferença: ${formatBRL(Math.abs(result.valorPensao - (inputs.pensaoSistema || 0)))}`,
            },
            {
              label: 'Tolerância Configurada',
              value: formatBRL(inputs.toleranciaCentavos || 0),
            },
          ]
        : [
            {
              label: 'Módulo de Conferência',
              value: 'Pronto para receber dados do sistema de folha na aba "Conferência"',
            },
          ],
      resultadoDestaque: diagnostico?.temDivergencia
        ? `Status: Divergente na etapa ${diagnostico.primeiraEtapaDivergente || 'Pensão'}`
        : 'Status: Auditoria Conforme',
      statusConferencia: diagnostico?.temDivergencia ? 'DIVERGENTE' : 'OK',
    },
  ];

  return etapas;
}

/**
 * 9. Constrói o Resumo Executivo (Seção 24)
 */
export function buildExecutiveSummary(
  result: CalculationResultData,
  identification: IdentificationData,
  inputs?: ConferenciaSistemaInputs,
  diagnostico?: DiagnosticoDivergencia
): ResultadoExecutivoConsolidado {
  const moduloRotulo = MODULO_NOMES[identification.tipoCalculo] || 'Folha Mensal';

  if (!inputs?.ativo || !inputs.pensaoSistema) {
    return {
      pensaoCalculada: result.valorPensao,
      statusGeral: 'OK',
      statusRotulo: 'Cálculo Concluído (Sem Auditoria Externa)',
      diferencaPura: 0,
      temDivergencia: false,
      moduloRotulo,
      matricula: identification.matricula || 'Sem matrícula',
      dataProcessamento: result.calculatedAt,
      versaoConfiguracao: 'v10.0 (Fase 10 Consolidação)',
    };
  }

  const dif = Math.abs(result.valorPensao - (inputs.pensaoSistema || 0));
  const temDiv = Boolean(diagnostico?.temDivergencia);

  let statusGeral: StatusExecutivoGeral = 'OK';
  let statusRotulo = 'Conferência OK (Sem Divergências)';

  if (temDiv) {
    statusGeral = 'DIVERGENCIA';
    statusRotulo = `Divergência (${diagnostico?.primeiraEtapaDivergente || 'Pensão'})`;
  }

  return {
    pensaoCalculada: result.valorPensao,
    statusGeral,
    statusRotulo,
    diferencaPura: dif,
    temDivergencia: temDiv,
    primeiraDivergenciaEtapa: diagnostico?.primeiraEtapaDivergente,
    moduloRotulo,
    matricula: identification.matricula || 'Sem matrícula',
    dataProcessamento: result.calculatedAt,
    versaoConfiguracao: 'v10.0 (Fase 10 Consolidação)',
  };
}

/**
 * 10. Prepara o Payload de Exportação Estruturado (Seção 26)
 */
export function buildExportPayload(
  result: CalculationResultData,
  identification: IdentificationData,
  earnings: EarningItem[],
  deductions: DeductionItem[],
  rule: PensionRuleConfig,
  irrfConfig: IrrfDeductionsConfig,
  etapasConferencia: EtapaConferenciaItem[],
  inputs?: ConferenciaSistemaInputs,
  diagnostico?: DiagnosticoDivergencia,
  inversa?: ConferenciaInversaResult
): RelatorioConsolidacaoExportacao {
  return {
    versaoCalculo: 'Fase 10 — Consolidação e Memória Auditável',
    dataHoraProcessamento: result.calculatedAt,
    identificacao: identification,
    modulo: identification.tipoCalculo,
    moduloRotulo: MODULO_NOMES[identification.tipoCalculo] || 'Folha Mensal',
    entradas: {
      salarioEVerbas: earnings,
      descontosInformados: deductions,
      parametrosIrrf: irrfConfig,
    },
    regras: {
      regraPensao: rule,
      origemRegra: rule.origemRegraPlr || rule.origemRegraRescisao || 'geral',
      tabelaInssUtilizada: `INSS Oficial RGPS ${identification.ano}`,
      tabelaIrrfUtilizada: `IRRF RFB ${identification.ano}`,
      arredondamento: 'Padrao 2 decimais monetario (half-up)',
    },
    bases: {
      baseInss: result.baseInss,
      baseIrrf: result.baseIrrf,
      basePensao: result.basePensao,
    },
    resultados: {
      totalBruto: result.totalProventos,
      inssCalculado: result.valorInss,
      irrfCalculado: result.valorIrrf,
      pensaoCalculada: result.valorPensao,
      outrosDescontos: result.outrosDescontos,
      liquidoFinal: result.liquidoAposPensao,
    },
    conferencia: {
      valoresInformados: inputs,
      tabelaEtapas: etapasConferencia,
      diagnostico,
      conferenciaInversa: inversa,
    },
  };
}
