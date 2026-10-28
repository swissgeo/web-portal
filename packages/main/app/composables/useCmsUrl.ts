import { joinURL } from "ufo";

export function useCmsUrl() {
  const runtimeConfig = useRuntimeConfig();
  const { locale } = useI18n();

  function cmsUrl(path?: string): string {
    return joinURL(runtimeConfig.public.cmsBaseUrl, locale.value, path || "");
  }

  return { cmsUrl };
}
