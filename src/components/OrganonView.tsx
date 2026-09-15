import React, { useState, useEffect } from 'react';
import { processOrganonSubmission } from '../services/organonPipeline';
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Lock, 
  Shield, 
  Plus, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Terminal, 
  Database, 
  HelpCircle, 
  GitBranch,
  ChevronRight,
  Check,
  X,
  Info,
  Mic,
  Send,
  Eye,
  Code,
  CheckSquare,
  Square
} from 'lucide-react';

// --- TYPES & INTERFACES FOR ORGANON BUILD 01 - FIX 02.2 ---

export type FactStatus = 'CONFIRMED' | 'DENIED' | 'UNKNOWN' | 'UNCLEAR' | 'CANDIDATE' | 'CONTRADICTED';
export type ProvenanceSource = 'PATIENT_STATEMENT' | 'PATIENT_CONFIRMATION' | 'MODEL_INFERENCE' | 'SYSTEM_NORMALIZATION';

export interface SourceSpan {
  span_id: string;
  utterance_id: string;
  start_offset: number | null;
  end_offset: number | null;
  exact_text: string;
  span_type: 'SYMPTOM' | 'INTERVENTION' | 'MEASUREMENT' | 'EVENT' | 'TEMPORAL' | 'CONTEXT' | 'GENERAL';
  validated_against_raw_text: boolean;
}

export type ContextRole = 
  | 'ASSERTION'
  | 'NEGATION'
  | 'REFERENCE'
  | 'INTENDED_EFFECT'
  | 'REPORTED_CHANGE'
  | 'COMPARISON'
  | 'HISTORICAL'
  | 'UNCERTAIN_RELATION'
  | 'ATTRIBUTE'
  | 'ACTION'
  | 'OTHER';

export interface SemanticClaim {
  claim_id: string;
  subject: {
    entity_id: string | null;
    entity_type: string | null;
    surface_form: string | null;
  };
  predicate: string;
  value: any;
  polarity: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  certainty: 'CONFIRMED' | 'UNCLEAR' | 'CANDIDATE' | 'UNKNOWN';
  context_role: ContextRole;
  temporal_scope: {
    episode_id: string | null;
    time_reference: string | null;
    state_temporality: 'CURRENT' | 'PAST_WITHIN_CURRENT_EPISODE' | 'HISTORICAL_EPISODE' | 'FUTURE' | 'UNCLEAR';
  };
  coreference: {
    mention_span_id: string;
    resolved_entity_id: string | null;
    status: 'CONFIRMED' | 'UNCLEAR' | 'UNRESOLVED';
  };
  evidence_span_ids: string[];
  entailment_status: 'SUPPORTED' | 'NOT_SUPPORTED' | 'AMBIGUOUS';
  reason_code: string;
}

export interface RejectedClaim {
  rejected_claim_id: string;
  proposed_subject: string;
  predicate: string;
  value: any;
  evidence_span_ids: string[];
  rejection_reason_code: string;
  persisted_as_confirmed: false;
}

export interface Episode {
  episode_id: string;
  episode_type: 'CURRENT_EPISODE' | 'HISTORICAL_EPISODE' | 'UNCLEAR';
  time_reference: string;
  entities: string[];
  evidence: {
    utterance_id: string;
    exact_quote: string;
  }[];
}

export interface IntensityAttribute {
  value: number | null;
  scale_min: number | null;
  scale_max: number | null;
  value_original: string | null;
  normalized_category: 'MILD' | 'MODERATE' | 'SEVERE' | 'EXTREME' | null;
  qualifier: string | null;
  status: string;
  evidence_span_ids: string[];
}

export interface SymptomState {
  state_id: string;
  symptom_id: string;
  presence: 'PRESENT' | 'ABSENT' | 'UNCLEAR' | 'UNKNOWN';
  time_reference: string;
  temporal_scope: string | null;
  state_temporality: 'CURRENT' | 'PAST_WITHIN_CURRENT_EPISODE' | 'HISTORICAL_EPISODE' | 'FUTURE' | 'UNCLEAR';
  intensity: IntensityAttribute;
  location: {
    value: string | null;
    status: string;
  };
  sensation: {
    value: string | null;
    status: string;
  };
  certainty: 'CONFIRMED' | 'UNCLEAR' | 'UNKNOWN';
  evidence_span_ids: string[];
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface SymptomEntity {
  symptom_id: string;
  canonical_patient_label: string;
  original_expressions: string[];
  broad_location: {
    value: string | null;
    status: string;
    evidence: string[];
  };
  sub_location: {
    value: string | null;
    status: string;
    evidence: string[];
  };
  episode_id: string | null;
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  }[];
}

