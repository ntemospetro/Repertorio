import React, { useState, useMemo } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Sparkles, 
  Quote, 
  MapPin, 
  Flame, 
  Sliders, 
  Award, 
  Clock, 
  Zap,
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  HelpCircle, 
  AlertCircle, 
  Trash2, 
  CornerDownRight, 
  Send,
  Layers,
  Save,
  CheckCircle2,
  Target,
  Plus,
  Heart,
  Mic,
  MicOff
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageCode } from '../types';
import { RepertoriumSymptomInput } from '../services/boerickeRepertoryService';
import { analyzeChiefComplaint } from '../services/chiefComplaintAnalysisService';
import { startSpeechRecognition, SpeechRecognitionSession } from '../services/speechService';
import { 
  extractCuesFromInitialComplaint, 
  generateAdaptiveQuestions, 
  getAdaptiveQuestionsForPillar,
  getAdaptiveRadiationQuestion,
  buildSynthesizedSymptomText,
  getStructuredAnswerOptions,
  analyzePatientStatement,
  evaluateTherapistQuestion,
  generateFollowUpDeepenings,
  analyzeAnamnesisInformationNeeds,
  AnamnesisDialogueStep,
  StructuredOptionItem
} from '../services/adaptiveAnamnesisEngine';

interface AdaptiveAnamnesisWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  symptom: RepertoriumSymptomInput;
  onSave: (updated: RepertoriumSymptomInput) => void;
  language: LanguageCode;
  initialStep?: number;
}

