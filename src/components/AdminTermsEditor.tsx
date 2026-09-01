import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  RotateCcw, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  ShieldCheck, 
  Scale, 
  BookOpen, 
  Calendar,
  Layers,
  Sparkles,
  Globe
} from 'lucide-react';
import { 
  getTermsAndConditions, 
  saveTermsAndConditions, 
  resetTermsAndConditionsToDefault 
} from '../services/storage';
import { TermsAndConditions } from '../data/defaultTerms';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../i18n/translations';
import { useTranslation } from '../i18n/LanguageContext';

export const AdminTermsEditor: React.FC = () => {
  const { language: currentLang } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(currentLang);
  const [terms, setTerms] = useState<TermsAndConditions>(() => getTermsAndConditions(currentLang));
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setTerms(getTermsAndConditions(selectedLang));
    setHasChanges(false);
  }, [selectedLang]);

  useEffect(() => {
    const handleUpdate = () => {
      setTerms(getTermsAndConditions(selectedLang));
    };
    window.addEventListener('homoeo_terms_updated', handleUpdate);
    return () => window.removeEventListener('homoeo_terms_updated', handleUpdate);
  }, [selectedLang]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    saveTermsAndConditions(terms, selectedLang);
    setHasChanges(false);
    showToast(`AGB (${selectedLang.toUpperCase()}) erfolgreich gespeichert und für alle Registrierungen aktiviert.`);
  };

  const handleResetToDefault = () => {
    const langObj = LANGUAGES.find(l => l.code === selectedLang);
    const langName = langObj ? `${langObj.flag} ${langObj.nativeName} (${langObj.label})` : selectedLang.toUpperCase();
    if (window.confirm(`Möchten Sie die AGB für ${langName} wirklich auf den Standard-Beispieltext zurücksetzen? Eigene Änderungen gehen dabei verloren.`)) {
      const reset = resetTermsAndConditionsToDefault(selectedLang);
      setTerms(reset);
      setHasChanges(false);
      showToast(`AGB (${selectedLang.toUpperCase()}) auf den rechtssicheren Standard-Beispieltext zurückgesetzt.`);
    }
  };

  const sectionCount = (terms.content.match(/^###\s/gm) || []).length;
  const wordCount = terms.content.trim().split(/\s+/).filter(Boolean).length;

  const renderFormattedPreview = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }
      
      if (trimmed.startsWith('### ')) {
        const title = trimmed.replace('### ', '');
        return (
          <div key={idx} className="mt-5 mb-2 pb-1 border-b border-slate-200">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full bg-teal-600 inline-block" />
              <span>{title}</span>
            </h4>
          </div>
        );
      }
      
      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace('## ', '');
        return (
          <h3 key={idx} className="text-sm font-bold text-slate-950 mt-5 mb-2">
            {title}
          </h3>
        );
      }

      if (trimmed === '---') {
        return <hr key={idx} className="my-3 border-slate-200" />;
      }

      if (trimmed.startsWith('- ')) {
        const item = trimmed.replace('- ', '');
        return (
          <li key={idx} className="ml-4 list-disc text-slate-700 text-xs leading-relaxed my-1">
            {renderInlineFormatting(item)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-700 leading-relaxed my-1.5">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-slate-800 flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Info Card */}
      <div className="card p-5 sm:p-6 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200/60">
                  Recht & Compliance • DSGVO
                </span>
                <span className="text-xs text-slate-400">
                  Aktiv auf Registrierungsseite
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                Allgemeine Geschäftsbedingungen (AGB) & Nutzungsvertrag
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verwalten und bearbeiten Sie die rechtssicheren AGB für alle 7 unterstützten Sprachen. Bei Registrierung öffnet sich der Text im modalen Popup.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Auf Standard-Beispieltext zurücksetzen"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Mustertext ({selectedLang.toUpperCase()})</span>
            </button>

            <button
              onClick={handleSave}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer ${
                hasChanges 
                  ? 'bg-teal-600 hover:bg-teal-700 ring-2 ring-teal-500/30' 
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Änderungen speichern</span>
            </button>
          </div>
        </div>

        {/* Language Selection Tabs for Admin */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-500 mr-1" />
            <span className="text-xs font-bold text-slate-600 mr-1">Sprache der AGB:</span>
            <div className="flex flex-wrap gap-1">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    if (hasChanges) {
                      if (window.confirm('Sie haben ungespeicherte Änderungen. Möchten Sie trotzdem die Sprache wechseln?')) {
                        setSelectedLang(lang.code);
                      }
                    } else {
                      setSelectedLang(lang.code);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.code.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Aktiv: <strong className="text-slate-800">{LANGUAGES.find(l => l.code === selectedLang)?.nativeName} ({LANGUAGES.find(l => l.code === selectedLang)?.label})</strong>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Paragraphen (§)</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">{sectionCount} Abschnitte</div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Wortanzahl</div>
            <div className="text-sm font-bold font-mono text-slate-800 mt-0.5">{wordCount} Wörter</div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Version</div>
            <div className="text-sm font-bold font-mono text-teal-700 mt-0.5">{terms.version}</div>
          </div>
          <div className="p-2.5 rounded-md bg-slate-50 border border-slate-100">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Stand der AGB</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{terms.lastUpdated}</div>
          </div>
        </div>
      </div>

      {/* Main Editor Card */}
      <div className="card overflow-hidden border border-slate-200 bg-white">
        {/* Subtab Toggle (Editor vs. Live-Vorschau) */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                activeSubTab === 'editor'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>AGB bearbeiten (Markdown)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer ${
                activeSubTab === 'preview'
                  ? 'bg-white text-teal-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live-Vorschau (Wie Therapeut sieht)</span>
            </button>
          </div>

          {hasChanges && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              Ungespeicherte Änderungen ({selectedLang.toUpperCase()})
            </span>
          )}
        </div>

        {/* Metadata Inputs */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Titel des Dokuments
            </label>
            <input
              type="text"
              value={terms.title}
              onChange={(e) => {
                setTerms({ ...terms, title: e.target.value });
                setHasChanges(true);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Stand / Gültigkeitsdatum
            </label>
            <input
              type="text"
              value={terms.lastUpdated}
              onChange={(e) => {
                setTerms({ ...terms, lastUpdated: e.target.value });
                setHasChanges(true);
              }}
              placeholder="z.B. Januar 2026"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Versionsnummer
            </label>
            <input
              type="text"
              value={terms.version}
              onChange={(e) => {
                setTerms({ ...terms, version: e.target.value });
                setHasChanges(true);
              }}
              placeholder="z.B. 2.4"
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:border-teal-600"
            />
          </div>
        </div>

        {/* Editor Body or Preview Body */}
        {activeSubTab === 'editor' ? (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>Unterstützt Markdown: <code className="text-teal-700 font-mono">### Paragraphentitel</code>, <code className="text-teal-700 font-mono">**Fett**</code>, <code className="text-teal-700 font-mono">- Aufzählungspunkt</code></span>
              </div>
            </div>

            <textarea
              id="agb-editor-textarea"
              rows={22}
              value={terms.content}
              onChange={(e) => {
                setTerms({ ...terms, content: e.target.value });
                setHasChanges(true);
              }}
              className="w-full p-4 font-mono text-xs leading-relaxed text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 transition-all resize-y shadow-inner"
              placeholder="Fügen Sie hier den vollständigen Text der Allgemeinen Geschäftsbedingungen ein..."
            />
          </div>
        ) : (
          <div className="p-6 bg-white min-h-[500px]">
            <div className="max-w-2xl mx-auto border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Scale className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">{terms.title}</h3>
                    <div className="text-[10px] text-slate-400">
                      Stand: {terms.lastUpdated} • Version {terms.version}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-2 bg-teal-50 border-b border-teal-100 flex items-center gap-2 text-teal-900 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Rechtssicherer Rahmen für Heilpraktiker und homöopathische Ärzte: Enthält Bestimmungen zu Haftungsausschluss, DSGVO-konformer Speicherung und Kontingenten.</span>
              </div>

              <div className="p-5 overflow-y-auto max-h-[420px] bg-white text-xs">
                {renderFormattedPreview(terms.content)}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>Dokument ist rechtlich bindend</span>
                </div>
                <span className="font-medium text-teal-700">Vorschau-Modus</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Letzte Speicherung gilt sofort für alle neuen Therapeutenregistrierungen in dieser Sprache ({selectedLang.toUpperCase()}).
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>AGB für {selectedLang.toUpperCase()} speichern</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
