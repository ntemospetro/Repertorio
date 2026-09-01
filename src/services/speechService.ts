import { LanguageCode } from '../types';

export const LANGUAGE_SPEECH_MAP: Record<LanguageCode, string> = {
  de: 'de-DE',
  en: 'en-US',
  fr: 'fr-FR',
  el: 'el-GR',
  it: 'it-IT',
  ru: 'ru-RU',
  es: 'es-ES',
};

export const LANGUAGE_DISPLAY_NAMES: Record<LanguageCode, string> = {
  de: 'Deutsch (de-DE)',
  en: 'English (en-US)',
  fr: 'Français (fr-FR)',
  el: 'Ελληνικά (el-GR)',
  it: 'Italiano (it-IT)',
  ru: 'Русский (ru-RU)',
  es: 'Español (es-ES)',
};

export interface SpeechRecognitionOptions {
  language: LanguageCode;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface SpeechRecognitionSession {
  stop: () => void;
  abort: () => void;
}

// Window typing for Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function cleanTranscriptDuplicates(finalText: string, interimText: string): string {
  const f = finalText.trim();
  const i = interimText.trim();

  if (!i) return deduplicateRepeatedPhrases(f);
  if (!f) return deduplicateRepeatedPhrases(i);

  // Case 1: interimText already starts with or contains finalText
  if (i.toLowerCase().startsWith(f.toLowerCase())) {
    return deduplicateRepeatedPhrases(i);
  }

  // Case 2: finalText already ends with interimText
  if (f.toLowerCase().endsWith(i.toLowerCase())) {
    return deduplicateRepeatedPhrases(f);
  }

  // Case 3: Check for word overlap at the boundary
  const fWords = f.split(/\s+/);
  const iWords = i.split(/\s+/);
  const maxCheck = Math.min(fWords.length, iWords.length, 15);
  let overlapCount = 0;

  for (let len = maxCheck; len >= 1; len--) {
    const fSlice = fWords.slice(-len).map(w => w.toLowerCase().replace(/[.,!?;:]/g, '')).join(' ');
    const iSlice = iWords.slice(0, len).map(w => w.toLowerCase().replace(/[.,!?;:]/g, '')).join(' ');
    if (fSlice && fSlice === iSlice) {
      overlapCount = len;
      break;
    }
  }

  let merged = '';
  if (overlapCount > 0) {
    const remainingInterim = iWords.slice(overlapCount).join(' ');
    merged = remainingInterim ? `${f} ${remainingInterim}` : f;
  } else {
    merged = `${f} ${i}`;
  }

  return deduplicateRepeatedPhrases(merged);
}

export function deduplicateRepeatedPhrases(text: string): string {
  if (!text) return '';
  // Deduplicate consecutive identical phrases or sentences
  const sentences = text.split(/(?<=[.?!;])\s+/);
  const cleanSentences: string[] = [];

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    const normalizedCurrent = trimmed.toLowerCase().replace(/[.,!?;:]/g, '').trim();
    const last = cleanSentences[cleanSentences.length - 1];
    const normalizedLast = last ? last.toLowerCase().replace(/[.,!?;:]/g, '').trim() : '';

    if (last && normalizedCurrent === normalizedLast) {
      continue; // Skip consecutive repeated sentence
    }
    cleanSentences.push(trimmed);
  }

  return cleanSentences.join(' ');
}

export function startSpeechRecognition(
  options: SpeechRecognitionOptions
): SpeechRecognitionSession {
  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  if (!SpeechRecognitionClass) {
    if (options.onError) {
      options.onError('not_supported');
    }
    return {
      stop: () => {},
      abort: () => {},
    };
  }

  let recognition: any;
  try {
    recognition = new SpeechRecognitionClass();
  } catch (err: any) {
    if (options.onError) {
      options.onError(err?.message || 'init_failed');
    }
    return {
      stop: () => {},
      abort: () => {},
    };
  }

  const locale = LANGUAGE_SPEECH_MAP[options.language] || 'de-DE';
  recognition.lang = locale;
  recognition.continuous = options.continuous !== false;
  recognition.interimResults = options.interimResults !== false;
  recognition.maxAlternatives = 1;

  let isManualStop = false;

  recognition.onstart = () => {
    if (options.onStart) options.onStart();
  };

  recognition.onresult = (event: any) => {
    let sessionFinal = '';
    let sessionInterim = '';

    const results = event.results;
    if (!results) return;

    for (let i = 0; i < results.length; ++i) {
      const item = results[i];
      const transcript = item[0]?.transcript || '';
      const trimmed = transcript.trim();
      if (!trimmed) continue;

      if (item.isFinal) {
        // Prevent duplicate final chunks
        const prevWords = sessionFinal.toLowerCase().replace(/[.,!?;:]/g, '').trim();
        const curWords = trimmed.toLowerCase().replace(/[.,!?;:]/g, '').trim();
        if (!sessionFinal || (prevWords !== curWords && !prevWords.endsWith(curWords))) {
          sessionFinal += (sessionFinal ? ' ' : '') + trimmed;
        }
      } else {
        sessionInterim += (sessionInterim ? ' ' : '') + trimmed;
      }
    }

    const cleaned = cleanTranscriptDuplicates(sessionFinal, sessionInterim);
    if (cleaned.trim()) {
      options.onResult(cleaned.trim(), sessionInterim.length === 0);
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech' || event.error === 'aborted') {
      // Ignorable non-fatal errors
      return;
    }
    if (options.onError) {
      options.onError(event.error || 'speech_error');
    }
  };

  recognition.onend = () => {
    if (options.onEnd) {
      options.onEnd();
    }
  };

  try {
    recognition.start();
  } catch (err: any) {
    if (options.onError) {
      options.onError(err?.message || 'start_failed');
    }
  }

  return {
    stop: () => {
      isManualStop = true;
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    },
    abort: () => {
      isManualStop = true;
      try {
        recognition.abort();
      } catch (e) {
        // ignore
      }
    },
  };
}
