/**
 * Cascade Anamnesis Matrix & Dynamic 3-Tier Funnel Engine
 * 
 * Implements the authentic Hahnemann & Bönninghausen funnel:
 * Level 1: Main Category / Domain (Grobe Orientierung)
 * Level 2: Adaptive Fine-Differentiation (Nuance with Multi-select)
 * Level 3: Qualification & Modality Direction (> Better / < Worse / Grad / Zeit)
 * 
 * Connects directly to Kent, Boericke and Boger clinical rubric scoring.
 */

export interface CascadeTier3Option {
  id: string;
  label: Record<string, string>;
  direction?: 'better' | 'worse' | 'neutral';
  timeframe?: string;
  grade?: number; // 1-4 Boericke grade
  remedyWeights?: Record<string, number>; // Specific remedy affinities
}

export interface CascadeTier2Option {
  id: string;
  label: Record<string, string>;
  subQuestion?: Record<string, string>;
  direction?: 'better' | 'worse';
  remedyHints?: string[]; // e.g. ['staphisagria', 'chamomilla']
  grade?: number;
  tier3Options?: CascadeTier3Option[];
}

export interface CascadeCategory {
  id: string;
  label: Record<string, string>;
  iconName?: string;
  description?: Record<string, string>;
  tier2Options: CascadeTier2Option[];
}

export interface CascadePillarData {
  pillar: 'location' | 'sensation' | 'causa' | 'modalities' | 'concomitants' | 'mind';
  leadQuestion: Record<string, string>;
  leadQuestionLocation?: Record<string, string>;
  leadQuestionRadiation?: Record<string, string>;
  categories: CascadeCategory[];
}

