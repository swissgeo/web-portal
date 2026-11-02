import { joinURL } from "ufo";

export function useCmsUrl() {
  const runtimeConfig = useRuntimeConfig();
  const { locale } = useI18n();

  /**
   * CMS does not have Romansh content, so we need to use German content for Romansh locale.
   */
  const localeKey = computed(() =>
    locale.value === "rm" ? "de" : locale.value,
  );

  function cmsUrl(path?: string): string {
    return joinURL(
      runtimeConfig.public.cmsBaseUrl,
      localeKey.value,
      path || "",
    );
  }

  return { cmsUrl };
}
