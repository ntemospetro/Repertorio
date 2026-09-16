import React, { useState } from 'react';
import { analyzeOrganonText, OrganonAiAnalysisResult } from '../services/organonAiService';
import { 
  Activity, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  Shield, 
  Terminal, 
  Database, 
  Send,
  Layers,
  Clock
} from 'lucide-react';

// Compatibility types for unused legacy organonPipeline.ts
export interface Utterance { utterance_id: string; raw_text: string; submission_id: string; timestamp?: string; case_id?: string; speaker?: string; created_at?: string; language?: string; }
export interface SourceSpan { span_id: string; utterance_id: string; start_offset: number | null; end_offset: number | null; exact_text: string; span_type: any; validated_against_raw_text: boolean; }
export interface SemanticClaim { claim_id: string; subject: any; predicate: string; value: any; polarity: any; certainty: any; context_role: any; temporal_scope: any; coreference: any; evidence_span_ids: string[]; entailment_status: any; reason_code: string; }
export interface RejectedClaim { rejected_claim_id: string; proposed_subject: string; predicate: string; value: any; evidence_span_ids: string[]; rejection_reason_code: string; persisted_as_confirmed: false; }
export interface Episode { episode_id: string; episode_type: any; time_reference: string; entities: string[]; evidence: any[]; }
export interface SymptomEntity { symptom_id: string; canonical_patient_label: string; original_expressions: string[]; broad_location: any; sub_location: any; episode_id: string | null; evidence: any[]; }
export interface SymptomState { state_id: string; symptom_id: string; presence: any; time_reference: string; temporal_scope: string | null; state_temporality: any; intensity: any; location: any; sensation: any; certainty: any; evidence_span_ids: string[]; evidence: any; }
export interface TimelineEntry { timeline_id: string; sequence_index: number; entity_id: string; entity_type: string; time_expression_original: string; time_normalized?: string | null; precision: string; event_type?: string; description?: string; evidence_span_id?: string; state_id?: string; normalized_time?: any; evidence?: any; }
export interface SourceCoverageItem { source_span_ids: string[]; semantic_propositions_detected: any[]; coverage_status: string; missing_elements: string[]; }
export interface AttributeBindingRecord { attribute_type: string; value: any; status: string; evidence_quote: string; source_span_id?: string; candidate_target_id?: string; resolved_target_id?: string; }
export interface TemporalBindingRecord { temporal_span_id: string; time_type: string; target_id: string | null; normalized_value: string | null; precision: string; status: any; evidence_quote: string; }
export interface LosslessCaseState {
  case_id: string;
  case_version: number;
  module: string;
  stage: string;
  status: string;
  utterances: Utterance[];
  source_spans: SourceSpan[];
  claims: SemanticClaim[];
  episodes: Episode[];
  symptoms: SymptomEntity[];
  symptom_states: SymptomState[];
  rejected_claims: RejectedClaim[];
  events: any[];
  interventions: any[];
  measurements: any[];
  relationships: any[];
  causality_records: any[];
  timeline: TimelineEntry[];
  uncertainties: any[];
  contradictions: any[];
  validation: {
    is_valid: boolean;
    rules_checked: number;
    violations: any[];
    id_uniqueness_verified: boolean;
    entity_isolation_verified: boolean;
    source_coverage: SourceCoverageItem[];
  };
  created_at: string;
  updated_at: string;
}

