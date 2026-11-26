import type { LanguageCode, TamilDialectId } from '../types';

export interface TamilDialectConfig {
  id: TamilDialectId;
  nameTa: string;
  nameEn: string;
  regionTa: string;
  regionEn: string;
  descriptionTa: string;
  descriptionEn: string;
  sampleLineTa: string;
  greetingTemplateTa: (elderName: string) => string;
  sampleUserPhrasesTa: string[];
  ttsPronunciationStyle: string;
  llmDialectGuidance: string;
}

export const TAMIL_DIALECTS: TamilDialectConfig[] = [
  {
    id: 'chennai',
    nameTa: 'சென்னைத் தமிழ்',
    nameEn: 'Chennai Tamil',
    regionTa: 'சென்னை மற்றும் சுற்றுவட்டாரப் பகுதிகள்',
    regionEn: 'Chennai & surrounding areas',
    descriptionTa: 'அன்பான, எளிமையான சென்னைப் பேச்சு நடை; மரியாதையுடன் கூடிய அன்றாடத் தமிழ்.',
    descriptionEn: 'Polite, warm everyday Chennai conversational Tamil respectful to elders.',
    sampleLineTa:
      'வணக்கம்ங்க. நல்லா இருக்கீங்களா? அவசரமே இல்லைங்க, மெதுவா பேசுங்க. நான் உங்களுக்காக இங்கேதான் இருக்கேன்.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}ம்மா! எப்படி இருக்கீங்க? சாப்டீங்களா? நான் உங்க கூடவே இருக்கேன்ங்க, எதுவா இருந்தாலும் தயங்காம சொல்லுங்க.`,
    sampleUserPhrasesTa: [
      'இன்னைக்கு காலையில இருந்து முழங்கால் லேசா வலிக்குதுங்க, மருத்துவரைப் பார்க்கணும்.',
      'நாளைக்கு மருத்துவமனைக்குப் போக ஒரு வண்டி ஏற்பாடு பண்ணுங்க.',
      'இன்னைக்கு காலைல என்ன மாத்திரை போடணும்னு சொல்லுங்க.',
    ],
    ttsPronunciationStyle:
      'Speak in warm, polite Chennai spoken Tamil cadence with soft "-ங்க" endings, clear consonants, gentle melodic phrasing, and natural unhurried pauses between sentences.',
    llmDialectGuidance:
      'Use polite, respectful Chennai spoken Tamil suitable for a beloved elder ("எப்படி இருக்கீங்க", "சாப்டீங்களா", "பார்த்துக்கலாம்ங்க", "மருந்து போட்டுக்கிட்டீங்களா", "அவசரமில்லைங்க"). Avoid rough street slang and avoid English loanwords whenever a natural Tamil word exists.',
  },
  {
    id: 'kongu',
    nameTa: 'கொங்குத் தமிழ்',
    nameEn: 'Kongu Tamil',
    regionTa: 'கோயம்புத்தூர், ஈரோடு, திருப்பூர் மற்றும் சுற்றுவட்டாரம்',
    regionEn: 'Coimbatore, Erode, Tiruppur & surrounding regions',
    descriptionTa: 'மரியாதையும் பணிவும் நிறைந்த இனிமையான கொங்கு மண்டலப் பேச்சு நடை.',
    descriptionEn: 'Soft, notably respectful Kongu Tamil with gentle "-ங்க / -ங்கோ" honorifics.',
    sampleLineTa:
      'வணக்கங்கோ. நல்லாருக்கீங்களா? அவசரப்படாதீங்கோ, உங்க சௌகரியம் போல மெதுவா சொல்லுங்கோ. நான் பார்த்துக்கறேங்க.',
    greetingTemplateTa: (elderName) =>
      `வணக்கங்க ${elderName}! நல்லாருக்கீங்களா? காலைல சாப்டாச்சுங்களா? நான் இங்கேதான் இருக்கேங்கோ, என்ன வேணும்னாலும் சொல்லுங்க.`,
    sampleUserPhrasesTa: [
      'ஏனுங்க, நேத்து ராத்திரியில இருந்து கால் வலிக்குதுங்கோ, டாக்டர்ட்ட காட்டணும் போல இருக்கு.',
      'வெள்ளனே மாத்திரை போட மறந்துட்டேனுங்க, இப்போ போடலாமாங்கோ?',
      'இன்னைக்குச் சாப்பிடப் பிடிக்கலீங்க, லேசா இட்லி மட்டும் வேணும்ங்க.',
    ],
    ttsPronunciationStyle:
      'Speak in soft, polite Kongu Tamil rhythm (Coimbatore/Erode/Tiruppur) with gentle "-ங்க" and "-ங்கோ" honorifics, unhurried respectful pauses, and warm affectionate tone.',
    llmDialectGuidance:
      'Use warm, deeply respectful Kongu Tamil expressions naturally ("நல்லாருக்கீங்களா", "சாப்டாச்சுங்களா", "சரிங்கோ", "கவலைப்படாதீங்கோ", "வெள்ளனே", "பார்த்துக்கலாங்க", "மருந்து எடுத்துக்கிட்டீங்களா"). Understand Kongu idioms such as "ஏனுங்க", "வெள்ளனே" (early), "சரிங்கோ", "ஆகட்டும்ங்க". Never force English words.',
  },
  {
    id: 'madurai',
    nameTa: 'மதுரைத் தமிழ்',
    nameEn: 'Madurai Tamil',
    regionTa: 'மதுரை, திண்டுக்கல், தேனி, சிவகங்கை',
    regionEn: 'Madurai, Dindigul, Theni & Sivaganga',
    descriptionTa: 'பாசமும் உயிர்ப்பும் நிறைந்த மதுரைப் பேச்சு வழக்கு; இதமான மரியாதையுடன்.',
    descriptionEn: 'Affectionate, expressive Madurai Tamil with warm elder respect.',
    sampleLineTa:
      'வணக்கம், நல்லா இருக்கீகளா? எதுக்கும் கவலப்படாதீக. நான் உங்க பக்கத்துலயே இருக்கேன், மெதுவா பேசுங்க.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}! நல்லா இருக்கீகளா? காலையில சாப்டாச்சா? உடம்புக்கு இப்போ எப்படி இருக்கு, சொல்லுங்க.`,
    sampleUserPhrasesTa: [
      'இன்னைக்கு காலையில இருந்து முட்டி வலி அதிகமா இருக்கு, ஆஸ்பத்திரிக்குப் போகணும் போல இருக்கு.',
      'நான் இன்னைக்கு மருந்து போட்டேனா இல்லையான்னு கொஞ்சம் பாத்துச் சொல்லுங்க.',
      'நாளைக்குக் கோயிலுக்குப் போக ஒரு வண்டி சொல்லி விட முடியுமா?',
    ],
    ttsPronunciationStyle:
      'Speak in warm, affectionate Madurai spoken Tamil rhythm ("இருக்கீகளா", "கவலப்படாதீக", "பாத்துக்கிடுவோம்") with clear vowel warmth, respectful cadence, and calm pauses.',
    llmDialectGuidance:
      'Use affectionate, respectful Madurai Tamil conversational phrasing ("நல்லா இருக்கீகளா", "சாப்டீகளா", "கவலைப்படாதீக", "பாத்துக்கிடுவோம்", "மருந்து போட்டாச்சா", "கொஞ்சம் தண்ணி குடிங்க"). Understand Madurai expressions such as "எம்புட்டு", "சரிதானே", "அங்கன", "போயிட்டு வாரேன்". Keep Tamil pure and accessible.',
  },
  {
    id: 'tirunelveli',
    nameTa: 'திருநெல்வேலித் தமிழ்',
    nameEn: 'Tirunelveli Tamil',
    regionTa: 'திருநெல்வேலி, தூத்துக்குடி, தென்காசி',
    regionEn: 'Tirunelveli, Thoothukudi & Tenkasi',
    descriptionTa: 'இசையும் அன்பும் கலந்த நெல்லைச் சீமைத் தமிழ்; முதியவர்களுக்குப் பழக்கமான சொற்கள்.',
    descriptionEn: 'Melodic, warm Tirunelveli (Nellai) Tamil with gentle traditional phrasing.',
    sampleLineTa:
      'வணக்கம், சௌக்கியமா இருக்கீகளா? மனசைப் போட்டு அலட்டிக்காதீக. பொறுமையாச் சொல்லுங்க, நான் கூடவே இருக்கேன்.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}! சௌக்கியமா இருக்கீகளா? வெள்ளனே எந்திரிச்சு சாப்ட்டாச்சா? இன்னைக்கு என்ன உதவி வேணும்னு சொல்லுங்க.`,
    sampleUserPhrasesTa: [
      'எனக்கு வெள்ளனே மருந்து போட மறந்துபோச்சு, இப்போ சாப்ட்டுப் போடலாமா?',
      'கொஞ்ச நாளா கால் வலி தூர விலக மாட்டேங்குது, மருத்துவரைப் பாக்கணும்.',
      'மகளுக்குக் குரல் செய்தி ஒண்ணு அனுப்பி விடணுமே.',
    ],
    ttsPronunciationStyle:
      'Speak in gentle, melodic Tirunelveli (Nellai) Tamil intonation with soft rhythmic elongation, unhurried pauses, and comforting elder-care warmth.',
    llmDialectGuidance:
      'Use authentic, respectful Tirunelveli Tamil phrasing ("சௌக்கியமா இருக்கீகளா", "வெள்ளனே", "அலட்டிக்காதீக", "மருந்து போட்டாச்சா", "எல்லாம் சரியாப்போகும்", "பொறுமையாப் பேசலாம்"). Understand Nellai vocabulary such as "வெள்ளனே" (early), "அங்கன / இங்கன", "தூர", "சௌக்கியம்". Keep vocabulary pure Tamil.',
  },
  {
    id: 'thanjavur',
    nameTa: 'தஞ்சாவூர் தமிழ்',
    nameEn: 'Thanjavur Tamil',
    regionTa: 'தஞ்சாவூர், கும்பகோணம், திருவாரூர், திருச்சி டெல்டா',
    regionEn: 'Thanjavur, Kumbakonam, Tiruvarur & Cauvery Delta',
    descriptionTa: 'பண்பும் நிதானமும் நிறைந்த காவிரிப் பகுதித் தமிழ் நடை.',
    descriptionEn: 'Cultured, gentle, melodic Cauvery delta Tamil with unhurried poise.',
    sampleLineTa:
      'வணக்கம், சௌக்கியமா இருக்கீங்களா? நிதானமா உட்கார்ந்து பேசுங்க. உங்களுக்கு வேண்டியதை அன்பா ஏற்பாடு பண்றேன்.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}! நலமா இருக்கீங்களா? காலைப் பலகாரம் சாப்பிட்டாச்சா? இன்றைக்கு உடம்புக்கு இதமா இருக்கா?`,
    sampleUserPhrasesTa: [
      'இன்றைக்கு உடம்புக்குக் கொஞ்சம் சோர்வா இருக்கு, மருத்துவரிடம் கேட்கலாமா?',
      'சாயங்காலம் மருந்து வாங்கி வர ஆள் இருக்காங்களா?',
      'மதிய உணவுக்குப் பிறகு எடுக்க வேண்டிய மாத்திரை எது?',
    ],
    ttsPronunciationStyle:
      'Speak in gentle, cultured Thanjavur / Cauvery delta Tamil with smooth transitions, calm respectful tone, unhurried articulation, and peaceful pauses.',
    llmDialectGuidance:
      'Use graceful, respectful Thanjavur / delta Tamil ("சௌக்கியமா இருக்கீங்களா", "நிதானமா பார்த்துக்கலாம்", "ஆகட்டும்", "பலகாரம் சாப்பிட்டாச்சா", "மருந்து வேளைக்கு எடுத்துக்கிட்டீங்களா", "உடம்புக்குத் தேவலையா"). Keep speech pure, soothing, and completely free of unnecessary English.',
  },
  {
    id: 'salem',
    nameTa: 'சேலம் தமிழ்',
    nameEn: 'Salem Tamil',
    regionTa: 'சேலம், நாமக்கல், தருமபுரி, கிருஷ்ணகிரி',
    regionEn: 'Salem, Namakkal, Dharmapuri & Krishnagiri',
    descriptionTa: 'தெளிவான, அன்பான சேலம் வட்டாரப் பேச்சு நடை; எளிதில் புரியும் சொற்கள்.',
    descriptionEn: 'Clear, grounded, friendly Salem region Tamil easy for elders to follow.',
    sampleLineTa:
      'வணக்கங்க, நல்லாருக்கீங்களா? ஒண்ணும் கவலைப்படாதீங்க, நான் உங்க பக்கத்துலயே இருக்கேன். மெதுவா சொல்லுங்க.',
    greetingTemplateTa: (elderName) =>
      `வணக்கங்க ${elderName}! நல்லாருக்கீங்களா? சாப்டீங்களா? இன்னைக்கு நான் உங்களுக்கு என்ன உதவி பண்ணட்டும்?`,
    sampleUserPhrasesTa: [
      'காலையில இருந்து லேசா தலை சுத்துற மாதிரி இருக்குங்க, என்ன பண்ணலாம்?',
      'மருந்துப் பெட்டியில மாத்திரை தீர்ந்துபோச்சுங்க, புதுசா வாங்கணும்.',
      'நாளைக்கு ஆஸ்பத்திரிக்குப் போக வண்டி ஏற்பாடு பண்ணித் தாங்க.',
    ],
    ttsPronunciationStyle:
      'Speak in clear, friendly, warm Salem Tamil cadence with gentle "-ங்க" endings, unhurried clarity, and comforting conversational pacing.',
    llmDialectGuidance:
      'Use clear, warm Salem Tamil expressions ("நல்லாருக்கீங்களா", "ஒண்ணும் பிரச்சனையில்லீங்க", "மருந்த மறக்காம போட்டுக்கோங்க", "மெதுவா நடங்க", "இப்பவே ஏற்பாடு பண்ணிடுவோம்"). Avoid abruptness and avoid English loanwords.',
  },
  {
    id: 'kanyakumari',
    nameTa: 'நாகர்கோவில் / குமரித் தமிழ்',
    nameEn: 'Nagercoil / Kanyakumari Tamil',
    regionTa: 'நாகர்கோவில், கன்னியாகுமரி, மார்த்தாண்டம்',
    regionEn: 'Nagercoil, Kanyakumari & Marthandam',
    descriptionTa: 'இனிமையும் அமைதியும் கொண்ட நாஞ்சில் நாட்டு குமரித் தமிழ் நடை.',
    descriptionEn: 'Gentle, lyrical Nagercoil / Kanyakumari Tamil of southern Tamil Nadu.',
    sampleLineTa:
      'வணக்கம், சுகமா இருக்கீங்களா? பயப்பட வேண்டாம், எல்லாம் சரியாகும். மெதுவாச் சொல்லுங்க, நான் கேட்டுக்கிட்டு இருக்கேன்.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}! சுகமா இருக்கீங்களா? காலை உணவு முடிஞ்சுதா? இன்று உங்களுக்கு என்ன உதவி வேணும்னு சொல்லுங்கோ.`,
    sampleUserPhrasesTa: [
      'நான் காலையில மருந்து குடிச்சாச்சு, ஆனா இன்னும் வலி குறையல.',
      'மருத்துவரைப் பார்க்க ஒரு வண்டி சொல்லித் தர முடியுமா?',
      'இன்னைக்குத் தண்ணீர் எத்தனை குவளை குடிச்சிருக்கேன்னு சொல்லுங்க.',
    ],
    ttsPronunciationStyle:
      'Speak in gentle, lyrical Nagercoil / Kanyakumari (Nanjil Nadu) Tamil cadence with calm phrasing, warm inflection, and unhurried pauses.',
    llmDialectGuidance:
      'Use gentle, authentic Kanyakumari / Nagercoil Tamil phrasing ("சுகமா இருக்கீங்களா", "மருந்து குடிச்சீங்களா", "பயப்பட வேண்டாம்", "சௌக்கியமாகும்", "கொஞ்சம் ஓய்வெடுங்கோ", "முடிஞ்சுதா"). Understand Kumari expressions such as "மருந்து குடிக்க" (taking medicine), "சுகம்" (wellbeing), "இருக்கியள்", "நிறைய". Keep Tamil pure and comforting.',
  },
  {
    id: 'neutral',
    nameTa: 'மரபு மற்றும் பொதுத் தமிழ்',
    nameEn: 'Traditional & Neutral Tamil',
    regionTa: 'தமிழ்நாடு முழுவதும் புரியும் தெளிவான பொதுத் தமிழ்',
    regionEn: 'Clear respectful Tamil understood across Tamil Nadu',
    descriptionTa: 'தெளிவான இலக்கணத்துடன் கூடிய எளிய, மரியாதையான பொதுத் தமிழ்.',
    descriptionEn: 'Clean, grammatically sound, warm standard Tamil easy for every elder.',
    sampleLineTa:
      'வணக்கம். நலமாக இருக்கிறீர்களா? அவசரமில்லை, நீங்கள் விரும்பும் நேரத்தில் நிதானமாகப் பேசலாம். நான் உங்களுடனே இருக்கிறேன்.',
    greetingTemplateTa: (elderName) =>
      `வணக்கம் ${elderName}! நலமாக இருக்கிறீர்களா? இன்று உங்கள் உடல்நலம் எப்படி உள்ளது? நான் உங்களுக்கு உதவ இங்கே இருக்கிறேன்.`,
    sampleUserPhrasesTa: [
      'எனக்கு முழங்கால் வலி உள்ளது. மருத்துவரைப் பார்க்க வேண்டும்.',
      'நாளை மருத்துவமனைக்குச் செல்ல ஒரு வாகனம் ஏற்பாடு செய்யுங்கள்.',
      'இன்று நான் எடுக்க வேண்டிய மருந்துகள் என்ன என்று கூறுங்கள்.',
    ],
    ttsPronunciationStyle:
      'Speak in clear, pure, unhurried standard spoken Tamil with warm intonation, crisp yet soft syllables, and thoughtful pauses between clauses.',
    llmDialectGuidance:
      'Use pure, grammatically correct, warm and simple everyday Tamil understood across all regions of Tamil Nadu ("நலமாக இருக்கிறீர்களா", "தயவுசெய்து", "கவலைப்பட வேண்டாம்", "மருந்து எடுத்துக்கொண்டீர்களா"). Avoid stiff literary archaisms as well as English slang or Tanglish.',
  },
];

