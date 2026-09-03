import { registerUnicodeFonts } from './pdfFonts';
import { jsPDF } from 'jspdf';
import { PatientCase, FullClinicalAnalysis, LanguageCode } from '../types';

export type PDFExportCategory = 'all' | 'falldaten' | 'redFlags' | 'differential' | 'homoeopathie' | 'medikamente' | 'empfehlungen';

interface PDFContext {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  currentY: number;
  patientName: string;
  anamneseDatum: string;
  documentTitle: string;
  lang: LanguageCode;
}

const SECTION_TITLES: Record<LanguageCode, {
  falldaten: string;
  falldatenSub: string;
  redFlags: string;
  redFlagsSub: string;
  medikamente: string;
  medikamenteSub: string;
  differential: string;
  differentialSub: string;
  homoeopathie: string;
  homoeopathieSub: string;
  empfehlungen: string;
  empfehlungenSub: string;
  overallTitle: string;
  pageHeader: string;
}> = {
  de: {
    falldaten: '1. Falldaten & Anamneseübersicht',
    falldatenSub: 'Stammdaten, Hauptbeschwerde, Spontanbericht & Befunde',
    redFlags: '2. Warnhinweise & Red Flags',
    redFlagsSub: 'Klinische Risikoeinschätzung & Dringlichkeit',
    medikamente: '3. Medikamenten- & Interaktionsanalyse',
    medikamenteSub: 'Wirkungen, Nebenwirkungen & Wechselwirkungen',
    differential: '4. Medizinische Differenzialdiagnostik',
    differentialSub: 'Systematischer Vergleich und klinische Abklärung',
    homoeopathie: '5. Homöopathische Fallauswertung',
    homoeopathieSub: 'Repertorisation, Symptomhierarchie & Mittel-Rangliste',
    empfehlungen: '6. Therapie- & Praxisempfehlungen',
    empfehlungenSub: 'Ärztliche Abklärung, homöopathische Verordnung und Einnahmeplan',
    overallTitle: 'Ganzheitliche Fallanalyse',
    pageHeader: 'HOMÖOPATHISCHE PRAXIS & FALLANALYSE'
  },
  en: {
    falldaten: '1. Case Data & Anamnesis Overview',
    falldatenSub: 'Master data, primary complaints, modalities & symptoms',
    redFlags: '2. Warnings & Red Flags',
    redFlagsSub: 'Clinical risk assessment & urgency rating',
    medikamente: '3. Medication & Interaction Analysis',
    medikamenteSub: 'Active ingredients, adverse effects & interactions',
    differential: '4. Medical Differential Diagnosis',
    differentialSub: 'Systematic comparison and clinical investigation',
    homoeopathie: '5. Homeopathic Case Evaluation',
    homoeopathieSub: 'Repertorisation, symptom hierarchy & remedy ranking',
    empfehlungen: '6. Therapy & Practice Recommendations',
    empfehlungenSub: 'Medical clarification, homeopathic prescription and schedule',
    overallTitle: 'Comprehensive Clinical Analysis',
    pageHeader: 'HOMEOPATHIC PRACTICE & CASE ANALYSIS'
  },
  es: {
    falldaten: '1. Datos del caso y resumen de la anamnesis',
    falldatenSub: 'Datos maestros, quejas principales, modalidades y síntomas',
    redFlags: '2. Advertencias y banderas rojas',
    redFlagsSub: 'Evaluación del riesgo clínico y grado de urgencia',
    medikamente: '3. Análisis de medicamentos e interacciones',
    medikamenteSub: 'Efectos terapéuticos, adversos e interacciones',
    differential: '4. Diagnóstico diferencial médico',
    differentialSub: 'Comparación sistemática y evaluación clínica',
    homoeopathie: '5. Evaluación homeopática del caso',
    homoeopathieSub: 'Repertorización, jerarquía de síntomas y ranking de remedios',
    empfehlungen: '6. Recomendaciones terapéuticas y de consulta',
    empfehlungenSub: 'Aclaración médica, prescripción homeopática y plan',
    overallTitle: 'Análisis clínico integral',
    pageHeader: 'PRÁCTICA HOMEOPÁTICA Y ANÁLISIS DE CASOS'
  },
  fr: {
    falldaten: '1. Données du cas et synthèse de l\'anamnèse',
    falldatenSub: 'Données de base, plaintes principales, modalités et symptômes',
    redFlags: '2. Avertissements et signaux d\'alarme',
    redFlagsSub: 'Évaluation des risques cliniques et urgence',
    medikamente: '3. Analyse des médicaments et interactions',
    medikamenteSub: 'Effets recherchés, secondaires et interactions',
    differential: '4. Diagnostic différentiel médical',
    differentialSub: 'Comparaison systématique et bilan clinique',
    homoeopathie: '5. Évaluation homéopathique du cas',
    homoeopathieSub: 'Répertorisation, hiérarchie des symptômes et classement',
    empfehlungen: '6. Recommandations thérapeutiques et de pratique',
    empfehlungenSub: 'Bilan médical, ordonnance homéopathique et plan de prise',
    overallTitle: 'Analyse clinique globale',
    pageHeader: 'PRATIQUE HOMÉOPATHIQUE ET ANALYSE DE CAS'
  },
  it: {
    falldaten: '1. Dati del caso e panoramica dell\'anamnesi',
    falldatenSub: 'Dati anagrafici, disturbi principali, modalità e sintomi',
    redFlags: '2. Avvertenze e segnali d\'allarme',
    redFlagsSub: 'Valutazione del rischio clinico e urgenza',
    medikamente: '3. Analisi dei farmaci e interazioni',
    medikamenteSub: 'Effetti farmacologici, indesiderati e interazioni',
    differential: '4. Diagnosi differenziale medica',
    differentialSub: 'Confronto sistematico e chiarimento clinico',
    homoeopathie: '5. Valutazione omeopatica del caso',
    homoeopathieSub: 'Repertorizzazione, gerarchia dei sintomi e classifica rimedi',
    empfehlungen: '6. Raccomandazioni terapeutiche e pratiche',
    empfehlungenSub: 'Approfondimento medico, prescrizione omeopatica e schema',
    overallTitle: 'Analisi clinica olistica',
    pageHeader: 'PRATICA OMEOPATICA E ANALISI DEI CASI'
  },
  el: {
    falldaten: '1. Δεδομένα περιστατικού & Επισκόπηση αναμνηστικού',
    falldatenSub: 'Βασικά στοιχεία, κύρια συμπτώματα, τροποποιητικοί παράγοντες',
    redFlags: '2. Προειδοποιητικά σημεία & Red Flags',
    redFlagsSub: 'Κλινική εκτίμηση κινδύνου & βαθμός επείγοντος',
    medikamente: '3. Ανάλυση φαρμάκων & αλληλεπιδράσεων',
    medikamenteSub: 'Δράσεις, παρενέργειες και αλληλεπιδράσεις ουσιών',
    differential: '4. Ιατρική διαφορική διάγνωση',
    differentialSub: 'Συστηματική σύγκριση και κλινική διερεύνηση',
    homoeopathie: '5. Ομοιοπαθητική αξιολόγηση περιστατικού',
    homoeopathieSub: 'Ρεπερτοριοποίηση, ιεραρχία συμπτωμάτων & κατάταξη φαρμάκων',
    empfehlungen: '6. Συστάσεις θεραπείας & πρακτικής',
    empfehlungenSub: 'Ιατρική διερεύνηση, ομοιοπαθητική συνταγογράφηση & πλάνο λήψης',
    overallTitle: 'Ολοκληρωμένη Κλινική Ανάλυση',
    pageHeader: 'ΟΜΟΙΟΠΑΘΗΤΙΚΗ ΠΡΑΚΤΙΚΗ & ΑΝΑΛΥΣΗ ΠΕΡΙΣΤΑΤΙΚΟΥ'
  },
  ru: {
    falldaten: '1. Данные случая и обзор анамнеза',
    falldatenSub: 'Основные данные, главные жалобы, модальности и симптомы',
    redFlags: '2. Предупреждения и красные флаги',
    redFlagsSub: 'Клиническая оценка рисков и степень срочности',
    medikamente: '3. Анализ медикаментов и взаимодействий',
    medikamenteSub: 'Действие, побочные эффекты и взаимодействия',
    differential: '4. Медицинский дифференциальный диагноз',
    differentialSub: 'Систематическое сопоставление и клиническое обследование',
    homoeopathie: '5. Гомеопатическая оценка случая',
    homoeopathieSub: 'Реперторизация, иерархия симптомов и рейтинг препаратов',
    empfehlungen: '6. Терапевтические и практические рекомендации',
    empfehlungenSub: 'Врачебное уточнение, гомеопатическое назначение и схема приема',
    overallTitle: 'Комплексный клинический анализ',
    pageHeader: 'ГОМЕОПАТИЧЕСКАЯ ПРАКТИКА И АНАЛИЗ СЛУЧАЕВ'
  }
};

