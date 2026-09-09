import { getLocalizedRemedies, LocalizedRemedy } from '../data/materiaMedicaData';
import { LanguageCode } from '../types';

export type SymptomWeightGrade = 1 | 2 | 3 | 4;

export interface BoerickeRubric {
  id: string;
  chapter: string;
  rubricName: string;
  keywords: string[];
  remedyGrades: Record<string, SymptomWeightGrade>; // remedy id or normalized key -> grade 1..4
}

export interface RepertoriumSymptomInput {
  id: string;
  text: string;
  weight: SymptomWeightGrade;
}

export interface RemedySymptomHit {
  symptomIndex: number;
  symptomText: string;
  weight: SymptomWeightGrade;
  remedyGrade: SymptomWeightGrade;
  points: number;
  matchedBoerickeExcerpt: string;
}

export interface BoerickeRepertorisationResult {
  remedy: LocalizedRemedy;
  totalScore: number;
  coveredSymptomsCount: number;
  totalSymptomsCount: number;
  coveragePercentage: number;
  isFullMatch: boolean;
  hits: RemedySymptomHit[];
}

/**
 * Authentic clinical Boericke Repertory Rubrics with authentic Boericke grades:
 * Grade 3: Bold / Primary Keynote
 * Grade 2: Italic / Confirmed clinical rubric
 * Grade 1: Plain / Verfied therapeutic hit
 */
