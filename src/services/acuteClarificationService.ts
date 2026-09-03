import { LanguageCode } from '../types';

export interface AcuteClarificationOption {
  id: string;
  label: string;
  remedyHint?: string; // e.g. 'Aconitum, Belladonna'
  relevanceKeywords: string[]; // Added to matching text
}

export interface AcuteClarificationQuestion {
  id: string;
  category: string;
  title: string;
  description: string;
  type: 'single' | 'scale';
  options?: AcuteClarificationOption[];
  scaleMin?: number;
  scaleMax?: number; // 4 (strictly not 1-10!)
}

export interface AcuteAnswers {
  onset?: string;
  modality?: string;
  sensationMind?: string;
  intensity?: number; // 1 to 4
}

/**
 * Returns localized core acute clarification questions based on language and recorded symptoms.
 * strictly keeps questions to the 3-4 most necessary questions for acute remedy differentiation,
 * using a 1-4 scale (never 1-10).
 */
export function getAcuteClarificationQuestions(
  inputText: string,
  lang: LanguageCode = 'de'
): AcuteClarificationQuestion[] {
  const norm = (inputText || '').toLowerCase();

  // Detect specific acute domains to offer smart tailored options
  const isInjury = norm.includes('verletz') || norm.includes('sturz') || norm.includes('trauma') || norm.includes('prell') || norm.includes('wunde') || norm.includes('injury') || norm.includes('fall');
  const isFever = norm.includes('fieber') || norm.includes('fever') || norm.includes('fièvre') || norm.includes('febbre') || norm.includes('frecuencia') || norm.includes('gripp');
  const isHead = norm.includes('kopf') || norm.includes('head') || norm.includes('tête') || norm.includes('testa') || norm.includes('cabeza') || norm.includes('migr');

  if (lang === 'de') {
    return [
      {
        id: 'onset',
        category: 'Auslöser & Beginn (Causa)',
        title: '1. Wie haben die Beschwerden begonnen und was war der Auslöser?',
        description: 'Der Auslöser ist eines der wichtigsten Differenzierungskriterien in der Homöopathie.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Stumpfes Trauma, Prellung, Zerschlagenheitsgefühl', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'Prellung', 'stumpfes Trauma', 'wie zerschlagen'] },
              { id: 'inj_sprain', label: 'Verstauchung, Zerrung von Bändern / Sehnen', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'Verstauchung', 'Sehnenzerrung'] },
              { id: 'inj_nerve', label: 'Quetschung nervenreicher Gewebe (Finger, Steißbein)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'Nervenverletzung', 'Quetschung'] },
              { id: 'inj_cut', label: 'Schnittwunde oder Stichverletzung', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'Stichverletzung', 'Schnittwunde'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Plötzlich & heftig nach kaltem, trockenem Wind', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'kalter Wind', 'plötzlicher Beginn', 'Trockenheit'] },
              { id: 'fev_wet', label: 'Nach Durchnässung, Unterkühlung oder feuchter Kälte', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'Durchnässung', 'feuchte Kälte'] },
              { id: 'fev_sun', label: 'Nach Sonnenstich, starker Hitzeeinwirkung oder Überhitzung', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'Hitzeeinwirkung', 'Sonnenstich'] },
              { id: 'fev_slow', label: 'Schleichend, langsam über Tage entwickelnd mit Schwere', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phosphoricum', 'schleichender Beginn', 'Schwere'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Plötzlich, heftig einsetzend (oft nach Kälte/Schreck)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'plötzlich einsetzend', 'heftig'] },
              { id: 'gen_cold_wet', label: 'Nach Unterkühlung, Durchnässung oder Zugluft', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'Unterkühlung', 'Zugluft', 'Durchnässung'] },
              { id: 'gen_stress', label: 'Nach Ärger, Zorn, Kränkung oder Stress', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'Ärger', 'Stress'] },
              { id: 'gen_slow', label: 'Schleichend / langsam zunehmend ohne klaren Auslöser', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'schleichend'] }
            ]
      },
      {
        id: 'modality',
        category: 'Modalitäten (Besser / Schlechter)',
        title: '2. Was bringt Linderung oder führt zur Verschlechterung?',
        description: 'Modalitäten sind entscheidend, um zwischen eng verwandten Akutmitteln zu unterscheiden.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Besser durch absolutes Stillliegen & festen Druck', remedyHint: 'Bryonia', relevanceKeywords: ['besser durch Ruhe', 'besser durch festen Druck', 'schlechter durch Bewegung', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Schlimmer durch Erschütterung, Licht & Geräusche', remedyHint: 'Belladonna', relevanceKeywords: ['schlechter durch Erschütterung', 'schlechter durch Licht', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Besser an frischer Luft, schlimmer im warmen Zimmer', remedyHint: 'Pulsatilla', relevanceKeywords: ['besser an frischer Luft', 'schlechter im warmen Zimmer', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Besser durch warme Umschläge & Einhüllen', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['besser durch Wärme', 'besser durch Einhüllen', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Besser durch lokale Wärme, heiße Getränke & Einhüllen', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['besser durch Wärme', 'besser durch Einhüllen', 'besser durch heiße Getränke'] },
              { id: 'mod_cold_air', label: 'Besser durch Kälte, kalte Umschläge & frische Luft', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['besser durch Kälte', 'besser durch kalte Umschläge', 'besser durch frische Luft'] },
              { id: 'mod_rest_still', label: 'Schlimmer durch geringste Bewegung (Verlangen nach absoluter Ruhe)', remedyHint: 'Bryonia', relevanceKeywords: ['schlechter durch Bewegung', 'besser durch Ruhe', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Besser durch fortgesetzte Bewegung & Positionswechsel (kann nicht stillsitzen)', remedyHint: 'Rhus tox', relevanceKeywords: ['besser durch Bewegung', 'körperliche Unruhe', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Besser durch starken Druck oder Zusammenkrümmen', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['besser durch festen Druck', 'besser durch Zusammenkrümmen', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'Gemüt & Hauptempfindung',
        title: '3. Wie ist die Gemütsstimmung und die Schmerzqualität?',
        description: 'Das Verhalten und Gemüt im Akutzustand zeigt das charakteristische Mittelbild.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Große ängstliche Unruhe, Angst, Herzklopfen', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['ängstliche Unruhe', 'Todesangst', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Zornig, gereizt, ungeduldig, will in Ruhe gelassen werden', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['zornig', 'gereizt', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Weinerlich, anhänglich, sehnt sich nach Trost & Zuwendung', remedyHint: 'Pulsatilla', relevanceKeywords: ['weinerlich', 'trostsuchend', 'Pulsatilla', 'sanftmütig'] },
          { id: 'sen_dull_heavy', label: 'Benommen, schläfrig, wie betäubt, schwere Augenlider', remedyHint: 'Gelsemium', relevanceKeywords: ['benommen', 'schläfrig', 'Gelsemium', 'schwere Glieder'] },
          { id: 'sen_burning_stinging', label: 'Brennender oder stechender Schmerz wie glühende Nadeln', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['brennender Schmerz', 'stechender Schmerz', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Intensitätsgrad (1 bis 4)',
        title: '4. Wie stark ist das Leitsymptom ausgeprägt?',
        description: 'Homöopathische Gradeinstufung von 1 bis 4 nach Samuel Hahnemann (keine 1–10 Skala).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // English fallback / default international
  return [
    {
      id: 'onset',
      category: 'Trigger & Onset (Causa)',
      title: '1. How did the symptoms begin and what was the trigger?',
      description: 'The onset and trigger are paramount for classical homeopathic remedy differentiation.',
      type: 'single',
      options: isInjury
        ? [
            { id: 'inj_blunt', label: 'Blunt trauma, contusion, bruised feeling all over', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'bruised feeling', 'blunt trauma'] },
            { id: 'inj_sprain', label: 'Sprain, strain of ligaments or tendons', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'sprain', 'strained tendons'] },
            { id: 'inj_nerve', label: 'Crush injury to nerve-rich areas (fingers, coccyx)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'nerve injury', 'crushed tissue'] },
            { id: 'inj_cut', label: 'Puncture wound or sharp laceration', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'puncture wound'] }
          ]
        : isFever
        ? [
            { id: 'fev_cold_wind', label: 'Sudden & violent after dry cold wind', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'cold dry wind', 'sudden onset'] },
            { id: 'fev_wet', label: 'After getting drenched, chilled or cold damp weather', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'damp cold', 'drenched'] },
            { id: 'fev_sun', label: 'After sun exposure, intense heat or sunstroke', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'sunstroke', 'heat exposure'] },
            { id: 'fev_slow', label: 'Slow, insidious onset over days with fatigue & heaviness', remedyHint: 'Gelsemium / Ferrum phos', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'slow onset', 'heaviness'] }
          ]
        : [
            { id: 'gen_sudden', label: 'Sudden, violent onset (often after shock or cold wind)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'sudden violent onset'] },
            { id: 'gen_cold_wet', label: 'After getting chilled, wet or exposed to a draft', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'draft', 'chilled', 'drenched'] },
            { id: 'gen_stress', label: 'After anger, vexation, mortification or acute stress', remedyHint: 'Chamomilla / Nux vomica', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'anger', 'stress'] },
            { id: 'gen_slow', label: 'Gradual, insidious onset without clear sudden trigger', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'gradual onset'] }
          ]
    },
    {
      id: 'modality',
      category: 'Key Modality (Better / Worse)',
      title: '2. What brings relief or aggravates the complaint?',
      description: 'Modalities are decisive for distinguishing between closely related acute remedies.',
      type: 'single',
      options: [
        { id: 'mod_warmth_wrap', label: 'Better from heat, warm wraps and hot drinks', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['better from heat', 'better from warmth', 'hot drinks', 'relieved by warmth'] },
        { id: 'mod_cold_air', label: 'Better from cold, cool compresses & open fresh air', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['better from cold', 'cool compresses', 'open air', 'relieved by cold'] },
        { id: 'mod_rest_still', label: 'Worse from least motion (desire for complete quiet & rest)', remedyHint: 'Bryonia', relevanceKeywords: ['worse from motion', 'better from absolute rest', 'Bryonia'] },
        { id: 'mod_motion_restless', label: 'Better from continued motion & changing posture (restless)', remedyHint: 'Rhus tox', relevanceKeywords: ['better from motion', 'restless', 'Rhus tox'] },
        { id: 'mod_hard_pressure', label: 'Better from firm pressure or doubling up', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['better from firm pressure', 'doubling up', 'Colocynthis'] }
      ]
    },
    {
      id: 'sensationMind',
      category: 'Emotional State & Core Sensation',
      title: '3. What is the emotional disposition and sensation?',
      description: 'The acute mental disposition reveals the characteristic remedy picture.',
      type: 'single',
      options: [
        { id: 'sen_fear_restless', label: 'Great anxious restlessness, fear, panic, racing pulse', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['anxious restlessness', 'fear', 'panic', 'Aconitum', 'Arsenicum'] },
        { id: 'sen_angry_irritable', label: 'Irritable, angry, snappish, intolerant of disturbance', remedyHint: 'Chamomilla / Nux vomica', relevanceKeywords: ['irritable', 'angry', 'Nux vomica', 'Chamomilla'] },
        { id: 'sen_weepy_mild', label: 'Weepy, clingy, craves consolation, gentle disposition', remedyHint: 'Pulsatilla', relevanceKeywords: ['weepy', 'craves consolation', 'Pulsatilla'] },
        { id: 'sen_dull_heavy', label: 'Dull, drowsy, heavy eyelids, trembling weakness', remedyHint: 'Gelsemium', relevanceKeywords: ['dull', 'drowsy', 'Gelsemium', 'heaviness'] },
        { id: 'sen_burning_stinging', label: 'Burning, stinging sensation like red hot needles', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['burning stinging pain', 'Apis', 'Cantharis'] }
      ]
    },
    {
      id: 'intensity',
      category: 'Intensity Grade (1 to 4)',
      title: '4. How intense is the leading symptom?',
      description: 'Classical homeopathic symptom grade 1 to 4 (strictly not a 1–10 scale).',
      type: 'scale',
      scaleMin: 1,
      scaleMax: 4
    }
  ];
}

/**
 * Combines original symptom text with selected answers to feed into matchSymptomsToRemedies.
 */
export function buildEnhancedSymptomQuery(
  baseSymptomText: string,
  answers: AcuteAnswers,
  questions: AcuteClarificationQuestion[]
): string {
  const parts: string[] = [baseSymptomText.trim()];

  questions.forEach((q) => {
    if (q.type === 'single' && q.options) {
      const selectedId = (answers as any)[q.id];
      if (selectedId) {
        const found = q.options.find((opt) => opt.id === selectedId);
        if (found) {
          parts.push(found.label);
          if (found.relevanceKeywords && found.relevanceKeywords.length > 0) {
            parts.push(found.relevanceKeywords.join(' '));
          }
        }
      }
    } else if (q.type === 'scale' && answers.intensity) {
      parts.push(`[Grad ${answers.intensity}/4 Leitsymptom]`);
    }
  });

  return parts.filter(Boolean).join(' ');
}
