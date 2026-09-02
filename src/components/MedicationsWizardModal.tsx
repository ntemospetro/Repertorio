import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { MedicationLiveInput, MedicationData } from './MedicationLiveInput';
import { X, Plus, Pill, Save, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nimmtMedikamente?: boolean;
  medikamenteList?: Array<MedicationData>;
  onSave: (data: { nimmtMedikamente: boolean; medikamenteList: Array<MedicationData> }) => void;
  patientName?: string;
}

export const MedicationsWizardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  nimmtMedikamente = false,
  medikamenteList = [],
  onSave,
  patientName
}) => {
  const { t } = useLanguage();
  const [list, setList] = useState<Array<MedicationData>>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (medikamenteList && medikamenteList.length > 0) {
        setList([...medikamenteList]);
      } else {
        // Beim Öffnen erscheinen bereits die Felder für das erste Medikament
        setList([{ name: '', dosierung: '', einnahmeart: '', grund: '' }]);
      }
      setShowCloseConfirm(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen, medikamenteList]);

  if (!isOpen) return null;

  const handleAddMedication = () => {
    setList(prev => [...prev, { name: '', dosierung: '', einnahmeart: '', grund: '' }]);
  };

  const handleUpdateMedication = (index: number, updated: MedicationData) => {
    setList(prev => {
      const copy = [...prev];
      copy[index] = updated;
      return copy;
    });
  };

  const handleRemoveMedication = (index: number) => {
    setList(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      if (copy.length === 0) {
        return [{ name: '', dosierung: '', einnahmeart: '', grund: '' }];
      }
      return copy;
    });
  };

  const handleSaveAndClose = () => {
    // Wenn alles leer bleibt, nimmt er keine Medikamente ein und es werden keine berücksichtigt
    const cleanedList = list.filter(m => m.name && m.name.trim() !== '');
    const finalTakes = cleanedList.length > 0;
    onSave({
      nimmtMedikamente: finalTakes,
      medikamenteList: cleanedList
    });
    onClose();
  };

  const handleRequestClose = () => {
    const hasEnteredData = list.some(m => m.name && m.name.trim() !== '');
    if (hasEnteredData) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-xs">
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{t('medicationIntakeTitle' as TranslationKey)}</h2>
              {patientName && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Patient: <span className="text-slate-700 font-semibold">{patientName}</span>
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            id="btn-close-medications-modal"
            onClick={handleRequestClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          {/* Subtitle / Description Box */}
          <div className="bg-teal-50/60 border border-teal-200/70 rounded-xl p-4 flex items-start gap-3">
            <Pill className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800 text-sm">
                {t('takeMedication' as TranslationKey)}
              </p>
              <p className="text-slate-600 leading-relaxed">
                {t('addMedInfo' as TranslationKey)}
              </p>
            </div>
          </div>

          {/* Medication List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>{t('medications' as TranslationKey)} ({list.length})</span>
              </h4>
              <button
                type="button"
                id="btn-add-medication-top"
                onClick={handleAddMedication}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition-colors border border-teal-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('addMedication' as TranslationKey)}</span>
              </button>
            </div>

            <div className="space-y-3">
              {list.map((med, index) => (
                <MedicationLiveInput
                  key={index}
                  index={index}
                  med={med}
                  onChange={(updated) => handleUpdateMedication(index, updated)}
                  onRemove={() => handleRemoveMedication(index)}
                  t={t}
                />
              ))}
            </div>

            <button
              type="button"
              id="btn-add-medication-bottom"
              onClick={handleAddMedication}
              className="w-full py-2.5 px-3 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('addMedication' as TranslationKey)}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50/80">
          <button
            type="button"
            id="btn-cancel-medications-modal"
            onClick={handleRequestClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            id="btn-save-medications-modal"
            onClick={handleSaveAndClose}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{t('btnCompleteAnamnesis')}</span>
          </button>
        </div>

        {/* Close Confirmation Dialog */}
        {showCloseConfirm && !showDiscardConfirm && (
          <div className="absolute inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizardCloseTitle')}</h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('wizardCloseDesc')}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('wizardBtnSaveClose')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(true)}
                  className="w-full px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('wizardBtnDiscard')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('wizardBtnCancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-rose-600 mb-2">{t('wizardDiscardTitle')}</h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('wizardDiscardDesc')}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    setShowCloseConfirm(false);
                    onClose();
                  }}
                  className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('wizardBtnConfirmDiscard')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                >
                  {t('wizardBtnKeepEditing')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