// Colors (RGB)
const COLORS = {
  primary: [15, 118, 110] as [number, number, number], // Teal 700
  primaryDark: [19, 78, 74] as [number, number, number], // Teal 900
  primaryLight: [204, 251, 241] as [number, number, number], // Teal 100
  textDark: [15, 23, 42] as [number, number, number], // Slate 900
  textMuted: [100, 116, 139] as [number, number, number], // Slate 500
  border: [226, 232, 240] as [number, number, number], // Slate 200
  bgLight: [248, 250, 252] as [number, number, number], // Slate 50
  amber: [217, 119, 6] as [number, number, number], // Amber 600
  amberBg: [254, 243, 199] as [number, number, number], // Amber 100
  rose: [225, 29, 72] as [number, number, number], // Rose 600
  roseBg: [255, 228, 230] as [number, number, number], // Rose 100
  emerald: [5, 150, 105] as [number, number, number], // Emerald 600
  emeraldBg: [209, 250, 229] as [number, number, number], // Emerald 100
};

// Helper: Ensure room on page or add page
function checkPageBreak(ctx: PDFContext, neededHeight: number, categoryHeader?: string): void {
  if (ctx.currentY + neededHeight > ctx.pageHeight - 20) {
    ctx.doc.addPage();
    ctx.currentY = 22;
    drawPageHeader(ctx, categoryHeader || ctx.documentTitle);
  }
}

// Helper: Header on each page
function drawPageHeader(ctx: PDFContext, sectionName: string) {
  const { doc, pageWidth, margin, lang } = ctx;
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.primary);
  const titles = SECTION_TITLES[lang] || SECTION_TITLES.de;
  doc.text(titles.pageHeader, margin, 12);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.textMuted);
  const patientLabel = lang === 'el' ? 'Ασθενής' : lang === 'en' ? 'Patient' : lang === 'es' ? 'Paciente' : lang === 'fr' ? 'Patient' : lang === 'it' ? 'Paziente' : lang === 'ru' ? 'Пациент' : 'Patient';
  const datumLabel = lang === 'el' ? 'Ημερομηνία' : lang === 'en' ? 'Date' : lang === 'es' ? 'Fecha' : lang === 'fr' ? 'Date' : lang === 'it' ? 'Data' : lang === 'ru' ? 'Дата' : 'Datum';
  const infoText = `${patientLabel}: ${ctx.patientName} | ${datumLabel}: ${ctx.anamneseDatum}`;
  const infoWidth = doc.getTextWidth(infoText);
  doc.text(infoText, pageWidth - margin - infoWidth, 12);

  // Line
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, 15, pageWidth - margin, 15);

  ctx.currentY = Math.max(ctx.currentY, 22);
}

// Helper: Section Banner
function drawSectionHeader(ctx: PDFContext, title: string, subtitle?: string, badgeColor: [number, number, number] = COLORS.primary) {
  checkPageBreak(ctx, 22);
  const { doc, margin, contentWidth } = ctx;

  // Background box for section header
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, ctx.currentY, contentWidth, subtitle ? 16 : 12, 2, 2, 'FD');

  // Colored left accent bar
  doc.setFillColor(...badgeColor);
  doc.rect(margin, ctx.currentY, 3, subtitle ? 16 : 12, 'F');

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.textDark);
  doc.text(title, margin + 6, ctx.currentY + 7);

  if (subtitle) {
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.textMuted);
    doc.text(subtitle, margin + 6, ctx.currentY + 13);
    ctx.currentY += 21;
  } else {
    ctx.currentY += 17;
  }
}

