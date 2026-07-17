// Minimal country + state dataset for registration form.
// Full Algeria wilayas + a curated set of common countries with dial codes.

export type Country = {
  code: string; // ISO 3166-1 alpha-2
  name_ar: string;
  name_en: string;
  dial: string; // without +
  flag: string; // emoji
  states: string[];
};

export const ALGERIA_WILAYAS = [
  "أدرار","الشلف","الأغواط","أم البواقي","باتنة","بجاية","بسكرة","بشار","البليدة","البويرة",
  "تمنراست","تبسة","تلمسان","تيارت","تيزي وزو","الجزائر","الجلفة","جيجل","سطيف","سعيدة",
  "سكيكدة","سيدي بلعباس","عنابة","قالمة","قسنطينة","المدية","مستغانم","المسيلة","معسكر","ورقلة",
  "وهران","البيض","إليزي","برج بوعريريج","بومرداس","الطارف","تندوف","تيسمسيلت","الوادي","خنشلة",
  "سوق أهراس","تيبازة","ميلة","عين الدفلى","النعامة","عين تموشنت","غرداية","غليزان",
  "تيميمون","برج باجي مختار","أولاد جلال","بني عباس","عين صالح","عين قزام","تقرت","جانت","المغير","المنيعة",
];

// Generic fallback for countries without a curated list
const G = ["-"];

