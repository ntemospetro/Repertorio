import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  startSpeechRecognition, 
  isSpeechRecognitionSupported, 
  SpeechRecognitionSession,
  LANGUAGE_DISPLAY_NAMES,
  LANGUAGE_SPEECH_MAP
} from '../services/speechService';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const sessionRef = useRef<SpeechRecognitionSession | null>(null);
  const valueRef = useRef(value);
  const sessionInitialTextRef = useRef<string>('');

  // Keep valueRef updated for closures
  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  // Clean up recording session on unmount or language change
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.abort();
        sessionRef.current = null;
      }
    };
  }, [language]);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (disabled) return;

    if (isListening) {
      if (sessionRef.current) {
        sessionRef.current.stop();
        sessionRef.current = null;
      }
      setIsListening(false);
      setIsStarting(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      alert(
        t('voiceDictationUnsupported' as any) ||
        'Spracherkennung wird in diesem Browser nicht unterstützt. Bitte Google Chrome, Microsoft Edge oder Safari verwenden.'
      );
      return;
    }

    setIsStarting(true);
    setErrorMessage(null);
    sessionInitialTextRef.current = valueRef.current || '';

    const session = startSpeechRecognition({
      language,
      continuous: true,
      interimResults: true,
      onStart: () => {
        setIsStarting(false);
        setIsListening(true);
      },
      onResult: (transcript, isFinal) => {
        if (!transcript.trim()) return;

        const base = mode === 'replace' ? '' : (sessionInitialTextRef.current || '').trim();
        const trimmed = transcript.trim();

        if (mode === 'replace' || !base) {
          onChange(trimmed);
        } else if (base.toLowerCase().endsWith(trimmed.toLowerCase())) {
          onChange(base);
        } else {
          onChange(`${base} ${trimmed}`);
        }
      },
      onError: (err) => {
        setIsStarting(false);
        setIsListening(false);
        sessionRef.current = null;

        if (err === 'not-allowed' || err === 'permission-denied') {
          setErrorMessage('Mikrofon-Berechtigung verweigert');
          alert('Mikrofon-Berechtigung wurde verweigert. Bitte erlauben Sie den Mikrofonzugriff in Ihren Browsereinstellungen.');
        } else if (err !== 'aborted' && err !== 'no-speech') {
          setErrorMessage(err);
        }
      },
      onEnd: () => {
        setIsStarting(false);
        setIsListening(false);
        sessionRef.current = null;
      },
    });

    sessionRef.current = session;
  };

  const currentLangLabel = LANGUAGE_SPEECH_MAP[language] || 'de-DE';
  const tooltipText = isListening
    ? `${t('voiceDictationListening' as any) || 'Hört zu...'} (${currentLangLabel}) - ${t('voiceDictationStop' as any) || 'Klicken zum Stoppen'}`
    : title || `${t('voiceDictationStart' as any) || 'Spracheingabe'} (${currentLangLabel})`;

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
    <div className="relative inline-flex items-center">
      <button
        type="button"
        id={id}
        onClick={toggleListening}
        disabled={disabled}
        title={tooltipText}
        aria-label={tooltipText}
        className={`relative rounded-lg flex items-center justify-center transition-all cursor-pointer select-none ${sizeClasses} ${
          isListening
            ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 ring-offset-1 animate-pulse shadow-md'
            : isStarting
            ? 'bg-amber-100 text-amber-800'
            : 'bg-slate-100 hover:bg-teal-50 text-slate-500 hover:text-teal-700 hover:border-teal-300 border border-slate-200'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      >
        {isStarting ? (
          <Loader2 className={`${iconSizes} animate-spin text-amber-700`} />
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
  );
};
