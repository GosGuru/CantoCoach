export interface KnowledgeEntry {
  id: string;
  title: string;
  summary: string;
  category:
    | "anatomía"
    | "constricción"
    | "passaggio"
    | "metodología"
    | "rutina";
  tags: string[];
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: "kb-velo",
    title: "Control del velo del paladar",
    summary:
      "El velo del paladar regula el espacio de resonancia. Debe elevarse parcialmente para crear amplitud sin bloquear la salida nasal. Cues: bostezo incipiente, sonido que rebota en paladar duro.",
    category: "anatomía",
    tags: ["velo", "resonancia", "espacio", "bostezo"],
  },
  {
    id: "kb-laringe",
    title: "Control de la laringe (baja-neutra)",
    summary:
      "La laringe baja genera timbre ancho y cuerpo (estilo Alejandro Fernández). En el passaggio, oscila hacia neutra sin perder la sensación de cuello relajado.",
    category: "anatomía",
    tags: ["laringe", "timbre", "posición", "cuerpo"],
  },
  {
    id: "kb-tvc-fvc",
    title: "Cuerdas verdaderas vs. falsas (TVC/FVC)",
    summary:
      "Las TVC producen el sonido. Las FVC son protectoras; si se activan generan constricción, opresión y fatiga. El objetivo es aislar el cierre de las TVC sin refuerzo de las FVC.",
    category: "anatomía",
    tags: ["tvc", "fvc", "cierre cordal", "constricción"],
  },
  {
    id: "kb-constriction",
    title: "¿Qué es la constricción laringea?",
    summary:
      "Tensión adicional en la laringe o su entorno que no es necesaria para fonar. Reduce eficiencia y aumenta fatiga. Tipos: supraglótica, lateral, anterior, posterior.",
    category: "constricción",
    tags: ["constricción", "tensión", "fatiga"],
  },
  {
    id: "kb-retraction",
    title: "Protocolo de retracción",
    summary:
      "Secuencia para liberar la constricción: 1) reír silencioso, 2) bostezo incipiente, 3) vibración labial (brrr), 4) voz humeada con sensación de laringe flotante.",
    category: "constricción",
    tags: ["retracción", "bostezo", "reír silencioso", "liberación"],
  },
  {
    id: "kb-passaggio",
    title: "El passaggio del barítono (C4–F#4)",
    summary:
      "Zona donde la voz de pecho pierde eficiencia y debe entrar la voz mixta. Se usa twang moderado, laringe neutra y vocales /e/ o /i/ para mantener el brillo.",
    category: "passaggio",
    tags: ["passaggio", "mix", "twang", "C4", "F#4"],
  },
  {
    id: "kb-twang",
    title: "Twang (estrechamiento ariepiglótico)",
    summary:
      "Estrechamiento entre epiglotis y base de la lengua que aumenta la eficiencia acústica sin más presión. Da brillo y proyección. Debe ir acompañado de velo elevado.",
    category: "passaggio",
    tags: ["twang", "brillo", "eficiencia", "epiglotis"],
  },
  {
    id: "kb-areh",
    title: "Metodología de Areh",
    summary:
      "Enfoque pedagógico que prioriza la técnica vocal al servicio del artista. El coach propone un solo ajuste por día, nunca fuerza, y termina cada feedback con: 'Escuchá a tu cuerpo. La técnica existe para servirte, no para dominarte.'",
    category: "metodología",
    tags: ["Areh", "pedagogía", "feedback", "principios"],
  },
  {
    id: "kb-routine",
    title: "Lógica de adaptación de rutina",
    summary:
      "El agente evalúa constricción (0–3), control de passaggio (0–3) y energía (0–3). Según los valores, adapta la rutina del día siguiente: más retracción, más mix, o repertorio conseguido.",
    category: "rutina",
    tags: ["rutina", "adaptación", "evaluación", "heurística"],
  },
];

export function searchKnowledge(query: string): KnowledgeEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return knowledgeBase;
  return knowledgeBase.filter(
    (entry) =>
      entry.title.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q)) ||
      entry.category.toLowerCase().includes(q)
  );
}
