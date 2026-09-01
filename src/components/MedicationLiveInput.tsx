import React, { useState, useEffect, useRef } from 'react';
import { searchMedications, MedicationSuggestion, COMMON_MEDICATIONS_DB } from '../services/medicationDatabase';
import { Pill, Check, Search } from 'lucide-react';

interface MedicationLiveInputProps {
  index: number;
  med: { name: string; dosierung: string; einnahmeart: string };
  onChange: (updated: { name: string; dosierung: string; einnahmeart: string }) => void;
  onRemove: () => void;
  t: (key: any) => string;
}

export const MedicationLiveInput: React.FC<MedicationLiveInputProps> = ({
  index,
  med,
  onChange,
  onRemove,
  t
}) => {
  const [query, setQuery] = useState(med.name || '');
  const [suggestions, setSuggestions] = useState<MedicationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<MedicationSuggestion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query with prop if updated externally
  useEffect(() => {
    setQuery(med.name || '');
  }, [med.name]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (val: string) => {
    setQuery(val);
    onChange({ ...med, name: val });

    if (val.trim().length >= 1) {
      const results = await searchMedications(val);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const handleSelectMedication = (suggestion: MedicationSuggestion) => {
    setQuery(suggestion.name);
    setSelectedSuggestion(suggestion);
    setIsOpen(false);

    // Auto-select first dosage if not set yet
    const newDosage = med.dosierung || (suggestion.defaultDosages && suggestion.defaultDosages.length > 0 ? suggestion.defaultDosages[0] : '');
    onChange({
      ...med,
      name: suggestion.name,
      dosierung: newDosage,
    });
  };

  // Find matching suggestion from DB if name already exists
  const currentDbMatch = selectedSuggestion || COMMON_MEDICATIONS_DB.find(
    m => m.name.toLowerCase() === (med.name || '').toLowerCase()
  );

  return (
    <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 relative group">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[11px] font-bold">
            {index + 1}
          </span>
          <span>{t('medication') || 'Medikament'}</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-rose-600 text-xs font-semibold px-2 py-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
        >
          {t('btnRemove') || t('delete') || 'Entfernen'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        {/* Name with Live Search */}
        <div className="sm:col-span-5 relative" ref={containerRef}>
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            {t('medication') || 'Medikament'}
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="z.B. Ibuprofen, Paracetamol..."
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (query.trim().length >= 1) {
                  searchMedications(query).then(res => {
                    setSuggestions(res);
                    setIsOpen(res.length > 0);
                  });
                }
              }}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-lg border border-slate-200 shadow-xl max-h-56 overflow-y-auto py-1 animate-in fade-in-50 duration-100">
              {suggestions.map((s, sIdx) => (
                <button
                  key={sIdx}
                  type="button"
                  onClick={() => handleSelectMedication(s)}
                  className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors flex items-center justify-between text-xs border-b border-slate-50 last:border-none cursor-pointer"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    {s.activeSubstance && s.activeSubstance !== s.name && (
                      <span className="text-[10px] text-slate-500 block">{s.activeSubstance}</span>
                    )}
                    {s.category && (
                      <span className="text-[10px] text-teal-700 block font-medium">{s.category}</span>
                    )}
                  </div>
                  {s.defaultDosages && s.defaultDosages.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                      {s.defaultDosages[0]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dosage with quick dosage selection badges */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            {t('dosage') || 'Dosierung'}
          </label>
          <input
            type="text"
            placeholder="z.B. 400 mg"
            value={med.dosierung || ''}
            onChange={(e) => onChange({ ...med, dosierung: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
          />

          {/* Quick Dosage Badges */}
          {currentDbMatch && currentDbMatch.defaultDosages && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {currentDbMatch.defaultDosages.map((d, dIdx) => (
                <button
                  key={dIdx}
                  type="button"
                  onClick={() => onChange({ ...med, dosierung: d })}
                  className={`text-[10px] px-1.5 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                    med.dosierung === d
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Intake Method */}
        <div className="sm:col-span-4">
          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
            {t('intake') || 'Einnahmeart / Häufigkeit'}
          </label>
          <input
            type="text"
            placeholder="z.B. 1-2x täglich, bei Bedarf"
            value={med.einnahmeart || ''}
            onChange={(e) => onChange({ ...med, einnahmeart: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-shadow"
          />

          <div className="flex flex-wrap gap-1 mt-1.5">
            {['1x täglich', '2x täglich', 'Bei Bedarf', 'Morgens nüchtern'].map((freq, fIdx) => (
              <button
                key={fIdx}
                type="button"
                onClick={() => onChange({ ...med, einnahmeart: freq })}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  med.einnahmeart === freq
                    ? 'bg-teal-100 text-teal-900 border border-teal-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {freq}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