export const OrganonView: React.FC = () => {
  const [narrationInput, setNarrationInput] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<OrganonAiAnalysisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [debugStatus, setDebugStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleAnalyze = async (textToAnalyze?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : narrationInput;
    if (!text.trim()) {
      setErrorMessage("Bitte geben Sie einen Text ein.");
      return;
    }

    if (textToAnalyze !== undefined) {
      setNarrationInput(textToAnalyze);
    }

    setIsProcessing(true);
    setErrorMessage('');
    setDebugStatus("Request gestartet");
    console.log("[OrganonView] Button-Handler ausgelöst, analyzeOrganonText aufgerufen mit text:", text);

    try {
      setDebugStatus("API erreicht");
      const res = await analyzeOrganonText(text);
      setDebugStatus("Antwort erhalten");
      console.log("[OrganonView] Antwort erhalten:", res);
      setAnalysisResult(res);
    } catch (err: any) {
      console.error("[OrganonView] Fehler:", err);
      setDebugStatus("Fehler aufgetreten");
      setErrorMessage(err.message || String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 flex flex-col font-sans antialiased">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold tracking-wide uppercase">
              ORGANON TESTBETRIEB
            </span>
            <span className="text-xs text-slate-400 font-mono">gemini-3.8-flash AI Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Organon KI-Zerlegung</h1>
          <p className="text-sm text-slate-500">Testbetrieb für Textzerlegung, Spans, Entities, Claims & Temporal Bindings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleAnalyze("Seit Dienstagabend habe ich ein pochendes Gefühl an der Außenseite des rechten Knöchels. Anfangs war es ungefähr acht von zehn. Am Mittwochmorgen war es nur noch vier von zehn. Gegen Mittag war es vollständig verschwunden. Heute früh kam es wieder, aber deutlich schwächer. Beim Auftreten wird es stärker. Kälte verändert es nicht. Taubheitsgefühl hatte ich nie.")}
            className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Hahnemann-Analyse / Knöchel</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Gestern Abend waren die Schmerzen ungefähr acht von zehn. Später habe ich gesagt, sie seien nur vier von zehn gewesen. Ich weiß nicht mehr, welcher Wert stimmt.")}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Next Question / Intensität</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Seit Montag habe ich Schmerzen im linken Knie. Später habe ich gesagt, dass die Schmerzen im rechten Knie sind. Ich bin mir nicht sicher, welche Seite stimmt.")}
            className="px-3.5 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Contradictions</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Seit Montag habe ich Schmerzen im rechten Knie. Nein, entschuldigung, links. Gestern waren sie weg. Heute sind sie wieder da.")}
            className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Corrections / Knie</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Vorgestern Abend bekam ich Schmerzen in der linken Schulter. Zuerst waren sie ziemlich stark, ungefähr sieben von zehn. Am nächsten Morgen waren die Schmerzen noch da, aber nur drei von zehn. Gegen Mittag verschwanden sie vollständig. Heute Nachmittag kamen sie wieder. Seitdem sind sie eher leicht. Übelkeit hatte ich zu keinem Zeitpunkt.")}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Onset / Schulter</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Seit Montagabend habe ich ein dumpfes Ziehen an der Innenseite des linken Oberschenkels. Heute Morgen war es ungefähr fünf von zehn. Beim Treppensteigen wird es stärker. Wärme verändert es nicht.")}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Temporal Bindings</span>
          </button>
          <button
            type="button"
            onClick={() => handleAnalyze("Seit heute Morgen habe ich ein Brumba-Brumba-Gefühl an der Außenseite meines linken Fußes. Es ist nicht schmerzhaft. Ich kann nicht genauer erklären, was ich mit Brumba-Brumba meine.")}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            <span>Testfall Claims</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column: Input Form */}
        <div className="w-full lg:w-5/12 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="patient-narration-input" className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Patientenschilderung (Raw Text)</span>
              </label>
              <span className="text-xs text-slate-400">Gemini 3.8 Flash</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Geben Sie Text ein oder wählen Sie einen Testfall. Klicken Sie auf „Schilderung übernehmen“, um die KI-Zerlegung durchzuführen.
            </p>

            <div className="flex flex-col gap-3">
              <textarea
                id="patient-narration-input"
                rows={6}
                value={narrationInput}
                onChange={(e) => setNarrationInput(e.target.value)}
                placeholder="Geben Sie hier den Patiententext ein..."
                className="w-full rounded-xl border border-slate-300 p-3.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all resize-none"
              />
              
              {debugStatus && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-mono">
                  <strong>Debug Status:</strong> {debugStatus}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-mono">
                  <strong>Fehler:</strong> {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-teal-600" />
                  <span>Strict Parsing Active</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyze()}
                  disabled={!narrationInput.trim() || isProcessing}
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Schilderung übernehmen</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Results Display */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-teal-600" />
              <span>Organon KI-Analyseergebnisse</span>
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold text-slate-700">gemini-3.8-flash</span>
            </div>
          </div>

          {!analysisResult ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Activity className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium">Noch keine Analyse durchgeführt.</p>
              <p className="text-xs text-slate-400 mt-1">Geben Sie Text ein oder nutzen Sie einen der Testläufe.</p>
            </div>
          ) : (
            <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2">
              
              {/* 1. Originaltext */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  <span>1. Originaltext (raw_text)</span>
                </h3>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 font-medium">
                  „{analysisResult.raw_text}“
                </div>
              </div>

              {/* 2. Source Spans */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5 text-teal-600" />
                  <span>2. Source Spans [{analysisResult.source_spans.length}]</span>
                </h3>
                {analysisResult.source_spans.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine Spans vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.source_spans.map((span) => (
                      <div key={span.span_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs flex items-center justify-between">
                        <div>
                          <span className="font-mono text-[10px] text-slate-400 mr-2">[{span.span_id}]</span>
                          <span className="font-semibold text-slate-900">„{span.exact_text}“</span>
                        </div>
                        <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded font-bold font-mono text-[10px]">{span.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Entities */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>3. Entities [{analysisResult.entities.length}]</span>
                </h3>
                {analysisResult.entities.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine Entities vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.entities.map((ent) => (
                      <div key={ent.entity_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-sm">{ent.patient_label}</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            ent.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            ent.status === 'DENIED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ent.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          ID: {ent.entity_id} | Evidence Spans: {ent.evidence_span_ids.join(', ') || 'None'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Claims */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-teal-600" />
                  <span>4. Claims / Attributes [{analysisResult.claims?.length || 0}]</span>
                </h3>
                {(!analysisResult.claims || analysisResult.claims.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Keine Claims vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.claims.map((claim) => (
                      <div key={claim.claim_id} className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-teal-900">{claim.attribute}: <span className="font-normal text-slate-700">{claim.value}</span></span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            claim.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                            claim.status === 'DENIED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-teal-700">
                          ID: {claim.claim_id} | Subject Entity: {claim.subject_entity_id} | Spans: {claim.evidence_span_ids.join(', ') || 'None'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Temporal Bindings */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>5. Temporal Bindings [{analysisResult.temporal_bindings?.length || 0}]</span>
                </h3>
                {(!analysisResult.temporal_bindings || analysisResult.temporal_bindings.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Keine Temporal Bindings vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.temporal_bindings.map((tb) => (
                      <div key={tb.temporal_binding_id} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-900">Zeitbezug: <span className="text-slate-900">„{tb.time_expression}“</span></span>
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                            {tb.status}
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-indigo-700">
                          ID: {tb.temporal_binding_id} | Subject: {tb.subject_entity_id} → Claim: {tb.claim_id} | Spans: {tb.evidence_span_ids.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 6. Symptom States */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-purple-600" />
                  <span>6. Symptom States [{analysisResult.symptom_states?.length || 0}]</span>
                </h3>
                {(!analysisResult.symptom_states || analysisResult.symptom_states.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Keine Symptom States vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.symptom_states.map((state) => (
                      <div key={state.state_id} className="p-3 rounded-xl bg-purple-50/50 border border-purple-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-900">Zeit: <span className="text-slate-900">„{state.time_expression}“</span></span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            state.presence === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                            state.presence === 'ABSENT' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {state.presence}
                          </span>
                        </div>
                        {state.intensity_text && (
                          <div className="text-slate-700 font-medium">
                            Intensität: <span className="text-slate-900">{state.intensity_text}</span>
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-purple-700">
                          ID: {state.state_id} | Entity: {state.subject_entity_id} | Claims: {state.source_claim_ids.join(', ') || 'None'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Corrections / Superseded By */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-rose-600" />
                  <span>7. Corrections [{analysisResult.corrections?.length || 0}]</span>
                </h3>
                {(!analysisResult.corrections || analysisResult.corrections.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Keine Korrekturen vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.corrections.map((corr) => (
                      <div key={corr.correction_id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900">Korrektur ({corr.relation})</span>
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800">
                            {corr.correction_id}
                          </span>
                        </div>
                        <div className="text-slate-700">
                          Alt Claim: <code className="font-mono bg-white px-1 py-0.5 rounded text-rose-900">{corr.old_claim_id}</code> → Neu Claim: <code className="font-mono bg-white px-1 py-0.5 rounded text-emerald-900">{corr.new_claim_id}</code>
                        </div>
                        <div className="text-[10px] font-mono text-rose-700">
                          Entity: {corr.subject_entity_id} | Spans: {corr.evidence_span_ids.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 8. Contradictions */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-orange-600" />
                  <span>8. Contradictions [{analysisResult.contradictions?.length || 0}]</span>
                </h3>
                {(!analysisResult.contradictions || analysisResult.contradictions.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">Keine Contradictions vorhanden.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.contradictions.map((con) => (
                      <div key={con.contradiction_id} className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/70 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-orange-900">Widerspruch ({con.attribute})</span>
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            con.status === 'UNRESOLVED' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {con.status}
                          </span>
                        </div>
                        <div className="text-slate-700">
                          Widersprüchliche Claims: <code className="font-mono bg-white px-1 py-0.5 rounded text-orange-900">{con.claim_ids.join(', ')}</code>
                        </div>
                        <div className="text-[10px] font-mono text-orange-700">
                          ID: {con.contradiction_id} | Entity: {con.subject_entity_id} | Spans: {con.evidence_span_ids.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 9. Uncertainties */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-600" />
                  <span>9. Uncertainties [{analysisResult.uncertainties.length}]</span>
                </h3>
                {analysisResult.uncertainties.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Keine Unklarheiten registriert.</p>
                ) : (
                  <div className="space-y-2">
                    {analysisResult.uncertainties.map((unc) => (
                      <div key={unc.uncertainty_id} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/70 text-xs space-y-1">
                        <div className="font-bold text-amber-900">{unc.text}</div>
                        <div className="text-amber-800 text-[11px]">{unc.reason}</div>
                        <div className="text-[10px] font-mono text-amber-600">
                          ID: {unc.uncertainty_id} | Related Entity: {unc.related_entity_id || 'None'}
                          {unc.related_claim_ids && unc.related_claim_ids.length > 0 && ` | Claims: ${unc.related_claim_ids.join(', ')}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 10. Next Question */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-600" />
                  <span>10. Next Question</span>
                </h3>
                {!analysisResult.next_question ? (
                  <p className="text-xs text-slate-400 italic">Keine offene Frage erforderlich.</p>
                ) : (
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-900">Empfohlene Klärungsfrage</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {analysisResult.next_question.reason_code}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-900 bg-white/80 p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                      „{analysisResult.next_question.text}“
                    </div>
                    <div className="text-[10px] font-mono text-emerald-700 flex flex-wrap gap-2 pt-1">
                      <span>ID: {analysisResult.next_question.question_id}</span>
                      <span>Status: {analysisResult.next_question.status}</span>
                      {analysisResult.next_question.related_contradiction_id && <span>Contradiction: {analysisResult.next_question.related_contradiction_id}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* 11. Validation / Case Completeness */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>11. Validation & Completeness</span>
                </h3>
                {!analysisResult.validation ? (
                  <p className="text-xs text-slate-400 italic">Keine Validierungsdaten.</p>
                ) : (
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs space-y-2">
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 ${
                        analysisResult.validation.is_valid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${analysisResult.validation.is_valid ? 'bg-emerald-600' : 'bg-rose-600'}`}></span>
                        Valid: {analysisResult.validation.is_valid ? 'TRUE' : 'FALSE'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1.5 ${
                        analysisResult.validation.is_complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${analysisResult.validation.is_complete ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
                        Complete: {analysisResult.validation.is_complete ? 'TRUE' : 'FALSE'}
                      </span>
                    </div>

                    {analysisResult.validation.blocking_issues && analysisResult.validation.blocking_issues.length > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 space-y-1">
                        <div className="font-bold text-rose-900 text-[11px]">Blocking Issues:</div>
                        <ul className="list-disc list-inside text-rose-800 space-y-0.5">
                          {analysisResult.validation.blocking_issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {analysisResult.validation.warnings && analysisResult.validation.warnings.length > 0 && (
                      <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 space-y-1">
                        <div className="font-bold text-amber-900 text-[11px]">Warnings:</div>
                        <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                          {analysisResult.validation.warnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 12. Hahnemann Analysis */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-purple-600" />
                    <span>12. Hahnemann-Analyse</span>
                  </h3>
                  {analysisResult.hahnemann_analysis && (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.hahnemann_analysis.analysis_status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {analysisResult.hahnemann_analysis.analysis_status}
                    </span>
                  )}
                </div>

                {!analysisResult.hahnemann_analysis ? (
                  <p className="text-xs text-slate-400 italic">Keine Hahnemann-Analyse vorhanden.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* Organon References */}
                    {analysisResult.hahnemann_analysis.organon_references && analysisResult.hahnemann_analysis.organon_references.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-slate-600">Methodischer Bezug:</span>
                        {analysisResult.hahnemann_analysis.organon_references.map((ref, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-800 rounded font-mono text-[10px] border border-purple-200">
                            {ref}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Characteristic Features */}
                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200/70 space-y-1.5">
                      <div className="font-bold text-purple-900 uppercase tracking-wide text-[11px]">Characteristic Features (§153)</div>
                      {(!analysisResult.hahnemann_analysis.characteristic_features || analysisResult.hahnemann_analysis.characteristic_features.length === 0) ? (
                        <p className="text-slate-500 italic">Keine charakteristischen Merkmale (leer gemäß §153 Regeln).</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.hahnemann_analysis.characteristic_features.map((feat) => (
                            <div key={feat.analysis_id} className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{feat.text}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-purple-700">
                                <span className="bg-purple-100 px-1.5 py-0.5 rounded">ID: {feat.analysis_id} ({feat.reason_code})</span>
                                {feat.related_entity_ids && feat.related_entity_ids.length > 0 && <span>Entities: {feat.related_entity_ids.join(', ')}</span>}
                                {feat.related_claim_ids && feat.related_claim_ids.length > 0 && <span>Claims: {feat.related_claim_ids.join(', ')}</span>}
                                {feat.related_state_ids && feat.related_state_ids.length > 0 && <span>States: {feat.related_state_ids.join(', ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* General Features */}
                    {analysisResult.hahnemann_analysis.general_features && analysisResult.hahnemann_analysis.general_features.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">General / Observed Features (Allgemeine Merkmale)</div>
                        <div className="space-y-1.5">
                          {analysisResult.hahnemann_analysis.general_features.map((gen) => (
                            <div key={gen.analysis_id} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{gen.text}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-700">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">ID: {gen.analysis_id} ({gen.reason_code})</span>
                                {gen.related_entity_ids && gen.related_entity_ids.length > 0 && <span>Entities: {gen.related_entity_ids.join(', ')}</span>}
                                {gen.related_claim_ids && gen.related_claim_ids.length > 0 && <span>Claims: {gen.related_claim_ids.join(', ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Modalities */}
                    <div className="bg-teal-50/50 p-3 rounded-xl border border-teal-200/70 space-y-1.5">
                      <div className="font-bold text-teal-900 uppercase tracking-wide text-[11px]">Modalities (Modalitäten & Umstände)</div>
                      {(!analysisResult.hahnemann_analysis.modalities || analysisResult.hahnemann_analysis.modalities.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Modalitäten erfasst.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.hahnemann_analysis.modalities.map((mod) => (
                            <div key={mod.analysis_id} className="bg-white p-2 rounded-lg border border-teal-100 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{mod.text}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-teal-700">
                                <span className="bg-teal-100 px-1.5 py-0.5 rounded">ID: {mod.analysis_id} ({mod.reason_code})</span>
                                {mod.related_entity_ids && mod.related_entity_ids.length > 0 && <span>Entities: {mod.related_entity_ids.join(', ')}</span>}
                                {mod.related_claim_ids && mod.related_claim_ids.length > 0 && <span>Claims: {mod.related_claim_ids.join(', ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Course Features */}
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200/70 space-y-1.5">
                      <div className="font-bold text-indigo-900 uppercase tracking-wide text-[11px]">Course Features (Verlauf & Entwicklung)</div>
                      {(!analysisResult.hahnemann_analysis.course_features || analysisResult.hahnemann_analysis.course_features.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Verlaufsmerkmale erfasst.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.hahnemann_analysis.course_features.map((crs) => (
                            <div key={crs.analysis_id} className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{crs.text}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-indigo-700">
                                <span className="bg-indigo-100 px-1.5 py-0.5 rounded">ID: {crs.analysis_id} ({crs.reason_code})</span>
                                {crs.related_entity_ids && crs.related_entity_ids.length > 0 && <span>Entities: {crs.related_entity_ids.join(', ')}</span>}
                                {crs.related_state_ids && crs.related_state_ids.length > 0 && <span>States: {crs.related_state_ids.join(', ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Missing Information / General / Concomitants if present */}
                    {analysisResult.hahnemann_analysis.missing_information && analysisResult.hahnemann_analysis.missing_information.length > 0 && (
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                        <div className="font-bold text-amber-900 uppercase tracking-wide text-[11px]">Missing Information (Fehlende Angaben)</div>
                        <div className="space-y-1.5">
                          {analysisResult.hahnemann_analysis.missing_information.map((miss) => (
                            <div key={miss.analysis_id} className="bg-white p-2 rounded-lg border border-amber-100 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{miss.text}</div>
                              <div className="text-[10px] font-mono text-amber-700">ID: {miss.analysis_id} ({miss.reason_code})</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 13. Selection for Remedy Analysis */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>13. Feature-Auswahl für Repertorium & Materia Medica</span>
                  </h3>
                  {analysisResult.selection_for_remedy_analysis && (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.selection_for_remedy_analysis.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      Status: {analysisResult.selection_for_remedy_analysis.status}
                    </span>
                  )}
                </div>

                {!analysisResult.selection_for_remedy_analysis ? (
                  <p className="text-xs text-slate-400 italic">Keine Merkmalsauswahl vorhanden.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* Selected Features */}
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200/70 space-y-1.5">
                      <div className="font-bold text-blue-900 uppercase tracking-wide text-[11px]">Selected Features (Ausgewählte Merkmale)</div>
                      {(!analysisResult.selection_for_remedy_analysis.selected_features || analysisResult.selection_for_remedy_analysis.selected_features.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Merkmale ausgewählt.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.selection_for_remedy_analysis.selected_features.map((feat) => (
                            <div key={feat.selection_id} className="bg-white p-2 rounded-lg border border-blue-100 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{feat.text}</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  feat.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' : feat.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {feat.feature_type} • {feat.priority}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-blue-700">
                                <span className="bg-blue-100 px-1.5 py-0.5 rounded">ID: {feat.selection_id} ({feat.reason_code})</span>
                                {feat.related_entity_ids && feat.related_entity_ids.length > 0 && <span>Entities: {feat.related_entity_ids.join(', ')}</span>}
                                {feat.related_claim_ids && feat.related_claim_ids.length > 0 && <span>Claims: {feat.related_claim_ids.join(', ')}</span>}
                                {feat.related_state_ids && feat.related_state_ids.length > 0 && <span>States: {feat.related_state_ids.join(', ')}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Excluded Features */}
                    {analysisResult.selection_for_remedy_analysis.excluded_features && analysisResult.selection_for_remedy_analysis.excluded_features.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <div className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">Excluded Features (Ausgeschlossene Merkmale / Verneint)</div>
                        <div className="space-y-1.5">
                          {analysisResult.selection_for_remedy_analysis.excluded_features.map((exc) => (
                            <div key={exc.selection_id} className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs space-y-1">
                              <div className="font-semibold text-slate-900">{exc.text}</div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-700">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">ID: {exc.selection_id} ({exc.reason_code})</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 14. Remedy Retrieval (Read-Only) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span>14. Remedy Retrieval (Lokaler Abgleich Repertorium / Materia Medica)</span>
                  </h3>
                  {analysisResult.remedy_retrieval && (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.remedy_retrieval.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {analysisResult.remedy_retrieval.status}
                    </span>
                  )}
                </div>

                {!analysisResult.remedy_retrieval ? (
                  <p className="text-xs text-slate-400 italic">Keine Retrieval-Daten vorhanden.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* Repertory Matches */}
                    <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-200/70 space-y-1.5">
                      <div className="font-bold text-indigo-900 uppercase tracking-wide text-[11px]">Repertory Matches (KENT / BOERICKE / BOGER)</div>
                      {(!analysisResult.remedy_retrieval.repertory_matches || analysisResult.remedy_retrieval.repertory_matches.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Repertorium-Treffer.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.remedy_retrieval.repertory_matches.map((rep) => (
                            <div key={rep.match_id} className="bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{rep.matched_text}</span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800">
                                  {rep.source} • {rep.match_type}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-indigo-700">
                                Quelle: {rep.source_file} (ID: {rep.source_record_id}) • Selection ID: {rep.selection_id}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Materia Medica Matches */}
                    <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200/70 space-y-1.5">
                      <div className="font-bold text-purple-900 uppercase tracking-wide text-[11px]">Materia Medica Matches (MATERIA_MEDICA / ALLEN_KEYNOTES)</div>
                      {(!analysisResult.remedy_retrieval.materia_medica_matches || analysisResult.remedy_retrieval.materia_medica_matches.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Materia-Medica-Treffer.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {analysisResult.remedy_retrieval.materia_medica_matches.map((mm) => (
                            <div key={mm.match_id} className="bg-white p-2 rounded-lg border border-purple-100 shadow-2xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-900">{mm.matched_text}</span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                                  {mm.source} • {mm.match_type}
                                </span>
                              </div>
                              <div className="text-[10px] font-mono text-purple-700">
                                Quelle: {mm.source_file} (Record ID: {mm.source_record_id}) {mm.remedy_id ? `• Remedy: ${mm.remedy_id}` : ''}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 15. Repertory Scoring (Deterministic Scoring Layer) */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-amber-600" />
                    <span>15. Repertory Scoring (Deterministische Scoring-Schicht)</span>
                  </h3>
                  {analysisResult.repertory_scoring && (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.repertory_scoring.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Status: {analysisResult.repertory_scoring.status}
                    </span>
                  )}
                </div>

                {!analysisResult.repertory_scoring ? (
                  <p className="text-xs text-slate-400 italic">Keine Scoring-Daten vorhanden.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {/* Feature Weights */}
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                      <div className="font-bold text-amber-900 uppercase tracking-wide text-[11px]">Feature Weights (Prioritäten: HIGH=3, MEDIUM=2, LOW=1)</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(analysisResult.repertory_scoring.feature_weights || []).map((fw) => (
                          <div key={fw.selection_id} className="bg-white p-2 rounded-lg border border-amber-100 flex items-center justify-between shadow-2xs">
                            <span className="font-mono text-[10px] text-slate-700">{fw.selection_id} ({fw.feature_type})</span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                              {fw.priority} → Gewicht: {fw.weight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remedy Scores */}
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/70 space-y-2">
                      <div className="font-bold text-emerald-900 uppercase tracking-wide text-[11px]">Remedy Scores & Contributions</div>
                      {(!analysisResult.repertory_scoring.remedy_scores || analysisResult.repertory_scoring.remedy_scores.length === 0) ? (
                        <p className="text-slate-500 italic">Keine Remedy Scores berechnet.</p>
                      ) : (
                        <div className="space-y-2">
                          {analysisResult.repertory_scoring.remedy_scores.map((rem) => (
                            <div key={rem.remedy_id} className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="font-bold text-slate-900 text-sm uppercase">{rem.remedy_id}</span>
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                                  Score: {rem.repertory_score} ({rem.matched_feature_count} Features)
                                </span>
                              </div>

                              {/* Contributions */}
                              {rem.repertory_contributions && rem.repertory_contributions.length > 0 && (
                                <div className="space-y-1">
                                  <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Repertory Contributions:</div>
                                  <div className="space-y-1">
                                    {rem.repertory_contributions.map((rc, idx) => (
                                      <div key={idx} className="bg-slate-50 p-1.5 rounded font-mono text-[10px] flex items-center justify-between text-slate-700">
                                        <span>{rc.selection_id} • {rc.source_record_id}</span>
                                        <span>Gewicht {rc.feature_weight} × Grad {rc.repertory_grade ?? 1} = <b>{rc.contribution}</b></span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Supportive MM Evidence */}
                              {rem.supportive_mm_evidence && rem.supportive_mm_evidence.length > 0 && (
                                <div className="space-y-1 pt-1">
                                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Supportive MM Evidence:</div>
                                  <div className="space-y-1">
                                    {rem.supportive_mm_evidence.map((mm, idx) => (
                                      <div key={idx} className="bg-purple-50/50 p-1.5 rounded text-[10px] text-purple-900">
                                        <span className="font-bold">{mm.source} ({mm.source_record_id})</span>: "{mm.matched_text}"
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 16. Scoring Adequacy / Coverage Gate */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>16. Scoring Adequacy / Coverage Gate (Fallabdeckung)</span>
                  </h3>
                  {analysisResult.scoring_adequacy && (
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.scoring_adequacy.status === 'ADEQUATE' ? 'bg-emerald-100 text-emerald-800' :
                      analysisResult.scoring_adequacy.status === 'LIMITED' ? 'bg-blue-100 text-blue-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      Status: {analysisResult.scoring_adequacy.status}
                    </span>
                  )}
                </div>

                {!analysisResult.scoring_adequacy ? (
                  <p className="text-xs text-slate-400 italic">Keine Adequacy-Daten vorhanden.</p>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Features Total</div>
                        <div className="text-base font-bold text-slate-900">{analysisResult.scoring_adequacy.selected_feature_count}</div>
                      </div>
                      <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Repertory Matched</div>
                        <div className="text-base font-bold text-slate-900">{analysisResult.scoring_adequacy.repertory_matched_feature_count}</div>
                      </div>
                      <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Coverage Ratio</div>
                        <div className="text-base font-bold text-slate-900">{Math.round(analysisResult.scoring_adequacy.repertory_coverage_ratio * 100)}%</div>
                      </div>
                      <div className="bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Weighted Coverage</div>
                        <div className="text-base font-bold text-slate-900">{Math.round(analysisResult.scoring_adequacy.weighted_repertory_coverage * 100)}%</div>
                      </div>
                    </div>

                    {/* Unmatched Features */}
                    {analysisResult.scoring_adequacy.unmatched_selected_features && analysisResult.scoring_adequacy.unmatched_selected_features.length > 0 && (
                      <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-200/70 space-y-1.5">
                        <div className="font-bold text-rose-900 uppercase tracking-wide text-[11px]">Unmatched Selected Features (Repertorial Uncovered)</div>
                        <div className="space-y-1">
                          {analysisResult.scoring_adequacy.unmatched_selected_features.map((feat) => (
                            <div key={feat.selection_id} className="bg-white p-2 rounded-lg border border-rose-100 flex items-center justify-between shadow-2xs">
                              <div>
                                <span className="font-semibold text-slate-900">{feat.text}</span>
                                <span className="text-[10px] text-slate-500 block font-mono">{feat.selection_id} • {feat.feature_type} • Priorität: {feat.priority}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[9px] font-bold">
                                {feat.reason}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 17. Vollständiges JSON */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  17. Vollständiges JSON der API-Antwort
                </h3>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl font-mono text-[10px] overflow-x-auto max-h-[300px]">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
