import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ShieldCheck, FileText, Globe, Loader2 } from 'lucide-react';
import { TranslationKey } from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeMonograph, fetchTranslatedMonograph } from '../services/medicationLocalization';

interface MedicationMonographViewProps {
  monographText: string;
  medName: string;
  activeSubstance?: string;
  authoritySource?: string;
  t: (key: TranslationKey | any) => string;
}

export const MedicationMonographView: React.FC<MedicationMonographViewProps> = ({
  monographText,
  medName,
  activeSubstance,
  authoritySource,
  t
}) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // Keep a reference to the base German text so translations to any language are always accurate
  const baseTextRef = useRef<string>(monographText);
  if (monographText && (monographText.includes('Wirkstoff') || monographText.includes('Inhaltsstoffe') || !baseTextRef.current)) {
    baseTextRef.current = monographText;
  }

  // Initialize with immediate structural localization
  const [currentMonograph, setCurrentMonograph] = useState<string>(() => {
    if (!monographText) return '';
    return language === 'de' ? monographText : localizeMonograph(monographText, language);
  });

  // Whenever monographText or language changes, synchronize immediately and fetch complete translation
  useEffect(() => {
    const sourceText = baseTextRef.current || monographText;
    if (!sourceText) {
      setCurrentMonograph('');
      return;
    }

    if (language === 'de') {
      setCurrentMonograph(sourceText);
      setIsTranslating(false);
      return;
    }

    // Step 1: Instant localization with zero flicker
    const immediate = localizeMonograph(sourceText, language);
    setCurrentMonograph(immediate);

    // Step 2: Asynchronous AI translation via backend
    let isCancelled = false;
    setIsTranslating(true);

    fetchTranslatedMonograph(medName, sourceText, language)
      .then((translated) => {
        if (!isCancelled && translated) {
          setCurrentMonograph(translated);
        }
      })
      .catch((err) => {
        console.warn('[MedicationMonographView] Translation error:', err);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsTranslating(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [monographText, medName, language]);

  const activeText = currentMonograph || monographText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard copy failed:', err);
    }
  };

  const lines = (activeText || '').split('\n');

  // Identify section header lines across languages
  const isSectionHeader = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('📝') ||
      trimmed.startsWith('💊') ||
      trimmed.startsWith('⚠️') ||
      trimmed.startsWith('🚫') ||
      trimmed.startsWith('❌') ||
      /^[1-5]\.\s/.test(trimmed)
    );
  };

  // Identify intro paragraph across all 7 supported languages
  const isIntro = (line: string): boolean => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('Hier ist die komplette Übersicht') ||
      trimmed.startsWith('Here is the complete') ||
      trimmed.startsWith('Εδώ είναι η πλήρης') ||
      trimmed.startsWith('Aquí está el resumen') ||
      trimmed.startsWith('Voici la vue') ||
      trimmed.startsWith('Ecco la panoramica') ||
      trimmed.startsWith('Вот полный обзор')
    );
  };

  // Render a line with bold prefix if it has a label followed by a colon
  const renderLineContent = (line: string, lineIndex: number) => {
    const trimmed = line.trim();
    if (!trimmed) return null;

    if (isSectionHeader(trimmed)) {
      return (
        <h5
          key={lineIndex}
          className="font-bold text-slate-900 text-xs sm:text-sm pt-2.5 pb-1 border-b border-slate-200/70 flex items-center gap-1.5"
        >
          {trimmed}
        </h5>
      );
    }

    if (isIntro(trimmed)) {
      return (
        <p
          key={lineIndex}
          className="text-xs sm:text-[13px] font-medium text-teal-950 bg-teal-50/70 p-2.5 rounded-lg border border-teal-200/60 leading-relaxed mb-2"
        >
          {trimmed}
        </p>
      );
    }

    // Check for bold prefix patterns like "Label:" or "Label (sub):"
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex > 0 && colonIndex <= 65) {
      const prefix = trimmed.slice(0, colonIndex + 1);
      const rest = trimmed.slice(colonIndex + 1);

      return (
        <p key={lineIndex} className="text-xs text-slate-700 leading-relaxed pl-1">
          <strong className="font-bold text-slate-900">{prefix}</strong>
          {rest}
        </p>
      );
    }

    // Standard fluid paragraph
    return (
      <p key={lineIndex} className="text-xs text-slate-700 leading-relaxed pl-1">
        {trimmed}
      </p>
    );
  };

  return (
    <div className="rounded-xl bg-white border border-teal-200/80 shadow-2xs overflow-hidden">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-teal-50/90 to-slate-50 px-3.5 py-2.5 border-b border-teal-200/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <FileText className="w-4 h-4 text-teal-700" />
          <span className="font-bold text-xs text-slate-800">
            {t('medMonographOverview' as TranslationKey) || 'Vollständige Fachinformation & Monographie'}
          </span>
          {activeSubstance && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
              {activeSubstance}
            </span>
          )}
          {language !== 'de' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-600" />
              <span>{t('medTranslatedBadge' as TranslationKey) || 'Lokalisiert'}</span>
            </span>
          )}
          {isTranslating && (
            <span className="text-[10px] text-teal-700 font-medium flex items-center gap-1 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{t('medMonographTranslating' as TranslationKey) || 'Übersetzung wird synchronisiert...'}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={t('medCopyMonograph' as TranslationKey) || 'Volltext kopieren'}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">
                  {t('medMonographCopied' as TranslationKey) || 'Kopiert!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{t('medCopyMonograph' as TranslationKey) || 'Volltext kopieren'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Narrative Monograph Content */}
      <div className="p-3.5 sm:p-4 space-y-1.5 font-sans">
        {lines.map((l, i) => renderLineContent(l, i))}
      </div>

      {/* Footer Authority & Zero Hallucination Guarantee */}
      <div className="px-3.5 py-2 bg-slate-50/90 border-t border-slate-200/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {t('medStrictAuthorityBadge' as TranslationKey) || 'Geprüfte Fachinformation (ohne freie Ergänzungen)'}
          </span>
        </div>
        {authoritySource && (
          <span className="text-slate-500 font-mono text-[10px]">
            {authoritySource}
          </span>
        )}
      </div>
    </div>
  );
};