// Helper: Draw label/value line
function drawLabelValue(ctx: PDFContext, label: string, value: string, indent: number = 0) {
  if (!value || value.trim() === '') return;
  const { doc, margin, contentWidth } = ctx;
  const effectiveWidth = contentWidth - indent;
  const startX = margin + indent;

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);
  const labelWidth = doc.getTextWidth(label + ': ');

  // Split value text
  const valueWidth = effectiveWidth - labelWidth;
  const wrappedLines = doc.splitTextToSize(value, Math.max(valueWidth, 60));
  const lineBlockHeight = Math.max(wrappedLines.length * 4.5, 6);

  checkPageBreak(ctx, lineBlockHeight + 2);

  doc.setFont('Roboto', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.primaryDark);
  doc.text(label + ':', startX, ctx.currentY);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.textDark);

  if (wrappedLines.length === 1 && labelWidth + doc.getTextWidth(value) <= effectiveWidth) {
    doc.text(value, startX + labelWidth, ctx.currentY);
    ctx.currentY += 5.5;
  } else {
    const fullTextWrapped = doc.splitTextToSize(value, effectiveWidth - 4);
    ctx.currentY += 4.5;
    for (const line of fullTextWrapped) {
      checkPageBreak(ctx, 5);
      doc.text(line, startX + 4, ctx.currentY);
      ctx.currentY += 4.5;
    }
    ctx.currentY += 1.5;
  }
}

// Helper: Draw Box Card
function drawCardBox(ctx: PDFContext, title: string, content: string | string[], borderColor: [number, number, number] = COLORS.border, bgColor: [number, number, number] = COLORS.bgLight) {
  const { doc, margin, contentWidth } = ctx;
  
  let lines: string[] = [];
  if (Array.isArray(content)) {
    lines = content.flatMap(c => doc.splitTextToSize(`• ${c}`, contentWidth - 8));
  } else if (content) {
    lines = doc.splitTextToSize(content, contentWidth - 8);
  }

  const boxHeight = 8 + (title ? 6 : 0) + lines.length * 4.2;
  checkPageBreak(ctx, boxHeight + 4);

  doc.setFillColor(...bgColor);
  doc.setDrawColor(...borderColor);
  doc.roundedRect(margin, ctx.currentY, contentWidth, boxHeight, 2, 2, 'FD');

  let textY = ctx.currentY + 5;

  if (title) {
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLORS.textDark);
    doc.text(title, margin + 4, textY);
    textY += 5.5;
  }

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.textDark);

  for (const line of lines) {
    doc.text(line, margin + 4, textY);
    textY += 4.2;
  }

  ctx.currentY += boxHeight + 3.5;
}

// Helper: Footer with Page numbers
function drawFooters(doc: jsPDF, patientName: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.textMuted);

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 12, pageWidth - 15, pageHeight - 12);

    doc.text(`Vertraulicher medizinischer Bericht | ${patientName}`, 15, pageHeight - 7);
    const pageStr = `Seite ${i} von ${pageCount}`;
    doc.text(pageStr, pageWidth - 15 - doc.getTextWidth(pageStr), pageHeight - 7);
  }
}

// ============================================================================
// SECTION RENDERERS
// ============================================================================

// 1. Falldaten Übersicht
function renderFalldatenSection(ctx: PDFContext, patientCase: PatientCase) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.falldaten, t.falldatenSub);

  // Stammdaten Grid
  const stammdatenLines: string[] = [
    `Name: ${patientCase.patientName || 'Unbenannt'}`,
    `Alter: ${patientCase.patientAge ? `${patientCase.patientAge} Jahre` : '-'}`,
    `Geschlecht: ${patientCase.patientGender || '-'}`,
    `Geburtsdatum: ${patientCase.patientBirthDate || '-'}`,
    `Größe: ${patientCase.patientHeightCm ? `${patientCase.patientHeightCm} cm` : '-'}`,
    `Gewicht: ${patientCase.patientWeightKg ? `${patientCase.patientWeightKg} kg` : '-'}`,
    `Familienstand: ${patientCase.patientMaritalStatus || '-'}`,
    `E-Mail: ${patientCase.patientEmail || '-'}`,
    `Telefon: ${patientCase.patientPhone || '-'}`,
    `Kinder: ${patientCase.hasChildren ? `${patientCase.childrenCount || 0} Kind(er)` : 'Keine'}`,
  ];
  if (patientCase.isPregnant) {
    stammdatenLines.push(`Schwangerschaft: Ja (${patientCase.pregnancyMonth || '?'}. Monat)`);
  }
  if (patientCase.customStammdaten && patientCase.customStammdaten.length > 0) {
    patientCase.customStammdaten.forEach(cs => {
      if (cs.name && (cs.value || cs.name)) {
        stammdatenLines.push(`${cs.name}: ${cs.value || '-'}`);
      }
    });
  }

  drawCardBox(ctx, 'Patienten-Stammdaten', stammdatenLines);

  // Hauptbeschwerde & Spontanbericht
  if (patientCase.hauptbeschwerde) {
    drawCardBox(ctx, 'Hauptbeschwerde', patientCase.hauptbeschwerde, COLORS.primary, COLORS.bgLight);
  }

  if (patientCase.spontanbericht) {
    drawCardBox(ctx, 'Spontanbericht des Patienten', patientCase.spontanbericht);
  }

  // Befragungsfragen (Dynamische Fragen)
  if (patientCase.anamnesisQuestions && patientCase.anamnesisQuestions.length > 0) {
    const questionLines = patientCase.anamnesisQuestions.map((q, idx) => {
      let ans = '';
      if (q.type === 'scale') {
        ans = `Aktuell: ${q.answerScaleCurrent || '-'}/4 | Schlimmster Fall: ${q.answerScaleWorst || '-'}/4`;
      } else if (q.type === 'multi_choice') {
        ans = q.answerMultiChoice?.join(', ') || 'Keine Auswahl';
      } else {
        ans = q.answerChoice || q.answerText || 'Keine Angabe';
      }
      return `Frage ${idx + 1}: ${q.question}\nAntwort: ${ans}`;
    });
    drawCardBox(ctx, 'Strukturierte Befragung zur Hauptbeschwerde', questionLines);
  }

  // Modalitäten
  if (patientCase.modalitaetenBesser || patientCase.modalitaetenSchlechter) {
    const modLines = [
      `Besserung durch (>): ${patientCase.modalitaetenBesser || 'Nicht angegeben'}`,
      `Verschlechterung durch (<): ${patientCase.modalitaetenSchlechter || 'Nicht angegeben'}`
    ];
    drawCardBox(ctx, 'Modalitäten (Besserung / Verschlechterung)', modLines, COLORS.primary, COLORS.primaryLight);
  }

  // Gemüt / Geist / Körper
  if (patientCase.gemuetPsyche || patientCase.koerperAllgemein || patientCase.lokalsymptome) {
    const sympLines = [
      patientCase.gemuetPsyche ? `Gemüt & Psyche: ${patientCase.gemuetPsyche}` : '',
      patientCase.koerperAllgemein ? `Allgemeinsymptome: ${patientCase.koerperAllgemein}` : '',
      patientCase.lokalsymptome ? `Lokalsymptome: ${patientCase.lokalsymptome}` : '',
    ].filter(Boolean);
    drawCardBox(ctx, 'Ganzheitliche Symptome & Gemüt', sympLines);
  }

  // Klinischer Befund
  if (patientCase.befundGewuenscht && patientCase.befundDetails) {
    const b = patientCase.befundDetails;
    const befundLines = [
      b.blutdruck ? `Blutdruck: ${b.blutdruck}` : '',
      b.puls ? `Puls: ${b.puls}` : '',
      b.temperatur ? `Temperatur: ${b.temperatur}` : '',
      b.spo2 ? `SpO2: ${b.spo2}` : '',
      b.allgemeinzustand ? `Allgemeinzustand: ${b.allgemeinzustand}` : '',
      b.herzLunge ? `Herz/Lunge: ${b.herzLunge}` : '',
      b.neurologisch ? `Neurologisch: ${b.neurologisch}` : '',
      b.gesamtbeurteilung ? `Befundbeurteilung: ${b.gesamtbeurteilung}` : '',
    ].filter(Boolean);
    if (befundLines.length > 0) {
      drawCardBox(ctx, 'Körperlicher Befund & Vitalparameter', befundLines);
    }
  }

  // Erfasste Medikamente
  if (patientCase.nimmtMedikamente && patientCase.medikamenteList && patientCase.medikamenteList.length > 0) {
    const medLines = patientCase.medikamenteList.map(
      (m, i) => `${i + 1}. ${m.name || 'Unbenannt'} (Dosis: ${m.dosierung || '-'}, Einnahme: ${m.einnahmeart || '-'})`
    );
    drawCardBox(ctx, 'Aktuelle Medikation (Erfassung)', medLines);
  }
}

