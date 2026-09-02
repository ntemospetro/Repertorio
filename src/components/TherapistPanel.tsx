import Markdown from 'react-markdown';
import React, { useState, useEffect, useRef } from 'react';
import { Therapist, PatientCase, PatientChild, AnamnesisQuestion, FullClinicalAnalysis } from '../types';
import { 
  getPatientCases, 
  savePatientCase, 
  deletePatientCase,
  incrementAnalysesUsed,
  getStoredTherapistTab,
  setStoredTherapistTab
} from '../services/storage';
import { runHomeopathyAnalysis, HomeoRemedyResult } from '../services/homeopathyEngine';
import { generateFullClinicalAnalysis } from '../services/clinicalAnalysisService';
import { 
  generateQuestionsForComplaint, 
  summarizeQuestionsToAnamnese,
  splitMultipleComplaints,
  SCALE_LABELS_1_TO_4 
} from '../services/complaintQuestionGenerator';
import { useTranslation, useLanguage } from '../i18n/LanguageContext';
import { TranslationKey } from '../i18n/translations';
import { CaseAnalysisModal } from './CaseAnalysisModal';
import { ExtendedAnamnesisWizard } from './ExtendedAnamnesisWizard';
import { UpgradeModal } from './UpgradeModal';
import { PatientSelectionModal } from './PatientSelectionModal';
import { TherapistProfileEditor } from './TherapistProfileEditor';
import { TherapistTariffManager } from './TherapistTariffManager';
import { DynamicComplaintQuestions } from './DynamicComplaintQuestions';
import { VoiceInputButton } from './VoiceInputButton';
import { MedicationLiveInput } from './MedicationLiveInput';
import { ComprehensiveAnalysisView } from './ComprehensiveAnalysisView';
import { TherapyRecommendationsView } from './TherapyRecommendationsView';
import { PatientDirectoryView } from './PatientDirectoryView';
import { MateriaMedicaView } from './MateriaMedicaView';
import { UserManualView } from './UserManualView';
import { TherapistLogin } from './TherapistLogin';
import { getCountryFlag } from '../data/countries';
import { exportComprehensiveAnalysisToPDF } from '../services/pdfExportService';
import { 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User, 
  Calendar, 
  HeartHandshake, 
  Save, 
  Plus, 
  Trash2, LayoutDashboard, Settings, LogOut, 
  ChevronRight, 
  ChevronLeft,
  BookOpen, 
  Stethoscope,
  Clock,
  Zap,
  Search,
  Layers,
  ArrowRight,
  ArrowLeft,
  Check,
  Edit3,
  ListOrdered,
  Activity,
  Smile,
  Thermometer,
  Pill,
  Baby,
  Ruler,
  Users,
  UserX,
  MessageSquare,
  FileDown,
  Mail,
  Phone,
  Heart,
  UserCheck,
  UserPlus,
} from 'lucide-react';

interface TherapistPanelProps {
  therapist: Therapist | null;
  onGoToAdmin: () => void;
  onGoToRegister: () => void;
  onLogout?: () => void;
}

const COMMON_MEDICATIONS = [
  "Aspirin", "Ibuprofen", "Paracetamol", "Pantoprazol", "L-Thyroxin",
  "Ramipril", "Metoprolol", "Amlodipin", "Simvastatin", "Atorvastatin",
  "Metformin", "Novalgin", "Diclofenac", "Citalopram", "Sertralin",
  "Mirtazapin", "Omeprazol", "Bisoprolol", "Valsartan", "Candesartan",
  "Hydrochlorothiazid (HCT)", "Torasemid", "Furosemid", "Spironolacton",
  "Salbutamol", "Formoterol", "Budesonid", "Fluticason", "Levothyroxin",
  "Marcumar (Phenprocoumon)", "Eliquis (Apixaban)", "Xarelto (Rivaroxaban)",
  "Lixiana (Edoxaban)", "Clopidogrel", "ASS 100", "Allopurinol",
  "Pregabalin", "Gabapentin", "Amitriptylin", "Duloxetin", "Venlafaxin",
  "Escitalopram", "Fluoxetin", "Quetiapin", "Risperidon",
  "Lorazepam", "Diazepam", "Zopiclon", "Zolpidem", "Tamsulosin",
  "Finasterid", "Loperamid", "Macrogol", "Lactulose", "Domperidon",
  "MCP (Metoclopramid)", "Ondansetron", "Dimenhydrinat (Vomex)",
  "Cetirizin", "Loratadin", "Desloratadin", "Fexofenadin", "Prednisolon",
  "Dexamethason", "Hydrocortison", "Amoxicillin", "Cefuroxim", "Ciprofloxacin",
  "Doxycyclin", "Azithromycin", "Clindamycin", "Cotrimoxazol"
].sort();

const BLANK_PATIENT_CASE: Partial<PatientCase> = {
  patientName: '',
  patientAge: undefined,
  patientBirthDate: '',
  patientGender: 'weiblich',
  patientWeightKg: undefined,
  patientMaritalStatus: '',
  patientEmail: '',
  patientPhone: '',
  patientHeightCm: undefined,
  isPregnant: false,
  pregnancyMonth: undefined,
  hasChildren: false,
  childrenCount: 0,
  childrenList: [],
  customStammdaten: [],
  hauptbeschwerde: '',
  spontanbericht: '',
  anamnesisQuestions: [],
  modalitaetenBesser: '',
  modalitaetenSchlechter: '',
  gemuetPsyche: '',
  koerperAllgemein: '',
  lokalsymptome: '',
  bisherigeMittel: '',
  extendedAnamnesis: {},
  befundGewuenscht: false,
  befundText: '',
  befundDetails: undefined,
  nimmtMedikamente: false,
  medikamenteList: [],
  analyzedAt: undefined,
  remedySuggestions: [],
  analysisNotes: '',
  clinicalAnalysis: undefined,
  initialPrescription: undefined,
  followUps: [],
};

