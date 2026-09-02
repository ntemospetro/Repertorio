export interface MedicationSuggestion {
  name: string;
  category?: string;
  defaultDosages: string[];
  commonForms?: string[];
  activeSubstance?: string;
  recommendedIntake?: string;
  sideEffects?: string[];
  interactions?: string[];
  warnings?: string;
}

export const COMMON_MEDICATIONS_DB: MedicationSuggestion[] = [
  {
    name: 'Ibuprofen',
    activeSubstance: 'Ibuprofen',
    category: 'NSAR / Schmerzmittel & Entzündungshemmer',
    defaultDosages: ['200 mg', '400 mg', '600 mg', '800 mg'],
    commonForms: ['Filmtablette', 'Granulat', 'Zäpfchen'],
    recommendedIntake: '1-3x täglich unzerkaut mit einem Glas Wasser nach den Mahlzeiten',
    sideEffects: [
      'Magen-Darm-Beschwerden (Sodbrennen, Bauchschmerzen, Übelkeit)',
      'Erhöhtes Risiko für Magengeschwüre und Magen-Darm-Blutungen',
      'Kopfschmerzen, Schwindel',
      'Beeinträchtigung der Nierenfunktion bei Dehydrierung oder Dauergebrauch',
      'Gelegentlich allergische Hautreaktionen oder Asthma-Anfälle'
    ],
    interactions: [
      'Andere NSAR und Acetylsalicylsäure (ASS) (erhöhtes Ulkusrisiko)',
      'Antikoagulanzien / Blutverdünner (stark erhöhtes Blutungsrisiko)',
      'Antihypertensiva / ACE-Hemmer / Sartane (Abschwächung der Blutdrucksenkung)',
      'Lithium und Methotrexat (erhöhte Wirkstoffspiegel & Toxizität)',
      'Alkohol (verstärkte Magenschleimhautreizung)'
    ],
    warnings: 'Kontraindiziert bei aktiven gastrointestinalen Ulzera, schwerer Herz-, Leber- oder Niereninsuffizienz sowie im letzten Schwangerschaftsdrittel.'
  },
  {
    name: 'Paracetamol',
    activeSubstance: 'Paracetamol',
    category: 'Analgetikum / Antipyretikum',
    defaultDosages: ['500 mg', '1000 mg', '125 mg', '250 mg'],
    commonForms: ['Tablette', 'Brausetablette', 'Zäpfchen', 'Saft'],
    recommendedIntake: 'Alle 6-8 Stunden bei Schmerzen oder Fieber (max. 4000 mg pro Tag)',
    sideEffects: [
      'Hepatotoxizität (Leberschäden) bei Überdosierung (> 4 g/Tag)',
      'Selten allergische Hautreaktionen (Exanthem, Urtikaria)',
      'Sehr selten hämatologische Veränderungen (Thrombozytopenie, Leukopenie)'
    ],
    interactions: [
      'Alkohol (stark erhöhtes Risiko für toxische Leberschäden)',
      'Enzyminduktoren (z. B. Carbamazepin, Phenytoin, Rifampicin)',
      'Cumarin-Antikoagulanzien (bei dauerhafter Einnahme INR-Verschiebung)'
    ],
    warnings: 'Nicht anwenden bei schwerer Leberfunktionsstörung. Streng auf die maximale Tagesdosis achten.'
  },
  {
    name: 'Aspirin (ASS)',
    activeSubstance: 'Acetylsalicylsäure',
    category: 'NSAR / Thrombozytenaggregationshemmer',
    defaultDosages: ['100 mg', '300 mg', '500 mg'],
    commonForms: ['Tablette', 'Brausetablette', 'Kautablette'],
    recommendedIntake: '100 mg 1x täglich zur Thrombozytenhemmung oder 500 mg bei akuten Schmerzen mit viel Wasser',
    sideEffects: [
      'Verlängerte Blutungszeit, Hämatome, Nasenbluten',
      'Gastrointestinale Beschwerden (Magenschmerzen, Mikroblutungen)',
      'Asthmaanfälle bei empfindlichen Patienten (Analgetika-Asthma)',
      'Tinnitus oder Schwindel bei hoher Dosierung'
    ],
    interactions: [
      'Andere Blutgerinnungshemmer (Heparine, DOAK, Cumarine)',
      'Andere NSAR (Ibuprofen schwächt die thrombozytenhemmende Wirkung von ASS ab)',
      'Kortikosteroide (erhöhtes Risiko für gastrointestinale Blutungen)',
      'Methotrexat (erhöhte Toxizität)'
    ],
    warnings: 'Kontraindiziert bei Magen-Darm-Ulcera, hämorrhagischer Diathese und Kindern mit Virusinfekten (Reye-Syndrom).'
  },
  {
    name: 'Novalgin (Metamizol)',
    activeSubstance: 'Metamizol-Natrium',
    category: 'Nicht-Opioid-Analgetikum / Krampflösend & Antipyretisch',
    defaultDosages: ['500 mg', '1000 mg', '20 Tropfen (500 mg)'],
    commonForms: ['Filmtablette', 'Tropfen', 'Injektionslösung'],
    recommendedIntake: 'Bedarfsorientiert bis zu 4-mal täglich 500-1000 mg mit etwas Wasser',
    sideEffects: [
      'Agranulozytose (seltene, aber lebensbedrohliche Abnahme der Granulozyten)',
      'Blutdruckabfall (Hypotonie) insbesondere bei schneller Applikation',
      'Arzneimittelinduzierter Leberschaden (DILI)',
      'Hautreaktionen (z. B. Stevens-Johnson-Syndrom)'
    ],
    interactions: [
      'Methotrexat (erhöhte Hämatotoxizität)',
      'Ciclosporin (Absenkung des Ciclosporinspiegels)',
      'Bupropion (Senkung des Bupropionspiegels)',
      'Alkohol (potenzierte Wirkung)'
    ],
    warnings: 'Sofortiges Absetzen bei Fieber, Halsschmerzen oder Schleimhautulzerationen (Agranulozytose-Verdacht).'
  },
  {
    name: 'Diclofenac (Voltaren)',
    activeSubstance: 'Diclofenac-Natrium',
    category: 'NSAR / Antirheumatikum',
    defaultDosages: ['25 mg', '50 mg', '75 mg', '100 mg retard'],
    commonForms: ['Tablette', 'Retardkapsel', 'Gel', 'Zäpfchen'],
    recommendedIntake: '1-2x täglich unzerkaut vor den Mahlzeiten mit reichlich Flüssigkeit',
    sideEffects: [
      'Gastrointestinale Reizungen, Übelkeit, Ulzera, okkulte Blutungen',
      'Kardiovaskuläres Risiko (erhöhte Gefahr für Myokardinfarkt und Schlaganfall)',
      'Transaminasenanstieg (Leberwerte)',
      'Nierenfunktionseinschränkung und Ödeme'
    ],
    interactions: [
      'Thrombozytenaggregationshemmer und orale Antikoagulanzien',
      'ACE-Hemmer und Diuretika (Nephrotoxizität und Wirkungsabfall)',
      'Digoxin und Phenytoin (Erhöhung der Plasmakonzentration)'
    ],
    warnings: 'Kontraindiziert bei bekannter Herzinsuffizienz (NYHA II-IV), ischämischer Herzkrankheit und peripherer arterieller Verschlusskrankheit.'
  },
  {
    name: 'Pantoprazol',
    activeSubstance: 'Pantoprazol',
    category: 'Protonenpumpeninhibitor (Magenschutz)',
    defaultDosages: ['20 mg', '40 mg'],
    commonForms: ['Magensaftresistente Tablette'],
    recommendedIntake: '1x täglich morgens ca. 30-60 Minuten vor dem Frühstück nüchtern mit Wasser',
    sideEffects: [
      'Kopfschmerzen, Schwindelgefühl',
      'Gastrointestinale Beschwerden (Durchfall, Verstopfung, Blähungen)',
      'Bei Langzeitanwendung: verminderte Aufnahme von Vitamin B12, Magnesium und Calcium',
      'Erhöhtes Risiko für Clostridioides-difficile-Infektionen'
    ],
    interactions: [
      'Wirkstoffe mit pH-abhängiger Resorption (Ketoconazol, Atazanavir, Eisen)',
      'Cumarin-Antikoagulanzien (INR-Schwankungen)',
      'Methotrexat (erhöhte Methotrexat-Spiegel)'
    ],
    warnings: 'Langzeittherapie regelmäßig auf Notwendigkeit prüfen; bei Absetzen ausschleichen, um Rebound-Säuresekretion zu vermeiden.'
  },
  {
    name: 'Omeprazol',
    activeSubstance: 'Omeprazol',
    category: 'Protonenpumpeninhibitor (Magenschutz)',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Magensaftresistente Kapsel'],
    recommendedIntake: '1x täglich morgens nüchtern mit ausreichend Flüssigkeit vor der Mahlzeit',
    sideEffects: [
      'Gastrointestinale Störungen (Übelkeit, Meteorismus, Diarrhoe)',
      'Schlafstörungen, Kopfschmerzen',
      'Hypomagnesiämie bei längerer Einnahme',
      'Erhöhtes Risiko für Knochenfrakturen bei jahrelangem Gebrauch'
    ],
    interactions: [
      'Clopidogrel (Abschwächung der thrombozytenhemmenden Wirkung durch CYP2C19-Hemmung)',
      'Diazepam, Phenytoin, Warfarin (verzögerte Elimination)',
      'HIV-Proteaseinhibitoren'
    ],
    warnings: 'Vermeidung der gleichzeitigen Anwendung mit Clopidogrel empfohlen.'
  },
  {
    name: 'L-Thyroxin (Levothyroxin)',
    activeSubstance: 'Levothyroxin-Natrium',
    category: 'Schilddrüsenhormon',
    defaultDosages: ['25 µg', '50 µg', '75 µg', '100 µg', '125 µg', '150 µg'],
    commonForms: ['Tablette'],
    recommendedIntake: 'Täglich morgens nüchtern mindestens 30 Minuten vor dem Frühstück nur mit Wasser einnehmen',
    sideEffects: [
      'Bei Überdosierung: Tachykardie, Herzklopfen, Herzrhythmusstörungen, innere Unruhe, Zittern, Schwitzen, Schlaflosigkeit, Gewichtsverlust'
    ],
    interactions: [
      'Calcium-, Eisen-, Aluminium- und Magnesiumpräparate (mindestens 2-4 Stunden Abstand einhalten)',
      'Soja- und ballaststoffreiche Nahrungsmittel (verringern die Aufnahme)',
      'Antidiabetika (Blutzuckersenkung kann vermindert werden)',
      'Cumarin-Derivate (Verstärkung der Antikoagulanzienwirkung)'
    ],
    warnings: 'Dosis muss anhand regelmäßiger TSH-Blutkontrollen individuell austitriert werden. Nicht zur Gewichtsreduktion verwenden.'
  },
  {
    name: 'Ramipril',
    activeSubstance: 'Ramipril',
    category: 'ACE-Hemmer (Blutdruck & Herz)',
    defaultDosages: ['2.5 mg', '5 mg', '10 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens zur gleichen Zeit unabhängig von den Mahlzeiten mit Wasser',
    sideEffects: [
      'Trockener Reizhusten (charakteristischer ACE-Hemmer-Husten)',
      'Hypotonie, Schwindel, Müdigkeit',
      'Hyperkaliämie (erhöhter Kaliumspiegel)',
      'Angioödem (selten, aber potenziell lebensbedrohlich)',
      'Verschlechterung der Nierenfunktion'
    ],
    interactions: [
      'Kaliumsparende Diuretika und Kaliumpräparate (Gefahr schwerer Hyperkaliämie)',
      'NSAR (Ibuprofen, Diclofenac) (Wirkungsabschwächung und Nierenrisiko)',
      'Lithium (erhöhte Toxizität)',
      'Andere Antihypertensiva (additive Blutdrucksenkung)'
    ],
    warnings: 'Kontraindiziert bei anamnestischem Angioödem, beidseitiger Nierenarterienstenose und in der Schwangerschaft.'
  },
  {
    name: 'Bisoprolol',
    activeSubstance: 'Bisoprolol',
    category: 'Kardioselektiver Betablocker',
    defaultDosages: ['1.25 mg', '2.5 mg', '5 mg', '10 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens unzerkaut mit etwas Wasser zum Frühstück',
    sideEffects: [
      'Bradykardie (verlangsamter Puls), Blutdruckabfall',
      'Müdigkeit, Schwindel, Kopfschmerzen',
      'Kältegefühl in den Extremitäten (Raynaud-Phänomen)',
      'Bronchospasmus bei vorbestehendem Asthma bronchiale',
      'Gastrointestinale Beschwerden'
    ],
    interactions: [
      'Calciumkanalblocker vom Verapamil- oder Diltiazem-Typ (Gefahr von AV-Block und Asystolie)',
      'Antidiabetika und Insulin (Maskierung von Hypoglykämiesymptomen wie Tachykardie)',
      'Digitalisglykoside (Verlangsamung der Erregungsleitung)'
    ],
    warnings: 'Niemals abrupt absetzen (Rebound-Phänomen mit Tachykardie und Angina Pectoris). Langsam ausschleichen.'
  },
  {
    name: 'Amlodipin',
    activeSubstance: 'Amlodipin',
    category: 'Calciumantagonist vom Dihydropyridin-Typ (Blutdruck)',
    defaultDosages: ['5 mg', '10 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens unzerkaut mit einem Glas Wasser',
    sideEffects: [
      'Periphere Ödeme (Knöchelschwellungen)',
      'Kopfschmerzen, Schwindel, Flush (Gesichtsrötung mit Hitzegefühl)',
      'Müdigkeit, Palpitationen (Herzklopfen)'
    ],
    interactions: [
      'Grapefruitsaft (erhöht die Bioverfügbarkeit und verstärkt Nebenwirkungen)',
      'CYP3A4-Inhibitoren (z.B. Ketoconazol, Erythromycin, Diltiazem)',
      'Simvastatin (erhöhtes Myopathierisiko, Simvastatin-Dosis auf max. 20 mg begrenzen)'
    ],
    warnings: 'Vorsicht bei schwerer Aortenstenose und dekompensierter Herzinsuffizienz.'
  },
  {
    name: 'Metformin',
    activeSubstance: 'Metforminhydrochlorid',
    category: 'Oraler Antidiabetikum (Biguanid)',
    defaultDosages: ['500 mg', '850 mg', '1000 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: 'Zu oder nach den Mahlzeiten einnehmen, um Magen-Darm-Nebenwirkungen zu reduzieren',
    sideEffects: [
      'Gastrointestinale Störungen (Übelkeit, Erbrechen, Diarrhoe, Blähungen, metallischer Geschmack)',
      'Laktatazidose (sehr selten, aber potenziell fatal)',
      'Vitamin-B12-Mangel bei Langzeitanwendung'
    ],
    interactions: [
      'Alkohol (akute Vergiftung erhöht massiv das Risiko einer Laktatazidose)',
      'Iodhaltige Röntgenkontrastmittel (Gefahr des Nierenversagens; vorher pausieren)',
      'NSAR und ACE-Hemmer (können durch renale Effekte Laktatazidose begünstigen)'
    ],
    warnings: 'Kontraindiziert bei GFR < 30 ml/min, schwerer Leberinsuffizienz, Sepsis und akutem Myokardinfarkt.'
  },
  {
    name: 'Eliquis (Apixaban)',
    activeSubstance: 'Apixaban',
    category: 'Direktes Orales Antikoagulans (DOAK / Faktor-Xa-Hemmer)',
    defaultDosages: ['2.5 mg', '5 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '2x täglich (morgens und abends im Abstand von 12 Stunden) mit Wasser unabhängig von Mahlzeiten',
    sideEffects: [
      'Erhöhtes Blutungsrisiko (Hämatome, Zahnfleischbluten, Epistaxis)',
      'Gastrointestinale Blutungen oder Ulzera',
      'Hämaturie (Blut im Urin)',
      'Anämie, Übelkeit, erhöhte Lebertransaminasen'
    ],
    interactions: [
      'Starke CYP3A4- und P-gp-Inhibitoren (z. B. Ketoconazol, Itraconazol)',
      'Starke CYP3A4- und P-gp-Induktoren (z. B. Rifampicin, Johanniskraut, Carbamazepin)',
      'Andere Blutgerinnungshemmer (Heparine, Warfarin, Phenprocoumon)',
      'NSAR (Ibuprofen, Diclofenac) und Thrombozytenaggregationshemmer (starkes Blutungsrisiko)',
      'SSRI / SNRI (erhöhtes Risiko für gastrointestinale Schleimhautblutungen)'
    ],
    warnings: 'Nicht absetzen ohne ärztliche Rücksprache (Thromboserisiko). Vor geplanten Operationen rechtzeitig pausieren.'
  },
  {
    name: 'Xarelto (Rivaroxaban)',
    activeSubstance: 'Rivaroxaban',
    category: 'Direktes Orales Antikoagulans (DOAK / Faktor-Xa-Hemmer)',
    defaultDosages: ['10 mg', '15 mg', '20 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '15 mg und 20 mg müssen unbedingt ZUSAMMEN mit einer Mahlzeit eingenommen werden (erhöht Bioverfügbarkeit)',
    sideEffects: [
      'Blutungskomplikationen (ZNS, Magen-Darm, Weichteile, Urogenital)',
      'Schwindel, Kopfschmerzen',
      'Transaminasenanstieg, Schwellungen der Gliedmaßen'
    ],
    interactions: [
      'Andere Antikoagulanzien und Thrombozytenfunktionshemmer (ASS, Clopidogrel)',
      'NSAR (vervielfachtes gastrointestinales Blutungsrisiko)',
      'CYP3A4- und P-gp-Hemmer oder -Induktoren'
    ],
    warnings: 'Kontraindiziert bei akuten klinisch relevanten Blutungen, schwerer Lebererkrankung mit Koagulopathie sowie in Schwangerschaft und Stillzeit.'
  },
  {
    name: 'Torasemid',
    activeSubstance: 'Torasemid',
    category: 'Schleifendiuretikum (Entwässerungsmittel)',
    defaultDosages: ['2.5 mg', '5 mg', '10 mg', '20 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens mit etwas Flüssigkeit zum Frühstück',
    sideEffects: [
      'Elektrolytverschiebungen (Hypokaliämie, Hyponatriämie, Hypocalcämie)',
      'Hypovolämie und Dehydratation, Hypotonie',
      'Anstieg von Harnsäure (Gichtgefahr), Kreatinin und Blutzucker',
      'Wadenkrämpfe, Schwindel, Kopfschmerzen'
    ],
    interactions: [
      'Digitalisglykoside (Toxizität steigt bei Hypokaliämie)',
      'Lithium (verminderte Lithiumausscheidung)',
      'NSAR (verminderte diuretische und antihypertensive Wirkung)',
      'Ototoxische und nephrotoxische Arzneimittel (Aminoglykoside, Cisplatin)'
    ],
    warnings: 'Regelmäßige Kontrolle von Kalium, Natrium und Nierenwerten erforderlich.'
  },
  {
    name: 'Methylprednisolon',
    activeSubstance: 'Methylprednisolon',
    category: 'Glukokortikoide / Systemische Kortikosteroide',
    defaultDosages: ['4 mg', '8 mg', '16 mg', '32 mg'],
    commonForms: ['Tablette', 'Kristallsuspension', 'Injektionslösung'],
    recommendedIntake: 'Morgens zwischen 6 und 8 Uhr (zirkadiane Rhythmik) unzerkaut mit reichlich Flüssigkeit zum Frühstück',
    sideEffects: [
      'Cushing-Syndrom (Mondgesicht, Stammfettsucht)',
      'Hyperglykämie und verminderte Glukosetoleranz',
      'Hypertonie und Natrium-/Flüssigkeitsretention',
      'Osteoporose und Muskelatrophie bei Langzeitanwendung',
      'Erhöhtes Infektionsrisiko und Magen-Darm-Ulcera'
    ],
    interactions: [
      'NSAR (erheblich gesteigertes Magen-Darm-Blutungsrisiko)',
      'Antidiabetika (Abschwächung der blutzuckersenkenden Wirkung)',
      'Schleifendiuretika / Thiazide (verstärkter Kaliumverlust / Hypokaliämie)',
      'CYP3A4-Inhibitoren (z. B. Ketoconazol, Clarithromycin: verstärkte Kortikoidwirkung)'
    ],
    warnings: 'Niemals abrupt absetzen; schrittweise ausschleichen, um eine lebensbedrohliche akute Nebennierenrindeninsuffizienz zu vermeiden.'
  },
  {
    name: 'Urbason (Methylprednisolon)',
    activeSubstance: 'Methylprednisolon',
    category: 'Glukokortikoide / Systemische Kortikosteroide',
    defaultDosages: ['4 mg', '8 mg', '16 mg', '40 mg'],
    commonForms: ['Tablette', 'Injektionsflasche'],
    recommendedIntake: '1x täglich morgens mit dem Frühstück unzerkaut einnehmen',
    sideEffects: [
      'Gewichtszunahme, Mondgesicht, Wasseransammlung',
      'Blutzucker- und Blutdruckanstieg',
      'Schlafstörungen, Unruhe, Stimmungsschwankungen',
      'Magenbeschwerden, Risiko für Schleimhautulzera'
    ],
    interactions: [
      'Schmerzmittel / NSAR (Ibuprofen, Diclofenac)',
      'Antidiabetika (Insulin, Metformin)',
      'Entwässerungstabletten (Kaliumverlust)'
    ],
    warnings: 'Bei Dauertherapie Magenschutz (z. B. Pantoprazol) und Osteoporose-Prophylaxe (Calcium/Vitamin D) erwägen.'
  },
  {
    name: 'Prednisolon (Decortin H)',
    activeSubstance: 'Prednisolon',
    category: 'Glukokortikoide / Systemische Kortikosteroide',
    defaultDosages: ['5 mg', '10 mg', '20 mg', '50 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens zwischen 6 und 8 Uhr nüchtern oder zum Frühstück mit Wasser',
    sideEffects: [
      'Gewichtszunahme, Umverteilung des Fettgewebes',
      'Blutdruck- und Blutzuckeranstieg',
      'Hautatrophie, Wundheilungsstörungen',
      'Erhöhte Infektanfälligkeit'
    ],
    interactions: [
      'NSAR (erhöhte Ulkusgefahr)',
      'Kaliumsenkende Diuretika',
      'Antikoagulanzien (INR-Schwankungen)'
    ],
    warnings: 'Dosis bei längerer Einnahme immer schrittweise reduzieren (Ausschleichen).'
  },
  {
    name: 'Dexamethason (Fortecortin)',
    activeSubstance: 'Dexamethason',
    category: 'Stark wirksames Glukokortikoid',
    defaultDosages: ['0.5 mg', '1.5 mg', '4 mg', '8 mg'],
    commonForms: ['Tablette', 'Injektionslösung'],
    recommendedIntake: 'Morgens mit reichlich Flüssigkeit zum Essen einnehmen',
    sideEffects: [
      'Schlafstörungen, Euphorie oder Depression',
      'Glukosetoleranzstörung',
      'Ödembildung, Muskelschwäche'
    ],
    interactions: [
      'CYP3A4-Induktoren (Phenytoin, Rifampicin: Wirkungsabfall)',
      'NSAR und Thrombozytenaggregationshemmer'
    ],
    warnings: 'Sehr hohe antiinflammatorische Potenz (ca. 7,5x stärker als Prednisolon).'
  },
  {
    name: 'Metoprolol (Beloc-Zok)',
    activeSubstance: 'Metoprololsuccinat',
    category: 'Kardioselektiver Beta-1-Rezeptorenblocker',
    defaultDosages: ['23.75 mg', '47.5 mg', '95 mg', '190 mg'],
    commonForms: ['Retardtablette'],
    recommendedIntake: '1x täglich morgens unzerkaut mit einem Glas Wasser einnehmen',
    sideEffects: [
      'Bradykardie (verlangsamter Puls), Hypotonie',
      'Müdigkeit, Schwindelgefühl, Kopfschmerzen',
      'Kältegefühl in den Extremitäten',
      'Bronchospasmus bei Asthmapatienten'
    ],
    interactions: [
      'Calciumkanalblocker vom Verapamil- oder Diltiazem-Typ (Gefahr von AV-Block und Asystolie)',
      'Antiarrhythmika (z. B. Amiodaron)',
      'Digitalisglykoside (starke Bradykardie)'
    ],
    warnings: 'Kontraindiziert bei kardiogenem Schock, AV-Block II. und III. Grades sowie schwerem Asthma bronchiale.'
  },
  {
    name: 'Bisoprolol (Concor)',
    activeSubstance: 'Bisoprololhemifumarat',
    category: 'Kardioselektiver Betablocker',
    defaultDosages: ['2.5 mg', '5 mg', '10 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '1x täglich morgens vor, zu oder nach dem Frühstück einnehmen',
    sideEffects: [
      'Verlangsamung der Herzfrequenz (Bradykardie)',
      'Schwindel, Erschöpfung, orthostatische Hypotonie',
      'Parästhesien oder Kältegefühl an Fingern/Zehen'
    ],
    interactions: [
      'Calciumantagonisten (Verapamil, Diltiazem)',
      'Zentral wirksame Antihypertensiva (Clonidin)',
      'NSAR (Abschwächung der Blutdrucksenkung)'
    ],
    warnings: 'Nicht abrupt absetzen; Risiko für Rebound-Hypertonie und Tachykardie.'
  },
  {
    name: 'Candesartan (Blopress)',
    activeSubstance: 'Candesartancilexetil',
    category: 'Angiotensin-II-Rezeptor-Antagonist (Sartan / AT1-Blocker)',
    defaultDosages: ['4 mg', '8 mg', '16 mg', '32 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich zur gleichen Tageszeit unabhängig von den Mahlzeiten',
    sideEffects: [
      'Schwindel, Kopfschmerzen',
      'Hyperkaliämie (erhöhtes Kalium)',
      'Renale Funktionseinschränkung bei Nierenarterienstenose',
      'Hypotonie'
    ],
    interactions: [
      'Kaliumsparende Diuretika, Kaliumpräparate, ACE-Hemmer (Hyperkaliämie)',
      'Lithium (erhöhte Lithiumkonzentration)',
      'NSAR (Nierenfunktionsverschlechterung)'
    ],
    warnings: 'Kontraindiziert im 2. und 3. Trimester der Schwangerschaft sowie bei schwerer Leberfunktionsstörung.'
  },
  {
    name: 'Valsartan (Diovan)',
    activeSubstance: 'Valsartan',
    category: 'AT1-Rezeptorantagonist (Sartan)',
    defaultDosages: ['80 mg', '160 mg', '320 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '1-2x täglich mit etwas Wasser unabhängig vom Essen',
    sideEffects: [
      'Schwindel, orthostatische Hypotonie',
      'Hyperkaliämie, Nierenwertanstieg',
      'Ermüdung'
    ],
    interactions: [
      'Kaliumpräparate und kaliumsparende Diuretika',
      'NSAR (Schwächung der Blutdrucksenkung)'
    ],
    warnings: 'Schwangerschaftskontraindikation; regelmäßige Kontrolle von Kalium und Kreatinin.'
  },
  {
    name: 'Amlodipin (Norvasc)',
    activeSubstance: 'Amlodipinbesilat',
    category: 'Calciumkanalblocker (Dihydropyridin)',
    defaultDosages: ['5 mg', '10 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens mit Wasser unabhängig von Mahlzeiten',
    sideEffects: [
      'Knöchelödeme (Flüssigkeitsansammlungen an den Beinen)',
      'Gesichtsrötung (Flush), Hitzegefühl',
      'Kopfschmerzen, Schwindel, Müdigkeit'
    ],
    interactions: [
      'CYP3A4-Inhibitoren (Ketoconazol, Erythromycin: erhöhte Amlodipin-Spiegel)',
      'Grapefruitsaft (verstärkter Blutdruckabfall)',
      'Simvastatin (Dosis von Simvastatin auf max. 20 mg/Tag begrenzen)'
    ],
    warnings: 'Dosis von Simvastatin bei gleichzeitiger Einnahme reduzieren; Vorsicht bei schwerer Aortenstenose.'
  },
  {
    name: 'Simvastatin (Zocor)',
    activeSubstance: 'Simvastatin',
    category: 'HMG-CoA-Reduktase-Inhibitor (Statin / Cholesterinsenker)',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '1x täglich abends mit etwas Wasser einnehmen',
    sideEffects: [
      'Myalgie (Muskelschmerzen), Myopathie',
      'Transaminasenanstieg (Leberwerte)',
      'Gastrointestinale Beschwerden',
      'Sehr selten Rhabdomyolyse'
    ],
    interactions: [
      'Starke CYP3A4-Inhibitoren (Itraconazol, Ketoconazol, Clarithromycin: Rhabdomyolysierisiko)',
      'Grapefruitsaft (starke Wirkungsverstärkung)',
      'Amlodipin (maximal 20 mg Simvastatin)',
      'Cumarine (INR-Anstieg)'
    ],
    warnings: 'Bei unerklärlichen Muskelschmerzen oder dunklem Urin sofort Arzt konsultieren.'
  },
  {
    name: 'Atorvastatin (Sortis)',
    activeSubstance: 'Atorvastatin-Calcium',
    category: 'HMG-CoA-Reduktase-Hemmer (Statin / Lipidsenker)',
    defaultDosages: ['10 mg', '20 mg', '40 mg', '80 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '1x täglich zu jeder Tageszeit mit Wasser einnehmen',
    sideEffects: [
      'Muskelschmerzen, Gelenkschmerzen, Muskelkrämpfe',
      'Leberwerterhöhung',
      'Kopfschmerzen, Übelkeit, Diarrhö',
      'Leichter Blutzuckeranstieg'
    ],
    interactions: [
      'CYP3A4-Inhibitoren (Erythromycin, Diltiazem)',
      'Ciclosporin (stark erhöhte Atorvastatin-Spiegel)',
      'Clarithromycin (Dosis auf max. 20 mg begrenzen)'
    ],
    warnings: 'Kontraindiziert bei aktiver Lebererkrankung und in Schwangerschaft/Stillzeit.'
  },
  {
    name: 'Furosemid (Lasix)',
    activeSubstance: 'Furosemid',
    category: 'Schleifendiuretikum (starkes Entwässerungsmittel)',
    defaultDosages: ['20 mg', '40 mg', '500 mg'],
    commonForms: ['Tablette', 'Injektionslösung'],
    recommendedIntake: 'Morgens nüchtern mit ausreichend Flüssigkeit einnehmen',
    sideEffects: [
      'Massiver Elektrolytverlust (Hypokaliämie, Hyponatriämie)',
      'Dehydratation, Hypovolämie und Kreislaufkollaps',
      'Harnsäureanstieg (Gichtanfälle)',
      'Ototoxizität (Hörstörungen bei schneller iv-Gabe)'
    ],
    interactions: [
      'Digitalis (Arrhythmien bei Kaliummangel)',
      'NSAR (verringern diuretische Wirkung)',
      'Nephrotoxische Antibiotika (Aminoglykoside)'
    ],
    warnings: 'Elektrolyte und Kreatinin engmaschig kontrollieren; auf ausreichende Kaliumzufuhr achten.'
  },
  {
    name: 'Spironolacton (Aldactone)',
    activeSubstance: 'Spironolacton',
    category: 'Aldosteronantagonist / Kaliumsparendes Diuretikum',
    defaultDosages: ['25 mg', '50 mg', '100 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich morgens mit dem Frühstück einnehmen',
    sideEffects: [
      'Hyperkaliämie (lebensgefährlich erhöhter Kaliumspiegel)',
      'Gynäkomastie und Brustspannen (endokrine Effekte)',
      'Menstruationsstörungen, Potenzprobleme',
      'Schwindel, Hypotonie'
    ],
    interactions: [
      'ACE-Hemmer, Sartane, Kaliumpräparate (akute Hyperkaliämiegefahr)',
      'NSAR (akutes Nierenversagen)',
      'Digoxin (erhöhte Digoxinspiegel)'
    ],
    warnings: 'Kontraindiziert bei Hyperkaliämie (> 5.0 mmol/l) und schwerer Niereninsuffizienz.'
  },
  {
    name: 'Allopurinol (Zyloric)',
    activeSubstance: 'Allopurinol',
    category: 'Urikostatikum / Harnsäuresenker (Gichttherapie)',
    defaultDosages: ['100 mg', '300 mg'],
    commonForms: ['Tablette'],
    recommendedIntake: '1x täglich nach einer Mahlzeit mit reichlich Flüssigkeit einnehmen',
    sideEffects: [
      'Allergische Hautreaktionen (Ausschlag, Pruritus, selten DRESS/Lyell)',
      'Zu Beginn der Therapie Auslösung akuter Gichtanfälle',
      'Gastrointestinale Beschwerden',
      'Transaminasenanstieg'
    ],
    interactions: [
      'Azathioprin / 6-Mercaptopurin (lebensbedrohliche Knochenmarkstoxizität; Dosis um 75% reduzieren!)',
      'Amoxicillin / Ampicillin (stark erhöhtes Risiko für Arzneimittelexanthem)',
      'Cumarine (Wirkungsverstärkung)'
    ],
    warnings: 'Bei erstem Auftreten von Hautausschlag Allopurinol sofort dauerhaft absetzen.'
  },
  {
    name: 'Citalopram (Cipramil)',
    activeSubstance: 'Citalopramhydrobromid',
    category: 'SSRI / Antidepressivum',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Filmtablette', 'Tropfen'],
    recommendedIntake: '1x täglich morgens oder abends unabhängig von Mahlzeiten',
    sideEffects: [
      'QT-Zeit-Verlängerung im EKG (Torsade de Pointes)',
      'Übelkeit, Mundtrockenheit, Schlaflosigkeit',
      'Sexuelle Dysfunktion',
      'Erhöhtes gastrointestinales Blutungsrisiko'
    ],
    interactions: [
      'MAO-Hemmer (lebensbedrohliches Serotoninsyndrom; 14 Tage Abstand)',
      'QT-verlängernde Medikamente (Amiodaron, Moxifloxacin)',
      'NSAR und Thrombozytenhemmer (Blutungsgefahr)'
    ],
    warnings: 'Maximale Tagesdosis bei Erwachsenen 40 mg, bei Älteren (> 65 J.) 20 mg wegen QT-Verlängerung.'
  },
  {
    name: 'Escitalopram (Cipralex)',
    activeSubstance: 'Escitalopramoxalat',
    category: 'Selektiver Serotonin-Wiederaufnahmehemmer (SSRI)',
    defaultDosages: ['5 mg', '10 mg', '20 mg'],
    commonForms: ['Filmtablette', 'Tropfen'],
    recommendedIntake: '1x täglich morgens oder abends mit oder ohne Nahrung',
    sideEffects: [
      'Übelkeit, Diarrhö, Schwitzen, Kopfschmerzen',
      'QTc-Verlängerung',
      'Schlafstörungen oder Schläfrigkeit',
      'Sexuelle Funktionsstörungen'
    ],
    interactions: [
      'MAO-Inhibitoren (Serotoninsyndrom)',
      'Arzneimittel mit Einfluss auf die Hämostase (NSAR, DOAK, ASS)',
      'CYP2C19-Inhibitoren (Omeprazol)'
    ],
    warnings: 'Bei Absetzen langsam ausschleichen, um Absetzsymptome zu minimieren.'
  },
  {
    name: 'Sertralin (Zoloft)',
    activeSubstance: 'Sertralinhydrochlorid',
    category: 'SSRI / Antidepressivum',
    defaultDosages: ['50 mg', '100 mg'],
    commonForms: ['Filmtablette'],
    recommendedIntake: '1x täglich morgens oder abends mit etwas Flüssigkeit',
    sideEffects: [
      'Schlaflosigkeit, Schwindel, Schläfrigkeit',
      'Gastrointestinale Beschwerden (Übelkeit, Durchfall)',
      'Tremor, Mundtrockenheit',
      'Sexuelle Dysfunktion'
    ],
    interactions: [
      'MAO-Hemmer',
      'Pimozid',
      'Blutverdünner und Thrombozytenhemmer'
    ],
    warnings: 'Zu Therapiebeginn engmaschige Überwachung auf Suizidalität bei jungen Erwachsenen.'
  },
  {
    name: 'Venlafaxin (Trevilor)',
    activeSubstance: 'Venlafaxinhydrochlorid',
    category: 'SNRI / Selektiver Serotonin-Noradrenalin-Wiederaufnahmehemmer',
    defaultDosages: ['37.5 mg', '75 mg', '150 mg', '225 mg'],
    commonForms: ['Retardkapsel'],
    recommendedIntake: '1x täglich zu den Mahlzeiten morgens oder abends als Retardpräparat',
    sideEffects: [
      'Übelkeit, Schwitzen, Mundtrockenheit',
      'Blutdruckanstieg (dosisabhängig)',
      'Schlaflosigkeit, Tremor, Schwindel',
      'Ausgeprägte Absetzsymptome beim Beenden'
    ],
    interactions: [
      'MAO-Hemmer (Serotoninsyndrom)',
      'Substanzen, die den Blutdruck steigern',
      'Antikoagulanzien und NSAR'
    ],
    warnings: 'Regelmäßige Blutdruckmessung empfohlen; extrem langsames Ausschleichen erforderlich.'
  },
  {
    name: 'Mirtazapin (Remergil)',
    activeSubstance: 'Mirtazapin',
    category: 'Noradrenerges und spezifisch serotonerges Antidepressivum (NaSSA)',
    defaultDosages: ['15 mg', '30 mg', '45 mg'],
    commonForms: ['Filmtablette', 'Schmelztablette'],
    recommendedIntake: '1x täglich abends unmittelbar vor dem Schlafengehen',
    sideEffects: [
      'Starke Sedierung und Schläfrigkeit',
      'Appetitsteigerung und deutliche Gewichtszunahme',
      'Mundtrockenheit, Obstipation',
      'Sehr selten Agranulozytose'
    ],
    interactions: [
      'Alkohol und ZNS-Dämpfer (verstärkte Sedierung)',
      'MAO-Hemmer',
      'CYP3A4-Induktoren (Carbamazepin)'
    ],
    warnings: 'Bei Fieber und Halsschmerzen Blutbild kontrollieren (Agranulozytose-Ausschluss).'
  },
  {
    name: 'Tilidin / Naloxon (Valoron N)',
    activeSubstance: 'Tilidinhydrochlorid / Naloxonhydrochlorid',
    category: 'Opioid-Analgetikum (WHO-Stufe II) mit Naloxon-Missbrauchsschutz',
    defaultDosages: ['50/4 mg', '100/8 mg', '150/12 mg', '200/16 mg'],
    commonForms: ['Retardtablette', 'Tropfen'],
    recommendedIntake: 'Alle 12 Stunden im festen Zeitschema unzerkaut mit reichlich Wasser',
    sideEffects: [
      'Schwindel, Benommenheit, Müdigkeit',
      'Übelkeit, Erbrechen (besonders zu Beginn)',
      'Obstipation (Darmträgheit)',
      'Abhängigkeitspotenzial bei Daueranwendung'
    ],
    interactions: [
      'Alkohol und Beruhigungsmittel (lebensbedrohliche Atemdepression)',
      'Andere ZNS-Dämpfer (Benzodiazepine)',
      'MAO-Hemmer'
    ],
    warnings: 'Darf nicht zermörsert werden; Naloxon schützt vor Missbrauch. Begleitendes Laxans verordnen.'
  },
  {
    name: 'Tramadol',
    activeSubstance: 'Tramadolhydrochlorid',
    category: 'Schwach wirksames Opioid-Analgetikum (WHO-Stufe II)',
    defaultDosages: ['50 mg', '100 mg retard', '150 mg retard', '200 mg retard'],
    commonForms: ['Kapsel', 'Retardtablette', 'Tropfen'],
    recommendedIntake: 'Retardtabletten alle 12 Stunden unzerkaut einnehmen',
    sideEffects: [
      'Übelkeit, Erbrechen, Schwindel, Schwitzen',
      'Obstipation, Mundtrockenheit',
      'Senkung der Krampfschwelle (epileptische Anfälle)',
      'Verwirrtheitszustände bei älteren Patienten'
    ],
    interactions: [
      'SSRI, SNRI, Triptane (hohes Risiko für Serotoninsyndrom)',
      'Arzneimittel, die die Krampfschwelle senken (Antipsychotika, Bupropion)',
      'Alkohol und Sedativa'
    ],
    warnings: 'Vorsicht bei Epilepsie oder krampfgefährdeten Patienten. Nicht mit serotonergen Arzneien kombinieren.'
  },
  {
    name: 'Amoxicillin',
    activeSubstance: 'Amoxicillin-Trihydrat',
    category: 'Aminopenicillin / Breitbandantibiotikum',
    defaultDosages: ['500 mg', '750 mg', '1000 mg'],
    commonForms: ['Filmtablette', 'Trockensaft'],
    recommendedIntake: '2-3x täglich im Abstand von 8-12 Stunden vor oder zu den Mahlzeiten mit Wasser',
    sideEffects: [
      'Gastrointestinale Beschwerden (Diarrhö, Übelkeit)',
      'Allergische Hautreaktionen (Exanthem, Urtikaria)',
      'Pilzinfektionen (Candida) von Mund oder Vagina',
      'Pseudomembranöse Kolitis'
    ],
    interactions: [
      'Allopurinol (stark erhöhtes Risiko für Hautausschläge)',
      'Methotrexat (verminderte Ausscheidung / Toxizität)',
      'Oraler Lebendimpfstoff gegen Typhus'
    ],
    warnings: 'Kontraindiziert bei Penicillin-Allergie und infektiöser Mononukleose (Pfeiffer-Drüsenfieber).'
  },
  {
    name: 'Salbutamol (Sultanol)',
    activeSubstance: 'Salbutamolsulfat',
    category: 'Beta-2-Sympathomimetikum / Rasch wirksamer Bronchodilatator (SABA)',
    defaultDosages: ['0.1 mg / Hub (100 µg)'],
    commonForms: ['Dosieraerosol', 'Inhalationspulver', 'Fertiginhalat'],
    recommendedIntake: 'Bei akutem Atemnotanfall 1-2 Hübe tief inhalieren, Atem kurz anhalten',
    sideEffects: [
      'Tremor (feinschlägiges Händezittern)',
      'Tachykardie, Herzklopfen, Palpitationen',
      'Kopfschmerzen, Unruhegefühl',
      'Hypokaliämie bei Überdosierung'
    ],
    interactions: [
      'Nichtselektive Betablocker (heben Bronchodilatation auf; Bronchospasmus)',
      'Digitalisglykoside (Arrhythmierisiko bei Hypokaliämie)',
      'Andere Sympathomimetika'
    ],
    warnings: 'Reines Bedarfsmedikament bei Asthma; bei häufigem Gebrauch (> 2x/Woche) antientzündliche Dauertherapie prüfen.'
  }
];

// In-memory cache for fast responsive lookups
const searchCache = new Map<string, MedicationSuggestion[]>();
const detailsCache = new Map<string, MedicationSuggestion>();

/**
 * Robust live search helper using public Wikipedia API (CORS enabled, no API key needed).
 * Ensures medication lookups succeed anywhere (e.g. GitHub pages, Hostinger static deployments, offline-capable).
 */
async function searchPublicMedicalApi(query: string): Promise<MedicationSuggestion[]> {
  try {
    const url = `https://de.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json&origin=*`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[1]) && data[1].length > 0) {
      const titles: string[] = data[1];
      return titles.map(title => ({
        name: title,
        activeSubstance: title,
        category: 'Recherchiertes Arzneimittel / Wirkstoff',
        defaultDosages: ['Standard'],
        commonForms: ['Tablette'],
        recommendedIntake: 'Nach ärztlicher Verordnung',
        sideEffects: ['Siehe Packungsbeilage und Arztberatung'],
        interactions: ['Vor Kombination mit anderen Medikamenten Arzt oder Apotheker befragen'],
        warnings: 'Einnahme stets mit dem behandelnden Arzt abstimmen.'
      }));
    }
  } catch {
    // Graceful fallback on network timeout or failure
  }
  return [];
}

export async function searchMedications(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();

  // Return cached result if available
  if (searchCache.has(q)) {
    return searchCache.get(q)!;
  }

  // Check local database for immediate matches
  const localMatches = COMMON_MEDICATIONS_DB.filter(m => 
    m.name.toLowerCase().includes(q) || 
    (m.activeSubstance && m.activeSubstance.toLowerCase().includes(q)) ||
    (m.category && m.category.toLowerCase().includes(q))
  );

  // If we already have strong local matches (or exact match), return them right away!
  // This provides an instant response (< 5ms) for virtually all common medications.
  const hasExactOrStrongMatch = localMatches.some(m => m.name.toLowerCase() === q || (m.activeSubstance && m.activeSubstance.toLowerCase() === q)) || localMatches.length >= 3;

  if (hasExactOrStrongMatch) {
    searchCache.set(q, localMatches);
    // Background server query to enrich cache with additional generics or brand names
    fetch(`/api/medications/search?q=${encodeURIComponent(query.trim())}`)
      .then(res => res.json())
      .then(data => {
        if (data.results && Array.isArray(data.results) && data.results.length > 0) {
          const seen = new Set(localMatches.map(m => m.name.toLowerCase().replace(/[^a-z0-9]/g, '')));
          const enriched = [...localMatches];
          for (const r of data.results) {
            const k = (r.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (k && !seen.has(k)) {
              seen.add(k);
              enriched.push({
                name: r.name,
                activeSubstance: r.activeSubstance || '',
                category: r.category || '',
                defaultDosages: Array.isArray(r.dosages) && r.dosages.length > 0 ? r.dosages : ['Standard'],
                commonForms: Array.isArray(r.commonForms) ? r.commonForms : [],
                recommendedIntake: r.recommendedIntake || '',
                sideEffects: Array.isArray(r.sideEffects) ? r.sideEffects : [],
                interactions: Array.isArray(r.interactions) ? r.interactions : [],
                warnings: r.warnings || ''
              });
            }
          }
          searchCache.set(q, enriched);
        }
      })
      .catch(() => {});
    return localMatches;
  }

  let liveResults: MedicationSuggestion[] = [];

  // Try server search endpoint first
  try {
    const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query.trim())}`, {
      signal: AbortSignal.timeout(6000)
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        liveResults = data.results.map((r: any) => ({
          name: r.name || query,
          activeSubstance: r.activeSubstance || '',
          category: r.category || '',
          defaultDosages: Array.isArray(r.dosages) && r.dosages.length > 0 ? r.dosages : ['Standard'],
          commonForms: Array.isArray(r.commonForms) ? r.commonForms : [],
          recommendedIntake: r.recommendedIntake || '',
          sideEffects: Array.isArray(r.sideEffects) ? r.sideEffects : [],
          interactions: Array.isArray(r.interactions) ? r.interactions : [],
          warnings: r.warnings || ''
        }));
      }
    }
  } catch (err) {
    console.warn('Server medication search unavailable, using fallbacks:', err);
  }

  // If server search returned nothing and local matches are few, query public medical open-search
  if (liveResults.length === 0 && localMatches.length < 2) {
    const publicResults = await searchPublicMedicalApi(query.trim());
    liveResults = publicResults;
  }

  // Merge local matches and live results, putting local matches first
  const seenNames = new Set<string>();
  const merged: MedicationSuggestion[] = [];

  for (const item of localMatches) {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push(item);
    }
  }

  for (const item of liveResults) {
    const key = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seenNames.has(key)) {
      seenNames.add(key);
      merged.push(item);
    }
  }

  if (merged.length > 0) {
    searchCache.set(q, merged);
    return merged;
  }

  return [];
}

export async function fetchMedicationDetails(name: string): Promise<MedicationSuggestion | null> {
  if (!name || !name.trim()) return null;
  const key = name.toLowerCase().trim();

  if (detailsCache.has(key)) {
    return detailsCache.get(key)!;
  }

  // Check local database first
  const localMatch = COMMON_MEDICATIONS_DB.find(m => 
    m.name.toLowerCase() === key ||
    key.includes(m.name.toLowerCase()) ||
    m.name.toLowerCase().includes(key) ||
    (m.activeSubstance && (key.includes(m.activeSubstance.toLowerCase()) || m.activeSubstance.toLowerCase().includes(key)))
  );

  // If exact local match exists with complete research data, return immediately (0ms)
  if (localMatch && localMatch.name.toLowerCase() === key && localMatch.sideEffects && localMatch.sideEffects.length > 0) {
    detailsCache.set(key, localMatch);
    return localMatch;
  }

  try {
    const res = await fetch(`/api/medications/details?name=${encodeURIComponent(name.trim())}`, {
      signal: AbortSignal.timeout(6000)
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      const data = await res.json();
      if (data.details) {
        const item: MedicationSuggestion = {
          name: data.details.name || name,
          activeSubstance: data.details.activeSubstance || localMatch?.activeSubstance || '',
          category: data.details.category || localMatch?.category || '',
          defaultDosages: Array.isArray(data.details.dosages) && data.details.dosages.length > 0
            ? data.details.dosages
            : (localMatch?.defaultDosages || ['Standard']),
          commonForms: Array.isArray(data.details.commonForms) ? data.details.commonForms : (localMatch?.commonForms || []),
          recommendedIntake: data.details.recommendedIntake || localMatch?.recommendedIntake || '',
          sideEffects: Array.isArray(data.details.sideEffects) && data.details.sideEffects.length > 0
            ? data.details.sideEffects
            : (localMatch?.sideEffects || []),
          interactions: Array.isArray(data.details.interactions) && data.details.interactions.length > 0
            ? data.details.interactions
            : (localMatch?.interactions || []),
          warnings: data.details.warnings || localMatch?.warnings || ''
        };
        detailsCache.set(key, item);
        return item;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch live medication details from server:', err);
  }

  if (localMatch) {
    detailsCache.set(key, localMatch);
    return localMatch;
  }

  // Public Wikipedia summary fallback if on static hosting without server
  try {
    const wikiRes = await fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.trim())}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData && wikiData.extract) {
        const fallbackItem: MedicationSuggestion = {
          name: wikiData.title || name,
          activeSubstance: name,
          category: wikiData.description || 'Arzneimittel / Wirkstoff',
          defaultDosages: ['Standard'],
          commonForms: ['Tablette'],
          recommendedIntake: 'Gemäß Packungsbeilage oder Verordnung',
          sideEffects: [wikiData.extract],
          interactions: ['Bei Kombinationstherapien ärztliche Rücksprache halten'],
          warnings: 'Arzneimitteleinnahme sorgfältig überwachen.'
        };
        detailsCache.set(key, fallbackItem);
        return fallbackItem;
      }
    }
  } catch {
    // Ignore Wikipedia fallback error
  }

  return null;
}

