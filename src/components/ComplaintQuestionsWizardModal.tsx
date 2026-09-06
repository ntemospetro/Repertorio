import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  HelpCircle,
  Stethoscope,
  Activity,
  Layers,
  MapPin,
  Flame,
  Sliders,
  HeartPulse,
  Brain,
  FilterX,
  CheckSquare
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { VoiceInputButton } from './VoiceInputButton';
import { 
  Hahnemann6Pillars, 
  HahnemannAnalysisResult, 
  runHahnemannAnalysis 
} from '../services/hahnemannEngineService';

interface ComplaintQuestionsWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  chiefComplaint: string;
  patientName?: string;
  onTransferToAnamnese: (data: {
    matrix: Hahnemann6Pillars;
    summaryText: string;
    differentialRemedies: string[];
  }) => void;
}

export const ComplaintQuestionsWizardModal: React.FC<ComplaintQuestionsWizardModalProps> = ({
  isOpen,
  onClose,
  chiefComplaint,
  patientName,
  onTransferToAnamnese,
}) => {
  const { t, language } = useTranslation();

  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [analysisResult, setAnalysisResult] = useState<HahnemannAnalysisResult | null>(null);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<string, string>>({});
  const [customClarifyingInput, setCustomClarifyingInput] = useState<Record<string, string>>({});

  const initialParsedRef = useRef(false);

  // Initialize analysis on modal open with chief complaint text
  useEffect(() => {
    if (isOpen && !initialParsedRef.current) {
      initialParsedRef.current = true;
      setIsProcessing(true);
      const textToAnalyze = chiefComplaint && chiefComplaint.trim().length > 0 ? chiefComplaint.trim() : 'Akute Beschwerden';
      runHahnemannAnalysis(textToAnalyze, undefined, [], language)
        .then((res) => {
          setAnalysisResult(res);
        })
        .catch((err) => {
          console.error('Error initializing Hahnemann analysis:', err);
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }

    if (!isOpen) {
      initialParsedRef.current = false;
    }
  }, [isOpen, chiefComplaint, language]);

  if (!isOpen) return null;

  const matrix: Hahnemann6Pillars = analysisResult?.wichtige_symptom_fragmente || {
    causa: null,
    lokalisierung: null,
    empfindung: null,
    modalitaeten: null,
    begleitsymptome: [],
    gemuet: null,
  };

  const hasCausa = Boolean(matrix.causa && matrix.causa !== 'Noch nicht genannt' && matrix.causa.trim().length > 0);
  const hasLokalisierung = Boolean(matrix.lokalisierung && matrix.lokalisierung !== 'Noch nicht genannt' && matrix.lokalisierung.trim().length > 0);
  const hasEmpfindung = Boolean(matrix.empfindung && matrix.empfindung !== 'Noch nicht genannt' && matrix.empfindung.trim().length > 0);
  const hasModalitaeten = Boolean(matrix.modalitaeten && matrix.modalitaeten !== 'Noch nicht genannt' && matrix.modalitaeten.trim().length > 0);
  const hasBegleitsymptome = Boolean(Array.isArray(matrix.begleitsymptome) && matrix.begleitsymptome.length > 0);
  const hasGemuet = Boolean(matrix.gemuet && matrix.gemuet !== 'Noch nicht genannt' && matrix.gemuet.trim().length > 0);

  const pillarsCount = [
    hasCausa,
    hasLokalisierung,
    hasEmpfindung,
    hasModalitaeten,
    hasBegleitsymptome,
    hasGemuet,
  ].filter(Boolean).length;

  const all6PillarsFilled = hasCausa && hasLokalisierung && hasEmpfindung && hasModalitaeten && hasBegleitsymptome && hasGemuet;

  const handleSendAnswer = async (answerTextToSend?: string) => {
    const textToSubmit = (answerTextToSend !== undefined ? answerTextToSend : currentAnswer).trim();
    if (!textToSubmit || !analysisResult || isProcessing) return;

    setIsProcessing(true);
    const updatedHistory = [
      ...conversationHistory,
      { question: analysisResult.naechste_frage, answer: textToSubmit }
    ];
    setConversationHistory(updatedHistory);

    // Only set isLastStep if all 6 pillars are fulfilled or safety limit of 6 steps is reached
    const isLastStep = all6PillarsFilled || updatedHistory.length >= 6;

    try {
      const nextResult = await runHahnemannAnalysis(
        textToSubmit,
        matrix,
        updatedHistory,
        language,
        isLastStep
      );
      setAnalysisResult(nextResult);
      setCurrentAnswer('');
    } catch (err) {
      console.error('Failed to process answer:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForceComplete = async () => {
    if (!analysisResult || isProcessing) return;
    setIsProcessing(true);
    try {
      const textToSubmit = currentAnswer.trim() || 'Abschluss der Akut-Anamnese';
      const nextResult = await runHahnemannAnalysis(
        textToSubmit,
        matrix,
        conversationHistory,
        language,
        true
      );
      setAnalysisResult(nextResult);
      setCurrentAnswer('');
    } catch (err) {
      console.error('Failed to complete analysis:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnswerClarifyingQuestion = (qId: string, answerText: string, category?: string) => {
    if (!answerText.trim() || !analysisResult) return;
    const cleanAnswer = answerText.trim();
    
    // Save into answers map
    setClarifyingAnswers(prev => ({
      ...prev,
      [qId]: cleanAnswer,
    }));

    // Update matrix dynamically
    const updatedMatrix: Hahnemann6Pillars = { 
      ...matrix,
      begleitsymptome: [...matrix.begleitsymptome]
    };
    
    if (
      category === 'gemuet' || 
      qId.includes('gemuet') || 
      cleanAnswer.toLowerCase().includes('ruhe') || 
      cleanAnswer.toLowerCase().includes('unruhe') || 
      cleanAnswer.toLowerCase().includes('reizbar') || 
      cleanAnswer.toLowerCase().includes('gemüt') || 
      cleanAnswer.toLowerCase().includes('apathisch') ||
      cleanAnswer.toLowerCase().includes('weinen')
    ) {
      updatedMatrix.gemuet = cleanAnswer;
    } else if (category === 'modalitaeten' || qId.includes('modalitaet')) {
      updatedMatrix.modalitaeten = updatedMatrix.modalitaeten 
        ? `${updatedMatrix.modalitaeten}; ${cleanAnswer}` 
        : cleanAnswer;
    } else if (category === 'begleitsymptome' || qId.includes('begleit')) {
      if (!updatedMatrix.begleitsymptome.includes(cleanAnswer)) {
        updatedMatrix.begleitsymptome.push(cleanAnswer);
      }
    }

    // Update summary text
    let updatedSummary = analysisResult.end_analyse_zusammenfassung || '';
    if (category === 'gemuet' || qId.includes('gemuet') || updatedMatrix.gemuet === cleanAnswer) {
      if (updatedSummary.includes('• Gemüt:')) {
        updatedSummary = updatedSummary.replace(/• Gemüt: .*/, `• Gemüt: ${cleanAnswer}`);
      } else {
        updatedSummary += `\n• Gemüt: ${cleanAnswer}`;
      }
    }

    setAnalysisResult({
      ...analysisResult,
      wichtige_symptom_fragmente: updatedMatrix,
      end_analyse_zusammenfassung: updatedSummary,
    });
  };

  const handleReset = () => {
    setConversationHistory([]);
    setCurrentAnswer('');
    setSelectedOptions([]);
    setClarifyingAnswers({});
    setCustomClarifyingInput({});
    setIsProcessing(true);
    runHahnemannAnalysis(chiefComplaint, undefined, [], language)
      .then((res) => {
        setAnalysisResult(res);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  };

  const handleSaveAndTransfer = () => {
    if (!analysisResult) return;
    const summary = analysisResult.end_analyse_zusammenfassung || `• Causa: ${matrix.causa || '—'}\n• Lokalisierung: ${matrix.lokalisierung || '—'}\n• Empfindung: ${matrix.empfindung || '—'}\n• Modalitäten: ${matrix.modalitaeten || '—'}\n• Begleitsymptome: ${matrix.begleitsymptome.join(', ') || '—'}\n• Gemüt: ${matrix.gemuet || '—'}`;
    onTransferToAnamnese({
      matrix,
      summaryText: summary,
      differentialRemedies: analysisResult.aktuelle_mittel_differenzierung || [],
    });
    onClose();
  };

  // Quick suggestion chips based on missing pillars for rapid completion
  const getQuickSuggestions = () => {
    if (!matrix.causa || matrix.causa === 'Noch nicht genannt') {
      return [
        'Kälteeinwirkung (kalter Wind, Zugluft, Unterkühlung)',
        'Durchnässung / Feuchtigkeit / Nässe',
        'Plötzlicher Schreck / Schock oder akute Angst',
        'Ärger, Zorn oder emotionale Kränkung',
        'Körperliche Überanstrengung oder Verheben',
        'Kein spezifischer Auslöser bekannt'
      ];
    }
    if (!matrix.lokalisierung || matrix.lokalisierung === 'Noch nicht genannt') {
      return [
        'Kopf / Stirn / Schläfen / Augen',
        'Hals / Rachen / Mandeln / Kehlkopf',
        'Brustkorb / Lunge / Bronchien',
        'Magen-Darm-Trakt / Bauchbereich',
        'Bewegungsapparat / Beine / Gelenke / Rücken',
        'Ganzkörperlich / Systemisch (Fieber, Frösteln)'
      ];
    }
    if (!matrix.empfindung || matrix.empfindung === 'Noch nicht genannt') {
      return [
        'Trockene, glühende und brennende Hitze',
        'Starker Schüttelfrost und Frösteln trotz Hitze',
        'Klopfende, pulsierende Schmerzen wie Herzhämmern',
        'Wie zerschlagen am ganzen Körper mit Gliederschmerzen',
        'Stechende, spitze Schmerzen bei jeder Bewegung'
      ];
    }
    if (!matrix.modalitaeten || matrix.modalitaeten === 'Noch nicht genannt') {
      return [
        'Spürbar besser durch Wärme und Zudecken',
        'Viel besser an kühler Frischluft, Zimmerwärme ist unerträglich',
        'Besser bei absoluter Bewegungslosigkeit und Ruhe',
        'Schlechter durch die geringste Bewegung oder Erschütterung',
        'Besser durch festen Druck oder Bandagierung'
      ];
    }
    if (!matrix.begleitsymptome || matrix.begleitsymptome.length === 0) {
      return [
        'Großer Durst auf große Mengen kaltes Wasser, trockene Haut ohne Schweiß',
        'Vollständige Durstlosigkeit trotz hohem Fieber',
        'Heißer Schweiß am Kopf und rotes Gesicht',
        'Trockene Lippen und ständiges Verlangen nach kleinen Schlucken',
        'Frösteln und Schüttelfrost bei der geringsten Entblößung'
      ];
    }
    if (!matrix.gemuet || matrix.gemuet === 'Noch nicht genannt') {
      return [
        'Ängstliche, motorische Unruhe mit Furcht und Herzklopfen',
        'Apathisch, müde, will seine Ruhe haben und nicht gestört werden',
        'Sehr gereizt und ärgerlich über jede Ansprache',
        'Weinend und verzagt, sucht Nähe und Trost',
        'Ausgeglichen und gefasst, keine auffällige Gemütsveränderung'
      ];
    }
    return [];
  };

  const suggestions = getQuickSuggestions();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-teal-600/30 border border-teal-500/40 text-teal-200 shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold truncate leading-tight">
                {t('hahnemannWizardTitle')}
              </h3>
              <p className="text-xs text-teal-200/90 truncate">
                {t('hahnemannWizardSubtitle')}
                {patientName ? ` • ${patientName}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="px-2.5 py-1 rounded-full bg-teal-700/60 text-teal-100 border border-teal-500/50 text-xs font-semibold">
              {pillarsCount} / 6 {t('activeSectionCompletedBadge')}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t('termsModalClose')}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 6-Pillar Stepper Progress Line */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-1 overflow-x-auto text-[11px]">
          {[
            { key: 'causa', label: t('hahnemannPillarCausa'), isFilled: Boolean(matrix.causa && matrix.causa !== 'Noch nicht genannt'), icon: Activity },
            { key: 'lok', label: t('hahnemannPillarLokalisierung'), isFilled: Boolean(matrix.lokalisierung && matrix.lokalisierung !== 'Noch nicht genannt'), icon: MapPin },
            { key: 'empf', label: t('hahnemannPillarEmpfindung'), isFilled: Boolean(matrix.empfindung && matrix.empfindung !== 'Noch nicht genannt'), icon: Flame },
            { key: 'mod', label: t('hahnemannPillarModalitaeten'), isFilled: Boolean(matrix.modalitaeten && matrix.modalitaeten !== 'Noch nicht genannt'), icon: Sliders },
            { key: 'begleit', label: t('hahnemannPillarBegleit'), isFilled: Boolean(matrix.begleitsymptome && matrix.begleitsymptome.length > 0), icon: HeartPulse },
            { key: 'gemuet', label: t('hahnemannPillarGemuet'), isFilled: Boolean(matrix.gemuet && matrix.gemuet !== 'Noch nicht genannt'), icon: Brain },
          ].map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div 
                key={pillar.key} 
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                  pillar.isFilled 
                    ? 'bg-teal-50 text-teal-800 border border-teal-200 font-semibold' 
                    : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${pillar.isFilled ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{idx + 1}. {pillar.label.split(' ')[1]}</span>
                {pillar.isFilled ? (
                  <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: WAS BISHER VERSTANDEN WURDE (Die 6-Säulen-Matrix) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-700" />
                  {t('hahnemannWhatWasUnderstood')}
                </h4>
                <p className="text-xs text-slate-500">
                  {t('hahnemannUnderstoodSub')}
                </p>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-medium self-start sm:self-auto">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                {t('hahnemannStrictBanBadge')}
              </span>
            </div>

            {/* Matrix 6-Pillar Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              
              {/* 1. Causa */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarCausa')}
                </span>
                <p className={`text-xs ${matrix.causa ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                  {matrix.causa || t('hahnemannNotSpecifiedYet')}
                </p>
              </div>

              {/* 2. Lokalisierung */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarLokalisierung')}
                </span>
                <p className={`text-xs ${matrix.lokalisierung ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                  {matrix.lokalisierung || t('hahnemannNotSpecifiedYet')}
                </p>
              </div>

              {/* 3. Empfindung */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarEmpfindung')}
                </span>
                <p className={`text-xs ${matrix.empfindung ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                  {matrix.empfindung || t('hahnemannNotSpecifiedYet')}
                </p>
              </div>

              {/* 4. Modalitäten */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarModalitaeten')}
                </span>
                <p className={`text-xs ${matrix.modalitaeten ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                  {matrix.modalitaeten || t('hahnemannNotSpecifiedYet')}
                </p>
              </div>

              {/* 5. Begleitsymptome */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarBegleit')}
                </span>
                {matrix.begleitsymptome.length > 0 ? (
                  <ul className="text-xs text-slate-900 font-semibold list-disc list-inside space-y-0.5">
                    {matrix.begleitsymptome.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    {t('hahnemannNotSpecifiedYet')}
                  </p>
                )}
              </div>

              {/* 6. Gemüt */}
              <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {t('hahnemannPillarGemuet')}
                </span>
                <p className={`text-xs ${matrix.gemuet ? 'text-slate-900 font-semibold' : 'text-slate-400 italic'}`}>
                  {matrix.gemuet || t('hahnemannNotSpecifiedYet')}
                </p>
              </div>
            </div>

            {/* Ignorierte Daten / NLP-Filterung falls vorhanden */}
            {analysisResult?.ignorierte_daten && analysisResult.ignorierte_daten.length > 0 && (
              <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-xs flex items-start gap-2.5">
                <FilterX className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 block">
                    {t('hahnemannIgnoredData')}:
                  </span>
                  <span className="text-slate-600">
                    {analysisResult.ignorierte_daten.map(item => `"${item}"`).join(', ')}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {t('hahnemannIgnoredDataDesc')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: DYNAMISCHE EINZELFRAGE-KONTROLLSCHLEIFE */}
          {analysisResult?.analyse_status !== 'completed' && analysisResult?.naechste_frage ? (
            <div className="bg-linear-to-b from-teal-50/80 to-white rounded-xl border-2 border-teal-600/30 p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-teal-100 pb-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-teal-700" />
                    {t('hahnemannNextQuestionTitle')}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 text-[11px] font-semibold">
                    {t('hahnemannStepIndicator', { current: Math.min(conversationHistory.length + 1, 3), max: 3 })}
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200">
                    {t('hahnemannCompactModeNotice')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleForceComplete}
                  disabled={isProcessing}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title={t('hahnemannCompleteNowBtn')}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>{t('hahnemannCompleteNowBtn')}</span>
                </button>
              </div>

              {/* The Single Question */}
              <div className="p-4 rounded-xl bg-white border border-teal-200 shadow-xs space-y-2">
                <p className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                  {analysisResult.naechste_frage}
                </p>
                {analysisResult.kontroll_und_nachfrage_logik && (
                  <p className="text-xs text-slate-500 italic">
                    <span className="font-semibold text-slate-600 not-italic">{t('hahnemannRationaleTitle')} </span>
                    {analysisResult.kontroll_und_nachfrage_logik}
                  </p>
                )}
              </div>

              {/* Auswahlkästen (Interactive Choice Boxes / Checkboxes) */}
              {(() => {
                const availableOptions = (analysisResult.auswahl_optionen && analysisResult.auswahl_optionen.length > 0)
                  ? analysisResult.auswahl_optionen
                  : suggestions;

                return availableOptions.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-teal-700" />
                        {t('hahnemannSelectionBoxesTitle')}
                      </span>
                      {selectedOptions.length > 0 && (
                        <span className="text-[11px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200">
                          {t('hahnemannOptionsSelectedCount', { count: selectedOptions.length })}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {availableOptions.map((opt, oIdx) => {
                        const isSelected = selectedOptions.includes(opt);
                        return (
                          <div
                            key={oIdx}
                            onClick={() => {
                              if (analysisResult?.auswahl_typ === 'single') {
                                setSelectedOptions([opt]);
                              } else {
                                setSelectedOptions(prev =>
                                  prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]
                                );
                              }
                            }}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 select-none ${
                              isSelected
                                ? 'border-teal-600 bg-teal-50/90 text-teal-950 shadow-xs ring-1 ring-teal-600/30'
                                : 'border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50/90 text-slate-800'
                            }`}
                          >
                            <div className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-teal-700 border-teal-700 text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={`text-xs leading-snug ${isSelected ? 'font-bold' : 'font-medium'}`}>
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {selectedOptions.length > 0 && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const combined = currentAnswer.trim()
                              ? `${selectedOptions.join(', ')}. ${currentAnswer.trim()}`
                              : selectedOptions.join(', ');
                            handleSendAnswer(combined);
                            setSelectedOptions([]);
                          }}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('hahnemannConfirmSelectionBtn')} ({selectedOptions.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : null;
              })()}

              {/* Answer Input Area with Textarea + Voice Button */}
              <div className="space-y-2 pt-2 border-t border-teal-100">
                <span className="text-[11px] font-medium text-slate-600 block">
                  {t('hahnemannOrCustomText')}
                </span>
                <div className="relative flex items-end gap-2">
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        const combined = selectedOptions.length > 0
                          ? `${selectedOptions.join(', ')}. ${currentAnswer.trim()}`
                          : currentAnswer.trim();
                        handleSendAnswer(combined);
                        setSelectedOptions([]);
                      }
                    }}
                    disabled={isProcessing}
                    placeholder={t('hahnemannYourAnswerPlaceholder')}
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:border-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 resize-none shadow-2xs"
                  />

                  {/* Direct Voice Input Button */}
                  <div className="shrink-0 pb-0.5">
                    <VoiceInputButton
                      size="sm"
                      value={currentAnswer}
                      onChange={(spokenText) => {
                        setCurrentAnswer(spokenText);
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const combined = selectedOptions.length > 0
                        ? `${selectedOptions.join(', ')}. ${currentAnswer.trim()}`
                        : currentAnswer.trim();
                      handleSendAnswer(combined);
                      setSelectedOptions([]);
                    }}
                    disabled={(!currentAnswer.trim() && selectedOptions.length === 0) || isProcessing}
                    className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{t('regVerifySending')}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>{t('hahnemannSubmitAnswerBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* SECTION 3: ABSCHLUSS & ZUSAMMENFASSUNG */
            <div className="bg-emerald-50/80 rounded-xl border-2 border-emerald-300 p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-emerald-900 border-b border-emerald-200 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm sm:text-base leading-tight">
                    {t('hahnemannStatusComplete')}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {t('hahnemannCompleteNotice')}
                  </p>
                </div>
              </div>

              {/* Zusammenfassung */}
              {analysisResult?.end_analyse_zusammenfassung && (
                <div className="p-4 rounded-xl bg-white border border-emerald-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed shadow-2xs font-sans">
                  <span className="font-bold text-slate-900 block mb-1">
                    {t('hahnemannTherapistSummary')}
                  </span>
                  {analysisResult.end_analyse_zusammenfassung}
                </div>
              )}

              {/* Differenzial-Mittel */}
              {analysisResult?.aktuelle_mittel_differenzierung && analysisResult.aktuelle_mittel_differenzierung.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">
                    {t('hahnemannRemedyDiff')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.aktuelle_mittel_differenzierung.map((remedy, rIdx) => (
                      <span
                        key={rIdx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-teal-950 border border-emerald-300 shadow-2xs"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        {remedy}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SICH ERGEBENDE FRAGEN AUS ANTWORTEN (IM MASSE) */}
              {(() => {
                const clarifyingQuestions = (analysisResult?.sich_ergebende_fragen && analysisResult.sich_ergebende_fragen.length > 0)
                  ? analysisResult.sich_ergebende_fragen.slice(0, 3)
                  : [
                      ...(!matrix.gemuet || matrix.gemuet === t('hahnemannNotSpecifiedYet') ? [{
                        id: 'q_gemuet',
                        frage: language === 'de' 
                          ? 'Wie ist die seelische Verfassung / das Gemüt während der Beschwerden?' 
                          : 'How is the emotional state / mind during the complaints?',
                        grund: language === 'de'
                          ? 'Zentrale Hahnemannsche Leitsäule zur exakten Differenzierung des Simile.'
                          : 'Crucial Hahnemannian pillar for precise simile differentiation.',
                        kategorie: 'gemuet' as const,
                        optionen: language === 'de' ? [
                          'Reizbar, zornig, will absolute Ruhe (Bryonia / Nux vomica)',
                          'Ängstliche motorische Unruhe mit Furcht (Aconitum / Arsenicum)',
                          'Apathisch, schläfrig, will nicht gestört werden (Gelsemium)',
                          'Weinend, verlangt nach Trost und Nähe (Pulsatilla)',
                          'Ausgeglichen / unauffällig'
                        ] : [
                          'Irritable, angry, wants absolute quiet',
                          'Anxious restlessness with fear',
                          'Apathetic, drowsy, wants no disturbance',
                          'Weeping, desires comfort and company',
                          'Calm and balanced'
                        ]
                      }] : []),
                      {
                        id: 'q_modalitaet',
                        frage: language === 'de'
                          ? 'Wie reagieren die Schmerzen auf feste Bandagierung oder starken Druck versus Bewegung?'
                          : 'How do the pains respond to firm pressure / bandage versus motion?',
                        grund: language === 'de'
                          ? 'Differenziert Druckbesserung (Silicea, Bryonia) von Berührungsüberempfindlichkeit (Belladonna).'
                          : 'Differentiates pressure relief (Silicea, Bryonia) from touch sensitivity (Belladonna).',
                        kategorie: 'modalitaeten' as const,
                        optionen: language === 'de' ? [
                          'Fester Druck / feste Bandagierung bessert deutlich',
                          'Geringste Berührung und Bewegung verschlimmern',
                          'Besserung durch sanfte Bewegung an frischer Luft',
                          'Weder Druck noch Bewegung verändern die Schmerzen'
                        ] : [
                          'Firm pressure / tight wrap improves distinctly',
                          'Slightest touch and motion aggravate',
                          'Relief from gentle motion in open air',
                          'Neither pressure nor motion changes the pain'
                        ]
                      },
                      {
                        id: 'q_begleit',
                        frage: language === 'de'
                          ? 'Wie verhält sich das Durst- und Temperaturverlangen während des Zustands?'
                          : 'How does thirst and temperature sensation behave during the condition?',
                        grund: language === 'de'
                          ? 'Wichtiges Generalsymptom nach Bönninghausen zur Absicherung des Mittels.'
                          : 'Important general symptom according to Boenninghausen.',
                        kategorie: 'begleitsymptome' as const,
                        optionen: language === 'de' ? [
                          'Großer Durst auf große Mengen kaltes Wasser',
                          'Völlige Durstlosigkeit trotz Hitze/Schmerz',
                          'Ausgeprägtes Frösteln, Verlangen nach warmer Einhüllung',
                          'Abneigung gegen frische Luft und Kälte'
                        ] : [
                          'Great thirst for large amounts of cold water',
                          'Complete thirstlessness despite heat/pain',
                          'Marked chilliness, desires warm wrapping',
                          'Aversion to open air and cold'
                        ]
                      }
                    ].slice(0, 3);

                if (clarifyingQuestions.length === 0) return null;

                return (
                  <div className="rounded-xl bg-teal-50/70 border-2 border-teal-300 p-4 sm:p-5 shadow-xs space-y-3.5">
                    <div className="border-b border-teal-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                        <h5 className="font-bold text-sm sm:text-base text-teal-950">
                          {t('hahnemannArisingQuestionsTitle')}
                        </h5>
                      </div>
                      <p className="text-xs text-teal-800 mt-1">
                        {t('hahnemannArisingQuestionsSubtitle')}
                      </p>
                    </div>

                    <div className="space-y-3">
                      {clarifyingQuestions.map((q, qIndex) => {
                        const isAnswered = Boolean(clarifyingAnswers[q.id]);
                        const currentAnswerText = clarifyingAnswers[q.id] || '';
                        const customText = customClarifyingInput[q.id] || '';

                        return (
                          <div
                            key={q.id}
                            className={`p-3.5 rounded-xl border transition-all ${
                              isAnswered
                                ? 'bg-white/95 border-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                                : 'bg-white border-teal-200 shadow-2xs hover:border-teal-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="space-y-1 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-200 uppercase tracking-wider">
                                    {qIndex + 1}. {q.kategorie === 'gemuet' ? t('hahnemannPillarGemuet') : q.kategorie === 'modalitaeten' ? t('hahnemannPillarModalitaeten') : q.kategorie === 'begleitsymptome' ? t('hahnemannPillarBegleit') : t('step1Title')}
                                  </span>
                                  {isAnswered && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      {t('hahnemannQuestionAnswered')}
                                    </span>
                                  )}
                                </div>
                                <h6 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                                  {q.frage}
                                </h6>
                                {q.grund && (
                                  <p className="text-[11px] text-slate-500 italic">
                                    <span className="font-semibold text-slate-600 not-italic">{t('hahnemannClarifyingQuestionRationale')} </span>
                                    {q.grund}
                                  </p>
                                )}
                              </div>

                              {isAnswered && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setClarifyingAnswers(prev => {
                                      const updated = { ...prev };
                                      delete updated[q.id];
                                      return updated;
                                    });
                                  }}
                                  className="text-xs text-slate-500 hover:text-teal-700 underline shrink-0 cursor-pointer font-medium"
                                >
                                  {t('hahnemannEditAnswerBtn')}
                                </button>
                              )}
                            </div>

                            {/* If Answered */}
                            {isAnswered ? (
                              <div className="mt-2.5 p-2 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs font-semibold text-emerald-950 flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{currentAnswerText}</span>
                              </div>
                            ) : (
                              /* If Not Answered */
                              <div className="mt-2.5 space-y-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {q.optionen.map((opt, oIdx) => (
                                    <button
                                      key={oIdx}
                                      type="button"
                                      onClick={() => handleAnswerClarifyingQuestion(q.id, opt, q.kategorie)}
                                      className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-800 hover:text-teal-950 transition-colors font-medium cursor-pointer"
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>

                                {/* Custom Answer + Voice Button */}
                                <div className="flex items-center gap-1.5 pt-0.5">
                                  <input
                                    type="text"
                                    value={customText}
                                    onChange={(e) => setCustomClarifyingInput(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && customText.trim()) {
                                        handleAnswerClarifyingQuestion(q.id, customText, q.kategorie);
                                      }
                                    }}
                                    placeholder={t('hahnemannCustomAnswerPlaceholder')}
                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-600 shadow-2xs"
                                  />
                                  <VoiceInputButton
                                    size="sm"
                                    value={customText}
                                    onChange={(val) => setCustomClarifyingInput(prev => ({ ...prev, [q.id]: val }))}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (customText.trim()) {
                                        handleAnswerClarifyingQuestion(q.id, customText, q.kategorie);
                                      }
                                    }}
                                    disabled={!customText.trim()}
                                    className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold disabled:opacity-50 cursor-pointer shadow-2xs"
                                  >
                                    {t('hahnemannConfirmAnswerBtn')}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleReset}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('hahnemannResetBtn')}</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t('btnCancelModal')}
            </button>

            <button
              type="button"
              onClick={handleSaveAndTransfer}
              className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{t('hahnemannBtnTransferToCase')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