export const TherapistPanel: React.FC<TherapistPanelProps> = ({
  therapist,
  onGoToAdmin,
  onGoToRegister,
  onLogout,
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { t, language } = useTranslation();
  const [panelTab, setPanelTab] = useState<'cases' | 'patients' | 'materiamedica' | 'documentation' | 'profile' | 'tariff'>(() => getStoredTherapistTab());
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    setStoredTherapistTab(panelTab);
  }, [panelTab]);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseSearchQuery, setCaseSearchQuery] = useState('');

  // Form State - initialized completely blank
  const [currentCase, setCurrentCase] = useState<Partial<PatientCase>>({
    ...BLANK_PATIENT_CASE,
    anamneseDatum: new Date().toISOString().split('T')[0],
  });

  // Modal states
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isExtendedAnamnesisWizardOpen, setIsExtendedAnamnesisWizardOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isNoMasterDataModalOpen, setIsNoMasterDataModalOpen] = useState(false);
  const [isPatientSelectionModalOpen, setIsPatientSelectionModalOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<HomeoRemedyResult[]>([]);
  const [clinicalAnalysis, setClinicalAnalysis] = useState<FullClinicalAnalysis | null>(null);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const hauptbeschwerdeRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize hauptbeschwerde textarea based on content
  useEffect(() => {
    if (hauptbeschwerdeRef.current && currentStep === 2) {
      hauptbeschwerdeRef.current.style.height = 'auto';
      const scrollH = hauptbeschwerdeRef.current.scrollHeight;
      hauptbeschwerdeRef.current.style.height = `${Math.max(130, scrollH)}px`;
    }
  }, [currentCase.hauptbeschwerde, currentStep]);

  const refreshCases = () => {
    if (therapist) {
      const allCases = getPatientCases(therapist.id);
      setCases(allCases);
    }
  };

  useEffect(() => {
    refreshCases();
    window.addEventListener('homoeo_cases_updated', refreshCases);
    return () => {
      window.removeEventListener('homoeo_cases_updated', refreshCases);
    };
  }, [therapist?.id]);

  if (!therapist) {
    return (
      <TherapistLogin
        onLoginSuccess={() => {
          window.dispatchEvent(new Event('homoeo_active_therapist_changed'));
        }}
        onGoToRegister={onGoToRegister}
      />
    );
  }

  const isUnlimited = !!therapist.isUnlimited || therapist.tarif === 'pro_unlimited' || therapist.maxAnalyses >= 900000;
  const isLocked = !isUnlimited && therapist.usedAnalyses >= therapist.maxAnalyses;
  const remainingCount = isUnlimited ? 999999 : Math.max(0, therapist.maxAnalyses - therapist.usedAnalyses);

  const hasAnalysis = Boolean(
    clinicalAnalysis ||
    currentCase.clinicalAnalysis ||
    (currentCase.remedySuggestions && currentCase.remedySuggestions.length > 0) ||
    (analysisResults && analysisResults.length > 0) ||
    currentCase.analyzedAt
  );
  const totalWizardSteps = hasAnalysis ? 8 : 7;

  const allStepNames = [
    t('step1Name'),
    t('step2Name'),
    t('tpStep3Name'),
    t('tpStep4Name'),
    t('tpStep5Name'),
    t('tpStep6Name'),
    t('step7Name' as any) || '7. Analyse & Auswertung',
    t('step8Name' as any) || '8. Empfehlungen & Verordnung',
  ];
  const stepNames = hasAnalysis ? allStepNames : allStepNames.slice(0, 7);

  const handleSelectCase = (patientCase: PatientCase) => {
    setSelectedCaseId(patientCase.id);
    let questions = patientCase.anamnesisQuestions;
    if ((!questions || questions.length === 0) && patientCase.hauptbeschwerde) {
      questions = generateQuestionsForComplaint(patientCase.hauptbeschwerde);
    }
    setCurrentCase({
      ...patientCase,
      anamnesisQuestions: questions || [],
    });
    setClinicalAnalysis(patientCase.clinicalAnalysis || null);
    setCurrentStep(1);
  };

  const handleNewCase = () => {
    setSelectedCaseId(null);
    setClinicalAnalysis(null);
    setAnalysisResults([]);

    const hasPatientMasterData = Boolean(currentCase.patientName && currentCase.patientName.trim());

    if (hasPatientMasterData) {
      // Preserve the patient's master data (Stammdaten) and create a new anamnesis/case for this patient
      setCurrentCase(prev => ({
        ...BLANK_PATIENT_CASE,
        anamneseDatum: new Date().toISOString().split('T')[0],
        patientName: prev.patientName,
        patientAge: prev.patientAge,
        patientBirthDate: prev.patientBirthDate,
        patientGender: prev.patientGender,
        patientHeightCm: prev.patientHeightCm,
        patientWeightKg: prev.patientWeightKg,
        patientMaritalStatus: prev.patientMaritalStatus,
        patientEmail: prev.patientEmail,
        patientPhone: prev.patientPhone,
        isPregnant: prev.isPregnant,
        pregnancyMonth: prev.pregnancyMonth,
        hasChildren: prev.hasChildren,
        childrenCount: prev.childrenCount,
        childrenList: prev.childrenList ? [...prev.childrenList] : [],
        customStammdaten: prev.customStammdaten ? [...prev.customStammdaten] : [],
      }));
      // Advance to step 2 (Hauptbeschwerde) since Stammdaten are already filled
      setCurrentStep(2);
    } else {
      // Completely blank admission
      setCurrentCase({
        ...BLANK_PATIENT_CASE,
        anamneseDatum: new Date().toISOString().split('T')[0],
      });
      setCurrentStep(1);
    }

    showToast(t('toastNewCaseCreated'));
  };

  const handleAddChild = () => {
    const newChild: PatientChild = {
      id: `child_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: '',
      age: undefined,
      gender: 'weiblich',
    };
    const updatedList = [...(currentCase.childrenList || []), newChild];
    setCurrentCase(prev => ({
      ...prev,
      hasChildren: true,
      childrenCount: updatedList.length,
      childrenList: updatedList,
    }));
  };

  const handleUpdateChild = (id: string, field: keyof PatientChild, value: any) => {
    const updatedList = (currentCase.childrenList || []).map(ch => {
      if (ch.id === id) {
        return { ...ch, [field]: value };
      }
      return ch;
    });
    setCurrentCase(prev => ({
      ...prev,
      childrenList: updatedList,
      childrenCount: updatedList.length,
    }));
  };

  const handleRemoveChild = (id: string) => {
    const updatedList = (currentCase.childrenList || []).filter(ch => ch.id !== id);
    setCurrentCase(prev => ({
      ...prev,
      childrenCount: updatedList.length,
      childrenList: updatedList,
      hasChildren: updatedList.length > 0 ? prev.hasChildren : false,
    }));
  };

  const handleToggleChildren = (has: boolean) => {
    if (has) {
      if (!currentCase.childrenList || currentCase.childrenList.length === 0) {
        const initialChild: PatientChild = {
          id: `child_${Date.now()}_1`,
          name: '',
          age: undefined,
          gender: 'weiblich',
        };
        setCurrentCase(prev => ({
          ...prev,
          hasChildren: true,
          childrenCount: 1,
          childrenList: [initialChild],
        }));
      } else {
        setCurrentCase(prev => ({
          ...prev,
          hasChildren: true,
          childrenCount: prev.childrenList?.length || 1,
        }));
      }
    } else {
      setCurrentCase(prev => ({
        ...prev,
        hasChildren: false,
        childrenCount: 0,
      }));
    }
  };

  const handleAddCustomStammdaten = (defaultName = '') => {
    const newField = {
      id: `sd_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: defaultName,
      value: '',
    };
    setCurrentCase(prev => ({
      ...prev,
      customStammdaten: [...(prev.customStammdaten || []), newField],
    }));
  };

  const handleUpdateCustomStammdaten = (id: string, field: 'name' | 'value', value: string) => {
    setCurrentCase(prev => ({
      ...prev,
      customStammdaten: (prev.customStammdaten || []).map(item => 
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemoveCustomStammdaten = (id: string) => {
    setCurrentCase(prev => ({
      ...prev,
      customStammdaten: (prev.customStammdaten || []).filter(item => item.id !== id),
    }));
  };

  const showToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleUpdateHauptbeschwerde = (newComplaint: string) => {
    const updatedQuestions = generateQuestionsForComplaint(newComplaint, currentCase.anamnesisQuestions);
    setCurrentCase(prev => ({
      ...prev,
      hauptbeschwerde: newComplaint,
      anamnesisQuestions: updatedQuestions,
    }));
  };

  const handleUpdateAnamnesisQuestion = (questionId: string, updates: Partial<AnamnesisQuestion>) => {
    setCurrentCase(prev => {
      const updatedList = (prev.anamnesisQuestions || []).map(q => {
        if (q.id === questionId) {
          return { ...q, ...updates };
        }
        return q;
      });
      return {
        ...prev,
        anamnesisQuestions: updatedList,
      };
    });
  };

  const handleAddCustomQuestion = (newQuestion: AnamnesisQuestion) => {
    setCurrentCase(prev => ({
      ...prev,
      anamnesisQuestions: [...(prev.anamnesisQuestions || []), newQuestion],
    }));
    showToast(t('toastCustomQuestionAdded'));
  };

  const handleRemoveAnamnesisQuestion = (questionId: string) => {
    setCurrentCase(prev => ({
      ...prev,
      anamnesisQuestions: (prev.anamnesisQuestions || []).filter(q => q.id !== questionId),
    }));
  };

  const handleRegenerateQuestions = () => {
    if (!currentCase.hauptbeschwerde?.trim()) return;
    const freshQuestions = generateQuestionsForComplaint(currentCase.hauptbeschwerde);
    setCurrentCase(prev => ({
      ...prev,
      anamnesisQuestions: freshQuestions,
    }));
    showToast(t('toastQuestionsRegenerated'));
  };

  const handleTransferAnswersToAnamnese = () => {
    if (!currentCase.anamnesisQuestions || currentCase.anamnesisQuestions.length === 0) return;
    const summary = summarizeQuestionsToAnamnese(currentCase.anamnesisQuestions);

    setCurrentCase(prev => {
      const newSpontan = [prev.spontanbericht?.trim(), summary.summaryReport?.trim()]
        .filter(Boolean)
        .join('\n\n');

      const newLokalsymptome = [prev.lokalsymptome?.trim(), summary.localSymptoms?.trim()]
        .filter(Boolean)
        .join('\n');

      const newBesser = [prev.modalitaetenBesser?.trim(), summary.modalitiesBetter?.trim()]
        .filter(Boolean)
        .join(', ');

      const newSchlechter = [prev.modalitaetenSchlechter?.trim(), summary.modalitiesWorse?.trim()]
        .filter(Boolean)
        .join(', ');

      const newGemuet = [prev.gemuetPsyche?.trim(), summary.gemuetPsyche?.trim()]
        .filter(Boolean)
        .join('\n\n');

      return {
        ...prev,
        spontanbericht: newSpontan,
        lokalsymptome: newLokalsymptome,
        modalitaetenBesser: newBesser,
        modalitaetenSchlechter: newSchlechter,
        gemuetPsyche: newGemuet,
      };
    });

    showToast(t('toastAnswersImported'));
  };

  const handleSaveCase = () => {
    if (!currentCase.patientName?.trim()) {
      setIsNoMasterDataModalOpen(true);
      return;
    }

    const isFemale = (currentCase.patientGender || 'weiblich') === 'weiblich';

    const saved = savePatientCase({
      ...currentCase,
      therapistId: therapist.id,
      patientName: currentCase.patientName.trim(),
      anamneseDatum: currentCase.anamneseDatum || new Date().toISOString().split('T')[0],
      patientHeightCm: currentCase.patientHeightCm,
      isPregnant: isFemale ? !!currentCase.isPregnant : false,
      pregnancyMonth: isFemale && currentCase.isPregnant ? currentCase.pregnancyMonth : undefined,
      hasChildren: !!currentCase.hasChildren,
      childrenCount: currentCase.hasChildren ? (currentCase.childrenList?.length || 0) : 0,
      childrenList: currentCase.hasChildren ? (currentCase.childrenList || []) : [],
      hauptbeschwerde: currentCase.hauptbeschwerde || '',
      anamnesisQuestions: currentCase.anamnesisQuestions || [],
      spontanbericht: currentCase.spontanbericht || '',
      modalitaetenBesser: currentCase.modalitaetenBesser || '',
      modalitaetenSchlechter: currentCase.modalitaetenSchlechter || '',
      gemuetPsyche: currentCase.gemuetPsyche || '',
      koerperAllgemein: currentCase.koerperAllgemein || '',
      lokalsymptome: currentCase.lokalsymptome || '',
      bisherigeMittel: currentCase.bisherigeMittel || '',
      id: selectedCaseId || undefined,
    });

    setSelectedCaseId(saved.id);
    refreshCases();
    showToast(t('toastCaseSaved'));
  };

  const handleExportRecommendationsPDF = () => {
    if (!currentCase) return;
    const analysisToExport = clinicalAnalysis || {
      redFlags: { warnings: [], gesamtbewertung: '', empfohleneFachrichtung: '', dringlichkeit: '' },
      differentialdiagnostik: { items: [] },
      medikamente: { zusammenfassung: '', details: [] },
      homoeopathie: { mittel: [] }
    };
    exportComprehensiveAnalysisToPDF(currentCase as PatientCase, analysisToExport, language, 'empfehlungen');
  };

  const handleExportFullAnalysisPDF = () => {
    if (!currentCase) return;
    const analysisToExport = clinicalAnalysis || {
      redFlags: { warnings: [], gesamtbewertung: '', empfohleneFachrichtung: '', dringlichkeit: '' },
      differentialdiagnostik: { items: [] },
      medikamente: { zusammenfassung: '', details: [] },
      homoeopathie: { mittel: [] }
    };
    exportComprehensiveAnalysisToPDF(currentCase as PatientCase, analysisToExport, language);
  };

  const handleDeleteCase = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('deleteCaseConfirm'))) {
      deletePatientCase(id);
      if (selectedCaseId === id) {
        handleNewCase();
      }
      refreshCases();
    }
  };

  const handleRunAnalysis = async () => {
    if (isLocked) {
      setIsUpgradeModalOpen(true);
      return;
    }

    if (!currentCase.hauptbeschwerde && !currentCase.spontanbericht && !currentCase.gemuetPsyche) {
      alert(t('mainComplaintTitle'));
      setCurrentStep(2);
      return;
    }

    // Attempt to decrement quota
    const res = incrementAnalysesUsed(therapist.id);
    if (!res.success) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsAnalyzing(true);
    setCurrentStep(7);

    // Run modular homeopathy repertorisation engine
    const results = runHomeopathyAnalysis(currentCase);
    setAnalysisResults(results);

    try {
      const fullAnalysis = await generateFullClinicalAnalysis(currentCase as PatientCase, language);
      setClinicalAnalysis(fullAnalysis);

      // Save case with analysis
      if (currentCase.patientName) {
        const isFemale = (currentCase.patientGender || 'weiblich') === 'weiblich';
        const saved = savePatientCase({
          ...currentCase,
          therapistId: therapist.id,
          patientName: currentCase.patientName,
          anamneseDatum: currentCase.anamneseDatum || new Date().toISOString().split('T')[0],
          patientHeightCm: currentCase.patientHeightCm,
          isPregnant: isFemale ? !!currentCase.isPregnant : false,
          pregnancyMonth: isFemale && currentCase.isPregnant ? currentCase.pregnancyMonth : undefined,
          hasChildren: !!currentCase.hasChildren,
          childrenCount: currentCase.hasChildren ? (currentCase.childrenList?.length || 0) : 0,
          childrenList: currentCase.hasChildren ? (currentCase.childrenList || []) : [],
          hauptbeschwerde: currentCase.hauptbeschwerde || '',
          anamnesisQuestions: currentCase.anamnesisQuestions || [],
          spontanbericht: currentCase.spontanbericht || '',
          modalitaetenBesser: currentCase.modalitaetenBesser || '',
          modalitaetenSchlechter: currentCase.modalitaetenSchlechter || '',
          gemuetPsyche: currentCase.gemuetPsyche || '',
          koerperAllgemein: currentCase.koerperAllgemein || '',
          lokalsymptome: currentCase.lokalsymptome || '',
          bisherigeMittel: currentCase.bisherigeMittel || '',
          id: selectedCaseId || undefined,
          analyzedAt: new Date().toISOString(),
          clinicalAnalysis: fullAnalysis,
          remedySuggestions: results.map(r => ({
            name: r.name,
            potency: r.potency,
            score: r.score,
            keyIndicators: r.keyIndicators,
            description: r.description,
          })),
        });
        setSelectedCaseId(saved.id);
        refreshCases();
      }
    } catch (error) {
      console.error("Clinical analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goToNextStep = () => {
    if (currentStep < totalWizardSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full min-h-[calc(100vh-4rem)] bg-slate-50 w-full">
      {/* Sidebar (Sticky on desktop, bottom-aligned with viewport) */}
      <div className="w-full md:w-64 bg-slate-100 border-r border-slate-200 flex flex-col flex-shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] md:self-start z-20 shadow-xs">
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center gap-2 mb-8 px-2">
            <Stethoscope className="w-6 h-6 text-teal-600" />
            <span className="font-bold text-lg text-slate-800">{t('practice')}</span>
          </div>
          
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setPanelTab('cases')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                panelTab === 'cases'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-teal-600" />
              <span>{t('tabCaseManagement')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelTab('patients')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                panelTab === 'patients'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>{t('tabPatientDirectory')}</span>
            </button>

            <button
              type="button"
              onClick={() => setPanelTab('materiamedica')}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
                panelTab === 'materiamedica'
                  ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                  : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-teal-600" />
              <span>{t('tabMateriaMedica')}</span>
            </button>
          </div>
        </div>
        
        {/* Sidebar Footer - Cleanly flush and anchored at bottom */}
        <div className="p-4 border-t border-slate-200 space-y-1 bg-slate-100 mt-auto shrink-0">
          <div className="flex items-center gap-3 px-2.5 py-2.5 mb-1.5 bg-white/70 rounded-xl border border-slate-200/60 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {therapist.vorname[0]}{therapist.nachname[0]}
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{therapist.vorname} {therapist.nachname}</div>
              <div className="text-[11px] text-slate-500 truncate">{therapist.email}</div>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setPanelTab('profile')}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
              panelTab === 'profile'
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>{t('navProfile' as TranslationKey)}</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setPanelTab('tariff')}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
              panelTab === 'tariff'
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>{t('navSettings' as TranslationKey)}</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelTab('documentation')}
            className={`w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 transition-colors cursor-pointer ${
              panelTab === 'documentation'
                ? 'bg-teal-50 text-teal-900 font-bold border border-teal-100/50'
                : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-teal-600" />
            <span>{t('tabDocumentation')}</span>
          </button>
          
          <button 
            type="button"
            onClick={() => onLogout && onLogout()}
            className="w-full text-left px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('navLogout' as TranslationKey)}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1400px] mx-auto w-full">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* TAB CONTENT 1: THERAPIST PROFILE & MASTER DATA WITH CONTACT HISTORY */}
      {panelTab === 'profile' && (
        <TherapistProfileEditor 
          therapist={therapist} 
          onUpdated={() => showToast(t('profileSaveSuccess'))}
        />
      )}

      {/* TAB CONTENT 2: TARIFF OVERVIEW & SWITCHER */}
      {panelTab === 'tariff' && (
        <TherapistTariffManager 
          therapist={therapist} 
          onTariffChanged={() => showToast(t('tariffSwitchSuccess'))}
        />
      )}

      {/* TAB CONTENT 3: PATIENT DIRECTORY & CUSTOMER RECORDS */}
      {panelTab === 'patients' && (
        <PatientDirectoryView
          therapist={therapist}
          onOpenCaseInWorkspace={(selectedCase) => {
            handleSelectCase(selectedCase);
            setPanelTab('cases');
          }}
          onNewCaseForPatient={(patientName, defaults) => {
            handleNewCase();
            setCurrentCase(prev => ({
              ...prev,
              patientName,
              ...defaults,
            }));
            setPanelTab('cases');
          }}
        />
      )}

      {/* TAB CONTENT 4: MATERIA MEDICA & RAPID INTAKE */}
      {panelTab === 'materiamedica' && (
        <MateriaMedicaView
          onSelectRemedyForCase={(remedyName, potency) => {
            setPanelTab('cases');
            setCurrentCase(prev => ({
              ...prev,
              repertorisationErgebnis: remedyName,
              verordnungPotenz: potency,
            }));
          }}
        />
      )}

      {/* TAB CONTENT 5: USER MANUAL & DOCUMENTATION */}
      {panelTab === 'documentation' && (
        <UserManualView
          onNavigateTab={(tab) => setPanelTab(tab)}
          onGoToAdmin={onGoToAdmin}
        />
      )}

      {/* TAB CONTENT 5: CASE RECORDS & SEQUENTIAL REPERTORISATION WORKFLOW */}
      {panelTab === 'cases' && (
        <>
          {/* START AUSWAHL BEI BEGINN: NEUER PATIENT vs BEREITS PATIENT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{t('startSelectionTitle')}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                      {selectedCaseId ? `${t('activeCasePrefix')}: ${currentCase.patientName || t('unnamedPatient')}` : t('newAdmissionReady')}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t('startSelectionDesc')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* 1. Neuen Patienten aufnehmen */}
                <button
                  type="button"
                  id="btn-choice-new-patient"
                  onClick={handleNewCase}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-xs transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('btnNewPatientAdmission')}</span>
                </button>

                {/* 2. Bereits Patient */}
                <button
                  type="button"
                  id="btn-choice-existing-patient"
                  onClick={() => setIsPatientSelectionModalOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 border border-slate-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Users className="w-4 h-4 text-teal-700" />
                  <span>{t('btnExistingPatientToFiles')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Workspace Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Cases List Grouped by Patient */}
            <div className="lg:col-span-4 space-y-5">
              <div className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>
                      {selectedCaseId
                        ? t('patientCasesCount').replace('{count}', String(cases.filter(c => c.patientName && currentCase.patientName && c.patientName.trim().toLowerCase() === currentCase.patientName.trim().toLowerCase()).length || 1))
                        : caseSearchQuery.trim()
                        ? t('searchResultsCount').replace('{count}', String(cases.length))
                        : t('patientCasesNewAdmission')}
                    </span>
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {Boolean(selectedCaseId) && (
                      <button
                        id="btn-new-case"
                        onClick={handleNewCase}
                        title={t('btnNewPatientAdmission')}
                        className="flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-md transition-colors cursor-pointer border border-teal-200/60"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('newCaseBtn')}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      id="btn-open-patient-selection-modal"
                      onClick={() => setIsPatientSelectionModalOpen(true)}
                      title={t('patientFilesTab')}
                      className="flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors cursor-pointer border border-slate-200"
                    >
                      <Users className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('patientFilesTab')}</span>
                    </button>
                  </div>
                </div>

                {/* Search Cases */}
                <div className="mb-3">
                  <div className="relative flex items-center">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      id="input-case-search"
                      type="text"
                      placeholder={t('searchExistingPatientPlaceholder')}
                      value={caseSearchQuery}
                      onChange={(e) => setCaseSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-1.5 rounded-md border border-slate-300 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 h-[34px]"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <VoiceInputButton
                        value={caseSearchQuery}
                        onChange={(val) => setCaseSearchQuery(val)}
                        size="xs"
                        mode="append"
                        id="btn-voice-case-search"
                      />
                    </div>
                  </div>
                </div>

                {(() => {
                  // Determine which cases to show
                  let displayCases: PatientCase[] = [];

                  if (caseSearchQuery.trim()) {
                    const q = caseSearchQuery.toLowerCase();
                    displayCases = cases.filter(
                      (c) =>
                        (c.patientName && c.patientName.toLowerCase().includes(q)) ||
                        (c.hauptbeschwerde && c.hauptbeschwerde.toLowerCase().includes(q)) ||
                        (c.spontanbericht && c.spontanbericht.toLowerCase().includes(q))
                    );
                  } else if (selectedCaseId) {
                    const activeCaseObj = cases.find((c) => c.id === selectedCaseId);
                    const activePatientName = (activeCaseObj?.patientName || currentCase.patientName || '').trim().toLowerCase();
                    if (activePatientName) {
                      displayCases = cases.filter(
                        (c) => c.patientName && c.patientName.trim().toLowerCase() === activePatientName
                      );
                    } else {
                      displayCases = cases.filter((c) => c.id === selectedCaseId);
                    }
                  } else if (currentCase.patientName && currentCase.patientName.trim()) {
                    const activePatientName = currentCase.patientName.trim().toLowerCase();
                    const matchingCases = cases.filter(
                      (c) => c.patientName && c.patientName.trim().toLowerCase() === activePatientName
                    );
                    if (matchingCases.length > 0) {
                      displayCases = matchingCases;
                    }
                  }

                  // Empty state when recording a new patient / start state
                  if (displayCases.length === 0) {
                    if (caseSearchQuery.trim()) {
                      return (
                        <div className="text-center py-6 text-slate-400 text-xs">
                          <span>{t('noMatchingCasesFound')}</span>
                        </div>
                      );
                    }

                    return (
                      <div className="text-center py-6 px-3 bg-slate-50/70 rounded-xl border border-dashed border-slate-200 text-xs space-y-2.5">
                        <div className="w-9 h-9 rounded-full bg-teal-50 text-teal-700 mx-auto flex items-center justify-center border border-teal-100">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs">{t('newAdmissionActive')}</div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {t('newAdmissionEmptyDesc')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPatientSelectionModalOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-teal-800 hover:border-teal-300 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t('selectExistingPatientBtn')}</span>
                        </button>
                      </div>
                    );
                  }

                  // Group cases by patient name
                  const patientMap = new Map<string, PatientCase[]>();
                  displayCases.forEach(c => {
                    const nameKey = (c.patientName || 'Unbenannter Patient').trim();
                    if (!patientMap.has(nameKey)) {
                      patientMap.set(nameKey, []);
                    }
                    patientMap.get(nameKey)!.push(c);
                  });

                  return (
                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
                      {Array.from(patientMap.entries()).map(([patientName, pCases]) => {
                        const hasManyCases = pCases.length > 10;

                        return (
                          <div key={patientName} className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
                            {/* Patient Header Card */}
                            <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-200/60">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-6 h-6 rounded-full bg-teal-700 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {patientName.split(' ').map(n => n[0]).slice(0, 2).join('') || 'P'}
                                </div>
                                <span className="font-bold text-slate-900 text-xs truncate">
                                  {patientName}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {hasManyCases && (
                                  <span className="text-[9px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60">
                                    Scrollbar
                                  </span>
                                )}
                                <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                                  {pCases.length} {pCases.length === 1 ? t('singleCase') : t('multipleCases')}
                                </span>
                              </div>
                            </div>

                            {/* Cases for this patient (Scrollbar active if > 10 cases) */}
                            <div className={`space-y-1 ${hasManyCases ? 'max-h-[300px] overflow-y-auto pr-1 custom-scrollbar border border-slate-200/60 p-1 rounded-lg bg-white/70' : ''}`}>
                              {pCases.map((c, cIdx) => {
                                const isSelected = selectedCaseId === c.id;
                                const dateFormatted = c.anamneseDatum 
                                  ? new Date(c.anamneseDatum).toLocaleDateString() 
                                  : t('admissionPending');

                                return (
                                  <div
                                    key={c.id}
                                    onClick={() => handleSelectCase(c)}
                                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between group ${
                                      isSelected
                                        ? 'bg-teal-50/90 border-teal-300 text-teal-950 font-medium shadow-2xs'
                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                    }`}
                                  >
                                    <div className="min-w-0 pr-2 space-y-0.5">
                                      <div className="flex items-center gap-1.5 text-[11px]">
                                        <span className="font-bold text-teal-800">
                                          {t('caseNumber').replace('{num}', pCases.length > 1 ? String(pCases.length - cIdx) : '1')}
                                        </span>
                                        <span className="text-slate-400">•</span>
                                        <span className="text-slate-500 font-medium">
                                          {t('admissionDatePrefix')}: {dateFormatted}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-700 line-clamp-1 font-normal">
                                        {c.hauptbeschwerde || t('caseNotAnalyzed')}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                      {c.analyzedAt && (
                                        <span className="w-2 h-2 rounded-full bg-teal-500" title="Analysiert" />
                                      )}
                                      <button
                                        onClick={(e) => handleDeleteCase(c.id, e)}
                                        title="Löschen"
                                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Column: SEQUENTIAL CASE INPUT WIZARD */}
            <div className="lg:col-span-8 card p-6 sm:p-8">
              {/* Wizard Progress & Header */}
              <div className="border-b border-slate-200 pb-5 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 rounded-md">
                        {t('stepProgress', { current: currentStep, total: totalWizardSteps })}
                      </span>
                      {selectedCaseId ? (
                        <span className="text-xs text-slate-500 font-medium truncate max-w-[200px]">
                          {currentCase.patientName || t('unnamedPatient')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-medium">
                          {t('newCaseBtn')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
                      <ListOrdered className="w-5 h-5 text-teal-600 flex-shrink-0" />
                      <span>{stepNames[currentStep - 1] || allStepNames[currentStep - 1]}</span>
                    </h2>
                  </div>
                </div>

                {/* Interactive Wizard Step Bar */}
                {(() => {
                  const getStepInfo = (stepNum: number): { status: 'empty' | 'partial' | 'complete'; percent: number } => {
                    switch (stepNum) {
                      case 1: { // 1. Stammdaten
                        const hasName = Boolean(currentCase.patientName && currentCase.patientName.trim());
                        const hasAgeOrBirth = currentCase.patientAge !== undefined || Boolean(currentCase.patientBirthDate && currentCase.patientBirthDate.trim());
                        const hasHeight = currentCase.patientHeightCm !== undefined && currentCase.patientHeightCm > 0;
                        const hasWeight = currentCase.patientWeightKg !== undefined && currentCase.patientWeightKg > 0;
                        const hasAny = hasName || hasAgeOrBirth || hasHeight || hasWeight || Boolean(currentCase.patientEmail) || Boolean(currentCase.patientPhone) || Boolean(currentCase.patientMaritalStatus) || (Boolean(currentCase.customStammdaten && currentCase.customStammdaten.length > 0));
                        if (!hasAny) return { status: 'empty', percent: 0 };

                        const pregnancyOk = currentCase.patientGender !== 'weiblich' || !currentCase.isPregnant || Boolean(currentCase.pregnancyMonth);
                        const childrenOk = !currentCase.hasChildren || (Boolean(currentCase.childrenList && currentCase.childrenList.length > 0) && currentCase.childrenList!.every(c => c.name && c.name.trim()));

                        if (hasName && pregnancyOk && childrenOk) {
                          return { status: 'complete', percent: 100 };
                        }

                        let p = 25;
                        if (hasName) p += 35;
                        if (hasAgeOrBirth) p += 15;
                        if (hasHeight || hasWeight) p += 15;
                        if (pregnancyOk && childrenOk) p += 10;
                        return { status: 'partial', percent: Math.min(90, Math.max(25, p)) };
                      }

                      case 2: { // 2. Hauptbeschwerde & Dynamische Fragen
                        const hasComplaint = Boolean(currentCase.hauptbeschwerde && currentCase.hauptbeschwerde.trim().length >= 3);
                        const questions = currentCase.anamnesisQuestions || [];
                        const answeredQuestions = questions.filter(q => 
                          Boolean(q.answerScaleCurrent !== undefined) ||
                          Boolean(q.answerScaleWorst !== undefined) ||
                          Boolean(q.answerChoice && q.answerChoice.trim()) ||
                          Boolean(q.answerMultiChoice && q.answerMultiChoice.length > 0) ||
                          Boolean(q.answerText && q.answerText.trim())
                        ).length;

                        if (!hasComplaint && answeredQuestions === 0) return { status: 'empty', percent: 0 };

                        if (hasComplaint) {
                          if (questions.length > 0) {
                            if (answeredQuestions === questions.length) return { status: 'complete', percent: 100 };
                            const qPercent = Math.round((answeredQuestions / questions.length) * 50);
                            return { status: 'partial', percent: 50 + qPercent };
                          } else {
                            if (currentCase.hauptbeschwerde!.trim().length >= 15) return { status: 'complete', percent: 100 };
                            return { status: 'partial', percent: 50 };
                          }
                        }
                        return { status: 'partial', percent: 35 };
                      }

                      case 3: { // 3. Fragebogen (Erweiterte Anamnese)
                        const ext = currentCase.extendedAnamnesis || {};
                        const answeredKeys = Object.entries(ext).filter(([_, v]) => 
                          v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0)
                        ).length;

                        if (answeredKeys === 0) return { status: 'empty', percent: 0 };
                        if (answeredKeys >= 8) return { status: 'complete', percent: 100 };
                        const calculated = Math.round((answeredKeys / 8) * 100);
                        return { status: 'partial', percent: Math.max(20, Math.min(85, calculated)) };
                      }

                      case 4: { // 4. Befund
                        if (currentCase.befundGewuenscht === undefined) {
                          const hasText = Boolean(currentCase.befundText && currentCase.befundText.trim());
                          const bd = currentCase.befundDetails || {};
                          const hasDetails = Boolean(bd.gesamtbeurteilung || bd.blutdruck || bd.puls || bd.temperatur || bd.spo2 || bd.allgemeinzustand || bd.herzLunge || bd.abdomen);
                          if (hasText || hasDetails) return { status: 'partial', percent: 50 };
                          return { status: 'empty', percent: 0 };
                        }

                        if (currentCase.befundGewuenscht === false) {
                          return { status: 'complete', percent: 100 };
                        }

                        const bd = currentCase.befundDetails || {};
                        const filledDetailsCount = [
                          bd.gesamtbeurteilung, 
                          bd.blutdruck, 
                          bd.puls, 
                          bd.temperatur,
                          bd.spo2,
                          bd.allgemeinzustand,
                          bd.herzLunge,
                          bd.abdomen,
                          bd.hautSchleimhaeute,
                          bd.neurologisch,
                          bd.weitereBefunde,
                          currentCase.befundText
                        ].filter(v => typeof v === 'string' && v.trim().length > 0).length;

                        if (filledDetailsCount >= 2 || (currentCase.befundText && currentCase.befundText.trim().length > 15)) {
                          return { status: 'complete', percent: 100 };
                        }
                        return { status: 'partial', percent: filledDetailsCount > 0 ? 50 : 25 };
                      }

                      case 5: { // 5. Medikamente
                        if (currentCase.nimmtMedikamente === undefined) {
                          const list = currentCase.medikamenteList || [];
                          return list.length > 0 ? { status: 'partial', percent: 40 } : { status: 'empty', percent: 0 };
                        }

                        if (currentCase.nimmtMedikamente === false) {
                          return { status: 'complete', percent: 100 };
                        }

                        const list = currentCase.medikamenteList || [];
                        if (list.length === 0) return { status: 'partial', percent: 30 };
                        const validMeds = list.filter(m => m.name && m.name.trim().length > 0);
                        if (validMeds.length === 0) return { status: 'partial', percent: 30 };
                        if (validMeds.length === list.length && list.every(m => m.name?.trim() && (m.dosierung?.trim() || m.einnahmeart?.trim()))) {
                          return { status: 'complete', percent: 100 };
                        }
                        return { status: 'partial', percent: 60 };
                      }

                      case 6: { // 6. Übersicht
                        const s1 = getStepInfo(1).status;
                        const s2 = getStepInfo(2).status;
                        const s4 = getStepInfo(4).status;
                        const s5 = getStepInfo(5).status;

                        if (s1 === 'complete' && s2 === 'complete' && s4 === 'complete' && s5 === 'complete') {
                          return { status: 'complete', percent: 100 };
                        }
                        return { status: 'empty', percent: 0 };
                      }

                      case 7: { // 7. Analyse & Auswertung
                        if (clinicalAnalysis) return { status: 'complete', percent: 100 };
                        return { status: 'empty', percent: 0 };
                      }

                      case 8: { // 8. Empfehlungen & Verordnung
                        const rec = currentCase.therapyRecommendations;
                        if (rec && rec.remedies && rec.remedies.some(r => r.isSelected)) return { status: 'complete', percent: 100 };
                        if (rec) return { status: 'partial', percent: 50 };
                        return { status: 'empty', percent: 0 };
                      }

                      default:
                        return { status: 'empty', percent: 0 };
                    }
                  };

                  return (
                    <div className={`grid grid-cols-4 ${hasAnalysis ? 'sm:grid-cols-8' : 'sm:grid-cols-7'} gap-1.5 pt-2`}>
                      {stepNames.map((name, index) => {
                        const stepNum = index + 1;
                        const isActive = currentStep === stepNum;
                        const { status, percent } = getStepInfo(stepNum);
                        const isComplete = status === 'complete';
                        const isPartial = status === 'partial';

                        let btnClasses = '';
                        let numColorClass = '';

                        if (isActive) {
                          btnClasses = 'bg-teal-600 text-white font-bold shadow-xs border border-teal-600';
                          numColorClass = 'text-white';
                        } else if (isComplete) {
                          btnClasses = 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100/90';
                          numColorClass = 'text-teal-700';
                        } else if (isPartial) {
                          btnClasses = 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100/90';
                          numColorClass = 'text-teal-800 font-bold';
                        } else {
                          btnClasses = 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200';
                          numColorClass = 'text-slate-500';
                        }

                        return (
                          <button
                            key={stepNum}
                            onClick={() => setCurrentStep(stepNum)}
                            className={`group relative flex flex-col items-center p-2 rounded-lg text-center transition-all cursor-pointer overflow-hidden ${btnClasses}`}
                            title={
                              isComplete
                                ? t('stepTooltipComplete', { name })
                                : isPartial
                                ? t('stepTooltipPartial', { name })
                                : t('stepTooltipEmpty', { name })
                            }
                          >
                            {/* Partial progress bar overlay filled with orange */}
                            {!isActive && isPartial && (
                              <div
                                className="absolute inset-y-0 left-0 bg-amber-300/55 border-r border-amber-400/60 transition-all duration-300 pointer-events-none"
                                style={{ width: `${percent}%` }}
                              />
                            )}

                            <div className={`relative z-10 flex items-center justify-center w-5 h-5 rounded-full text-[11px] mb-1 font-mono font-bold ${numColorClass}`}>
                              {!isActive && isComplete ? (
                                <Check className="w-3.5 h-3.5 text-teal-700 stroke-[2.5]" />
                              ) : (
                                <span>{stepNum}</span>
                              )}
                            </div>
                            <span className="relative z-10 text-[10px] leading-tight truncate w-full block">
                              {name.split('. ')[1] || name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* SEQUENTIAL STEP BODIES */}
              <div className="min-h-[300px]">
                {/* 1. STAMMDATEN */}
                {currentStep === 1 && (
                  <div className="space-y-5 animate-in fade-in-50 duration-150">
                    <div className="bg-teal-50/60 p-3 rounded-lg border border-teal-100 text-teal-950 text-xs flex items-center gap-2">
                      <User className="w-4 h-4 text-teal-600 shrink-0" />
                      <span><strong>{t('patientDataTitle')}:</strong> {t('patientDataDesc')}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      {/* Name */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-patient-name">
                          {t('patientName')}
                        </label>
                        <div className="relative flex items-center">
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="input-patient-name"
                            type="text"
                            placeholder={t('patientNamePlaceholder')}
                            value={currentCase.patientName || ''}
                            onChange={(e) => setCurrentCase({ ...currentCase, patientName: e.target.value })}
                            className="w-full pl-8 pr-9 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                          />
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                            <VoiceInputButton
                              value={currentCase.patientName || ''}
                              onChange={(val) => setCurrentCase({ ...currentCase, patientName: val })}
                              size="xs"
                              mode="append"
                              id="btn-voice-patient-name"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Geburtsdatum */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-patient-birthdate">
                          {t('patientBirthDate')}
                        </label>
                        <div className="relative">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="input-patient-birthdate"
                            type="date"
                            value={currentCase.patientBirthDate || ''}
                            onChange={(e) => {
                              const bDate = e.target.value;
                              let calcAge = currentCase.patientAge;
                              if (bDate) {
                                const diff = Date.now() - new Date(bDate).getTime();
                                const ageDate = new Date(diff);
                                calcAge = Math.abs(ageDate.getUTCFullYear() - 1970);
                              }
                              setCurrentCase({ 
                                ...currentCase, 
                                patientBirthDate: bDate,
                                ...(calcAge !== undefined && !isNaN(calcAge) && calcAge >= 0 && calcAge <= 125 ? { patientAge: calcAge } : {})
                              });
                            }}
                            className="w-full pl-8 pr-2 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                          />
                        </div>
                      </div>

                      {/* Alter */}
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-patient-age">
                          {t('patientAge')}
                        </label>
                        <input
                          id="input-patient-age"
                          type="number"
                          min="0"
                          max="125"
                          placeholder={t('patientAgePlaceholder')}
                          value={currentCase.patientAge !== undefined ? currentCase.patientAge : ''}
                          onChange={(e) => setCurrentCase({ ...currentCase, patientAge: e.target.value ? parseInt(e.target.value) : undefined })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                        />
                      </div>

                      {/* Geschlecht */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="select-patient-gender">
                          {t('patientGender')}
                        </label>
                        <select
                          id="select-patient-gender"
                          value={currentCase.patientGender || 'weiblich'}
                          onChange={(e) => {
                            const newGender = e.target.value as any;
                            setCurrentCase({ 
                              ...currentCase, 
                              patientGender: newGender,
                              ...(newGender !== 'weiblich' ? { isPregnant: false, pregnancyMonth: undefined } : {})
                            });
                          }}
                          className="w-full px-2 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 bg-white h-[38px]"
                        >
                          <option value="weiblich">{t('genderFemale')}</option>
                          <option value="männlich">{t('genderMale')}</option>
                          <option value="divers">{t('genderOther')}</option>
                        </select>
                      </div>

                      {/* Körpergröße (cm) */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-patient-height">
                          {t('patientHeight')}
                        </label>
                        <div className="relative">
                          <Ruler className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="input-patient-height"
                            type="number"
                            min="30"
                            max="260"
                            placeholder={t('patientHeightPlaceholder')}
                            value={currentCase.patientHeightCm !== undefined ? currentCase.patientHeightCm : ''}
                            onChange={(e) => setCurrentCase({ ...currentCase, patientHeightCm: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                          />
                        </div>
                      </div>

                      {/* Gewicht (kg) */}
                      <div className="sm:col-span-4">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-patient-weight">
                          {t('patientWeight')}
                        </label>
                        <div className="relative">
                          <Activity className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="input-patient-weight"
                            type="number"
                            min="1"
                            max="300"
                            placeholder={t('patientWeightPlaceholder')}
                            value={currentCase.patientWeightKg !== undefined ? currentCase.patientWeightKg : ''}
                            onChange={(e) => setCurrentCase({ ...currentCase, patientWeightKg: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                          />
                        </div>
                      </div>

                      {/* Familienstand */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="select-patient-marital">
                          {t('patientMaritalStatus')} <span className="text-slate-400 font-normal text-[11px] lowercase">{t('optionalField')}</span>
                        </label>
                        <div className="relative">
                          <HeartHandshake className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <select
                            id="select-patient-marital"
                            value={currentCase.patientMaritalStatus || ''}
                            onChange={(e) => setCurrentCase({ ...currentCase, patientMaritalStatus: e.target.value as any })}
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 bg-white h-[38px]"
                          >
                            <option value="">-- {t('selectMaritalStatus')} --</option>
                            <option value="ledig">{t('maritalSingle')}</option>
                            <option value="verheiratet">{t('maritalMarried')}</option>
                            <option value="in Partnerschaft">{t('maritalPartnership')}</option>
                            <option value="geschieden">{t('maritalDivorced')}</option>
                            <option value="getrennt lebend">{t('maritalSeparated')}</option>
                            <option value="verwitwet">{t('maritalWidowed')}</option>
                            <option value="sonstiges">{t('maritalOther')}</option>
                          </select>
                        </div>
                      </div>

                      {/* Aufnahmedatum */}
                      <div className="sm:col-span-6">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1" htmlFor="input-anamnese-date">
                          {t('anamneseDate')}
                        </label>
                        <div className="relative">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            id="input-anamnese-date"
                            type="date"
                            value={currentCase.anamneseDatum || ''}
                            onChange={(e) => setCurrentCase({ ...currentCase, anamneseDatum: e.target.value })}
                            className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 h-[38px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Kontaktdaten (optional / keine Pflicht) */}
                    <div id="section-contact-info" className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-teal-600 shrink-0" />
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {t('contactDataTitle')} <span className="text-slate-500 font-normal text-[11px] lowercase">{t('optionalField')}</span>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        {/* E-Mail-Adresse */}
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1" htmlFor="input-patient-email">
                            {t('patientEmail')}
                          </label>
                          <div className="relative flex items-center">
                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              id="input-patient-email"
                              type="email"
                              placeholder={t('patientEmailPlaceholder')}
                              value={currentCase.patientEmail || ''}
                              onChange={(e) => setCurrentCase({ ...currentCase, patientEmail: e.target.value })}
                              className="w-full pl-8 pr-9 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 bg-white h-[38px]"
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                              <VoiceInputButton
                                value={currentCase.patientEmail || ''}
                                onChange={(val) => setCurrentCase({ ...currentCase, patientEmail: val })}
                                size="xs"
                                mode="append"
                                id="btn-voice-patient-email"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Telefonnummer */}
                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1" htmlFor="input-patient-phone">
                            {t('patientPhone')}
                          </label>
                          <div className="relative flex items-center">
                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                            <input
                              id="input-patient-phone"
                              type="tel"
                              placeholder={t('patientPhonePlaceholder')}
                              value={currentCase.patientPhone || ''}
                              onChange={(e) => setCurrentCase({ ...currentCase, patientPhone: e.target.value })}
                              className="w-full pl-8 pr-9 py-2 border border-slate-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-teal-600 bg-white h-[38px]"
                            />
                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                              <VoiceInputButton
                                value={currentCase.patientPhone || ''}
                                onChange={(val) => setCurrentCase({ ...currentCase, patientPhone: val })}
                                size="xs"
                                mode="append"
                                id="btn-voice-patient-phone"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conditional: Pregnancy Section (Wenn Frau / Geschlecht === 'weiblich') */}
                    {currentCase.patientGender === 'weiblich' && (
                      <div id="section-pregnancy" className="p-4 rounded-xl border border-rose-100 bg-rose-50/40 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2">
                          <Baby className="w-4 h-4 text-rose-600 shrink-0" />
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {t('isPregnantLabel')}
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                          {/* Toggle buttons: Nein / Ja */}
                          <div className="sm:col-span-6 flex items-center gap-2">
                            <button
                              type="button"
                              id="btn-pregnant-no"
                              onClick={() => setCurrentCase({ ...currentCase, isPregnant: false, pregnancyMonth: undefined })}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                                !currentCase.isPregnant
                                  ? 'bg-white border-slate-300 text-slate-800 shadow-xs font-bold ring-1 ring-slate-300'
                                  : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                              }`}
                            >
                              {t('isPregnantNo')}
                            </button>
                            <button
                              type="button"
                              id="btn-pregnant-yes"
                              onClick={() => setCurrentCase({ ...currentCase, isPregnant: true, pregnancyMonth: currentCase.pregnancyMonth || 1 })}
                              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                                currentCase.isPregnant
                                  ? 'bg-rose-600 border-rose-600 text-white shadow-xs font-bold'
                                  : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                              }`}
                            >
                              {t('isPregnantYes')}
                            </button>
                          </div>

                          {/* If pregnant: Month selector */}
                          {currentCase.isPregnant && (
                            <div className="sm:col-span-6 flex items-center gap-2 animate-in fade-in duration-150">
                              <label className="text-xs font-semibold text-slate-700 shrink-0" htmlFor="select-pregnancy-month">
                                {t('pregnancyMonthLabel')}:
                              </label>
                              <select
                                id="select-pregnancy-month"
                                value={currentCase.pregnancyMonth || 1}
                                onChange={(e) => setCurrentCase({ ...currentCase, pregnancyMonth: parseInt(e.target.value) })}
                                className="w-full px-3 py-1.5 border border-rose-300 rounded-md text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-rose-500 bg-white h-[38px]"
                              >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                                  <option key={m} value={m}>
                                    {t('pregnancyMonthOption', { month: m })}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Children Section (Haben Sie Kinder?) */}
                    <div id="section-children" className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-teal-600 shrink-0" />
                          <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                            {t('hasChildrenLabel')}
                          </label>
                        </div>

                        {/* Toggle Yes/No */}
                        <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-lg">
                          <button
                            type="button"
                            id="btn-children-no"
                            onClick={() => handleToggleChildren(false)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              !currentCase.hasChildren
                                ? 'bg-white text-slate-800 shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t('hasChildrenNo')}
                          </button>
                          <button
                            type="button"
                            id="btn-children-yes"
                            onClick={() => handleToggleChildren(true)}
                            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                              currentCase.hasChildren
                                ? 'bg-teal-600 text-white shadow-xs font-bold'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {t('hasChildrenYes')}
                          </button>
                        </div>
                      </div>

                      {/* If has children: Dynamic Child Rows */}
                      {currentCase.hasChildren && (
                        <div className="pt-2 space-y-3 animate-in fade-in duration-200 border-t border-slate-200">
                          <div className="flex items-center justify-between text-xs text-slate-600">
                            <span className="font-semibold text-slate-700">
                              {t('childrenListTitle')} ({currentCase.childrenList?.length || 0}):
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {t('childrenCountLabel')}: {currentCase.childrenList?.length || 0}
                            </span>
                          </div>

                          {/* List of child entries */}
                          <div className="space-y-2.5">
                            {(currentCase.childrenList || []).map((child, index) => (
                              <div
                                key={child.id}
                                className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 animate-in fade-in-50 duration-150"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                    <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                                      {index + 1}
                                    </span>
                                    <span>{t('childEntryLabel', { index: index + 1 })}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveChild(child.id)}
                                    className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                    title={t('removeChildBtn')}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span className="text-[11px] hidden sm:inline">{t('removeChildBtn')}</span>
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                  {/* Child Name */}
                                  <div className="sm:col-span-5">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      {t('childNameLabel')}
                                    </label>
                                    <div className="relative flex items-center">
                                      <input
                                        type="text"
                                        placeholder={t('childNamePlaceholder')}
                                        value={child.name || ''}
                                        onChange={(e) => handleUpdateChild(child.id, 'name', e.target.value)}
                                        className="w-full px-2.5 pr-8 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-teal-600 h-[34px]"
                                      />
                                      <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                        <VoiceInputButton
                                          value={child.name || ''}
                                          onChange={(val) => handleUpdateChild(child.id, 'name', val)}
                                          size="xs"
                                          mode="append"
                                          id={`btn-voice-child-${child.id}`}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Child Age */}
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      {t('childAgeLabel')}
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="120"
                                      placeholder="z.B. 7"
                                      value={child.age !== undefined ? child.age : ''}
                                      onChange={(e) => handleUpdateChild(child.id, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-teal-600 h-[34px]"
                                    />
                                  </div>

                                  {/* Child Gender */}
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                      {t('childGenderLabel')}
                                    </label>
                                    <select
                                      value={child.gender || 'weiblich'}
                                      onChange={(e) => handleUpdateChild(child.id, 'gender', e.target.value as any)}
                                      className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-teal-600 bg-white h-[34px]"
                                    >
                                      <option value="weiblich">{t('genderFemale')}</option>
                                      <option value="männlich">{t('genderMale')}</option>
                                      <option value="divers">{t('genderOther')}</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Plus button to add another child */}
                          <button
                            type="button"
                            id="btn-add-child"
                            onClick={handleAddChild}
                            className="w-full py-2 px-3 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('addChildBtn')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Zusätzliche Stammdaten / Freie Felder */}
                    <div id="section-custom-stammdaten" className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <label className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                              {t('customStammdatenTitle')}
                            </label>
                            <span className="text-[11px] text-slate-500 font-normal">
                              {t('customStammdatenDesc')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          id="btn-add-custom-sd-top"
                          onClick={() => handleAddCustomStammdaten()}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t('addCustomStammdatenBtn')}</span>
                        </button>
                      </div>



                      {/* Custom Fields List */}
                      {currentCase.customStammdaten && currentCase.customStammdaten.length > 0 && (
                        <div className="space-y-3 pt-2">
                          {currentCase.customStammdaten.map((field, idx) => (
                            <div
                              key={field.id}
                              className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-2 relative group animate-in fade-in-50 duration-150"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                                  <span className="w-4 h-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[10px] font-bold">
                                    {idx + 1}
                                  </span>
                                  <span>{field.name || `${t('extraFields')} #${idx + 1}`}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveCustomStammdaten(field.id)}
                                  className="text-slate-400 hover:text-rose-600 text-xs font-semibold flex items-center gap-1 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                  title={t('removeChildBtn')}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span className="text-[11px] hidden sm:inline">{t('removeChildBtn')}</span>
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                                {/* Field Name */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                    {t('profilePraxisNameTitle')}
                                  </label>
                                  <input
                                    type="text"
                                    placeholder={t('customStammdatenNamePlaceholder')}
                                    value={field.name}
                                    onChange={(e) => handleUpdateCustomStammdaten(field.id, 'name', e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-600 h-[34px] bg-slate-50/50"
                                  />
                                </div>

                                {/* Field Value */}
                                <div className="sm:col-span-8">
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">
                                    {t('optionalInfo')}
                                  </label>
                                  <div className="relative flex items-center">
                                    <input
                                      type="text"
                                      placeholder={t('customStammdatenValuePlaceholder')}
                                      value={field.value}
                                      onChange={(e) => handleUpdateCustomStammdaten(field.id, 'value', e.target.value)}
                                      className="w-full px-2.5 pr-8 py-1.5 border border-slate-300 rounded-md text-xs text-slate-900 focus:outline-none focus:border-teal-600 h-[34px]"
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                      <VoiceInputButton
                                        value={field.value}
                                        onChange={(val) => handleUpdateCustomStammdaten(field.id, 'value', val)}
                                        size="xs"
                                        mode="append"
                                        id={`btn-voice-custom-sd-${field.id}`}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddCustomStammdaten()}
                            className="w-full py-2 px-3 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('addCustomStammdatenBtn')}</span>
                          </button>
                        </div>
                      )}
                    </div>

                                      </div>
                )}

                {/* 2. HAUPTBESCHWERDE & DYNAMISCHE FRAGEN */}
                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-150">
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <label className="block text-xs font-bold text-slate-800 uppercase" htmlFor="input-hauptbeschwerde">
                          {t('mainComplaintTitle')} *
                        </label>
                      </div>

                      <div className="relative">
                        <textarea
                          id="input-hauptbeschwerde"
                          ref={hauptbeschwerdeRef}
                          rows={4}
                          placeholder={t('mainComplaintPlaceholder')}
                          value={currentCase.hauptbeschwerde || ''}
                          onChange={(e) => handleUpdateHauptbeschwerde(e.target.value)}
                          onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.max(130, target.scrollHeight)}px`;
                          }}
                          className="w-full pl-4 pr-12 py-3.5 border-2 border-teal-600/60 rounded-xl bg-white text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 shadow-2xs min-h-[130px] leading-relaxed transition-all resize-y"
                        />
                        <div className="absolute right-3 top-3">
                          <VoiceInputButton
                            value={currentCase.hauptbeschwerde || ''}
                            onChange={(val) => handleUpdateHauptbeschwerde(val)}
                            size="sm"
                            mode="append"
                            id="btn-voice-hauptbeschwerde"
                          />
                        </div>
                      </div>

                      {/* Visual Live Tags for Detected Complaints */}
                      {currentCase.hauptbeschwerde?.trim() && (() => {
                        const detected = splitMultipleComplaints(currentCase.hauptbeschwerde || '');
                        if (detected.length === 0) return null;
                        return (
                          <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200/80 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-teal-700" />
                                {detected.length > 1
                                  ? t('separateComplaintsDetected', { count: detected.length })
                                  : t('singleSymptomDetected')}
                              </span>
                              <span className="text-[10px] text-teal-700 font-medium">
                                {t('autoComplaintSeparation')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {detected.map((complaint, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-teal-300 shadow-2xs"
                                >
                                  <span className="w-4 h-4 rounded-full bg-teal-700 text-white text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-bold text-teal-950">{complaint}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Dynamic Question Generator Container */}
                    <DynamicComplaintQuestions
                      chiefComplaint={currentCase.hauptbeschwerde || ''}
                      questions={currentCase.anamnesisQuestions || []}
                      onUpdateQuestion={handleUpdateAnamnesisQuestion}
                      onAddCustomQuestion={handleAddCustomQuestion}
                      onRemoveQuestion={handleRemoveAnamnesisQuestion}
                      onRegenerateQuestions={handleRegenerateQuestions}
                      onTransferToAnamnese={handleTransferAnswersToAnamnese}
                    />
                  </div>
                )}

                {/* 3. FRAGEBOGEN */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div className="p-6 bg-teal-50/50 border border-teal-200 rounded-xl space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-teal-100 rounded-lg shrink-0">
                          <Stethoscope className="w-5 h-5 text-teal-700" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm mb-1">{t('extAnamnesisTitle' as TranslationKey)}</h4>
                          <p className="text-xs text-slate-600 mb-4 max-w-xl">
                            {t('extAnamnesisDesc' as TranslationKey)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsExtendedAnamnesisWizardOpen(true)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            {t('btnStartQuestionnaire' as TranslationKey)}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. BEFUND */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800 uppercase" htmlFor="input-befund-gewuenscht">
                          {t('recordFindings')}
                        </label>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setCurrentCase({ ...currentCase, befundGewuenscht: true })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentCase.befundGewuenscht === true ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${currentCase.befundGewuenscht === true ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                            {currentCase.befundGewuenscht === true && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {t('yesDesired')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentCase({ ...currentCase, befundGewuenscht: false, befundText: '' })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentCase.befundGewuenscht === false ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${currentCase.befundGewuenscht === false ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
                            {currentCase.befundGewuenscht === false && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {t('notDesired')}
                        </button>
                      </div>
                      
                      {currentCase.befundGewuenscht && (
                        <div className="animate-in fade-in duration-200 space-y-6 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
                          <div className="mb-4">
                            <h4 className="text-base font-bold text-slate-800">{t('clinicalFindings' as TranslationKey)}</h4>
                            <p className="text-sm text-slate-600">{t('clinicalFindingsDesc')}</p>
                          </div>
                          
                          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              {t('overallAssessment')}
                            </label>
                            <div className="relative flex items-center">
                              <select
                                value={currentCase.befundDetails?.gesamtbeurteilung || ''}
                                onChange={(e) => setCurrentCase({ 
                                  ...currentCase, 
                                  befundDetails: { ...(currentCase.befundDetails || {}), gesamtbeurteilung: e.target.value } 
                                })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none"
                              >
                                <option value="">{t('unknown' as TranslationKey)}</option>
                                <option value="Unauffällig">{t('assessmentUnremarkable')}</option>
                                <option value="Leicht reduziert">{t('assessmentSlightlyReduced')}</option>
                                <option value="Reduziert">{t('assessmentReduced')}</option>
                                <option value="Kritisch">{t('assessmentCritical')}</option>
                              </select>
                              <div className="absolute right-3 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                              </div>
                            </div>
                          </div>

                          {/* 1. Vitalparameter (Top Row - 5 Vital Signs) */}
                          <div className="pt-1">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1.5 mb-3 border-b border-slate-200">{t('vitalSigns')}</h5>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                              {[
                                { key: 'blutdruck', label: 'bloodPressure', ph: '120/80' },
                                { key: 'puls', label: 'heartRate', ph: '72' },
                                { key: 'temperatur', label: 'temperature', ph: '36.8' },
                                { key: 'spo2', label: 'spo2', ph: '98' },
                                { key: 'gewicht', label: 'weight', ph: '75' }
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t(f.label as TranslationKey)}</label>
                                  <div className="relative">
                                    <input
                                      type="text"
                                      placeholder={f.ph}
                                      value={(currentCase.befundDetails as any)?.[f.key] || ''}
                                      onChange={(e) => setCurrentCase({ 
                                        ...currentCase, 
                                        befundDetails: { ...(currentCase.befundDetails || {}), [f.key]: e.target.value } 
                                      })}
                                      className="w-full px-3 py-1.5 pr-7 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow"
                                    />
                                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                                      <VoiceInputButton
                                        id={`voice-${f.key}`}
                                        value={(currentCase.befundDetails as any)?.[f.key] || ''}
                                        onChange={(val) => setCurrentCase({ ...currentCase, befundDetails: { ...(currentCase.befundDetails || {}), [f.key]: val } })}
                                        mode="append"
                                        size="xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 2. Untersuchungsbefund (Körperliche Untersuchung - Kompakt & Übersichtlich) */}
                          <div className="pt-2">
                            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-1.5 mb-3 border-b border-slate-200">{t('examinationFindings')}</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {[
                                { key: 'allgemeinzustand', label: 'generalCondition', ph: 'AZ / EZ, Bewusstsein...' },
                                { key: 'herzLunge', label: 'heartLungs', ph: 'Auskultationsbefund, Atmung...' },
                                { key: 'abdomen', label: 'abdomen', ph: 'Weich, eindrückbar, Druckschmerz...' },
                                { key: 'neurologisch', label: 'neurological', ph: 'Hirnnerven, Motorik, Sensibilität...' },
                                { key: 'hautSchleimhaeute', label: 'skinMucosa', ph: 'Rosig, feucht, Turgor...' },
                                { key: 'weitereBefunde', label: 'otherFindings', ph: 'Orthopädisch, HNO, Labor...' }
                              ].map(f => (
                                <div key={f.key}>
                                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{t(f.label as TranslationKey)}</label>
                                  <div className="relative">
                                    <textarea
                                      rows={2}
                                      placeholder={f.ph}
                                      value={(currentCase.befundDetails as any)?.[f.key] || ''}
                                      onChange={(e) => setCurrentCase({ 
                                        ...currentCase, 
                                        befundDetails: { ...(currentCase.befundDetails || {}), [f.key]: e.target.value } 
                                      })}
                                      className="w-full px-3 py-1.5 pb-6 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-shadow resize-y"
                                    />
                                    <div className="absolute bottom-1.5 right-1.5">
                                      <VoiceInputButton
                                        id={`voice-${f.key}`}
                                        value={(currentCase.befundDetails as any)?.[f.key] || ''}
                                        onChange={(val) => setCurrentCase({ ...currentCase, befundDetails: { ...(currentCase.befundDetails || {}), [f.key]: val } })}
                                        mode="append"
                                        size="xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Custom Fields */}
                            {currentCase.befundDetails?.customFelder && currentCase.befundDetails.customFelder.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-3.5">
                                {currentCase.befundDetails.customFelder.map((field, idx) => (
                                  <div key={field.id} className="relative p-2.5 rounded-lg border border-slate-200 bg-slate-50 group">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newFields = [...(currentCase.befundDetails?.customFelder || [])];
                                        newFields.splice(idx, 1);
                                        setCurrentCase({
                                          ...currentCase,
                                          befundDetails: { ...(currentCase.befundDetails || {}), customFelder: newFields }
                                        });
                                      }}
                                      className="absolute -top-2 -right-2 p-1 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 border border-slate-200 rounded-full transition-colors shadow-xs opacity-0 group-hover:opacity-100 cursor-pointer"
                                      title="Löschen"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                    <div className="space-y-1.5">
                                      <input
                                        type="text"
                                        placeholder={t('customFieldName')}
                                        value={field.name}
                                        onChange={(e) => {
                                          const newFields = [...(currentCase.befundDetails?.customFelder || [])];
                                          newFields[idx].name = e.target.value;
                                          setCurrentCase({
                                            ...currentCase,
                                            befundDetails: { ...(currentCase.befundDetails || {}), customFelder: newFields }
                                          });
                                        }}
                                        className="w-full px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                      />
                                      <div className="relative">
                                        <textarea
                                          rows={2}
                                          placeholder={t('customFieldValue')}
                                          value={field.value}
                                          onChange={(e) => {
                                            const newFields = [...(currentCase.befundDetails?.customFelder || [])];
                                            newFields[idx].value = e.target.value;
                                            setCurrentCase({
                                              ...currentCase,
                                              befundDetails: { ...(currentCase.befundDetails || {}), customFelder: newFields }
                                            });
                                          }}
                                          className="w-full px-2.5 py-1.5 pb-6 rounded-md border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-y"
                                        />
                                        <div className="absolute bottom-1.5 right-1.5">
                                          <VoiceInputButton
                                            id={`voice-custom-${field.id}`}
                                            value={field.value}
                                            onChange={(val) => {
                                              const newFields = [...(currentCase.befundDetails?.customFelder || [])];
                                              newFields[idx].value = val;
                                              setCurrentCase({
                                                ...currentCase,
                                                befundDetails: { ...(currentCase.befundDetails || {}), customFelder: newFields }
                                              });
                                            }}
                                            mode="append"
                                            size="xs"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                const newFields = [...(currentCase.befundDetails?.customFelder || [])];
                                newFields.push({ id: Math.random().toString(36).substr(2, 9), name: '', value: '' });
                                setCurrentCase({
                                  ...currentCase,
                                  befundDetails: { ...(currentCase.befundDetails || {}), customFelder: newFields }
                                });
                              }}
                              className="w-full py-2 px-3 mt-3 border border-dashed border-slate-300 hover:border-teal-400 bg-slate-50 hover:bg-teal-50 text-slate-600 hover:text-teal-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{t('addCustomField')}</span>
                            </button>
                          </div>
                        </div>
                      )}                   </div>
                  </div>
                )}

                {/* 5. MEDIKAMENTENEINNAHME */}
                {currentStep === 5 && (
                  <div className="space-y-4 animate-in fade-in-50 duration-150">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold text-slate-800 uppercase mb-2">
                          {t('takeMedication')}
                        </label>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <button
                          type="button"
                          onClick={() => setCurrentCase({ ...currentCase, nimmtMedikamente: true })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentCase.nimmtMedikamente === true ? 'bg-teal-50 border-teal-500 text-teal-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${currentCase.nimmtMedikamente === true ? 'bg-teal-600 border-teal-600' : 'border-slate-300'}`}>
                            {currentCase.nimmtMedikamente === true && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {t('yes')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentCase({ ...currentCase, nimmtMedikamente: false, medikamenteList: [] })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentCase.nimmtMedikamente === false ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${currentCase.nimmtMedikamente === false ? 'bg-rose-600 border-rose-600' : 'border-slate-300'}`}>
                            {currentCase.nimmtMedikamente === false && <Check className="w-3 h-3 text-white" />}
                          </div>
                          {t('no')}
                        </button>
                      </div>
                      
                      {currentCase.nimmtMedikamente && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          {(currentCase.medikamenteList || []).map((med, index) => (
                            <MedicationLiveInput
                              key={index}
                              index={index}
                              med={med}
                              onChange={(updated) => {
                                const newList = [...(currentCase.medikamenteList || [])];
                                newList[index] = updated;
                                setCurrentCase({ ...currentCase, medikamenteList: newList });
                              }}
                              onRemove={() => {
                                const newList = [...(currentCase.medikamenteList || [])];
                                newList.splice(index, 1);
                                setCurrentCase({ ...currentCase, medikamenteList: newList });
                              }}
                              t={t}
                            />
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              const newList = [...(currentCase.medikamenteList || []), { name: '', dosierung: '', einnahmeart: '' }];
                              setCurrentCase({ ...currentCase, medikamenteList: newList });
                            }}
                            className="w-full py-2.5 px-3 border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-100/50 text-teal-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors mt-2 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t('addMedication')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 6. ÜBERSICHT & ANALYSE */}
                {currentStep === 6 && (
                  <div className="space-y-6 animate-in fade-in-50 duration-150">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg mb-1">{t('stepSummaryTitle')}</h4>
                      <p className="text-sm text-slate-600">{t('stepSummaryDesc')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {/* 1. Stammdaten */}
                      <div className="p-5 bg-white border border-slate-200 rounded-lg md:col-span-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <User className="w-4 h-4 text-teal-600" />
                            {t('profilePersonalDataTitle' as any) || 'Persönliche Daten'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('stepEditSection')}
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-sm">
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientBirthDate' as any) || 'Geburtsdatum'}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientBirthDate || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientAge')}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientAge !== undefined ? `${currentCase.patientAge} Jahre` : '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientHeight' as any) || 'Größe (cm)'}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientHeightCm ? `${currentCase.patientHeightCm} cm` : '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientWeight' as any) || 'Gewicht (kg)'}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientWeightKg ? `${currentCase.patientWeightKg} kg` : '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientGender' as any) || 'Geschlecht'}</span>
                            <span className="text-slate-900 font-medium">
                              {currentCase.patientGender === 'weiblich' ? t('genderFemale' as any) : 
                               (currentCase.patientGender === 'männlich' ? t('genderMale' as any) : 
                               (currentCase.patientGender === 'divers' ? t('genderOther' as any) : '-'))}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientMaritalStatus' as any) || 'Familienstand'}</span>
                            <span className="text-slate-900 font-medium">
                              {currentCase.patientMaritalStatus === 'ledig' ? t('maritalSingle' as any) : 
                               (currentCase.patientMaritalStatus === 'verheiratet' ? t('maritalMarried' as any) : 
                               (currentCase.patientMaritalStatus === 'in Partnerschaft' ? (t('maritalPartnership' as any) || 'In Partnerschaft') :
                               (currentCase.patientMaritalStatus === 'geschieden' ? t('maritalDivorced' as any) : 
                               (currentCase.patientMaritalStatus === 'getrennt lebend' ? (t('maritalSeparated' as any) || 'Getrennt lebend') :
                               (currentCase.patientMaritalStatus === 'verwitwet' ? t('maritalWidowed' as any) : 
                               (currentCase.patientMaritalStatus === 'sonstiges' ? t('maritalOther' as any) : (currentCase.patientMaritalStatus || '-')))))))}
                            </span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientEmail')}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientEmail || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('patientPhone')}</span>
                            <span className="text-slate-900 font-medium">{currentCase.patientPhone || '-'}</span>
                          </div>
                          <div>
                            <span className="block text-slate-500 mb-1">{t('hasChildrenLabel' as any) || 'Haben Sie Kinder?'}</span>
                            <span className="text-slate-900 font-medium">
                              {currentCase.hasChildren ? (
                                <span>{t('yes')} ({currentCase.childrenList?.length || currentCase.childrenCount || 1} Kinder)</span>
                              ) : t('no')}
                            </span>
                          </div>
                        </div>

                        {/* Custom Stammdaten in Summary */}
                        {currentCase.customStammdaten && currentCase.customStammdaten.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <span className="block text-slate-500 text-xs font-bold uppercase mb-2">
                              {t('customStammdatenTitle')}:
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {currentCase.customStammdaten.map((cs) => (
                                <div key={cs.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                  <span className="block text-slate-500 text-xs font-medium">{cs.name || 'Feld'}:</span>
                                  <span className="text-slate-900 font-semibold text-sm">{cs.value || '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 2. Hauptbeschwerde */}
                      <div className="p-5 bg-white border border-slate-200 rounded-lg md:col-span-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <MessageSquare className="w-4 h-4 text-teal-600" />
                            {stepNames[1]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('stepEditSection')}
                          </button>
                        </div>
                        <p className="text-slate-900 font-medium mb-4 whitespace-pre-wrap">
                          {currentCase.hauptbeschwerde || '-'}
                        </p>
                        
                        {currentCase.anamnesisQuestions && currentCase.anamnesisQuestions.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                            {currentCase.anamnesisQuestions.map((q, idx) => (
                              <div key={q.id} className="text-sm">
                                <span className="block text-slate-500 mb-1">{idx + 1}. {q.question}</span>
                                <span className="text-slate-900 font-medium">
                                  {q.type === 'scale' ? `${q.answerScaleCurrent || '-'} (Aktuell) / ${q.answerScaleWorst || '-'} (Schlimmste)` : 
                                   (q.type === 'choice' ? q.answerChoice : 
                                   (q.type === 'multi_choice' ? q.answerMultiChoice?.join(', ') : q.answerText)) || '-'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 3. Fragebogen */}
                      <div className="p-5 bg-white border border-slate-200 rounded-lg md:col-span-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <Stethoscope className="w-4 h-4 text-teal-600" />
                            {stepNames[2]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('stepEditSection')}
                          </button>
                        </div>
                        {currentCase.extendedAnamnesis && Object.keys(currentCase.extendedAnamnesis).length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(currentCase.extendedAnamnesis).map(([key, val]) => {
                              if (!val || (Array.isArray(val) && val.length === 0)) return null;
                              return (
                                <div key={key} className="text-sm">
                                  <span className="block text-slate-500 mb-1 truncate">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                  <span className="text-slate-900 font-medium break-words">
                                    {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-slate-600">{t('noData')}</p>
                        )}
                      </div>

                      {/* 4. Befund */}
                      <div className="p-5 bg-white border border-slate-200 rounded-lg md:col-span-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <FileText className="w-4 h-4 text-teal-600" />
                            {stepNames[3]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(4)}
                            className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('stepEditSection')}
                          </button>
                        </div>
                        {currentCase.befundGewuenscht ? (
                          <div className="space-y-4">
                            {currentCase.befundDetails && Object.keys(currentCase.befundDetails).length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                {Object.entries(currentCase.befundDetails).map(([key, val]) => {
                                  if (!val) return null;
                                  return (
                                    <div key={key}>
                                      <span className="block text-slate-500 mb-1 capitalize">{key}</span>
                                      <span className="text-slate-900 font-medium">{String(val)}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            {currentCase.befundText && (
                              <div className="text-sm">
                                <span className="block text-slate-500 mb-1">Text</span>
                                <span className="text-slate-900 font-medium whitespace-pre-wrap">{currentCase.befundText}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-slate-600">{t('notDesired')}</p>
                        )}
                      </div>

                      {/* 5. Medikamenteneinnahme */}
                      <div className="p-5 bg-white border border-slate-200 rounded-lg md:col-span-2 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <span className="font-bold text-slate-800 flex items-center gap-2 text-base">
                            <Pill className="w-4 h-4 text-teal-600" />
                            {stepNames[4]}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(5)}
                            className="text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 text-xs transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {t('stepEditSection')}
                          </button>
                        </div>
                        {currentCase.nimmtMedikamente ? (
                          <div className="space-y-3">
                            <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md border border-rose-200 mb-2">
                              {t('yes')}
                            </span>
                            {currentCase.medikamenteList && currentCase.medikamenteList.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-2">
                                {currentCase.medikamenteList.map((m, idx) => (
                                  <div key={(m as any).id || idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                    <span className="block font-bold text-slate-800 mb-1">{m.name}</span>
                                    {m.dosierung && <span className="block text-slate-600 mb-0.5">Dosierung: {m.dosierung}</span>}
                                    {(m as any).grund && <span className="block text-slate-600">Grund: {(m as any).grund}</span>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-slate-600">{t('none')}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-md border border-teal-200">
                            {t('no')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Prominent Action Banner for Step 7 */}
                    <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold text-[11px] uppercase tracking-wider">
                            {t('step7ShortBadge')}
                          </span>
                          <span className="text-xs text-slate-400">{t('fullAiDiagnostics')}</span>
                        </div>
                        <h4 className="text-base sm:text-lg font-bold flex items-center gap-2 mt-1">
                          <Sparkles className="w-5 h-5 text-teal-400" />
                          <span>{t('createHolisticAnalysisTitle')}</span>
                        </h4>
                        <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                          {t('createHolisticAnalysisDesc')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="shrink-0 px-6 py-3.5 bg-teal-400 hover:bg-teal-300 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-all shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer"
                      >
                        <Sparkles className={`w-4 h-4 text-slate-950 ${isAnalyzing ? 'animate-spin' : ''}`} />
                        <span>{isAnalyzing ? t('analysisCalculating') : t('btnRunAnalysis')}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. ANALYSE & AUSWERTUNG */}
                {currentStep === 7 && (
                  <div className="animate-in fade-in-50 duration-150">
                    {isAnalyzing ? (
                      <div className="bg-white p-12 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-3 border-teal-600 border-t-transparent animate-spin"></div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{t('analysisCalculatingTitle')}</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-md">
                            {t('analysisCalculatingDesc')}
                          </p>
                        </div>
                      </div>
                    ) : clinicalAnalysis ? (
                      <ComprehensiveAnalysisView
                        patientCase={currentCase as PatientCase}
                        analysis={clinicalAnalysis}
                        onEditSection={(stepIdx) => setCurrentStep(stepIdx)}
                        onReAnalyze={handleRunAnalysis}
                        isAnalyzing={isAnalyzing}
                      />
                    ) : (
                      <div className="bg-white p-12 rounded-xl shadow-xs border border-slate-200 text-center space-y-4">
                        <Sparkles className="w-12 h-12 text-teal-600 mx-auto" />
                        <h3 className="text-lg font-bold text-slate-900">{t('analysisNotYetCalculated')}</h3>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          {t('analysisNotYetCalculatedDesc')}
                        </p>
                        <button
                          type="button"
                          onClick={handleRunAnalysis}
                          className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs"
                        >
                          {t('btnRunAnalysis')}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 8. EMPFEHLUNGEN & VERORDNUNG */}
                {currentStep === 8 && (
                  <div className="animate-in fade-in-50 duration-150">
                    <TherapyRecommendationsView
                      patientCase={currentCase as PatientCase}
                      analysis={clinicalAnalysis || {
                        redFlags: {
                          warnings: [],
                          gesamtbewertung: '',
                          empfohleneFachrichtung: '',
                          dringlichkeit: 'Kein akuter Warnhinweis anhand der vorliegenden Angaben'
                        },
                        differentialdiagnostik: { items: [] },
                        medikamente: {
                          zusammenfassung: '',
                          details: []
                        },
                        homoeopathie: {
                          mittel: (currentCase.remedySuggestions || []).map(r => ({
                            name: r.name,
                            potenz: r.potency || 'C30',
                            dosierungPotenz: r.potency || 'C30',
                            tagesdosis: '1 bis 2 Gaben à 3–5 Globuli',
                            haeufigkeit: '1- bis 2-mal täglich',
                            anwendungsdauer: '3 bis maximal 5 Tage',
                            zeitraum: 'Akut- und Initialphase',
                            einnahmehinweis: '',
                            score: r.score,
                            rangBegruendung: r.description || '',
                            passungSymptome: r.keyIndicators || [],
                            modalitaeten: []
                          }))
                        }
                      }}
                      onUpdateCase={(updates) => setCurrentCase(prev => ({ ...prev, ...updates }))}
                      onSaveCase={handleSaveCase}
                      onPreviousStep={() => setCurrentStep(7)}
                    />
                  </div>
                )}
              </div>

              {/* SEQUENTIAL NAVIGATION BUTTONS DIRECTLY UNDER EACH SECTION */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
                {/* Back Button */}
                <button
                  id="btn-step-back"
                  type="button"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    currentStep === 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                      : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-xs'
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t('btnStepBack')}</span>
                </button>

                {/* Center: Step Indicator */}
                <div className="text-xs font-semibold text-slate-500 hidden sm:block">
                  {stepNames[currentStep - 1] || allStepNames[currentStep - 1]} ({currentStep} / {totalWizardSteps})
                </div>

                {/* Next / Action Buttons */}
                <div className="flex items-center gap-2">
                  {currentStep === 6 ? (
                    <button
                      type="button"
                      onClick={handleSaveCase}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-300 shadow-xs"
                    >
                      <Save className="w-4 h-4" />
                      <span>{t('btnSaveCase')}</span>
                    </button>
                  ) : currentStep === 7 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSaveCase}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-slate-300 shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>{t('btnSaveCase')}</span>
                      </button>

                      {hasAnalysis && (
                        <button
                          type="button"
                          onClick={goToNextStep}
                          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                        >
                          <span>{t('goToRecommendationsBtn')}</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : currentStep === 8 ? (
                    <>
                      <button
                        type="button"
                        onClick={handleExportRecommendationsPDF}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <FileDown className="w-4 h-4 text-teal-700" />
                        <span>{t('downloadRecommendationsPDF')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleExportFullAnalysisPDF}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <FileDown className="w-4 h-4 text-slate-200" />
                        <span>{t('downloadFullAnalysisPDF')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveCase}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                      >
                        <Save className="w-4 h-4" />
                        <span>{t('btnSaveCase')}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      id="btn-step-next"
                      type="button"
                      onClick={goToNextStep}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
                    >
                      <span>{t('btnStepNext')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Repertorisation / Analysis Results Modal */}
      <ExtendedAnamnesisWizard
        isOpen={isExtendedAnamnesisWizardOpen}
        onClose={() => setIsExtendedAnamnesisWizardOpen(false)}
        initialData={currentCase.extendedAnamnesis || {}}
        onSave={(data) => {
          setCurrentCase(prev => ({ ...prev, extendedAnamnesis: data }));
          setSaveToast(t('toastExtendedAnamnesisSaved'));
          setTimeout(() => setSaveToast(null), 3000);
        }}
        patientName={currentCase.patientName}
      />

      <CaseAnalysisModal
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        results={analysisResults}
        patientCase={currentCase}
        remainingAnalyses={remainingCount}
      />

      {/* Upgrade / Quota Lockout Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onGoToAdmin={onGoToAdmin}
      />

      {/* Patient / Customer Selection Modal */}
      <PatientSelectionModal
        isOpen={isPatientSelectionModalOpen}
        onClose={() => setIsPatientSelectionModalOpen(false)}
        onSelectPatient={(patientCase) => {
          handleSelectCase(patientCase);
          setIsPatientSelectionModalOpen(false);
          showToast(t('toastPatientSelected', { name: patientCase.patientName || 'Patient' }) || `${patientCase.patientName || 'Patient'} geladen`);
        }}
        cases={cases}
        activePatientName={currentCase.patientName}
      />

      {/* Modal: Keine Stammdaten vorhanden */}
      {isNoMasterDataModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 sm:p-7 text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <UserX className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 font-serif">
                {t('noMasterDataTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
                {t('noMasterDataMsg')}
              </p>
            </div>

            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsNoMasterDataModalOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {t('btnCancelModal')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsNoMasterDataModalOpen(false);
                  setCurrentStep(1);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <span>{t('btnGoToMasterData')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