export const AdaptiveAnamnesisWizardModal: React.FC<AdaptiveAnamnesisWizardModalProps> = ({
  isOpen,
  onClose,
  symptom,
  onSave,
  language,
  initialStep = 0
}) => {
  const { t } = useTranslation();

  // Local draft of symptom so edits can be saved on finish or cancelled
  const [draft, setDraft] = useState<RepertoriumSymptomInput>(symptom);

  // Wizard active step:
  // 0 = Einstieg (Hauptbeschwerde)
  // 1 = WO? (Lokalisation)
  // 2 = WAS? (Empfindung)
  // 3 = WODURCH? (Causa & Auslöser - eigenes Fenster vor Modalitäten)
  // 4 = WANN? (Modalitäten - mit Tabs [Besser (>)] und [Schlechter (<)])
  // 5 = WAS NOCH? (Körperliche Begleitsymptome)
  // 6 = GEMÜT? (Gemüt & Psyche - separates Fenster)
  // 7 = SYNTHESE & REPERTORISATION (Prüfung & Übernahme)
  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (initialStep !== undefined && initialStep >= 0 && initialStep <= 7) return initialStep;
    return draft.chiefComplaint ? 1 : 0;
  });

  // Cancel confirmation modal state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Full-width dropdown overlay toggle (default open so therapist has immediate access)
  const [isOverlayOpen, setIsOverlayOpen] = useState(true);

  // Current active question per step
  const [customQuestion, setCustomQuestion] = useState('');
  const [additionalQuestions, setAdditionalQuestions] = useState<string[]>([]);
  const [isCustomQuestionMode, setIsCustomQuestionMode] = useState(false);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('');

  // Free text patient quote for active question
  const [patientQuote, setPatientQuote] = useState('');

  // Selected structured answer options (multi-select)
  const [selectedOptions, setSelectedOptions] = useState<StructuredOptionItem[]>([]);

  // Notice warning when user attempts to proceed without adopting
  const [showMustAdoptWarning, setShowMustAdoptWarning] = useState(false);

  // Deepening questions list
  const [deepenings, setDeepenings] = useState<string[]>([]);

  // Step 0 initial free text
  const [step0Input, setStep0Input] = useState(draft.chiefComplaint || '');
  const [selectedPrimaryComplaint, setSelectedPrimaryComplaint] = useState<string | null>(null);
  const [isStep0Recording, setIsStep0Recording] = useState(false);
  const step0SpeechRef = React.useRef<SpeechRecognitionSession | null>(null);

  React.useEffect(() => {
    return () => {
      step0SpeechRef.current?.stop();
    };
  }, []);

  const toggleStep0Speech = () => {
    if (isStep0Recording) {
      step0SpeechRef.current?.stop();
      setIsStep0Recording(false);
      return;
    }

    try {
      setIsStep0Recording(true);
      step0SpeechRef.current = startSpeechRecognition({
        language,
        continuous: true,
        interimResults: true,
        onResult: (transcript) => {
          if (transcript?.trim()) {
            setStep0Input(transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech error:', err);
          setIsStep0Recording(false);
        },
        onEnd: () => {
          setIsStep0Recording(false);
        }
      });
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsStep0Recording(false);
    }
  };

  const multiAnalysis = useMemo(() => {
    return analyzeChiefComplaint(step0Input, language);
  }, [step0Input, language]);

  const step0Analysis = useMemo(() => {
    const activeText = selectedPrimaryComplaint || step0Input;
    const res = analyzeChiefComplaint(activeText, language);
    return {
      ...res,
      detectedComplaints: multiAnalysis.detectedComplaints,
      hasMultipleComplaints: multiAnalysis.hasMultipleComplaints
    };
  }, [step0Input, selectedPrimaryComplaint, language, multiAnalysis]);

  // Causa specific controls
  const [causaTemporalInput, setCausaTemporalInput] = useState(draft.causaTemporal || '');
  const [causaEffectState, setCausaEffectState] = useState<'worse' | 'better' | 'unchanged' | 'uncertain' | ''>(draft.causaEffect || '');

  // Sub-Tab inside Step 4 (WANN / Modalitäten): Besser (>) vs. Schlechter (<)
  const [modalitySubTab, setModalitySubTab] = useState<'better' | 'worse'>('better');

  // Snapshot ref for dirty-state check (comparing initial vs current state)
  const initialSnapshotRef = React.useRef<string>('');

  const serializeForDirtyCheck = (s: RepertoriumSymptomInput, step0: string) => {
    return JSON.stringify({
      chiefComplaint: (s.chiefComplaint || '').trim(),
      location: (s.location || '').trim(),
      sensation: (s.sensation || '').trim(),
      modalities: (s.modalities || '').trim(),
      concomitants: (s.concomitants || '').trim(),
      mind: (s.mind || '').trim(),
      causaEvent: (s.causaEvent || '').trim(),
      causaTemporal: (s.causaTemporal || '').trim(),
      causaEffect: s.causaEffect || '',
      step0: step0.trim(),
      steps: (s.anamnesisDialogueSteps || []).map(st => ({ q: st.question, a: st.answer, p: st.pillar }))
    });
  };

  // Keep draft in sync if external symptom changes when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraft(symptom);
      const initStep0 = symptom.chiefComplaint || '';
      setStep0Input(initStep0);
      setCausaTemporalInput(symptom.causaTemporal || '');
      setCausaEffectState(symptom.causaEffect || '');
      initialSnapshotRef.current = serializeForDirtyCheck(symptom, initStep0);

      if (initialStep !== undefined && initialStep >= 0 && initialStep <= 7) {
        setCurrentStep(initialStep);
      } else {
        setCurrentStep(symptom.chiefComplaint ? 1 : 0);
      }
      setSelectedOptions([]);
      setSelectedQuestionId('');
      setPatientQuote('');
      setIsCustomQuestionMode(false);
      setCustomQuestion('');
      setAdditionalQuestions([]);
      setDeepenings([]);
      setIsOverlayOpen(true);
      setShowCancelConfirm(false);
      setShowMustAdoptWarning(false);
    }
  }, [isOpen, symptom, initialStep]);

  // Is data modified since modal was opened?
  const isDirty = useMemo(() => {
    const currentSnapshot = serializeForDirtyCheck(draft, step0Input);
    if (initialSnapshotRef.current && currentSnapshot !== initialSnapshotRef.current) return true;
    if (patientQuote.trim().length > 0) return true;
    if (selectedOptions.length > 0) return true;
    if (customQuestion.trim().length > 0 || additionalQuestions.some(q => q.trim().length > 0)) return true;
    return false;
  }, [draft, step0Input, patientQuote, selectedOptions, customQuestion, additionalQuestions]);

  // Derive target pillar from current step:
  // 1 = location, 2 = sensation, 3 = causa, 4 = modalities, 5 = concomitants, 6 = mind
  const getPillarForStep = (step: number): 'location' | 'sensation' | 'causa' | 'modalities' | 'concomitants' | 'mind' => {
    switch (step) {
      case 1: return 'location';
      case 2: return 'sensation';
      case 3: return 'causa';
      case 4: return 'modalities';
      case 5: return 'concomitants';
      case 6: return 'mind';
      default: return 'location';
    }
  };

  const currentPillar = getPillarForStep(currentStep);

  // Dynamic Bedarfsanalyse der Patientenangaben nach Hahnemann & Bönninghausen
  const needsAnalysis = useMemo(() => {
    return analyzeAnamnesisInformationNeeds(draft, language);
  }, [draft, language]);

  // Track which steps have confirmed/adopted answers
  const [adoptedSteps, setAdoptedSteps] = useState<Set<number>>(() => {
    const s = new Set<number>();
    if (symptom.chiefComplaint) s.add(0);
    if (symptom.location) s.add(1);
    if (symptom.sensation) s.add(2);
    if (symptom.causaEvent) s.add(3);
    if (symptom.modalities) s.add(4);
    if (symptom.concomitants) s.add(5);
    if (symptom.mind) s.add(6);
    return s;
  });

  // Sync adopted steps if symptom prop changes
  React.useEffect(() => {
    if (isOpen) {
      const s = new Set<number>();
      if (symptom.chiefComplaint) s.add(0);
      if (symptom.location) s.add(1);
      if (symptom.sensation) s.add(2);
      if (symptom.causaEvent) s.add(3);
      if (symptom.modalities) s.add(4);
      if (symptom.concomitants) s.add(5);
      if (symptom.mind) s.add(6);
      setAdoptedSteps(s);
    }
  }, [isOpen, symptom]);

  // Is current step ready for forward navigation?
  const isCurrentStepAdopted = useMemo(() => {
    if (currentStep === 0) return !!(step0Input.trim() || draft.chiefComplaint);
    if (currentStep === 7) return true;
    if (adoptedSteps.has(currentStep)) return true;
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';
    const val = (draft[field] as string || '').trim();
    return val.length > 0 || patientQuote.trim().length > 0 || selectedOptions.length > 0;
  }, [currentStep, step0Input, draft, adoptedSteps, currentPillar, patientQuote, selectedOptions]);

  // Can the user click "Antwort übernehmen" right now?
  const canAdopt = useMemo(() => {
    if (patientQuote.trim().length > 0) return true;
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';
    const val = (draft[field] as string || '').trim();
    if (val.length > 0) return true;
    const hasPillarSteps = (draft.anamnesisDialogueSteps || []).some(
      s => s.pillar === currentPillar && s.status !== 'NOT_STATED'
    );
    return hasPillarSteps;
  }, [patientQuote, currentPillar, draft]);

  if (!isOpen) return null;

  // Suggested questions specifically for the current pillar (adapts directly to complaint and modality tab!)
  const suggestedQuestions = getAdaptiveQuestionsForPillar(
    draft,
    currentPillar,
    draft.anamnesisDialogueSteps || [],
    language,
    currentStep === 4 ? modalitySubTab : undefined
  );

  const activeQuestionItem = suggestedQuestions.find(q => q.id === selectedQuestionId) || suggestedQuestions[0];
  const allCustomQuestions = [customQuestion.trim(), ...additionalQuestions.map(q => q.trim()).filter(Boolean)].filter(Boolean);
  const activeQuestionText = allCustomQuestions.length > 0
    ? allCustomQuestions.join(' | ')
    : (activeQuestionItem ? activeQuestionItem.text : '');

  // Structured answer options for this pillar, tab and question
  const { options: structuredOptions, standardOptions } = getStructuredAnswerOptions(
    currentPillar,
    activeQuestionText,
    draft.chiefComplaint || '',
    language,
    currentStep === 4 ? modalitySubTab : undefined
  );

  // Target field for AI analysis
  const currentPillarField: keyof RepertoriumSymptomInput = 
    currentPillar === 'causa' ? 'causaEvent' :
    currentPillar === 'location' ? 'location' :
    currentPillar === 'sensation' ? 'sensation' :
    currentPillar === 'modalities' ? 'modalities' :
    currentPillar === 'mind' ? 'mind' : 'concomitants';

  // Live AI analysis of the current statement
  const aiAnalysis = analyzePatientStatement(
    currentPillar,
    patientQuote,
    (draft[currentPillarField] as string) || undefined,
    language
  );

  // Live AI evaluation of therapist question if in custom question mode
  const questionAnalysis = customQuestion.trim()
    ? evaluateTherapistQuestion(customQuestion, currentPillar, language)
    : null;

  // Handle Step 0 Start
  const handleStep0Next = () => {
    if (!step0Input.trim()) return;

    const chosenPrimary = selectedPrimaryComplaint || step0Input.trim();
    const cues = extractCuesFromInitialComplaint(chosenPrimary);

    let initialConcomitants = draft.concomitants || cues.concomitants || '';
    if (selectedPrimaryComplaint && step0Analysis.hasMultipleComplaints) {
      const otherComplaints = step0Analysis.detectedComplaints
        .filter(c => c.toLowerCase() !== selectedPrimaryComplaint.toLowerCase())
        .join(', ');
      if (otherComplaints) {
        initialConcomitants = initialConcomitants
          ? `${initialConcomitants}, ${otherComplaints}`
          : otherComplaints;
      }
    }

    const updated: RepertoriumSymptomInput = {
      ...draft,
      chiefComplaint: chosenPrimary,
      chiefQuote: step0Input.trim(),
      location: draft.location || cues.location || '',
      locationQuote: draft.locationQuote || (cues.location ? step0Input.trim() : ''),
      sensation: draft.sensation || cues.sensation || '',
      sensationQuote: draft.sensationQuote || (cues.sensation ? step0Input.trim() : ''),
      modalities: draft.modalities || cues.modalities || '',
      modalitiesQuote: draft.modalitiesQuote || (cues.modalities ? step0Input.trim() : ''),
      concomitants: initialConcomitants,
      concomitantsQuote: draft.concomitantsQuote || (initialConcomitants ? step0Input.trim() : ''),
      causaEvent: draft.causaEvent || cues.causaEvent || '',
      causaTemporal: draft.causaTemporal || cues.causaTemporal || '',
      causaEffect: draft.causaEffect || (cues.causaEffect as '' | 'worse' | 'better' | 'unchanged' | 'uncertain') || '',
      causaQuote: draft.causaQuote || (cues.causaEvent ? step0Input.trim() : ''),
    };

    const initialStepEntry: AnamnesisDialogueStep = {
      id: `step-0-${Date.now()}`,
      question: t('anamnesisOpeningQuestion'),
      answer: step0Input.trim(),
      pillar: 'chiefComplaint',
      timestamp: Date.now(),
      depthLevel: 1,
      status: 'EXPLICIT'
    };

    updated.anamnesisDialogueSteps = [
      ...(draft.anamnesisDialogueSteps || []).filter(s => s.pillar !== 'chiefComplaint'),
      initialStepEntry
    ];

    updated.text = buildSynthesizedSymptomText(updated);
    setDraft(updated);
    setAdoptedSteps(prev => new Set(prev).add(0));
    setCurrentStep(1);
    setSelectedOptions([]);
    setPatientQuote('');
    setDeepenings([]);
    setShowMustAdoptWarning(false);
  };

  // Handle adopting an answer in Steps 1 to 6
  const handleAdoptAnswer = () => {
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';

    const currentVal = (draft[field] as string || '').trim();
    const quoteVal = patientQuote.trim();

    if (!currentVal && !quoteVal && currentPillar !== 'causa') return;

    let updated = { ...draft };

    // If patient quote was entered, record as dialogue step and update quote field
    if (quoteVal) {
      const stepId = `step-quote-${currentPillar}-${Date.now()}`;
      const questionUsed = activeQuestionText || t('anamnesisDepthInvestigationTitle');
      const newStepEntry: AnamnesisDialogueStep = {
        id: stepId,
        question: questionUsed,
        answer: quoteVal,
        pillar: currentPillar,
        timestamp: Date.now(),
        depthLevel: (updated.anamnesisDialogueSteps || []).filter(s => s.pillar === currentPillar).length + 1,
        status: 'EXPLICIT',
        direction: currentPillar === 'modalities' ? modalitySubTab : aiAnalysis.direction,
        certainty: aiAnalysis.certainty
      };
      updated.anamnesisDialogueSteps = [...(updated.anamnesisDialogueSteps || []), newStepEntry];

      if (currentPillar === 'location') {
        updated.locationQuote = quoteVal;
        if (!currentVal) updated.location = quoteVal;
      } else if (currentPillar === 'sensation') {
        updated.sensationQuote = quoteVal;
        if (!currentVal) updated.sensation = quoteVal;
      } else if (currentPillar === 'modalities') {
        updated.modalitiesQuote = quoteVal;
        const formattedQuote = modalitySubTab === 'better'
          ? (quoteVal.startsWith('>') ? quoteVal : `> ${quoteVal}`)
          : (quoteVal.startsWith('<') ? quoteVal : `< ${quoteVal}`);
        if (!currentVal) {
          updated.modalities = formattedQuote;
        } else if (!currentVal.toLowerCase().includes(quoteVal.toLowerCase())) {
          updated.modalities = `${currentVal}, ${formattedQuote}`;
        }
      } else if (currentPillar === 'causa') {
        updated.causaQuote = quoteVal;
        if (!currentVal) updated.causaEvent = quoteVal;
      } else if (currentPillar === 'concomitants') {
        updated.concomitantsQuote = quoteVal;
        if (!currentVal) updated.concomitants = quoteVal;
      } else if (currentPillar === 'mind') {
        updated.mindQuote = quoteVal;
        if (!currentVal) updated.mind = quoteVal;
      }
    }

    if (currentPillar === 'causa') {
      if (causaTemporalInput.trim()) {
        updated.causaTemporal = causaTemporalInput.trim();
      }
      if (causaEffectState) {
        updated.causaEffect = causaEffectState;
      }
    }

    updated.text = buildSynthesizedSymptomText(updated);
    setDraft(updated);

    // Mark current step as adopted
    setAdoptedSteps(prev => new Set(prev).add(currentStep));
    setShowMustAdoptWarning(false);

    // Reset temporary quote/question inputs
    setPatientQuote('');
    setCustomQuestion('');
    setAdditionalQuestions([]);
    setIsCustomQuestionMode(false);
    setDeepenings([]);
  };

  // Deepen the current statement
  const handleDeepen = () => {
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';
    const textToAnalyze = patientQuote.trim() || (draft[field] as string) || '';
    if (!textToAnalyze) return;
    const dynamicQuestions = generateFollowUpDeepenings(currentPillar, textToAnalyze, language);
    setDeepenings(dynamicQuestions);
  };

  // Skip current question (clean audit trail: not answered / not collected, NOT DENIED)
  const handleSkipQuestion = () => {
    const questionUsed = activeQuestionText || t('anamnesisDepthInvestigationTitle');
    const stepId = `step-skip-${Date.now()}`;

    const newStepEntry: AnamnesisDialogueStep = {
      id: stepId,
      question: questionUsed,
      answer: t('anamnesisSkippedNotice'),
      pillar: currentPillar,
      timestamp: Date.now(),
      depthLevel: 1,
      status: 'NOT_STATED'
    };

    const updated = {
      ...draft,
      anamnesisDialogueSteps: [...(draft.anamnesisDialogueSteps || []), newStepEntry]
    };
    setDraft(updated);
    setSelectedOptions([]);
    setPatientQuote('');
    setDeepenings([]);
    setShowMustAdoptWarning(false);
  };

  // Check if a structured or standard option is currently selected/active
  const isOptionActive = (opt: StructuredOptionItem) => {
    const pillarSteps = (draft.anamnesisDialogueSteps || []).filter(s => s.pillar === currentPillar);
    if (pillarSteps.some(s => s.optionId === opt.id || s.answer.trim().toLowerCase() === opt.label.trim().toLowerCase())) {
      return true;
    }
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';
    const val = (draft[field] as string || '');
    if (!val) return false;
    const parts = val.split(',').map(s => s.trim().replace(/^[<>]\s*/, '').toLowerCase());
    return parts.includes(opt.label.trim().replace(/^[<>]\s*/, '').toLowerCase());
  };

  // Toggle option: if active -> deselect and remove from pillar and statements; if inactive -> select and insert
  const handleToggleOption = (opt: StructuredOptionItem) => {
    setShowMustAdoptWarning(false);
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';

    const active = isOptionActive(opt);

    if (active) {
      // Abwählen / Deselect: remove from steps & pillar text
      const updatedSteps = (draft.anamnesisDialogueSteps || []).filter(
        s => !(s.pillar === currentPillar && (s.optionId === opt.id || s.answer.trim().toLowerCase() === opt.label.trim().toLowerCase()))
      );
      const currentVal = (draft[field] as string || '');
      const parts = currentVal.split(',').map(s => s.trim()).filter(Boolean);
      const newParts = parts.filter(p => {
        const cleanP = p.replace(/^[<>]\s*/, '').toLowerCase();
        const cleanOpt = opt.label.replace(/^[<>]\s*/, '').toLowerCase();
        return cleanP !== cleanOpt;
      });
      const newText = newParts.join(', ');

      setDraft(prev => {
        const updated = {
          ...prev,
          [field]: newText,
          anamnesisDialogueSteps: updatedSteps
        };
        if (currentPillar === 'causa' && newParts.length === 0) {
          updated.causaEffect = '';
        }
        updated.text = buildSynthesizedSymptomText(updated);
        return updated;
      });

      // User modified selection -> must click 'Antwort übernehmen' to confirm updated state
      setAdoptedSteps(prev => {
        const next = new Set(prev);
        next.delete(currentStep);
        return next;
      });
    } else {
      // Auswählen / Select: add to steps & pillar text (stays active!)
      const stepId = `step-${currentPillar}-${opt.id || Date.now()}`;
      const questionUsed = activeQuestionText || t('anamnesisDepthInvestigationTitle');
      const newStepEntry: AnamnesisDialogueStep = {
        id: stepId,
        question: questionUsed,
        answer: opt.label,
        pillar: currentPillar,
        timestamp: Date.now(),
        depthLevel: 1,
        status: opt.statusCode || 'EXPLICIT',
        direction: opt.direction || (currentPillar === 'modalities' ? modalitySubTab : undefined),
        optionId: opt.id
      };
      const existingSteps = (draft.anamnesisDialogueSteps || []).filter(
        s => !(s.pillar === currentPillar && (s.optionId === opt.id || s.answer.trim().toLowerCase() === opt.label.trim().toLowerCase()))
      );
      const updatedSteps = [...existingSteps, newStepEntry];

      const currentVal = (draft[field] as string || '').trim();
      const parts = currentVal ? currentVal.split(',').map(s => s.trim()).filter(Boolean) : [];
      
      let itemLabel = opt.label;
      if (currentPillar === 'modalities') {
        const dir = opt.direction || modalitySubTab;
        if (dir === 'better' && !itemLabel.startsWith('>')) {
          itemLabel = `> ${itemLabel}`;
        } else if (dir === 'worse' && !itemLabel.startsWith('<')) {
          itemLabel = `< ${itemLabel}`;
        }
      }

      if (!parts.some(p => p.replace(/^[<>]\s*/, '').toLowerCase() === opt.label.replace(/^[<>]\s*/, '').toLowerCase())) {
        parts.push(itemLabel);
      }
      const newText = parts.join(', ');

      setDraft(prev => {
        const updated = {
          ...prev,
          [field]: newText,
          anamnesisDialogueSteps: updatedSteps
        };
        if (currentPillar === 'causa' && (opt.direction === 'worse' || opt.direction === 'better')) {
          updated.causaEffect = opt.direction;
        }
        updated.text = buildSynthesizedSymptomText(updated);
        return updated;
      });

      // User modified selection -> must click 'Antwort übernehmen' to confirm
      setAdoptedSteps(prev => {
        const next = new Set(prev);
        next.delete(currentStep);
        return next;
      });
    }
  };

  // Remove single dialogue step and clean up consolidated field
  const handleRemoveDialogueStep = (stepId: string) => {
    const stepToRemove = (draft.anamnesisDialogueSteps || []).find(s => s.id === stepId);
    const updatedSteps = (draft.anamnesisDialogueSteps || []).filter(s => s.id !== stepId);
    let updated = { ...draft, anamnesisDialogueSteps: updatedSteps };

    if (stepToRemove) {
      const field: keyof RepertoriumSymptomInput = 
        stepToRemove.pillar === 'causa' ? 'causaEvent' :
        stepToRemove.pillar === 'location' ? 'location' :
        stepToRemove.pillar === 'sensation' ? 'sensation' :
        stepToRemove.pillar === 'modalities' ? 'modalities' :
        stepToRemove.pillar === 'mind' ? 'mind' : 'concomitants';
      
      const currentVal = (draft[field] as string || '');
      const parts = currentVal.split(',').map(s => s.trim()).filter(Boolean);
      const newParts = parts.filter(p => {
        const cleanP = p.replace(/^[<>]\s*/, '').toLowerCase();
        const cleanAns = stepToRemove.answer.trim().replace(/^[<>]\s*/, '').toLowerCase();
        return cleanP !== cleanAns;
      });
      (updated as any)[field] = newParts.join(', ');
      if (stepToRemove.pillar === 'causa' && newParts.length === 0) {
        updated.causaEffect = '';
      }
    }

    updated.text = buildSynthesizedSymptomText(updated);
    setDraft(updated);

    // If removing dialogue step leaves the pillar empty, un-adopt
    const currentPillarSteps = updatedSteps.filter(s => s.pillar === currentPillar && s.status !== 'NOT_STATED');
    const field: keyof RepertoriumSymptomInput = 
      currentPillar === 'causa' ? 'causaEvent' :
      currentPillar === 'location' ? 'location' :
      currentPillar === 'sensation' ? 'sensation' :
      currentPillar === 'modalities' ? 'modalities' :
      currentPillar === 'mind' ? 'mind' : 'concomitants';
    if (currentPillarSteps.length === 0 && !(updated[field] as string || '').trim()) {
      setAdoptedSteps(prev => {
        const next = new Set(prev);
        next.delete(currentStep);
        return next;
      });
    }
  };

  // Finish and save complete anamnesis
  const handleFinishAndSave = () => {
    const finalDraft = { ...draft };
    finalDraft.text = buildSynthesizedSymptomText(finalDraft);
    onSave(finalDraft);
    onClose();
  };

  // Cancel button logic: if data was changed -> ask "Aenderungen speichern ja nein", then close; if not changed -> close immediately
  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  // "Speichern" in cancel confirmation -> save changes and close popup
  const handleConfirmCancelWithSave = () => {
    const finalDraft = { ...draft };
    finalDraft.text = buildSynthesizedSymptomText(finalDraft);
    onSave(finalDraft);
    setShowCancelConfirm(false);
    setShowDiscardConfirm(false);
    onClose();
  };

  // "Ja" in secondary discard confirmation -> discard changes and close popup
  const handleConfirmCancelWithoutSave = () => {
    setShowDiscardConfirm(false);
    setShowCancelConfirm(false);
    onClose();
  };

  // Stay in wizard (keep editing)
  const handleRejectCancel = () => {
    setShowCancelConfirm(false);
    setShowDiscardConfirm(false);
  };

  // Tab definitions: 7-Schritte-Modell (Hauptbeschwerde + 6 Fenster + Abschluss)
  const steps = [
    { idx: 0, label: t('anamnesisStepChief'), short: t('anamnesisStepChief'), hasData: !!draft.chiefComplaint },
    { idx: 1, label: t('anamnesisStepPillar1Short'), short: t('anamnesisPillarLocationShort'), hasData: !!draft.location },
    { idx: 2, label: t('anamnesisStepPillar2Short'), short: t('anamnesisPillarSensationShort'), hasData: !!draft.sensation },
    { idx: 3, label: t('anamnesisCausaTriggerTitle'), short: t('anamnesisCausaEventShort'), hasData: !!draft.causaEvent },
    { idx: 4, label: t('anamnesisModalitiesTitle'), short: t('anamnesisPillarModalitiesShort'), hasData: !!draft.modalities },
    { idx: 5, label: t('anamnesisConcomitantsTitle'), short: t('anamnesisPillarConcomitantsShort'), hasData: !!draft.concomitants },
    { idx: 6, label: t('anamnesisMindTitle'), short: t('anamnesisPillarMindShort'), hasData: !!draft.mind },
    { idx: 7, label: t('anamnesisStepReviewAndDeepen'), short: t('anamnesisStepReviewAndConclusion'), hasData: !!(draft.location && draft.sensation && draft.modalities && draft.concomitants) },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[92vh] max-h-[880px] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-600/70 border border-teal-400/40 flex items-center justify-center font-bold text-sm shadow-inner">
              <Sparkles className="w-4 h-4 text-teal-200" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>{t('anamnesisWizardTitle')}</span>
              </h2>
              <p className="text-[11px] sm:text-xs text-teal-200/90 truncate max-w-[260px] sm:max-w-xl">
                {t('anamnesisWizardSubtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-3 py-1.5 text-xs text-teal-100 hover:text-white hover:bg-white/10 rounded-xl transition-all flex items-center gap-1.5 border border-teal-400/30 cursor-pointer"
            >
              <X className="w-3.5 h-3.5 text-rose-300" />
              <span>{t('anamnesisNavCancel')}</span>
            </button>
          </div>
        </div>

        {/* WIZARD STEPPER NAVIGATION BAR */}
        <div className="bg-slate-100 border-b border-slate-200 px-3 sm:px-6 py-2 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-max">
            {steps.map((step) => {
              const isActive = currentStep === step.idx;
              return (
                <button
                  key={step.idx}
                  type="button"
                  onClick={() => {
                    if (step.idx > 0 && !draft.chiefComplaint && !step0Input.trim()) {
                      return;
                    }
                    if (canAdopt && currentStep > 0) {
                      handleAdoptAnswer();
                    }
                    setShowMustAdoptWarning(false);
                    setCurrentStep(step.idx);
                    setSelectedQuestionId('');
                    setSelectedOptions([]);
                    setPatientQuote('');
                    setCustomQuestion('');
                    setAdditionalQuestions([]);
                    setDeepenings([]);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-teal-700 text-white shadow-xs'
                      : step.hasData
                      ? 'bg-white text-teal-900 border border-teal-200 hover:bg-teal-50/70'
                      : 'bg-slate-200/70 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-white text-teal-800' : step.hasData ? 'bg-teal-100 text-teal-800' : 'bg-slate-300 text-slate-700'
                  }`}>
                    {step.hasData ? <Check className="w-2.5 h-2.5" /> : step.idx}
                  </span>
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MUST ADOPT WARNING BANNER */}
        {showMustAdoptWarning && (
          <div className="bg-amber-50 border-b border-amber-300 px-4 sm:px-6 py-2 flex items-center justify-between gap-2 text-amber-900 text-xs font-semibold animate-in fade-in duration-150 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('anamnesisMustAdoptAnswerNotice')}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowMustAdoptWarning(false)}
              className="text-amber-700 hover:text-amber-900 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* MODAL BODY (PAGE-BY-PAGE VIEW) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* STEP 0: EINSTIEG (Freie Hauptbeschwerde) */}
          {currentStep === 0 && (
            <div className="max-w-2xl mx-auto py-6 space-y-6 animate-in fade-in duration-150">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto shadow-xs">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">
                  &bdquo;{t('anamnesisOpeningQuestion')}&ldquo;
                </h3>
                <p className="text-xs text-slate-500 max-w-lg mx-auto">
                  {t('anamnesisModelSubtitle')}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 block">
                    {t('anamnesisOriginalQuoteTitle')}
                  </label>
                  <button
                    type="button"
                    onClick={toggleStep0Speech}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isStep0Recording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                    }`}
                    title={isStep0Recording ? t('chiefComplaintListening') : t('chiefComplaintVoiceBtn')}
                  >
                    {isStep0Recording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isStep0Recording ? t('chiefComplaintListening') : t('chiefComplaintVoiceBtn')}</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    rows={4}
                    value={step0Input}
                    onChange={(e) => {
                      setStep0Input(e.target.value);
                      setSelectedPrimaryComplaint(null);
                    }}
                    placeholder={t('anamnesisOpeningPlaceholder')}
                    className="w-full px-4 py-3 text-sm bg-slate-50/70 rounded-xl border border-slate-300 focus:bg-white focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none font-medium leading-relaxed shadow-inner"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleStep0Next();
                      }
                    }}
                  />
                </div>

                {/* Multiple Complaints Disambiguation / Clarification Card */}
                {step0Input.trim() && step0Analysis.hasMultipleComplaints && step0Analysis.detectedComplaints.length > 1 && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border-2 border-amber-300 space-y-2.5 shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{t('chiefComplaintMultipleDetectedTitle')}</span>
                    </div>
                    <p className="text-xs text-amber-950 leading-relaxed font-medium">
                      {t('chiefComplaintMultipleDetectedPrompt')}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                      {step0Analysis.detectedComplaints.map((complaint, idx) => {
                        const isSelected = selectedPrimaryComplaint === complaint;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSelectedPrimaryComplaint(complaint);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400'
                                : 'bg-white text-slate-800 border-amber-200 hover:bg-amber-100/70 hover:border-amber-400'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            <span>{complaint}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-amber-700/70 px-1.5 py-0.5 rounded text-amber-100">
                                {t('chiefComplaintSelectPrimaryBadge')}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setSelectedPrimaryComplaint(null)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                          selectedPrimaryComplaint === null
                            ? 'bg-slate-700 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{t('chiefComplaintKeepCombinedOption')}</span>
                      </button>
                    </div>

                    {selectedPrimaryComplaint && (
                      <p className="text-[11px] text-amber-900 font-medium pt-0.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{t('chiefComplaintOtherAsConcomitants')}</span>
                      </p>
                    )}
                  </div>
                )}

                {/* Domain verification badge */}
                {step0Input.trim() && step0Analysis.isRecognized && step0Analysis.organDomain && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t('chiefComplaintVerified')}: <strong className="text-emerald-800 font-bold">{step0Analysis.organDomain}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {t('repertoriumClearAuditNotice')}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={!step0Input.trim()}
                  onClick={handleStep0Next}
                  className="py-2.5 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold text-sm flex items-center gap-2 shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <span>{t('anamnesisNavNext')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 TO 6: DIE SÄULEN NACH HAHNEMANN & BÖNNINGHAUSEN */}
          {currentStep >= 1 && currentStep <= 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              
              {/* PILLAR CARD HEADER */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                    currentPillar === 'location' ? 'bg-sky-600' :
                    currentPillar === 'sensation' ? 'bg-amber-600' :
                    currentPillar === 'causa' ? 'bg-indigo-600' :
                    currentPillar === 'modalities' ? 'bg-emerald-600' :
                    currentPillar === 'concomitants' ? 'bg-purple-600' : 'bg-rose-600'
                  }`}>
                    {currentPillar === 'location' && <MapPin className="w-4 h-4" />}
                    {currentPillar === 'sensation' && <Flame className="w-4 h-4" />}
                    {currentPillar === 'causa' && <Zap className="w-4 h-4" />}
                    {currentPillar === 'modalities' && <Sliders className="w-4 h-4" />}
                    {currentPillar === 'concomitants' && <Award className="w-4 h-4" />}
                    {currentPillar === 'mind' && <Heart className="w-4 h-4" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900">
                      {currentPillar === 'location' && t('anamnesisStepPillar1Short')}
                      {currentPillar === 'sensation' && t('anamnesisStepPillar2Short')}
                      {currentPillar === 'causa' && t('anamnesisCausaTriggerTitle')}
                      {currentPillar === 'modalities' && t('anamnesisModalitiesTitle')}
                      {currentPillar === 'concomitants' && t('anamnesisConcomitantsTitle')}
                      {currentPillar === 'mind' && t('anamnesisMindTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {draft.chiefComplaint ? `${t('anamnesisStartingPointLabel')}: „${draft.chiefComplaint}“` : ''}
                    </p>
                  </div>
                </div>

                {/* Current Content Badge */}
                <div className="text-right">
                  {currentPillar === 'location' && draft.location && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-100 text-sky-800 border border-sky-200">
                      {draft.location}
                    </span>
                  )}
                  {currentPillar === 'sensation' && draft.sensation && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                      {draft.sensation}
                    </span>
                  )}
                  {currentPillar === 'causa' && draft.causaEvent && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {draft.causaEvent}
                    </span>
                  )}
                  {currentPillar === 'modalities' && draft.modalities && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {draft.modalities}
                    </span>
                  )}
                  {currentPillar === 'concomitants' && draft.concomitants && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 border border-purple-200">
                      {draft.concomitants}
                    </span>
                  )}
                  {currentPillar === 'mind' && draft.mind && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200">
                      {draft.mind}
                    </span>
                  )}
                </div>
              </div>

              {/* Step 4 Sub-Tabs: Besser (>) vs. Schlechter (<) */}
              {currentStep === 4 && (
                <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setModalitySubTab('better');
                      setSelectedQuestionId('');
                      setCustomQuestion('');
                      setAdditionalQuestions([]);
                      setSelectedOptions([]);
                      setPatientQuote('');
                      setDeepenings([]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalitySubTab === 'better'
                        ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      &gt;
                    </span>
                    <span>{t('anamnesisModalitiesBetterTab')}</span>
                    {draft.modalities && draft.modalities.includes('>') && (
                      <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalitySubTab('worse');
                      setSelectedQuestionId('');
                      setCustomQuestion('');
                      setAdditionalQuestions([]);
                      setSelectedOptions([]);
                      setPatientQuote('');
                      setDeepenings([]);
                    }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalitySubTab === 'worse'
                        ? 'bg-rose-700 text-white shadow-xs ring-2 ring-rose-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
                      &lt;
                    </span>
                    <span>{t('anamnesisModalitiesWorseTab')}</span>
                    {draft.modalities && (draft.modalities.includes('<') || draft.modalities.toLowerCase().includes('schlechter') || draft.modalities.toLowerCase().includes('worse')) && (
                      <span className="w-2 h-2 rounded-full bg-rose-300"></span>
                    )}
                  </button>
                </div>
              )}

              {/* DYNAMISCHE KI-BEDARFSANALYSE DER PATIENTENANGABEN */}
              {needsAnalysis.missingNeeds.length > 0 ? (
                <div className="p-3 bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 text-white rounded-xl border border-teal-500/40 shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-teal-300">
                      <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                      <span>{t('anamnesisNeedsTitle')}</span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                      {needsAnalysis.missingNeeds.length} {t('anamnesisNeedsMissingTitle')}
                    </span>
                  </div>
                  {needsAnalysis.highestPriorityNeed && (
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                      <div className="space-y-0.5">
                        <span className="text-[10.5px] font-medium text-teal-200 block">
                          {needsAnalysis.highestPriorityNeed.title}
                        </span>
                        <p className="text-xs text-slate-200 italic">
                          &bdquo;{needsAnalysis.nextRecommendedQuestionText}&ldquo;
                        </p>
                      </div>
                      {needsAnalysis.highestPriorityNeed.pillar !== currentPillar && (
                        <button
                          type="button"
                          onClick={() => {
                            const targetPillar = needsAnalysis.highestPriorityNeed!.pillar;
                            const targetStep = 
                              targetPillar === 'location' ? 1 :
                              targetPillar === 'sensation' ? 2 :
                              targetPillar === 'causa' ? 3 :
                              targetPillar === 'modalities' ? 4 :
                              targetPillar === 'concomitants' ? 5 : 6;
                            setCurrentStep(targetStep);
                            setSelectedQuestionId('');
                            setPatientQuote('');
                            setSelectedOptions([]);
                            setDeepenings([]);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                        >
                          <span>{t('anamnesisNeedsAdoptQuestionBtn')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 bg-emerald-50/90 border border-emerald-200 text-emerald-950 rounded-xl flex items-center justify-between gap-2 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{t('repertoriumAllPillarsAuditNotice')}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                    {t('repertoriumStatusComplete')}
                  </span>
                </div>
              )}

              {/* ACTIVE QUESTION BANNER */}
              <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/90 flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-700 shrink-0" />
                    <span className="text-xs font-bold text-teal-950 uppercase tracking-wide">
                      {t('anamnesisDepthInvestigationTitle')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 pl-6 leading-snug">
                    &bdquo;{activeQuestionText}&ldquo;
                  </p>

                  {/* Alternative suggested questions selector for current pillar */}
                  {suggestedQuestions.length > 1 && !isCustomQuestionMode && (
                    <div className="pl-6 pt-1 flex flex-wrap items-center gap-1.5">
                      {suggestedQuestions.map((q) => {
                        const isCurrent = (activeQuestionItem && activeQuestionItem.id === q.id);
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => {
                              setSelectedQuestionId(q.id);
                              setCustomQuestion('');
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-teal-700 text-white shadow-xs'
                                : 'bg-white/80 hover:bg-white text-teal-900 border border-teal-300/80'
                            }`}
                          >
                            {q.pillarLabel}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomQuestionMode(!isCustomQuestionMode)}
                  className="text-xs text-teal-800 hover:text-teal-950 font-semibold underline cursor-pointer shrink-0"
                >
                  {isCustomQuestionMode ? t('geniusClose') : t('anamnesisActionCustomQuestion')}
                </button>
              </div>

              {/* CUSTOM QUESTION INPUT WITH SEMANTIC AI ANALYSIS (MULTIPLE QUESTIONS SUPPORT) */}
              {isCustomQuestionMode && (
                <div className="p-4 rounded-xl bg-white border border-teal-300 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-teal-700" />
                      <span>{t('anamnesisCustomQuestionLabel')}</span>
                    </label>
                    <span className="text-[11px] font-semibold text-teal-700">
                      {1 + additionalQuestions.length} {t('anamnesisAddedQuestionsCount')}
                    </span>
                  </div>

                  {/* Primary Therapist Question */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span>{t('anamnesisCustomQuestionNumber', { num: 1 })}</span>
                    </div>
                    <input
                      type="text"
                      value={customQuestion}
                      onChange={(e) => setCustomQuestion(e.target.value)}
                      placeholder={t('anamnesisCustomQuestionPlaceholder')}
                      className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:border-teal-600 text-slate-900 outline-none"
                    />
                  </div>

                  {/* Additional Therapist Questions */}
                  {additionalQuestions.map((addQ, qIdx) => (
                    <div key={qIdx} className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{t('anamnesisCustomQuestionNumber', { number: qIdx + 2 })}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAdditionalQuestions(prev => prev.filter((_, i) => i !== qIdx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition-colors"
                          title={t('anamnesisDeleteStep')}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={addQ}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAdditionalQuestions(prev => prev.map((item, i) => i === qIdx ? val : item));
                        }}
                        placeholder={t('anamnesisCustomQuestionPlaceholder')}
                        className="w-full px-3 py-2 text-xs bg-slate-50 rounded-lg border border-slate-300 focus:bg-white focus:border-teal-600 text-slate-900 outline-none"
                      />
                    </div>
                  ))}

                  {/* Button to add another therapist question */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setAdditionalQuestions(prev => [...prev, ''])}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-dashed border-teal-400 text-teal-800 hover:bg-teal-50 flex items-center gap-1.5 font-semibold cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>{t('anamnesisAddAnotherQuestionBtn')}</span>
                    </button>
                  </div>

                  {questionAnalysis && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <span>{t('anamnesisCustomQuestionAnalysisTitle')}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                        <div>
                          <span className="text-slate-500">{t('anamnesisQuestionTarget')}: </span>
                          <span className="font-semibold text-slate-800">{questionAnalysis.target}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t('anamnesisQuestionSuggestivity')}: </span>
                          <span className={`font-semibold ${
                            questionAnalysis.suggestivity === 'high' ? 'text-rose-700' :
                            questionAnalysis.suggestivity === 'medium' ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            {questionAnalysis.suggestivity === 'high' ? t('anamnesisQuestionSuggestivityHigh') :
                             questionAnalysis.suggestivity === 'medium' ? t('anamnesisQuestionSuggestivityMedium') : t('anamnesisQuestionSuggestivityLow')}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">{t('anamnesisQuestionRepertoryRelevance')}: </span>
                          <span className="font-semibold text-teal-800">
                            {questionAnalysis.repertoryRelevance === 'likely' ? t('anamnesisRelevanceLikely') :
                             questionAnalysis.repertoryRelevance === 'possible' ? t('anamnesisRelevancePossible') : t('anamnesisRelevanceUnclear')}
                          </span>
                        </div>
                      </div>
                      {questionAnalysis.suggestivityAdvice && (
                        <p className="text-[11px] text-amber-800 font-medium bg-amber-50 p-2 rounded border border-amber-200 mt-1">
                          {t('anamnesisQuestionSuggestivityAdvice')} {questionAnalysis.suggestivityAdvice}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* VOLLBREITES ANTWORT-DROPDOWN-OVERLAY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-teal-700" />
                    <span>{t('anamnesisFullWidthOverlayTitle')}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setIsOverlayOpen(!isOverlayOpen)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isOverlayOpen ? t('anamnesisHideAnswerBtn') : t('anamnesisSelectAnswerBtn')}</span>
                    {isOverlayOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {isOverlayOpen && (
                  <div className="w-full bg-slate-50/90 border border-teal-200 rounded-2xl p-4 sm:p-5 shadow-inner space-y-4">
                    
                    {/* SECTION 1: Mögliche strukturierte Antworten */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700 block">
                        {t('anamnesisPossibleAnswers')}
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {structuredOptions.map((opt) => {
                          const isSelected = isOptionActive(opt);
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleToggleOption(opt)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-800 shadow-xs ring-2 ring-teal-500/40'
                                  : 'bg-white text-slate-800 border-slate-300 hover:border-teal-400 hover:bg-teal-50/60'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-200" />}
                              <span>{opt.label}</span>
                              {opt.direction === 'worse' && <span className={`ml-0.5 font-bold ${isSelected ? 'text-rose-200' : 'text-rose-600'}`}>&lt;</span>}
                              {opt.direction === 'better' && <span className={`ml-0.5 font-bold ${isSelected ? 'text-emerald-200' : 'text-emerald-600'}`}>&gt;</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STANDARD OPTIONS (Weiß nicht, Nicht beobachtet, etc.) */}
                    <div className="pt-1 flex flex-wrap gap-1.5">
                      {standardOptions.map((std) => {
                        const isSelected = isOptionActive(std);
                        return (
                          <button
                            key={std.id}
                            type="button"
                            onClick={() => handleToggleOption(std)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer flex items-center gap-1 ${
                              isSelected
                                ? 'bg-slate-800 text-white border-slate-900 shadow-xs ring-1 ring-slate-700'
                                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 text-slate-200" />}
                            <span>{std.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* CAUSA TEMPORAL & EFFECT FIELDS (If Causa step) */}
                    {currentPillar === 'causa' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {t('symptomCausaTemporalLabel')}
                          </label>
                          <input
                            type="text"
                            value={causaTemporalInput}
                            onChange={(e) => setCausaTemporalInput(e.target.value)}
                            placeholder={t('symptomCausaTemporalPlaceholder')}
                            className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-300 text-slate-900 outline-none"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">
                            {t('symptomCausaEffectLabel')}
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setCausaEffectState(causaEffectState === 'worse' ? '' : 'worse')}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                                causaEffectState === 'worse' ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              &lt; {t('repertoriumCausaEffectWorse')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setCausaEffectState(causaEffectState === 'better' ? '' : 'better')}
                              className={`text-xs px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                                causaEffectState === 'better' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white text-slate-600 border-slate-200'
                              }`}
                            >
                              &gt; {t('repertoriumCausaEffectBetter')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* SECTION 2: Originalaussage des Patienten (Freitext) */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-amber-600" />
                          <span>{t('anamnesisOriginalQuoteTitle')}</span>
                        </label>
                        <span className="text-[10px] text-amber-900 font-medium italic">
                          {t('anamnesisPriorityOverSelection')}
                        </span>
                      </div>
                      <textarea
                        rows={2}
                        value={patientQuote}
                        onChange={(e) => setPatientQuote(e.target.value)}
                        placeholder={t('anamnesisOriginalQuotePlaceholder')}
                        className="w-full px-3.5 py-2.5 text-xs bg-white rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-500 text-slate-900 outline-none font-medium leading-relaxed resize-none shadow-xs"
                      />
                    </div>

                    {/* SECTION 3: Live KI-Analyse der Aussage */}
                    {(patientQuote.trim() || selectedOptions.length > 0) && (
                      <div className="p-3 rounded-xl bg-white border border-teal-200 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-teal-950 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                            <span>{t('anamnesisAiAnalysisTitle')}</span>
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            aiAnalysis.certainty === 'high' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {aiAnalysis.certainty === 'high' ? t('anamnesisAiCertaintyHigh') : t('anamnesisAiCertaintyMedium')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                          <div>
                            <span className="text-slate-400 block">{t('anamnesisAiDomain')}</span>
                            <span className="font-semibold text-slate-800">{aiAnalysis.informationDomain}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{t('anamnesisAiTrigger')}</span>
                            <span className="font-semibold text-slate-800">{aiAnalysis.triggerOrQuality}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{t('anamnesisAiDirection')}</span>
                            <span className={`font-semibold ${
                              aiAnalysis.direction === 'worse' ? 'text-rose-700' :
                              aiAnalysis.direction === 'better' ? 'text-emerald-700' : 'text-slate-700'
                            }`}>
                              {aiAnalysis.direction === 'worse' ? t('anamnesisDirectionWorse') :
                               aiAnalysis.direction === 'better' ? t('anamnesisDirectionBetter') : t('anamnesisDirectionNeutral')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">{t('anamnesisAiStatus')}</span>
                            <span className="font-semibold text-teal-900">
                              {aiAnalysis.status === 'explicit' ? t('anamnesisStatusExplicit') :
                               aiAnalysis.status === 'unknown' ? t('anamnesisStatusUnknown') :
                               aiAnalysis.status === 'not_observed' ? t('anamnesisStatusNotObserved') :
                               aiAnalysis.status === 'not_stated' ? t('anamnesisStatusNotStated') : t('anamnesisStatusDenied')}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-teal-800 bg-teal-50/70 p-2 rounded-lg border border-teal-100 leading-snug">
                          {aiAnalysis.noGeneralizationNotice}
                        </p>
                      </div>
                    )}

                    {/* SECTION 4: DYNAMISCHE VERTIEFUNGSFRAGEN (falls angefordert) */}
                    {deepenings.length > 0 && (
                      <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-200 space-y-2">
                        <span className="text-xs font-bold text-teal-950 block">
                          {t('anamnesisTargetedDeepeningsTitle')}
                        </span>
                        <div className="space-y-1">
                          {deepenings.map((deepQ, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCustomQuestion(deepQ);
                                setIsCustomQuestionMode(true);
                              }}
                              className="w-full text-left p-2 rounded-lg bg-white border border-teal-200 text-xs text-slate-800 hover:bg-teal-100/50 flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <CornerDownRight className="w-3 h-3 text-teal-600 shrink-0" />
                              <span>&bdquo;{deepQ}&ldquo;</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 5: AKTIONEN IM OVERLAY */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleDeepen}
                          disabled={!canAdopt}
                          className="px-3 py-1.5 rounded-xl border border-teal-300 text-teal-800 hover:bg-teal-100/60 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                          <span>{t('anamnesisActionDeepen')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSkipQuestion}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium cursor-pointer"
                        >
                          <span>{t('anamnesisActionSkip')}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleAdoptAnswer}
                        disabled={!canAdopt}
                        className={`py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                          isCurrentStepAdopted
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-teal-700 hover:bg-teal-800 text-white disabled:opacity-40 disabled:cursor-not-allowed'
                        }`}
                      >
                        {isCurrentStepAdopted ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                        <span>{t('anamnesisActionAdoptAnswer')}</span>
                        {isCurrentStepAdopted && (
                          <span className="ml-1 text-[10px] bg-emerald-800/90 px-1.5 py-0.5 rounded font-medium">
                            ✓ {t('anamnesisAdoptedSuccess')}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* BEREITS ERFASSTE DIALOGSCHRITTE DIESER SÄULE */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('anamnesisRecordedStatementsTitle')}:
                </label>
                {(() => {
                  const pillarSteps = (draft.anamnesisDialogueSteps || []).filter(s => s.pillar === currentPillar);
                  if (pillarSteps.length === 0) {
                    return (
                      <p className="text-xs text-slate-400 italic py-1">
                        {t('anamnesisPillarEmptyNotice')}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-1.5">
                      {pillarSteps.map((st) => (
                        <div key={st.id} className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-slate-500 font-medium block text-[11px]">&bdquo;{st.question}&ldquo;</span>
                            <span className="font-semibold text-slate-900 block mt-0.5">
                              <Quote className="w-3 h-3 text-amber-600 inline mr-1" />
                              &bdquo;{st.answer}&ldquo;
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDialogueStep(st.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                            title={t('anamnesisDeleteStep')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>
          )}

          {/* STEP 7: ADAPTIVE SYNTHESE, 6-SÄULEN-REVIEW & ABSCHLUSS */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-800 to-emerald-850 text-white shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-teal-200">
                    <Sparkles className="w-5 h-5 text-teal-200" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {t('anamnesisReviewDeepeningTitle')}
                    </h3>
                    <p className="text-xs text-teal-100/80">
                      {t('anamnesisReviewDeepeningSubtitle')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overview cards of Chief Complaint + 6 Pillars */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-700" />
                  <span>{t('anamnesisModelTitle')}</span>
                </h4>

                {/* Ausgangspunkt / Hauptbeschwerde */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-teal-700" />
                      {t('anamnesisStepChief')} ({t('anamnesisChiefComplaintDescription')})
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(0)}
                      className="text-[10.5px] font-semibold text-teal-700 hover:text-teal-900 cursor-pointer"
                    >
                      {t('anamnesisEditInWizard')}
                    </button>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {draft.chiefComplaint || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Säule 1 - WO */}
                  <div className="p-3 rounded-xl border border-sky-200 bg-sky-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-950 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-sky-600" />
                        {t('anamnesisStepPillar1Short')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-[10.5px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.location || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.locationQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.locationQuote}&ldquo;</p>
                    )}
                  </div>

                  {/* Säule 2 - WAS */}
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                        {t('anamnesisStepPillar2Short')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-[10.5px] font-semibold text-amber-700 hover:text-amber-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.sensation || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.sensationQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.sensationQuote}&ldquo;</p>
                    )}
                  </div>

                  {/* Säule 3 - WODURCH (Causa & Auslöser) */}
                  <div className="p-3 rounded-xl border border-indigo-200 bg-indigo-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-indigo-600" />
                        {t('anamnesisCausaTriggerTitle')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-[10.5px] font-semibold text-indigo-700 hover:text-indigo-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.causaEvent || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.causaTemporal && (
                      <p className="text-[11px] text-slate-600 font-medium">{t('symptomCausaTemporalLabel')}: {draft.causaTemporal}</p>
                    )}
                    {draft.causaQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.causaQuote}&ldquo;</p>
                    )}
                  </div>

                  {/* Säule 4 - WANN (Modalitäten: Besser > / Schlechter <) */}
                  <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                        {t('anamnesisModalitiesTitle')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(4)}
                        className="text-[10.5px] font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.modalities || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.modalitiesQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.modalitiesQuote}&ldquo;</p>
                    )}
                  </div>

                  {/* Säule 5 - WAS NOCH (Körperliche Begleitsymptome) */}
                  <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-950 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        {t('anamnesisConcomitantsTitle')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="text-[10.5px] font-semibold text-purple-700 hover:text-purple-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.concomitants || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.concomitantsQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.concomitantsQuote}&ldquo;</p>
                    )}
                  </div>

                  {/* Säule 6 - GEMÜT (Gemüt & Psyche) */}
                  <div className="p-3 rounded-xl border border-rose-200 bg-rose-50/40 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-rose-950 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-600" />
                        {t('anamnesisMindTitle')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(6)}
                        className="text-[10.5px] font-semibold text-rose-700 hover:text-rose-900 cursor-pointer"
                      >
                        {t('anamnesisEditInWizard')}
                      </button>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {draft.mind || <span className="italic text-slate-400 font-normal">{t('anamnesisPillarEmptyNotice')}</span>}
                    </p>
                    {draft.mindQuote && (
                      <p className="text-[11px] text-amber-800 italic">&bdquo;{draft.mindQuote}&ldquo;</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Prominent finish button */}
              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleFinishAndSave}
                  className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{t('anamnesisNavFinish')}</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* MODAL FOOTER NAVIGATION */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4 text-rose-500" />
              <span>{t('anamnesisNavCancel')}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowMustAdoptWarning(false);
                  setCurrentStep(currentStep - 1);
                  setSelectedQuestionId('');
                  setSelectedOptions([]);
                  setPatientQuote('');
                  setCustomQuestion('');
                  setAdditionalQuestions([]);
                  setDeepenings([]);
                }}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('anamnesisNavBack')}</span>
              </button>
            )}

            {currentStep < 7 ? (
              <div className="inline-flex">
                <button
                  type="button"
                  disabled={currentStep === 0 && !step0Input.trim() && !draft.chiefComplaint}
                  onClick={() => {
                    if (currentStep === 0) {
                      handleStep0Next();
                      return;
                    }
                    if (canAdopt) {
                      handleAdoptAnswer();
                    }
                    setShowMustAdoptWarning(false);
                    setCurrentStep(currentStep + 1);
                    setSelectedQuestionId('');
                    setSelectedOptions([]);
                    setPatientQuote('');
                    setCustomQuestion('');
                    setAdditionalQuestions([]);
                    setDeepenings([]);
                  }}
                  className={`py-2 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                    currentStep > 0 || step0Input.trim() || draft.chiefComplaint
                      ? 'bg-teal-700 hover:bg-teal-800 text-white cursor-pointer'
                      : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>{currentStep === 6 ? t('anamnesisStepReviewAndDeepen') : t('anamnesisNavNext')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFinishAndSave}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Check className="w-4 h-4" />
                <span>{t('anamnesisNavFinish')}</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* ABBRUCH-BESTÄTIGUNGSDIALOG */}
      {showCancelConfirm && !showDiscardConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {t('anamnesisCancelModalTitle')}
                </h4>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {t('anamnesisCancelModalQuestion')}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              {t('anamnesisCancelModalInfo')}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={handleRejectCancel}
                className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-semibold cursor-pointer transition-colors"
              >
                {t('anamnesisCancelModalStay')}
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(true)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 text-slate-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  {t('anamnesisCancelModalReject')}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelWithSave}
                  className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t('anamnesisCancelModalConfirm')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KONTROLLFRAGE BEI OHNE SPEICHERUNG */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {t('anamnesisDiscardConfirmTitle')}
                </h4>
                <p className="text-xs font-medium text-slate-600 mt-0.5">
                  {t('anamnesisDiscardConfirmQuestion')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                {t('anamnesisDiscardConfirmCancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelWithoutSave}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer shadow-xs transition-colors"
              >
                {t('anamnesisDiscardConfirmYes')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
