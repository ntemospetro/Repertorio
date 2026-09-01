import { LanguageCode } from '../types';
import { MATERIA_MEDICA_PART1 } from './materiaMedicaPart1';
import { MATERIA_MEDICA_PART2 } from './materiaMedicaPart2';
import { MATERIA_MEDICA_PART3 } from './materiaMedicaPart3';
import { MATERIA_MEDICA_PART4 } from './materiaMedicaPart4';
import { MATERIA_MEDICA_PART5 } from './materiaMedicaPart5';
import { MATERIA_MEDICA_PART6 } from './materiaMedicaPart6';
import { MATERIA_MEDICA_PART7 } from './materiaMedicaPart7';
import { MATERIA_MEDICA_PART8 } from './materiaMedicaPart8';
import { MATERIA_MEDICA_PART9 } from './materiaMedicaPart9';

export type RemedyCategoryKey = 'plant' | 'mineral' | 'animal' | 'nosode' | 'acid' | 'other';

export interface LocalizedRemedyContent {
  commonName: string;
  category: string;
  origin: string;
  essence: string;
  mainIndications: string[];
  keynotes: string[];
  mindEmotional: string;
  modalitiesBetter: string[];
  modalitiesWorse: string[];
  potenciesAndDosage: string;
  defaultTagesdosis?: string;
  sphereOfAction: string[];
  differentialRemedies: string[];
  searchKeywords: string[];
}

export interface MateriaMedicaEntry {
  id: string;
  latinName: string;
  categoryKey: RemedyCategoryKey;
  isPolychrest?: boolean;
  importanceTier?: number;
  translations: Record<LanguageCode, LocalizedRemedyContent>;
}

export interface LocalizedRemedy extends LocalizedRemedyContent {
  id: string;
  latinName: string;
  categoryKey: RemedyCategoryKey;
  isPolychrest?: boolean;
  importanceTier?: number;
}

export const MATERIA_MEDICA_ENTRIES: MateriaMedicaEntry[] = [
  ...MATERIA_MEDICA_PART1,
  ...MATERIA_MEDICA_PART2,
  ...MATERIA_MEDICA_PART3,
  ...MATERIA_MEDICA_PART4,
  ...MATERIA_MEDICA_PART5,
  ...MATERIA_MEDICA_PART6,
  ...MATERIA_MEDICA_PART7,
  ...MATERIA_MEDICA_PART8,
  ...MATERIA_MEDICA_PART9
].sort((a, b) => a.latinName.localeCompare(b.latinName));

export const ALL_REMEDIES_DATABASE = MATERIA_MEDICA_ENTRIES;

export function getLocalizedRemedy(entry: MateriaMedicaEntry, lang: LanguageCode): LocalizedRemedy {
  const content = entry.translations[lang] || entry.translations.en || entry.translations.de;
  return {
    id: entry.id,
    latinName: entry.latinName,
    categoryKey: entry.categoryKey,
    isPolychrest: entry.isPolychrest,
    importanceTier: entry.importanceTier,
    ...content
  };
}

export function getLocalizedRemedies(lang: LanguageCode): LocalizedRemedy[] {
  return MATERIA_MEDICA_ENTRIES.map((entry) => getLocalizedRemedy(entry, lang));
}