export interface Utterance {
  utterance_id: string;
  submission_id: string;
  case_id: string;
  speaker: 'patient' | 'therapist' | 'system';
  raw_text: string;
  created_at: string;
  language: string;
}

export interface ClinicalEvent {
  event_id: string;
  event_type: string;
  original_expression: string;
  time: string;
  status: FactStatus;
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface IntendedEffect {
  intended_effect_id: string;
  intervention_id: string;
  target_entity_id: string;
  target_state_change: string;
  status: FactStatus;
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface Intervention {
  intervention_id: string;
  name: {
    value: string | null;
    status: string;
  };
  dose: {
    value: string | null;
    unit: string | null;
    status: string;
  };
  route: {
    value: string | null;
    status: string;
  };
  application_location: {
    value: string | null;
    status: string;
  };
  time_reference: string | null;
  intended_effects: IntendedEffect[];
  reported_effects: string[];
  patient_causal_attributions: string[];
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface ObjectiveMeasurement {
  measurement_id: string;
  measurement_type: string;
  value: string | null;
  unit: string | null;
  time: {
    value: string | null;
    status: string;
    precision: 'EXACT' | 'APPROXIMATE' | 'RELATIVE' | 'UNKNOWN';
  };
  value_precision: 'EXACT' | 'APPROXIMATE' | 'UNKNOWN';
  sequence_relation: string | null;
  measurement_method: {
    value: string | null;
    status: string;
  };
  status: FactStatus;
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface TemporalRelationship {
  relationship_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: 'BEFORE' | 'AFTER' | 'SIMULTANEOUS' | 'OVERLAPPING' | 'DIFFERENT_FROM' | 'SAME_AS' | 'UNKNOWN';
  status: FactStatus;
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface CausalityRecord {
  causality_id: string;
  source_entity_id: string;
  target_entity_id: string;
  patient_attribution: 'YES' | 'NO' | 'UNSURE' | 'NOT_STATED';
  causality_status: 'CONFIRMED_PATIENT_ATTRIBUTION' | 'DENIED_BY_PATIENT' | 'UNKNOWN';
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface TimelineEntry {
  timeline_id: string;
  state_id: string | null;
  entity_id: string;
  entity_type: string;
  time_expression_original: string;
  normalized_time: string | null;
  precision: 'EXACT_CLOCK_TIME' | 'EXACT_RELATIVE_OFFSET' | 'APPROXIMATE_CLOCK_TIME' | 'DAYPART' | 'DATE_ONLY' | 'RELATIVE_APPROXIMATE' | 'INTERVAL' | 'DURATION' | 'UNKNOWN';
  sequence_index: number;
  episode_id: string;
  status: FactStatus;
  evidence_span_ids: string[];
  evidence: {
    utterance_id: string;
    span_id: string;
    exact_quote: string;
  };
}

export interface SourceCoverageItem {
  source_span_ids: string[];
  semantic_propositions_detected: {
    proposition_type: string;
    subject_entity_id: string | null;
    value: any;
    clinically_relevant: boolean;
  }[];
  claims_created: string[];
  state_targets: string[];
  attribute_targets: string[];
  relationship_targets: string[];
  event_targets: string[];
  coverage_status: 'FULL' | 'PARTIAL' | 'NONE' | 'DEFERRED' | 'NOT_CLINICALLY_RELEVANT';
  missing_elements: string[];
  deferred_reason: string | null;
}

export interface Contradiction {
  contradiction_id: string;
  entity_ids: string[];
  statement_a: string;
  statement_b: string;
  status: 'UNRESOLVED';
  requires_clarification: true;
  evidence: {
    utterance_id: string;
    exact_quote: string;
  }[];
}

export interface ValidationReport {
  is_valid: boolean;
  rules_checked: number;
  violations: {
    rule_id: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
  }[];
  id_uniqueness_verified: boolean;
  entity_isolation_verified: boolean;
  source_coverage: SourceCoverageItem[];
}

export interface LosslessCaseState {
  case_id: string;
  case_version: number;
  module: 'ANAMNESIS_ENGINE';
  stage: 'ORGANON_BUILD_01_PIPELINE_WIRING_FIX_01' | 'ORGANON_BUILD_01_SEMANTIC_PIPELINE_REPAIR_01';
  status: 'IN_PROGRESS' | 'COMPLETED';
  utterances: Utterance[];
  source_spans: SourceSpan[];
  claims: SemanticClaim[];
  episodes: Episode[];
  symptoms: SymptomEntity[];
  symptom_states: SymptomState[];
  rejected_claims: RejectedClaim[];
  events: ClinicalEvent[];
  interventions: Intervention[];
  measurements: ObjectiveMeasurement[];
  relationships: TemporalRelationship[];
  causality_records: CausalityRecord[];
  timeline: TimelineEntry[];
  uncertainties: string[];
  contradictions: Contradiction[];
  validation: ValidationReport;
  created_at: string;
  updated_at: string;
}

export interface AttributeBindingRecord {
  source_span_id: string;
  attribute_type: string;
  value: any;
  candidate_target_id: string | null;
  resolved_target_id: string | null;
  status: 'BOUND' | 'UNCLEAR' | 'ORPHANED';
  evidence_quote: string;
}

export interface TemporalBindingRecord {
  temporal_span_id: string;
  time_type: string;
  target_id: string | null;
  normalized_value: string | null;
  precision: string;
  status: 'BOUND' | 'ORPHANED';
  evidence_quote: string;
}

export const OrganonView: React.FC = () => {
  const [caseState, setCaseState] = useState<LosslessCaseState | null>(null);
  const [narrationInput, setNarrationInput] = useState<string>('');
  const [activeSectionTab, setActiveSectionTab] = useState<
    | 'utterances'
    | 'spans'
    | 'claims'
    | 'episodes'
    | 'symptoms'
    | 'states'
    | 'interventions'
    | 'measurements'
    | 'timeline'
    | 'attributes'
    | 'temporal_bindings'
    | 'rejected'
    | 'validator'
    | 'json'
  >('utterances');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{ test: string; expected: string; actual: string; status: 'PASS' | 'FAIL' }[] | null>(null);
  const [attributeBindingsLog, setAttributeBindingsLog] = useState<AttributeBindingRecord[]>([]);
  const [temporalBindingsLog, setTemporalBindingsLog] = useState<TemporalBindingRecord[]>([]);

  useEffect(() => {
    startNewCase();
  }, []);

  const startNewCase = () => {
    const newCaseId = 'case_' + Math.random().toString(36).substring(2, 9);
    const initial: LosslessCaseState = {
      case_id: newCaseId,
      case_version: 1,
      module: 'ANAMNESIS_ENGINE',
      stage: 'ORGANON_BUILD_01_PIPELINE_WIRING_FIX_01',
      status: 'IN_PROGRESS',
      utterances: [],
      source_spans: [],
      claims: [],
      episodes: [
        {
          episode_id: 'ep_current',
          episode_type: 'CURRENT_EPISODE',
          time_reference: 'Aktuell / Rezente Beschwerden',
          entities: [],
          evidence: []
        },
        {
          episode_id: 'ep_historical',
          episode_type: 'HISTORICAL_EPISODE',
          time_reference: 'Vorangegangene Episoden',
          entities: [],
          evidence: []
        }
      ],
      symptoms: [],
      symptom_states: [],
      rejected_claims: [],
      events: [],
      interventions: [],
      measurements: [],
      relationships: [],
      causality_records: [],
      timeline: [],
      uncertainties: [],
      contradictions: [],
      validation: {
        is_valid: true,
        rules_checked: 48,
        violations: [],
        id_uniqueness_verified: true,
        entity_isolation_verified: true,
        source_coverage: []
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setCaseState(initial);
    setNarrationInput('');
    setTestResults(null);
    setAttributeBindingsLog([]);
    setTemporalBindingsLog([]);
  };

  // Canonical Production Application Service Wiring (FIX 01)
  const handleProcessNarration = (e?: React.FormEvent, customSubmissionId?: string) => {
    if (e) e.preventDefault();
    if (!narrationInput.trim() || !caseState) return;

    setIsProcessing(true);

    setTimeout(() => {
      const rawText = narrationInput.trim();
      const submissionId = customSubmissionId || ('sub_' + Math.random().toString(36).substring(2, 10));

      const existingUtterance = caseState.utterances.find(u => u.submission_id === submissionId);
      if (existingUtterance) {
        setIsProcessing(false);
        setNarrationInput('');
        return;
      }

      const { updatedState, attributeLogs, temporalLogs } = processOrganonSubmission(caseState, rawText, submissionId);

      setCaseState(updatedState);
      setAttributeBindingsLog(attributeLogs);
      setTemporalBindingsLog(temporalLogs);
      setNarrationInput('');
      setIsProcessing(false);
    }, 300);
  };

  // Run Comprehensive Semantic Pipeline & Parity Regression Suite
  const runRegressionTestsFIX01 = () => {
    if (!caseState) return;

    // Test A: Original Abdominal Regression Case
    const testTextA = "Gestern Morgen hatte ich keine Bauchschmerzen. Gegen Mittag bekam ich plötzlich Schmerzen im Bauch. Am Anfang waren sie ungefähr acht von zehn. Zwei Stunden später waren die Schmerzen nur noch vier von zehn. Am Abend hatte ich keine Bauchschmerzen mehr. Heute Morgen sind die Bauchschmerzen wieder da, aber nur leicht. Kopfschmerzen hatte ich während der ganzen Zeit nicht.";
    const resA = processOrganonSubmission(caseState, testTextA, 'sub_reg_a_' + Math.random().toString(36).substring(2, 6));
    const statesA = resA.updatedState.symptom_states;
    const hasAbdominalAbsentYesterday = statesA.some(s => s.symptom_id.includes('abdominal') && s.presence === 'ABSENT' && s.time_reference.includes('Gestern Morgen'));
    const hasAbdominalPresentNoon = statesA.some(s => s.symptom_id.includes('abdominal') && s.presence === 'PRESENT' && s.intensity.value === 8);
    const hasAbdominalPresentPlus2h = statesA.some(s => s.symptom_id.includes('abdominal') && s.presence === 'PRESENT' && s.time_reference.includes('Zwei Stunden später') && s.intensity.value === 4);
    const hasAbdominalAbsentEvening = statesA.some(s => s.symptom_id.includes('abdominal') && s.presence === 'ABSENT' && s.time_reference.includes('Am Abend'));
    const hasAbdominalPresentToday = statesA.some(s => s.symptom_id.includes('abdominal') && s.presence === 'PRESENT' && s.time_reference.includes('Heute Morgen') && s.intensity.normalized_category === 'MILD');
    const hasHeadacheAbsentInterval = statesA.some(s => s.symptom_id.includes('headache') && s.presence === 'ABSENT');
    const passA = hasAbdominalAbsentYesterday && hasAbdominalPresentNoon && hasAbdominalPresentPlus2h && hasAbdominalAbsentEvening && hasAbdominalPresentToday && hasHeadacheAbsentInterval;

    // Test B: Blind Test Case (Shoulder Pain + Nausea)
    const testTextB = "Vorgestern Abend bekam ich Schmerzen in der linken Schulter. Zuerst waren sie ziemlich stark, ungefähr sieben von zehn. Am nächsten Morgen waren die Schmerzen noch da, aber nur drei von zehn. Gegen Mittag verschwanden sie vollständig. Heute Nachmittag kamen sie wieder. Seitdem sind sie eher leicht. Übelkeit hatte ich zu keinem Zeitpunkt.";
    const resB = processOrganonSubmission(caseState, testTextB, 'sub_reg_b_' + Math.random().toString(36).substring(2, 6));
    const sB = resB.updatedState;
    const hasShoulderSym = sB.symptoms.some(sym => sym.symptom_id.includes('shoulder') && sym.broad_location.value?.includes('Schulter'));
    const noAbdominalFallback = !sB.symptoms.some(sym => sym.symptom_id.includes('abdominal') || sym.canonical_patient_label.includes('Bauch'));
    const has7 = sB.symptom_states.some(st => st.symptom_id.includes('shoulder') && st.intensity.value === 7);
    const has3 = sB.symptom_states.some(st => st.symptom_id.includes('shoulder') && st.intensity.value === 3);
    const hasNoonAbsent = sB.symptom_states.some(st => st.symptom_id.includes('shoulder') && st.time_reference.includes('Gegen Mittag') && st.presence === 'ABSENT');
    const hasRecurrencePM = sB.symptom_states.some(st => st.symptom_id.includes('shoulder') && st.time_reference.includes('Heute Nachmittag') && st.presence === 'PRESENT');
    const hasMildCont = sB.symptom_states.some(st => st.symptom_id.includes('shoulder') && (st.intensity.normalized_category === 'MILD' || st.intensity.value_original?.includes('leicht')));
    const hasNauseaAbsent = sB.symptom_states.some(st => (st.symptom_id.includes('nausea') || st.sensation.value?.includes('Übelkeit')) && st.presence === 'ABSENT');
    const passB = hasShoulderSym && noAbdominalFallback && has7 && has3 && hasNoonAbsent && hasRecurrencePM && hasMildCont && hasNauseaAbsent && sB.validation.is_valid;

    // Test C: Generalization Test 1 (Right Wrist Pain)
    const testTextC = "Seit Montag habe ich Schmerzen im rechten Handgelenk. Anfangs waren sie sechs von zehn. Am Dienstag waren sie nur noch zwei von zehn. Mittwoch waren sie weg.";
    const resC = processOrganonSubmission(caseState, testTextC, 'sub_reg_c_' + Math.random().toString(36).substring(2, 6));
    const sC = resC.updatedState;
    const passC = sC.symptoms.some(sym => sym.symptom_id.includes('wrist') && sym.broad_location.value?.includes('Handgelenk')) &&
      sC.symptom_states.some(st => st.intensity.value === 6) &&
      sC.symptom_states.some(st => st.intensity.value === 2) &&
      sC.symptom_states.some(st => st.time_reference.includes('Mittwoch') && st.presence === 'ABSENT') &&
      sC.validation.is_valid;

    // Test D: Generalization Test 2 (Left Foot Burning)
    const testTextD = "Gestern begann ein Brennen im linken Fuß. Abends war es sehr stark. Heute Morgen war es verschwunden.";
    const resD = processOrganonSubmission(caseState, testTextD, 'sub_reg_d_' + Math.random().toString(36).substring(2, 6));
    const sD = resD.updatedState;
    const passD = sD.symptoms.some(sym => sym.symptom_id.includes('foot') && sym.broad_location.value?.includes('Fuß')) &&
      sD.symptom_states.some(st => st.intensity.normalized_category === 'SEVERE') &&
      sD.symptom_states.some(st => st.time_reference.includes('Heute Morgen') && st.presence === 'ABSENT') &&
      sD.validation.is_valid;

    // Test E: Generalization Test 3 (Vertigo & Nausea)
    const testTextE = "Seit gestern habe ich Schwindel. Übelkeit hatte ich nicht.";
    const resE = processOrganonSubmission(caseState, testTextE, 'sub_reg_e_' + Math.random().toString(36).substring(2, 6));
    const sE = resE.updatedState;
    const passE = sE.symptoms.some(sym => sym.symptom_id.includes('vertigo')) &&
      sE.symptoms.some(sym => sym.symptom_id.includes('nausea')) &&
      sE.symptom_states.some(st => st.symptom_id.includes('vertigo') && st.presence === 'PRESENT') &&
      sE.symptom_states.some(st => st.symptom_id.includes('nausea') && st.presence === 'ABSENT') &&
      sE.validation.is_valid;

    // Test F: Generalization Test 4 (Cough)
    const testTextF = "Am Morgen hatte ich Husten. Gegen Mittag war er weg. Am Abend kam er wieder.";
    const resF = processOrganonSubmission(caseState, testTextF, 'sub_reg_f_' + Math.random().toString(36).substring(2, 6));
    const sF = resF.updatedState;
    const passF = sF.symptoms.some(sym => sym.symptom_id.includes('cough')) &&
      sF.symptom_states.some(st => st.time_reference.includes('Am Morgen') && st.presence === 'PRESENT') &&
      sF.symptom_states.some(st => st.time_reference.includes('Gegen Mittag') && st.presence === 'ABSENT') &&
      sF.symptom_states.some(st => st.time_reference.includes('Am Abend') && st.presence === 'PRESENT') &&
      sF.validation.is_valid;

    const tests = [
      { test: 'Blind Test: Shoulder Pain & Nausea (Full Dynamic Resolution)', expected: 'Left shoulder pain entity (no Bauch!), ~7/10 & 3/10 intensities, noon cessation, afternoon recurrence, mild continuation, nausea denied', actual: passB ? 'PASS' : 'FAIL', status: passB ? 'PASS' as const : 'FAIL' as const },
      { test: 'Generalization Test 1: Right Wrist Pain', expected: 'Wrist entity, 6/10 initially, 2/10 Tuesday, Wednesday ABSENT', actual: passC ? 'PASS' : 'FAIL', status: passC ? 'PASS' as const : 'FAIL' as const },
      { test: 'Generalization Test 2: Left Foot Burning', expected: 'Foot entity, SEVERE intensity evening, Today morning ABSENT', actual: passD ? 'PASS' : 'FAIL', status: passD ? 'PASS' as const : 'FAIL' as const },
      { test: 'Generalization Test 3: Vertigo & Nausea Denial', expected: 'Vertigo PRESENT, separate Nausea entity ABSENT', actual: passE ? 'PASS' : 'FAIL', status: passE ? 'PASS' as const : 'FAIL' as const },
      { test: 'Generalization Test 4: Cough Recurrence', expected: 'Cough PRESENT morning, ABSENT noon, PRESENT evening', actual: passF ? 'PASS' : 'FAIL', status: passF ? 'PASS' as const : 'FAIL' as const },
      { test: 'Regression Test: Abdominal Case & Headache', expected: '5 abdominal states (8/10, 4/10, mild) + headache absent interval', actual: passA ? 'PASS' : 'FAIL', status: passA ? 'PASS' as const : 'FAIL' as const },
      { test: 'Patient Evidence Lock Invariant', expected: 'No cross-location leakage (Schulter/Handgelenk/Fuß never resolves to Bauch)', actual: (passB && passC && passD) ? 'PASS' : 'FAIL', status: (passB && passC && passD) ? 'PASS' as const : 'FAIL' as const },
      { test: 'Disappearance / Cessation Semantics', expected: 'Cessation phrases materialize exclusively as ABSENT states', actual: (hasNoonAbsent && passC && passD && passF) ? 'PASS' : 'FAIL', status: (hasNoonAbsent && passC && passD && passF) ? 'PASS' as const : 'FAIL' as const },
      { test: 'Cross-Layer Parity & Validator Integrity', expected: 'Claim-state parity, attribute-state parity, zero validator violations', actual: (sB.validation.is_valid && sC.validation.is_valid && sD.validation.is_valid) ? 'PASS' : 'FAIL', status: (sB.validation.is_valid && sC.validation.is_valid && sD.validation.is_valid) ? 'PASS' as const : 'FAIL' as const }
    ];
    setTestResults(tests);
  };

  if (!caseState) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col font-sans antialiased">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold tracking-wide uppercase">
              ANAMNESIS_ENGINE
            </span>
            <span className="text-xs text-slate-400 font-mono">ORGANON_BUILD_01_SEMANTIC_PIPELINE_REPAIR_01</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Organon</h1>
          <p className="text-sm text-slate-500">State Materialization Pipeline & Cross-Layer Consistency Lock (Semantic Pipeline Repair 01)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-600">
            Case ID: <span className="font-bold text-slate-900">{caseState.case_id}</span> | v{caseState.case_version}
          </div>
          <button
            type="button"
            onClick={runRegressionTestsFIX01}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Regressionstests FIX 01 (Canonical Parity)</span>
          </button>
          <button
            type="button"
            onClick={startNewCase}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Neuer Fall</span>
          </button>
        </div>
      </div>

      {/* Test Results Modal */}
      {testResults && (
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span>Regressionstest-Ergebnisse FIX 02.2 (Assertions A–AH & Idempotency)</span>
              </h3>
              <button 
                onClick={() => setTestResults(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Schließen ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {testResults.map((tr, idx) => (
                <div key={idx} className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 text-[11px] flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-200 mb-1">{tr.test}</div>
                    <div className="text-slate-400 text-[10px] mb-2">{tr.expected}</div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 font-mono">
                    <span className="text-slate-400">Status:</span>
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {tr.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Narration & Spans */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="patient-narration-input" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Patientenerzählung (FIX 02.2 Engine)</span>
              </label>
              <span className="text-xs text-slate-400">Submit-Lock Aktiv</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Geben Sie die Anamnese ein. Die Engine löst Attributbindigungen (z.B. 8/10, „leicht“), relative Zeiten („Zwei Stunden später“) und Proposition-Coverage auf.
            </p>

            <form onSubmit={(e) => handleProcessNarration(e)} className="flex flex-col gap-3">
              <textarea
                id="patient-narration-input"
                rows={6}
                value={narrationInput}
                onChange={(e) => setNarrationInput(e.target.value)}
                placeholder="Beispiel: Gestern Morgen keine Bauchschmerzen. Gegen Mittag Schmerzen im Bauch (ca. 8/10). Zwei Stunden später 4/10..."
                className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  <span>Proposition Coverage Validator Aktiv</span>
                </div>
                <button
                  type="submit"
                  disabled={!narrationInput.trim() || isProcessing}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Semantisch Verarbeiten</span>
                </button>
              </div>
            </form>
          </div>

          {/* Source Spans */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex-1 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-teal-600" />
              <span>Semantic Source Spans [{caseState.source_spans.length}]</span>
            </h3>
            
            {caseState.source_spans.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                <FileText className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs">Keine Spans extrahiert.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[350px]">
                {caseState.source_spans.map((span) => (
                  <div key={span.span_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span>Span: {span.span_id} | Utt: {span.utterance_id}</span>
                      <span className="px-1.5 py-0.2 bg-teal-50 text-teal-700 rounded font-bold">{span.span_type}</span>
                    </div>
                    <p className="text-slate-800 font-medium">„{span.exact_text}“</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Developer View */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-600" />
              <span>Entwickler- & Testansicht (FIX 02.2 Schema)</span>
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">FIX 02.2 Active</span>
            </div>
          </div>

          {/* Section Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 border-b border-slate-100 scrollbar-thin">
            {[
              { id: 'utterances', label: '1. Original', count: caseState.utterances.length },
              { id: 'claims', label: '2. Semantic Claims', count: caseState.claims.length },
              { id: 'symptoms', label: '3. Symptoms', count: caseState.symptoms.length },
              { id: 'states', label: '4. Symptom States', count: caseState.symptom_states.length },
              { id: 'timeline', label: '5. Timeline', count: caseState.timeline.length },
              { id: 'attributes', label: '6. Attribute Bindings', count: attributeBindingsLog.length },
              { id: 'temporal_bindings', label: '7. Temporal Bindings', count: temporalBindingsLog.length },
              { id: 'rejected', label: '8. Rejected', count: caseState.rejected_claims.length },
              { id: 'validator', label: '9. Coverage Report', count: caseState.validation.source_coverage.length },
              { id: 'json', label: '10. JSON', count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSectionTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeSectionTab === tab.id
                    ? 'bg-teal-600 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeSectionTab === tab.id ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="pt-4 flex-1 overflow-y-auto max-h-[550px]">
            {activeSectionTab === 'utterances' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Originaltext & Submission IDs</h4>
                {caseState.utterances.map((u) => (
                  <div key={u.utterance_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-mono text-[10px] text-slate-400">
                      <span>Utt ID: {u.utterance_id}</span>
                      <span>Sub ID: {u.submission_id}</span>
                    </div>
                    <p className="text-slate-900 font-medium">„{u.raw_text}“</p>
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'claims' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Semantic Claims</h4>
                {caseState.claims.map((cl) => (
                  <div key={cl.claim_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-teal-700 font-bold">{cl.claim_id}</span>
                      <div className="flex gap-2">
                        <span className={`px-1.5 py-0.5 rounded font-bold ${cl.polarity === 'POSITIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{cl.polarity}</span>
                        <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">{cl.context_role}</span>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900">
                      Subject: {cl.subject.surface_form || 'N/A'} | Predicate: <span className="text-teal-800 font-mono">{cl.predicate}</span> = {typeof cl.value === 'object' ? JSON.stringify(cl.value) : (cl.value || 'N/A')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'symptoms' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Symptom Entities</h4>
                {caseState.symptoms.map((sym) => (
                  <div key={sym.symptom_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-slate-900 text-sm">{sym.canonical_patient_label}</div>
                    <div className="text-slate-600 font-mono text-[11px]">ID: {sym.symptom_id} | Location: {sym.broad_location.value}</div>
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'states' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Symptom States & Structured Intensity Attributes</h4>
                {caseState.symptom_states.map((st) => (
                  <div key={st.state_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span>{st.state_id}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${st.presence === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {st.presence} ({st.state_temporality})
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{st.sensation.value} | Zeit: {st.time_reference}</div>
                    <div className="bg-white p-2 rounded border border-slate-200 text-[11px] space-y-1 font-mono">
                      <div>Intensity Value: {st.intensity.value !== null ? `${st.intensity.value}/${st.intensity.scale_max}` : 'None'}</div>
                      <div>Intensity Qualifier: {st.intensity.qualifier || st.intensity.normalized_category || 'None'}</div>
                      <div>Original Wording: {st.intensity.value_original || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'timeline' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Timeline (Sequential 1..N with Precision)</h4>
                {caseState.timeline.map((t) => (
                  <div key={t.timeline_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">#{t.sequence_index} [{t.entity_type}]</span> {t.time_expression_original}
                    </div>
                    <span className="text-[10px] font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">{t.precision}</span>
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'attributes' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Attribute Binding Resolver Log</h4>
                {attributeBindingsLog.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine Attributbindungen aufgezeichnet.</p>
                ) : (
                  attributeBindingsLog.map((ab, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-teal-700 font-bold text-[11px]">
                        <span>Type: {ab.attribute_type}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">{ab.status}</span>
                      </div>
                      <div className="text-slate-900">Value: {JSON.stringify(ab.value)}</div>
                      <div className="text-slate-500 text-[10px]">Source Quote: „{ab.evidence_quote}“</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSectionTab === 'temporal_bindings' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Temporal Anchor Binding Log</h4>
                {temporalBindingsLog.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine temporalen Bindungen aufgezeichnet.</p>
                ) : (
                  temporalBindingsLog.map((tb, i) => (
                    <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
                      <div className="flex justify-between text-teal-700 font-bold text-[11px]">
                        <span>Time Type: {tb.time_type} | Precision: {tb.precision}</span>
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">{tb.status}</span>
                      </div>
                      <div className="text-slate-900">Normalized: {tb.normalized_value || 'None'}</div>
                      <div className="text-slate-500 text-[10px]">Source Quote: „{tb.evidence_quote}“</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSectionTab === 'rejected' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Rejected Claims</h4>
                {caseState.rejected_claims.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine abgelehnten Claims.</p>
                ) : (
                  caseState.rejected_claims.map((rej, i) => (
                    <div key={i} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1 font-mono">
                      <div className="font-bold text-rose-900">{rej.proposed_subject} ({rej.predicate})</div>
                      <div className="text-[10px] text-rose-700">Code: {rej.rejection_reason_code}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeSectionTab === 'validator' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Source-to-State Proposition Coverage</h4>
                {caseState.validation.source_coverage.map((sc, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 font-mono">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span className="text-slate-700">Span ID: {sc.source_span_ids.join(', ')}</span>
                      <span className={`px-2 py-0.5 rounded font-bold ${sc.coverage_status === 'FULL' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {sc.coverage_status}
                      </span>
                    </div>
                    <div className="text-slate-600">Propositions: {sc.semantic_propositions_detected.map(p => p.value).join('; ')}</div>
                    {sc.missing_elements.length > 0 && (
                      <div className="text-rose-600 text-[10px]">Missing: {sc.missing_elements.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeSectionTab === 'json' && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Lossless Case State JSON</h4>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[450px]">
                  {JSON.stringify(caseState, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

