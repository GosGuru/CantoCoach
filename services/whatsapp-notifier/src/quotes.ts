export interface Quote {
  text: string;
  author: string;
}

export const quotes: Quote[] = [
  {
    text: "El canto es el alma hecha audible.",
    author: "Enrico Caruso",
  },
  {
    text: "La técnica no es para cantar mejor que otros, sino para cantar como vos querés sin dañarte.",
    author: "Areh",
  },
  {
    text: "La voz humana es el instrumento más perfecto de todos.",
    author: "Plácido Domingo",
  },
  {
    text: "Cantar es como respirar, solo que con música.",
    author: "Luis Miguel",
  },
  {
    text: "No hay atajo para la voz. Solo paciencia, escucha y repetición consciente.",
    author: "Areh",
  },
  {
    text: "El verdadero arte del canto está en la honestidad del sonido.",
    author: "José José",
  },
  {
    text: "La laringe descansa, el aire fluye, la voz aparece.",
    author: "Areh",
  },
  {
    text: "La técnica es libertad. Cuando dominás el mecanismo, podés expresar lo que sentís.",
    author: "Alejandro Fernández",
  },
];

export function getDailyQuote(): Quote {
  const dayIndex = new Date().getDate() % quotes.length;
  return quotes[dayIndex];
}
