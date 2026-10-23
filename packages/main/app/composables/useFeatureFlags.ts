type FeatureFlagsConfig = ReturnType<
  typeof useRuntimeConfig
>["public"]["featureFlags"];

type FlagPaths<T> = {
  [K in keyof T & string]: T[K] extends boolean ? K : `${K}.${FlagPaths<T[K]>}`;
}[keyof T & string];

export type FeatureFlagPath = FlagPaths<FeatureFlagsConfig>;

function collectFlagPaths(obj: object, prefix = ""): FeatureFlagPath[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "boolean") {
      return [path as FeatureFlagPath];
    }
    if (typeof value === "object" && value !== null) {
      return collectFlagPaths(value, path);
    }
    return [];
  });
}

export const useFeatureFlags = () => {
  const config = useRuntimeConfig();

  const allFlags = computed(() => collectFlagPaths(config.public.featureFlags));

  const cookie =
    useCookie<Partial<Record<FeatureFlagPath, boolean>>>("dev_feature_flags");

  const overrides = useState<Partial<Record<FeatureFlagPath, boolean>>>(
    "dev-feature-flag-overrides",
    () => (import.meta.dev ? { ...cookie.value } : {}),
  );

  if (import.meta.dev) {
    watch(
      overrides,
      (value) => {
        cookie.value = value;
      },
      { deep: true },
    );
  }

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

  const isOverridden = (path: FeatureFlagPath): boolean =>
    import.meta.dev && overrides.value[path] !== undefined;

  const setFlag = (path: FeatureFlagPath, value: boolean) => {
    const next = { ...overrides.value };
    if (value === readConfigFlag(path)) {
      delete next[path];
    } else {
      next[path] = value;
    }
    overrides.value = next;
  };

  const resetFlags = () => {
    overrides.value = {};
  };

  return {
    allFlags,
    overrides,
    isEnabled,
    isOverridden,
    setFlag,
    resetFlags,
  };
};
