export type DetectedLang = "ar" | "fr" | "en";

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g;

// Common Algerian Darija / Arabizi tokens written in Latin script.
const ARABIZI_WORDS = [
  "wach","wash","wach","chhal","kifach","kifash","ndir","nsajel","nsajjel","bach","bech","lazm","lazem",
  "3andi","3la","rani","rak","raki","haja","khoya","khti","sahbi","chwiya","barka","yak","wa3lah","3lach",
  "smiti","nta","nti","ana","hna","kifkif","mli7","mlih","labas","sahit","sahha","inchallah","incha","bezaf",
  "makanch","kayn","kayen","tani","dork","daba","brk","zayda","nchallah","salam","selem",
];

const FRENCH_WORDS = [
  "le","la","les","un","une","des","du","de","je","tu","il","elle","nous","vous","ils","elles","est","suis",
  "comment","pourquoi","quand","où","quel","quelle","quels","quelles","puis","peux","pouvez","veux","voudrais",
  "bonjour","bonsoir","salut","merci","oui","non","s'il","plaît","avec","pour","dans","sur","mais","donc",
  "inscription","inscrire","rejoindre","cours","paiement","abonnement","élève","enseignant","être","avoir",
  "aide","aider","besoin","mon","ma","mes","votre","vos","cette","ce","ces","qui","que","quoi","est-ce",
];

const ENGLISH_WORDS = [
  "the","a","an","i","you","he","she","we","they","is","are","am","do","does","did","how","what","why","when",
  "where","which","can","could","would","should","want","need","please","thanks","thank","yes","no","hello","hi",
  "register","registration","join","class","payment","subscription","student","teacher","help","my","your",
  "there","this","that","about","with","for","from","and","but","have","has","get","make","account","password",
];

function countWords(tokens: string[], list: string[]): number {
  const set = new Set(list);
  let n = 0;
  for (const tk of tokens) if (set.has(tk)) n++;
  return n;
}

/**
 * Detect the language of a single user message.
 * Arabic script and Algerian Darija/Arabizi both resolve to "ar".
 */
export function detectMessageLanguage(message: string, fallback: DetectedLang = "ar"): DetectedLang {
  const text = (message ?? "").trim();
  if (!text) return fallback;

  const lower = text.toLowerCase();
  const arabicChars = (text.match(ARABIC_RE) ?? []).length;
  const latinChars = (lower.match(/[a-zà-ÿ]/g) ?? []).length;

  // Arabic script dominance.
  if (arabicChars > 0 && arabicChars >= latinChars) return "ar";

  const tokens = lower
    .replace(/[^a-zà-ÿ0-9''\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const arabizi = countWords(tokens, ARABIZI_WORDS) + (/\b[a-z]*[2379][a-z]*\b/.test(lower) ? 1 : 0);
  const french = countWords(tokens, FRENCH_WORDS) + ((lower.match(/[àâçéèêëîïôûùüÿœ]/g) ?? []).length ? 1 : 0);
  const english = countWords(tokens, ENGLISH_WORDS);

  // Mixed script: Arabic characters present but fewer than Latin -> compare signals.
  const arabicScore = arabizi + (arabicChars > 0 ? Math.ceil(arabicChars / 3) : 0);

  const best = Math.max(arabicScore, french, english);
  if (best === 0) {
    if (arabicChars > 0) return "ar";
    return latinChars > 0 ? fallback === "ar" ? "en" : fallback : fallback;
  }
  if (arabicScore === best) return "ar";
  if (french === best && french >= english) return "fr";
  return "en";
}

export const LANGUAGE_FALLBACK_MESSAGES: Record<DetectedLang, string> = {
  ar: "عذرًا، حدث خطأ مؤقت. حاول مرة أخرى.",
  fr: "Désolé, une erreur temporaire s'est produite. Veuillez réessayer.",
  en: "Sorry, a temporary error occurred. Please try again.",
};
