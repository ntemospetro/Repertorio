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
 * Fully localized for all 7 supported languages: de, en, es, fr, it, el, ru.
 */
export function getAcuteClarificationQuestions(
  inputText: string,
  lang: LanguageCode = 'de'
): AcuteClarificationQuestion[] {
  const norm = (inputText || '').toLowerCase();

  // Multi-lingual symptom detection
  const isInjury = 
    norm.includes('verletz') || norm.includes('sturz') || norm.includes('trauma') || norm.includes('prell') || norm.includes('wunde') ||
    norm.includes('injur') || norm.includes('fall') || norm.includes('sprain') || norm.includes('bruis') || norm.includes('wound') ||
    norm.includes('lesión') || norm.includes('lesion') || norm.includes('herida') || norm.includes('golpe') || norm.includes('caída') || norm.includes('caida') ||
    norm.includes('bless') || norm.includes('chute') || norm.includes('plaie') || norm.includes('contusion') ||
    norm.includes('ferita') || norm.includes('caduta') || norm.includes('botta') ||
    norm.includes('τραύμα') || norm.includes('τραυμα') || norm.includes('πτώση') || norm.includes('πτωση') || norm.includes('πληγή') || norm.includes('πληγη') ||
    norm.includes('травм') || norm.includes('ушиб') || norm.includes('ран') || norm.includes('паден');

  const isFever = 
    norm.includes('fieber') || norm.includes('fever') || norm.includes('fièvre') || norm.includes('fievre') || 
    norm.includes('fiebre') || norm.includes('febbre') || norm.includes('πυρετ') || norm.includes('лихорад') || norm.includes('жар') ||
    norm.includes('gripp') || norm.includes('flu') || norm.includes('grippe') || norm.includes('gripe') || norm.includes('influenza') || norm.includes('γρίπ') || norm.includes('грипп');

  const isHead = 
    norm.includes('kopf') || norm.includes('head') || norm.includes('tête') || norm.includes('tete') || 
    norm.includes('cabeza') || norm.includes('testa') || norm.includes('κεφάλ') || norm.includes('κεφαλ') || norm.includes('голов') ||
    norm.includes('migr') || norm.includes('cefal') || norm.includes('ημικραν');

  // --- 1. DEUTSCH (DE) ---
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

  // --- 2. ESPAÑOL (ES) ---
  if (lang === 'es') {
    return [
      {
        id: 'onset',
        category: 'Desencadenante e Inicio (Causa)',
        title: '1. ¿Cómo comenzaron las molestias y cuál fue el desencadenante?',
        description: 'El desencadenante es uno de los criterios de diferenciación más importantes en homeopatía.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Traumatismo cerrado, contusión, sensación de magulladura', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'contusión', 'traumatismo', 'magulladura'] },
              { id: 'inj_sprain', label: 'Esguince, distensión de ligamentos o tendones', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'esguince', 'distensión tendones'] },
              { id: 'inj_nerve', label: 'Aplastamiento de tejidos ricos en nervios (dedos, cóccix)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'lesión nerviosa', 'aplastamiento'] },
              { id: 'inj_cut', label: 'Herida punzante o corte profundo', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'herida punzante', 'corte'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Repentino y violento tras viento frío y seco', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'viento frío', 'inicio brusco', 'fiebre súbita'] },
              { id: 'fev_wet', label: 'Tras mojarse, enfriamiento o frío húmedo', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'mojarse', 'frío húmedo'] },
              { id: 'fev_sun', label: 'Tras insolación, fuerte calor o sobrecalentamiento', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'insolación', 'golpe de calor'] },
              { id: 'fev_slow', label: 'Lento, progresivo en varios días con pesadez', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'inicio insidioso', 'pesadez'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Inicio brusco y violento (a menudo tras frío o susto)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'inicio brusco', 'violento'] },
              { id: 'gen_cold_wet', label: 'Tras enfriamiento, mojarse o corrientes de aire', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'enfriamiento', 'mojarse', 'corriente de aire'] },
              { id: 'gen_stress', label: 'Tras enfado, ira, indignación o estrés agudo', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'ira', 'estrés'] },
              { id: 'gen_slow', label: 'Progresivo, insidioso y sin causa aguda evidente', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'insidioso', 'progresivo'] }
            ]
      },
      {
        id: 'modality',
        category: 'Modalidades (Mejora / Empeoramiento)',
        title: '2. ¿Qué alivia o empeora las molestias?',
        description: 'Las modalidades son decisivas para distinguir entre medicamentos agudos afines.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Mejora con reposo absoluto y presión firme', remedyHint: 'Bryonia', relevanceKeywords: ['mejora por reposo', 'mejora por presión', 'empeora por movimiento', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Empeora con sacudidas, luz y ruidos', remedyHint: 'Belladonna', relevanceKeywords: ['empeora por sacudidas', 'empeora por luz', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Mejora al aire libre fresco, empeora en habitación caliente', remedyHint: 'Pulsatilla', relevanceKeywords: ['mejora aire libre', 'empeora habitación caliente', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Mejora con calor, compresas calientes y abrigarse', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['mejora por calor', 'abrigarse', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Mejora con calor local, bebidas calientes y abrigarse', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['mejora por calor', 'bebidas calientes', 'abrigarse', 'Arsenicum'] },
              { id: 'mod_cold_air', label: 'Mejora con frío, compresas frescas y aire libre', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['mejora por frío', 'compresas frías', 'aire fresco', 'Apis'] },
              { id: 'mod_rest_still', label: 'Empeora con el menor movimiento (deseo de reposo absoluto)', remedyHint: 'Bryonia', relevanceKeywords: ['empeora por movimiento', 'mejora por reposo', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Mejora con el movimiento continuo y cambiar de postura (inquietud)', remedyHint: 'Rhus tox', relevanceKeywords: ['mejora por movimiento', 'inquietud', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Mejora con presión fuerte o doblándose en dos', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['mejora por presión fuerte', 'doblarse', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'Estado de Ánimo y Sensación Principal',
        title: '3. ¿Cuál es el estado anímico y el tipo de sensación o dolor?',
        description: 'El comportamiento y el ánimo en estado agudo revelan la imagen característica del remedio.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Gran inquietud ansiosa, miedo, angustia, palpitaciones', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['inquietud ansiosa', 'miedo a morir', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Irascible, irritable, impaciente, quiere que le dejen en paz', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['irritable', 'ira', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Lloroso, apegado, anhela consuelo y compañía', remedyHint: 'Pulsatilla', relevanceKeywords: ['lloroso', 'busca consuelo', 'Pulsatilla', 'dócil'] },
          { id: 'sen_dull_heavy', label: 'Aturdido, somnoliento, embotado, pesadez de párpados', remedyHint: 'Gelsemium', relevanceKeywords: ['aturdido', 'somnoliento', 'Gelsemium', 'pesadez'] },
          { id: 'sen_burning_stinging', label: 'Dolor ardiente o punzante como agujas al rojo vivo', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['dolor ardiente', 'dolor punzante', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Grado de Intensidad (1 a 4)',
        title: '4. ¿Con qué intensidad se manifiesta el síntoma guía?',
        description: 'Graduación homeopática clásica de 1 a 4 según Samuel Hahnemann (no escala 1–10).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // --- 3. FRANÇAIS (FR) ---
  if (lang === 'fr') {
    return [
      {
        id: 'onset',
        category: 'Facteur déclenchant & Début (Causa)',
        title: '1. Comment les symptômes ont-ils commencé et quel a été le déclencheur ?',
        description: 'Le facteur déclenchant est l’un des critères de différenciation les plus importants en homéopathie.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Traumatisme contondant, contusion, courbature générale', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'contusion', 'traumatisme', 'courbature'] },
              { id: 'inj_sprain', label: 'Entorse, élongation des ligaments ou tendons', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'entorse', 'élongation'] },
              { id: 'inj_nerve', label: 'Écrasement de zones riches en nerfs (doigts, coccyx)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'lésion nerveuse', 'écrasement'] },
              { id: 'inj_cut', label: 'Plaie par coupure ou piqûre profonde', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'piqûre', 'coupure'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Brutal & violent après exposition au vent sec et froid', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'vent froid', 'début brutal', 'fièvre soudaine'] },
              { id: 'fev_wet', label: 'Après avoir été trempé, refroidi ou par froid humide', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'refroidissement', 'humidité'] },
              { id: 'fev_sun', label: 'Après coup de soleil, forte chaleur ou surchauffe', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'coup de soleil', 'chaleur'] },
              { id: 'fev_slow', label: 'Lent, insidieux sur plusieurs jours avec lourdeur', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'début insidieux', 'lourdeur'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Début brutal et violent (souvent après grand froid ou peur)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'début brutal', 'violent'] },
              { id: 'gen_cold_wet', label: 'Après coup de froid, humidité ou courant d’air', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'coup de froid', 'courant air'] },
              { id: 'gen_stress', label: 'Après colère, contrariété, vexation ou stress aigu', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'colère', 'stress'] },
              { id: 'gen_slow', label: 'Progressif, insidieux sans cause aiguë évidente', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'progressif'] }
            ]
      },
      {
        id: 'modality',
        category: 'Modalités (Amélioration / Aggravation)',
        title: '2. Qu’est-ce qui soulage ou aggrave les symptômes ?',
        description: 'Les modalités sont décisives pour différencier les remèdes aigus apparentés.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Amélioration par le repos absolu et forte pression', remedyHint: 'Bryonia', relevanceKeywords: ['mieux par repos', 'mieux par pression', 'pire par mouvement', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Aggravation par secousses, lumière et bruit', remedyHint: 'Belladonna', relevanceKeywords: ['pire par secousses', 'pire par lumière', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Amélioration à l’air frais, aggravation en pièce chaude', remedyHint: 'Pulsatilla', relevanceKeywords: ['mieux à air frais', 'pire en pièce chaude', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Amélioration par compresses chaudes et emmaillotement', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['mieux par chaleur', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Amélioration par chaleur locale, boissons chaudes et couvertures', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['mieux par chaleur', 'boissons chaudes', 'Arsenicum'] },
              { id: 'mod_cold_air', label: 'Amélioration par le froid, compresses fraîches et air libre', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['mieux par froid', 'compresses fraîches', 'air frais', 'Apis'] },
              { id: 'mod_rest_still', label: 'Aggravation au moindre mouvement (désir de repos absolu)', remedyHint: 'Bryonia', relevanceKeywords: ['pire par mouvement', 'mieux par repos', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Amélioration par mouvement continu et changement de position (agitation)', remedyHint: 'Rhus tox', relevanceKeywords: ['mieux par mouvement', 'agitation', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Amélioration par forte pression ou en se pliant en deux', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['mieux par forte pression', 'plié en deux', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'État d’esprit & Sensation principale',
        title: '3. Quelle est la disposition d’esprit et la nature de la douleur ?',
        description: 'Le comportement et l’humeur dans l’état aigu révèlent le tableau caractéristique du remède.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Grande agitation anxieuse, peur, angoisse, palpitations', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['agitation anxieuse', 'angoisse', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Colérique, irritable, impatient, ne supporte pas d’être dérangé', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['irritable', 'colère', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Plaintif, doux, affectueux, cherche consolation et réconfort', remedyHint: 'Pulsatilla', relevanceKeywords: ['plaintif', 'consolation', 'Pulsatilla', 'doux'] },
          { id: 'sen_dull_heavy', label: 'Hébété, somnolent, engourdi, paupières lourdes et faiblesse', remedyHint: 'Gelsemium', relevanceKeywords: ['hébété', 'somnolent', 'Gelsemium', 'paupières lourdes'] },
          { id: 'sen_burning_stinging', label: 'Douleur brûlante ou piquante comme des aiguilles brûlantes', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['douleur brûlante', 'douleur piquante', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Degré d’intensité (1 à 4)',
        title: '4. Quelle est l’intensité du symptôme clé ?',
        description: 'Gradation homéopathique classique de 1 à 4 selon Samuel Hahnemann (pas d’échelle 1–10).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // --- 4. ITALIANO (IT) ---
  if (lang === 'it') {
    return [
      {
        id: 'onset',
        category: 'Fattore scatenante ed Esordio (Causa)',
        title: '1. Come sono iniziati i sintomi e qual è stato il fattore scatenante?',
        description: 'Il fattore scatenante è uno dei criteri di differenziazione più importanti in omeopatia.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Trauma contusivo, contusione, indolenzimento generale', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'contusione', 'trauma', 'indolenzimento'] },
              { id: 'inj_sprain', label: 'Distorsione, stiramento di legamenti o tendini', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'distorsione', 'stiramento'] },
              { id: 'inj_nerve', label: 'Schiacciamento di aree ricche di nervi (dita, coccige)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'lesione nervosa', 'schiacciamento'] },
              { id: 'inj_cut', label: 'Ferita da taglio o puntura profonda', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'ferita puntura', 'taglio'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Improvviso e violento dopo vento freddo e asciutto', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'vento freddo', 'esordio improvviso', 'febbre alta'] },
              { id: 'fev_wet', label: 'Dopo essersi bagnati, raffreddamento o freddo umido', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'bagnati', 'freddo umido'] },
              { id: 'fev_sun', label: 'Dopo colpo di sole, calore intenso o surriscaldamento', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'colpo di sole', 'calore'] },
              { id: 'fev_slow', label: 'Lento, insidioso nell’arco di giorni con pesantezza', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'esordio insidioso', 'pesantezza'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Esordio improvviso e violento (spesso dopo freddo o spavento)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'esordio improvviso', 'violento'] },
              { id: 'gen_cold_wet', label: 'Dopo raffreddamento, umidità o correnti d’aria', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'raffreddamento', 'corrente aria'] },
              { id: 'gen_stress', label: 'Dopo rabbia, collera, contrarietà o stress acuto', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'rabbia', 'stress'] },
              { id: 'gen_slow', label: 'Progressivo, insidioso senza causa acuta evidente', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'progressivo'] }
            ]
      },
      {
        id: 'modality',
        category: 'Modalità (Miglioramento / Peggioramento)',
        title: '2. Che cosa reca sollievo o provoca peggioramento?',
        description: 'Le modalità sono decisive per distinguere rimedi acuti strettamente correlati.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Migliora con il riposo assoluto e forte pressione', remedyHint: 'Bryonia', relevanceKeywords: ['migliora riposo', 'migliora pressione', 'peggiora movimento', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Peggiora con scosse, luce intensa e rumori', remedyHint: 'Belladonna', relevanceKeywords: ['peggiora scosse', 'peggiora luce', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Migliora all’aria fresca, peggiora in stanza calda', remedyHint: 'Pulsatilla', relevanceKeywords: ['migliora aria fresca', 'peggiora stanza calda', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Migliora con impacchi caldi e coprendosi bene', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['migliora calore', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Migliora con calore locale, bevande calde e coperte', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['migliora calore', 'bevande calde', 'Arsenicum'] },
              { id: 'mod_cold_air', label: 'Migliora con il freddo, impacchi freschi e aria aperta', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['migliora freddo', 'impacchi freschi', 'aria aperta', 'Apis'] },
              { id: 'mod_rest_still', label: 'Peggiora al minimo movimento (desiderio di immobilità assoluta)', remedyHint: 'Bryonia', relevanceKeywords: ['peggiora movimento', 'migliora riposo', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Migliora con il movimento continuo e cambiando postura (irrequietezza)', remedyHint: 'Rhus tox', relevanceKeywords: ['migliora movimento', 'irrequietezza', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Migliora con forte pressione o piegandosi in due', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['migliora forte pressione', 'piegarsi', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'Stato d’animo e Sensazione principale',
        title: '3. Qual è lo stato d’animo e la qualità del dolore o della sensazione?',
        description: 'Il comportamento e l’umore nello stato acuto rivelano il quadro caratteristico del rimedio.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Grande irrequietezza ansiosa, paura, angoscia, palpitazioni', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['irrequietezza ansiosa', 'paura', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Collerico, irritabile, impaziente, vuole essere lasciato in pace', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['irritabile', 'collera', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Piagnucoloso, docile, desidera consolazione e affetto', remedyHint: 'Pulsatilla', relevanceKeywords: ['piagnucoloso', 'consolazione', 'Pulsatilla', 'mite'] },
          { id: 'sen_dull_heavy', label: 'Intontito, sonnolento, ottuso, palpebre pesanti e debolezza', remedyHint: 'Gelsemium', relevanceKeywords: ['intontito', 'sonnolento', 'Gelsemium', 'palpebre pesanti'] },
          { id: 'sen_burning_stinging', label: 'Dolore bruciante o pungente come aghi arroventati', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['dolore bruciante', 'dolore pungente', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Grado di intensità (da 1 a 4)',
        title: '4. Quanto è marcato il sintomo guida?',
        description: 'Gradazione omeopatica classica da 1 a 4 secondo Samuel Hahnemann (nessuna scala 1–10).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // --- 5. ΕΛΛΗΝΙΚΑ (EL) ---
  if (lang === 'el') {
    return [
      {
        id: 'onset',
        category: 'Αιτία & Έναρξη (Causa)',
        title: '1. Πώς ξεκίνησαν τα συμπτώματα και ποιο ήταν το έναυσμα;',
        description: 'Η αιτία έναρξης είναι ένα από τα σημαντικότερα κριτήρια διαφοροποίησης στην ομοιοπαθητική.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Αμβλύ τραύμα, μώλωπας, αίσθηση μωλωπισμού σε όλο το σώμα', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'μώλωπας', 'τραύμα', 'μωλωπισμός'] },
              { id: 'inj_sprain', label: 'Διάστρεμμα, διάταση/τραυματισμός συνδέσμων ή τενόντων', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'διάστρεμμα', 'τένοντες'] },
              { id: 'inj_nerve', label: 'Σύνθλιψη περιοχών πλούσιων σε νεύρα (δάχτυλα, κόκκυγας)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'νευρικός τραυματισμός', 'σύνθλιψη'] },
              { id: 'inj_cut', label: 'Νυγμώδες (τρύπημα) ή βαθύ τραύμα από κοπή', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'νυγμός', 'κόψιμο'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Αιφνίδια & έντονη έναρξη μετά από ξηρό, παγωμένο άνεμο', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'παγωμένος άνεμος', 'αιφνίδια έναρξη', 'πυρετός'] },
              { id: 'fev_wet', label: 'Μετά από βρέξιμο, υποθερμία ή υγρό ψύχος', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'βρέξιμο', 'υγρό ψύχος'] },
              { id: 'fev_sun', label: 'Μετά από ηλίαση, υπερβολική ζέστη ή υπερθέρμανση', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'ηλίαση', 'ζέστη'] },
              { id: 'fev_slow', label: 'Βαθμιαία, αργή έναρξη σε διάστημα ημερών με βάρος', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'ύπουλη έναρξη', 'βάρος'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Αιφνίδια, βίαιη έναρξη (συχνά μετά από σοκ ή έντονο ψύχος)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'αιφνίδια έναρξη', 'βίαιη'] },
              { id: 'gen_cold_wet', label: 'Μετά από υποθερμία, βρέξιμο ή ρεύματα αέρα', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'υποθερμία', 'ρεύμα αέρα'] },
              { id: 'gen_stress', label: 'Μετά από θυμό, οργή, προσβολή ή έντονο στρες', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'θυμός', 'στρες'] },
              { id: 'gen_slow', label: 'Βαθμιαία, ύπουλη εξέλιξη χωρίς σαφές αιφνίδιο έναυσμα', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'βαθμιαία'] }
            ]
      },
      {
        id: 'modality',
        category: 'Τροποποιητικοί παράγοντες (Καλύτερα / Χειρότερα)',
        title: '2. Τι προσφέρει ανακούφιση ή τι επιδεινώνει τα συμπτώματα;',
        description: 'Οι τροποποιητικοί παράγοντες είναι καθοριστικοί για τη διαφοροδιάγνωση μεταξύ συγγενικών οξέων φαρμάκων.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Καλύτερα με απόλυτη ακινησία και σταθερή πίεση', remedyHint: 'Bryonia', relevanceKeywords: ['καλύτερα ηρεμία', 'καλύτερα πίεση', 'χειρότερα κίνηση', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Χειρότερα από κραδασμούς, έντονο φως και θορύβους', remedyHint: 'Belladonna', relevanceKeywords: ['χειρότερα κραδασμοί', 'χειρότερα φως', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Καλύτερα στον καθαρό δροσερό αέρα, χειρότερα σε ζεστό δωμάτιο', remedyHint: 'Pulsatilla', relevanceKeywords: ['καλύτερα καθαρός αέρας', 'χειρότερα ζεστό δωμάτιο', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Καλύτερα με ζέστη, θερμές κομπρέσες και σκέπασμα', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['καλύτερα ζέστη', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Καλύτερα με τοπική ζέστη, ζεστά ροφήματα και καλό σκέπασμα', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['καλύτερα ζέστη', 'ζεστές κομπρέσες', 'Arsenicum'] },
              { id: 'mod_cold_air', label: 'Καλύτερα με κρύο, δροσερές κομπρέσες και καθαρό αέρα', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['καλύτερα κρύο', 'δροσερές κομπρέσες', 'καθαρός αέρας', 'Apis'] },
              { id: 'mod_rest_still', label: 'Χειρότερα με την παραμικρή κίνηση (επιθυμία για απόλυτη ηρεμία)', remedyHint: 'Bryonia', relevanceKeywords: ['χειρότερα κίνηση', 'καλύτερα ηρεμία', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Καλύτερα με συνεχή κίνηση και αλλαγή στάσης (σωματική ανησυχία)', remedyHint: 'Rhus tox', relevanceKeywords: ['καλύτερα κίνηση', 'ανησυχία', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Καλύτερα με ισχυρή πίεση ή δίπλωμα στα δύο', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['καλύτερα ισχυρή πίεση', 'δίπλωμα', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'Ψυχική διάθεση & Κύρια αίσθηση',
        title: '3. Ποια είναι η ψυχική κατάσταση και ο χαρακτήρας του πόνου;',
        description: 'Η συμπεριφορά και η ψυχική διάθεση στην οξεία φάση αποκαλύπτουν τη χαρακτηριστική εικόνα του φαρμάκου.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Έντονη ανησυχία με φόβο, αγωνία, ταχυπαλμία', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['ανησυχία με φόβο', 'αγωνία', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Ευερέθιστος, θυμωμένος, ανυπόμονος, θέλει να τον αφήσουν ήσυχο', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['ευερέθιστος', 'θυμός', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Κλαψιάρης, πράος, αναζητά παρηγοριά και στοργή', remedyHint: 'Pulsatilla', relevanceKeywords: ['κλαψιάρης', 'παρηγοριά', 'Pulsatilla', 'πράος'] },
          { id: 'sen_dull_heavy', label: 'Ζαλισμένος, νωθρός, υπνηλέος, βαριά βλέφαρα και αδυναμία', remedyHint: 'Gelsemium', relevanceKeywords: ['ζαλισμένος', 'υπνηλία', 'Gelsemium', 'βαριά βλέφαρα'] },
          { id: 'sen_burning_stinging', label: 'Καυστικός ή νυγμώδης πόνος σαν πυρωμένες βελόνες', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['καυστικός πόνος', 'νυγμώδης πόνος', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Βαθμός έντασης (1 έως 4)',
        title: '4. Πόσο έντονο είναι το κύριο καθοδηγητικό σύμπτωμα;',
        description: 'Κλασική ομοιοπαθητική διαβάθμιση από 1 έως 4 κατά τον Samuel Hahnemann (όχι κλίμακα 1–10).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // --- 6. РУССКИЙ (RU) ---
  if (lang === 'ru') {
    return [
      {
        id: 'onset',
        category: 'Причина и Начало (Causa)',
        title: '1. Как начались симптомы и что послужило причиной?',
        description: 'Причина начала — один из важнейших критериев дифференциации в классической гомеопатии.',
        type: 'single',
        options: isInjury
          ? [
              { id: 'inj_blunt', label: 'Тупая травма, ушиб, ощущение разбитости во всем теле', remedyHint: 'Arnica', relevanceKeywords: ['Arnica', 'ушиб', 'травма', 'разбитость'] },
              { id: 'inj_sprain', label: 'Растяжение связок или сухожилий', remedyHint: 'Rhus toxicodendron / Ruta', relevanceKeywords: ['Rhus tox', 'Ruta', 'растяжение связок', 'сухожилия'] },
              { id: 'inj_nerve', label: 'Сдавление зон, богатых нервами (пальцы, копчик)', remedyHint: 'Hypericum', relevanceKeywords: ['Hypericum', 'травма нерва', 'сдавление'] },
              { id: 'inj_cut', label: 'Колотая рана или глубокий порез', remedyHint: 'Ledum / Staphisagria', relevanceKeywords: ['Ledum', 'Staphisagria', 'колотая рана', 'порез'] }
            ]
          : isFever
          ? [
              { id: 'fev_cold_wind', label: 'Внезапное и бурное начало после сухого холодного ветра', remedyHint: 'Aconitum', relevanceKeywords: ['Aconitum', 'холодный ветер', 'внезапное начало', 'лихорадка'] },
              { id: 'fev_wet', label: 'После промокания, переохлаждения или сырого холода', remedyHint: 'Rhus toxicodendron / Dulcamara', relevanceKeywords: ['Rhus tox', 'Dulcamara', 'промокание', 'сырой холод'] },
              { id: 'fev_sun', label: 'После солнечного удара, перегрева или сильной жары', remedyHint: 'Belladonna / Glonoinum', relevanceKeywords: ['Belladonna', 'Glonoinum', 'солнечный удар', 'жара'] },
              { id: 'fev_slow', label: 'Медленное, постепенное развитие в течение дней с тяжестью', remedyHint: 'Gelsemium / Ferrum phosphoricum', relevanceKeywords: ['Gelsemium', 'Ferrum phos', 'медленное начало', 'тяжесть'] }
            ]
          : [
              { id: 'gen_sudden', label: 'Внезапное, бурное начало (часто после холода или испуга)', remedyHint: 'Aconitum / Belladonna', relevanceKeywords: ['Aconitum', 'Belladonna', 'внезапное начало', 'бурное'] },
              { id: 'gen_cold_wet', label: 'После переохлаждения, промокания или сквозняка', remedyHint: 'Rhus tox / Dulcamara', relevanceKeywords: ['Rhus tox', 'переохлаждение', 'сквозняк'] },
              { id: 'gen_stress', label: 'После гнева, досады, обиды или острого стресса', remedyHint: 'Chamomilla / Nux vomica / Colocynthis', relevanceKeywords: ['Chamomilla', 'Nux vomica', 'Colocynthis', 'гнев', 'стресс'] },
              { id: 'gen_slow', label: 'Постепенное, медленное нарастание без явной острой причины', remedyHint: 'Bryonia / Gelsemium', relevanceKeywords: ['Bryonia', 'Gelsemium', 'постепенное'] }
            ]
      },
      {
        id: 'modality',
        category: 'Модальности (Улучшение / Ухудшение)',
        title: '2. Что приносит облегчение или ухудшает состояние?',
        description: 'Модальности имеют решающее значение для выбора между сходными острыми средствами.',
        type: 'single',
        options: isHead
          ? [
              { id: 'mod_still_press', label: 'Улучшение в абсолютном покое и от сильного давления', remedyHint: 'Bryonia', relevanceKeywords: ['лучше в покое', 'лучше от давления', 'хуже от движения', 'Bryonia'] },
              { id: 'mod_dark_cold', label: 'Ухудшение от сотрясения, яркого света и шума', remedyHint: 'Belladonna', relevanceKeywords: ['хуже от сотрясения', 'хуже от света', 'Belladonna'] },
              { id: 'mod_fresh_air', label: 'Улучшение на свежем прохладном воздухе, хуже в теплой комнате', remedyHint: 'Pulsatilla', relevanceKeywords: ['лучше на свежем воздухе', 'хуже в тепле', 'Pulsatilla'] },
              { id: 'mod_warmth', label: 'Улучшение от тепла, теплых компрессов и укутывания', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['лучше от тепла', 'Arsenicum'] }
            ]
          : [
              { id: 'mod_warmth_wrap', label: 'Улучшение от местного тепла, горячих напитков и укутывания', remedyHint: 'Arsenicum album / Rhus tox', relevanceKeywords: ['лучше от тепла', 'горячие напитки', 'Arsenicum'] },
              { id: 'mod_cold_air', label: 'Улучшение от холода, прохладных компрессов и свежего воздуха', remedyHint: 'Apis / Pulsatilla', relevanceKeywords: ['лучше от холода', 'прохладные компрессы', 'свежий воздух', 'Apis'] },
              { id: 'mod_rest_still', label: 'Ухудшение от малейшего движения (потребность в абсолютном покое)', remedyHint: 'Bryonia', relevanceKeywords: ['хуже от движения', 'лучше в покое', 'Bryonia'] },
              { id: 'mod_motion_restless', label: 'Улучшение от непрерывного движения и смены позы (беспокойство)', remedyHint: 'Rhus tox', relevanceKeywords: ['лучше от движения', 'беспокойство', 'Rhus tox'] },
              { id: 'mod_hard_pressure', label: 'Улучшение от сильного давления или сгибания пополам', remedyHint: 'Colocynthis / Bryonia', relevanceKeywords: ['лучше от сильного давления', 'сгибание пополам', 'Colocynthis'] }
            ]
      },
      {
        id: 'sensationMind',
        category: 'Психическое состояние и Основное ощущение',
        title: '3. Каково душевное состояние и характер боли?',
        description: 'Поведение и настроение в остром состоянии раскрывают характерную картину препарата.',
        type: 'single',
        options: [
          { id: 'sen_fear_restless', label: 'Сильное тревожное беспокойство, страх, паника, сердцебиение', remedyHint: 'Aconitum / Arsenicum', relevanceKeywords: ['тревожное беспокойство', 'страх смерти', 'Aconitum', 'Arsenicum'] },
          { id: 'sen_angry_irritable', label: 'Сердитый, раздражительный, нетерпеливый, хочет остаться один', remedyHint: 'Chamomilla / Nux vomica / Bryonia', relevanceKeywords: ['раздражительный', 'гнев', 'Nux vomica', 'Chamomilla'] },
          { id: 'sen_weepy_mild', label: 'Плаксивый, мягкий, ласковый, жаждет утешения и поддержки', remedyHint: 'Pulsatilla', relevanceKeywords: ['плаксивый', 'утешение', 'Pulsatilla', 'мягкий'] },
          { id: 'sen_dull_heavy', label: 'Оглушенный, сонливый, заторможенный, тяжелые веки и слабость', remedyHint: 'Gelsemium', relevanceKeywords: ['оглушенный', 'сонливый', 'Gelsemium', 'тяжелые веки'] },
          { id: 'sen_burning_stinging', label: 'Жгучая или колющая боль, как от раскаленных игл', remedyHint: 'Apis / Cantharis', relevanceKeywords: ['жгучая боль', 'колющая боль', 'Apis'] }
        ]
      },
      {
        id: 'intensity',
        category: 'Степень интенсивности (от 1 до 4)',
        title: '4. Насколько выражен ведущий симптом?',
        description: 'Классическая гомеопатическая градация от 1 до 4 по Самуэлю Ганеману (не шкала 1–10).',
        type: 'scale',
        scaleMin: 1,
        scaleMax: 4
      }
    ];
  }

  // --- 7. ENGLISH (EN) - Default fallback ---
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
      options: isHead
        ? [
            { id: 'mod_still_press', label: 'Better from quiet rest & firm pressure', remedyHint: 'Bryonia', relevanceKeywords: ['better from rest', 'better from pressure', 'worse from motion', 'Bryonia'] },
            { id: 'mod_dark_cold', label: 'Worse from jarring, light & noise', remedyHint: 'Belladonna', relevanceKeywords: ['worse from jarring', 'worse from light', 'Belladonna'] },
            { id: 'mod_fresh_air', label: 'Better in open fresh air, worse in warm room', remedyHint: 'Pulsatilla', relevanceKeywords: ['better in fresh air', 'worse in warm room', 'Pulsatilla'] },
            { id: 'mod_warmth', label: 'Better from warm compresses & wrapping up warm', remedyHint: 'Arsenicum album / Silicea', relevanceKeywords: ['better from warmth', 'Arsenicum'] }
          ]
        : [
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
      parts.push(`[${answers.intensity}/4]`);
    }
  });

  return parts.filter(Boolean).join(' ');
}
