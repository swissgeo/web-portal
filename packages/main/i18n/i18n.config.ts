// Only German is fully translated for now. The other locales only contain the
// mobile notice, every other string falls back to German.
export default defineI18nConfig(() => ({
  fallbackLocale: "de",
  fallbackWarn: false,
  missingWarn: false,
}));
