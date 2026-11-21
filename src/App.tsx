/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  CalculationResultData,
  CalculationType,
  DeductionItem,
  EarningItem,
  IdentificationData,
  PensionBaseType,
  PensionBeneficiaryItem,
  PensionRuleConfig,
  RescisaoMediaItem,
  TypeSpecificProfile,
  ValidationError,
  PlrRegraConfig,
  PlrParcelamentoConfig,
} from './types/pension';
import { IrrfDeductionsConfig } from './types/irrf';
import {
  AppNavView,
  CalculoHistoricoCompleto,
  GeneralSettings,
  RegraPensaoCadastrada,
  StatusCalculoHistorico,
  VerbaCadastrada,
} from './types/phase11';
import {
  executePensionCalculation,
  getInitialProfiles,
  validateCalculationInputs,
} from './utils/calculator';
import { computeFeriasSplitInfo } from './utils/feriasSplit';
import {
  DEFAULT_GENERAL_SETTINGS,
  INITIAL_CATALOG_VERBAS,
  INITIAL_SAVED_RULES,
} from './constants/initialPhase11Data';

// Componentes da Navegação e Estrutura Final (Fase 11)
import { Navigation } from './components/Navigation';
import { HomeScreen } from './components/HomeScreen';
import { SettingsSection } from './components/SettingsSection';
import { RulesManagerSection } from './components/RulesManagerSection';
import { TablesManagerSection } from './components/TablesManagerSection';
import { EarningsManagerSection } from './components/EarningsManagerSection';
import { HistorySection } from './components/HistorySection';
import { ClearConfirmModal } from './components/ClearConfirmModal';
import { CanonicalImportModal } from './components/CanonicalImportModal';
import { ValidationAlerts } from './components/ValidationAlerts';
import { ContextHelp } from './components/ContextHelp';
import { ExportReportMenu } from './components/ExportReportMenu';

// Componentes de Cálculo e Memória (Fases Anteriores)
import { CalculationTypeSelector } from './components/CalculationTypeSelector';
import { IdentificationSection } from './components/IdentificationSection';
import { PensionRuleSection } from './components/PensionRuleSection';
import { RescisaoSection } from './components/RescisaoSection';
import { PlrSection } from './components/PlrSection';
import { CalculationResult } from './components/CalculationResult';
import { ConsolidationSection } from './components/ConsolidationSection';
import { CalculationMemory } from './components/CalculationMemory';
import { InssMemorySection } from './components/InssMemorySection';
import { IrrfMemorySection } from './components/IrrfMemorySection';
import { ArchitectureNotice } from './components/ArchitectureNotice';
import { LogAlteracaoItem, VersionRegistro } from './types/consolidation';

import {
  Calculator,
  Save,
  RotateCcw,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Sparkles,
  GitBranch,
  FileCode,
  ArrowLeft,
} from 'lucide-react';

const CALC_TYPE_NAMES: Record<CalculationType, string> = {
  folha_mensal: 'Folha Mensal',
  ferias: 'Férias',
  decimo_terceiro: '13º Salário',
  rescisao: 'Rescisão',
  plr: 'PLR',
};

const STORAGE_KEY_PROFILES = 'calculadora_pensao_perfis_v11';
const STORAGE_KEY_SETTINGS = 'calculadora_pensao_settings_v11';
const STORAGE_KEY_RULES = 'calculadora_pensao_regras_v11';
const STORAGE_KEY_VERBAS = 'calculadora_pensao_verbas_v11';
const STORAGE_KEY_HISTORY = 'calculadora_pensao_historico_v11';

