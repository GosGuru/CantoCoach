import type { Exercise, VoiceBlock } from "../types/vocal";

const BLOCK_LABELS: Record<VoiceBlock, string> = {
	Warmup: "Calentamiento",
	Closure: "Cierre Cordal",
	Resonancia: "Resonancia",
	Passaggio: "Passaggio",
	Repertorio: "Repertorio",
};

// Baritone-friendly reference frequencies in Hz.
// C3=131, D3=147, E3=165, F3=175, F#3=185, G3=196, A3=220, B3=247,
// C4=262, C#4=277, D4=294, E4=330, F4=349, F#4=370, G4=392.

export const vocalExercises: Exercise[] = [
	// WARMUP — 5 ejercicios
	{
		id: "warmup-silent-laugh",
		name: "Reír Silencioso — Apertura del Velo",
		block: "Warmup",
		difficulty: "beginner",
		progressionLevel: 1,
		durationMinutes: 3,
		instructions: [
			"Sonreí con los labios cerrados, como si estuvieras a punto de reír, sin emitir sonido.",
			"Dejá que la laringe baje un milímetro, como al inicio de un bostezo.",
			"Mantené la mandíbula relajada mientras abrís el espacio detrás del paladar.",
		],
		autochecks: [
			"Siento amplitud en la parte posterior de la boca.",
			"El cuello está relajado y la garganta se siente amplia.",
			"No fuerzo la sonrisa ni empujo la lengua hacia atrás.",
		],
		scalePattern: {
			type: "sustained",
			defaultBpm: 70,
			frequencies: [196, 196, 196, 196],
			noteNames: ["G3", "G3", "G3", "G3"],
		},
	},
	{
		id: "warmup-sigh-yawn",
		name: "Bostezo Incipiente — Caída de la Laringe",
		block: "Warmup",
		difficulty: "beginner",
		progressionLevel: 1,
		durationMinutes: 4,
		instructions: [
			"Inhalá como si te diera sueño, dejando que la laringe descienda suavemente.",
			"Exhalá con una /v/ o /z/ sostenida, muy suave, sin presión.",
			"Dejá que la garganta se abra sin forzar la caída de la laringe.",
		],
		autochecks: [
			"Siento la garganta abierta, sin agarre en los lados del cuello.",
			"El aire sale controlado, sin opresión.",
			"No aprieto la garganta para que el sonido 'salga más'.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 65,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "warmup-lip-trill",
		name: "Trino Labial — Flujo Constante",
		block: "Warmup",
		difficulty: "beginner",
		progressionLevel: 1,
		durationMinutes: 4,
		instructions: [
			"Colocá los labios sueltos dejando que el aire los haga vibrar.",
			"Mantené el flujo de aire estable, como si soplaras a través de un popote muy fino.",
			"Dejá que la laringe cuelgue neutra, sin empujarla hacia arriba ni hacia abajo.",
		],
		autochecks: [
			"Siento vibración suave en los labios.",
			"No hay tensión en la mandíbula.",
			"El aire sale continuo, sin cortes.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 90,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "warmup-humming-warmup",
		name: "Zumbido de Despertar — Cierre Suave y Máscara",
		block: "Warmup",
		difficulty: "beginner",
		progressionLevel: 2,
		durationMinutes: 3,
		instructions: [
			"Zumbá sobre /m/ en una nota cómoda del centro de tu voz.",
			"Dejá que el zumbido viaje hacia los pómulos y el hueso nasal.",
			"Mantené la mandíbula y la nariz relajadas mientras zumbás.",
		],
		autochecks: [
			"Siento vibración suave en los labios, sin opresión.",
			"La máscara facial vibra y la garganta se mantiene pasiva.",
			"No fuerzo el sonido hacia la garganta para ganar profundidad.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 72,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "warmup-soft-onset",
		name: "Ataque Suave — Cierre sin Presión",
		block: "Warmup",
		difficulty: "beginner",
		progressionLevel: 2,
		durationMinutes: 5,
		instructions: [
			"Iniciá cada nota desde el silencio, como si susurraras una /m/ sostenida.",
			"Buscá que las cuerdas vocales se cierren por sí solas, sin golpe de glotis.",
			"Dejá que el sonido nazca del aire, no del esfuerzo muscular.",
		],
		autochecks: [
			"El inicio de cada nota es suave, sin 'clic'.",
			"Siento las cuerdas juntas desde el primer instante.",
			"No hay empuje en la garganta.",
		],
		scalePattern: {
			type: "sustained",
			defaultBpm: 70,
			frequencies: [220, 247, 262, 294, 330, 294, 262, 247, 220],
			noteNames: ["A3", "B3", "C4", "D4", "E4", "D4", "C4", "B3", "A3"],
		},
	},
	// CLOSURE — 5 ejercicios
	{
		id: "closure-humming",
		name: "Zumbido Nasal Equilibrado — Cierre Cordal Suave",
		block: "Closure",
		difficulty: "beginner",
		progressionLevel: 1,
		durationMinutes: 4,
		instructions: [
			"Zumbá sobre /m/ o /ng/ en una nota cómoda del centro de tu voz.",
			"Si sentís nudo en la garganta, intercalá 3 reír silencioso antes de volver.",
			"Mantené el flujo de aire continuo, sin apretar la nariz.",
		],
		autochecks: [
			"Siento vibración suave en los labios o en la máscara facial.",
			"El aire fluye continuo, sin opresión.",
			"No canto 'con la garganta'; el sonido se queda en la máscara.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 72,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "closure-staccato",
		name: "Staccato — Precisión de Cierre",
		block: "Closure",
		difficulty: "intermediate",
		progressionLevel: 2,
		durationMinutes: 4,
		instructions: [
			"Cantá cortas notas con la vocal /i/, separadas por silencios breves.",
			"Mantené el cierre cordal firme pero sin apretar la garganta.",
			"Dejá que el abdomen reactive el aire para cada nota, sin empujar hacia arriba.",
		],
		autochecks: [
			"Cada nota es clara y redonda.",
			"No hay aire escapando entre nota y nota.",
			"Siento un pequeño rebote de apoyo en el abdomen.",
		],
		scalePattern: {
			type: "staccato",
			defaultBpm: 100,
			frequencies: [196, 220, 247, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "closure-legato",
		name: "Legato Fluido — Cierre Sin Cortes",
		block: "Closure",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 4,
		instructions: [
			"Cantá /a/ o /o/ en una escala conectada, sin cortar el aire entre notas.",
			"Dejá que el aire avance como una línea suave, sin empujar a golpes.",
			"Mantené el cierre cordal estable durante todo el movimiento.",
		],
		autochecks: [
			"Siento un solo hilo de aire que sostiene toda la frase.",
			"El soporte está estable, sin rigidez en abdomen u hombros.",
			"No reinicio el cierre en cada nota ni dejo pasar aire entre notas.",
		],
		scalePattern: {
			type: "legato",
			defaultBpm: 72,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "closure-ng-n",
		name: "/ng/ a /n/ — Cierre con Despegue Nasal",
		block: "Closure",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 4,
		instructions: [
			"Cantá /ng/ hacia /a/ o /e/ en una escala corta, sin perder el cierre al abrir.",
			"Permití que la nariz actúe como un conducto, no como un depósito.",
			"Mantené la lengua relajada mientras abrís la vocal.",
		],
		autochecks: [
			"Siento un cierre firme pero elástico; el sonido viaja hacia la máscara.",
			"La vibración nasal es ligera, sin exceso.",
			"No dejo caer la cuerda al abrir la vocal ni aprieto la lengua.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "closure-onset-precision",
		name: "Onset de Precisión — Cierre y Aire Justo",
		block: "Closure",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 5,
		instructions: [
			"Cantá notas cortas sobre /a/, /e/, /i/, /o/, /u/ con inicio limpio.",
			"Buscá que el sonido nazca en el punto exacto donde el aire encuentra el cierre.",
			"Mantené la laringe quieta durante el inicio de cada nota.",
		],
		autochecks: [
			"Cada nota empieza limpia, sin golpe glótico ni aire antes de la voz.",
			"El cuello se mantiene relajado, sin subir la laringe.",
			"El sonido nace en el punto exacto de encuentro entre aire y cierre.",
		],
		scalePattern: {
			type: "staccato",
			defaultBpm: 76,
			frequencies: [196, 196, 220, 220, 247, 247, 262, 262, 294, 294],
			noteNames: ["G3", "G3", "A3", "A3", "B3", "B3", "C4", "C4", "D4", "D4"],
		},
	},
	// RESONANCIA — 5 ejercicios
	{
		id: "resonance-velo-ng",
		name: "Resonancia /ng/ — Velo Elevado",
		block: "Resonancia",
		difficulty: "intermediate",
		progressionLevel: 2,
		durationMinutes: 5,
		instructions: [
			"Cantá con la consonante /ng/, manteniendo el velo elevado.",
			"Buscá la sensación de vibración en el puente de la nariz y los pómulos.",
			"Abrí hacia la vocal /a/ sin dejar caer el paladar blando.",
		],
		autochecks: [
			"Siento vibración en la máscara facial.",
			"El velo permanece alto al abrir la vocal.",
			"La transición /ng/ → /a/ es suave.",
		],
		scalePattern: {
			type: "octave-slide",
			defaultBpm: 80,
			frequencies: [
				196, 220, 247, 262, 294, 330, 392, 330, 294, 262, 247, 220, 196,
			],
			noteNames: [
				"G3",
				"A3",
				"B3",
				"C4",
				"D4",
				"E4",
				"G4",
				"E4",
				"D4",
				"C4",
				"B3",
				"A3",
				"G3",
			],
		},
	},
	{
		id: "resonance-dome-e",
		name: "Cúpula de /e/ — Brillo sin Constricción",
		block: "Resonancia",
		difficulty: "intermediate",
		progressionLevel: 2,
		durationMinutes: 5,
		instructions: [
			"Cantá /e/ sostenida en notas centrales, manteniendo el paladar alto.",
			"Mantené la laringe baja-neutra, sin empujarla hacia arriba.",
			"Dejá que el brillo aparezca en la máscara sin tensar la mandíbula.",
		],
		autochecks: [
			"Siento brillo en la máscara y la garganta relajada.",
			"El cuello se mantiene sin tensión lateral.",
			"Evito el sonido aflautado o con la laringe subida.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 72,
			frequencies: [220, 247, 277, 294, 330, 294, 277, 247, 220],
			noteNames: ["A3", "B3", "C#4", "D4", "E4", "D4", "C#4", "B3", "A3"],
		},
	},
	{
		id: "resonance-twang",
		name: "Twang Embudo — Brillo con Eficiencia",
		block: "Resonancia",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 5,
		instructions: [
			"Imaginá que el sonido pasa por un pequeño embudo en la garganta, justo por debajo del velo.",
			"Mantené el velo elevado para evitar que el sonido se nasalice demasiado.",
			"Buscá brillo metálico con menos aire, sin forzar la nota.",
		],
		autochecks: [
			"Siento brillo metálico y proyección con menos aire.",
			"El sonido apunta hacia la máscara, no hacia la nariz.",
			"Evito el sonido chillón o 'pato'; si aparece, elevo el velo.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 85,
			frequencies: [220, 247, 277, 294, 330, 294, 277, 247, 220],
			noteNames: ["A3", "B3", "C#4", "D4", "E4", "D4", "C#4", "B3", "A3"],
		},
	},
	{
		id: "resonance-vowel-shaping",
		name: "Moldeado de Vocales — Espacio Constante",
		block: "Resonancia",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 5,
		instructions: [
			"Cantá una secuencia /a/-/e/-/i/-/o/-/u/ en una misma nota, manteniendo el espacio oral.",
			"Mantené la laringe baja-neutra mientras cambiás de vocal.",
			"Dejá que el sonido cambie de color sin que el espacio de resonancia se mueva.",
		],
		autochecks: [
			"El sonido cambia de color pero el espacio de resonancia se mantiene.",
			"Siento estabilidad en el cuello durante todo el cambio vocal.",
			"No cierro la boca ni subo la laringe para /i/ o /e/.",
		],
		scalePattern: {
			type: "sustained",
			defaultBpm: 70,
			frequencies: [196, 196, 196, 196, 196, 196],
			noteNames: ["G3", "G3", "G3", "G3", "G3", "G3"],
		},
	},
	{
		id: "resonance-pharyngeal",
		name: "Espacio Faríngeo — Profundidad sin Peso",
		block: "Resonancia",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 5,
		instructions: [
			"Cantá /a/ o /o/ sostenida con sensación de 'boca abierta hacia atrás', como un grito silencioso.",
			"Mantené el embudo ariepiglótico para que el espacio no se vuelva pesado.",
			"Dejá que la resonancia se amplíe detrás de la boca sin caer en la garganta.",
		],
		autochecks: [
			"Siento resonancia amplia detrás de la boca, sin caer en la garganta.",
			"La profundidad va acompañada de brillo, no de oscuridad con peso.",
			"No fuerzo la apertura con la mandíbula ni tensa la nuca.",
		],
		scalePattern: {
			type: "arpeggio",
			defaultBpm: 72,
			frequencies: [175, 220, 262, 220, 175],
			noteNames: ["F3", "A3", "C4", "A3", "F3"],
		},
	},
	// PASSAGGIO — 5 ejercicios
	{
		id: "mix-larynx-neutral",
		name: "Laringe Neutra en Octava Dividida",
		block: "Passaggio",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 5,
		instructions: [
			"Cantá octavas divididas sobre /a/ cómoda, dejando que la laringe flote hacia neutra en la nota alta.",
			"Mantené el cierre de las cuerdas verdaderas sin refuerzo de cuerdas falsas.",
			"Evitá empujar la laringe hacia abajo con fuerza.",
		],
		autochecks: [
			"La laringe no sube ni se agarra; la transición es suave.",
			"Siento voz con cuerpo y ligereza al mismo tiempo.",
			"No salto al falsete ni fuerzo el pecho.",
		],
		scalePattern: {
			type: "octave-slide",
			defaultBpm: 72,
			frequencies: [196, 392, 370, 392, 294, 392, 247, 392, 196],
			noteNames: ["G3", "G4", "F#4", "G4", "D4", "G4", "B3", "G4", "G3"],
		},
	},
	{
		id: "mix-twang-funnel",
		name: "Twang Embudo — Eficiencia en el Passaggio",
		block: "Passaggio",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 6,
		instructions: [
			"Imaginá que el sonido pasa por un embudo en la garganta, justo por debajo del velo.",
			"Mantené el velo elevado mientras atravesás el passaggio.",
			"Buscá brillo y ligereza sin gritar en la zona C4–F#4.",
		],
		autochecks: [
			"Siento brillo metálico que acompaña la subida.",
			"El sonido viaja hacia la máscara, no se nasaliza.",
			"Atravieso el passaggio sin gritar ni saltar de registro.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [262, 294, 330, 370, 392, 370, 330, 294, 262],
			noteNames: ["C4", "D4", "E4", "F#4", "G4", "F#4", "E4", "D4", "C4"],
		},
	},
	{
		id: "mix-chest-head-blend",
		name: "Mezcla Pecho-Cabeza en Quinta",
		block: "Passaggio",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 6,
		instructions: [
			"Cantá una quinta ascendente-descendente sobre /o/ o /u/ en la zona C4–F#4.",
			"Añadí un poquito de twang en la nota alta para mantener la proyección.",
			"Dejá que el cuerpo del pecho permanezca mientras aparece la ligereza de la cabeza.",
		],
		autochecks: [
			"El cuerpo del pecho permanece y la ligereza aparece sin saltos.",
			"La nota alta tiene brillo y cuerpo al mismo tiempo.",
			"No fuerzo el pecho ni desaparezco en falsete.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 76,
			frequencies: [262, 294, 330, 370, 392, 370, 330, 294, 262],
			noteNames: ["C4", "D4", "E4", "F#4", "G4", "F#4", "E4", "D4", "C4"],
		},
	},
	{
		id: "mix-vowel-modification",
		name: "Modificación de Vocales en el Passaggio",
		block: "Passaggio",
		difficulty: "advanced",
		progressionLevel: 5,
		durationMinutes: 6,
		instructions: [
			"Cantá una frase sobre /a/, /e/, /i/ y, al subir, permití que la vocal se cierre un poco hacia /o/ o /u/ internamente.",
			"Mantené la laringe neutra; dejá que la modificación vocal sostenga la subida.",
			"Buscá subida sin agarre, conservando un timbre reconocible.",
		],
		autochecks: [
			"La vocal cambia de forma pero la laringe no se altera.",
			"Siento subida sin agarre y con timbre reconocible.",
			"Evito mantener la boca tan abierta que la laringe suba.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 72,
			frequencies: [262, 294, 330, 370, 392, 370, 330, 294, 262],
			noteNames: ["C4", "D4", "E4", "F#4", "G4", "F#4", "E4", "D4", "C4"],
		},
	},
	{
		id: "mix-sirens",
		name: "Sirenas — Conexión Passaggio",
		block: "Passaggio",
		difficulty: "advanced",
		progressionLevel: 5,
		durationMinutes: 6,
		instructions: [
			"Deslizá la voz de G3 a G4 y de vuelta sin cortar el flujo de aire.",
			"Mantené la laringe neutra y evitá subir los hombros.",
			"Buscá un sonido mixto: ni todo pecho, ni todo cabeza, sino una mezcla ligera.",
		],
		autochecks: [
			"La transición de registro es continua.",
			"No siento salto brusco en la voz.",
			"La laringe se mantiene estable durante el ascenso.",
		],
		scalePattern: {
			type: "sirens",
			defaultBpm: 60,
			frequencies: [196, 247, 262, 330, 392, 330, 262, 247, 196],
			noteNames: ["G3", "B3", "C4", "E4", "G4", "E4", "C4", "B3", "G3"],
		},
	},
	// REPERTORIO — 5 ejercicios
	{
		id: "repertoire-luis-miguel",
		name: "Fraseo de Balada — Registro Medio Grande",
		block: "Repertorio",
		difficulty: "intermediate",
		progressionLevel: 3,
		durationMinutes: 6,
		instructions: [
			"Mantené la laringe baja-neutra para el cuerpo del sonido, típico de baladas.",
			"Dejá que el sonido resuene en la bóveda oral y se proyecte hacia adelante.",
			"Cantá la frase con emoción sin subir la laringe.",
		],
		autochecks: [
			"Siento timbre ancho, sin opresión, con vibrato natural.",
			"La voz se siente envolvente pero clara.",
			"No canto desde la garganta para sonar más sentado.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "repertoire-jose-jose",
		name: "Voz Íntima con Ligereza — José José",
		block: "Repertorio",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 5,
		instructions: [
			"Usá un cierre cordal muy ligero para pianos y mezzofortes.",
			"Iniciá cada frase con un onset suave, casi como un susurro cantado.",
			"Mantené el sonido íntimo sin apretar para que 'salga' el sentimiento.",
		],
		autochecks: [
			"Siento un sonido íntimo, aireado controlado, sin que se rompa.",
			"El inicio de cada frase es limpio, sin golpe glótico.",
			"No aprieto el cierre para transmitir más emoción.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [220, 247, 277, 294, 330, 294, 277, 247, 220],
			noteNames: ["A3", "B3", "C#4", "D4", "E4", "D4", "C#4", "B3", "A3"],
		},
	},
	{
		id: "repertoire-alejandro",
		name: "Timbre Grande de Rancho — Alejandro Fernández",
		block: "Repertorio",
		difficulty: "advanced",
		progressionLevel: 4,
		durationMinutes: 6,
		instructions: [
			"Mantené la laringe baja-neutra para sentir la voz 'ancha' y resonante.",
			"Si aparece opresión, reducí el volumen y hacé retracción.",
			"Buscá potencia sin agarre, sin competir con el volumen del track original.",
		],
		autochecks: [
			"Siento cuerpo en el pecho, resonancia en la bóveda y vibrato amplio.",
			"La potencia sale sin agarre en el cuello.",
			"No fuerzo la laringe hacia abajo para 'sonar más varonil'.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [196, 220, 247, 262, 330, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "E4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "repertoire-ballad-phrasing",
		name: "Fraseo de Balada — Aire y Emoción",
		block: "Repertorio",
		difficulty: "advanced",
		progressionLevel: 5,
		durationMinutes: 6,
		instructions: [
			"Marcá los lugares de respiración antes de cantar la frase.",
			"Mantené la laringe baja-neutra aunque la frase suba de emoción.",
			"Planificá la respiración para que el aire llegue justo al final de cada frase.",
		],
		autochecks: [
			"El aire llega justo al final de la frase, sin emergencia.",
			"La emoción está en la música, no en la tensión del cuello.",
			"No respiro en medio de una idea musical solo porque falta aire.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 80,
			frequencies: [196, 220, 247, 262, 294, 262, 247, 220, 196],
			noteNames: ["G3", "A3", "B3", "C4", "D4", "C4", "B3", "A3", "G3"],
		},
	},
	{
		id: "repertoire-dynamics",
		name: "Dinámica Expresiva — De Piano a Forte",
		block: "Repertorio",
		difficulty: "advanced",
		progressionLevel: 5,
		durationMinutes: 6,
		instructions: [
			"Cantá una frase primero en piano y luego en forte, manteniendo el mismo cierre de base.",
			"Dejá que el aumento de volumen venga de una gestión más activa del aire.",
			"Mantené el cuello relajado en el forte.",
		],
		autochecks: [
			"El volumen cambia por más aire, no por más agarre.",
			"Siento soporte estable y cuello relajado en el forte.",
			"No aprieto el cierre para cantar más fuerte.",
		],
		scalePattern: {
			type: "5-note-ascending-descending",
			defaultBpm: 85,
			frequencies: [220, 247, 277, 294, 330, 294, 277, 247, 220],
			noteNames: ["A3", "B3", "C#4", "D4", "E4", "D4", "C#4", "B3", "A3"],
		},
	},
];

export function vocalExerciseById(id: string): Exercise | undefined {
	return vocalExercises.find((exercise) => exercise.id === id);
}

export function vocalExercisesByBlock(block: VoiceBlock): Exercise[] {
	return vocalExercises.filter((exercise) => exercise.block === block);
}

export function vocalExercisesByLevel(
	level: Exercise["difficulty"],
): Exercise[] {
	return vocalExercises.filter((exercise) => exercise.difficulty === level);
}

export { BLOCK_LABELS };
