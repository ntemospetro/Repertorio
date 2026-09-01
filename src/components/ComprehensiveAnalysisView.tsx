import React, { useState } from 'react';
import { PatientCase, FullClinicalAnalysis, DifferentialDiagnosisItem, RedFlagItem, MedicationAnalysisDetail, HomeoRemedyRecommendation } from '../types';
import { exportCategoryPDF, PDFExportCategory } from '../services/pdfExportService';
import { useTranslation } from '../i18n/LanguageContext';
import { getLocalizedPresetValue } from '../utils/remedyLocalization';
import { 
  ShieldAlert, 
  Stethoscope, 
  Sparkles, 
  Pill, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Layers, 
  ChevronRight, 
  FileText, 
  ArrowRight,
  Info,
  Calendar,
  User,
  Activity,
  HeartHandshake,
  Download,
  FileCheck,
  Check,
  Clock,
  Timer
} from 'lucide-react';

interface ComprehensiveAnalysisViewProps {
  patientCase: PatientCase;
  analysis: FullClinicalAnalysis;
  onEditSection?: (stepIndex: number) => void;
  onReAnalyze?: () => void;
  isAnalyzing?: boolean;
}

export const ComprehensiveAnalysisView: React.FC<ComprehensiveAnalysisViewProps> = ({
  patientCase,
  analysis,
  onEditSection,
  onReAnalyze,
  isAnalyzing = false
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'falldaten' | 'redFlags' | 'differential' | 'homoeopathie' | 'medikamente' | 'gesamt'>('gesamt');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownloadPDF = (cat: PDFExportCategory, label: string) => {
    try {
      exportCategoryPDF(cat, patientCase, analysis);
      setDownloadSuccess(`PDF "${label}" wurde erfolgreich heruntergeladen.`);
      setTimeout(() => setDownloadSuccess(null), 4000);
    } catch (err) {
      console.error('PDF Export Error:', err);
    }
  };

  const ddItems: DifferentialDiagnosisItem[] = analysis.differentialdiagnostik?.items || [];
  const redFlags: RedFlagItem[] = analysis.redFlags?.warnings || [];
  const meds: MedicationAnalysisDetail[] = analysis.medikamente?.details || [];
  const homeoMittel: HomeoRemedyRecommendation[] = analysis.homoeopathie?.mittel || [];

  return (
    <div className="space-y-6">
      {/* Header & PDF Download Hub (Screen only) */}
      <div className="bg-white p-5 sm:p-6 rounded-xl shadow-xs border border-slate-200 print:hidden space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-teal-100 text-teal-900 font-bold text-xs uppercase tracking-wider">
                {t('step7Badge')}
              </span>
              <span className="text-xs text-slate-500">
                {t('createdLabel', { date: patientCase.analyzedAt ? new Date(patientCase.analyzedAt).toLocaleDateString() : new Date().toLocaleDateString() })}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              {t('comprehensiveCaseEvaluation', { patient: patientCase.patientName || 'Patient' })}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {t('comprehensiveEvaluationSub')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onReAnalyze && (
              <button
                type="button"
                onClick={onReAnalyze}
                disabled={isAnalyzing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 text-teal-600 ${isAnalyzing ? 'animate-spin' : ''}`} />
                <span>{isAnalyzing ? t('btnCalculating') : t('btnReanalyze')}</span>
              </button>
            )}

            {/* Primary PDF Download Action */}
            <button
                type="button"
                onClick={() => handleDownloadPDF('all', t('tabAllCategories'))}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{t('btnFullReportPDF')}</span>
              </button>
          </div>
        </div>

        {/* Success Toast */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center justify-between gap-2 text-xs font-semibold text-emerald-900 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{downloadSuccess}</span>
            </div>
            <button onClick={() => setDownloadSuccess(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Individual Category Quick Downloads */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('downloadSingleCategoriesHeader')}</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <button
              type="button"
              onClick={() => handleDownloadPDF('falldaten', t('tabRecordedCaseData'))}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">{t('pdfFalldatenBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF('redFlags', t('tabRedFlags'))}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-950 border border-slate-200 hover:border-amber-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              <span className="truncate">{t('pdfWarningsBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF('medikamente', t('tabMedications'))}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">{t('pdfMedsBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF('differential', t('tabDifferentialDiagnosis'))}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">{t('pdfDiffBtn')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadPDF('homoeopathie', t('tabHomeopathyAnalysis'))}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="truncate">{t('pdfHomeoBtn')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('gesamt')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'gesamt'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('tabAllCategories')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('falldaten')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'falldaten'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-300" />
            <span>{t('tabRecordedCaseData')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('redFlags')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'redFlags'
                ? 'bg-amber-100/90 text-amber-950 border border-amber-300 shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>{t('tabRedFlags')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('medikamente')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'medikamente'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Pill className="w-4 h-4 text-teal-300" />
            <span>{t('tabMedications')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('differential')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'differential'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-teal-300" />
            <span>{t('tabDifferentialDiagnosis')}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('homoeopathie')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'homoeopathie'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>{t('tabHomeopathyAnalysis')}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ÜBERSICHT DER ERFASSTEN FALLDATEN */}
      {/* ========================================================================= */}
      {(activeTab === 'falldaten' || activeTab === 'gesamt') && (
        <section className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:break-before-page">
          {/* Printable Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">Falldaten-Übersicht: {patientCase.patientName || 'Patient'}</span>
              <span> • Datum: {patientCase.anamneseDatum || new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div className="font-bold text-teal-800">Homöopathische Praxis</div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('sec1Title')}</h3>
                <p className="text-xs text-slate-500">{t('tabRecordedCaseData')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadPDF('falldaten', t('tabRecordedCaseData'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-semibold border border-slate-200 print:hidden cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('pdfFalldatenBtn')}</span>
            </button>
          </div>

          {/* Stammdaten Grid */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              <span>{t('patientDataTitle')}</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">{t('patientName').replace(' *', '')}:</span>
                <span className="font-bold text-slate-900">{patientCase.patientName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('birthdateAndAge')}:</span>
                <span className="font-semibold text-slate-800">
                  {patientCase.patientAge ? `${patientCase.patientAge} ${t('yearsOld')}` : '—'} {patientCase.patientBirthDate ? `(${patientCase.patientBirthDate})` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('patientGender')}:</span>
                <span className="font-semibold text-slate-800 capitalize">{patientCase.patientGender || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('heightAndWeight')}:</span>
                <span className="font-semibold text-slate-800">
                  {patientCase.patientHeightCm ? `${patientCase.patientHeightCm} cm` : '—'} {patientCase.patientWeightKg ? `/ ${patientCase.patientWeightKg} kg` : ''}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('patientMaritalStatus')}:</span>
                <span className="font-semibold text-slate-800 capitalize">{patientCase.patientMaritalStatus || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('patientEmail')}:</span>
                <span className="font-semibold text-slate-800">{patientCase.patientEmail || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('patientPhone')}:</span>
                <span className="font-semibold text-slate-800">{patientCase.patientPhone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">{t('hasChildren')}:</span>
                <span className="font-semibold text-slate-800">
                  {patientCase.hasChildren ? t('childrenCountLabel').replace('{count}', (patientCase.childrenCount || 0).toString()) : t('noChildren')}
                </span>
              </div>
              {patientCase.isPregnant && (
                <div className="col-span-2">
                  <span className="text-slate-500 block">{t('isPregnantLabel')}:</span>
                  <span className="font-bold text-rose-700">{t('isPregnantYes')} ({patientCase.pregnancyMonth || '?'})</span>
                </div>
              )}
              {patientCase.customStammdaten && patientCase.customStammdaten.length > 0 && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block text-xs font-bold uppercase mb-1.5">{t('customStammdatenTitle')}:</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {patientCase.customStammdaten.map((cs) => (
                      <div key={cs.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-xs">
                        <span className="text-slate-500 block font-medium">{cs.name || t('extraFields')}:</span>
                        <span className="text-slate-900 font-semibold">{cs.value || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hauptbeschwerde & Spontanbericht */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200">
              <h4 className="font-bold text-teal-950 text-xs uppercase tracking-wider mb-1.5">
                {t('chiefComplaintTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                {patientCase.hauptbeschwerde || t('noChiefComplaintGiven')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1.5">
                {t('spontaneousReportTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {patientCase.spontanbericht || t('noSpontaneousReportGiven')}
              </p>
            </div>
          </div>

          {/* Strukturierte Fragen zur Hauptbeschwerde */}
          {patientCase.anamnesisQuestions && patientCase.anamnesisQuestions.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                {t('deepeningQuestionsCount', { count: patientCase.anamnesisQuestions.length })}
              </h4>
              <div className="space-y-2.5">
                {patientCase.anamnesisQuestions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <p className="font-bold text-slate-900">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="text-slate-700 pl-3 border-l-2 border-teal-500">
                      {q.type === 'scale' ? (
                        <div className="flex gap-4">
                          <span>{t('currentIntensityLabel')} <strong>{q.answerScaleCurrent || '-'}/4</strong></span>
                          <span>{t('worstConditionLabel')} <strong>{q.answerScaleWorst || '-'}/4</strong></span>
                        </div>
                      ) : q.type === 'multi_choice' ? (
                        <span>{t('selectionLabel')} <strong>{q.answerMultiChoice?.join(', ') || t('noSpecification')}</strong></span>
                      ) : (
                        <span>{t('answerLabel')} <strong>{q.answerChoice || q.answerText || t('noSpecification')}</strong></span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modalitäten & Symptome */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
              <h4 className="font-bold text-emerald-900 text-xs uppercase tracking-wider">
                {t('improvementByTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                {patientCase.modalitaetenBesser || t('notSpecified')}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200 space-y-1">
              <h4 className="font-bold text-rose-900 text-xs uppercase tracking-wider">
                {t('aggravationByTitle')}
              </h4>
              <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap">
                {patientCase.modalitaetenSchlechter || t('notSpecified')}
              </p>
            </div>
          </div>

          {/* Gemüt, Allgemein, Lokal */}
          {(patientCase.gemuetPsyche || patientCase.koerperAllgemein || patientCase.lokalsymptome) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">{t('mindPsychologyLabel')}</span>
                <p className="text-slate-700">{patientCase.gemuetPsyche || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">{t('generalSymptomsLabel')}</span>
                <p className="text-slate-700">{patientCase.koerperAllgemein || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">{t('localSymptomsLabel')}</span>
                <p className="text-slate-700">{patientCase.lokalsymptome || '-'}</p>
              </div>
            </div>
          )}

          {/* Klinischer Befund & Vitalparameter */}
          {patientCase.befundGewuenscht && patientCase.befundDetails && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>{t('physicalFindingsTitle')}</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {patientCase.befundDetails.blutdruck && <div><span className="text-slate-500">RR:</span> <strong>{patientCase.befundDetails.blutdruck}</strong></div>}
                {patientCase.befundDetails.puls && <div><span className="text-slate-500">Puls:</span> <strong>{patientCase.befundDetails.puls}</strong></div>}
                {patientCase.befundDetails.temperatur && <div><span className="text-slate-500">Temp:</span> <strong>{patientCase.befundDetails.temperatur}</strong></div>}
                {patientCase.befundDetails.spo2 && <div><span className="text-slate-500">SpO2:</span> <strong>{patientCase.befundDetails.spo2}</strong></div>}
              </div>
              {patientCase.befundDetails.gesamtbeurteilung && (
                <div className="text-xs text-slate-700 pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900">{t('assessmentLabel')} </span>
                  {patientCase.befundDetails.gesamtbeurteilung}
                </div>
              )}
            </div>
          )}

          {/* Erfasste Medikamente */}
          {patientCase.nimmtMedikamente && patientCase.medikamenteList && patientCase.medikamenteList.length > 0 && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>{t('documentedMedicationIntake')}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {patientCase.medikamenteList.map((m, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-900">{i + 1}. {m.name || t('unnamedMedication')}</span>
                    <div className="text-slate-600 text-[11px] mt-0.5">
                      {t('dosePrefix')} {m.dosierung || '-'} | {t('intakePrefix')} {m.einnahmeart || '-'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: WARNHINWEISE & RED FLAGS */}
      {/* ========================================================================= */}
      {(activeTab === 'redFlags' || activeTab === 'gesamt') && (
        <section className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:break-before-page">
          {/* Printable Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">2. Warnhinweise &amp; Red Flags: {patientCase.patientName || 'Patient'}</span>
              <span> • Datum: {patientCase.anamneseDatum || new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div className="font-bold text-teal-800">Homöopathische Praxis</div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('sec2Title')}</h3>
                <p className="text-xs text-slate-500">{t('sec2Subtitle')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadPDF('redFlags', t('tabRedFlags'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-950 text-xs font-semibold border border-slate-200 print:hidden cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>{t('pdfWarningsBtn')}</span>
            </button>
          </div>

          {/* Red Flag Warning Cards */}
          <div className="space-y-3">
            {redFlags.map((flag, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-200/80 text-amber-900 uppercase">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{flag.severity || 'WARNUNG'}</span>
                  </span>
                  {flag.status && (
                    <span className="text-[11px] font-semibold text-slate-500">
                      {t('statusPrefix')} {flag.status}
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
                  {flag.text}
                </p>
                {flag.abklaerung && (
                  <p className="text-xs text-slate-600 pt-1 border-t border-amber-200/50">
                    <strong>{t('clarificationLabel')}</strong> {flag.abklaerung}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Assessment & Recommendation Box */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('overallAssessmentHeader')}
              </h4>
              <p className="text-sm font-semibold text-slate-800">
                {analysis.redFlags?.gesamtbewertung || 'Eine zeitnahe ärztliche Abklärung wird zur differentialdiagnostischen Sicherung empfohlen.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                {t('recommendedSpecialtyHeader')}
              </h4>
              <p className="text-sm text-slate-700">
                {analysis.redFlags?.empfohleneFachrichtung || 'Bitte besprechen Sie die Beschwerden zunächst mit Ihrem Hausarzt / Ihrer Hausärztin bzw. einer allgemeinmedizinischen Praxis.'}
              </p>
            </div>

            {analysis.arztfallEntscheidung && (
              <div className="pt-3 border-t border-slate-200 flex items-start gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                  analysis.arztfallEntscheidung.status === 'Ja' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-teal-100 text-teal-800'
                }`}>
                  {t('doctorCaseLabel')}: {analysis.arztfallEntscheidung.status}
                </span>
                <p className="text-xs text-slate-600 flex-1">
                  {analysis.arztfallEntscheidung.begruendung}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: MEDIKAMENTE */}
      {/* ========================================================================= */}
      {(activeTab === 'medikamente' || activeTab === 'gesamt') && (
        <section className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:break-before-page">
          {/* Printable Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">3. Medikamentenanalyse: {patientCase.patientName || 'Patient'}</span>
              <span> • Datum: {patientCase.anamneseDatum || new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div className="font-bold text-teal-800">Homöopathische Praxis</div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Pill className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('sec3Title')}</h3>
                <p className="text-xs text-slate-500">{t('sec3Subtitle')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadPDF('medikamente', t('tabMedications'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-semibold border border-slate-200 print:hidden cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('pdfMedsBtn')}</span>
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
            {analysis.medikamente?.warnhinweis || 'Alle Angaben beschreiben mögliche, keine gesicherten Zusammenhänge und ersetzen keine ärztliche oder pharmazeutische Beratung.'}
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-xs">
              {t('medicationSummaryHeader')}
            </h4>
            <p className="text-slate-800 leading-relaxed">
              {analysis.medikamente?.zusammenfassung}
            </p>
          </div>

          {/* Detailed Medication Cards */}
          <div className="space-y-4">
            {meds.map((med, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <h4 className="text-base font-bold text-slate-900">{med.name}</h4>
                  <div className="flex items-center gap-2">
                    {med.dosierung && (
                      <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-xs font-semibold">
                        {t('dosePrefix')} {med.dosierung}
                      </span>
                    )}
                    {med.einnahme && (
                      <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-900 text-xs font-semibold">
                        {med.einnahme}
                      </span>
                    )}
                  </div>
                </div>

                {med.wirkung && (
                  <p className="text-xs sm:text-sm text-slate-700">
                    <strong>{t('observedEffect')}</strong> {med.wirkung}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      {t('possibleSideEffects')}
                    </span>
                    <ul className="space-y-1 text-slate-600">
                      {med.nebenwirkungen.map((nw, nIdx) => (
                        <li key={nIdx}>• {nw}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                    <span className="font-bold text-teal-800 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-teal-600" />
                      {t('possibleConnectionsWithComplaints')}
                    </span>
                    <ul className="space-y-1 text-slate-600">
                      {med.zusammenhaenge.map((zh, zIdx) => (
                        <li key={zIdx}>• {zh}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {med.uebergebrauchBeurteilung && (
                  <div className="p-3 rounded-lg bg-teal-50 border border-teal-100 text-xs text-teal-950">
                    <strong>{t('medOveruseAssessment')}</strong> {med.uebergebrauchBeurteilung}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Missing Info Box */}
          {analysis.fehlendeInformationen && analysis.fehlendeInformationen.length > 0 && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>{t('missingInformationTitle')}</span>
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600 pl-5 list-disc">
                {analysis.fehlendeInformationen.map((info, idx) => (
                  <li key={idx}>{info}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Next Steps Box */}
          {analysis.gesamtAuswertung?.naechsteSchritte && (
            <div className="p-5 rounded-xl bg-slate-900 text-white space-y-3 print:bg-white print:text-black print:border print:border-slate-300">
              <h4 className="font-bold text-sm tracking-wide text-teal-300 uppercase">
                {t('actionableNextStepsHeader')}
              </h4>
              <div className="space-y-1.5 text-xs sm:text-sm">
                {analysis.gesamtAuswertung.naechsteSchritte.map((step, idx) => (
                  <p key={idx} className="font-medium text-slate-200 print:text-slate-800">
                    {step}
                  </p>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: MEDIZINISCHE DIFFERENTIALDIAGNOSTIK */}
      {/* ========================================================================= */}
      {(activeTab === 'differential' || activeTab === 'gesamt') && (
        <section className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:break-before-page">
          {/* Printable Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">4. Differenzialdiagnostik: {patientCase.patientName || 'Patient'}</span>
              <span> • Datum: {patientCase.anamneseDatum || new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div className="font-bold text-teal-800">Homöopathische Praxis</div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('sec4Title')}</h3>
                <p className="text-xs text-slate-500">{t('sec4Subtitle')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPDF('differential', t('tabDifferentialDiagnosis'))}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-semibold border border-slate-200 print:hidden cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>{t('pdfDiffBtn')}</span>
              </button>

              {/* High-Contrast Dringlichkeit Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white font-mono text-xs font-bold tracking-wide">
                <span className="text-amber-400">{t('urgencyHeaderLabel')}</span>
                <span>{analysis.differentialdiagnostik?.dringlichkeitHeader || 'ZEITNAHE MEDIZINISCHE ABKLÄRUNG'}</span>
              </div>
            </div>
          </div>

          {/* DD Cards List */}
          <div className="space-y-5">
            {ddItems.map((dd, index) => (
              <div key={index} className="p-5 rounded-xl bg-slate-50/80 border border-slate-200 space-y-4 print:bg-white print:border-slate-300 print:p-4">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {dd.title}
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm pl-0 sm:pl-10">
                  {/* Dafür spricht (Emerald green) */}
                  <div className="p-3.5 rounded-lg bg-white border border-emerald-200/80 shadow-2xs space-y-2">
                    <h5 className="font-bold text-emerald-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{t('proLabel')}</span>
                    </h5>
                    <ul className="space-y-1.5 text-slate-700">
                      {dd.pro.map((item, pIdx) => (
                        <li key={pIdx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Dagegen spricht (Warm amber) */}
                  <div className="p-3.5 rounded-lg bg-white border border-amber-200/80 shadow-2xs space-y-2">
                    <h5 className="font-bold text-amber-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('contraLabel')}</span>
                    </h5>
                    <ul className="space-y-1.5 text-slate-700">
                      {dd.contra.map((item, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Offene Fragen & Diagnostik */}
                {dd.offeneFragen && dd.offeneFragen.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-100/80 space-y-2 ml-0 sm:ml-10 text-xs sm:text-sm">
                    <h5 className="font-bold text-teal-900 flex items-center gap-1.5 text-xs">
                      <span>{t('openQuestionsAndDiagnostics')}</span>
                    </h5>
                    <ul className="space-y-1 text-slate-700 italic">
                      {dd.offeneFragen.map((q, qIdx) => (
                        <li key={qIdx} className="flex items-start gap-1.5">
                          <span>-</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                    {dd.diagnostik && (
                      <p className="text-xs text-teal-900 font-semibold not-italic pt-1 border-t border-teal-200/40">
                        {t('recommendedDiagnostics')} {dd.diagnostik}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: HOMÖOPATHISCHE FALLAUSWERTUNG */}
      {/* ========================================================================= */}
      {(activeTab === 'homoeopathie' || activeTab === 'gesamt') && (
        <section className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 space-y-6 print:p-0 print:border-none print:shadow-none print:break-before-page">
          {/* Printable Header */}
          <div className="hidden print:flex items-center justify-between border-b pb-3 mb-4 text-xs text-slate-600">
            <div>
              <span className="font-bold text-slate-900 text-sm">5. Homöopathische Auswertung: {patientCase.patientName || 'Patient'}</span>
              <span> • Datum: {patientCase.anamneseDatum || new Date().toLocaleDateString('de-DE')}</span>
            </div>
            <div className="font-bold text-teal-800">Homöopathische Praxis</div>
          </div>

          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-teal-100 text-teal-800">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{t('sec5Title')}</h3>
                <p className="text-xs text-slate-500">{t('sec5Subtitle')}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDownloadPDF('homoeopathie', t('tabHomeopathyAnalysis'))}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 text-xs font-semibold border border-slate-200 print:hidden cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>{t('pdfHomeoBtn')}</span>
            </button>
          </div>

          {/* Symptom Hierarchy */}
          {analysis.homoeopathie?.symptomHierarchie && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>{t('symptomHierarchizationTitle')}</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierLeadingSymptoms')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.leitsymptome?.join(', ') || '-'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierMindPsych')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.gemuetsymptome?.join(', ') || '-'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierModalities')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.modalitaeten?.join(', ') || '-'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierGeneral')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.allgemeinsymptome?.join(', ') || '-'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierLocal')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.lokalsymptome?.join(', ') || '-'}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="font-bold text-teal-900 block mb-1">{t('hierConcomitant')}</span>
                  <p className="text-slate-700 text-xs">{analysis.homoeopathie.symptomHierarchie.begleitsymptome?.join(', ') || '-'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Remedies Ranking */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">
              {t('candidateRemediesRanking')}
            </h4>

            <div className="space-y-3">
              {homeoMittel.map((m, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-800 text-white text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-base">{m.name}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded bg-teal-100 text-teal-900 font-semibold text-xs border border-teal-200">
                      {t('potencyLabel')}: {m.potenz || m.dosierungPotenz || 'C30'}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 font-medium">
                    {m.rangBegruendung}
                  </p>

                  {/* Dosierungs- & Einnahmeplan */}
                  <div className="p-3 bg-white rounded-lg border border-teal-200/80 space-y-2.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900 border-b border-teal-100 pb-1.5">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('dosageScheduleHeader')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-teal-50/60 rounded-md border border-teal-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{t('dosagePerDayLabel')}</span>
                        <span className="font-bold text-teal-950">{getLocalizedPresetValue(m.tagesdosis, 'dose', t)}</span>
                      </div>

                      <div className="p-2 bg-teal-50/60 rounded-md border border-teal-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{t('frequencyLabel')}</span>
                        <span className="font-bold text-teal-950">{getLocalizedPresetValue(m.haeufigkeit, 'freq', t)}</span>
                      </div>

                      <div className="p-2 bg-teal-50/60 rounded-md border border-teal-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{t('durationLabel')}</span>
                        <span className="font-bold text-teal-950">{getLocalizedPresetValue(m.anwendungsdauer, 'dur', t)}</span>
                      </div>

                      <div className="p-2 bg-teal-50/60 rounded-md border border-teal-100">
                        <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">{t('applicationPhaseLabel')}</span>
                        <span className="font-bold text-teal-950">{getLocalizedPresetValue(m.zeitraum, 'phase', t)}</span>
                      </div>
                    </div>

                    {m.einnahmehinweis && (
                      <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-md text-[11px] text-slate-600 border border-slate-200/60">
                        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                        <span><strong className="text-slate-800">{t('therapistNoteLabel')}:</strong> {getLocalizedPresetValue(m.einnahmehinweis, 'note', t)}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-white rounded-lg border border-emerald-200">
                      <span className="font-bold text-emerald-800 block mb-1">✓ {t('matchingSymptomsWell')}</span>
                      <ul className="space-y-0.5 text-slate-600">
                        {m.passungSymptome.map((p, pIdx) => (
                          <li key={pIdx}>• {p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-amber-200">
                      <span className="font-bold text-amber-800 block mb-1">⚠ {t('nonMatchingNotice')}</span>
                      <ul className="space-y-0.5 text-slate-600">
                        {(m.contraNichtPassend || [t('modalFollowUpAdvice')]).map((c, cIdx) => (
                          <li key={cIdx}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Three Column Separation: Medical vs Complementary vs Homeopathic */}
          {analysis.homoeopathie?.trennung && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs">
              <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-1.5">
                <span className="font-bold text-rose-900 block text-xs uppercase">{t('measureMedical')}</span>
                <ul className="space-y-1 text-slate-700">
                  {analysis.homoeopathie.trennung.medizinisch.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-1.5">
                <span className="font-bold text-amber-900 block text-xs uppercase">{t('measureComplementary')}</span>
                <ul className="space-y-1 text-slate-700">
                  {analysis.homoeopathie.trennung.komplementaer.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 space-y-1.5">
                <span className="font-bold text-teal-900 block text-xs uppercase">{t('measureHomeopathic')}</span>
                <ul className="space-y-1 text-slate-700">
                  {analysis.homoeopathie.trennung.homoeopathisch.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
