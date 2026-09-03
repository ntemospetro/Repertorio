import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  Info, 
  Check, 
  X, 
  RotateCcw, 
  ShieldAlert,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  AcuteClarificationQuestion, 
  AcuteAnswers, 
  getAcuteClarificationQuestions 
} from '../services/acuteClarificationService';

interface AcuteClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptomText: string;
  initialAnswers: AcuteAnswers;
  onApplyAnswers: (answers: AcuteAnswers) => void;
}

export const AcuteClarificationModal: React.FC<AcuteClarificationModalProps> = ({
  isOpen,
  onClose,
  symptomText,
  initialAnswers,
  onApplyAnswers
}) => {
  const { language, t } = useTranslation();
  const [answers, setAnswers] = useState<AcuteAnswers>(initialAnswers);

  // Sync initialAnswers when opening
  useEffect(() => {
    if (isOpen) {
      setAnswers(initialAnswers);
    }
  }, [isOpen, initialAnswers]);

  const questions: AcuteClarificationQuestion[] = React.useMemo(() => {
    return getAcuteClarificationQuestions(symptomText, language);
  }, [symptomText, language]);

  if (!isOpen) return null;

  const handleSelectOption = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const current = (prev as any)[questionId];
      return {
        ...prev,
        [questionId]: current === optionId ? undefined : optionId
      };
    });
  };

  const handleSetIntensity = (grade: number) => {
    setAnswers((prev) => ({
      ...prev,
      intensity: prev.intensity === grade ? undefined : grade
    }));
  };

  const handleReset = () => {
    setAnswers({});
  };

  const handleApply = () => {
    onApplyAnswers(answers);
    onClose();
  };

  const answeredCount = [
    answers.onset,
    answers.modality,
    answers.sensationMind,
    answers.intensity
  ].filter(Boolean).length;

  const scaleLabels: Record<number, string> = {
    1: t('acuteScaleGrade1'),
    2: t('acuteScaleGrade2'),
    3: t('acuteScaleGrade3'),
    4: t('acuteScaleGrade4'),
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>{t('acuteQuestionsModalTitle')}</span>
                {answeredCount > 0 && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40">
                    {answeredCount}/4 {t('acuteQuestionsAnsweredCount')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-teal-100/80">
                {t('acuteQuestionsModalSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={t('closeBtn')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Important Notice: NOT A CLINICAL CASE DOCUMENTATION */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-950 block">
                {t('acuteQuestionsDisclaimer')}
              </span>
            </div>
          </div>

          {/* Recorded symptoms snippet preview */}
          {symptomText.trim() && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                {t('acuteRecordedSnippetLabel')}:
              </span>
              <p className="text-slate-800 font-medium italic line-clamp-2">
                "{symptomText.trim()}"
              </p>
            </div>
          )}

          {/* The Clarification Questions */}
          <div className="space-y-5">
            {questions.map((q) => {
              if (q.type === 'single') {
                const selectedVal = (answers as any)[q.id];
                return (
                  <div 
                    key={q.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5 shadow-2xs hover:border-teal-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                          {q.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                          {q.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {q.description}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {q.options?.map((opt) => {
                        const isSelected = selectedVal === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleSelectOption(q.id, opt.id)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50/90 border-teal-600 text-teal-950 ring-1 ring-teal-600 shadow-2xs'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <span className="font-semibold leading-snug">
                                {opt.label}
                              </span>
                              {isSelected && (
                                <div className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                                  <Check className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                            {opt.remedyHint && (
                              <span className="text-[10px] font-medium text-teal-700 mt-1.5">
                                Leitmittel: {opt.remedyHint}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              if (q.type === 'scale') {
                return (
                  <div 
                    key={q.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs hover:border-teal-200 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60">
                        {q.category}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                        {q.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t('acuteScaleHint')}
                      </p>
                    </div>

                    {/* Scale 1 to 4 buttons */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {[1, 2, 3, 4].map((grade) => {
                        const isSelected = answers.intensity === grade;
                        return (
                          <button
                            key={grade}
                            type="button"
                            onClick={() => handleSetIntensity(grade)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-700 shadow-xs ring-2 ring-teal-500/30'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                          >
                            <span className="text-base font-bold">
                              {grade}
                            </span>
                            <span className={`text-[10px] leading-tight font-medium ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                              {scaleLabels[grade]}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {answeredCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('acuteClearAnswers')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              {t('acuteQuestionsCloseBtn')}
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-200" />
              <span>{t('acuteQuestionsApplyBtn')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
