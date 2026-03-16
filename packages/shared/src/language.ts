export const VALID_LOCALES = ['de', 'fr', 'it', 'en', 'rm'] as const
export type Lang = (typeof VALID_LOCALES)[number]