export const BOERICKE_CANONICAL_RUBRICS: BoerickeRubric[] = [
  // MIND / GEMÜT
  {
    id: 'mind_fear_death_panic',
    chapter: 'Mind',
    rubricName: 'MIND - Fear of death, sudden panic and physical restlessness',
    keywords: ['todesangst', 'panik', 'angst', 'ruhelosigkeit', 'unruhe', 'fear of death', 'panic', 'restlessness', 'miedo a la muerte', 'peur de la mort', 'paura di morire', 'φόβος θανάτου', 'страх смерти'],
    remedyGrades: {
      'aconitum-napellus': 4,
      'arsenicum-album': 4,
      'gelsemium-sempervirens': 2,
      'argentum-nitricum': 2,
      'belladonna': 2,
      'rhus-toxicodendron': 2,
      'phosphorus': 2,
      'veratrum-album': 2,
      'chamomilla': 1,
    }
  },
  {
    id: 'mind_weeping_gentle_consolation',
    chapter: 'Mind',
    rubricName: 'MIND - Weeping easily, gentle, yielding disposition, craves consolation',
    keywords: ['weint leicht', 'trost', 'sanftmütig', 'anhänglich', 'weinen', 'weinerlich', 'weeps easily', 'consolation', 'gentle', 'llora con facilidad', 'pleure facilement', 'piange facilmente', 'κλαίει εύκολα', 'плаксивость'],
    remedyGrades: {
      'pulsatilla-pratensis': 4,
      'ignatia-amara': 3,
      'sepia-officinalis': 2,
      'natrium-muriaticum': 2,
      'silicea': 2,
      'staphisagria': 1,
    }
  },
  {
    id: 'mind_irritability_anger_oversensitive',
    chapter: 'Mind',
    rubricName: 'MIND - Irritable, impatient, angry at trifles, oversensitive to noise and light',
    keywords: ['gereizt', 'zorn', 'ungeduld', 'wut', 'lärmempfindlich', 'überempfindlich', 'irritable', 'anger', 'impatient', 'oversensitive', 'irritable', 'colère', 'irritabile', 'ευερέθιστος', 'раздражительность'],
    remedyGrades: {
      'nux-vomica': 4,
      'chamomilla': 4,
      'bryonia-alba': 2,
      'colocynthis': 2,
      'hepar-sulfuris': 2,
      'staphisagria': 2,
      'lycopodium-clavatum': 2,
      'arsenicum-album': 1,
    }
  },
  {
    id: 'mind_grief_sighing_brooding',
    chapter: 'Mind',
    rubricName: 'MIND - Silent grief, brooding, frequent sighing, emotional shock',
    keywords: ['kummer', 'trauer', 'seufzen', 'still', 'emotionaler schock', 'silent grief', 'brooding', 'sighing', 'pena silenciosa', 'chagrin silencieux', 'dolore silencioso', 'θλίψη', 'горе'],
    remedyGrades: {
      'ignatia-amara': 4,
      'natrium-muriaticum': 4,
      'phosphoricum-acidum': 2,
      'causticum': 2,
      'staphisagria': 2,
      'gels-sempervirens': 1,
    }
  },

  // HEAD / KOPF
  {
    id: 'head_throbbing_congestive_jarring',
    chapter: 'Head',
    rubricName: 'HEAD - Throbbing, violent congestive headache, aggravated by jarring and motion',
    keywords: ['pochend', 'hämmernd', 'kopfschmerz pochend', 'erschütterung', 'roter kopf', 'blutandrang', 'throbbing', 'congestive', 'jarring', 'pulsátil', 'pulsatile', 'pulsante', 'σφυγμικός', 'пульсирующая головная боль'],
    remedyGrades: {
      'belladonna': 4,
      'glonoinum': 4,
      'bryonia-alba': 2,
      'melilotus-officinalis': 2,
      'gelsemium-sempervirens': 2,
      'natrium-muriaticum': 2,
      'ferrum-phosphoricum': 2,
      'sanguinaria-canadensis': 2,
      'spigelia-anthelmia': 1,
    }
  },
  {
    id: 'head_bursting_stitching_motion_agg',
    chapter: 'Head',
    rubricName: 'HEAD - Stitching, bursting pain, worse from slightest motion or eye movement',
    keywords: ['stechend', 'berstend', 'bewegung verschlimmert', 'augenbewegung', 'kopf festhalten', 'stitching', 'bursting', 'worse motion', 'punzante', 'transperçant', 'pungente', 'σουβλιές', 'колющая боль'],
    remedyGrades: {
      'bryonia-alba': 4,
      'belladonna': 2,
      'kali-carbonicum': 2,
      'spigelia-anthelmia': 2,
      'silicea': 2,
      'nux-vomica': 1,
    }
  },
  {
    id: 'head_occipital_heavy_drooping_eyelids',
    chapter: 'Head',
    rubricName: 'HEAD - Occipital headache radiating forward, dull heavy feeling with drooping eyelids',
    keywords: ['hinterkopf', 'schwere augenlider', 'benommen', 'nacken', 'dunkelheit', 'occipital', 'heavy eyelids', 'dull', 'párpados pesados', 'paupières lourdes', 'palpebre pesanti', 'βλέφαρα', 'тяжелые веки'],
    remedyGrades: {
      'gelsemium-sempervirens': 4,
      'silicea': 2,
      'cocculus-indicus': 2,
      'sanguinaria-canadensis': 2,
      'picricum-acidum': 2,
      'bryonia-alba': 1,
    }
  },
  {
    id: 'head_sun_heat_agg',
    chapter: 'Head',
    rubricName: 'HEAD - Headache from sun exposure, overheating or radiant heat',
    keywords: ['sonne', 'hitze', 'sonnenstich', 'überhitzung', 'sun exposure', 'heat', 'sol', 'soleil', 'sole', 'ήλιος', 'солнце'],
    remedyGrades: {
      'glonoinum': 3,
      'belladonna': 3,
      'natrium-carbonicum': 3,
      'natrium-muriaticum': 2,
      'gelsemium-sempervirens': 2,
      'lachesis-muta': 1,
    }
  },

  // RESPIRATORY / ATMUNG
  {
    id: 'resp_croup_sudden_cold_wind',
    chapter: 'Respiratory',
    rubricName: 'RESPIRATORY - Sudden suffocating croupy cough after dry cold wind, barking',
    keywords: ['krupp', 'bellend', 'kalter wind', 'heiser', 'plötzlich', 'croup', 'barking cough', 'cold wind', 'tos perruna', 'toux aboyante', 'tosse abbaiante', 'γαβγιστικός', 'лающий кашель'],
    remedyGrades: {
      'aconitum-napellus': 3,
      'spongia-tosta': 3,
      'hepar-sulfuris': 3,
      'drosera-rotundifolia': 2,
      'sambucus-nigra': 2,
      'ipecacuanha': 1,
    }
  },
  {
    id: 'resp_dry_painful_holds_chest',
    chapter: 'Respiratory',
    rubricName: 'RESPIRATORY - Dry painful cough, worse slightest motion, must hold chest',
    keywords: ['trockener husten', 'brust festhalten', 'schmerzhafter husten', 'bewegung verschlimmert', 'holds chest', 'dry cough', 'toux sèche', 'tos seca', 'tosse secca', 'ξηρός βήχας', 'сухой кашель'],
    remedyGrades: {
      'bryonia-alba': 3,
      'drosera-rotundifolia': 2,
      'phosphorus': 2,
      'rumex-crispus': 2,
      'causticum': 2,
      'hepar-sulfuris': 1,
    }
  },
  {
    id: 'resp_paroxysmal_choking_night',
    chapter: 'Respiratory',
    rubricName: 'RESPIRATORY - Paroxysmal violent choking cough, worse lying down after midnight',
    keywords: ['krampfhusten', 'anfallsartig', 'erstickend', 'nach mitternacht', 'keuchhusten', 'paroxysmal', 'choking cough', 'tos paroxística', 'toux quinteuse', 'tosse parossistica', 'σπαστικός βήχας', 'приступообразный кашель'],
    remedyGrades: {
      'drosera-rotundifolia': 3,
      'ipecacuanha': 2,
      'cuprum-metallicum': 3,
      'corallium-rubrum': 2,
      'hyoscyamus-niger': 2,
      'spongia-tosta': 1,
    }
  },
  {
    id: 'resp_rattling_mucus_weak_expulsion',
    chapter: 'Respiratory',
    rubricName: 'RESPIRATORY - Rattling of large quantities of mucus in bronchi, unable to raise it',
    keywords: ['rasseln', 'schleim', 'kann nicht abhusten', 'ersticken', 'schläfrig', 'rattling mucus', 'unable to cough up', 'estertores', 'râles', 'rantoli', 'βρόγχοι', 'хрипы'],
    remedyGrades: {
      'antimonium-tartaricum': 3,
      'ipecacuanha': 3,
      'senega': 2,
      'hepar-sulfuris': 2,
      'kali-bichromicum': 2,
      'phosphorus': 1,
    }
  },

  // GASTROINTESTINAL & STOMACH / MAGEN & DARM
  {
    id: 'gi_nausea_ineffectual_urging_hangover',
    chapter: 'Stomach',
    rubricName: 'STOMACH - Ineffectual urging to stool, nausea morning, toxic sour stomach, spasms',
    keywords: ['drang', 'verstopfung', 'übelkeit', 'kater', 'sodbrennen', 'krampf', 'ineffectual urging', 'nausea', 'spasms', 'tenesmo', 'spasmes', 'spasmi', 'σπασμοί', 'тенезмы'],
    remedyGrades: {
      'nux-vomica': 3,
      'lycopodium-clavatum': 2,
      'pulsatilla-pratensis': 2,
      'colocynthis': 2,
      'bryonia-alba': 1,
      'ignatia-amara': 1,
    }
  },
  {
    id: 'gi_burning_stomach_small_sips_warmth_better',
    chapter: 'Stomach',
    rubricName: 'STOMACH - Burning pains in epigastrium, thirst for small frequent sips, relieved by warm drinks',
    keywords: ['brennend', 'kleine schlucke', 'durst oft', 'besser wärme', 'brennender magen', 'burning stomach', 'small sips', 'warm drinks better', 'ardor', 'brûlure', 'bruciore', 'καύσος', 'жжение в желудке'],
    remedyGrades: {
      'arsenicum-album': 3,
      'phosphorus': 2,
      'iris-versicolor': 2,
      'capsicum-annuum': 2,
      'nux-vomica': 1,
    }
  },
  {
    id: 'gi_violent_colic_doubling_up_hard_pressure',
    chapter: 'Abdomen',
    rubricName: 'ABDOMEN - Violent griping colic, bending double and hard pressure brings relief',
    keywords: ['zusammenkrümmen', 'kolik', 'starker druck bessert', 'krampfartig', 'bauchschmerzen', 'bending double', 'hard pressure better', 'doblado en dos', 'plié en deux', 'piegato in due', 'διπλώνεται', 'сгибание пополам'],
    remedyGrades: {
      'colocynthis': 3,
      'magnesium-phosphoricum': 3,
      'dioscorea-villosa': 2,
      'chamomilla': 2,
      'belladonna': 1,
      'plumbum-metallicum': 1,
    }
  },
  {
    id: 'gi_flatulence_bloating_distension',
    chapter: 'Abdomen',
    rubricName: 'ABDOMEN - Excessive tympanitic distension, painful flatulence, air hunger',
    keywords: ['blähbauch', 'blähungen', 'aufgetrieben', 'luft', 'meteorismus', 'flatulence', 'bloating', 'distension', 'gases', 'ballonnements', 'gonfiore', 'τυμπανισμός', 'вздутие'],
    remedyGrades: {
      'carbo-vegetabilis': 3,
      'lycopodium-clavatum': 3,
      'china-officinalis': 3,
      'cinchona-officinalis': 3,
      'nux-vomica': 2,
      'raphanus-sativus': 2,
      'asafoetida': 1,
    }
  },

  // TRAUMA & MUSCULOSKELETAL / BEWEGUNGSAPPARAT
  {
    id: 'trauma_bruised_sore_bed_hard',
    chapter: 'Locomotor',
    rubricName: 'LOCOMOTOR - Bruised, lame soreness after blunt trauma, falls, bed feels too hard',
    keywords: ['zerschlagenheit', 'sturz', 'trauma', 'bett zu hart', 'blaue flecken', 'bruised sore', 'falls', 'bed feels too hard', 'magulladura', 'courbature', 'contusione', 'μώλωπες', 'ушиб'],
    remedyGrades: {
      'arnica-montana': 3,
      'baptisia-tinctoria': 2,
      'bellis-perennis': 3,
      'rhus-toxicodendron': 2,
      'ruta-graveolens': 2,
      'eupatorium-perfoliatum': 2,
    }
  },
  {
    id: 'loco_first_motion_worse_continued_better',
    chapter: 'Locomotor',
    rubricName: 'LOCOMOTOR - Stiffness worse on first beginning to move, relieved by continuous motion',
    keywords: ['erste bewegung schlimmer', 'fortgesetzte bewegung bessert', 'steifigkeit', 'anlaufen', 'feuchte kälte', 'first motion worse', 'continued motion better', 'primer movimiento peor', 'premier mouvement pire', 'primo movimento peggiora', 'δυσκαμψία', 'ухудшение в начале движения'],
    remedyGrades: {
      'rhus-toxicodendron': 3,
      'radium-bromatum': 2,
      'bryonia-alba': 1,
      'ruta-graveolens': 2,
      'dulcamara': 1,
      'pulsatilla-pratensis': 1,
    }
  },
  {
    id: 'loco_tendons_periosteum_sprains',
    chapter: 'Locomotor',
    rubricName: 'LOCOMOTOR - Affections of periosteum, tendons, ligaments, sprains with deep bruised lameness',
    keywords: ['sehnen', 'knochenhaut', 'verstauchung', 'sehnenansatz', 'überanstrengung', 'tendons', 'periosteum', 'sprains', 'tendones', 'tendons', 'tendini', 'τένοντες', 'сухожилия'],
    remedyGrades: {
      'ruta-graveolens': 3,
      'rhus-toxicodendron': 2,
      'symphytum-officinale': 2,
      'arnica-montana': 2,
      'strontium-carbonicum': 1,
      'calcarea-fluorica': 1,
    }
  },
  {
    id: 'trauma_nerve_injury_fingertips_spine',
    chapter: 'Locomotor',
    rubricName: 'LOCOMOTOR - Severe sharp shooting nerve pain from crushed fingertips, coccyx, spinal trauma',
    keywords: ['nervenschmerz', 'eingeklemmter finger', 'steißbein', 'einschussartig', 'nerve injury', 'fingertips', 'coccyx', 'dolor nervioso', 'nerf écrasé', 'dolore ai nervi', 'νευρικός πόνος', 'повреждение нервов'],
    remedyGrades: {
      'hypericum-perforatum': 3,
      'ledum-palustre': 2,
      'arnica-montana': 1,
      'staphisagria': 1,
    }
  },
  {
    id: 'trauma_punctured_wounds_cold_better_cold',
    chapter: 'Locomotor',
    rubricName: 'LOCOMOTOR - Puncture wounds, animal/insect bites, wound part cold to touch but relieved by ice',
    keywords: ['stichwunde', 'insektenstich', 'nageltritt', 'kalt anfassen', 'eis bessert', 'puncture wounds', 'insect bites', 'cold to touch', 'picadura', 'piqûre', 'puntura', 'τσίμπημα', 'колотая рана'],
    remedyGrades: {
      'ledum-palustre': 3,
      'apis-mellifica': 2,
      'hypericum-perforatum': 1,
      'arnica-montana': 1,
    }
  },

  // FEVER & GENERAL MODALITIES / FIEBER & ALLGEMEINES
  {
    id: 'fever_dry_burning_restless_no_sweat',
    chapter: 'Fever',
    rubricName: 'FEVER - High dry burning heat, intense thirst, dark red face, restlessness, no sweat',
    keywords: ['trockene hitze', 'kein schweiß', 'hohes fieber', 'durst', 'unruhe', 'dry burning heat', 'no sweat', 'calor seco', 'chaleur sèche', 'calore secco', 'ξηρή θερμότητα', 'сухой жар'],
    remedyGrades: {
      'aconitum-napellus': 3,
      'belladonna': 3,
      'ferrum-phosphoricum': 2,
      'gelsemium-sempervirens': 1,
      'bryonia-alba': 1,
    }
  },
  {
    id: 'fever_thirstless_stinging_burning_edema',
    chapter: 'Fever',
    rubricName: 'FEVER - Thirstless, pink edema, stinging burning pains, heat of room intolerable',
    keywords: ['durstlos', 'ödem', 'schwellung', 'stichschmerz', 'wärme unerträglich', 'thirstless', 'stinging pain', 'heat intolerable', 'sin sed', 'sans soif', 'senza sete', 'χωρίς δίψα', 'без жажды'],
    remedyGrades: {
      'apis-mellifica': 3,
      'pulsatilla-pratensis': 2,
      'gelsemium-sempervirens': 2,
      'arsenicum-album': 1,
    }
  },
  {
    id: 'fever_bone_aching_break_bone',
    chapter: 'Fever',
    rubricName: 'FEVER - Deep severe aching in bones as if broken, chill with great thirst',
    keywords: ['knochenschmerzen', 'gebrochen wie', 'grippe', 'knochenbrüchig', 'durst vor frost', 'bone aching', 'bones broken', 'dolor de huesos', 'douleur osseuse', 'dolore alle ossa', 'πόνος στα οστά', 'боль в костях'],
    remedyGrades: {
      'eupatorium-perfoliatum': 3,
      'bryonia-alba': 2,
      'rhus-toxicodendron': 2,
      'gelsemium-sempervirens': 2,
      'baptisia-tinctoria': 1,
    }
  },

  // CHARACTERISTIC BOERICKE MODALITIES
  {
    id: 'mod_better_open_air',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Amelioration from open cool fresh air',
    keywords: ['frische luft', 'besser im freien', 'kühle luft', 'fenster öffnen', 'open air better', 'aire fresco', 'air frais', 'aria fresca', 'καθαρός αέρας', 'свежий воздух'],
    remedyGrades: {
      'pulsatilla-pratensis': 3,
      'allium-cepa': 3,
      'apis-mellifica': 2,
      'argentum-nitricum': 2,
      'kali-sulphuricum': 2,
      'crocus-sativus': 1,
      'sabina': 1,
    }
  },
  {
    id: 'mod_worse_cold_dry_wind',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Aggravation from cold dry wind and drafts',
    keywords: ['kalter trockener wind', 'zugluft', 'kaltluft', 'ostwind', 'cold dry wind', 'viento frío y seco', 'vent froid et sec', 'vento freddo', 'κρύος άνεμος', 'холодный ветер'],
    remedyGrades: {
      'aconitum-napellus': 3,
      'hepar-sulfuris': 3,
      'causticum': 2,
      'nux-vomica': 2,
      'bryonia-alba': 2,
      'silicea': 2,
      'rhus-toxicodendron': 1,
    }
  },
  {
    id: 'mod_better_heat_warm_applications',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Amelioration from heat, warm room, wrapping up head warmly',
    keywords: ['wärme bessert', 'warm einpacken', 'heiße anwendungen', 'warme getränke', 'heat better', 'wrapping up', 'mejor por calor', 'mieux par la chaleur', 'migliora col calore', 'βελτίωση με θερμότητα', 'улучшение от тепла'],
    remedyGrades: {
      'arsenicum-album': 3,
      'magnesium-phosphoricum': 3,
      'hepar-sulfuris': 3,
      'silicea': 3,
      'rhus-toxicodendron': 2,
      'nux-vomica': 2,
      'causticum': 1,
    }
  },
  {
    id: 'mod_worse_motion_least',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Aggravation from the slightest motion, walking, turning',
    keywords: ['bewegung verschlimmert', 'jede bewegung', 'erschütterung', 'worse motion', 'peor por movimiento', 'pire par le mouvement', 'peggiora col movimento', 'επιδείνωση με κίνηση', 'ухудшение от движения'],
    remedyGrades: {
      'bryonia-alba': 3,
      'belladonna': 2,
      'colchicum-autumnale': 2,
      'ranunculus-bulbosus': 2,
      'spigelia-anthelmia': 2,
      'ledum-palustre': 1,
    }
  },
  {
    id: 'mod_worse_night_1_to_3_am',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Aggravation after midnight, especially 1:00 to 3:00 AM',
    keywords: ['nach mitternacht', '1 bis 3 uhr', 'nächtlich', 'wacht nachts auf', 'midnight 1 to 3 am', 'medianoche', 'après minuit', 'dopo mezzanotte', 'μετά τα μεσάνυχτα', 'после полуночи'],
    remedyGrades: {
      'arsenicum-album': 3,
      'kali-carbonicum': 2,
      'aconitum-napellus': 2,
      'rhus-toxicodendron': 1,
      'thuja-occidentalis': 1,
    }
  },
  {
    id: 'mod_worse_4_to_8_pm',
    chapter: 'Modalities',
    rubricName: 'MODALITIES - Aggravation regularly from 4:00 to 8:00 PM',
    keywords: ['16 bis 20 uhr', '4 bis 8 nachmittags', 'nachmittags verschlimmert', '4 to 8 pm', 'de 4 a 8 de la tarde', '16h à 20h', 'dalle 16 alle 20', '4 έως 8 μ.μ.', 'с 16 до 20 часов'],
    remedyGrades: {
      'lycopodium-clavatum': 3,
      'helléborus-niger': 2,
      'colocynthis': 1,
      'causticum': 1,
    }
  }
];

