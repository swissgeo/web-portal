// Minimal vue-i18n stub for vitest.
// Replaces the real package (which is a transitive dep not directly accessible)
// so that components using useI18n() work in unit tests without a real i18n setup.
import { ref } from "vue";

const locale = ref("en");

export function useI18n() {
  return {
    t: (key: string) => key,
    locale,
  };
}

export function createI18n() {
  return {};
}

export function __setI18nLocale(nextLocale: string) {
  locale.value = nextLocale;
}
