import { getLocalizedRemedies, LocalizedRemedy } from '../data/materiaMedicaData';
import { LanguageCode } from '../types';

export interface SymptomMatchResult {
  remedy: LocalizedRemedy;
  matchScore: number; // 0 - 100
  matchedKeywords: string[];
  matchedIndications: string[];
  matchedKeynotes: string[];
  matchedModalities: string[];
  clinicalRationale: string;
}

const BETTER_TRIGGERS: Record<LanguageCode, string[]> = {
  de: ['besser', 'bessert', 'lindert', 'erleichtert', 'nachlassen'],
  en: ['better', 'relieved', 'ameliorated', 'improves', 'soothed'],
  es: ['mejor', 'mejora', 'alivia', 'calma', 'disminuye'],
  fr: ['mieux', 'soulagé', 'amélioré', 'diminue', 'apaise'],
  el: ['καλύτερα', 'βελτιώνεται', 'ανακουφίζει', 'υποχωρεί', 'καταπραΰνει'],
  it: ['meglio', 'migliora', 'allevia', 'attenua', 'calma'],
  ru: ['лучше', 'облегчает', 'улучшается', 'проходит', 'стихает']
};

const WORSE_TRIGGERS: Record<LanguageCode, string[]> = {
  de: ['schlechter', 'verschlimmert', 'schlimmer', 'steigert', 'verschlechtert'],
  en: ['worse', 'aggravated', 'worsened', 'intensified', 'unbearable'],
  es: ['peor', 'empeora', 'agrava', 'aumenta', 'intolerable'],
  fr: ['pire', 'aggravé', 'augmente', 'intolérable', 'amplifie'],
  el: ['χειρότερα', 'επιδεινώνεται', 'χειροτερεύει', 'εντείνεται', 'ανυπόφορο'],
  it: ['peggio', 'peggiora', 'aggrava', 'aumenta', 'insopportabile'],
  ru: ['хуже', 'ухудшается', 'усиливается', 'обостряется', 'невыносимо']
};

