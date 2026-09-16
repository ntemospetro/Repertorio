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
}

export async function analyzeOrganonText(rawText: string, language: string = 'de'): Promise<OrganonAiAnalysisResult> {
  const res = await fetch('/api/organon/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ rawText, language }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Server error (${res.status}): ${errText}`);
  }

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
      status: 'BLOCKED',
      selected_features: [],
      excluded_features: [],
      blocking_reasons: ['No selection data provided']
    },
    remedy_retrieval: data.remedy_retrieval || {
      status: 'BLOCKED',
      feature_queries: [],
      repertory_matches: [],
      materia_medica_matches: [],
      warnings: ['INVALID_RETRIEVAL_PROVENANCE']
    },
    repertory_scoring: data.repertory_scoring || {
      status: 'BLOCKED',
      feature_weights: [],
      remedy_scores: [],
      warnings: []
    },
    scoring_adequacy: data.scoring_adequacy || {
      is_adequate: false,
      reason: 'Not analyzed'
    }
  };
}