export default function App() {
  // 1. Roteamento de Visualização da Aplicação
  const [activeView, setActiveView] = useState<AppNavView>('inicio');

  // 2. Modo Simulação Ativo (Seção 29)
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);

  // 3. Modais
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isCanonicalModalOpen, setIsCanonicalModalOpen] = useState(false);

  // 4. Configurações Gerais do Sistema
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (s) return JSON.parse(s);
    } catch {
      // Fallback
    }
    return DEFAULT_GENERAL_SETTINGS;
  });

  const [settingsNotification, setSettingsNotification] = useState<string | null>(null);

  // 5. Catálogo de Regras de Pensão
  const [savedRules, setSavedRules] = useState<RegraPensaoCadastrada[]>(() => {
    try {
      const r = localStorage.getItem(STORAGE_KEY_RULES);
      if (r) return JSON.parse(r);
    } catch {
      // Fallback
    }
    return INITIAL_SAVED_RULES;
  });

  // 6. Catálogo de Verbas
  const [catalogVerbas, setCatalogVerbas] = useState<VerbaCadastrada[]>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY_VERBAS);
      if (v) return JSON.parse(v);
    } catch {
      // Fallback
    }
    return INITIAL_CATALOG_VERBAS;
  });

  // 7. Histórico Completo de Cálculos Auditáveis
  const [fullHistory, setFullHistory] = useState<CalculoHistoricoCompleto[]>(() => {
    try {
      const h = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (h) return JSON.parse(h);
    } catch {
      // Fallback
    }
    return [];
  });

  // 8. Perfis independentes de cálculo por modalidade
  const [profiles, setProfiles] = useState<Record<CalculationType, TypeSpecificProfile>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILES);
      if (saved) {
        const parsed = JSON.parse(saved) as Record<CalculationType, TypeSpecificProfile>;
        if (parsed?.ferias?.earnings) {
          parsed.ferias.earnings = parsed.ferias.earnings.map((e) =>
            e.id === 'terco_abono' &&
            e.incideIrrf === false &&
            (!e.observation || e.observation === 'Isento de IRRF e INSS')
              ? {
                  ...e,
                  incideIrrf: true,
                  observation: 'Tributa IRRF conforme SC COSIT nº 209/2021 (isento de INSS)',
                  irrfObservation:
                    'Tributável pelo IRRF no curso do contrato (Solução de Consulta COSIT nº 209/2021)',
                }
              : e
          );
        }
        return parsed;
      }
    } catch {
      // Fallback
    }
    return getInitialProfiles();
  });

  // 9. Tipo de Cálculo Selecionado
  const [calculationType, setCalculationType] = useState<CalculationType>('folha_mensal');

  // Perfil ativo
  const currentProfile = profiles[calculationType] || getInitialProfiles().folha_mensal;
  const currentRule = currentProfile.pensionRule;
  const currentEarnings = currentProfile.earnings;
  const currentDeductions = currentProfile.deductions;
  const currentIrrfConfig = currentProfile.irrfConfig;

  // 10. Dados de Identificação
  const [identification, setIdentification] = useState<IdentificationData>({
    matricula: '',
    ano: 2026,
    competencia: 'Janeiro',
    dataPagamento: '2026-02-05',
    tipoCalculo: 'folha_mensal',
  });

  // 11. Resultados e Validações
  const [result, setResult] = useState<CalculationResultData | null>(null);
  const [isResultOutdated, setIsResultOutdated] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // 12. Histórico de Versões e Log de Alterações (Fase 10)
  const [versionsHistory, setVersionsHistory] = useState<VersionRegistro[]>([]);
  const [auditLogs, setAuditLogs] = useState<LogAlteracaoItem[]>([]);

  // Sincronização com LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(generalSettings));
    } catch {}
  }, [generalSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RULES, JSON.stringify(savedRules));
    } catch {}
  }, [savedRules]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_VERBAS, JSON.stringify(catalogVerbas));
    } catch {}
  }, [catalogVerbas]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(fullHistory));
    } catch {}
  }, [fullHistory]);

  const logAudit = (campoAlterado: string, valorAnterior: string, novoValor: string, acaoRealizada: string) => {
    const newLog: LogAlteracaoItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      campoAlterado,
      valorAnterior,
      novoValor,
      acaoRealizada,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Navegação
  const handleNavigate = (view: AppNavView) => {
    setActiveView(view);
    const viewToType: Partial<Record<AppNavView, CalculationType>> = {
      folha: 'folha_mensal',
      ferias: 'ferias',
      decimo: 'decimo_terceiro',
      rescisao: 'rescisao',
      plr: 'plr',
    };
    const nextType = viewToType[view];
    if (nextType) {
      if (nextType !== calculationType) {
        setResult(null);
        setIsResultOutdated(false);
        setValidationErrors([]);
      }
      setCalculationType(nextType);
      setIdentification((prev) => ({ ...prev, tipoCalculo: nextType }));
    }
  };

  const handleToggleSimulationMode = () => {
    setIsSimulationMode((prev) => !prev);
  };

  // Troca de Tipo de Cálculo dentro do Módulo
  const handleTypeChange = (newType: CalculationType) => {
    logAudit('Tipo de Cálculo', CALC_TYPE_NAMES[calculationType], CALC_TYPE_NAMES[newType], 'Mudança de modalidade da folha');
    setCalculationType(newType);
    setIdentification((prev) => ({ ...prev, tipoCalculo: newType }));
    setResult(null);
    setIsResultOutdated(false);
    setValidationErrors([]);

    if (newType === 'folha_mensal') setActiveView('folha');
    else if (newType === 'ferias') setActiveView('ferias');
    else if (newType === 'decimo_terceiro') setActiveView('decimo');
    else if (newType === 'rescisao') setActiveView('rescisao');
    else if (newType === 'plr') setActiveView('plr');
  };

  const handleIdentificationChange = (field: keyof IdentificationData, value: any) => {
    setIdentification((prev) => {
      const next = { ...prev, [field]: value };
      if (next.tipoCalculo === 'ferias' && (field === 'dataInicioFerias' || field === 'diasFerias')) {
        const split = computeFeriasSplitInfo(next.dataInicioFerias, next.diasFerias);
        next.ativarRateioInssFerias = split.spansTwoMonths;
        if (split.isValid) {
          next.ano = split.mes1Ano;
        }
      }
      return next;
    });
    if (result) setIsResultOutdated(true);
    if (validationErrors.length > 0) {
      setValidationErrors((prev) =>
        prev.filter(
          (e) =>
            e.field !== field &&
            e.field !== 'ano_inss' &&
            e.field !== 'ano_irrf' &&
            e.field !== 'dataInicioFerias' &&
            e.field !== 'diasFerias'
        )
      );
    }
  };

  // Atualização da Regra de Pensão do Perfil Ativo
  const handleUpdatePensionRule = (field: keyof PensionRuleConfig, value: any) => {
    const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

    setProfiles((prev) => {
      const activeProf = prev[calculationType];
      const updatedRule: PensionRuleConfig = { ...activeProf.pensionRule, [field]: value };

      if (field === 'rateioBeneficiariosAtivo') {
        if (value === true) {
          updatedRule.eventoUnicoFolha = updatedRule.eventoUnicoFolha ?? true;
          if (!updatedRule.beneficiarios || updatedRule.beneficiarios.length < 2) {
            const totalPct = updatedRule.percentage > 0 ? updatedRule.percentage : 30;
            const totalFix =
              updatedRule.ruleType === 'valor_fixo'
                ? updatedRule.fixedValue || 0
                : updatedRule.additionalValue || 0;
            const c1Pct = round2(totalPct / 2);
            const c2Pct = round2(totalPct - c1Pct);
            const c1Fix = round2(totalFix / 2);
            const c2Fix = round2(totalFix - c1Fix);
            updatedRule.beneficiarios = [
              { id: 'ben_1', label: '1º Filho', percentual: c1Pct, valorFixo: c1Fix },
              { id: 'ben_2', label: '2º Filho', percentual: c2Pct, valorFixo: c2Fix },
            ];
            updatedRule.percentage = round2(c1Pct + c2Pct);
          } else {
            updatedRule.percentage = round2(
              updatedRule.beneficiarios.reduce((acc, b) => acc + (b.percentual || 0), 0)
            );
          }
        }
      } else if (field === 'beneficiarios') {
        const list = (value || []) as PensionBeneficiaryItem[];
        updatedRule.beneficiarios = list;
        if (updatedRule.rateioBeneficiariosAtivo && list.length > 0) {
          updatedRule.percentage = round2(list.reduce((acc, b) => acc + (b.percentual || 0), 0));
          if (updatedRule.ruleType === 'valor_fixo') {
            updatedRule.fixedValue = round2(list.reduce((acc, b) => acc + (b.valorFixo || 0), 0));
          } else if (updatedRule.ruleType === 'percentual_adicional') {
            updatedRule.additionalValue = round2(list.reduce((acc, b) => acc + (b.valorFixo || 0), 0));
          }
        }
      } else if (
        field === 'percentage' &&
        updatedRule.rateioBeneficiariosAtivo &&
        updatedRule.beneficiarios &&
        updatedRule.beneficiarios.length >= 2
      ) {
        const total = Math.max(0, Number(value) || 0);
        const count = updatedRule.beneficiarios.length;
        const baseShare = round2(total / count);
        let accSum = 0;
        updatedRule.beneficiarios = updatedRule.beneficiarios.map((b, idx) => {
          const share = idx === count - 1 ? round2(Math.max(0, total - accSum)) : baseShare;
          accSum = round2(accSum + share);
          return { ...b, percentual: share };
        });
      } else if (
        field === 'fixedValue' &&
        updatedRule.ruleType === 'valor_fixo' &&
        updatedRule.rateioBeneficiariosAtivo &&
        updatedRule.beneficiarios &&
        updatedRule.beneficiarios.length >= 2
      ) {
        const total = Math.max(0, Number(value) || 0);
        const count = updatedRule.beneficiarios.length;
        const baseShare = round2(total / count);
        let accSum = 0;
        updatedRule.beneficiarios = updatedRule.beneficiarios.map((b, idx) => {
          const share = idx === count - 1 ? round2(Math.max(0, total - accSum)) : baseShare;
          accSum = round2(accSum + share);
          return { ...b, valorFixo: share };
        });
      } else if (
        field === 'additionalValue' &&
        updatedRule.ruleType === 'percentual_adicional' &&
        updatedRule.rateioBeneficiariosAtivo &&
        updatedRule.beneficiarios &&
        updatedRule.beneficiarios.length >= 2
      ) {
        const total = Math.max(0, Number(value) || 0);
        const count = updatedRule.beneficiarios.length;
        const baseShare = round2(total / count);
        let accSum = 0;
        updatedRule.beneficiarios = updatedRule.beneficiarios.map((b, idx) => {
          const share = idx === count - 1 ? round2(Math.max(0, total - accSum)) : baseShare;
          accSum = round2(accSum + share);
          return { ...b, valorFixo: share };
        });
      }

      let updatedDeductions = activeProf.deductions;
      let updatedEarnings = activeProf.earnings;

      if (field === 'baseType') {
        const baseType = value as PensionBaseType;
        if (baseType === 'bruta') {
          updatedDeductions = updatedDeductions.map((d) => ({ ...d, deductFromPensionBase: false }));
        } else if (baseType === 'apos_inss') {
          updatedDeductions = updatedDeductions.map((d) => ({
            ...d,
            deductFromPensionBase: d.id.includes('inss'),
          }));
        } else if (baseType === 'apos_inss_irrf') {
          updatedDeductions = updatedDeductions.map((d) => ({
            ...d,
            deductFromPensionBase: d.id.includes('inss') || d.id.includes('irrf'),
          }));
        } else if (baseType === 'liquida') {
          updatedDeductions = updatedDeductions.map((d) => ({ ...d, deductFromPensionBase: true }));
        }
      }

      return {
        ...prev,
        [calculationType]: {
          ...activeProf,
          pensionRule: updatedRule,
          deductions: updatedDeductions,
          earnings: updatedEarnings,
        },
      };
    });

    if (result) setIsResultOutdated(true);
    if (validationErrors.length > 0) {
      setValidationErrors((prev) =>
        prev.filter(
          (e) =>
            e.field !== field &&
            e.field !== 'ruleType' &&
            e.field !== 'beneficiarios' &&
            !e.field.startsWith('beneficiario_') &&
            e.field !== 'dependencia_circular_irrf_pensao'
        )
      );
    }
  };

  // Atualização dos Parâmetros do IRRF
  const handleUpdateIrrfConfig = (field: keyof IrrfDeductionsConfig, value: any) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        irrfConfig: {
          ...prev[calculationType].irrfConfig,
          [field]: value,
        },
      },
    }));

    if (result) setIsResultOutdated(true);
    if (validationErrors.length > 0) {
      setValidationErrors((prev) =>
        prev.filter((e) => e.field !== field && e.field !== 'dependencia_circular_irrf_pensao')
      );
    }
  };

  // Manipulação de Verbas
  const handleToggleEarningInclusion = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) =>
          e.id === id ? { ...e, includedInPensionBase: !e.includedInPensionBase } : e
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleToggleEarningInssIncidence = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) =>
          e.id === id ? { ...e, incideInss: !e.incideInss } : e
        ),
      },
    }));

    if (result) setIsResultOutdated(true);
    if (validationErrors.length > 0) {
      setValidationErrors((prev) => prev.filter((e) => e.field !== `incide_inss_${id}`));
    }
  };

  const handleToggleEarningIrrfIncidence = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) =>
          e.id === id ? { ...e, incideIrrf: !e.incideIrrf } : e
        ),
      },
    }));

    if (result) setIsResultOutdated(true);
    if (validationErrors.length > 0) {
      setValidationErrors((prev) => prev.filter((e) => e.field !== `incide_irrf_${id}`));
    }
  };

  const handleUpdateEarningValue = (id: string, value: number) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) =>
          e.id === id ? { ...e, value } : e
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleUpdateEarningObservation = (id: string, observation: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) =>
          e.id === id ? { ...e, observation } : e
        ),
      },
    }));
  };

  const handleAddEarning = (
    label: string,
    value: number,
    included: boolean,
    incideInss: boolean,
    incideIrrf: boolean,
    observation?: string
  ) => {
    const newItem: EarningItem = {
      id: `custom_earning_${Date.now()}`,
      label,
      value,
      includedInPensionBase: included,
      incideInss,
      incideIrrf,
      observation,
      isCustom: true,
    };
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: [...prev[calculationType].earnings, newItem],
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleRemoveEarning = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.filter((e) => e.id !== id),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  // Manipulação de Deduções
  const handleToggleDeductionInclusion = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, deductFromPensionBase: !d.deductFromPensionBase } : d
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleToggleDeductionLiquido = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, deduzDoLiquido: !(d.deduzDoLiquido ?? true) } : d
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleToggleDeductionIrrf = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, deduzDoIrrf: !Boolean(d.deduzDoIrrf) } : d
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleUpdateDeductionValue = (id: string, value: number) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, value } : d
        ),
      },
    }));
    if (result) setIsResultOutdated(true);
  };

  const handleUpdateDeductionOrder = (id: string, order: number) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, order } : d
        ),
      },
    }));
  };

  const handleUpdateDeductionObservation = (id: string, observation: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.map((d) =>
          d.id === id ? { ...d, observation } : d
        ),
      },
    }));
  };

  const handleAddDeduction = (
    label: string,
    value: number,
    deductsPension: boolean,
    deduzDoLiquido: boolean,
    deduzDoIrrf: boolean,
    order: number,
    observation?: string
  ) => {
    const newItem: DeductionItem = {
      id: `custom_deduction_${Date.now()}`,
      label,
      value,
      deductFromPensionBase: deductsPension,
      deduzDoLiquido,
      deduzDoIrrf,
      order,
      observation,
      isCustom: true,
    };
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: [...prev[calculationType].deductions, newItem],
      },
    }));
  };

  const handleRemoveDeduction = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        deductions: prev[calculationType].deductions.filter((d) => d.id !== id),
      },
    }));
  };

  // Médias Rescisórias
  const handleAddRescisaoMedia = (media: RescisaoMediaItem) => {
    setProfiles((prev) => ({
      ...prev,
      rescisao: {
        ...prev.rescisao,
        rescisaoMedias: [...(prev.rescisao.rescisaoMedias || []), media],
      },
    }));
  };

  const handleRemoveRescisaoMedia = (id: string) => {
    setProfiles((prev) => ({
      ...prev,
      rescisao: {
        ...prev.rescisao,
        rescisaoMedias: (prev.rescisao.rescisaoMedias || []).filter((m) => m.id !== id),
      },
    }));
  };

  // PLR
  const handleUpdatePlrRegra = (field: keyof PlrRegraConfig, value: any) => {
    setProfiles((prev) => ({
      ...prev,
      plr: {
        ...prev.plr,
        plrRegraConfig: {
          ...(prev.plr.plrRegraConfig || getInitialProfiles().plr.plrRegraConfig!),
          [field]: value,
        },
      },
    }));
  };

  const handleUpdatePlrParcelamento = (field: keyof PlrParcelamentoConfig, value: any) => {
    setProfiles((prev) => ({
      ...prev,
      plr: {
        ...prev.plr,
        plrParcelamento: {
          ...(prev.plr.plrParcelamento || getInitialProfiles().plr.plrParcelamento!),
          [field]: value,
        },
      },
    }));
  };

  // Ações de Salvar e Executar Cálculo
  const handleSaveRule = () => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILES, JSON.stringify(profiles));
      setSaveSuccessMessage(`Regra para "${CALC_TYPE_NAMES[calculationType]}" gravada com sucesso!`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    } catch {
      setSaveSuccessMessage(`Regra mantida em memória para "${CALC_TYPE_NAMES[calculationType]}".`);
      setTimeout(() => setSaveSuccessMessage(null), 3500);
    }
  };

  const handleCalculate = () => {
    const errors = validateCalculationInputs(
      identification,
      currentEarnings,
      currentDeductions,
      currentRule,
      currentIrrfConfig
    );

    if (errors.length > 0) {
      setValidationErrors(errors);
      setResult(null);
      setIsResultOutdated(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setValidationErrors([]);
    const calculated = executePensionCalculation(
      identification,
      currentEarnings,
      currentDeductions,
      currentRule,
      currentIrrfConfig
    );
    setResult(calculated);
    setIsResultOutdated(false);

    // Registro no Histórico Completo de Auditoria (Seções 19 a 24)
    const newVersionNum = versionsHistory.length + 1;
    const calcId = `CALC-${String(fullHistory.length + 1).padStart(6, '0')}`;
    const statusGeral: StatusCalculoHistorico = isSimulationMode ? 'atencao' : 'calculado';

    const novoHistoricoItem: CalculoHistoricoCompleto = {
      id: calcId,
      versaoNumero: newVersionNum,
      dataHora: new Date().toLocaleString('pt-BR'),
      modulo: calculationType,
      moduloRotulo: CALC_TYPE_NAMES[calculationType],
      matricula: identification.matricula || 'Sem matrícula',
      ano: identification.ano,
      competencia: identification.competencia,
      dataPagamento: identification.dataPagamento,
      statusCalculo: statusGeral,
      isSimulacao: isSimulationMode,
      identification: { ...identification },
      earnings: [...currentEarnings],
      deductions: [...currentDeductions],
      rule: { ...currentRule },
      irrfConfig: { ...currentIrrfConfig },
      regraNome: `${calculated.regraTexto} s/ ${currentProfile.pensionRule.baseType}`,
      origemRegra: 'modulo',
      totalProventos: calculated.totalProventos,
      baseInss: calculated.baseInss,
      valorInss: calculated.valorInss,
      baseIrrf: calculated.baseIrrf,
      valorIrrf: calculated.valorIrrf,
      basePensao: calculated.basePensao,
      valorPensao: calculated.valorPensao,
      outrosDescontos: calculated.outrosDescontos,
      liquidoAposPensao: calculated.liquidoAposPensao,
      conferidoPorUsuario: false,
      resultadoSnapshot: calculated,
    };

    setFullHistory((prev) => [novoHistoricoItem, ...prev]);

    // Registro da Versão do Cálculo
    const newVersion: VersionRegistro = {
      versionId: `${calcId} (v${newVersionNum})`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      modulo: calculationType,
      moduloRotulo: CALC_TYPE_NAMES[calculationType],
      matricula: identification.matricula || 'Sem matrícula',
      totalProventos: calculated.totalProventos,
      basePensao: calculated.basePensao,
      valorPensao: calculated.valorPensao,
      liquidoAposPensao: calculated.liquidoAposPensao,
      statusGeral: isSimulationMode ? 'Simulação' : 'Concluído',
      temDivergencia: false,
    };
    setVersionsHistory((prev) => [newVersion, ...prev]);

    logAudit(
      'Processamento de Cálculo',
      '—',
      `Pensão: R$ ${calculated.valorPensao.toFixed(2)} | Líquido: R$ ${calculated.liquidoAposPensao.toFixed(2)}`,
      `Geração do ${calcId} (${CALC_TYPE_NAMES[calculationType]})`
    );

    setTimeout(() => {
      const el = document.getElementById('resultado-calculo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleRecalculate = () => {
    handleCalculate();
  };

  const handleConfirmReset = () => {
    setIdentification({
      matricula: '',
      ano: 2026,
      competencia: 'Janeiro',
      dataPagamento: '2026-02-05',
      tipoCalculo: calculationType,
    });
    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        earnings: prev[calculationType].earnings.map((e) => ({ ...e, value: 0 })),
        deductions: prev[calculationType].deductions.map((d) => ({ ...d, value: 0 })),
      },
    }));
    setResult(null);
    setIsResultOutdated(false);
    setValidationErrors([]);
    setIsClearModalOpen(false);
  };

  // Ações de Histórico
  const handleOpenCalculoFromHistory = (item: CalculoHistoricoCompleto) => {
    setCalculationType(item.modulo);
    setIdentification(item.identification);
    setProfiles((prev) => ({
      ...prev,
      [item.modulo]: {
        ...prev[item.modulo],
        earnings: item.earnings,
        deductions: item.deductions,
        pensionRule: item.rule,
        irrfConfig: item.irrfConfig,
      },
    }));
    setResult(item.resultadoSnapshot);
    setIsResultOutdated(false);

    if (item.modulo === 'folha_mensal') setActiveView('folha');
    else if (item.modulo === 'ferias') setActiveView('ferias');
    else if (item.modulo === 'decimo_terceiro') setActiveView('decimo');
    else if (item.modulo === 'rescisao') setActiveView('rescisao');
    else if (item.modulo === 'plr') setActiveView('plr');

    setTimeout(() => {
      const el = document.getElementById('resultado-calculo');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDuplicateCalculo = (item: CalculoHistoricoCompleto) => {
    setCalculationType(item.modulo);
    setIdentification({
      ...item.identification,
      matricula: `${item.identification.matricula}_COPIA`,
    });
    setProfiles((prev) => ({
      ...prev,
      [item.modulo]: {
        ...prev[item.modulo],
        earnings: item.earnings,
        deductions: item.deductions,
        pensionRule: item.rule,
        irrfConfig: item.irrfConfig,
      },
    }));
    setResult(null);
    setIsResultOutdated(false);

    if (item.modulo === 'folha_mensal') setActiveView('folha');
    else if (item.modulo === 'ferias') setActiveView('ferias');
    else if (item.modulo === 'decimo_terceiro') setActiveView('decimo');
    else if (item.modulo === 'rescisao') setActiveView('rescisao');
    else if (item.modulo === 'plr') setActiveView('plr');
  };

  const handleNewVersionCalculo = (item: CalculoHistoricoCompleto) => {
    handleOpenCalculoFromHistory(item);
    // Executa recálculo criando nova versão
    setTimeout(() => {
      handleCalculate();
    }, 200);
  };

  const handleDeleteCalculo = (id: string) => {
    if (window.confirm(`Deseja realmente remover o registro ${id} do histórico?`)) {
      setFullHistory((prev) => prev.filter((h) => h.id !== id));
    }
  };

  // Gerenciamento de Regras Cadastradas
  const handleAddRegra = (r: RegraPensaoCadastrada) => {
    setSavedRules((prev) => [r, ...prev]);
  };

  const handleUpdateRegra = (r: RegraPensaoCadastrada) => {
    setSavedRules((prev) => prev.map((item) => (item.id === r.id ? r : item)));
  };

  const handleDeleteRegra = (id: string) => {
    setSavedRules((prev) => prev.filter((item) => item.id !== id));
  };

  // Gerenciamento de Verbas Cadastradas
  const handleAddVerba = (v: Omit<VerbaCadastrada, 'id'>) => {
    const newV: VerbaCadastrada = {
      ...v,
      id: `vb_${Date.now()}`,
    };
    setCatalogVerbas((prev) => [...prev, newV]);
  };

  const handleUpdateVerba = (id: string, v: Partial<VerbaCadastrada>) => {
    setCatalogVerbas((prev) => prev.map((item) => (item.id === id ? { ...item, ...v } : item)));
  };

  const handleDeleteVerba = (id: string) => {
    setCatalogVerbas((prev) => prev.filter((item) => item.id !== id));
  };

  // Gerenciamento de Configurações Gerais
  const handleUpdateSetting = <K extends keyof GeneralSettings>(field: K, value: GeneralSettings[K]) => {
    setGeneralSettings((prev) => ({ ...prev, [field]: value }));
    setSettingsNotification('Configuração atualizada com sucesso.');
    setTimeout(() => setSettingsNotification(null), 2500);
  };

  const handleResetSettings = () => {
    setGeneralSettings(DEFAULT_GENERAL_SETTINGS);
    setSettingsNotification('Configurações restauradas para os padrões originais.');
    setTimeout(() => setSettingsNotification(null), 2500);
  };

  // Exemplos rápidos
  const handleLoadSample = () => {
    if (calculationType === 'ferias') {
      const feriasIdent: IdentificationData = {
        matricula: 'DP-2026',
        ano: 2026,
        competencia: 'Dezembro',
        periodoAquisitivoOuReferencia: '2025/2026',
        dataInicioFerias: '2026-12-28',
        dataPagamento: '2026-12-23',
        diasFerias: 20,
        ativarRateioInssFerias: true,
        remuneracaoTrabalhadaMes2Ferias: 3000.0,
        remuneracaoTrabalhadaMes1Ferias: 0,
        tipoCalculo: 'ferias',
      };
      setIdentification(feriasIdent);

      const sampleEarningsFerias: EarningItem[] = [
        { id: 'ferias_gozadas', label: 'Férias Gozadas (20 dias)', value: 4000.0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: '20/30 de salário mensal R$ 6.000,00' },
        { id: 'terco_constitucional', label: '1/3 Constitucional de Férias', value: 1333.33, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Adicional constitucional 1/3 sobre férias' },
        { id: 'abono_pecuniario', label: 'Abono Pecuniário (Venda de 10 dias)', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: false, observation: 'Isento: art. 6º Lei 7.713/88 (SC COSIT nº 209/2021)' },
        { id: 'terco_abono', label: '1/3 do Abono Pecuniário', value: 0, includedInPensionBase: false, incideInss: false, incideIrrf: true, observation: 'Tributa IRRF conforme SC COSIT nº 209/2021 (isento de INSS)', irrfObservation: 'Tributável pelo IRRF no curso do contrato (Solução de Consulta COSIT nº 209/2021)' },
      ];

      const sampleDeductionsFerias: DeductionItem[] = [
        { id: 'inss', label: 'INSS s/ Férias (Proporcional 12/2026)', value: 0, deductFromPensionBase: true, order: 1, observation: 'INSS proporcional à 1ª competência no recibo' },
        { id: 'irrf', label: 'IRRF s/ Férias', value: 0, deductFromPensionBase: true, order: 2, observation: 'Apurado pelo motor oficial de IRRF' },
        { id: 'adiantamento_ferias', label: 'Adiantamento de Férias', value: 0, deductFromPensionBase: false, order: 3 },
      ];

      const sampleRuleFerias: PensionRuleConfig = {
        ruleType: 'percentual',
        percentage: 20.0,
        fixedValue: 0,
        additionalValue: 0,
        baseType: 'apos_inss_irrf',
        hasMinimum: false,
        minimumValue: 0,
        hasMaximum: false,
        maximumValue: 0,
        roundingPolicy: 'padrao_2dec',
        deduzirInssCalculado: true,
      };

      const sampleIrrfFerias: IrrfDeductionsConfig = {
        deduzirInss: true,
        deduzirDependentes: true,
        quantidadeDependentes: 1,
        deduzirPensao: true,
        usarPensaoCalculadaPeloMotor: true,
        valorPensaoManual: 0,
        deduzirOutras: false,
        outrasDeducoesValor: 0,
        ordemCalculoCircular: 'simultaneo_algebrico',
      };

      setProfiles((prev) => ({
        ...prev,
        ferias: {
          ...prev.ferias,
          pensionRule: sampleRuleFerias,
          earnings: sampleEarningsFerias,
          deductions: sampleDeductionsFerias,
          irrfConfig: sampleIrrfFerias,
        },
      }));

      setValidationErrors([]);
      const resFerias = executePensionCalculation(
        feriasIdent,
        sampleEarningsFerias,
        sampleDeductionsFerias,
        sampleRuleFerias,
        sampleIrrfFerias
      );
      setResult(resFerias);
      setIsResultOutdated(false);
      return;
    }

    setIdentification({
      matricula: 'DP-2026',
      ano: 2026,
      competencia: 'Janeiro',
      dataPagamento: '2026-02-05',
      tipoCalculo: calculationType,
    });

    const sampleEarnings: EarningItem[] = [
      { id: 'salario', label: 'Salário Base', value: 6500.0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Salário contratual', inssObservation: 'Tributação normal RGPS' },
      { id: 'horas_extras', label: 'Horas Extras 50%', value: 850.0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Remuneração variável habitual' },
      { id: 'adicional_noturno', label: 'Adicional Noturno', value: 350.0, includedInPensionBase: true, incideInss: true, incideIrrf: true, observation: 'Adicional legal' },
      { id: 'outras_verbas', label: 'Ajuda de Custo Indenizatória', value: 1200.0, includedInPensionBase: false, incideInss: false, incideIrrf: false, observation: 'Excluída da pensão conforme acordo', inssObservation: 'Isenta de INSS e IRRF (art. 457 § 2º CLT)' },
    ];

    const sampleDeductions: DeductionItem[] = [
      { id: 'inss', label: 'INSS (Oficial RGPS)', value: 0, deductFromPensionBase: true, order: 1, observation: 'Apurado pelo motor oficial progressivo' },
      { id: 'irrf', label: 'IRRF (Oficial)', value: 0, deductFromPensionBase: true, order: 2, observation: 'Apurado pelo motor oficial de IRRF' },
      { id: 'outros_descontos', label: 'Vale Transporte / Outros', value: 150.0, deductFromPensionBase: false, order: 3 },
    ];

    const sampleRule: PensionRuleConfig = {
      ruleType: 'percentual',
      percentage: 30.0,
      fixedValue: 0,
      additionalValue: 0,
      baseType: 'apos_inss_irrf',
      hasMinimum: false,
      minimumValue: 0,
      hasMaximum: false,
      maximumValue: 0,
      roundingPolicy: 'padrao_2dec',
      deduzirInssCalculado: true,
    };

    const sampleIrrfConfig: IrrfDeductionsConfig = {
      deduzirInss: true,
      deduzirDependentes: true,
      quantidadeDependentes: 1,
      deduzirPensao: true,
      usarPensaoCalculadaPeloMotor: true,
      valorPensaoManual: 0,
      deduzirOutras: false,
      outrasDeducoesValor: 0,
      ordemCalculoCircular: 'simultaneo_algebrico',
    };

    setProfiles((prev) => ({
      ...prev,
      [calculationType]: {
        ...prev[calculationType],
        pensionRule: sampleRule,
        earnings: sampleEarnings,
        deductions: sampleDeductions,
        irrfConfig: sampleIrrfConfig,
      },
    }));

    setValidationErrors([]);

    const res = executePensionCalculation(
      {
        matricula: 'DP-2026',
        ano: 2026,
        competencia: 'Janeiro',
        dataPagamento: '2026-02-05',
        tipoCalculo: calculationType,
      },
      sampleEarnings,
      sampleDeductions,
      sampleRule,
      sampleIrrfConfig
    );
    setResult(res);
    setIsResultOutdated(false);
  };

  const isCalculationView = ['folha', 'ferias', 'decimo', 'rescisao', 'plr'].includes(activeView);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* 1. Barra de Navegação Corporativa (Seção 4) */}
      <Navigation
        activeView={activeView}
        onNavigate={handleNavigate}
        isSimulationMode={isSimulationMode}
        onToggleSimulationMode={handleToggleSimulationMode}
        historyCount={fullHistory.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Notificação de Sucesso */}
        {saveSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2 shadow-xs transition-all">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{saveSuccessMessage}</span>
          </div>
        )}

        {/* 2. ROTEAMENTO DE VISUALIZAÇÕES */}

        {/* TELA INICIAL (Seção 2) */}
        {activeView === 'inicio' && (
          <HomeScreen
            onNavigate={handleNavigate}
            totalCalculos={fullHistory.length}
            totalRegras={savedRules.length}
            totalVerbas={catalogVerbas.length}
          />
        )}

        {/* TELA DE CONFIGURAÇÕES GERAIS (Seção 5) */}
        {activeView === 'configuracoes' && (
          <SettingsSection
            settings={generalSettings}
            onUpdateSetting={handleUpdateSetting}
            onResetSettings={handleResetSettings}
            onSaveNotification={settingsNotification}
          />
        )}

        {/* TELA DE CADASTRO DE REGRAS (Seções 6, 7 e 8) */}
        {activeView === 'regras' && (
          <RulesManagerSection
            regras={savedRules}
            onAddRegra={handleAddRegra}
            onUpdateRegra={handleUpdateRegra}
            onDeleteRegra={handleDeleteRegra}
          />
        )}

        {/* TELA DE TABELAS TRIBUTÁRIAS (Seções 9, 10 e 11) */}
        {activeView === 'tabelas' && <TablesManagerSection />}

        {/* TELA DE CADASTRO DE VERBAS (Seção 12) */}
        {activeView === 'verbas' && (
          <EarningsManagerSection
            verbas={catalogVerbas}
            onAddVerba={handleAddVerba}
            onUpdateVerba={handleUpdateVerba}
            onDeleteVerba={handleDeleteVerba}
          />
        )}

        {/* TELA DE HISTÓRICO DE CÁLCULOS (Seções 19 a 24) */}
        {activeView === 'historico' && (
          <HistorySection
            historico={fullHistory}
            onOpenCalculo={handleOpenCalculoFromHistory}
            onDuplicateCalculo={handleDuplicateCalculo}
            onNewVersionCalculo={handleNewVersionCalculo}
            onDeleteCalculo={handleDeleteCalculo}
          />
        )}

        {/* MÓDULOS DE CÁLCULO (Folha Mensal, Férias, 13º, Rescisão e PLR) */}
        {isCalculationView && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Barra de Subnavegação e Ações Rápidas do Módulo */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('inicio')}
                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Voltar ao início"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900">
                      Módulo: {CALC_TYPE_NAMES[calculationType]}
                    </h2>
                    {isSimulationMode && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        Modo Simulação
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Preencha os dados de identificação, verbas e regra da pensão alimentícia.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Botões Salvar em PDF e Exportar em Excel em destaque permanente no topo */}
                <ExportReportMenu
                  result={result}
                  identification={identification}
                  earnings={currentEarnings}
                  deductions={currentDeductions}
                  moduleName={CALC_TYPE_NAMES[calculationType]}
                  onPrint={() => window.print()}
                  onCalculateIfNeeded={handleCalculate}
                  size="md"
                />

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Carregar Exemplo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCanonicalModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  title="Interoperabilidade e integração com outros sistemas"
                >
                  <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dicionário Canônico</span>
                </button>
              </div>
            </div>

            {/* Alertas de Validação Estritos (Seção 16) */}
            <ValidationAlerts
              errors={validationErrors}
              onDismiss={() => setValidationErrors([])}
            />

            {/* Seletor de Tipo de Cálculo */}
            <CalculationTypeSelector
              selectedType={calculationType}
              onChange={handleTypeChange}
            />

            {/* Seção Específica: PLR (Fase 9), Rescisão (Fase 8) ou Padrão (Fases 1 a 5) */}
            {calculationType === 'plr' ? (
              <PlrSection
                identification={identification}
                onUpdateIdentification={handleIdentificationChange}
                rule={currentRule}
                onUpdateRule={handleUpdatePensionRule}
                earnings={currentEarnings}
                deductions={currentDeductions}
                onToggleEarningInclusion={handleToggleEarningInclusion}
                onToggleEarningInssIncidence={handleToggleEarningInssIncidence}
                onToggleEarningIrrfIncidence={handleToggleEarningIrrfIncidence}
                onUpdateEarningValue={handleUpdateEarningValue}
                onUpdateEarningObservation={handleUpdateEarningObservation}
                onAddEarning={handleAddEarning}
                onRemoveEarning={handleRemoveEarning}
                onToggleDeductionInclusion={handleToggleDeductionInclusion}
                onToggleDeductionLiquido={handleToggleDeductionLiquido}
                onToggleDeductionIrrf={handleToggleDeductionIrrf}
                onUpdateDeductionValue={handleUpdateDeductionValue}
                onUpdateDeductionOrder={handleUpdateDeductionOrder}
                onUpdateDeductionObservation={handleUpdateDeductionObservation}
                onAddDeduction={handleAddDeduction}
                onRemoveDeduction={handleRemoveDeduction}
                plrRegra={currentProfile.plrRegraConfig || getInitialProfiles().plr.plrRegraConfig!}
                onUpdatePlrRegra={handleUpdatePlrRegra}
                plrParcelamento={currentProfile.plrParcelamento || getInitialProfiles().plr.plrParcelamento!}
                onUpdatePlrParcelamento={handleUpdatePlrParcelamento}
                irrfConfig={currentIrrfConfig}
                onUpdateIrrfConfig={handleUpdateIrrfConfig}
                hasError={validationErrors.length > 0}
              />
            ) : calculationType === 'rescisao' ? (
              <RescisaoSection
                identification={identification}
                onUpdateIdentification={handleIdentificationChange}
                rule={currentRule}
                onUpdateRule={handleUpdatePensionRule}
                earnings={currentEarnings}
                deductions={currentDeductions}
                onToggleEarningInclusion={handleToggleEarningInclusion}
                onToggleEarningInssIncidence={handleToggleEarningInssIncidence}
                onToggleEarningIrrfIncidence={handleToggleEarningIrrfIncidence}
                onUpdateEarningValue={handleUpdateEarningValue}
                onUpdateEarningObservation={handleUpdateEarningObservation}
                onAddEarning={handleAddEarning}
                onRemoveEarning={handleRemoveEarning}
                onToggleDeductionInclusion={handleToggleDeductionInclusion}
                onToggleDeductionLiquido={handleToggleDeductionLiquido}
                onToggleDeductionIrrf={handleToggleDeductionIrrf}
                onUpdateDeductionValue={handleUpdateDeductionValue}
                onUpdateDeductionOrder={handleUpdateDeductionOrder}
                onUpdateDeductionObservation={handleUpdateDeductionObservation}
                onAddDeduction={handleAddDeduction}
                onRemoveDeduction={handleRemoveDeduction}
                medias={currentProfile.rescisaoMedias || []}
                onAddMedia={handleAddRescisaoMedia}
                onRemoveMedia={handleRemoveRescisaoMedia}
                irrfConfig={currentIrrfConfig}
                onUpdateIrrfConfig={handleUpdateIrrfConfig}
                hasError={validationErrors.length > 0}
              />
            ) : (
              <>
                <IdentificationSection
                  data={identification}
                  onChange={handleIdentificationChange}
                  hasError={validationErrors.some((e) => e.field === 'matricula' || e.field === 'ano_inss' || e.field === 'ano_irrf')}
                />

                <PensionRuleSection
                  rule={currentRule}
                  onUpdateRule={handleUpdatePensionRule}
                  earnings={currentEarnings}
                  deductions={currentDeductions}
                  onToggleEarningInclusion={handleToggleEarningInclusion}
                  onToggleEarningInssIncidence={handleToggleEarningInssIncidence}
                  onToggleEarningIrrfIncidence={handleToggleEarningIrrfIncidence}
                  onUpdateEarningValue={handleUpdateEarningValue}
                  onUpdateEarningObservation={handleUpdateEarningObservation}
                  onAddEarning={handleAddEarning}
                  onRemoveEarning={handleRemoveEarning}
                  onToggleDeductionInclusion={handleToggleDeductionInclusion}
                  onToggleDeductionLiquido={handleToggleDeductionLiquido}
                  onToggleDeductionIrrf={handleToggleDeductionIrrf}
                  onUpdateDeductionValue={handleUpdateDeductionValue}
                  onUpdateDeductionOrder={handleUpdateDeductionOrder}
                  onUpdateDeductionObservation={handleUpdateDeductionObservation}
                  onAddDeduction={handleAddDeduction}
                  onRemoveDeduction={handleRemoveDeduction}
                  irrfConfig={currentIrrfConfig}
                  onUpdateIrrfConfig={handleUpdateIrrfConfig}
                  calculationTypeName={CALC_TYPE_NAMES[calculationType]}
                  hasRuleError={validationErrors.some(
                    (e) =>
                      e.field === 'ruleType' ||
                      e.field === 'percentage' ||
                      e.field === 'fixedValue' ||
                      e.field === 'base_pensao' ||
                      e.field === 'dependencia_circular_irrf_pensao'
                  )}
                />
              </>
            )}

            {/* Barra de Ações Padronizadas (Seções 15, 16, 17 e 18) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveRule}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  title="Salva as definições de regra e verbas para esta modalidade"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>SALVAR REGRA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsClearModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-lg border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer"
                  title="Limpar campos do cálculo ativo com confirmação prévia"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>LIMPAR CÁLCULO</span>
                </button>

                {result && (
                  <button
                    type="button"
                    onClick={handleRecalculate}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                    title="Gera uma nova versão auditável sem sobrescrever o cálculo anterior"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-emerald-600" />
                    <span>RECALCULAR / NOVA VERSÃO</span>
                  </button>
                )}

                {/* Botões Salvar em PDF e Exportar em Excel sempre visíveis */}
                <ExportReportMenu
                  result={result}
                  identification={identification}
                  earnings={currentEarnings}
                  deductions={currentDeductions}
                  moduleName={CALC_TYPE_NAMES[calculationType]}
                  onPrint={() => window.print()}
                  onCalculateIfNeeded={handleCalculate}
                  size="md"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow transition-all cursor-pointer whitespace-nowrap active:scale-[0.99]"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span>
                  {calculationType === 'plr'
                    ? 'CALCULAR PLR'
                    : calculationType === 'rescisao'
                    ? 'CALCULAR RESCISÃO'
                    : 'CALCULAR ENCARGOS & PENSÃO'}
                </span>
              </button>
            </div>

            {/* Painel de Resultado do Cálculo Padronizado (Seção 31) */}
            <CalculationResult
              result={result}
              identification={identification}
              earnings={currentEarnings}
              deductions={currentDeductions}
              moduleName={CALC_TYPE_NAMES[calculationType]}
              onPrint={() => window.print()}
              isOutdated={isResultOutdated}
              onRecalculate={handleCalculate}
            />

            {/* Consolidação, Memória Padronizada em 12 Etapas e Painel de Conferência (Seção 32) */}
            {result && (
              <ConsolidationSection
                result={result}
                identification={identification}
                earnings={currentEarnings}
                deductions={currentDeductions}
                rule={currentRule}
                irrfConfig={currentIrrfConfig}
                versionsHistory={versionsHistory}
                auditLogs={auditLogs}
              />
            )}

            {/* Memória de Cálculo do IRRF */}
            {result?.irrfResult && (
              <IrrfMemorySection irrfResult={result.irrfResult} />
            )}

            {/* Memória de Cálculo do INSS */}
            {result?.inssResult && (
              <InssMemorySection
                inssResult={result.inssResult}
                feriasRateioInss={result.feriasRateioInss}
              />
            )}

            {/* Memória do Cálculo da Pensão */}
            <CalculationMemory result={result} />

            {/* Mapeamento de Fases e Arquitetura */}
            <ArchitectureNotice />
          </div>
        )}
      </main>

      {/* Modal de Limpar Cálculo com Confirmação (Seção 18) */}
      <ClearConfirmModal
        isOpen={isClearModalOpen}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsClearModalOpen(false)}
        moduleName={CALC_TYPE_NAMES[calculationType]}
      />

      {/* Modal do Dicionário Canônico de Campos e Payload (Seções 26 e 27) */}
      <CanonicalImportModal
        isOpen={isCanonicalModalOpen}
        onClose={() => setIsCanonicalModalOpen(false)}
      />

      {/* Rodapé Corporativo Final */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 text-center text-xs text-slate-500 border-t border-slate-200/80 mt-12">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
          <span>
            <strong>Calculadora de Pensão Alimentícia — Departamento Pessoal</strong> · Gestão e Auditoria Trabalhista
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveView('tabelas')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Tabelas Oficiais (2026/2025)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setActiveView('regras')}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Regras Cadastradas
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => setIsCanonicalModalOpen(true)}
              className="hover:text-slate-800 transition-colors cursor-pointer"
            >
              Dicionário Canônico
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">
          Conformidade estrita com LGPD (apenas matrícula, sem CPF/RG). Resolução simultânea por método algébrico exato. Memória analítica auditável em 12 etapas.
        </p>
      </footer>
    </div>
  );
}
