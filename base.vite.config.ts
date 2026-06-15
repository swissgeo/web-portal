type BaseBuildConfig = {
  minify: boolean;
  sourcemap: boolean;
};

export const getBaseBuildConfig = (mode: string): BaseBuildConfig => {
  const isDevelopment = mode === "development";

  return {
    minify: !isDevelopment,
    sourcemap: isDevelopment,
  };
};
