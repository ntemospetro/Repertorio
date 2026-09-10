// C. M. Boger: Synoptic Key to the Materia Medica & General Analysis
// Classical Homeopathic Keynotes, Modalities, and Sphere of Action according to Cyrus Maxwell Boger (1861–1935)

export interface BogerSynopticEntry {
  remedyId: string;
  latinName: string;
  region: string; // Region of body / Sphere of action
  worse: string[]; // Aggravations (<)
  better: string[]; // Ameliorations (>)
  highlights: string[]; // Essential Keynotes / Characteristics
}

export const BOGER_SYNOPTIC_KEY_DATA: Record<string, BogerSynopticEntry> = {
  "aconitum-napellus": {
    remedyId: "aconitum-napellus",
    latinName: "Aconitum napellus",
    region: "Gehirn; Nerven (vaskulär; sensorisch). Herz; Kreislauf (arteriell; stürmisch). Schleimhäute (Atmungsorgane). Gelenke.",
    worse: [
      "Kalter, trockener Wind; Zugluft",
      "Schock, Furcht, Schreck",
      "Nachts; gegen Mitternacht",
      "Aufrichten aus dem Liegen",
      "Geräusche, Musik, Berührung"
    ],
    better: [
      "Im Freien",
      "Ruhe",
      "Warmer Schweiß"
    ],
    highlights: [
      "Stürmischer, plötzlicher Beginn mit unerträglicher Angst und Panik",
      "Todesfurcht: sagt den Zeitpunkt des Todes voraus",
      "Große Ruhelosigkeit: wirft sich verzweifelt im Bett hin und her",
      "Rotes Gesicht wird beim Aufsetzen leichenblass mit Schwindel und Ohnmachtsneigung",
      "Brennender, unlöschbarer Durst auf kaltes Wasser"
    ]
  },
  "apis-mellifica": {
    remedyId: "apis-mellifica",
    latinName: "Apis mellifica",
    region: "Zellgewebe (Ödeme; Augen; Fauces). Haut (Urtikaria; Erysipel). Nieren; Blase. Seröse Häute. Ovarien (rechts).",
    worse: [
      "Wärme in jeder Form (Zimmer, Ofen, heiße Bäder, Einhüllen)",
      "Berührung; geringster Druck",
      "Nachmittags (15:00 - 17:00 Uhr)",
      "Rechte Seite"
    ],
    better: [
      "Kälte; kaltes Wasser; kalte Umschläge",
      "Entkleiden; frische Luft",
      "Bewegung im Freien"
    ],
    highlights: [
      "Stechende, brennende Schmerzen wie von glühenden Nadeln oder Bienenstichen",
      "Ausgeprägte Durstlosigkeit trotz Hitze und Fieber",
      "Plötzliche, glasige, blasse Ödeme (Wassersäcke unter den Augen)",
      "Kritische Verschlimmerung durch jede Art von Wärme, verlangt Kälte",
      "Ungeschicklichkeit: lässt Gegenstände aus den Händen fallen"
    ]
  },
  "arnica-montana": {
    remedyId: "arnica-montana",
    latinName: "Arnica montana",
    region: "Blut; Blutgefäße (Kapillaren). Muskeln. Nerven. Bindegewebe. Haut.",
    worse: [
      "Geringste Berührung; Annäherung anderer",
      "Erschütterung, Bewegung, Überanstrengung",
      "Feuchtkalte Witterung",
      "Ruhe; Liegen auf hartem Untergrund"
    ],
    better: [
      "Liegen mit tief gelagertem Kopf",
      "Ausstrecken; sanfte Bewegung"
    ],
    highlights: [
      "Zerschlagenheitsgefühl am ganzen Körper: Das Bett fühlt sich überall zu hart an",
      "Trauma, Prellungen, Muskelkater, Hämatome, Verletzungen der Weichteile",
      "Behauptet stur, es fehle ihm nichts und schickt den Arzt weg",
      "Kopf und Gesicht glühend heiß, während der übrige Körper kalt ist",
      "Große Angst vor Berührung oder auch nur dem Nahen von Personen"
    ]
  },
  "arsenicum-album": {
    remedyId: "arsenicum-album",
    latinName: "Arsenicum album",
    region: "Schleimhäute (Magen-Darm; Atmung). Blut. Herz. Haut. Nerven. Rechte Seite.",
    worse: [
      "Kälte (Luft, Getränke, Speisen, Anwendungen)",
      "Mitternacht bis 2:00 Uhr morgens",
      "Nasse Kälte; faulige Nahrung, Fleisch",
      "Am Meer"
    ],
    better: [
      "Wärme in jeder Form (heiße Umschläge, heiße Getränke, Ofen)",
      "Hochgelagerter Kopf",
      "Gesellschaft; Bewegung"
    ],
    highlights: [
      "Brennende Schmerzen wie von glühenden Kohlen, paradoxerweise gelindert durch Hitze",
      "Große körperliche Erschöpfung bei quälender motorischer Ruhelosigkeit",
      "Intensive Todesangst, meint Heilung sei unmöglich, verlangt Beistand",
      "Häufiger Durst auf kleine Schlucke kalten Wassers, das sofort erbrochen wird",
      "Aasig riechende, ätzende, scharfe Absonderungen"
    ]
  },
  "belladonna": {
    remedyId: "belladonna",
    latinName: "Belladonna",
    region: "Gehirn; Gefäßsystem. Nerven. Sinnesorgane. Drüsen. Hals. Rechte Seite.",
    worse: [
      "Erschütterung (Bettanstoßen, Schritte)",
      "Licht, Geräusche, Zugluft am Kopf",
      "Nachmittags (15:00 Uhr); Liegen auf rechter Seite",
      "Haareschneiden, Kälte nach Überhitzung"
    ],
    better: [
      "Halbsitzende, aufrechte Haltung",
      "Ruhig im dunklen, warmen Zimmer liegen",
      "Leichter Druck auf die Schläfen"
    ],
    highlights: [
      "Gewaltsame, pulsierende Kongestionen mit glühender Hitze und Schläfenklopfen",
      "Mydriasis: Weite, glänzende Pupillen mit stierem Blick",
      "Plötzliches Kommen und ebenso plötzliches Gehen der Beschwerden",
      "Brennende Hitze des Kopfes bei oft eiskalten Füßen",
      "Fieberdelirium: Beißt, schlägt, will fliehen oder sieht Fratzen"
    ]
  },
  "bryonia-alba": {
    remedyId: "bryonia-alba",
    latinName: "Bryonia alba",
    region: "Seröse Häute (Pleura, Peritoneum, Meningen). Gelenke. Muskeln. Magen-Darm. Leber. Rechte Seite.",
    worse: [
      "Jede geringste Bewegung (selbst Augenöffnen oder Atmen)",
      "Wärme, warmes Zimmer, Sommerhitze",
      "Morgens beim ersten Erwachen und Aufstehen",
      "Berührung; Ärger"
    ],
    better: [
      "Absolute Ruhe",
      "Fester Druck und Liegen auf der schmerzhaften Seite",
      "Kühle Luft; kaltes Trinken"
    ],
    highlights: [
      "Extreme Verschlimmerung durch geringste Bewegung; verlangt absolute Stille",
      "Besserung durch festen, anhaltenden Druck und Liegen auf der kranken Seite",
      "Große Trockenheit aller Schleimhäute mit Durst auf große Mengen kalten Wassers in langen Intervallen",
      "Stechende, zerreißende Schmerzen in Pleura, Gelenken oder Kopf",
      "Spricht im Delirium von den Geschäften des Tages und will nach Hause"
    ]
  },
  "calcarea-carbonica": {
    remedyId: "calcarea-carbonica",
    latinName: "Calcarea carbonica",
    region: "Drüsen; Lymphsystem. Knochen; Knorpel. Blut. Haut. Vegetatives Nervensystem.",
    worse: [
      "Kälte; Nässe; feuchtes Wetter; Baden",
      "Körperliche oder geistige Anstrengung; Treppensteigen",
      "Vollmond; Milchgenuss",
      "Druck der Kleidung"
    ],
    better: [
      "Trockenes, warmes Wetter",
      "Liegen auf der schmerzhaften Seite",
      "Dunkelheit; lockere Kleidung"
    ],
    highlights: [
      "Starke Schweißneigung, besonders am Hinterkopf im Schlaf (kissenfeuchtend)",
      "Verlangen nach ungenießbaren Dingen (Kreide, Kalk, Kohle) sowie weich gekochten Eiern",
      "Große Frostigkeit: Kältegefühl wie von nassen, kalten Strümpfen",
      "Träge Knochen- und Zahnentwicklung; verzögerter Fontanellenschluss bei Kindern",
      "Besorgnis, den Verstand zu verlieren oder dass andere die Verwirrung bemerken"
    ]
  },
  "causticum": {
    remedyId: "causticum",
    latinName: "Causticum",
    region: "Nerven (motorisch; okulomotorisch; Vagus). Muskeln. Blase; Kehlkopf. Sehnen.",
    worse: [
      "Klares, trockenes, kaltes Wetter; Ostwind",
      "Kalter Zug am Nacken oder Gesicht",
      "Morgens; Aufstehen; Bücken",
      "Kaffee; süße Speisen"
    ],
    better: [
      "Feuchtes, nasses Wetter; Regen",
      "Wärme; Bettwärme",
      "Schluck kaltes Wasser (bei Husten)"
    ],
    highlights: [
      "Paradoxe Besserung bei nassem, feuchtem Regenwetter und Verschlimmerung bei klarem Ostwind",
      "Lokale Lähmungen einzelner Nerven oder Muskelgruppen (Fazialisparese nach kaltem Wind, Blasenlähmung)",
      "Heiserkeit von Sängern und Rednern, besonders morgens schlimmer",
      "Unwillkürlicher Harnabgang beim Husten, Niesen oder Schnäuzen",
      "Ausgeprägtes Mitgefühl mit dem Leiden anderer, erträgt kein Unrecht"
    ]
  },
  "chamomilla": {
    remedyId: "chamomilla",
    latinName: "Chamomilla",
    region: "Nerven; Zentralnervensystem. Verdauungstrakt. Zähne. Weibliche Genitalien.",
    worse: [
      "Ärger, Zorn, Gemütserregung",
      "Wärme; Einhüllen; nachts (21:00 Uhr)",
      "Kaffee, Betäubungsmittel",
      "Zahnen; Berührung"
    ],
    better: [
      "Umhergetragenwerden (besonders Kinder)",
      "Fasten; warmes, feuchtes Wetter",
      "Schwitzen"
    ],
    highlights: [
      "Unerträglichkeit von Schmerzen mit zornigem, reizbarem und feindseligem Wesen",
      "Kinder wollen ununterbrochen herumgetragen werden und beruhigen sich nur dann",
      "Eine Wange rot und heiß, die andere blass und kühl",
      "Grüner, stinkender Stuhl wie gehackte Kräuter oder faule Eier während der Zahnung",
      "Schmerz treibt zum Wahnsinn und zur Verzweiflung"
    ]
  },
  "drosera-rotundifolia": {
    remedyId: "drosera-rotundifolia",
    latinName: "Drosera rotundifolia",
    region: "Atemwege (Kehlkopf, Bronchien, Vagus). Lungen. Kehlkopf. Knochen.",
    worse: [
      "Nach Mitternacht; Hinlegen",
      "Wärme im Bett",
      "Sprechen, Lachen, Weinen, Singen",
      "Trinken kalter Flüssigkeiten"
    ],
    better: [
      "Aufsitzen; Druck der Hände auf den Brustkorb",
      "Bewegung im Freien"
    ],
    highlights: [
      "Krampfartiger, bellender Keuchhusten in rasch aufeinanderfolgenden Anfällen ohne Atemholen",
      "Kitzeln im Kehlkopf wie von einer Feder oder Brotkrumen",
      "Muss beim Husten die Brust mit beiden Händen fest abstützen",
      "Erbrechen von Schleim und Nahrungsmitteln am Ende des Hustenanfalls",
      "Verschlimmerung sofort nach dem Hinlegen und nach Mitternacht"
    ]
  },
  "gelsemium-sempervirens": {
    remedyId: "gelsemium-sempervirens",
    latinName: "Gelsemium sempervirens",
    region: "Nervensystem (motorisch; sensorisch). Muskeln. Gefäße. Okziput. Augen.",
    worse: [
      "Erwartungsangst, Aufregung, Schreck, schlechte Nachrichten",
      "Schwüles, feuchtes Wetter vor Gewittern",
      "Bewegung; Tabakrauch; 10:00 Uhr morgens",
      "Denken an die Beschwerden"
    ],
    better: [
      "Reichlicher Abgang von hellem Harn (erlöst Kopfschmerz)",
      "Fortgesetzte Bewegung; frische Luft",
      "Schwitzen; Alkoholgenuss"
    ],
    highlights: [
      "Die 3 großen D: Dull, Drowsy, Dizzy (benommen, schläfrig, schwindlig)",
      "Bleierne Schwere der Glieder und Lider: Augen können kaum offen gehalten werden",
      "Kopfschmerz beginnt im Nacken/Okziput, zieht über den Scheitel und bessert sich nach starkem Wasserlassen",
      "Völlige Durstlosigkeit bei Hitze und Influenza",
      "Zittern vor Schwäche, Angst oder Lampenfieber (Prüfungsangst)"
    ]
  },
  "hepar-sulfuris": {
    remedyId: "hepar-sulfuris",
    latinName: "Hepar sulfuris",
    region: "Drüsen; Lymphknoten. Schleimhäute (Atmung). Haut. Nerven. Bindegewebe.",
    worse: [
      "Kälte; kalter, trockener Wind; Zugluft; Entblößen",
      "Berührung; Druck",
      "Liegen auf der schmerzhaften Seite",
      "Quecksilber; Lärm"
    ],
    better: [
      "Feuchte Wärme; warmes Einhüllen (besonders des Kopfes)",
      "Feuchtwarmes Wetter",
      "Nach dem Essen"
    ],
    highlights: [
      "Extreme Überempfindlichkeit gegen Kälte: Der geringste Luftzug oder das Herausstrecken einer Hand erzeugt Husten",
      "Stechende Schmerzen wie von einem Holzsplitter oder einer Gräte im Hals",
      "Neigung zu eitrigen Entzündungen; Eiter riecht stechend sauer oder wie alter Käse",
      "Heftiger, jähzorniger Charakter; erträgt keinen Widerspruch",
      "Rasselnder, kruppartiger Husten, der sich durch warmes Einhüllen bessert"
    ]
  },
  "ignatia-amara": {
    remedyId: "ignatia-amara",
    latinName: "Ignatia amara",
    region: "Nervensystem (Zentral; vegetativ). Psyche. Rachen. Magen-Darm. Weibliche Sphäre.",
    worse: [
      "Kummer, Sorgen, Kränkung, Schreck, Liebeskummer",
      "Kaffee, Tabak, Gerüche, Berührung",
      "Trost (verschlimmert Zorn und Weinen)",
      "Morgens; im Freien"
    ],
    better: [
      "Lageveränderung; harter Druck",
      "Schlucken fester Nahrung (Halsweh besser)",
      "Alleinsein; Wärme"
    ],
    highlights: [
      "Paradoxe und widersprüchliche Symptome: Halsweh besser durch Schlucken harter Bissen, Magenweh besser durch Essen",
      "Tiefes, unwillkürliches Seufzen und Schluchzen bei stiller Trauer",
      "Globus hystericus: Gefühl eines Kloßes im Hals, der sich nicht herunterschlucken lässt",
      "Hysterieartige Wechselhaftigkeit: Lachen geht blitzartig in Weinen über",
      "Hauptmittel bei frischem Kummer, Verlust geliebter Menschen und Enttäuschung"
    ]
  },
  "ipecacuanha": {
    remedyId: "ipecacuanha",
    latinName: "Ipecacuanha",
    region: "Nervus vagus. Schleimhäute (Magen, Bronchien). Kapillaren.",
    worse: [
      "Wärme; feuchte Hitze; Erbrechen (bringt keine Erleichterung)",
      "Überessen; unreifes Obst; Schweinefleisch",
      "Periodisch; Bewegung"
    ],
    better: [
      "Im Freien; Ausruhen",
      "Wärme an Extremitäten"
    ],
    highlights: [
      "Ständige, anhaltende Übelkeit mit sauberer, unbelegter Zunge",
      "Erbrechen bringt keinerlei Erleichterung der Übelkeit",
      "Asthmatischer, erstickender Krampfhusten mit Steifwerden des Körpers und Blaufärbung",
      "Vollständige Durstlosigkeit bei Magenbeschwerden und Fieber",
      "Reichliche Blutungen von hellrotem Blut aus allen Körperöffnungen"
    ]
  },
  "lachesis-muta": {
    remedyId: "lachesis-muta",
    latinName: "Lachesis muta",
    region: "Blut; Gefäße (Venen). Nerven. Herz. Rachen. Linke Seite (zieht nach rechts).",
    worse: [
      "Nach dem Schlaf ('schläft sich in die Verschlimmerung hinein')",
      "Geringste Einengung oder Berührung am Hals und Bauch (Kragen, Gürtel)",
      "Wärme, heißes Bad, Sonne, Frühlingswetter",
      "Unterdrückung von Ausscheidungen; Wechseljahre"
    ],
    better: [
      "Einsetzen von physiologischen Absonderungen (Menses, Schweiß)",
      "Kaltes Trinken; frische Luft",
      "Nach dem Essen"
    ],
    highlights: [
      "Beschwerden beginnen links und wandern nach rechts (Rachen, Ovarien, Brust)",
      "Kann keine enge Kleidung, Kragen oder Krawatte am Hals ertragen",
      "Schlimmer nach dem Schlaf; wacht mit Erstickungsgefühl auf",
      "Überbordende Geschwätzigkeit mit raschem Springen von einem Thema zum nächsten",
      "Purpurfarbene, bläulich-dunkle Färbung entzündeter Gewebe und Geschwüre"
    ]
  },
  "lycopodium-clavatum": {
    remedyId: "lycopodium-clavatum",
    latinName: "Lycopodium clavatum",
    region: "Verdauungstrakt (Leber; Magen; Darm). Urogenitalsystem. Atmungsorgane. Rechte Seite (zieht nach links).",
    worse: [
      "Nachmittags von 16:00 bis 20:00 Uhr",
      "Wärme; warmes Zimmer; warme Speisen",
      "Rechte Seite; Liegen auf rechter Seite",
      "Blähende Speisen (Bohnen, Kohl, Zwiebeln)"
    ],
    better: [
      "Warme Getränke; warme Speisen",
      "Kühle Luft; Entkleiden; Bewegung im Freien",
      "Urinieren; Aufstoßen"
    ],
    highlights: [
      "Beschwerden beginnen rechts und ziehen nach links",
      "Ausgeprägter Meteorismus: Völlegefühl und Gärung im Unterbauch nach wenigen Bissen",
      "Starke Verschlimmerungszeit: Typisch täglich zwischen 16:00 und 20:00 Uhr",
      "Heißhunger, aber nach drei Bissen voll und wie zugeschnürt",
      "Verlangen nach warmen Getränken; fächerartige Bewegung der Nasenflügel bei Lungenaffektionen"
    ]
  },
  "mercurius-solubilis": {
    remedyId: "mercurius-solubilis",
    latinName: "Mercurius solubilis",
    region: "Schleimhäute; Drüsen (Speicheldrüsen, Leber, Mandeln). Blut. Knochen. Haut.",
    worse: [
      "Nachts im warmen Bett",
      "Wärme UND Kälte (thermometrische Empfindlichkeit)",
      "Schwitzen (erleichtert nicht, sondern schwächt)",
      "Rechte Seite; feuchtes Wetter; Zugluft"
    ],
    better: [
      "Mäßige, gleichmäßige Temperatur",
      "Ruhe",
      "Morgens"
    ],
    highlights: [
      "Menschliches Thermometer: Empfindlich gegen Kälte wie auch gegen Wärme",
      "Reichlicher, übelriechender Speichelfluss; dicke, feuchte Zunge mit Zahnabdrücken am Rand",
      "Verschlimmerung aller Beschwerden nachts im Bett und durch Schwitzen",
      "Metallischer Geschmack im Mund; fauliger Foetor ex ore",
      "Tenesmus bei Durchfall ('kann nie fertig werden')"
    ]
  },
  "natrium-muriaticum": {
    remedyId: "natrium-muriaticum",
    latinName: "Natrium muriaticum",
    region: "Blut; Flüssigkeitshaushalt. Schleimhäute. Haut. Nerven. Psyche.",
    worse: [
      "Sonne; Hitze; Sommerhitze; 10:00 bis 11:00 Uhr vormittags",
      "Trost und Zuspruch (erzeugt Verärgerung)",
      "Am Meer (oder am Meer gebessert)",
      "Geistige Anstrengung; Liegen"
    ],
    better: [
      "Im Freien; kaltes Baden",
      "Fasten; Druck auf den Rücken",
      "Rechtslage"
    ],
    highlights: [
      "Stiller, zurückgezogener Kummer; Trostversuche werden heftig abgewiesen",
      "Pochende, hämmernde Kopfschmerzen von 10:00 bis 15:00 Uhr mit Flimmern vor den Augen",
      "Großes Verlangen nach Salz oder salzigen Speisen",
      "Trockene, aufgesprungene Unterlippe mit zentralem Riss",
      "Geographische Zunge oder Herpesbläschen an den Lippen wie Perlen"
    ]
  },
  "nux-vomica": {
    remedyId: "nux-vomica",
    latinName: "Nux vomica",
    region: "Zentralnervensystem. Verdauungstrakt (Magen, Leber, Darm). Kreislauf.",
    worse: [
      "Morgens beim Erwachen; Kälte; Zugluft; Entblößen",
      "Genussmittel (Kaffee, Alkohol, Tabak, Medikamente, Gewürze)",
      "Geistige Überarbeitung; Ärger, Kränkung",
      "Berührung; Lärm; Gerüche; Licht"
    ],
    better: [
      "Wärme; warmes Zimmer; Einhüllen",
      "Kurzer Mittagsschlaf ('Powernap')",
      "Abends; feuchtes Wetter; Ausruhen"
    ],
    highlights: [
      "Ungeduldiger, reizbarer, arbeitssüchtiger Choleriker; verträgt keinen Widerspruch",
      "Katerzustand: Morgendliche Übelkeit und Kopfschmerz nach Vorabendsünden und Genussmitteln",
      "Ständiger, vergeblicher Stuhldrang; Krämpfe im Darm ('kann nicht erbrechen, kann nicht abführen')",
      "Extreme Frostigkeit: Geringstes Entblößen oder Bewegen unter der Bettdecke erzeugt Schüttelfrost",
      "Besserung nach kurzem ungestörten Schlaf"
    ]
  },
  "phosphorus": {
    remedyId: "phosphorus",
    latinName: "Phosphorus",
    region: "Blut; Blutgefäße. Nerven. Knochen (Kiefer). Lungen. Schleimhäute. Magen.",
    worse: [
      "Gewitter; Dämmerung; nachts vor Mitternacht",
      "Kälte; Liegen auf linker Seite oder auf dem Rücken",
      "Wetterwechsel; Fasten; Alleinsein"
    ],
    better: [
      "Schlaf (selbst kurzer Schlaf erfrischt ungemein)",
      "Kalte Speisen und Getränke (solange sie im Magen kalt sind)",
      "Gesellschaft; Massage; Magnetisieren"
    ],
    highlights: [
      "Offener, kontaktfreudiger, sensibler Charakter mit Angst vor Gewitter, Dunkelheit und Alleinsein",
      "Heftiger Durst auf eiskaltes Wasser; wird erbrochen, sobald es im Magen warm wird",
      "Brennen an umschriebenen Stellen (zwischen den Schulterblättern, Wirbelsäule, Handflächen)",
      "Starke Neigung zu schmerzlosen Blutungen (auch kleiner Wunden) von hellem Blut",
      "Engegefühl und Wundheit in der Brust; Heiserkeit abends schlimmer"
    ]
  },
  "pulsatilla-pratensis": {
    remedyId: "pulsatilla-pratensis",
    latinName: "Pulsatilla pratensis",
    region: "Schleimhäute (Atmung, Verdauung, Auge). Venöses System. Weibliche Genitalien. Gelenke.",
    worse: [
      "Wärme; warmes, geschlossenes Zimmer; dicke Kleidung",
      "Fette, schwere Speisen, Schweinefleisch, Gebäck",
      "Abends; in Ruhe; Liegen auf schmerzhafter Seite",
      "Durchnässung der Füße"
    ],
    better: [
      "Frische, kühle Luft; langsames Spazierengehen im Freien",
      "Trost, Zuwendung und Mitgefühl",
      "Kalte Umschläge; Entblößen"
    ],
    highlights: [
      "Weinerliches, sanftmütiges Gemüt: Weint beim Erzählen der Symptome und sucht Trost",
      "Ständige Wandelbarkeit der Symptome: 'Kein Stuhl gleicht dem anderen', Schmerzen wandern rasch",
      "Vollständige Durstlosigkeit bei allen Beschwerden, selbst bei trockenem Mund und Hitze",
      "Milde, dicke, gelb-grünliche, nicht ätzende Schleimabsonderungen",
      "Unerträglichkeit warmer Räume; drängendes Verlangen nach offenen Fenstern und kühlem Wind"
    ]
  },
  "rhus-toxicodendron": {
    remedyId: "rhus-toxicodendron",
    latinName: "Rhus toxicodendron",
    region: "Faseriges Bindegewebe (Sehnen, Bänder, Faszien). Gelenke. Haut. Blut.",
    worse: [
      "Erste Bewegung nach der Ruhe; Liegen",
      "Nässe, Kälte, Regen, Überhitzung mit nachfolgender Abkühlung",
      "Nach Mitternacht; Zugluft",
      "Vor einem Gewitter"
    ],
    better: [
      "Fortgesetzte, sanfte Bewegung",
      "Wärme in jeder Form (heiße Bäder, Ofen, Umschläge)",
      "Trockenes Wetter; Ausstrecken der Glieder"
    ],
    highlights: [
      "Rostiges Scharnier: Schlimmer bei Beginn der Bewegung, allmähliche Besserung bei fortgesetzter Bewegung",
      "Quälende Ruhelosigkeit: Muss ständig die Position im Bett wechseln, um Erleichterung zu finden",
      "Rote Dreiecksspitze der Zunge bei Typhus und Fieber",
      "Folge von Durchnässung nach Schwitzen oder Verheben und Zerrung der Sehnen",
      "Hautausschläge mit starkem Juckreiz und Bläschenbildung, gebessert durch heißes Wasser"
    ]
  },
  "sepia-succus": {
    remedyId: "sepia-succus",
    latinName: "Sepia succus",
    region: "Urogenitaltrakt (Uterus, Beckenorgane). Venöses Pfortadersystem. Haut. Nerven.",
    worse: [
      "Kälte; Waschen; feuchte Kälte; Schneeluft",
      "Ruhe; morgens und abends",
      "Vor und während der Menses; Schwangerschaft",
      "Milchgenuss; Essensgerüche"
    ],
    better: [
      "Schnelle, anstrengende körperliche Bewegung (Tanzen, Laufen)",
      "Wärme (Bett, Zimmer, Umschläge)",
      "Beine übereinanderschlagen (stützt den Beckenboden)"
    ],
    highlights: [
      "Gefühl des Herabdrängens aller Beckenorgane (Bearing-down), muss die Beine kreuzen",
      "Tiefe Gemütsindifferenz gegen die eigene Familie und die liebsten Angehörigen",
      "Gelber Sattel über der Nase und den Wangen (Chloasma); schlaffe Haltung",
      "Übelkeit morgens beim Anblick oder Geruch von Speisen",
      "Besserung durch heftige körperliche Anstrengung und Tanz"
    ]
  },
  "silicea-terra": {
    remedyId: "silicea-terra",
    latinName: "Silicea terra",
    region: "Bindegewebe; elastische Fasern. Knochen; Knorpel. Drüsen. Haut. Nerven.",
    worse: [
      "Kälte; Zugluft (besonders am Kopf); Entblößen",
      "Feuchtigkeit; Wetterwechsel; Neumond",
      "Geistige Anstrengung; Erschütterung"
    ],
    better: [
      "Wärme; warmes Einhüllen des Kopfes",
      "Sommer; reichliches Schwitzen",
      "Ruhe"
    ],
    highlights: [
      "Mangel an Reaktionskraft und Lebenswärme: Friert ständig und wickelt sich warm ein",
      "Überempfindlichkeit gegen Kälte, verlangt Mütze oder Kopfbedeckung selbst im Zimmer",
      "Übelriechender, scharfer Fußschweiß; Beschwerden nach Unterdrückung des Fußschweißes",
      "Mangel an moralischem 'Rückgrat', gibt leicht nach, besitzt aber einen sturen Kern",
      "Förderung der Ausstoßung von Fremdkörpern (Splitter, Fischgräten)"
    ]
  },
  "sulfur": {
    remedyId: "sulfur",
    latinName: "Sulfur",
    region: "Haut; Schleimhäute. Pfortader- und Venensystem. Nerven. Lymphsystem.",
    worse: [
      "Wärme des Betts; Stehen (kann nicht stillstehen)",
      "Waschen, Baden; 11:00 Uhr vormittags (Schwäche und Hunger)",
      "Milch; Alkohol; Unterdrückung von Hautausschlägen"
    ],
    better: [
      "Trockenes, warmes Wetter",
      "Rechtslage; Bewegung im Freien",
      "Schwitzen"
    ],
    highlights: [
      "Klassischer 'zerlumpter Philosoph': Hochbegabt, unordentlich, gleichgültig gegen Äußeres",
      "Brennende Schmerzen und Hitze (Scheitel, Augen, Fußsohlen, streckt die Füße nachts aus dem Bett)",
      "Hautunreinheiten mit starkem Juckreiz, der durch Waschen und Bettwärme unerträglich wird",
      "Flaues Schwächegefühl und Heißhunger pünktlich um 11:00 Uhr vormittags",
      "Körperöffnungen leuchtend rot (Lippen, Augenlider, Anus) und scharf brennend"
    ]
  },
  "thuja-occidentalis": {
    remedyId: "thuja-occidentalis",
    latinName: "Thuja occidentalis",
    region: "Urogenitaltrakt; Schleimhäute. Haut (Warzen, Kondylome). Blut. Nerven. Linke Seite.",
    worse: [
      "Kälte und Nässe; feuchtes Wetter",
      "Impfungen (Hauptmittel bei Impfschäden / Sykose)",
      "3:00 Uhr morgens und 15:00 Uhr nachmittags",
      "Zwiebeln; Tee"
    ],
    better: [
      "Wärme; trockenes Wetter",
      "Reichliches Schwitzen",
      "Freies Ziehen von Absonderungen"
    ],
    highlights: [
      "Hauptmittel der Sykose mit Neigung zu Wucherungen: Warzen, gestielte Feigwarzen, Polypen",
      "Fixe Wahnideen: Glaubt, seine Glieder seien aus Glas und würden leicht zerbrechen",
      "Gefühl, als ob etwas Lebendiges im Bauch hüpfen oder sich bewegen würde",
      "Süßlicher oder lauchartiger Schweiß, besonders an unbedeckten Körperteilen",
      "Beschwerden nach Pocken- oder Routineimpfungen"
    ]
  }
};

/**
 * Helper to retrieve Boger Synoptic Key entry by remedy ID
 */
export function getBogerSynopticEntry(remedyId: string): BogerSynopticEntry | null {
  if (!remedyId) return null;
  const cleanId = remedyId.toLowerCase().trim();
  
  if (BOGER_SYNOPTIC_KEY_DATA[cleanId]) {
    return BOGER_SYNOPTIC_KEY_DATA[cleanId];
  }

  // Fallback match by matching substring (e.g. 'arnica' in 'arnica-montana')
  for (const [key, entry] of Object.entries(BOGER_SYNOPTIC_KEY_DATA)) {
    if (cleanId.includes(key) || key.includes(cleanId)) {
      return entry;
    }
  }

  return null;
}