export const CASCADE_PILLAR_DEFINITIONS: Record<string, CascadePillarData> = {
  // SÄULE 1: WO? (Ort, Ausstrahlung, Seitigkeit)
  location: {
    pillar: 'location',
    leadQuestion: {
      de: 'Wo genau am Körper spüren Sie die Beschwerde?',
      en: 'Where exactly on the body do you feel the complaint?',
      es: '¿Dónde exactamente en el cuerpo siente la molestia?',
      fr: 'Où ressentez-vous exactement la douleur dans le corps ?',
      it: 'Dove sente esattamente il disturbo nel corpo?',
      el: 'Πού ακριβώς στο σώμα εντοπίζεται η ενόχληση;',
      ru: 'Где именно в теле локализуется недомогание?'
    },
    leadQuestionLocation: {
      de: 'Wo genau am Körper spüren Sie die Beschwerde?',
      en: 'Where exactly on the body do you feel the complaint?',
      es: '¿Dónde exactamente en el cuerpo siente la molestia?',
      fr: 'Où ressentez-vous exactement la douleur dans le corps ?',
      it: 'Dove sente esattamente il disturbo nel corpo?',
      el: 'Πού ακριβώς στο σώμα εντοπίζεται η ενόχληση;',
      ru: 'Где именно в теле локализуется недомогание?'
    },
    leadQuestionRadiation: {
      de: 'Wohin strahlt der Schmerz oder das Ziehen aus (oder bleibt er fest punktuell)?',
      en: 'Where does the pain or sensation radiate (or does it remain strictly point-fixed)?',
      es: '¿Hacia dónde se irradia el dolor o tirón (o permanece estrictamente puntual)?',
      fr: 'Où irradie la douleur ou le tiraillement (ou reste-t-elle strictement localisée) ?',
      it: 'Verso dove si irradia il dolore o la trazione (o resta strettamente localizzato)?',
      el: 'Προς τα πού αντανακλά ο πόνος ή το τράβηγμα (ή παραμένει αυστηρά σημειακός);',
      ru: 'Куда иррадиирует боль или тянущее ощущение (или остается строго точечной)?'
    },
    categories: [
      {
        id: 'loc-cat-upper-abdomen',
        label: {
          de: 'Oberbauch & Magengrube (Epigastrium)',
          en: 'Upper abdomen & stomach pit (Epigastrium)',
          es: 'Abdomen superior y boca del estómago',
          fr: 'Épigastre et creux de l\'estomac',
          it: 'Epigastrio e bocca dello stomaco',
          el: 'Άνω κοιλία & στομάχι (επιγάστριο)',
          ru: 'Верх живота и подложечная область'
        },
        tier2Options: [
          {
            id: 'loc-epigastrium-center',
            label: {
              de: 'Streng zentral in der Magengrube',
              en: 'Strictly central in the pit of the stomach',
              es: 'Estrictamente central en la boca del estómago',
              fr: 'Strictement central au creux de l\'estomac',
              it: 'Strettamente centrale nella bocca dello stomaco',
              el: 'Αυστηρά κεντρικά στο επιγάστριο',
              ru: 'Строго по центру в подложечной области'
            },
            remedyHints: ['nux-vomica', 'bismuthum', 'arsenicum-album', 'pulsatilla'],
            tier3Options: [
              { id: 'loc-rad-back', label: { de: 'Strahlt nach hinten in den Rücken / BWS', en: 'Radiates back into the spine', es: 'Irradia hacia la espalda', fr: 'Irradie vers le dos', it: 'Irradia verso la schiena', el: 'Αντανακλά πίσω στην πλάτη', ru: 'Иррадиирует назад в спину' } },
              { id: 'loc-rad-sternum', label: { de: 'Zieht nach oben hinter das Brustbein', en: 'Shoots upward behind sternum', es: 'Sube detrás del esternón', fr: 'Monte derrière le sternum', it: 'Sale dietro lo sterno', el: 'Ανεβαίνει πίσω από το στέρνο', ru: 'Поднимается за грудину' } },
              { id: 'loc-rad-none', label: { de: 'Bleibt streng punktuell fixiert', en: 'Remains strictly point-fixed', es: 'Permanece puntualmente fijo', fr: 'Reste strictement ponctuel', it: 'Resta strettamente puntuale', el: 'Παραμένει αυστηρά σημειακό', ru: 'Остается строго точечным' } }
            ]
          },
          {
            id: 'loc-hypochondrium-right',
            label: {
              de: 'Rechter Oberbauch (Leber- & Gallenregion)',
              en: 'Right upper quadrant (Liver & Gallbladder)',
              es: 'Hipocondrio derecho (Hígado y vesícula)',
              fr: 'Hypochondre droit (Foie et vésicule)',
              it: 'Ipocondrio destro (Fegato e colecisti)',
              el: 'Δεξιό υποχόνδριο (Ήπαρ & Χολή)',
              ru: 'Правое подреберье (область печени и желчного)'
            },
            remedyHints: ['chelidonium-majus', 'lycopodium-clavatum', 'bryonia-alba', 'carduus-marianus'],
            tier3Options: [
              { id: 'loc-rad-shoulder-r', label: { de: 'Strahlt unter das rechte Schulterblatt aus (Chelidonium-Leitsymptom)', en: 'Radiates under right scapula', es: 'Irradia bajo el omóplato derecho', fr: 'Irradie sous l\'omoplate droite', it: 'Irradia sotto la scapola destra', el: 'Αντανακλά κάτω από τη δεξιά ωμοπλάτη', ru: 'Иррадиирует под правую лопатку' } },
              { id: 'loc-rad-navel', label: { de: 'Zieht schräg nach unten zum Nabel', en: 'Pulls diagonally to navel', es: 'Tira diagonalmente al ombligo', fr: 'Tire vers le nombril', it: 'Tira verso l\'ombelico', el: 'Τραβά διαγώνια προς τον ομφαλό', ru: 'Тянет по диагонали к пупку' } }
            ]
          },
          {
            id: 'loc-hypochondrium-left',
            label: {
              de: 'Linker Oberbauch (Milz- / Magenfundusregion)',
              en: 'Left upper quadrant (Spleen / Gastric fundus)',
              es: 'Hipocondrio izquierdo (Bazo y estómago)',
              fr: 'Hypochondre gauche (Rate et estomac)',
              it: 'Ipocondrio sinistro (Milza e stomaco)',
              el: 'Αριστερό υποχόνδριο (Σπλήνας & στόμαχος)',
              ru: 'Левое подреберье (селезенка и желудок)'
            },
            remedyHints: ['ceanothus-americanus', 'china-officinalis', 'carbo-vegetabilis', 'scilla-maritima']
          }
        ]
      },
      {
        id: 'loc-cat-umbilical',
        label: {
          de: 'Nabel- & Mittelbauchregion (Mesogastrium)',
          en: 'Umbilical & mid-abdomen (Mesogastrium)',
          es: 'Región umbilical y mesogastrio',
          fr: 'Région ombilicale et mésogastre',
          it: 'Regione ombelicale e mesogastrio',
          el: 'Ομφαλική περιοχή & μέση κοιλία',
          ru: 'Околопупочная область и средний отдел живота'
        },
        tier2Options: [
          {
            id: 'loc-navel-center',
            label: {
              de: 'Kreisförmig um den Bauchnabel zentriert',
              en: 'Centered around the navel in a circle',
              es: 'Centrado alrededor del ombligo',
              fr: 'Centré autour du nombril',
              it: 'Centrato attorno all\'ombelico',
              el: 'Κυκλικά γύρω από τον ομφαλό',
              ru: 'Кругом вокруг пупка'
            },
            remedyHints: ['colocynthis', 'plumbum-metallicum', 'dioscorea-villosa'],
            tier3Options: [
              { id: 'loc-rad-spasm-all', label: { de: 'Strahlt sternförmig in den ganzen Bauch aus', en: 'Radiates like a star across entire belly', es: 'Irradia en estrella a todo el vientre', fr: 'Irradie en étoile dans tout le ventre', it: 'Irradia a stella in tutto il ventre', el: 'Ακτινωτά σε ολόκληρη την κοιλιά', ru: 'Иррадиирует звездообразно по всему животу' } },
              { id: 'loc-rad-groin', label: { de: 'Zieht tief in die Leisten / Becken', en: 'Pulls down to groin / pelvis', es: 'Baja hacia las ingles', fr: 'Descend vers les aines', it: 'Scende verso l\'inguine', el: 'Κατεβαίνει προς τις βουβωνικές χώρες', ru: 'Тянет вниз в пах' } }
            ]
          }
        ]
      },
      {
        id: 'loc-cat-lower-abdomen',
        label: {
          de: 'Unterbauch & Becken (Hypogastrium / Leisten)',
          en: 'Lower abdomen & pelvis (Hypogastrium / Groin)',
          es: 'Abdomen inferior y pelvis',
          fr: 'Bas-ventre et bassin',
          it: 'Basso ventre e bacino',
          el: 'Κάτω κοιλία & λεκάνη',
          ru: 'Низ живота и малый таз'
        },
        tier2Options: [
          {
            id: 'loc-iliac-right',
            label: {
              de: 'Rechter Unterbauch (Ileozökal- / Blinddarmregion)',
              en: 'Right lower quadrant (Ileocecal / Appendix)',
              es: 'Fosa ilíaca derecha (Apéndice)',
              fr: 'Fosse iliaque droite (Appendice)',
              it: 'Fossa iliaca destra (Appendice)',
              el: 'Δεξιός λαγόνιος βόθρος (τυφλό / σκωληκοειδής)',
              ru: 'Правая подвздошная область (аппендикс)'
            },
            remedyHints: ['bryonia-alba', 'belladonna', 'rhus-toxicodendron', 'iris-tenax']
          },
          {
            id: 'loc-iliac-left',
            label: {
              de: 'Linker Unterbauch (Sigmoid / Colon descendens)',
              en: 'Left lower quadrant (Sigmoid)',
              es: 'Fosa ilíaca izquierda (Sigma)',
              fr: 'Fosse iliaque gauche (Côlon sigmoïde)',
              it: 'Fossa iliaca sinistra (Sigma)',
              el: 'Αριστερός λαγόνιος βόθρος (σιγμοειδές)',
              ru: 'Левая подвздошная область (сигмовидная кишка)'
            },
            remedyHints: ['lachesis-mutus', 'lilium-tigrinum', 'mercurius-solubilis']
          },
          {
            id: 'loc-pelvis-diffuse',
            label: {
              de: 'Unterbauch mittig / Blasen- & Uterusregion',
              en: 'Hypogastrium central / Bladder & pelvic floor',
              es: 'Bajo vientre central / Vejiga y pelvis',
              fr: 'Bas-ventre central / Vessie et utérus',
              it: 'Ipogastrio centrale / Vescica e utero',
              el: 'Υπογάστριο κεντρικά / Ουροδόχος & μήτρα',
              ru: 'Центр низа живота / мочевой пузырь и матка'
            },
            remedyHints: ['sepia-officinalis', 'cantharis', 'pulsatilla-pratensis']
          }
        ]
      },
      {
        id: 'loc-cat-head-neck',
        label: {
          de: 'Kopf, Stirn & Nacken',
          en: 'Head, Forehead & Neck',
          es: 'Cabeza, frente y nuca',
          fr: 'Tête, front et nuque',
          it: 'Testa, fronte e nuca',
          el: 'Κεφάλι, μέτωπο & αυχένας',
          ru: 'Голова, лоб и затылок'
        },
        tier2Options: [
          {
            id: 'loc-forehead-temples',
            label: {
              de: 'Stirn & Schläfen',
              en: 'Forehead & Temples',
              es: 'Frente y sienes',
              fr: 'Front et tempes',
              it: 'Fronte e tempie',
              el: 'Μέτωπο & κρόταφοι',
              ru: 'Лоб и виски'
            },
            remedyHints: ['belladonna', 'gelsemium', 'glonoinum', 'bryonia']
          },
          {
            id: 'loc-occiput-neck',
            label: {
              de: 'Hinterkopf & Nacken',
              en: 'Occiput & Nape of neck',
              es: 'Occipucio y nuca',
              fr: 'Occiput et nuque',
              it: 'Occipite e nuca',
              el: 'Ινίο & αυχένας',
              ru: 'Затылок и задняя часть шеи'
            },
            remedyHints: ['gelsemium', 'silicea', 'cimicifuga', 'cocculus']
          },
          {
            id: 'loc-vertex-crown',
            label: {
              de: 'Scheitel (Vertex) / Kopfmitte',
              en: 'Vertex / Top of head',
              es: 'Vértice / Cima de la cabeza',
              fr: 'Sommet du crâne (vertex)',
              it: 'Vertice / Sommità del capo',
              el: 'Κορυφή της κεφαλής (vertex)',
              ru: 'Темечко / макушка головы'
            },
            remedyHints: ['sulphur', 'lachesis', 'calcarea-carbonica']
          }
        ]
      }
    ]
  },

  // SÄULE 2: WAS? (Empfindung, Schmerzqualität, Charakter)
  sensation: {
    pillar: 'sensation',
    leadQuestion: {
      de: 'Wie fühlt sich der Schmerz oder die Empfindung genau an?',
      en: 'What does the pain or sensation feel like exactly?',
      es: '¿Cómo se siente exactamente el dolor o la sensación?',
      fr: 'Quelle est la nature exacte de la douleur ou sensation ?',
      it: 'Come si manifesta esattamente la sensazione o il dolore?',
      el: 'Πώς ακριβώς νιώθετε τον πόνο ή την αίσθηση;',
      ru: 'Каков точный характер боли или ощущения?'
    },
    categories: [
      {
        id: 'sens-cat-cramp',
        label: {
          de: 'Krampfartig, Kolikartig & Zusammenziehend',
          en: 'Cramping, Colicky & Constricting',
          es: 'Cólico, espasmódico y constrictivo',
          fr: 'Spasmodique, colique et constrictif',
          it: 'Spasmodico, colico e costrittivo',
          el: 'Σπασμωδικός, κολικοειδής & σφικτικός',
          ru: 'Спастическая, коликообразная и сжимающая'
        },
        tier2Options: [
          {
            id: 'sens-clutching-grip',
            label: {
              de: 'Zusammenpressend wie eine eiserne Faust / Klaue',
              en: 'Grip like an iron fist / claw',
              es: 'Como un puño de hierro apretando',
              fr: 'Serrement comme par un étau / une griffe de fer',
              it: 'Come un pugno di ferro che stringe',
              el: 'Σαν σιδερένια γροθιά που σφίγγει',
              ru: 'Как железный кулак или когти'
            },
            remedyHints: ['cactus-grandiflorus', 'colocynthis', 'magnesium-phosphoricum'],
            tier3Options: [
              { id: 'sens-paroxysmal', label: { de: 'Anfallsweise einschießend mit schmerzfreien Pausen', en: 'Paroxysmal with pain-free intervals', es: 'En crisis con intervalos sin dolor', fr: 'Par crises avec intervalles libres', it: 'A crisi con intervalli liberi', el: 'Κατά παροξυσμούς με ελεύθερα διαστήματα', ru: 'Приступообразно с перерывами' } },
              { id: 'sens-continuous-cramp', label: { de: 'Anhaltender, ununterbrochener Krampfzustand', en: 'Constant uninterrupted spasm', es: 'Espasmo continuo sin pausa', fr: 'Spasme continu sans répit', it: 'Spasmo continuo', el: 'Συνεχής αδιάκοπος σπασμός', ru: 'Постоянный непрерывный спазм' } }
            ]
          },
          {
            id: 'sens-colic-violent',
            label: {
              de: 'Heftige Bauchkolik zwingt zum Zusammenkrümmen',
              en: 'Violent colic forcing patient to bend double',
              es: 'Cólico violento que obliga a doblarse',
              fr: 'Colique violente forçant à se plier en deux',
              it: 'Colica violenta che costringe a piegarsi',
              el: 'Βίαιος κολικός που αναγκάζει σε δίπλωμα στα δύο',
              ru: 'Острая колика, заставляющая согнуться пополам'
            },
            remedyHints: ['colocynthis', 'magnesium-phosphoricum', 'dioscorea-villosa', 'chamomilla']
          }
        ]
      },
      {
        id: 'sens-cat-burn-heat',
        label: {
          de: 'Brennend, Heiß & Glühend',
          en: 'Burning, Hot & Glowing',
          es: 'Ardiente, caliente y abrasador',
          fr: 'Brûlant, chaud et incandescent',
          it: 'Bruciante, caldo e rovente',
          el: 'Καυστικός, θερμός & πυρώδης',
          ru: 'Жгучая, горячая и пылающая'
        },
        tier2Options: [
          {
            id: 'sens-burn-coals',
            label: {
              de: 'Brennend wie glühende Kohlen',
              en: 'Burning like red-hot coals',
              es: 'Como brasas ardientes',
              fr: 'Comme des charbons ardents',
              it: 'Come carboni ardenti',
              el: 'Καυστικός σαν αναμμένα κάρβουνα',
              ru: 'Жжение как от раскаленных углей'
            },
            remedyHints: ['arsenicum-album', 'phosphorus', 'sulphur', 'cantharis']
          },
          {
            id: 'sens-burn-acrid-pyrosis',
            label: {
              de: 'Ätzendes, saures Brennen (Sodbrennen)',
              en: 'Acrid, sour burning (Heartburn / Pyrosis)',
              es: 'Ardor ácido y corrosivo (Acidez)',
              fr: 'Brûlure acide et corrosive (Aigreurs)',
              it: 'Bruciore acido e corrosivo (Pirosi)',
              el: 'Δριμύ, όξινο κάψιμο (καούρες)',
              ru: 'Едкое кислое жжение (изжога)'
            },
            remedyHints: ['iris-versicolor', 'robinia-pseudoacacia', 'nux-vomica', 'pulsatilla']
          }
        ]
      },
      {
        id: 'sens-cat-sharp-stitch',
        label: {
          de: 'Stechend, Schneidend & Scharf',
          en: 'Stitching, Cutting & Sharp',
          es: 'Punzante, cortante y agudo',
          fr: 'Piquant, coupant et acéré',
          it: 'Pungente, tagliente e acuto',
          el: 'Οξύς, διαξιφιστικός, κοφτερός & σαν βελόνες',
          ru: 'Колющая, режущая и острая'
        },
        tier2Options: [
          {
            id: 'sens-needle-knife',
            label: {
              de: 'Wie Nadelstiche oder scharfe Messerstiche',
              en: 'Like needle pricks or sharp knife stabs',
              es: 'Como pinchazos de aguja o puñaladas',
              fr: 'Comme des aiguilles ou coups de poignard',
              it: 'Come punture di spilli o stilettate',
              el: 'Σαν τσιμπήματα βελόνας ή μαχαιριές',
              ru: 'Как уколы иглы или удары ножом'
            },
            remedyHints: ['bryonia-alba', 'kali-carbonicum', 'apis-mellifica']
          },
          {
            id: 'sens-cutting-knife',
            label: {
              de: 'Schneidend wie mit Glasscherben / Klingen',
              en: 'Cutting as from glass shards / razors',
              es: 'Cortante como cristales rotos',
              fr: 'Coupant comme du verre brisé',
              it: 'Tagliente come vetri rotti',
              el: 'Κοφτερός σαν σπασμένα γυαλιά',
              ru: 'Режущая как осколками стекла'
            },
            remedyHints: ['nitricum-acidum', 'colocynthis', 'staphisagria']
          }
        ]
      },
      {
        id: 'sens-cat-throbbing-bursting',
        label: {
          de: 'Pochend, Pulsierend, Berstend & Völle',
          en: 'Throbbing, Pulsating, Bursting & Fullness',
          es: 'Pulsátil, palpitante y sensación de estallido',
          fr: 'Pulsatile, battant et sensation d\'éclatement',
          it: 'Pulsante, martellante e senso di scoppio',
          el: 'Σφύζων, παλμικός & διαρρηκτικός',
          ru: 'Пульсирующая, бьющаяся и распирающая'
        },
        tier2Options: [
          {
            id: 'sens-throbbing-pulse',
            label: {
              de: 'Hämmernd / pochend im Takt des Pulses',
              en: 'Hammering / throbbing synchronously with pulse',
              es: 'Martilleante al ritmo del pulso',
              fr: 'Battant au rythme du pouls',
              it: 'Martellante col battito cardiaco',
              el: 'Σφυροκόπημα στον ρυθμό του σφυγμού',
              ru: 'Молотящая в такт пульсу'
            },
            remedyHints: ['belladonna', 'glonoinum', 'melilotus-officinalis']
          },
          {
            id: 'sens-bursting-fullness',
            label: {
              de: 'Völle wie kurz vor dem Platzen / Zersprengen',
              en: 'Fullness as if about to burst / explode',
              es: 'Plenitud como si fuera a reventar',
              fr: 'Plénitude comme prête à éclater',
              it: 'Pienezza come sul punto di scoppiare',
              el: 'Πληρότητα σαν να πρόκειται να σπάσει',
              ru: 'Чувство распирания, будто сейчас лопнет'
            },
            remedyHints: ['carbo-vegetabilis', 'lycopodium-clavatum', 'china-officinalis', 'nux-vomica']
          }
        ]
      }
    ]
  },

  // SÄULE 3: WANN / MODALITÄTEN (Bedingungen OHNE TABS! Ebene 1 = Faktor, Ebene 2 = Nuance, Ebene 3 = Besser/Schlechter)
  modalities: {
    pillar: 'modalities',
    leadQuestion: {
      de: 'Unter welchen Bedingungen verbessert (>) oder verschlimmert (<) sich die Beschwerde spürbar?',
      en: 'Under which conditions does the complaint noticeably improve (>) or worsen (<)?',
      es: '¿En qué condiciones mejora (>) o empeora (<) la molestia notablemente?',
      fr: 'Dans quelles circonstances la douleur s\'améliore-t-elle (>) ou s\'aggrave-t-elle (<) ?',
      it: 'In quali condizioni il disturbo migliora (>) o peggiora (<) sensibilmente?',
      el: 'Υπό ποιες συνθήκες η ενόχληση βελτιώνεται (>) ή επιδεινώνεται (<);',
      ru: 'При каких условиях жалоба заметно облегчается (>) или ухудшается (<)?'
    },
    categories: [
      {
        id: 'mod-cat-motion-rest',
        label: {
          de: 'Bewegung, Lage & Erschütterung',
          en: 'Motion, Position & Jarring',
          es: 'Movimiento, postura y sacudida',
          fr: 'Mouvement, position et secousse',
          it: 'Movimento, posizione e scosse',
          el: 'Κίνηση, στάση σώματος & κραδασμοί',
          ru: 'Движение, положение тела и сотрясение'
        },
        tier2Options: [
          {
            id: 'mod-slightest-motion',
            label: {
              de: 'Geringste Bewegung / Erschütterung des Körpers',
              en: 'Slightest motion / jarring of body',
              es: 'El menor movimiento o sacudida',
              fr: 'Le moindre mouvement ou secousse',
              it: 'Il minimo movimento o scossa',
              el: 'Παραμικρή κίνηση ή τράνταγμα',
              ru: 'Малейшее движение или сотрясение'
            },
            remedyHints: ['bryonia-alba', 'belladonna'],
            tier3Options: [
              { id: 'mod-effect-motion-worse', label: { de: '< Verschlimmert massiv (zwingt zu absoluter Ruhe)', en: '< Aggravates severely (demands absolute rest)', es: '< Empeora mucho', fr: '< Aggrave nettement', it: '< Peggiora molto', el: '< Επιδεινώνει έντονα', ru: '< Резко ухудшает' }, direction: 'worse' },
              { id: 'mod-effect-motion-better', label: { de: '> Bringt Erleichterung (fortgesetzte Bewegung bessert)', en: '> Relieves (continued motion relieves)', es: '> Alivia con movimiento continuo', fr: '> Soulage en bougeant', it: '> Migliora muovendosi', el: '> Βελτιώνει με τη συνεχή κίνηση', ru: '> Облегчает при движении' }, direction: 'better' }
            ]
          },
          {
            id: 'mod-bending-double',
            label: {
              de: 'Zusammenkrümmen / Vorbeugen der Oberschenkel',
              en: 'Bending double / drawing up legs',
              es: 'Doblarse en dos / recoger las piernas',
              fr: 'Se plier en deux / remonter les jambes',
              it: 'Piegarsi in due / raccogliere le gambe',
              el: 'Δίπλωμα στα δύο / μάζεμα των ποδιών',
              ru: 'Сгибание пополам / подтягивание ног'
            },
            remedyHints: ['colocynthis', 'magnesium-phosphoricum'],
            tier3Options: [
              { id: 'mod-effect-bend-better', label: { de: '> Bessert die Kolik spürbar (Colocynthis-Leitsymptom)', en: '> Relieves colic noticeably', es: '> Mejora el cólico', fr: '> Améliore nettement la colique', it: '> Migliora nettamente la colica', el: '> Βελτιώνει αισθητά τον κολικό', ru: '> Заметно облегчает колику' }, direction: 'better' },
              { id: 'mod-effect-bend-worse', label: { de: '< Streckung bessert / Krümmen verschlimmert (Dioscorea)', en: '< Stretching relieves / bending worsens', es: '< Estirarse mejora / doblarse empeora', fr: '< S\'étirer soulage', it: '< Distendersi migliora', el: '< Το τέντωμα βελτιώνει', ru: '< Разгибание облегчает' }, direction: 'worse' }
            ]
          }
        ]
      },
      {
        id: 'mod-cat-temperature-weather',
        label: {
          de: 'Temperatur, Wärme & Kälte',
          en: 'Temperature, Warmth & Cold',
          es: 'Temperatura, calor y frío',
          fr: 'Température, chaleur et froid',
          it: 'Temperatura, calore e freddo',
          el: 'Θερμοκρασία, ζέστη & κρύο',
          ru: 'Температура, тепло и холод'
        },
        tier2Options: [
          {
            id: 'mod-warmth-applications',
            label: {
              de: 'Äußere Wärme (Wärmflasche / heiße Umschläge)',
              en: 'External warmth (Hot water bottle / warm wraps)',
              es: 'Calor externo (Bolsa de agua caliente)',
              fr: 'Chaleur externe (Bouillotte / compresses chaudes)',
              it: 'Calore esterno (Borsa d\'acqua calda)',
              el: 'Εξωτερική ζέστη (θερμοφόρα / ζεστά επιθέματα)',
              ru: 'Внешнее тепло (грелка / горячие компрессы)'
            },
            remedyHints: ['magnesium-phosphoricum', 'arsenicum-album', 'nux-vomica'],
            tier3Options: [
              { id: 'mod-effect-warmth-better', label: { de: '> Bessert Beschwerden augenblicklich', en: '> Relieves complaints immediately', es: '> Mejora de inmediato', fr: '> Soulage immédiatement', it: '> Migliora immediatamente', el: '> Βελτιώνει αμέσως', ru: '> Мгновенно облегчает' }, direction: 'better' },
              { id: 'mod-effect-warmth-worse', label: { de: '< Hitze unerträglich / Kälte verlangt (Apis / Pulsatilla)', en: '< Heat unbearable / seeks cold', es: '< Calor insoportable / pide frío', fr: '< Chaleur insupportable', it: '< Calore insopportabile', el: '< Αφόρητη ζέστη / ζητά κρύο', ru: '< Жара невыносима / просит холода' }, direction: 'worse' }
            ]
          },
          {
            id: 'mod-fresh-air',
            label: {
              de: 'Frische kühle Luft / Geöffnete Fenster',
              en: 'Fresh cool air / Open windows',
              es: 'Aire fresco / Ventanas abiertas',
              fr: 'Air frais / Fenêtres ouvertes',
              it: 'Aria fresca / Finestre aperte',
              el: 'Δροσερός καθαρός αέρας / Ανοιχτά παράθυρα',
              ru: 'Свежий прохладный воздух / открытые окна'
            },
            remedyHints: ['pulsatilla-pratensis', 'carbo-vegetabilis'],
            tier3Options: [
              { id: 'mod-effect-air-better', label: { de: '> Bessert deutlich (braucht kühle Luft zum Atmen)', en: '> Relieves markedly (craves air)', es: '> Mejora claramente', fr: '> Améliore nettement', it: '> Migliora nettamente', el: '> Βελτιώνει έντονα', ru: '> Заметно облегчает' }, direction: 'better' },
              { id: 'mod-effect-air-worse', label: { de: '< Zugluft / Kälteempfindlichkeit verschlimmert', en: '< Draft / chilling worsens', es: '< Corrientes empeoran', fr: '< Courants d\'air aggravent', it: '< Correnti d\'aria peggiorano', el: '< Ρεύματα αέρα επιδεινώνουν', ru: '< Сквозняк ухудшает' }, direction: 'worse' }
            ]
          }
        ]
      },
      {
        id: 'mod-cat-pressure-touch',
        label: {
          de: 'Druck, Berührung & Kleidung',
          en: 'Pressure, Touch & Clothing',
          es: 'Presión, tacto y ropa',
          fr: 'Pression, toucher et vêtements',
          it: 'Pressione, tocco e abiti',
          el: 'Πίεση, άγγιγμα & ρούχα',
          ru: 'Давление, прикосновение и одежда'
        },
        tier2Options: [
          {
            id: 'mod-hard-pressure',
            label: {
              de: 'Starker, harter Gegendruck (Hände auf den Bauch gepresst)',
              en: 'Hard, firm pressure (Hands pressed against abdomen)',
              es: 'Presión fuerte y firme con las manos',
              fr: 'Forte pression appuyée avec les mains',
              it: 'Forte pressione decisa con le mani',
              el: 'Δυνατή πίεση με τα χέρια στην κοιλιά',
              ru: 'Сильное твердое давление руками на живот'
            },
            remedyHints: ['colocynthis', 'bryonia-alba', 'magnesium-phosphoricum'],
            tier3Options: [
              { id: 'mod-effect-hard-press-better', label: { de: '> Bessert den Schmerz deutlich', en: '> Relieves pain distinctly', es: '> Mejora el dolor', fr: '> Soulage la douleur', it: '> Migliora il dolore', el: '> Βελτιώνει αισθητά τον πόνο', ru: '> Заметно облегчает боль' }, direction: 'better' },
              { id: 'mod-effect-hard-press-worse', label: { de: '< Selbst sanfter Druck unerträglich', en: '< Even gentle pressure intolerable', es: '< Presión intolerable', fr: '< Pression intolérable', it: '< Pressione intollerabile', el: '< Αφόρητη πίεση', ru: '< Не переносит давления' }, direction: 'worse' }
            ]
          },
          {
            id: 'mod-tight-clothes',
            label: {
              de: 'Eng anliegende Kleidung / Hosenbund',
              en: 'Tight clothing / waistband',
              es: 'Ropa ajustada / cinturón',
              fr: 'Vêtements serrés / ceinture',
              it: 'Abiti stretti / cintura',
              el: 'Στενά ρούχα / ζώνη',
              ru: 'Тесная одежда / пояс'
            },
            remedyHints: ['lachesis-mutus', 'lycopodium-clavatum', 'nux-vomica'],
            tier3Options: [
              { id: 'mod-effect-tight-worse', label: { de: '< Muss Kleidung öffnen / Lockern bringt Erleichterung', en: '< Must unbutton / loosening relieves', es: '< Debe desabrocharse la ropa', fr: '< Doit déboutonner ses vêtements', it: '< Deve allentare i vestiti', el: '< Πρέπει να χαλαρώσει τα ρούχα', ru: '< Должен расстегнуть одежду' }, direction: 'worse' }
            ]
          }
        ]
      },
      {
        id: 'mod-cat-time-food',
        label: {
          de: 'Tageszeit, Mahlzeiten & Schlaf',
          en: 'Time of day, Meals & Sleep',
          es: 'Hora del día, comidas y sueño',
          fr: 'Heure de la journée, repas et sommeil',
          it: 'Ora del giorno, pasti e sonno',
          el: 'Ώρα της ημέρας, γεύματα & ύπνος',
          ru: 'Время суток, прием пищи и сон'
        },
        tier2Options: [
          {
            id: 'mod-after-eating-sp',
            label: {
              de: 'Nach dem Essen / nach den Mahlzeiten',
              en: 'After eating / after meals',
              es: 'Después de comer / comidas',
              fr: 'Après le repas',
              it: 'Dopo mangiato / pasti',
              el: 'Μετά το φαγητό / γεύματα',
              ru: 'После еды / приемов пищи'
            },
            remedyHints: ['nux-vomica', 'pulsatilla-pratensis', 'lycopodium-clavatum', 'anacardium-orientale'],
            tier3Options: [
              { id: 'mod-effect-eating-worse', label: { de: '< Verschlimmert sofort oder 1-2h nach dem Essen', en: '< Worsens immediately or 1-2h after eating', es: '< Empeora tras comer', fr: '< Aggrave après manger', it: '< Peggiora dopo mangiato', el: '< Επιδεινώνει μετά το φαγητό', ru: '< Ухудшает после еды' }, direction: 'worse' },
              { id: 'mod-effect-eating-better', label: { de: '> Essen lindert vorübergehend den Schmerz (Anacardium)', en: '> Eating temporarily relieves pain', es: '> Comer alivia temporalmente', fr: '> Manger soulage temporairement', it: '> Mangiare allevia temporaneamente', el: '> Το φαγητό ανακουφίζει προσωρινά', ru: '> Еда временно облегчает' }, direction: 'better' }
            ]
          },
          {
            id: 'mod-periodic-time',
            label: {
              de: 'Spezifische Uhrzeit / Periodizität',
              en: 'Specific time of day / Periodicity',
              es: 'Hora específica del día',
              fr: 'Horaire spécifique',
              it: 'Orario specifico',
              el: 'Συγκεκριμένη ώρα της ημέρας',
              ru: 'Определенное время суток'
            },
            remedyHints: ['arsenicum-album', 'lycopodium-clavatum', 'nux-vomica', 'kali-carbonicum'],
            tier3Options: [
              { id: 'mod-effect-night-1-2', label: { de: '< Nachts 1:00 – 2:00 Uhr (Arsenicum-Maximum)', en: '< Night 1:00 – 2:00 AM (Arsenicum)', es: '< Noche 1:00 – 2:00', fr: '< Nuit 1h – 2h', it: '< Notte 1:00 – 2:00', el: '< Νύχτα 1:00 – 2:00 π.μ.', ru: '< Ночью 1:00 – 2:00' }, direction: 'worse' },
              { id: 'mod-effect-night-3-4', label: { de: '< Nachts 3:00 – 4:00 Uhr (Nux vomica / Kali carb)', en: '< Night 3:00 – 4:00 AM (Nux-v / Kali-c)', es: '< Noche 3:00 – 4:00', fr: '< Nuit 3h – 4h', it: '< Notte 3:00 – 4:00', el: '< Νύχτα 3:00 – 4:00 π.μ.', ru: '< Ночью 3:00 – 4:00' }, direction: 'worse' },
              { id: 'mod-effect-afternoon-4-8', label: { de: '< Nachmittags 16:00 – 20:00 Uhr (Lycopodium-Maximum)', en: '< Afternoon 4:00 – 8:00 PM (Lycopodium)', es: '< Tarde 16:00 – 20:00', fr: '< Après-midi 16h – 20h', it: '< Pomeriggio 16:00 – 20:00', el: '< Απόγευμα 16:00 – 20:00', ru: '< Вечером 16:00 – 20:00' }, direction: 'worse' }
            ]
          }
        ]
      }
    ]
  },

  // SÄULE 4: WODURCH? (Kausal-Auslöser & Zeitbezug)
  causa: {
    pillar: 'causa',
    leadQuestion: {
      de: 'Welches Ereignis oder welche Einwirkung ging den Beschwerden unmittelbar voraus?',
      en: 'What event or influence immediately preceded the onset of complaints?',
      es: '¿Qué acontecimiento o influencia precedió directamente al inicio de las molestias?',
      fr: 'Quel événement ou influence a directement précédé l\'apparition des troubles ?',
      it: 'Quale evento o influenza ha preceduto direttamente l\'insorgenza dei disturbi?',
      el: 'Ποιο γεγονός ή επίδραση προηγήθηκε άμεσα της έναρξης των ενοχλήσεων;',
      ru: 'Какое событие или воздействие непосредственно предшествовало началу жалоб?'
    },
    categories: [
      {
        id: 'causa-cat-emotion',
        label: {
          de: 'Gemütsregung, Ärger, Schreck & Kränkung',
          en: 'Emotion, Anger, Fright & Mortification',
          es: 'Emoción, ira, susto y agravio',
          fr: 'Émotion, colère, frayeur et contrariété',
          it: 'Emozione, collera, spavento e risentimento',
          el: 'Συναίσθημα, θυμός, τρόμος & προσβολή',
          ru: 'Эмоции, гнев, испуг и обида'
        },
        tier2Options: [
          {
            id: 'causa-suppressed-anger',
            label: {
              de: 'Unterdrückter Ärger / Stiller Groll & Herunterschlucken',
              en: 'Suppressed anger / Silent grief & swallowing down',
              es: 'Ira reprimida / Rencor silencioso',
              fr: 'Colère rentrée / Ressentiment silencieux',
              it: 'Rabbia repressa / Rancore silenzioso',
              el: 'Καταπιεσμένος θυμός / Βουβή πικρία',
              ru: 'Подавленный гнев / скрытая обида'
            },
            remedyHints: ['staphisagria', 'ignatia-amara', 'colocynthis', 'lycopodium-clavatum'],
            tier3Options: [
              { id: 'causa-effect-immed-worse', label: { de: '< Hat Schmerz unmittelbar ausgelöst', en: '< Immediately triggered the pain', es: '< Desencadenó el dolor de inmediato', fr: '< A déclenché la douleur immédiatement', it: '< Ha scatenato il dolore immediatamente', el: '< Πυροδότησε άμεσα τον πόνο', ru: '< Мгновенно вызвало боль' }, direction: 'worse' },
              { id: 'causa-effect-delayed-worse', label: { de: '< Trat ca. 1–2 Stunden zeitverzögert auf', en: '< Occurred with 1-2h delay', es: '< Apareció 1-2h después', fr: '< Apparu 1-2h plus tard', it: '< Comparso 1-2h dopo', el: '< Εμφανίστηκε με καθυστέρηση 1-2 ωρών', ru: '< Появилось через 1-2 часа' }, direction: 'worse' }
            ]
          },
          {
            id: 'causa-violent-anger',
            label: {
              de: 'Heftiger Zornausbruch mit Aufbrausen & Schreien',
              en: 'Violent fit of anger with yelling & outbursts',
              es: 'Ataque violento de ira con gritos',
              fr: 'Crise de colère violente avec cris',
              it: 'Attacco violento di collera con urla',
              el: 'Βίαιο ξέσπασμα θυμού με φωνές',
              ru: 'Вспышка ярости с криками и возмущением'
            },
            remedyHints: ['chamomilla', 'nux-vomica', 'bryonia-alba'],
            tier3Options: [
              { id: 'causa-effect-immed-fury', label: { de: '< Magen- / Bauchkolik direkt während des Wutanfalls', en: '< Colic right during the fit of rage', es: '< Cólico durante el ataque de ira', fr: '< Colique pendant la colère', it: '< Colica durante l\'attacco di rabbia', el: '< Κολικός άμεσα κατά το ξέσπασμα', ru: '< Колика прямо во время приступа ярости' }, direction: 'worse' }
            ]
          },
          {
            id: 'causa-fright-shock',
            label: {
              de: 'Plötzlicher Schreck / Schock / Schlimme Nachricht',
              en: 'Sudden fright / shock / bad news',
              es: 'Susto repentino / shock / malas noticias',
              fr: 'Frayeur soudaine / choc / mauvaise nouvelle',
              it: 'Spavento improvviso / shock / brutte notizie',
              el: 'Ξαφνικός τρόμος / σοκ / δυσάρεστα νέα',
              ru: 'Внезапный испуг / шок / дурные вести'
            },
            remedyHints: ['aconitum-napellus', 'opium', 'gelsemium-sempervirens', 'ignatia-amara']
          }
        ]
      },
      {
        id: 'causa-cat-weather-cold',
        label: {
          de: 'Kälte, Zugluft, Nässe & Wetterumschwung',
          en: 'Cold, Draft, Wetness & Weather change',
          es: 'Frío, corrientes, humedad y cambio de tiempo',
          fr: 'Froid, courants d\'air, humidité et météo',
          it: 'Freddo, correnti d\'aria, umidità e cambio di tempo',
          el: 'Κρύο, ρεύματα αέρα, υγρασία & αλλαγή καιρού',
          ru: 'Холод, сквозняк, сырость и перемена погоды'
        },
        tier2Options: [
          {
            id: 'causa-cold-dry-wind',
            label: {
              de: 'Kalter, trockener Wind (Ostwind / Winterkälte)',
              en: 'Cold dry wind (East wind / sharp winter cold)',
              es: 'Viento frío y seco (Viento del este)',
              fr: 'Vent froid et sec (Vent d\'est)',
              it: 'Vento freddo e asciutto (Vento da est)',
              el: 'Κρύος ξηρός άνεμος (Βοριάς / χειμερινό ψύχος)',
              ru: 'Холодный сухой ветер (северный/восточный ветер)'
            },
            remedyHints: ['aconitum-napellus', 'bryonia-alba', 'hepar-sulfuris'],
            tier3Options: [
              { id: 'causa-effect-sudden-hours', label: { de: '< Plötzlicher, stürmischer Beginn innerhalb weniger Stunden', en: '< Sudden violent onset within hours', es: '< Inicio repentino en pocas horas', fr: '< Début soudain en quelques heures', it: '< Insorgenza improvvisa in poche ore', el: '< Ξαφνική έναρξη εντός ολίγων ωρών', ru: '< Внезапное бурное начало за несколько часов' }, direction: 'worse' }
            ]
          },
          {
            id: 'causa-cold-wet-feet',
            label: {
              de: 'Durchnässung / Nasse Füße / Kaltfeuchtes Wetter',
              en: 'Getting wet / wet cold feet / damp cold weather',
              es: 'Mojarse / pies mojados y fríos / tiempo húmedo',
              fr: 'Trempé / pieds mouillés / temps froid et humide',
              it: 'Bagnarsi / piedi bagnati e freddi / tempo umido',
              el: 'Βρέξιμο / βρεγμένα κρύα πόδια / υγρός καιρός',
              ru: 'Промокание / промоченные холодные ноги / сырость'
            },
            remedyHints: ['dulcamara', 'rhus-toxicodendron', 'pulsatilla-pratensis', 'calcarea-carbonica']
          },
          {
            id: 'causa-ac-draft',
            label: {
              de: 'Klimaanlage / kalte Zugluft im Nacken oder Bauch',
              en: 'Air conditioning / cold draft on neck or abdomen',
              es: 'Aire acondicionado / corriente fría',
              fr: 'Climatisation / courant d\'air froid',
              it: 'Aria condizionata / correnti d\'aria',
              el: 'Κλιματισμός / κρύο ρεύμα στον αυχένα ή την κοιλιά',
              ru: 'Кондиционер / сквозняк на шею или живот'
            },
            remedyHints: ['hepar-sulfuris', 'belladonna', 'silicea']
          }
        ]
      },
      {
        id: 'causa-cat-diet-toxic',
        label: {
          de: 'Ernährung, Genussmittel & Diätfehler',
          en: 'Diet, Stimulants & Indigestion',
          es: 'Dieta, estimulantes y excesos',
          fr: 'Alimentation, excitants et excès',
          it: 'Alimentazione, stimolanti ed eccessi',
          el: 'Διατροφή, διεγερτικά & διαιτητικά σφάλματα',
          ru: 'Питание, стимуляторы и погрешности в диете'
        },
        tier2Options: [
          {
            id: 'causa-heavy-alcohol-party',
            label: {
              de: 'Üppiges Essen, Alkohol, Kaffee & Tabak (Feier / Kater)',
              en: 'Rich heavy food, alcohol, coffee & tobacco (Party / Hangover)',
              es: 'Comida copiosa, alcohol, café y tabaco (Resaca)',
              fr: 'Repas copieux, alcool, café et tabac (Gueule de bois)',
              it: 'Pasto abbondante, alcol, caffè e tabacco (Postbornia)',
              el: 'Βαρύ φαγητό, αλκοόλ, καφές & καπνός (ξενύχτι)',
              ru: 'Тяжелая жирная пища, алкоголь, кофе и табак (похмелье)'
            },
            remedyHints: ['nux-vomica', 'pulsatilla-pratensis', 'arsenicum-album', 'carbo-vegetabilis'],
            tier3Options: [
              { id: 'causa-effect-morning-after', label: { de: '< Schmerz und Übelkeit am nächsten Morgen nach dem Erwachen', en: '< Pain and nausea next morning on waking', es: '< Dolor a la mañana siguiente', fr: '< Douleur au réveil le lendemain', it: '< Dolore al mattino al risveglio', el: '< Πόνος και ναυτία το επόμενο πρωί', ru: '< Боль и тошнота на следующее утро' }, direction: 'worse' }
            ]
          },
          {
            id: 'causa-fatty-pork-pastry',
            label: {
              de: 'Fettes Schweinefleisch / Gebäck / Eiscreme',
              en: 'Fatty pork / rich pastry / ice cream',
              es: 'Cerdo graso / pasteles / helado',
              fr: 'Porc gras / pâtisseries / glaces',
              it: 'Maiale grasso / dolci / gelato',
              el: 'Λιπαρό χοιρινό / γλυκά / παγωτό',
              ru: 'Жирная свинина / сдобная выпечка / мороженое'
            },
            remedyHints: ['pulsatilla-pratensis', 'antimonium-crudum', 'carbo-vegetabilis']
          },
          {
            id: 'causa-spoiled-food',
            label: {
              de: 'Verdorbenes Essen / verdorbenes Fleisch oder Fisch',
              en: 'Spoiled food / tainted meat or fish',
              es: 'Comida en mal estado / carne o pescado pasado',
              fr: 'Aliments avariés / viande ou poisson gâté',
              it: 'Cibo avariato / carne o pesce andati a male',
              el: 'Αλλοιωμένη τροφή / χαλασμένο κρέας ή ψάρι',
              ru: 'Испорченная пища / несвежее мясо или рыба'
            },
            remedyHints: ['arsenicum-album', 'carbo-vegetabilis', 'china-officinalis']
          }
        ]
      },
      {
        id: 'causa-cat-strain-injury',
        label: {
          de: 'Körperliche Überanstrengung, Heben & Trauma',
          en: 'Physical Overexertion, Lifting & Trauma',
          es: 'Sobreesfuerzo físico, levantar peso y traumatismo',
          fr: 'Surmenage physique, port de charges et traumatisme',
          it: 'Sforzo fisico, sollevamento pesi e traumi',
          el: 'Σωματική καταπόνηση, άρση βάρους & τραύμα',
          ru: 'Физическое перенапряжение, подъем тяжестей и травма'
        },
        tier2Options: [
          {
            id: 'causa-lifting-strain',
            label: {
              de: 'Verhebt / schwere Lasten getragen',
              en: 'Strained from lifting / carrying heavy loads',
              es: 'Sobreesfuerzo al levantar cargas pesadas',
              fr: 'Effort en soulevant de lourdes charges',
              it: 'Sforzo nel sollevare carichi pesanti',
              el: 'Καταπόνηση από σήκωμα μεγάλου βάρους',
              ru: 'Надрыв от поднятия тяжестей'
            },
            remedyHints: ['arnica-montana', 'rhus-toxicodendron', 'ruta-graveolens']
          },
          {
            id: 'causa-blunt-blow',
            label: {
              de: 'Stumpfer Schlag / Sturz / Prellung auf den Bauch oder Rücken',
              en: 'Blunt blow / fall / contusion to abdomen or back',
              es: 'Golpe contundente / caída / contusión',
              fr: 'Coup contondant / chute / contusion',
              it: 'Colpo violento / caduta / contusione',
              el: 'Χτύπημα / πτώση / μώλωπας',
              ru: 'Тупой удар / падение / ушиб живота или спины'
            },
            remedyHints: ['arnica-montana', 'bellis-perennis', 'hypericum-perforatum']
          }
        ]
      },
      {
        id: 'causa-cat-no-event',
        label: {
          de: 'Kein erkennbarer Auslöser (Spontaner Beginn)',
          en: 'No noticeable trigger (Spontaneous onset)',
          es: 'Sin desencadenante apreciable (Inicio espontáneo)',
          fr: 'Aucun déclencheur identifiable (Début spontané)',
          it: 'Nessun fattore scatenante riconoscibile',
          el: 'Κανένας εμφανής εκλυτικός παράγοντας (αυτόματη έναρξη)',
          ru: 'Без видимой причины (спонтанное начало)'
        },
        tier2Options: [
          {
            id: 'causa-spontaneous-clean',
            label: {
              de: 'Aus völliger Gesundheit heraus ohne erkennbaren Grund',
              en: 'Out of complete health with no apparent reason',
              es: 'En pleno estado de salud sin causa aparente',
              fr: 'En pleine santé sans raison apparente',
              it: 'In piena salute senza motivo apparente',
              el: 'Εν μέσω πλήρους υγείας χωρίς προφανή αιτία',
              ru: 'На фоне полного здоровья без видимой причины'
            }
          }
        ]
      }
    ]
  },

  // SÄULE 4: WAS NOCH? (Körperliche Begleitsymptome & Gemüt)
  concomitants: {
    pillar: 'concomitants',
    leadQuestion: {
      de: 'Welche auffälligen Begleitreaktionen (Durst, Temperatur, Schweiß) oder Gemütszustände treten gleichzeitig auf?',
      en: 'What notable concomitant reactions (thirst, temperature, sweat) or mental states occur simultaneously?',
      es: '¿Qué reacciones concomitantes (sed, temperatura, sudor) o estados de ánimo ocurren al mismo tiempo?',
      fr: 'Quelles réactions concomitantes (soif, température, sueur) ou humeurs surviennent en même temps ?',
      it: 'Quali reazioni concomitanti (sete, temperatura, sudore) o stati d\'animo si manifestano contemporaneamente?',
      el: 'Ποιες αξιοσημείωτες συνοδές αντιδράσεις (δίψα, θερμοκρασία, εφίδρωση) ή ψυχικές καταστάσεις συνυπάρχουν;',
      ru: 'Какие сопутствующие реакции (жажда, температура, потливость) или психические состояния возникают одновременно?'
    },
    categories: [
      {
        id: 'con-cat-thirst',
        label: {
          de: 'Durst- & Trinkverhalten',
          en: 'Thirst & Drinking behavior',
          es: 'Sed y comportamiento al beber',
          fr: 'Soif et comportement hydrique',
          it: 'Sete e assunzione di liquidi',
          el: 'Δίψα & συμπεριφορά λήψης υγρών',
          ru: 'Жажда и режим питья'
        },
        tier2Options: [
          {
            id: 'con-thirst-large-cold',
            label: {
              de: 'Unstillbarer Durst auf große Mengen eiskaltes Wasser',
              en: 'Unquenchable thirst for large amounts of ice-cold water',
              es: 'Sed insaciable de grandes cantidades de agua helada',
              fr: 'Soif insatiable de grandes quantités d\'eau glacée',
              it: 'Sete inestinguibile di grandi quantità di acqua gelata',
              el: 'Ακατάσχετη δίψα για μεγάλες ποσότητες παγωμένου νερού',
              ru: 'Неутолимая жажда больших количеств ледяной воды'
            },
            remedyHints: ['bryonia-alba', 'phosphorus', 'aconitum-napellus']
          },
          {
            id: 'con-thirst-sips-often',
            label: {
              de: 'Ständiger Durst, trinkt aber nur kleine Schlucke häufig',
              en: 'Constant thirst, but drinks only small sips frequently',
              es: 'Sed constante pero solo a pequeños sorbos frecuentes',
              fr: 'Soif constante mais ne boit que de petites gorgées fréquentes',
              it: 'Sete continua ma beve solo piccoli sorsi frequenti',
              el: 'Συνεχής δίψα, πίνει συχνά μικρές γουλιές',
              ru: 'Постоянная жажда, пьет часто, но маленькими глотками'
            },
            remedyHints: ['arsenicum-album', 'china-officinalis']
          },
          {
            id: 'con-thirstless-complete',
            label: {
              de: 'Völlige Durstlosigkeit trotz Fieber oder Hitze',
              en: 'Complete thirstlessness despite fever or heat',
              es: 'Ausencia total de sed a pesar de la fiebre o calor',
              fr: 'Absence totale de soif malgré la fièvre ou la chaleur',
              it: 'Assenza totale di sete nonostante febbre o calore',
              el: 'Πλήρης έλλειψη δίψας παρά τον πυρετό ή τη ζέστη',
              ru: 'Полное отсутствие жажды, несмотря на жар или лихорадку'
            },
            remedyHints: ['pulsatilla-pratensis', 'apis-mellifica', 'gelsemium-sempervirens']
          }
        ]
      },
      {
        id: 'con-cat-mind-psych',
        label: {
          de: 'Gemütszustand & Verhalten während des Leidens',
          en: 'Mental State & Behavior during suffering',
          es: 'Estado de ánimo y comportamiento durante el malestar',
          fr: 'État mental et comportement pendant la souffrance',
          it: 'Stato d\'animo e comportamento durante la sofferenza',
          el: 'Ψυχική διάθεση & συμπεριφορά κατά την ασθένεια',
          ru: 'Психическое состояние и поведение во время болезни'
        },
        tier2Options: [
          {
            id: 'mind-restless-fear-death',
            label: {
              de: 'Ängstliche Ruhelosigkeit mit Furcht & Verzweiflung',
              en: 'Anxious restlessness with fear & despair',
              es: 'Inquietud ansiosa con miedo y desesperación',
              fr: 'Agitation anxieuse avec peur et désespoir',
              it: 'Irrequietezza ansiosa con paura e disperazione',
              el: 'Αγχώδης ανησυχία με φόβο & απόγνωση',
              ru: 'Тревожное беспокойство со страхом и отчаянием'
            },
            remedyHints: ['aconitum-napellus', 'arsenicum-album', 'rhus-toxicodendron']
          },
          {
            id: 'mind-irritable-anger-touch',
            label: {
              de: 'Extreme Reizbarkeit / Duldet keine Ansprache oder Berührung',
              en: 'Extreme irritability / tolerates no speech or touch',
              es: 'Extrema irritabilidad / no tolera que le hablen o toquen',
              fr: 'Irritabilité extrême / ne tolère ni parole ni contact',
              it: 'Estrema irritabilità / non tollera che gli si parli o tocchi',
              el: 'Έντονος εκνευρισμός / δεν ανέχεται κουβέντα ή άγγιγμα',
              ru: 'Крайняя раздражительность / не переносит разговоров или прикосновений'
            },
            remedyHints: ['chamomilla', 'nux-vomica', 'bryonia-alba', 'colocynthis']
          },
          {
            id: 'mind-weeps-craves-consolation',
            label: {
              de: 'Weinerlich, sanftmütig, sucht Trost & Zuwendung',
              en: 'Weepy, gentle, craves consolation & sympathy',
              es: 'Lloroso, suave, busca consuelo y compañía',
              fr: 'Larmoyant, doux, recherche consolation et réconfort',
              it: 'Piagnucoloso, dolce, cerca consolazione e vicinanza',
              el: 'Κλαψιάρης, πράος, αναζητά παρηγοριά & συμπαράσταση',
              ru: 'Плаксивый, кроткий, ищет утешения и ласки'
            },
            remedyHints: ['pulsatilla-pratensis', 'ignatia-amara']
          }
        ]
      }
    ]
  }
};
