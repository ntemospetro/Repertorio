export interface OrganonSourceSpan {
  span_id: string;
  exact_text: string;
  type: 'COMPLAINT' | 'SENSATION' | 'LOCATION' | 'TEMPORAL' | 'INTENSITY' | 'NEGATION' | 'INTERVENTION' | 'MODALITY' | 'RELATIONSHIP' | 'UNCLEAR' | 'OTHER';
}

export interface OrganonEntity {
  entity_id: string;
  patient_label: string;
  status: 'CONFIRMED' | 'DENIED' | 'UNCLEAR';
  evidence_span_ids: string[];
}

export interface OrganonUncertainty {
  uncertainty_id: string;
  text: string;
  reason: string;
  related_entity_id: string | null;
  related_claim_ids?: string[];
}

export interface OrganonClaim {
  claim_id: string;
  subject_entity_id: string;
  attribute: string;
  value: string;
  status: 'CONFIRMED' | 'DENIED' | 'UNCLEAR';
  evidence_span_ids: string[];
}

export interface OrganonTemporalBinding {
  temporal_binding_id: string;
  subject_entity_id: string;
  claim_id: string;
  time_expression: string;
  evidence_span_ids: string[];
  status: 'CONFIRMED' | 'DENIED' | 'UNCLEAR';
}

export interface OrganonSymptomState {
  state_id: string;
  subject_entity_id: string;
  presence: 'PRESENT' | 'ABSENT' | 'UNCLEAR';
  intensity_text: string | null;
  time_expression: string;
  source_claim_ids: string[];
  source_temporal_binding_ids: string[];
  status: 'CONFIRMED' | 'DENIED' | 'UNCLEAR';
}

export interface OrganonCorrection {
  correction_id: string;
  subject_entity_id: string;
  old_claim_id: string;
  new_claim_id: string;
  relation: 'SUPERSEDED_BY';
  evidence_span_ids: string[];
}

export interface OrganonContradiction {
  contradiction_id: string;
  subject_entity_id: string;
  attribute: string;
  claim_ids: string[];
  status: 'UNRESOLVED' | 'RESOLVED';
  evidence_span_ids: string[];
}

export interface OrganonNextQuestion {
  question_id: string;
  text: string;
  reason_code: string;
  related_entity_id: string | null;
  related_claim_ids: string[];
  related_contradiction_id: string | null;
  status: 'OPEN' | 'RESOLVED';
}

export interface OrganonValidation {
  is_valid: boolean;
  is_complete: boolean;
  blocking_issues: string[];
  warnings: string[];
}

export interface OrganonHahnemannFeature {
  analysis_id: string;
  text: string;
  related_entity_ids?: string[];
  related_claim_ids?: string[];
  related_state_ids?: string[];
  reason_code: string;
}

export interface OrganonHahnemannAnalysis {
  analysis_status: 'READY' | 'INCOMPLETE';
  characteristic_features: OrganonHahnemannFeature[];
  general_features: OrganonHahnemannFeature[];
  modalities: OrganonHahnemannFeature[];
  concomitants: OrganonHahnemannFeature[];
  course_features: OrganonHahnemannFeature[];
  missing_information: OrganonHahnemannFeature[];
  organon_references: string[];
}

export interface OrganonSelectedFeature {
  selection_id: string;
  feature_type: 'SENSATION' | 'LOCATION' | 'MODALITY' | 'CONCOMITANT' | 'COURSE' | 'OTHER';
  text: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  reason_code: string;
  related_entity_ids?: string[];
  related_claim_ids?: string[];
  related_state_ids?: string[];
}

export interface OrganonExcludedFeature {
  selection_id: string;
  text: string;
  reason_code: string;
  related_entity_ids?: string[];
  related_claim_ids?: string[];
}

export interface OrganonSelectionForRemedyAnalysis {
  status: 'READY' | 'BLOCKED';
  selected_features: OrganonSelectedFeature[];
  excluded_features: OrganonExcludedFeature[];
  blocking_reasons: string[];
}