export const TAMIL_DIALECT_MAP: Record<TamilDialectId, TamilDialectConfig> = TAMIL_DIALECTS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<TamilDialectId, TamilDialectConfig>
);

export function getTamilDialectConfig(id?: string): TamilDialectConfig {
  if (id && id in TAMIL_DIALECT_MAP) {
    return TAMIL_DIALECT_MAP[id as TamilDialectId];
  }
  return TAMIL_DIALECT_MAP.neutral;
}

export function getTamilCompanionGreeting(
  dialectId: TamilDialectId | undefined,
  elderName: string
): string {
  const cfg = getTamilDialectConfig(dialectId);
  return cfg.greetingTemplateTa(elderName || 'அம்மா');
}

/**
 * Intelligent turn-level language detection:
 * - Tamil script -> 'ta'
 * - Devanagari script -> 'hi'
 * - Pure English/Latin script -> 'en' (supports natural switching when a Tamil elder speaks English)
 * - Mixed Tamil + English -> 'ta' (while preserving user's natural switching context)
 */
export function detectSpokenLanguage(
  text: string,
  profileLanguage: LanguageCode
): { replyLanguage: LanguageCode; hasTamil: boolean; hasEnglish: boolean; isMixedTamilEnglish: boolean } {
  const clean = (text || '').trim();
  const hasTamil = /[\u0B80-\u0BFF]/.test(clean);
  const hasHindi = /[\u0900-\u097F]/.test(clean);
  const latinWords = clean.match(/[A-Za-z]{2,}/g) || [];
  const hasEnglish = latinWords.length > 0;

  if (hasTamil && hasEnglish) {
    return { replyLanguage: 'ta', hasTamil: true, hasEnglish: true, isMixedTamilEnglish: true };
  }
  if (hasTamil) {
    return { replyLanguage: 'ta', hasTamil: true, hasEnglish: false, isMixedTamilEnglish: false };
  }
  if (hasHindi) {
    return { replyLanguage: 'hi', hasTamil: false, hasEnglish, isMixedTamilEnglish: false };
  }
  if (hasEnglish) {
    // Check if user actually typed Romanised Tamil keywords like "vanakkam", "marundhu", "vali"
    const romanTamilPattern =
      /\b(vanakkam|eppadi|irukkeenga|irukinga|saaptingala|saptingala|marundhu|maathirai|mathirai|kaal|vali|thanni|thanneer|vandi|nandri|amma|appa|aama|illa|sollunga|venum|podanum|paakkanum)\b/i;
    if (profileLanguage === 'ta' && romanTamilPattern.test(clean)) {
      return { replyLanguage: 'ta', hasTamil: false, hasEnglish: true, isMixedTamilEnglish: false };
    }
    return { replyLanguage: 'en', hasTamil: false, hasEnglish: true, isMixedTamilEnglish: false };
  }

  return {
    replyLanguage: profileLanguage || 'en',
    hasTamil: false,
    hasEnglish: false,
    isMixedTamilEnglish: false,
  };
}

