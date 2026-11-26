import type { LanguageCode } from '../types';
import {
  getSpeechLangTag,
  speechSynthesisService,
} from './speechSynthesisService';

export const voiceEngine = speechSynthesisService;

export function getSpeechRecognitionLang(lang: LanguageCode): string {
  return getSpeechLangTag(lang);
}
