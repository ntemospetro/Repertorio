import React, { useState, useEffect } from 'react';
import { anamnesisSchema } from '../data/anamnesisSchema';
import translatedDicts from '../data/anamnesisTranslations.json';
//  from '../data/anamnesisSchema';
import { AnamnesisStepConfig, AnamnesisField } from '../types.extendedAnamnesis';
import { useLanguage } from '../i18n/LanguageContext';
import { VoiceInputButton } from './VoiceInputButton';
import { X, ArrowRight, ArrowLeft, Plus, Trash2, Save, CheckCircle2, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any;
  onSave: (data: any) => void;
  patientName?: string;
}

export const ExtendedAnamnesisWizard: React.FC<Props> = ({ isOpen, onClose, initialData, onSave, patientName }) => {
    const { language, t } = useLanguage();
  
const [currentStep, setCurrentStep] = useState(0);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [values, setValues] = useState<any>(initialData || {});

  useEffect(() => {
    if (isOpen) {
      setShowCloseConfirm(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const actualDicts = (translatedDicts as any).default || translatedDicts;
  const dict = language === 'de' ? {} : (actualDicts[language] || actualDicts['en'] || {});
  const tSchema = (text: string) => dict[text] || text;
  const steps = anamnesisSchema;
  console.log('TranslatedDicts:', typeof translatedDicts, translatedDicts);
  const currentStepConfig = steps[currentStep];
  console.log('Language:', language, 'Dict Keys:', Object.keys(dict).length, 'Title:', dict['1. Gesundheitszustand'], dict);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      onSave(values);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const updateValue = (fieldId: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [fieldId]: value }));
  };

  const isConditionMet = (field: AnamnesisField): boolean => {
    if (!field.condition) return true;
    const val = values[field.condition.fieldId];
    if (field.condition.operator === 'includes') {
      return Array.isArray(val) && val.includes(field.condition.value);
    }
    return val === field.condition.value;
  };

  const renderField = (field: AnamnesisField, prefix = '') => {
    if (!isConditionMet(field)) return null;

    const fullId = prefix ? `${prefix}.${field.id}` : field.id;
    
    // For nested fields in dynamic lists we need to extract from values based on path.
    // To keep it simple, prefix is only used for dynamic lists. We will pass a localized value object instead of full path.
    // Wait, let's keep it simple. If we use dynamic lists, they maintain their own array of objects.
    // We will handle dynamic lists separately.
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 sm:p-6">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{t('extAnamnesisTitle')}</h2>
            {patientName && <p className="text-xs text-slate-500 font-medium mt-0.5">Patient: {patientName}</p>}
          </div>
          <button onClick={() => setShowCloseConfirm(true)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {/* Progress indicator */}
          <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md">
              {t('stepProgress' as any)?.replace('{current}', String(currentStep + 1)).replace('{total}', String(steps.length)) || `Schritt ${currentStep + 1} von ${steps.length}`}
            </span>
            <span>{tSchema(currentStepConfig.title)}</span>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">{tSchema(currentStepConfig.title)}</h3>
            
            <div className="space-y-4">
              {currentStepConfig.fields.map((field, index) => (
                <FieldRenderer 
                  key={field.id} 
                  field={field}
                  index={index}
                  category={currentStepConfig.title}
                  values={values} 
                  onChange={(val) => updateValue(field.id, val)} 
                  isConditionMet={isConditionMet}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentStep === 0 ? 'text-slate-400 cursor-not-allowed' : 'text-slate-700 hover:bg-slate-200 bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('btnStepBack')}
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {t('btnStepNext')}
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                onSave(values);
                onClose();
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <Save className="w-4 h-4" />
              {t('btnCompleteAnamnesis')}
            </button>
          )}
        </div>
      
        {/* Close Confirmation Dialog */}
        {showCloseConfirm && !showDiscardConfirm && (
          <div className="absolute inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{t('wizardCloseTitle' as any) || 'Fortschritt speichern?'}</h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('wizardCloseDesc' as any) || 'Möchten Sie die bisherigen Antworten speichern, bevor Sie den Fragebogen schließen?'}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    onSave(values);
                    onClose();
                  }}
                  className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('wizardBtnSaveClose' as any) || 'Speichern & Schließen'}
                </button>
                <button
                  onClick={() => setShowDiscardConfirm(true)}
                  className="w-full px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('wizardBtnDiscard' as any) || 'Nicht speichern'}
                </button>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('wizardBtnCancel' as any) || 'Abbrechen'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Discard Confirmation Dialog */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-[200] bg-slate-900/40 flex items-center justify-center p-4 rounded-2xl">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-rose-600 mb-2">{t('wizardDiscardTitle' as any) || 'Sind Sie sicher?'}</h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('wizardDiscardDesc' as any) || 'Alle ungespeicherten Eingaben in diesem Fragebogen gehen dauerhaft verloren.'}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => onClose()}
                  className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('wizardBtnConfirmDiscard' as any) || 'Ja, verwerfen'}
                </button>
                <button
                  onClick={() => {
                    setShowDiscardConfirm(false);
                    setShowCloseConfirm(false);
                  }}
                  className="w-full px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
                >
                  {t('wizardBtnKeepEditing' as any) || 'Weiter bearbeiten'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Extracted Field Renderer to handle recursion easily
const FieldRenderer: React.FC<{ 
  field: AnamnesisField, 
  values: any, 
  onChange: (val: any) => void, 
  isConditionMet: (f: AnamnesisField) => boolean,
  index?: number,
  category?: string,
  isNested?: boolean
}> = ({ field, values, onChange, isConditionMet, index = 0, category = '', isNested = false }) => {
  const { language } = useLanguage();
  const actualDicts = (translatedDicts as any).default || translatedDicts;
  const dict = language === 'de' ? {} : (actualDicts[language] || actualDicts['en'] || {});
  const tSchema = (text: string) => dict[text] || text;
  
  if (!isConditionMet(field)) return null;

  const value = values[field.id];
  const isAnswered = value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true);

  // Wrapper for top-level questions
  const Wrapper = isNested ? React.Fragment : ({ children }: { children: React.ReactNode }) => (
    <div
      id={index === 0 ? 'dynamic-complaint-first-question' : `question-card-${field.id}`}
      data-question-index={index}
      className={`p-5 rounded-2xl border transition-all scroll-mt-4 ${
        isAnswered
          ? 'bg-white border-teal-200/90 shadow-2xs'
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Question Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold flex items-center justify-center font-mono shrink-0">
              {index + 1}
            </span>
            {category && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wide">
                {tSchema(category)}
              </span>
            )}
            {isAnswered ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3" /> {dict['complaintQuestionsStatusDone'] || 'Erledigt'}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                {dict['complaintQuestionsStatusOpen'] || 'Offen'}
              </span>
            )}
          </div>
          <h4 className="text-sm font-bold text-slate-900 leading-snug pt-0.5">
            {tSchema(field.label)}
          </h4>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const innerContent = () => {
    if (field.type === 'conditional_group') {
      return (
        <div className="pl-4 border-l-2 border-teal-100 space-y-4 mt-2">
          {field.subFields?.map((sub, subIdx) => (
            <div key={sub.id} className="space-y-2">
              <label className="block text-sm font-bold text-slate-800">{tSchema(sub.label)}</label>
              <FieldRenderer 
                field={sub} 
                values={values[field.id] || {}} 
                onChange={(val) => {
                  const currentObj = values[field.id] || {};
                  onChange({ ...currentObj, [sub.id]: val });
                }} 
                isConditionMet={() => true} 
                isNested={true}
              />
            </div>
          ))}
        </div>
      );
    }

    if (field.type === 'dynamic_list') {
      const list = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-4">
          {isNested && <label className="block text-sm font-bold text-slate-800">{tSchema(field.label)}</label>}
          {list.map((item: any, i: number) => (
            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 relative group">
              <button
                onClick={() => {
                  const newList = [...list];
                  newList.splice(i, 1);
                  onChange(newList);
                }}
                className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Entfernen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="space-y-4 pr-6">
                {field.subFields?.map(sub => (
                  <div key={sub.id}>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">{sub.label}</label>
                    {sub.type === 'radio' && sub.options && (
                      <div className="space-y-1.5">
                        {sub.options.map((opt, oIdx) => {
                          const isSelected = item[sub.id] === opt;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                const newList = [...list];
                                newList[i] = { ...newList[i], [sub.id]: opt };
                                onChange(newList);
                              }}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold shadow-2xs'
                                  : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'border-teal-600 bg-teal-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </div>
                              <span className="leading-snug">{tSchema(opt)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {sub.type === 'checkbox' && sub.options && (
                      <div className="space-y-1.5">
                        {sub.options.map((opt, oIdx) => {
                          const currentArr = Array.isArray(item[sub.id]) ? [...item[sub.id]] : [];
                          const isSelected = currentArr.includes(opt);
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => {
                                const newList = [...list];
                                if (isSelected) {
                                  const idxToRemove = currentArr.indexOf(opt);
                                  if (idxToRemove > -1) currentArr.splice(idxToRemove, 1);
                                } else {
                                  currentArr.push(opt);
                                }
                                newList[i] = { ...newList[i], [sub.id]: currentArr };
                                onChange(newList);
                              }}
                              className={`text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2 ${
                                isSelected
                                  ? 'bg-teal-50/90 border-teal-600 text-teal-950 font-semibold shadow-2xs ring-1 ring-teal-600'
                                  : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                  isSelected
                                    ? 'border-teal-600 bg-teal-600 text-white'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <span className="leading-snug">{tSchema(opt)}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {(sub.type === 'text' || sub.type === 'number') && (
                      <div className="relative flex items-center">
                        <input
                          type={sub.type}
                          placeholder={sub.placeholder ? tSchema(sub.placeholder) : ''}
                          value={item[sub.id] || ''}
                          onChange={(e) => {
                            const newList = [...list];
                            newList[i] = { ...newList[i], [sub.id]: e.target.value };
                            onChange(newList);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                    {sub.type === 'textarea' && (
                      <div className="relative flex items-center">
                        <textarea
                          placeholder={sub.placeholder ? tSchema(sub.placeholder) : ''}
                          value={item[sub.id] || ''}
                          onChange={(e) => {
                            const newList = [...list];
                            newList[i] = { ...newList[i], [sub.id]: e.target.value };
                            onChange(newList);
                          }}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors min-h-[80px]"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => onChange([...list, {}])}
            className="flex items-center justify-center w-full gap-1.5 text-sm font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-3 rounded-xl transition-colors border border-teal-200/60"
          >
            <Plus className="w-4 h-4" />
            {field.addLabel ? field.addLabel ? tSchema(field.addLabel) : '' : tSchema('+ Hinzufügen')}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-2 pt-1">
        {isNested && <label className="block text-sm font-bold text-slate-800">{tSchema(field.label)}</label>}
        
        {field.type === 'radio' && field.options && (
          <div className="space-y-1.5">
            {field.options.map((opt, oIdx) => {
              const isSelected = value === opt;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => onChange(opt)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-teal-50 border-teal-600 text-teal-950 font-semibold shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <span className="leading-snug">{tSchema(opt)}</span>
                </button>
              );
            })}
          </div>
        )}

        {field.type === 'checkbox' && field.options && (
          <div className="space-y-1.5">
            {field.options.map((opt, oIdx) => {
              const currentArr = Array.isArray(value) ? [...value] : [];
              const isSelected = currentArr.includes(opt);
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      const idxToRemove = currentArr.indexOf(opt);
                      if (idxToRemove > -1) currentArr.splice(idxToRemove, 1);
                    } else {
                      currentArr.push(opt);
                    }
                    onChange(currentArr);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-start gap-2 ${
                    isSelected
                      ? 'bg-teal-50/90 border-teal-600 text-teal-950 font-semibold shadow-2xs ring-1 ring-teal-600'
                      : 'bg-white border-slate-200 hover:border-teal-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'border-teal-600 bg-teal-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="leading-snug">{tSchema(opt)}</span>
                </button>
              );
            })}
          </div>
        )}

        {(field.type === 'text' || field.type === 'number') && (
          <div className="relative flex items-center">
            <input
              type={field.type}
              placeholder={field.placeholder ? tSchema(field.placeholder) : ''}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors"
            />
            {field.type === 'text' && (
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                <VoiceInputButton
                  value={value || ''}
                  onChange={(val) => onChange(val)}
                  size="xs"
                  mode="append"
                  id={`btn-voice-f-${field.id}`}
                />
              </div>
            )}
          </div>
        )}

        {field.type === 'textarea' && (
          <div className="relative flex items-center">
            <textarea
              placeholder={field.placeholder ? tSchema(field.placeholder) : ''}
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-3 py-2 pr-10 text-xs border border-slate-300 rounded-xl bg-slate-50/60 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-colors min-h-[80px]"
            />
            <div className="absolute right-1.5 top-3">
              <VoiceInputButton
                value={value || ''}
                onChange={(val) => onChange(val)}
                size="xs"
                mode="append"
                id={`btn-voice-f-${field.id}`}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Wrapper>
      {innerContent()}
    </Wrapper>
  );
};