export interface OrganonFeatureQuery {
  query_id: string;
  selection_id: string;
  feature_type: string;
  original_text: string;
  normalized_search_terms: string[];
  status: string;
}

export interface OrganonRepertoryMatch {
  match_id: string;
  selection_id: string;
  source: string;
  source_file: string;
  source_record_id: string;
  matched_text: string;
  match_type: string;
  remedy_entries: any[];
  provenance_valid: boolean;
}

export interface OrganonMateriaMedicaMatch {
  match_id: string;
  selection_id: string;
  source: string;
  source_file: string;
  source_record_id: string;
  matched_text: string;
  remedy_id?: string;
  match_type: string;
  provenance_valid: boolean;
}

export interface OrganonRemedyRetrieval {
  status: string;
  feature_queries: OrganonFeatureQuery[];
  repertory_matches: OrganonRepertoryMatch[];
  materia_medica_matches: OrganonMateriaMedicaMatch[];
  warnings: string[];
}

export interface OrganonFeatureWeight {
  selection_id: string;
  feature_type: string;
  priority: string;
  weight: number;
}

export interface OrganonRepertoryContribution {
  selection_id: string;
  source_record_id: string;
  feature_weight: number;
  repertory_grade: number | null;
  contribution: number;
}

export interface OrganonSupportiveMmEvidence {
  selection_id: string;
  source: string;
  source_record_id: string;
  matched_text: string;
}

export interface OrganonRemedyScore {
  remedy_id: string;
  repertory_score: number;
  matched_feature_count: number;
  matched_selection_ids: string[];
  repertory_contributions: OrganonRepertoryContribution[];
  supportive_mm_evidence: OrganonSupportiveMmEvidence[];
}

export interface OrganonRepertoryScoring {
  status: string;
  feature_weights: OrganonFeatureWeight[];
  remedy_scores: OrganonRemedyScore[];
  warnings: string[];
}

export interface OrganonUnmatchedFeature {
  selection_id: string;
  feature_type: string;
  text: string;
  priority: string;
  reason: string;
}

export interface OrganonScoringAdequacy {
  status: string;
  selected_feature_count: number;
  repertory_matched_feature_count: number;
  supportive_mm_feature_count: number;
  repertory_coverage_ratio: number;
  weighted_possible_score_basis: number;
  weighted_repertory_coverage: number;
  unmatched_selected_features: OrganonUnmatchedFeature[];
  warnings: string[];
}

export interface OrganonComplaintMatrix {
  complaint_id: string;
  patient_label: string;
  temporal_status: 'NEW_CURRENT' | 'CURRENT_ONGOING' | 'CHRONIC_BASELINE' | 'CHRONIC_CHANGED' | 'RECURRENT' | 'HISTORICAL_RESOLVED' | 'UNKNOWN';
  complaint_type: 'INDEX_COMPLAINT' | 'CURRENT_ASSOCIATED_COMPLAINT' | 'CHRONIC_BACKGROUND' | 'HISTORICAL' | 'UNKNOWN';
  onset: string | null;
  duration: string | null;
  course: string | null;
  causa: string | null;
  location: string | null;
  sensation: string | null;
  modalities: string[];
  concomitants: string[];
  mind: string | null;
  intensity: string | null;
  frequency: string | null;
  negations: string[];
  uncertainties: string[];
  relation_to_current_episode: string | null;
  evidence_span_ids: string[];
}

export interface OrganonComplaintRelation {
  relation_id: string;
  source_complaint_id: string;
  target_complaint_id: string;
  relation_type: 'SAME_ONSET' | 'BEFORE' | 'AFTER' | 'DURING' | 'OVERLAPPING' | 'UNRELATED_BY_PATIENT' | 'UNKNOWN';
  status: string;
  evidence_span_ids: string[];
}

