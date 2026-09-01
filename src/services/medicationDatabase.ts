export interface MedicationSuggestion {
  name: string;
  category?: string;
  defaultDosages: string[];
  commonForms?: string[];
  activeSubstance?: string;
}

export const COMMON_MEDICATIONS_DB: MedicationSuggestion[] = [
  {
    name: 'Ibuprofen',
    activeSubstance: 'Ibuprofen',
    category: 'NSAR / Schmerzmittel',
    defaultDosages: ['200 mg', '400 mg', '600 mg', '800 mg'],
    commonForms: ['Filmtablette', 'Granulat', 'Zäpfchen']
  },
  {
    name: 'Paracetamol',
    activeSubstance: 'Paracetamol',
    category: 'Analgetikum / Antipyretikum',
    defaultDosages: ['500 mg', '1000 mg', '125 mg', '250 mg'],
    commonForms: ['Tablette', 'Brausetablette', 'Zäpfchen', 'Saft']
  },
  {
    name: 'Aspirin (ASS)',
    activeSubstance: 'Acetylsalicylsäure',
    category: 'NSAR / Thrombozytenaggregationshemmer',
    defaultDosages: ['100 mg', '300 mg', '500 mg'],
    commonForms: ['Tablette', 'Brausetablette', 'Kautablette']
  },
  {
    name: 'Novalgin (Metamizol)',
    activeSubstance: 'Metamizol-Natrium',
    category: 'Nicht-Opioid-Analgetikum / Krampflösend',
    defaultDosages: ['500 mg', '1000 mg', '20 Tropfen (500 mg)'],
    commonForms: ['Filmtablette', 'Tropfen', 'Injektionslösung']
  },
  {
    name: 'Diclofenac (Voltaren)',
    activeSubstance: 'Diclofenac-Natrium',
    category: 'NSAR / Antirheumatikum',
    defaultDosages: ['25 mg', '50 mg', '75 mg', '100 mg retard'],
    commonForms: ['Tablette', 'Retardkapsel', 'Gel', 'Zäpfchen']
  },
  {
    name: 'Pantoprazol',
    activeSubstance: 'Pantoprazol',
    category: 'Protonenpumpeninhibitor (Magenschutz)',
    defaultDosages: ['20 mg', '40 mg'],
    commonForms: ['Magensaftresistente Tablette']
  },
  {
    name: 'Omeprazol',
    activeSubstance: 'Omeprazol',
    category: 'Protonenpumpeninhibitor (Magenschutz)',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Magensaftresistente Kapsel']
  },
  {
    name: 'L-Thyroxin (Levothyroxin)',
    activeSubstance: 'Levothyroxin-Natrium',
    category: 'Schilddrüsenhormon',
    defaultDosages: ['25 µg', '50 µg', '75 µg', '100 µg', '125 µg', '150 µg'],
    commonForms: ['Tablette']
  },
  {
    name: 'Ramipril',
    activeSubstance: 'Ramipril',
    category: 'ACE-Hemmer (Blutdruck)',
    defaultDosages: ['2.5 mg', '5 mg', '10 mg'],
    commonForms: ['Tablette']
  },
  {
    name: 'Metoprolol',
    activeSubstance: 'Metoprololsuccinat / -tartrat',
    category: 'Betablocker (Blutdruck / Puls)',
    defaultDosages: ['23.75 mg', '47.5 mg', '95 mg', '190 mg'],
    commonForms: ['Retardtablette']
  },
  {
    name: 'Bisoprolol',
    activeSubstance: 'Bisoprolol',
    category: 'Betablocker (Blutdruck / Herz)',
    defaultDosages: ['1.25 mg', '2.5 mg', '5 mg', '10 mg'],
    commonForms: ['Tablette']
  },
  {
    name: 'Amlodipin',
    activeSubstance: 'Amlodipin',
    category: 'Calciumantagonist (Blutdruck)',
    defaultDosages: ['5 mg', '10 mg'],
    commonForms: ['Tablette']
  },
  {
    name: 'Candesartan',
    activeSubstance: 'Candesartancilexetil',
    category: 'AT1-Rezeptor-Antagonist (Blutdruck)',
    defaultDosages: ['4 mg', '8 mg', '16 mg', '32 mg'],
    commonForms: ['Tablette']
  },
  {
    name: 'Valsartan',
    activeSubstance: 'Valsartan',
    category: 'AT1-Rezeptor-Antagonist (Blutdruck)',
    defaultDosages: ['80 mg', '160 mg', '320 mg'],
    commonForms: ['Filmtablette']
  },
  {
    name: 'Simvastatin',
    activeSubstance: 'Simvastatin',
    category: 'CSE-Hemmer / Statin (Cholesterin)',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Filmtablette']
  },
  {
    name: 'Atorvastatin',
    activeSubstance: 'Atorvastatin',
    category: 'Statin (Cholesterinsenker)',
    defaultDosages: ['10 mg', '20 mg', '40 mg', '80 mg'],
    commonForms: ['Filmtablette']
  },
  {
    name: 'Metformin',
    activeSubstance: 'Metforminhydrochlorid',
    category: 'Antidiabetikum (Blutzucker)',
    defaultDosages: ['500 mg', '850 mg', '1000 mg'],
    commonForms: ['Filmtablette']
  },
  {
    name: 'Citalopram',
    activeSubstance: 'Citalopram',
    category: 'SSRI / Antidepressivum',
    defaultDosages: ['10 mg', '20 mg', '40 mg'],
    commonForms: ['Filmtablette', 'Tropfen']
  },
  {
    name: 'Sertralin',
    activeSubstance: 'Sertralin',
    category: 'SSRI / Antidepressivum',
    defaultDosages: ['50 mg', '100 mg'],
    commonForms: ['Filmtablette']
  },
  {
    name: 'Mirtazapin',
    activeSubstance: 'Mirtazapin',
    category: 'NaSSA / Antidepressivum (schlaffördernd)',
    defaultDosages: ['15 mg', '30 mg', '45 mg'],
    commonForms: ['Filmtablette', 'Schmelztablette']
  },
  {
    name: 'Salbutamol',
    activeSubstance: 'Salbutamol',
    category: 'Beta-2-Sympathomimetikum (Asthma/Bronchodilatator)',
    defaultDosages: ['100 µg/Hub', '200 µg/Hub'],
    commonForms: ['Dosieraerosol', 'Inhalationspulver']
  },
  {
    name: 'Budesonid',
    activeSubstance: 'Budesonid',
    category: 'Glukokortikoid (Inhalativ/Asthma)',
    defaultDosages: ['200 µg/Hub', '400 µg/Hub'],
    commonForms: ['Pulverinhalator', 'Nasenspray']
  },
  {
    name: 'Triptane (Sumatriptan/Zolmitriptan)',
    activeSubstance: 'Sumatriptan / Zolmitriptan',
    category: 'Akute Migränetherapie',
    defaultDosages: ['50 mg', '100 mg', '2.5 mg', '5 mg'],
    commonForms: ['Filmtablette', 'Nasenspray', 'Schmelztablette']
  },
  {
    name: 'Magnesium',
    activeSubstance: 'Magnesiumcitrat / -oxid',
    category: 'Mineralstoff / Nahrungsergänzung',
    defaultDosages: ['150 mg', '300 mg', '400 mg'],
    commonForms: ['Brausetablette', 'Kapsel', 'Granulat']
  },
  {
    name: 'Vitamin D3',
    activeSubstance: 'Cholecalciferol',
    category: 'Vitamin / Nahrungsergänzung',
    defaultDosages: ['1.000 I.E.', '2.000 I.E.', '5.000 I.E.', '20.000 I.E.'],
    commonForms: ['Tropfen', 'Kapsel', 'Tablette']
  }
];

export async function searchMedications(query: string): Promise<MedicationSuggestion[]> {
  if (!query || query.trim().length < 1) return [];
  const q = query.toLowerCase().trim();

  // First filter local DB
  const localMatches = COMMON_MEDICATIONS_DB.filter(m => 
    m.name.toLowerCase().includes(q) || 
    (m.activeSubstance && m.activeSubstance.toLowerCase().includes(q)) ||
    (m.category && m.category.toLowerCase().includes(q))
  );

  // If we have great local matches, return them immediately
  if (localMatches.length > 0) {
    return localMatches;
  }

  // Otherwise, optionally call the live endpoint
  try {
    const res = await fetch(`/api/medications/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        return data.results.map((r: any) => ({
          name: r.name,
          defaultDosages: r.dosages || ['Standard'],
        }));
      }
    }
  } catch (err) {
    // ignore
  }

  return [];
}
