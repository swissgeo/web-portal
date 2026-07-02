import type { InjectionKey } from "vue";

interface EmbedConfig {
  stateId?: string;
  zoomOnlyCtrl: boolean;
}

const embedConfigKey: InjectionKey<EmbedConfig> = Symbol("embedConfig");

export function provideEmbedConfig(config: EmbedConfig) {
  provide(embedConfigKey, config);
}

export function useEmbedConfig(): EmbedConfig {
  return inject(embedConfigKey, { zoomOnlyCtrl: false });
}
