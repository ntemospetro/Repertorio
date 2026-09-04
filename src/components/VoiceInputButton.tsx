import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, Loader2, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { 
  startSpeechRecognition, 
  isSpeechRecognitionSupported, 
  SpeechRecognitionSession,
  LANGUAGE_SPEECH_MAP
} from '../services/speechService';
import { checkMedicalRelevance } from '../services/medicalRelevanceService';

interface VoiceInputButtonProps {
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  mode?: 'append' | 'replace';
  title?: string;
  id?: string;
  disabled?: boolean;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  value,
  onChange,
  className = '',
  size = 'sm',
  mode = 'append',
  title,
  id,
  disabled = false,
}) => {
  const { language, t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [showRejectionNotice, setShowRejectionNotice] = useState(false);
  const [showAcceptedFeedback, setShowAcceptedFeedback] = useState(false);

  const sessionRef = useRef<SpeechRecognitionSession | null>(null);
  const valueRef = useRef(value);
  const sessionInitialTextRef = useRef<string>('');
  const recordedTranscriptRef = useRef<string>('');
  const isProcessingRef = useRef<boolean>(false);
  const rejectionTimerRef = useRef<number | null>(null);
  const acceptedTimerRef = useRef<number | null>(null);
  const maxDurationTimerRef = useRef<number | null>(null);

  // Keep valueRef updated for closures
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Clean up recording session and timers on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.abort();
        sessionRef.current = null;
      }
      if (maxDurationTimerRef.current) {
        clearTimeout(maxDurationTimerRef.current);
      }
      if (rejectionTimerRef.current) {
        clearTimeout(rejectionTimerRef.current);
      }
      if (acceptedTimerRef.current) {
        clearTimeout(acceptedTimerRef.current);
      }
    };
  }, [language]);

  /**
   * Process the completed voice transcript after speech has ended.
   * Evaluates medical relevance with Gemini before committing to onChange.
   */
  const processCompletedVoiceInput = useCallback(async (transcriptText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const trimmed = (transcriptText || '').trim();
    if (!trimmed) {
      isProcessingRef.current = false;
      return;
    }

    setIsEvaluating(true);

    try {
      // Strict medical relevance filter check
      const result = await checkMedicalRelevance(trimmed, language);

      if (result.isRelevant) {
        // Medical relevance confirmed: Apply and commit to state
        const base = mode === 'replace' ? '' : (sessionInitialTextRef.current || '').trim();
        if (mode === 'replace' || !base) {
          onChange(trimmed);
        } else if (base.toLowerCase().endsWith(trimmed.toLowerCase())) {
          onChange(base);
        } else {
          onChange(`${base} ${trimmed}`);
        }

        // Brief subtle positive confirmation feedback
        setShowAcceptedFeedback(true);
        if (acceptedTimerRef.current) clearTimeout(acceptedTimerRef.current);
        acceptedTimerRef.current = window.setTimeout(() => {
          setShowAcceptedFeedback(false);
        }, 1500);
      } else {
        // NOT medically relevant: Reject completely, do NOT call onChange, show notice
        setShowRejectionNotice(true);
        if (rejectionTimerRef.current) clearTimeout(rejectionTimerRef.current);
        rejectionTimerRef.current = window.setTimeout(() => {
          setShowRejectionNotice(false);
        }, 8000);
      }
    } catch (err) {
      console.error('Error during medical relevance evaluation:', err);
      // Fallback: If unknown error, accept text
      const base = mode === 'replace' ? '' : (sessionInitialTextRef.current || '').trim();
      if (mode === 'replace' || !base) {
        onChange(trimmed);
      } else {
        onChange(`${base} ${trimmed}`);
      }
    } finally {
      setIsEvaluating(false);
      isProcessingRef.current = false;
      recordedTranscriptRef.current = '';
    }
  }, [language, mode, onChange]);

  const stopListening = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.stop();
      sessionRef.current = null;
    }
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
      maxDurationTimerRef.current = null;
    }
    setIsListening(false);
    setIsStarting(false);

    // Process spoken text once stopped
    const textToProcess = recordedTranscriptRef.current;
    recordedTranscriptRef.current = '';
    if (textToProcess && textToProcess.trim() && !isProcessingRef.current) {
      processCompletedVoiceInput(textToProcess);
    }
  }, [processCompletedVoiceInput]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled || isEvaluating) return;

    if (isListening) {
      stopListening();
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert(
        t('voiceDictationUnsupported' as TranslationKey) ||
        'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte Google Chrome, Microsoft Edge oder Safari verwenden.'
      );
      return;
    }

    setIsStarting(true);
    setShowRejectionNotice(false);
    sessionInitialTextRef.current = valueRef.current || '';
    recordedTranscriptRef.current = '';
    isProcessingRef.current = false;

    // Maximum 15 seconds recording timeout
    if (maxDurationTimerRef.current) {
      clearTimeout(maxDurationTimerRef.current);
    }
    maxDurationTimerRef.current = window.setTimeout(() => {
      stopListening();
    }, 15000);

    const session = startSpeechRecognition({
      language,
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsStarting(false);
        setIsListening(true);
      },
      onResult: (transcript) => {
        // Collect spoken text into ref during speech, do NOT commit to state yet
        if (transcript && transcript.trim()) {
          recordedTranscriptRef.current = transcript.trim();
        }
      },
      onError: (err) => {
        setIsStarting(false);
        setIsListening(false);
        sessionRef.current = null;
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }

        if (err === 'not-allowed' || err === 'permission-denied') {
          alert('Mikrofon-Berechtigung wurde verweigert. Bitte erlauben Sie den Mikrofonzugriff in Ihren Browsereinstellungen.');
        }
      },
      onEnd: () => {
        setIsStarting(false);
        setIsListening(false);
        sessionRef.current = null;
        if (maxDurationTimerRef.current) {
          clearTimeout(maxDurationTimerRef.current);
          maxDurationTimerRef.current = null;
        }

        // Process collected speech text if not already processing
        const textToProcess = recordedTranscriptRef.current;
        recordedTranscriptRef.current = '';
        if (textToProcess && textToProcess.trim() && !isProcessingRef.current) {
          processCompletedVoiceInput(textToProcess);
        }
      },
    });

    sessionRef.current = session;
  };

  const currentLangLabel = LANGUAGE_SPEECH_MAP[language] || 'de-DE';
  const tooltipText = isEvaluating
    ? t('medicalRelevanceFilterChecking' as TranslationKey)
    : isListening
    ? `${t('voiceDictationListening' as TranslationKey)} (${currentLangLabel}) - ${t('voiceDictationStop' as TranslationKey)}`
    : title || `${t('voiceDictationStart' as TranslationKey)} (${currentLangLabel})`;

  const sizeClasses = {
    xs: 'w-6 h-6 p-1 text-xs',
    sm: 'w-7 h-7 p-1.5 text-xs',
    md: 'w-8 h-8 p-2 text-sm',
  }[size];

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  }[size];

  return (
    <>
      <div className="relative inline-flex items-center">
        <button
          type="button"
          id={id}
          onClick={toggleListening}
          disabled={disabled || isEvaluating}
          title={tooltipText}
          aria-label={tooltipText}
          className={`relative rounded-lg flex items-center justify-center transition-all cursor-pointer select-none ${sizeClasses} ${
            isEvaluating
              ? 'bg-amber-500 text-white ring-2 ring-amber-300 ring-offset-1 animate-pulse shadow-md'
              : isListening
              ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 ring-offset-1 animate-pulse shadow-md'
              : showAcceptedFeedback
              ? 'bg-teal-600 text-white ring-2 ring-teal-300 ring-offset-1 shadow-sm'
              : isStarting
              ? 'bg-amber-100 text-amber-800'
              : 'bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 hover:border-teal-300 border border-slate-200'
          } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
        >
          {isStarting || isEvaluating ? (
            <Loader2 className={`${iconSizes} animate-spin ${isEvaluating ? 'text-white' : 'text-amber-700'}`} />
          ) : isListening ? (
            <MicOff className={`${iconSizes} text-white animate-bounce`} />
          ) : (
            <Mic className={`${iconSizes}`} />
          )}

          {isListening && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full ring-2 ring-white animate-ping" />
          )}
        </button>

        {isListening && (
          <span className="sr-only">
            Sprachaufnahme aktiv in {currentLangLabel}
          </span>
        )}
      </div>

      {/* Floating Medical Relevance Rejection Notification (rendered in Portal for guaranteed visibility) */}
      {showRejectionNotice && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed bottom-6 right-6 z-[99999] max-w-md w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border-2 border-rose-400 p-4 sm:p-5 animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-rose-900 leading-tight">
                  {t('medicalRelevanceFilterTitle' as TranslationKey)}
                </h4>
                <button
                  type="button"
                  onClick={() => setShowRejectionNotice(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Schließen"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {t('medicalRelevanceFilterRejected' as TranslationKey)}
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRejectionNotice(false)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors border border-rose-200 cursor-pointer"
                >
                  {t('btnOk')}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