export const COUNTRIES: Country[] = [
  { code: "DZ", name_ar: "الجزائر", name_en: "Algeria", dial: "213", flag: "🇩🇿", states: ALGERIA_WILAYAS },
  { code: "SA", name_ar: "المملكة العربية السعودية", name_en: "Saudi Arabia", dial: "966", flag: "🇸🇦",
    states: ["الرياض","مكة المكرمة","المدينة المنورة","القصيم","المنطقة الشرقية","عسير","تبوك","حائل","الحدود الشمالية","جازان","نجران","الباحة","الجوف"] },
  { code: "EG", name_ar: "مصر", name_en: "Egypt", dial: "20", flag: "🇪🇬",
    states: ["القاهرة","الجيزة","الإسكندرية","الدقهلية","الشرقية","القليوبية","المنوفية","الغربية","كفر الشيخ","دمياط","البحيرة","الإسماعيلية","السويس","بورسعيد","بني سويف","الفيوم","المنيا","أسيوط","سوهاج","قنا","الأقصر","أسوان","البحر الأحمر","الوادي الجديد","مطروح","شمال سيناء","جنوب سيناء"] },
  { code: "MA", name_ar: "المغرب", name_en: "Morocco", dial: "212", flag: "🇲🇦",
    states: ["طنجة-تطوان-الحسيمة","الشرق","فاس-مكناس","الرباط-سلا-القنيطرة","بني ملال-خنيفرة","الدار البيضاء-سطات","مراكش-آسفي","درعة-تافيلالت","سوس-ماسة","كلميم-واد نون","العيون-الساقية الحمراء","الداخلة-وادي الذهب"] },
  { code: "TN", name_ar: "تونس", name_en: "Tunisia", dial: "216", flag: "🇹🇳",
    states: ["تونس","أريانة","بن عروس","منوبة","نابل","زغوان","بنزرت","باجة","جندوبة","الكاف","سليانة","سوسة","المنستير","المهدية","صفاقس","القيروان","القصرين","سيدي بوزيد","قابس","مدنين","تطاوين","قفصة","توزر","قبلي"] },
  { code: "LY", name_ar: "ليبيا", name_en: "Libya", dial: "218", flag: "🇱🇾", states: G },
  { code: "AE", name_ar: "الإمارات العربية المتحدة", name_en: "United Arab Emirates", dial: "971", flag: "🇦🇪",
    states: ["أبوظبي","دبي","الشارقة","عجمان","أم القيوين","رأس الخيمة","الفجيرة"] },
  { code: "QA", name_ar: "قطر", name_en: "Qatar", dial: "974", flag: "🇶🇦", states: G },
  { code: "KW", name_ar: "الكويت", name_en: "Kuwait", dial: "965", flag: "🇰🇼", states: G },
  { code: "BH", name_ar: "البحرين", name_en: "Bahrain", dial: "973", flag: "🇧🇭", states: G },
  { code: "OM", name_ar: "عُمان", name_en: "Oman", dial: "968", flag: "🇴🇲", states: G },
  { code: "YE", name_ar: "اليمن", name_en: "Yemen", dial: "967", flag: "🇾🇪", states: G },
  { code: "IQ", name_ar: "العراق", name_en: "Iraq", dial: "964", flag: "🇮🇶", states: G },
  { code: "SY", name_ar: "سوريا", name_en: "Syria", dial: "963", flag: "🇸🇾", states: G },
  { code: "JO", name_ar: "الأردن", name_en: "Jordan", dial: "962", flag: "🇯🇴", states: G },
  { code: "LB", name_ar: "لبنان", name_en: "Lebanon", dial: "961", flag: "🇱🇧", states: G },
  { code: "PS", name_ar: "فلسطين", name_en: "Palestine", dial: "970", flag: "🇵🇸", states: G },
  { code: "SD", name_ar: "السودان", name_en: "Sudan", dial: "249", flag: "🇸🇩", states: G },
  { code: "SO", name_ar: "الصومال", name_en: "Somalia", dial: "252", flag: "🇸🇴", states: G },
  { code: "MR", name_ar: "موريتانيا", name_en: "Mauritania", dial: "222", flag: "🇲🇷", states: G },
  { code: "DJ", name_ar: "جيبوتي", name_en: "Djibouti", dial: "253", flag: "🇩🇯", states: G },
  { code: "KM", name_ar: "جزر القمر", name_en: "Comoros", dial: "269", flag: "🇰🇲", states: G },
  { code: "TR", name_ar: "تركيا", name_en: "Turkey", dial: "90", flag: "🇹🇷", states: G },
  { code: "FR", name_ar: "فرنسا", name_en: "France", dial: "33", flag: "🇫🇷", states: G },
  { code: "GB", name_ar: "المملكة المتحدة", name_en: "United Kingdom", dial: "44", flag: "🇬🇧", states: G },
  { code: "US", name_ar: "الولايات المتحدة", name_en: "United States", dial: "1", flag: "🇺🇸", states: G },
  { code: "CA", name_ar: "كندا", name_en: "Canada", dial: "1", flag: "🇨🇦", states: G },
  { code: "DE", name_ar: "ألمانيا", name_en: "Germany", dial: "49", flag: "🇩🇪", states: G },
  { code: "ES", name_ar: "إسبانيا", name_en: "Spain", dial: "34", flag: "🇪🇸", states: G },
  { code: "IT", name_ar: "إيطاليا", name_en: "Italy", dial: "39", flag: "🇮🇹", states: G },
  { code: "BE", name_ar: "بلجيكا", name_en: "Belgium", dial: "32", flag: "🇧🇪", states: G },
  { code: "NL", name_ar: "هولندا", name_en: "Netherlands", dial: "31", flag: "🇳🇱", states: G },
  { code: "SE", name_ar: "السويد", name_en: "Sweden", dial: "46", flag: "🇸🇪", states: G },
  { code: "CH", name_ar: "سويسرا", name_en: "Switzerland", dial: "41", flag: "🇨🇭", states: G },
  { code: "AU", name_ar: "أستراليا", name_en: "Australia", dial: "61", flag: "🇦🇺", states: G },
  { code: "MY", name_ar: "ماليزيا", name_en: "Malaysia", dial: "60", flag: "🇲🇾", states: G },
  { code: "ID", name_ar: "إندونيسيا", name_en: "Indonesia", dial: "62", flag: "🇮🇩", states: G },
  { code: "PK", name_ar: "باكستان", name_en: "Pakistan", dial: "92", flag: "🇵🇰", states: G },
  { code: "IN", name_ar: "الهند", name_en: "India", dial: "91", flag: "🇮🇳", states: G },
  { code: "BD", name_ar: "بنغلاديش", name_en: "Bangladesh", dial: "880", flag: "🇧🇩", states: G },
  { code: "NG", name_ar: "نيجيريا", name_en: "Nigeria", dial: "234", flag: "🇳🇬", states: G },
];

export const DEFAULT_COUNTRY_CODE = "DZ";

export function findCountry(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}