export function matchSymptomsToRemedies(inputText: string, lang: LanguageCode = 'de'): SymptomMatchResult[] {
  if (!inputText || inputText.trim().length < 3) {
    return [];
  }

  const normalizedInput = inputText.toLowerCase();
  const tokens = normalizedInput
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const remedies = getLocalizedRemedies(lang);
  const results: SymptomMatchResult[] = [];

  const betterWords = BETTER_TRIGGERS[lang] || BETTER_TRIGGERS.en;
  const worseWords = WORSE_TRIGGERS[lang] || WORSE_TRIGGERS.en;

  for (const remedy of remedies) {
    let score = 0;
    const matchedKeywords: string[] = [];
    const matchedIndications: string[] = [];
    const matchedKeynotes: string[] = [];
    const matchedModalities: string[] = [];

    // Check direct Latin name or common name
    if (
      normalizedInput.includes(remedy.latinName.toLowerCase()) ||
      normalizedInput.includes(remedy.commonName.toLowerCase()) ||
      normalizedInput.includes(remedy.id)
    ) {
      score += 45;
      matchedKeywords.push(remedy.commonName);
    }

    // Check search keywords in current language
    for (const kw of remedy.searchKeywords) {
      if (normalizedInput.includes(kw.toLowerCase())) {
        score += 16;
        if (!matchedKeywords.includes(kw)) {
          matchedKeywords.push(kw);
        }
      }
    }

    // Check Main Indications
    for (const ind of remedy.mainIndications) {
      const indLower = ind.toLowerCase();
      const hits = tokens.filter((t) => indLower.includes(t) && t.length > 3);
      if (hits.length >= 2 || (hits.length >= 1 && indLower.length < 25)) {
        score += 20;
        if (!matchedIndications.includes(ind)) {
          matchedIndications.push(ind);
        }
      }
    }

    // Check Keynotes
    for (const kn of remedy.keynotes) {
      const knLower = kn.toLowerCase();
      const hits = tokens.filter((t) => knLower.includes(t) && t.length > 3);
      if (hits.length >= 2 || (hits.length >= 1 && knLower.length < 25)) {
        score += 25;
        if (!matchedKeynotes.includes(kn)) {
          matchedKeynotes.push(kn);
        }
      }
    }

    // Check Modalities Better
    for (const mb of remedy.modalitiesBetter) {
      const isBetterMentioned = betterWords.some((bw) => normalizedInput.includes(bw));
      if (
        isBetterMentioned &&
        tokens.some((t) => mb.toLowerCase().includes(t) && t.length > 3)
      ) {
        score += 18;
        matchedModalities.push(`(+) ${mb}`);
      }
    }

    // Check Modalities Worse
    for (const mw of remedy.modalitiesWorse) {
      const isWorseMentioned = worseWords.some((ww) => normalizedInput.includes(ww));
      if (
        isWorseMentioned &&
        tokens.some((t) => mw.toLowerCase().includes(t) && t.length > 3)
      ) {
        score += 18;
        matchedModalities.push(`(-) ${mw}`);
      }
    }

    // Check Mind & Emotional Picture
    const mindLower = remedy.mindEmotional.toLowerCase();
    const mindHits = tokens.filter((t) => mindLower.includes(t) && t.length > 4);
    if (mindHits.length >= 2) {
      score += 20;
      matchedKeywords.push(mindHits.join(', '));
    }

    if (score > 12) {
      // Calculate normalized percentage score capped at 98%
      const normalizedScore = Math.min(98, Math.max(35, Math.round((score / 110) * 100)));

      // Generate localized clinical rationale
      let rationale = '';
      if (lang === 'de') {
        if (matchedKeynotes.length > 0) {
          rationale = `Starke Übereinstimmung mit Leitsymptomen: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Deckungsgleich mit Hauptindikation: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Passende Modalitätencharakteristik: ${matchedModalities[0]}`;
        } else {
          rationale = `Symptommuster und Schlagwörter (${matchedKeywords.slice(0, 3).join(', ')}) weisen auf ${remedy.latinName} (${remedy.commonName}) hin.`;
        }
      } else if (lang === 'en') {
        if (matchedKeynotes.length > 0) {
          rationale = `Strong correlation with keynotes: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Congruent with primary indication: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Matching modality characteristic: ${matchedModalities[0]}`;
        } else {
          rationale = `Symptom picture and descriptors (${matchedKeywords.slice(0, 3).join(', ')}) indicate ${remedy.latinName} (${remedy.commonName}).`;
        }
      } else if (lang === 'es') {
        if (matchedKeynotes.length > 0) {
          rationale = `Fuerte concordancia con síntomas clave: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Coincidente con la indicación principal: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Modalidad característica concordante: ${matchedModalities[0]}`;
        } else {
          rationale = `El cuadro sintomático (${matchedKeywords.slice(0, 3).join(', ')}) apunta a ${remedy.latinName} (${remedy.commonName}).`;
        }
      } else if (lang === 'fr') {
        if (matchedKeynotes.length > 0) {
          rationale = `Forte concordance avec les symptômes clés : ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Conforme à l'indication principale : ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Modalité caractéristique correspondante : ${matchedModalities[0]}`;
        } else {
          rationale = `Le tableau symptomatique (${matchedKeywords.slice(0, 3).join(', ')}) oriente vers ${remedy.latinName} (${remedy.commonName}).`;
        }
      } else if (lang === 'el') {
        if (matchedKeynotes.length > 0) {
          rationale = `Ισχυρή συμφωνία με τα βασικά συμπτώματα: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Συμβατό με την κύρια ένδειξη: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Ταιριαστή τροποποιητική ιδιότητα: ${matchedModalities[0]}`;
        } else {
          rationale = `Η εικόνα των συμπτωμάτων (${matchedKeywords.slice(0, 3).join(', ')}) υποδεικνύει ${remedy.latinName} (${remedy.commonName}).`;
        }
      } else if (lang === 'it') {
        if (matchedKeynotes.length > 0) {
          rationale = `Forte corrispondenza con i sintomi guida: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Coerente con l'indicazione principale: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Modalità caratteristica corrispondente: ${matchedModalities[0]}`;
        } else {
          rationale = `Il quadro dei sintomi (${matchedKeywords.slice(0, 3).join(', ')}) indica ${remedy.latinName} (${remedy.commonName}).`;
        }
      } else {
        // ru
        if (matchedKeynotes.length > 0) {
          rationale = `Высокое совпадение с ключевыми симптомами: ${matchedKeynotes[0]}`;
        } else if (matchedIndications.length > 0) {
          rationale = `Соответствие главному показанию: ${matchedIndications[0]}`;
        } else if (matchedModalities.length > 0) {
          rationale = `Характерная модальность: ${matchedModalities[0]}`;
        } else {
          rationale = `Картина симптомов и ключевые слова (${matchedKeywords.slice(0, 3).join(', ')}) указывают на ${remedy.latinName} (${remedy.commonName}).`;
        }
      }

      results.push({
        remedy,
        matchScore: normalizedScore,
        matchedKeywords,
        matchedIndications,
        matchedKeynotes,
        matchedModalities,
        clinicalRationale: rationale,
      });
    }
  }

  // Sort descending by match score
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
