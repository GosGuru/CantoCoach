import type { ExerciseGuidance, ExerciseResource } from "../types/vocal.ts";

interface ExerciseLearningContent {
	guidance: ExerciseGuidance;
	resources: ExerciseResource[];
}

const youtubeSearch = (query: string) =>
	`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

export const exerciseGuidanceById: Record<string, ExerciseLearningContent> = {
	"warmup-silent-laugh": {
		guidance: {
			objective:
				"Explorar una sensación de espacio cómodo en la boca y la garganta sin emitir sonido ni empujar estructuras.",
			setup: [
				"Sentate o parate derecho, con hombros sueltos y mandíbula sin apretar.",
				"Apoyá suavemente la punta de la lengua detrás de los dientes inferiores.",
				"Hacelo primero frente a un espejo para comprobar que la cara no se endurece.",
			],
			execution: [
				"Pensá en una situación que te haría soltar una risita, pero no dejes salir aire ni sonido todavía.",
				"Con los labios apenas juntos, permití una sonrisa pequeña; no estires las comisuras al máximo.",
				"Imaginá el instante anterior a decir ‘ja’: suele aparecer una leve sensación de espacio atrás de la boca.",
				"Sostené esa sensación 2 segundos y soltá. Repetí 3 veces antes de añadir una nota suave.",
			],
			commonMistakes: [
				"Convertirlo en una sonrisa grande y rígida.",
				"Empujar la lengua hacia atrás para fabricar espacio.",
				"Forzar un bostezo o intentar bajar voluntariamente la laringe.",
				"Emitir aire con fuerza; la primera parte del ejercicio es silenciosa.",
			],
			stopSignals: [
				"Tirantez en la raíz de la lengua.",
				"Dolor, ardor o presión en la garganta.",
				"Necesidad de levantar el mentón para mantener la sensación.",
			],
		},
		resources: [
			{
				title: "Ver demostraciones de risa silenciosa y paladar blando",
				url: youtubeSearch("risa silenciosa paladar blando técnica vocal"),
				kind: "video",
				sourceLabel: "YouTube",
			},
			{
				title: "Buscar el enfoque de AREH sobre espacio vocal",
				url: youtubeSearch("AREH técnica vocal espacio paladar laringe"),
				kind: "source",
				sourceLabel: "AREH / YouTube",
			},
		],
	},
	"warmup-sigh-yawn": {
		guidance: {
			objective:
				"Encontrar una inhalación amplia y una salida de voz fácil, sin fabricar un bostezo exagerado.",
			setup: [
				"Dejá la boca entreabierta y la mandíbula pesada.",
				"Respirá una vez con normalidad antes de comenzar.",
			],
			execution: [
				"Inhalá como cuando empieza a darte sueño, sin abrir la boca al máximo.",
				"Exhalá primero sin voz y después añadí una /v/ o /z/ muy suave.",
				"Usá poco volumen y terminá antes de quedarte sin aire.",
			],
			commonMistakes: [
				"Abrir la boca tanto que la mandíbula se tensa.",
				"Oscurecer artificialmente el sonido.",
				"Empujar la laringe hacia abajo.",
			],
			stopSignals: ["Presión al tragar", "Mareo", "Dolor o raspado vocal"],
		},
		resources: [
			{
				title: "Ver demostraciones de suspiro-bostezo vocal",
				url: youtubeSearch("ejercicio suspiro bostezo técnica vocal"),
				kind: "video",
				sourceLabel: "YouTube",
			},
		],
	},
	"warmup-lip-trill": {
		guidance: {
			objective:
				"Mantener un flujo pequeño y continuo mientras los labios vibran sin presión laríngea.",
			setup: [
				"Soltá la mandíbula y dejá los labios apenas apoyados.",
				"Si no vibran, sostené suavemente las mejillas con dos dedos.",
			],
			execution: [
				"Hacé primero el trino sin voz durante 2 segundos.",
				"Añadí una nota cómoda sin aumentar la cantidad de aire.",
				"Después seguí la escala conservando la misma vibración de labios.",
			],
			commonMistakes: [
				"Soplar demasiado fuerte.",
				"Apretar los labios para obligarlos a vibrar.",
				"Subir el volumen al subir de nota.",
			],
			stopSignals: ["Mareo", "Rigidez mandibular", "Molestia en garganta"],
		},
		resources: [
			{
				title: "Ver cómo se hace un trino labial",
				url: youtubeSearch("lip trill trino labial técnica vocal español"),
				kind: "video",
				sourceLabel: "YouTube",
			},
		],
	},
	"warmup-humming-warmup": {
		guidance: {
			objective:
				"Producir una /m/ cómoda y enfocada, sin convertir la vibración facial en una obligación.",
			setup: [
				"Juntá los labios sin apretarlos y separá ligeramente los dientes.",
				"Elegí una nota de habla cómoda.",
			],
			execution: [
				"Decí ‘mmm’ como cuando algo te gusta.",
				"Sostené la nota con volumen conversacional.",
				"Abrí brevemente a ‘ma’ y volvé a /m/ sin cambiar la presión.",
			],
			commonMistakes: [
				"Apretar los labios o la nariz.",
				"Buscar vibración facial empujando el sonido.",
				"Hacerlo demasiado grave para que suene más oscuro.",
			],
			stopSignals: ["Presión nasal incómoda", "Garganta apretada", "Dolor"],
		},
		resources: [
			{
				title: "Ver demostraciones de humming vocal",
				url: youtubeSearch("humming ejercicio vocal m técnica canto"),
				kind: "video",
				sourceLabel: "YouTube",
			},
		],
	},
	"warmup-soft-onset": {
		guidance: {
			objective:
				"Entrar en la nota sin golpe brusco y sin dejar una gran bocanada de aire antes del sonido.",
			setup: [
				"Elegí una nota central y escuchala una vez.",
				"Prepará una /m/ o ‘mum’ a volumen de conversación.",
			],
			execution: [
				"Dejá un instante de silencio después de la referencia.",
				"Iniciá ‘mum’ directamente en la nota, sin deslizar desde abajo.",
				"Sostené y soltá antes de que el aire se termine.",
			],
			commonMistakes: [
				"Susurrar antes de que aparezca la nota.",
				"Golpear la vocal con demasiada fuerza.",
				"Buscar la nota mediante un arrastre ascendente.",
			],
			stopSignals: ["Golpe doloroso", "Carraspera", "Presión en cuello"],
		},
		resources: [
			{
				title: "Ver ejemplos de ataque vocal coordinado",
				url: youtubeSearch("ataque vocal coordinado onset ejercicio canto"),
				kind: "video",
				sourceLabel: "YouTube",
			},
		],
	},
	"closure-staccato": {
		guidance: {
			objective:
				"Separar notas cortas con precisión sin convertir cada inicio en un golpe de garganta.",
			setup: [
				"Probá tres ‘mi’ hablados y livianos.",
				"Mantené mandíbula y cuello quietos.",
			],
			execution: [
				"Cantá una nota corta y soltala completamente antes de la siguiente.",
				"Conservá el mismo volumen en todas las repeticiones.",
				"Dejá que el cuerpo reactive el aire sin empujar el abdomen con violencia.",
			],
			commonMistakes: [
				"Atacar con un golpe glótico fuerte.",
				"Unir las notas y perder el silencio entre ellas.",
				"Mover la cabeza para alcanzar cada altura.",
			],
			stopSignals: ["Molestia tras varios ataques", "Carraspera", "Rigidez cervical"],
		},
		resources: [
			{
				title: "Ver staccato vocal liviano",
				url: youtubeSearch("staccato vocal ejercicio canto ataque limpio"),
				kind: "video",
				sourceLabel: "YouTube",
			},
		],
	},
};
