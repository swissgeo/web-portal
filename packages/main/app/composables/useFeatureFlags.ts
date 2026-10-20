type FeatureFlagsConfig = ReturnType<
  typeof useRuntimeConfig
>["public"]["featureFlags"];

type FlagPaths<T> = {
  [K in keyof T & string]: T[K] extends boolean
    ? K
    : `${K}.${FlagPaths<T[K]>}`;
}[keyof T & string];

export type FeatureFlagPath = FlagPaths<FeatureFlagsConfig>;

export const useFeatureFlags = () => {
  const config = useRuntimeConfig();

  const overrides = useCookie<Partial<Record<FeatureFlagPath, boolean>>>(
    "dev_feature_flags",
    {
      default: () => ({}),
      watch: true,
    },
  );

  const readConfigFlag = (path: FeatureFlagPath): boolean => {
    let current: unknown = config.public.featureFlags;
    for (const key of path.split(".")) {
      if (typeof current !== "object" || current === null) {
        return false;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current === true;
  };

  const isEnabled = (path: FeatureFlagPath): boolean => {
    if (import.meta.dev) {
      const override = overrides.value[path];
      if (override !== undefined) {
        return override;
      }
    }
    return readConfigFlag(path);
  };

  const setFlag = (path: FeatureFlagPath, value: boolean) => {
    overrides.value = {
      ...overrides.value,
      [path]: value,
    };
  };

  const resetFlags = () => {
    overrides.value = {};
  };

  return {
    overrides,
    isEnabled,
    setFlag,
    resetFlags,
  };
};