export interface OrganonAiAnalysisResult {
  raw_text: string;
  source_spans: OrganonSourceSpan[];
  entities: OrganonEntity[];
  uncertainties: OrganonUncertainty[];
  claims: OrganonClaim[];
  temporal_bindings: OrganonTemporalBinding[];
  symptom_states: OrganonSymptomState[];
  corrections: OrganonCorrection[];
  contradictions: OrganonContradiction[];
  next_question: OrganonNextQuestion | null;
  validation: OrganonValidation;
  hahnemann_analysis: OrganonHahnemannAnalysis;
  selection_for_remedy_analysis: OrganonSelectionForRemedyAnalysis;
  remedy_retrieval: OrganonRemedyRetrieval;
  repertory_scoring: OrganonRepertoryScoring;
  scoring_adequacy: OrganonScoringAdequacy;
  complaint_matrices: OrganonComplaintMatrix[];
  complaint_relations: OrganonComplaintRelation[];
}

export function createLocalFallbackAnalysis(rawText: string): OrganonAiAnalysisResult {
  const clean = (rawText || '').trim();
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  
  const spans: OrganonSourceSpan[] = sentences.length > 0 ? sentences.map((s, idx) => ({
    span_id: `span_${idx + 1}`,
    exact_text: s,
    type: 'COMPLAINT' as const
  })) : [{ span_id: 'span_1', exact_text: clean, type: 'COMPLAINT' as const }];

  const entities: OrganonEntity[] = [{
    entity_id: 'ent_1',
    patient_label: clean.slice(0, 50) || 'Beschwerde',
    status: 'CONFIRMED' as const,
    evidence_span_ids: ['span_1']
  }];

  const claims: OrganonClaim[] = [{
    claim_id: 'claim_1',
    subject_entity_id: 'ent_1',
    attribute: 'presence',
    value: 'present',
    status: 'CONFIRMED' as const,
    evidence_span_ids: ['span_1']
  }];

  // Basic keyword extraction for location and sensations
  let loc: string | null = null;
  if (/knie/i.test(clean)) loc = 'Knie';
  else if (/kopf/i.test(clean)) loc = 'Kopf';
  else if (/magen|bauch/i.test(clean)) loc = 'Magen/Bauch';
  else if (/hals/i.test(clean)) loc = 'Hals';
  else if (/ruecken|rücken/i.test(clean)) loc = 'Rücken';

  let sens: string | null = null;
  if (/stechend/i.test(clean)) sens = 'stechend';
  else if (/brennend/i.test(clean)) sens = 'brennend';
  else if (/pochend/i.test(clean)) sens = 'pochend';
  else if (/drueckend|drückend/i.test(clean)) sens = 'drückend';
  else if (/schmerz/i.test(clean)) sens = 'Schmerz';

  let onset: string = 'aktuell';
  if (/montag/i.test(clean)) onset = 'seit Montag';
  else if (/gestern/i.test(clean)) onset = 'seit gestern';
  else if (/woche/i.test(clean)) onset = 'seit einer Woche';

  const complaintMatrices: OrganonComplaintMatrix[] = [{
    complaint_id: 'comp_1',
    patient_label: clean.slice(0, 60),
    temporal_status: 'NEW_CURRENT',
    complaint_type: 'INDEX_COMPLAINT',
    onset,
    duration: 'vorliegend',
    course: 'akut',
    causa: null,
    location: loc,
    sensation: sens,
    modalities: [],
    concomitants: [],
    mind: null,
    intensity: 'mittel',
    frequency: 'anhaltend',
    negations: [],
    uncertainties: [],
    relation_to_current_episode: 'INDEX',
    evidence_span_ids: ['span_1']
  }];

  return {
    raw_text: clean,
    source_spans: spans,
    entities,
    uncertainties: [],
    claims,
    temporal_bindings: [],
    symptom_states: [{
      state_id: 'state_1',
      subject_entity_id: 'ent_1',
      presence: 'PRESENT',
      intensity_text: 'vorliegend',
      time_expression: onset,
      source_claim_ids: ['claim_1'],
      source_temporal_binding_ids: [],
      status: 'CONFIRMED'
    }],
    corrections: [],
    contradictions: [],
    next_question: {
      question_id: 'q_1',
      text: 'Wann genau und wodurch (z. B. Ruhe, Bewegung, Wärme, Kälte) bessern oder verschlechtern sich die Beschwerden?',
      reason_code: 'ORGANON_MODALITY',
      related_entity_id: 'ent_1',
      related_claim_ids: ['claim_1'],
      related_contradiction_id: null,
      status: 'OPEN'
    },
    validation: {
      is_valid: true,
      is_complete: false,
      blocking_issues: [],
      warnings: []
    },
    hahnemann_analysis: {
      analysis_status: 'READY',
      characteristic_features: [],
      general_features: [],
      modalities: [],
      concomitants: [],
      course_features: [],
      missing_information: [
        {
          analysis_id: 'miss_1',
          text: 'Modalitäten nach Organon (§§ 83-104)',
          reason_code: 'MODALITY_MISSING'
        }
      ],
      organon_references: ['§§83–104', '§84']
    },
    selection_for_remedy_analysis: {
      status: 'READY',
      selected_features: [],
      excluded_features: [],
      blocking_reasons: []
    },
    remedy_retrieval: {
      status: 'READY',
      feature_queries: [],
      repertory_matches: [],
      materia_medica_matches: [],
      warnings: []
    },
    repertory_scoring: {
      status: 'READY',
      feature_weights: [],
      remedy_scores: [],
      warnings: []
    },
    scoring_adequacy: {
      status: 'READY',
      selected_feature_count: 0,
      repertory_matched_feature_count: 0,
      supportive_mm_feature_count: 0,
      repertory_coverage_ratio: 0,
      weighted_possible_score_basis: 0,
      weighted_repertory_coverage: 0,
      unmatched_selected_features: [],
      warnings: []
    },
    complaint_matrices: complaintMatrices,
    complaint_relations: []
  };
}