// 2. Warnhinweise & Red Flags
function renderRedFlagsSection(ctx: PDFContext, analysis: FullClinicalAnalysis) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.redFlags, t.redFlagsSub, COLORS.amber);

  const redFlags = analysis.redFlags?.warnings || [];
  if (redFlags.length > 0) {
    for (const rf of redFlags) {
      const rfLines = [
        rf.text,
        rf.abklaerung ? `Empfohlene Abklärung: ${rf.abklaerung}` : '',
        rf.status ? `Status: ${rf.status}` : ''
      ].filter(Boolean);

      drawCardBox(
        ctx,
        `⚠️ ${rf.severity || 'WARNUNG'}: Risikofaktor`,
        rfLines,
        COLORS.amber,
        COLORS.amberBg
      );
    }
  } else {
    drawCardBox(ctx, 'Red Flags Prüfung', 'Keine akuten Warnhinweise oder Notfallsymptome anhand der Angaben dokumentiert.', COLORS.emerald, COLORS.emeraldBg);
  }

  // Gesamtbewertung & Empfohlene Fachrichtung
  const bewertungLines = [
    `Gesamtbewertung: ${analysis.redFlags?.gesamtbewertung || 'Zeitnahe ärztliche Abklärung empfohlen.'}`,
    `Empfohlene Fachrichtung: ${analysis.redFlags?.empfohleneFachrichtung || 'Allgemeinmedizin / Hausarzt'}`,
    analysis.arztfallEntscheidung ? `Arztfall-Status: ${analysis.arztfallEntscheidung.status} (${analysis.arztfallEntscheidung.begruendung})` : ''
  ].filter(Boolean);

  drawCardBox(ctx, 'Dringlichkeitseinstufung & Facharzt-Empfehlung', bewertungLines, COLORS.primary, COLORS.bgLight);
}

// 3. Medikamente
function renderMedikamenteSection(ctx: PDFContext, analysis: FullClinicalAnalysis) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.medikamente, t.medikamenteSub, COLORS.primary);

  // Warnhinweis
  if (analysis.medikamente?.warnhinweis) {
    drawCardBox(ctx, 'Wichtiger Hinweis', analysis.medikamente.warnhinweis, COLORS.amber, COLORS.amberBg);
  }

  if (analysis.medikamente?.zusammenfassung) {
    drawCardBox(ctx, 'Zusammenfassung der Medikation', analysis.medikamente.zusammenfassung);
  }

  // Detaillierte Medikamente
  const meds = analysis.medikamente?.details || [];
  meds.forEach((med, idx) => {
    checkPageBreak(ctx, 30);
    const medLines: string[] = [
      med.dosierung ? `Dosierung: ${med.dosierung}` : '',
      med.einnahme ? `Einnahme: ${med.einnahme}` : '',
      med.wirkung ? `Wirkung: ${med.wirkung}` : '',
    ].filter(Boolean);

    if (med.nebenwirkungen && med.nebenwirkungen.length > 0) {
      medLines.push('Mögliche Nebenwirkungen:');
      med.nebenwirkungen.forEach(nw => medLines.push(`  • ${nw}`));
    }

    if (med.zusammenhaenge && med.zusammenhaenge.length > 0) {
      medLines.push('Zusammenhänge mit den Beschwerden:');
      med.zusammenhaenge.forEach(zh => medLines.push(`  • ${zh}`));
    }

    if (med.uebergebrauchBeurteilung) {
      medLines.push(`Übergebrauch-Beurteilung: ${med.uebergebrauchBeurteilung}`);
    }

    drawCardBox(ctx, `${idx + 1}. ${med.name}`, medLines, COLORS.primary, COLORS.bgLight);
  });

  // Fehlende Informationen
  if (analysis.fehlendeInformationen && analysis.fehlendeInformationen.length > 0) {
    drawCardBox(ctx, 'Für eine sichere Beurteilung noch relevante Angaben', analysis.fehlendeInformationen);
  }

  // Nächste Schritte
  if (analysis.gesamtAuswertung?.naechsteSchritte && analysis.gesamtAuswertung.naechsteSchritte.length > 0) {
    drawCardBox(ctx, 'Empfohlene nächste Therapieschritte', analysis.gesamtAuswertung.naechsteSchritte, COLORS.primaryDark, COLORS.primaryLight);
  }
}

