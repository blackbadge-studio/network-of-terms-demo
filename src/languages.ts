import {InjectionKey, Ref, inject} from 'vue';
import {useI18n} from 'vue-i18n';
import type {LanguageString} from './query';

/**
 * The language the results are shown in. The visitor chooses it above the results, apart from the
 * language of the interface; where nothing provides a choice, it is the language of the interface.
 */
export const RESULT_LANGUAGE: InjectionKey<Ref<string>> = Symbol('resultLanguage');

export function useResultLanguage(): Ref<string> {
  const {locale} = useI18n();
  return inject(RESULT_LANGUAGE, null) ?? locale;
}

/** The strings of one language, and which language that is. */
export interface Picked {
  values: string[];
  language: string | null;
}

/**
 * What to show for the wanted language: the strings in that language and, where the source has
 * none, those in Dutch, then English, then the first other language it has. Nothing is translated;
 * `language` says which language the strings are in, so the page can name it when it is another one.
 */
export const pickLanguage = (strings: LanguageString[], wanted: string): Picked => {
  for (const language of [wanted, 'nl', 'en', ...strings.map(item => item.language)]) {
    const values = strings.filter(item => item.language === language).map(item => item.value);
    if (values.length > 0) {
      return {values, language};
    }
  }
  return {values: [], language: null};
};

/** A language by its name in the language of the interface (‘Frans’, ‘French’); its code where the browser has no name. */
export const languageName = (code: string, locale: string): string => {
  try {
    return new Intl.DisplayNames([locale], {type: 'language'}).of(code) ?? code;
  } catch {
    return code;
  }
};