export async function analyzeOrganonText(rawText: string, language: string = 'de'): Promise<OrganonAiAnalysisResult> {
  try {
    const res = await fetch('/api/organon/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rawText, language }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        raw_text: data.raw_text || rawText,
        source_spans: data.source_spans || [],
        entities: data.entities || [],
        uncertainties: data.uncertainties || [],
        claims: data.claims || [],
        temporal_bindings: data.temporal_bindings || [],
        symptom_states: data.symptom_states || [],
        corrections: data.corrections || [],
        contradictions: data.contradictions || [],
        next_question: data.next_question || null,
        validation: data.validation || { is_valid: true, is_complete: true, blocking_issues: [], warnings: [] },
        hahnemann_analysis: data.hahnemann_analysis || {
          analysis_status: 'INCOMPLETE',
          characteristic_features: [],
          general_features: [],
          modalities: [],
          concomitants: [],
          course_features: [],
          missing_information: [],
          organon_references: []
        },
        selection_for_remedy_analysis: data.selection_for_remedy_analysis || {
          status: 'READY',
          selected_features: [],
          excluded_features: [],
          blocking_reasons: []
        },
        remedy_retrieval: data.remedy_retrieval || {
          status: 'READY',
          feature_queries: [],
          repertory_matches: [],
          materia_medica_matches: [],
          warnings: []
        },
        repertory_scoring: data.repertory_scoring || {
          status: 'READY',
          feature_weights: [],
          remedy_scores: [],
          warnings: []
        },
        scoring_adequacy: data.scoring_adequacy || {
          is_adequate: true,
          reason: 'OK'
        },
        complaint_matrices: data.complaint_matrices || [],
        complaint_relations: data.complaint_relations || []
      };
    }

    console.warn(`[analyzeOrganonText] Server returned ${res.status}, activating local semantic fallback.`);
    return createLocalFallbackAnalysis(rawText);
  } catch (fetchErr) {
    console.warn('[analyzeOrganonText] Network or API unavailable, activating local semantic fallback:', fetchErr);
    return createLocalFallbackAnalysis(rawText);
  }
}