// 4. Medizinische Differenzialdiagnostik
function renderDifferentialSection(ctx: PDFContext, analysis: FullClinicalAnalysis) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.differential, t.differentialSub, COLORS.primary);

  if (analysis.differentialdiagnostik?.dringlichkeitHeader) {
    const urgencyLabel = ctx.lang === 'el' ? 'Επίπεδο επείγοντος' : ctx.lang === 'en' ? 'Urgency Level' : ctx.lang === 'es' ? 'Nivel de urgencia' : ctx.lang === 'fr' ? 'Niveau d\'urgence' : ctx.lang === 'it' ? 'Livello di urgenza' : ctx.lang === 'ru' ? 'Степень срочности' : 'Dringlichkeitsstufe';
    drawCardBox(ctx, urgencyLabel, analysis.differentialdiagnostik.dringlichkeitHeader, COLORS.amber, COLORS.amberBg);
  }

  const proLabel = ctx.lang === 'el' ? '✓ Συνηγορούν υπέρ:' : ctx.lang === 'en' ? '✓ In favor:' : ctx.lang === 'es' ? '✓ Argumentos a favor:' : ctx.lang === 'fr' ? '✓ En faveur :' : ctx.lang === 'it' ? '✓ A favore:' : ctx.lang === 'ru' ? '✓ В пользу диагноза:' : '✓ Dafür spricht:';
  const contraLabel = ctx.lang === 'el' ? '⚠ Συνηγορούν κατά:' : ctx.lang === 'en' ? '⚠ Against:' : ctx.lang === 'es' ? '⚠ Argumentos en contra:' : ctx.lang === 'fr' ? '⚠ Contre :' : ctx.lang === 'it' ? '⚠ Contro:' : ctx.lang === 'ru' ? '⚠ Против диагноза:' : '⚠ Dagegen spricht:';
  const qLabel = ctx.lang === 'el' ? '💡 Ανοικτά ερωτήματα / Διαγνωστικά:' : ctx.lang === 'en' ? '💡 Open Questions / Diagnostics:' : ctx.lang === 'es' ? '💡 Preguntas abiertas / Diagnóstico:' : ctx.lang === 'fr' ? '💡 Questions en suspens / Diagnostic :' : ctx.lang === 'it' ? '💡 Domande aperte / Diagnostica:' : ctx.lang === 'ru' ? '💡 Открытые вопросы / Диагностика:' : '💡 Offene Fragen / Diagnostik:';
  const diagLabel = ctx.lang === 'el' ? 'Προτεινόμενα διαγνωστικά βήματα' : ctx.lang === 'en' ? 'Recommended diagnostic steps' : ctx.lang === 'es' ? 'Pasos diagnósticos recomendados' : ctx.lang === 'fr' ? 'Étapes diagnostiques recommandées' : ctx.lang === 'it' ? 'Passaggi diagnostici raccomandati' : ctx.lang === 'ru' ? 'Рекомендуемые диагностические шаги' : 'Empfohlene diagnostische Schritte';

  const items = analysis.differentialdiagnostik?.items || [];
  items.forEach((dd, idx) => {
    checkPageBreak(ctx, 35);
    const ddLines: string[] = [];

    if (dd.pro && dd.pro.length > 0) {
      ddLines.push(proLabel);
      dd.pro.forEach(p => ddLines.push(`  • ${p}`));
    }

    if (dd.contra && dd.contra.length > 0) {
      ddLines.push(contraLabel);
      dd.contra.forEach(c => ddLines.push(`  • ${c}`));
    }

    if (dd.offeneFragen && dd.offeneFragen.length > 0) {
      ddLines.push(qLabel);
      dd.offeneFragen.forEach(q => ddLines.push(`  • ${q}`));
    }

    if (dd.diagnostik) {
      ddLines.push(`${diagLabel}: ${dd.diagnostik}`);
    }

    drawCardBox(ctx, `${idx + 1}. ${dd.title}`, ddLines, COLORS.primary, COLORS.bgLight);
  });
}

// 5. Homöopathische Fallauswertung
function renderHomoeopathieSection(ctx: PDFContext, analysis: FullClinicalAnalysis) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.homoeopathie, t.homoeopathieSub, COLORS.primary);

  // Symptomen Hierarchie
  if (analysis.homoeopathie?.symptomHierarchie) {
    const sh = analysis.homoeopathie.symptomHierarchie;
    const hierLines = [
      `1. Leitsymptome: ${sh.leitsymptome?.join(', ') || '-'}`,
      `2. Gemüt & Psyche: ${sh.gemuetsymptome?.join(', ') || '-'}`,
      `3. Modalitäten (> / <): ${sh.modalitaeten?.join(', ') || '-'}`,
      `4. Allgemeinsymptome: ${sh.allgemeinsymptome?.join(', ') || '-'}`,
      `5. Lokalsymptome: ${sh.lokalsymptome?.join(', ') || '-'}`,
      `6. Begleitsymptome: ${sh.begleitsymptome?.join(', ') || '-'}`,
    ];
    drawCardBox(ctx, 'Klassische Symptomen-Hierarchisierung', hierLines, COLORS.primary, COLORS.primaryLight);
  }

  // Mittel Rangliste
  const mittel = analysis.homoeopathie?.mittel || [];
  mittel.forEach((m, idx) => {
    checkPageBreak(ctx, 45);
    const mLines: string[] = [
      `Potenz: ${m.potenz || m.dosierungPotenz || 'C30'}`,
      m.tagesdosis ? `Tagesdosis: ${m.tagesdosis}` : '',
      m.haeufigkeit ? `Häufigkeit (wie oft): ${m.haeufigkeit}` : '',
      m.anwendungsdauer ? `Anwendungsdauer (wie lange): ${m.anwendungsdauer}` : '',
      m.zeitraum ? `Zeitraum / Phase: ${m.zeitraum}` : '',
      m.einnahmehinweis ? `Einnahmehinweis: ${m.einnahmehinweis}` : '',
      `Begründung der Wahl: ${m.rangBegruendung}`,
    ].filter(Boolean);

    if (m.passungSymptome && m.passungSymptome.length > 0) {
      mLines.push('✓ Gut passende Symptome:');
      m.passungSymptome.forEach(p => mLines.push(`  • ${p}`));
    }

    if (m.contraNichtPassend && m.contraNichtPassend.length > 0) {
      mLines.push('⚠ Zu beachten / Modalitäten-Differenz:');
      m.contraNichtPassend.forEach(c => mLines.push(`  • ${c}`));
    }

    drawCardBox(ctx, `Rang ${idx + 1}: ${m.name}`, mLines, COLORS.primary, COLORS.bgLight);
  });

  // Dreiteilung
  if (analysis.homoeopathie?.trennung) {
    const t = analysis.homoeopathie.trennung;
    const trennLines = [
      `Medizinische Maßnahmen: ${t.medizinisch?.join('; ') || '-'}`,
      `Komplementäre Maßnahmen: ${t.komplementaer?.join('; ') || '-'}`,
      `Homöopathische Begleitung: ${t.homoeopathisch?.join('; ') || '-'}`,
    ];
    drawCardBox(ctx, 'Ganzheitliche Maßnahmen-Aufteilung', trennLines);
  }
}