export function detectDialectFromText(text: string): TamilDialectId | null {
  const lower = (text || '').toLowerCase();
  if (/chennai|சென்னை|மெட்ராஸ்/.test(lower)) return 'chennai';
  if (/kongu|coimbatore|kovai|erode|tiruppur|கொங்கு|கோவை|கோயம்புத்தூர்|ஈரோடு|திருப்பூர்/.test(lower)) return 'kongu';
  if (/madurai|மதுரை|திண்டுக்கல்|தேனி/.test(lower)) return 'madurai';
  if (/tirunelveli|nellai|thoothukudi|திருநெல்வேலி|நெல்லை|தூத்துக்குடி/.test(lower)) return 'tirunelveli';
  if (/thanjavur|tanjore|kumbakonam|trichy|தஞ்சாவூர்|தஞ்சை|கும்பகோணம்/.test(lower)) return 'thanjavur';
  if (/salem|சேலம்|நாமக்கல்|தருமபுரி/.test(lower)) return 'salem';
  if (/nagercoil|kanyakumari|kumari|நாகர்கோவில்|கன்னியாகுமரி|குமரி/.test(lower)) return 'kanyakumari';
  if (/neutral|traditional|பொது|மரபு|இயல்பு/.test(lower)) return 'neutral';
  return null;
}