export const LOCALIZED_PRESETS: Record<LanguageCode, string[]> = {
  de: [
    'Plötzliches Fieber nach Kaltwind',
    'Zerschlagenheit nach Sturz & Trauma',
    'Brennende Schmerzen besser durch Wärme',
    'Schlagartiger Reizdarm & Blähbauch',
    'Pochende Kopfschmerzen & Scharlach',
    'Stechender Husten schlimmer durch Bewegung',
    'Insektenstich mit heißer Schwellung',
    'Fließschnupfen mit scharfem Nasensekret',
    'Todesangst & panische Unruhe',
    'Heuschnupfen & Niesanfälle',
    'Bett fühlt sich überall zu hart an',
    'Durstlos bei starker Schwellung',
    'Erwacht um 3:00 Uhr mit Arbeitsgedanken',
    'Beckensenkungsgefühl & Tanzen bessert',
    'Warzen & Folgen von Impfungen',
    'Austreiben von Splittern & Eiterung'
  ],
  en: [
    'Sudden high fever after cold dry wind',
    'Bruised soreness after fall & blunt trauma',
    'Burning pains relieved by warm heat',
    'Sudden irritable bowel & bloating',
    'Throbbing violent headache & red face',
    'Stitching dry cough worse from any motion',
    'Insect sting with burning pink swelling',
    'Watery acrid coryza & burning nasal discharge',
    'Panic attacks with fear of death & restlessness',
    'Hay fever with violent sneezing bursts',
    'Bed feels too hard everywhere',
    'Completely thirstless despite fever & edema',
    'Wakes at 3:00 AM thinking about work',
    'Pelvic bearing down relieved by vigorous dancing',
    'Warts and post-vaccination ailments',
    'Expelling foreign body splinters and suppurations'
  ],
  es: [
    'Fiebre repentina tras viento frío seco',
    'Sensación de magulladura tras caída o golpe',
    'Dolores ardientes que mejoran con calor',
    'Cefalea pulsátil con cara roja como brasa',
    'Tos seca punzante peor al menor movimiento',
    'Picadura de insecto con hinchazón rosada',
    'Rinitis con secreción nasal corrosiva',
    'Ataque de pánico con miedo a la muerte',
    'Alergia y estornudos violentos',
    'La cama se siente demasiado dura',
    'Sin sed a pesar de la hinchazón y fiebre',
    'Despierta a las 3 de la madrugada pensando en trabajo',
    'Pesadez pélvica que mejora con baile enérgico',
    'Verrugas y trastornos posvacunales',
    'Expulsión de espinas y astillas'
  ],
  fr: [
    'Fièvre brutale après vent froid et sec',
    'Courbatures et contusions après chute ou choc',
    'Douleurs brûlantes soulagées par la chaleur',
    'Maux de tête pulsatiles et visage écarlate',
    'Toux sèche et piquante empirée par le mouvement',
    'Piqûre d’insecte avec œdème rosé brûlant',
    'Rhume avec écoulement nasal très irritant',
    'Panique avec angoisse de mort et agitation',
    'Rhume des foins et éternuements violents',
    'Le lit semble dur partout',
    'Absence totale de soif malgré la fièvre',
    'Réveil à 3h du matin avec ruminations de travail',
    'Pesanteur pelvienne améliorée par la danse',
    'Verrues et suites de vaccination',
    'Expulsion d’échardes et corps étrangers'
  ],
  el: [
    'Αιφνίδιος υψηλός πυρετός μετά από παγωμένο αέρα',
    'Αίσθημα συντριβής μετά από πτώση ή τραύμα',
    'Καυστικοί πόνοι που καλυτερεύουν με ζέστη',
    'Παλλόμενος πονοκέφαλος & κατακόκκινο πρόσωπο',
    'Ξηρός διαπεραστικός βήχας χειρότερος με την κίνηση',
    'Τσίμπημα εντόμου με ροζ πρήξιμο & κάψιμο',
    'Συνάχι με καυστική έκκριση που τσούζει τη μύτη',
    'Κρίση πανικού με αγωνία θανάτου & ανησυχία',
    'Αλλεργική ρινίτιδα & έντονα φτερνίσματα',
    'Το κρεβάτι φαίνεται υπερβολικά σκληρό',
    'Πλήρης έλλειψη δίψας παρά το πρήξιμο',
    'Αφύπνιση στις 03:00 π.μ. με σκέψεις δουλειάς',
    'Αίσθημα πτώσης μήτρας που βελτιώνεται με χορό',
    'Μυρμηγκιές και παρενέργειες εμβολιασμού',
    'Αποβολή αγκίδων και ξένων σωμάτων'
  ],
  it: [
    'Febbre improvvisa dopo vento freddo e secco',
    'Corpo indolenzito e contuso dopo caduta o trauma',
    'Dolori urenti alleviati dal calore intenso',
    'Cefalea pulsante e viso rosso acceso',
    'Tosse secca trafittiva peggiorata dal movimento',
    'Puntura d’insetto con gonfiore rosato urente',
    'Raffreddore con scolo nasale corrosivo',
    'Attacco di panico con terrore di morire',
    'Rinite allergica con raffiche di starnuti',
    'Il letto sembra duro ovunque',
    'Senza sete nonostante febbre e gonfiore',
    'Risveglio alle 3:00 con pensieri di lavoro',
    'Pesantezza pelvica migliorata dal ballo vigoroso',
    'Verruche e disturbi post-vaccinali',
    'Espulsione di schegge e corpi estranei'
  ],
  ru: [
    'Внезапная температура после холодного ветра',
    'Ощущение побитости после падения или травмы',
    'Жгучие боли, облегчаемые сухим теплом',
    'Пульсирующая головная боль и пылающее лицо',
    'Сухой колющий кашель, усиливающийся от движения',
    'Укус насекомого с горячим розовым отеком',
    'Едкий насморк с раздражающими выделениями',
    'Панический страх смерти и беспокойство',
    'Сенная лихорадка с приступами чихания',
    'Постель кажется твердой везде',
    'Полное отсутствие жажды при отеках и температуре',
    'Пробуждение в 3:00 ночи с мыслями о делах',
    'Чувство выпадения матки, проходящее от танцев',
    'Бородавки и последствия вакцинации',
    'Изгнание заноз и инородных тел'
  ]
};

export function getLocalizedPresets(lang: LanguageCode): string[] {
  return LOCALIZED_PRESETS[lang] || LOCALIZED_PRESETS.en || LOCALIZED_PRESETS.de;
}