// ============================================================================
// 6. EMPFEHLUNGEN & VERORDNUNGSPLAN
// ============================================================================
function renderEmpfehlungenSection(
  ctx: PDFContext,
  patientCase: PatientCase,
  analysis?: FullClinicalAnalysis | null
) {
  const t = SECTION_TITLES[ctx.lang] || SECTION_TITLES.de;
  drawSectionHeader(ctx, t.empfehlungen, t.empfehlungenSub);

  const recs = patientCase.therapyRecommendations;

  // 1. Doctor consultation box
  const doctorUrgent = recs?.doctorConsultationUrgency === 'Notfall' || recs?.doctorConsultationUrgency === 'Dringend';
  const docLines: string[] = [
    `Status: ${recs?.doctorConsultationRequired ? 'Ärztliche / fachärztliche Abklärung empfohlen' : 'Keine akute Notfallindikation'}`,
    recs?.doctorConsultationUrgency ? `Dringlichkeitsstufe: ${recs.doctorConsultationUrgency}` : '',
    recs?.doctorConsultationSpecialty ? `Empfohlene Fachrichtung: ${recs.doctorConsultationSpecialty}` : '',
    recs?.doctorConsultationReason ? `Befundbasis / Auslöser: ${recs.doctorConsultationReason}` : '',
    recs?.doctorConsultationNotes ? `Überweisungshinweis / Notiz an Patienten: ${recs.doctorConsultationNotes}` : '',
  ].filter(Boolean);

  drawCardBox(
    ctx,
    'Ärztliche & Fachärztliche Abklärung (Red Flags)',
    docLines,
    doctorUrgent ? COLORS.rose : COLORS.primary,
    doctorUrgent ? COLORS.roseBg : COLORS.bgLight
  );

  // 2. Homöopathische Mittel
  const remedies = recs?.remedies || (analysis?.homoeopathie?.mittel || []).map((m) => ({
    id: m.name,
    name: m.name,
    potency: m.potenz || m.dosierungPotenz || 'C30',
    tagesdosis: m.tagesdosis || '1 bis 2 Gaben à 3–5 Globuli',
    haeufigkeit: m.haeufigkeit || '1- bis 2-mal täglich',
    anwendungsdauer: m.anwendungsdauer || '3 bis maximal 5 Tage',
    zeitraum: m.zeitraum || 'Akut- und Initialphase',
    therapistNotes: m.einnahmehinweis || '',
    isSelected: true,
  }));

  const selectedRemedies = remedies.filter(r => r.isSelected !== false);
  const remedyListToDraw = selectedRemedies.length > 0 ? selectedRemedies : remedies;

  remedyListToDraw.forEach((r, idx) => {
    checkPageBreak(ctx, 42);
    const rLines: string[] = [
      `Potenz: ${r.potency}`,
      `Empfohlene Dosis am Tag: ${r.tagesdosis}`,
      `Wie oft (Häufigkeit): ${r.haeufigkeit}`,
      `Wie lange (Dauer): ${r.anwendungsdauer}`,
      `Zeitraum / Anwendungsphase: ${r.zeitraum}`,
      r.therapistNotes ? `Anmerkung / Einnahmehinweis: ${r.therapistNotes}` : '',
    ].filter(Boolean);

    drawCardBox(
      ctx,
      `Verordnung ${idx + 1}: ${r.name} (${r.potency})`,
      rLines,
      COLORS.primary,
      COLORS.bgLight
    );
  });

  // 3. General therapy notes
  if (recs?.generalTherapyNotes) {
    checkPageBreak(ctx, 25);
    drawCardBox(ctx, 'Allgemeine Verordnungs- & Lebensstil-Hinweise', [recs.generalTherapyNotes]);
  }
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

export function exportCategoryPDF(
  category: PDFExportCategory,
  patientCase: PatientCase,
  analysis?: FullClinicalAnalysis | null,
  lang: LanguageCode = 'de'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  registerUnicodeFonts(doc);
  doc.setFont('Roboto', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  const patientName = patientCase.patientName || 'Patient';
  const anamneseDatum = patientCase.anamneseDatum || new Date().toLocaleDateString(lang === 'de' ? 'de-DE' : lang === 'el' ? 'el-GR' : 'en-US');

  const t = SECTION_TITLES[lang] || SECTION_TITLES.de;
  let title = t.overallTitle;
  if (category === 'falldaten') title = t.falldaten;
  else if (category === 'redFlags') title = t.redFlags;
  else if (category === 'differential') title = t.differential;
  else if (category === 'homoeopathie') title = t.homoeopathie;
  else if (category === 'medikamente') title = t.medikamente;
  else if (category === 'empfehlungen') title = t.empfehlungen;

  const ctx: PDFContext = {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    currentY: 22,
    patientName,
    anamneseDatum,
    documentTitle: title,
    lang,
  };

  drawPageHeader(ctx, title);

  if (category === 'falldaten') {
    renderFalldatenSection(ctx, patientCase);
  } else if (category === 'redFlags') {
    if (analysis) renderRedFlagsSection(ctx, analysis);
  } else if (category === 'differential') {
    if (analysis) renderDifferentialSection(ctx, analysis);
  } else if (category === 'homoeopathie') {
    if (analysis) renderHomoeopathieSection(ctx, analysis);
  } else if (category === 'medikamente') {
    if (analysis) renderMedikamenteSection(ctx, analysis);
  } else if (category === 'empfehlungen') {
    renderEmpfehlungenSection(ctx, patientCase, analysis);
  } else if (category === 'all') {
    // 1. Falldaten
    renderFalldatenSection(ctx, patientCase);

    // Continuous flow across sections (no forced page breaks per section)
    if (analysis) {
      ctx.currentY += 2;
      renderRedFlagsSection(ctx, analysis);

      ctx.currentY += 2;
      renderMedikamenteSection(ctx, analysis);

      ctx.currentY += 2;
      renderDifferentialSection(ctx, analysis);

      ctx.currentY += 2;
      renderHomoeopathieSection(ctx, analysis);

      ctx.currentY += 2;
      renderEmpfehlungenSection(ctx, patientCase, analysis);
    }
  }

  // Draw footers on all pages
  drawFooters(doc, patientName);

  // Download filename
  const cleanName = (patientCase.patientName || 'Patient').replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${cleanName}_${category}_${dateStr}.pdf`;

  doc.save(filename);
}

export function exportComprehensiveAnalysisToPDF(
  patientCase: PatientCase,
  analysis?: FullClinicalAnalysis | null,
  language?: string,
  category: PDFExportCategory = 'all'
): void {
  exportCategoryPDF(category, patientCase, analysis, (language as LanguageCode) || 'de');
}

// ============================================================================
// TERMS & CONDITIONS (AGB) PDF EXPORT
// ============================================================================

export interface TermsExportData {
  title: string;
  lastUpdated: string;
  version: string;
  content: string;
  language: LanguageCode;
}

interface TermsPdfI18n {
  badge: string;
  validDate: string;
  versionLabel: string;
  languageLabel: string;
  platformNotice: string;
  headerTitle: string;
  headerStand: string;
  headerVer: string;
  footerStand: string;
  pageNum: (p: number, total: number) => string;
}

const TERMS_PDF_I18N: Record<LanguageCode, TermsPdfI18n> = {
  de: {
    badge: 'HOMÖOPILOT 360° • RECHTSVERBINDLICHE AGB',
    validDate: 'Gültigkeitsdatum / Stand:',
    versionLabel: 'Versionsnummer:',
    languageLabel: 'Sprache:',
    platformNotice: 'Gültig für alle Registrierungen und die Nutzung der Plattform.',
    headerTitle: 'HOMÖOPILOT 360° • AGB & NUTZUNGSVERTRAG',
    headerStand: 'Stand:',
    headerVer: 'Ver.',
    footerStand: 'Stand:',
    pageNum: (p, total) => `Seite ${p}/${total}`,
  },
  en: {
    badge: 'HOMÖOPILOT 360° • LEGALLY BINDING TERMS',
    validDate: 'Effective Date / As of:',
    versionLabel: 'Version:',
    languageLabel: 'Language:',
    platformNotice: 'Valid for all registrations and platform usage.',
    headerTitle: 'HOMÖOPILOT 360° • TERMS & USER AGREEMENT',
    headerStand: 'As of:',
    headerVer: 'Ver.',
    footerStand: 'As of:',
    pageNum: (p, total) => `Page ${p}/${total}`,
  },
  es: {
    badge: 'HOMÖOPILOT 360° • TÉRMINOS Y CONDICIONES VINCULANTES',
    validDate: 'Fecha de vigencia / Estado:',
    versionLabel: 'Versión:',
    languageLabel: 'Idioma:',
    platformNotice: 'Válido para todos los registros y el uso de la plataforma.',
    headerTitle: 'HOMÖOPILOT 360° • TÉRMINOS Y CONTRATO DE USO',
    headerStand: 'Estado:',
    headerVer: 'Ver.',
    footerStand: 'Estado:',
    pageNum: (p, total) => `Página ${p}/${total}`,
  },
  fr: {
    badge: 'HOMÖOPILOT 360° • CONDITIONS GÉNÉRALES VINCULANTES',
    validDate: 'Date d\'effet / État :',
    versionLabel: 'Version :',
    languageLabel: 'Langue :',
    platformNotice: 'Valable pour toutes les inscriptions et l\'utilisation de la plateforme.',
    headerTitle: 'HOMÖOPILOT 360° • CGU & CONTRAT D\'UTILISATION',
    headerStand: 'État :',
    headerVer: 'Ver.',
    footerStand: 'État :',
    pageNum: (p, total) => `Page ${p}/${total}`,
  },
  it: {
    badge: 'HOMÖOPILOT 360° • TERMINI E CONDIZIONI VINCOLANTI',
    validDate: 'Data di decorrenza / Stato:',
    versionLabel: 'Versione:',
    languageLabel: 'Lingua:',
    platformNotice: 'Valido per tutte le registrazioni e l\'utilizzo della piattaforma.',
    headerTitle: 'HOMÖOPILOT 360° • TERMINI E CONTRATTO D\'USO',
    headerStand: 'Stato:',
    headerVer: 'Ver.',
    footerStand: 'Stato:',
    pageNum: (p, total) => `Pagina ${p}/${total}`,
  },
  el: {
    badge: 'HOMÖOPILOT 360° • ΝΟΜΙΚΑ ΔΕΣΜΕΥΤΙΚΟΙ ΓΟΣ',
    validDate: 'Ημερομηνία ισχύος / Κατάσταση:',
    versionLabel: 'Έκδοση:',
    languageLabel: 'Γλώσσα:',
    platformNotice: 'Ισχύει για όλες τις εγγραφές και τη χρήση της πλατφόρμας.',
    headerTitle: 'HOMÖOPILOT 360° • ΓΕΝΙΚΟΙ ΟΡΟΙ & ΣΥΜΒΑΣΗ ΧΡΗΣΗΣ',
    headerStand: 'Κατάσταση:',
    headerVer: 'Έκδ.',
    footerStand: 'Κατάσταση:',
    pageNum: (p, total) => `Σελίδα ${p}/${total}`,
  },
  ru: {
    badge: 'HOMÖOPILOT 360° • ЮРИДИЧЕСКИ ОБЯЗАТЕЛЬНЫЕ УСЛОВИЯ',
    validDate: 'Дата вступления в силу / Редакция:',
    versionLabel: 'Версия:',
    languageLabel: 'Язык:',
    platformNotice: 'Действительно для всех регистраций и использования платформы.',
    headerTitle: 'HOMÖOPILOT 360° • УСЛОВИЯ И ДОГОВОР ИСПОЛЬЗОВАНИЯ',
    headerStand: 'Редакция:',
    headerVer: 'Вер.',
    footerStand: 'Редакция:',
    pageNum: (p, total) => `Страница ${p}/${total}`,
  },
};

export function exportTermsToPDF(
  termsData: TermsExportData,
  options: { download?: boolean } = { download: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  registerUnicodeFonts(doc);
  doc.setFont('Roboto', 'normal');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  const bottomMargin = 20;

  let currentY = 24;

  const docTitle = termsData.title || 'Allgemeine Geschäftsbedingungen';
  const lastUpdated = termsData.lastUpdated || new Date().toLocaleDateString('de-DE');
  const version = termsData.version || '1.0.0';
  const langKey = (termsData.language || 'de') as LanguageCode;
  const langUpper = langKey.toUpperCase();
  const tObj = TERMS_PDF_I18N[langKey] || TERMS_PDF_I18N.de;

  // Helper for page break check during content flow
  const checkTermsPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      currentY = 24;
    }
  };

  // 1. Top Cover / Summary Banner (Page 1)
  doc.setFillColor(...COLORS.bgLight);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(margin, currentY, contentWidth, 28, 2, 2, 'FD');

  // Left accent strip
  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, currentY, 3.5, 28, 'F');

  // Pill badge
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.primaryDark);
  const badgeWidth = doc.getTextWidth(tObj.badge) + 6;
  doc.setFillColor(...COLORS.primaryLight);
  doc.roundedRect(margin + 7, currentY + 4, Math.max(75, badgeWidth), 4.5, 1, 1, 'F');
  doc.text(tObj.badge, margin + 9, currentY + 7.2);

  // Main Document Title
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.textDark);
  const titleLines = doc.splitTextToSize(docTitle, contentWidth - 14);
  doc.text(titleLines[0] || docTitle, margin + 7, currentY + 14);

  // Key Metadata badges (Stand, Version, Sprache)
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.textMuted);

  const metaText1 = `${tObj.validDate} ${lastUpdated}`;
  const metaText2 = `${tObj.versionLabel} v${version}`;
  const metaText3 = `${tObj.languageLabel} ${langUpper}`;

  const meta1Width = doc.getTextWidth(metaText1);
  const meta2X = Math.max(margin + 75, margin + 7 + meta1Width + 6);
  const meta2Width = doc.getTextWidth(metaText2);
  const meta3X = Math.max(margin + 130, meta2X + meta2Width + 6);

  doc.text(metaText1, margin + 7, currentY + 20);
  doc.text(metaText2, meta2X, currentY + 20);
  doc.text(metaText3, meta3X, currentY + 20);

  // Subtitle / Legal compliance note
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...COLORS.textMuted);
  doc.text(tObj.platformNotice, margin + 7, currentY + 25);

  currentY += 34;

  // 2. Parse and render markdown sections
  const lines = (termsData.content || '').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      currentY += 2.5;
      continue;
    }

    // Horizontal Divider
    if (line === '---' || line === '***' || line === '___') {
      checkTermsPageBreak(6);
      doc.setDrawColor(...COLORS.border);
      doc.setLineWidth(0.25);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 5;
      continue;
    }

    // Section Header (### § ...)
    if (line.startsWith('### ')) {
      const headingText = line.replace('### ', '').trim();
      checkTermsPageBreak(14);

      // Section title box
      doc.setFillColor(...COLORS.bgLight);
      doc.setDrawColor(...COLORS.border);
      doc.roundedRect(margin, currentY, contentWidth, 7.5, 1.5, 1.5, 'FD');

      // Small teal accent dot/bar
      doc.setFillColor(...COLORS.primary);
      doc.rect(margin, currentY, 2.5, 7.5, 'F');

      doc.setFont('Roboto', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.textDark);
      doc.text(headingText, margin + 5, currentY + 5);

      currentY += 10.5;
      continue;
    }

    // Main Header (## ...)
    if (line.startsWith('## ')) {
      const headingText = line.replace('## ', '').trim();
      checkTermsPageBreak(12);

      doc.setFont('Roboto', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...COLORS.primaryDark);
      doc.text(headingText, margin, currentY + 4);

      currentY += 8;
      continue;
    }

    // Bullet point list item (- ...)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.substring(2).trim();
      const cleanBulletText = bulletText.replace(/\*\*(.*?)\*\*/g, '$1');
      const bulletLines = doc.splitTextToSize(cleanBulletText, contentWidth - 10);
      const neededHeight = bulletLines.length * 3.8 + 2;

      checkTermsPageBreak(neededHeight);

      // Bullet dot
      doc.setFillColor(...COLORS.primary);
      doc.circle(margin + 3, currentY + 1.8, 0.8, 'F');

      doc.setFont('Roboto', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...COLORS.textDark);
      doc.text(bulletLines, margin + 7, currentY + 2.5);

      currentY += neededHeight;
      continue;
    }

    // Regular paragraph text
    const cleanParagraph = line.replace(/\*\*(.*?)\*\*/g, '$1');
    const wrappedLines = doc.splitTextToSize(cleanParagraph, contentWidth);
    const neededHeight = wrappedLines.length * 3.8 + 2;

    checkTermsPageBreak(neededHeight);

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59); // Slate 800

    doc.text(wrappedLines, margin, currentY + 2.5);
    currentY += neededHeight;
  }

  // 3. Draw Header and Footer on EVERY page
  const totalPages = (doc as any).internal.getNumberOfPages();

  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // --- Header on every page ---
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.primary);
    doc.text(tObj.headerTitle, margin, 10);

    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    const headerRightText = `${docTitle} | ${tObj.headerStand} ${lastUpdated} | ${tObj.headerVer} ${version} | ${langUpper}`;
    const headerRightWidth = doc.getTextWidth(headerRightText);
    doc.text(headerRightText, pageWidth - margin - headerRightWidth, 10);

    // Header divider line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(margin, 13, pageWidth - margin, 13);

    // --- Footer on every page ---
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    // Footer Left: Title, Version, Stand / Gültigkeitsdatum
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.textMuted);
    const footerLeftText = `${docTitle} • ${tObj.versionLabel} ${version} (${tObj.footerStand} ${lastUpdated}) • ${langUpper}`;
    doc.text(footerLeftText, margin, pageHeight - 7.5);

    // Footer Right: Page number in localized format
    const pageNumText = tObj.pageNum(p, totalPages);
    const pageNumWidth = doc.getTextWidth(pageNumText);
    doc.setFont('Roboto', 'bold');
    doc.setTextColor(...COLORS.primaryDark);
    doc.text(pageNumText, pageWidth - margin - pageNumWidth, pageHeight - 7.5);
  }

  if (options.download) {
    const cleanVer = version.replace(/[^a-zA-Z0-9._-]/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `AGB_v${cleanVer}_${langUpper}_${dateStr}.pdf`;
    doc.save(filename);
  }

  return doc;
}