/**
 * Normalizes text for matching against Boericke keywords and Materia Medica text.
 * Strips diacritics, maps German ß to ss, and retains all Unicode letters (Latin, Greek, Cyrillic, etc.) and numbers.
 */
export function normalizeQuery(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts searchable tokens from a symptom query (both normalized and unaccented terms).
 */
function extractTokens(text: string): string[] {
  const norm = normalizeQuery(text);
  const raw = (text || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
  const set = new Set<string>();
  for (const t of norm.split(/\s+/)) {
    if (t.length >= 3) set.add(t);
  }
  for (const t of raw.split(/\s+/)) {
    if (t.length >= 3) set.add(t);
  }
  return Array.from(set);
}

/**
 * Checks if a query token matches target text or any token in target text (with stem/inflection support).
 */
function tokenMatches(token: string, targetNorm: string, targetWords: string[]): boolean {
  if (targetNorm.includes(token)) return true;
  if (token.length >= 4) {
    const prefix = token.slice(0, Math.min(token.length, 5));
    if (targetNorm.includes(prefix)) return true;
    for (const tw of targetWords) {
      if (tw.length >= 4) {
        if (tw.startsWith(prefix) || prefix.startsWith(tw.slice(0, 4)) || tw.includes(token) || token.includes(tw)) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Evaluates remedies using William Boericke's Repertory and Materia Medica
 * Implements 4-grade scoring (1 to 4 Stars) and progressive symptom narrowing
 */
export function performBoerickeRepertorisation(
  symptoms: RepertoriumSymptomInput[],
  language: LanguageCode,
  strictIntersectionOnly: boolean = false
): BoerickeRepertorisationResult[] {
  const allRemedies = getLocalizedRemedies(language);
  const activeSymptoms = symptoms.filter(s => s.text && s.text.trim().length > 0);

  if (activeSymptoms.length === 0) {
    return [];
  }

  const results: BoerickeRepertorisationResult[] = [];

  for (const remedy of allRemedies) {
    const hits: RemedySymptomHit[] = [];
    let totalScore = 0;

    const remedyNormId = remedy.id.toLowerCase();
    const remedyLatinNorm = normalizeQuery(remedy.latinName);
    const remedyCommonNorm = normalizeQuery(remedy.commonName);

    const rawKeynotes = (remedy.keynotes || []).join(' ');
    const normKeynotes = normalizeQuery(rawKeynotes);
    const keynoteWords = normKeynotes.split(' ').filter(w => w.length >= 3);

    const rawModalities = [...(remedy.modalitiesWorse || []), ...(remedy.modalitiesBetter || [])].join(' ');
    const normModalities = normalizeQuery(rawModalities);
    const modalityWords = normModalities.split(' ').filter(w => w.length >= 3);

    const rawIndications = (remedy.mainIndications || []).join(' ');
    const normIndications = normalizeQuery(rawIndications);
    const indicationWords = normIndications.split(' ').filter(w => w.length >= 3);

    const rawOther = [(remedy.sphereOfAction || []).join(' '), (remedy.searchKeywords || []).join(' '), remedy.essence || ''].join(' ');
    const normOther = normalizeQuery(rawOther);
    const otherWords = normOther.split(' ').filter(w => w.length >= 3);

    for (let i = 0; i < activeSymptoms.length; i++) {
      const symptom = activeSymptoms[i];
      const queryWords = extractTokens(symptom.text);

      if (queryWords.length === 0) continue;

      let matchedGrade: SymptomWeightGrade | 0 = 0;
      let matchedExcerpt = '';

      // 1. Check Canonical Boericke Rubrics
      for (const rubric of BOERICKE_CANONICAL_RUBRICS) {
        const rubricNameNorm = normalizeQuery(rubric.rubricName);
        const rubricKeywordsNorm = rubric.keywords.map(kw => normalizeQuery(kw));

        const rubricMatch = queryWords.some(w =>
          rubricKeywordsNorm.some(kw => kw.includes(w) || w.includes(kw)) ||
          rubricNameNorm.includes(w)
        );

        if (rubricMatch) {
          for (const [remKey, grade] of Object.entries(rubric.remedyGrades)) {
            const cleanKey = normalizeQuery(remKey.replace(/_/g, '-'));
            if (
              remedyNormId.includes(cleanKey) ||
              cleanKey.includes(remedyNormId) ||
              remedyLatinNorm.includes(cleanKey) ||
              remedyCommonNorm.includes(cleanKey)
            ) {
              if (grade > matchedGrade) {
                matchedGrade = grade;
                matchedExcerpt = `${rubric.rubricName} (Boericke Grad ${grade})`;
              }
            }
          }
        }
      }

      // 2. Cross-reference William Boericke Materia Medica Text
      let textHits = 0;
      let matchedSnippet = '';

      for (const word of queryWords) {
        if (tokenMatches(word, normKeynotes, keynoteWords)) {
          textHits += 3.5;
          const keynote = remedy.keynotes.find(k => normalizeQuery(k).includes(word) || k.toLowerCase().includes(word));
          if (keynote && !matchedSnippet) matchedSnippet = keynote;
        }
        if (tokenMatches(word, normModalities, modalityWords)) {
          textHits += 3.0;
          const mod = [...remedy.modalitiesWorse, ...remedy.modalitiesBetter].find(
            m => normalizeQuery(m).includes(word) || m.toLowerCase().includes(word)
          );
          if (mod && !matchedSnippet) matchedSnippet = mod;
        }
        if (tokenMatches(word, normIndications, indicationWords)) {
          textHits += 2.0;
          const ind = remedy.mainIndications.find(
            inItem => normalizeQuery(inItem).includes(word) || inItem.toLowerCase().includes(word)
          );
          if (ind && !matchedSnippet) matchedSnippet = ind;
        }
        if (tokenMatches(word, normOther, otherWords)) {
          textHits += 1.5;
        }
      }

      // If Materia Medica yielded a stronger grade than rubric, promote it
      if (textHits >= 1.5) {
        const calculatedGrade: SymptomWeightGrade =
          textHits >= 6.0 ? 4 : textHits >= 4.0 ? 3 : textHits >= 2.5 ? 2 : 1;

        if (calculatedGrade > matchedGrade) {
          matchedGrade = calculatedGrade;
          matchedExcerpt = matchedSnippet 
            ? `Materia Medica: "${matchedSnippet}"` 
            : `Boericke Leitsymptom für "${symptom.text}"`;
        }
      }

      if (matchedGrade > 0) {
        // Point formula: Symptom weight (1..4) * Remedy grade (1..4) = up to 16 points per symptom
        const points = symptom.weight * matchedGrade;
        totalScore += points;
        hits.push({
          symptomIndex: i + 1,
          symptomText: symptom.text,
          weight: symptom.weight,
          remedyGrade: matchedGrade as SymptomWeightGrade,
          points,
          matchedBoerickeExcerpt: matchedExcerpt,
        });
      }
    }

    const coveredSymptomsCount = hits.length;
    const totalSymptomsCount = activeSymptoms.length;
    const coveragePercentage = Math.round((coveredSymptomsCount / totalSymptomsCount) * 100);
    const isFullMatch = coveredSymptomsCount === totalSymptomsCount;

    if (coveredSymptomsCount > 0) {
      if (!strictIntersectionOnly || isFullMatch) {
        results.push({
          remedy,
          totalScore,
          coveredSymptomsCount,
          totalSymptomsCount,
          coveragePercentage,
          isFullMatch,
          hits,
        });
      }
    }
  }

  // Sort descending:
  // 1. Highest coverage percentage first (100% full matches at the very top)
  // 2. Highest number of covered symptoms
  // 3. Highest total repertory score (1..4 weight * 1..4 grade)
  // 4. Polychrest priority
  // 5. Alphabetical by Latin name
  results.sort((a, b) => {
    if (b.coveragePercentage !== a.coveragePercentage) {
      return b.coveragePercentage - a.coveragePercentage;
    }
    if (b.coveredSymptomsCount !== a.coveredSymptomsCount) {
      return b.coveredSymptomsCount - a.coveredSymptomsCount;
    }
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (a.remedy.isPolychrest !== b.remedy.isPolychrest) {
      return (b.remedy.isPolychrest ? 1 : 0) - (a.remedy.isPolychrest ? 1 : 0);
    }
    return a.remedy.latinName.localeCompare(b.remedy.latinName);
  });

  return results;
}
