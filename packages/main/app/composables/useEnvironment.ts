/**
 * The environment the app is running in, derived from two sources:
 *
 * On one hand, `import.meta.dev` which is true for development builds and
 * local dev servers.
 * On the other hand, `runtimeConfig.public.testSiteBanner` which is set by the
 * deployed tests stagings (absent on prod)
 *
 */
export type Environment = "local" | "dev" | "int" | "preview" | "prod";

/**
 * Pure resolver, so it's possible to unit test it,
 * and mock it in other unit tests.
 */
export function resolveEnvironment(
  testSiteBanner: string,
  isLocalBuild: boolean,
): Environment {
  if (isLocalBuild) {
    return "local";
  }
  switch (testSiteBanner) {
    case "dev":
    case "int":
    case "preview":
      return testSiteBanner;
    default:
      return "prod";
  }
}

/**
 * In which environment the app currently runs.
 *
 * `isDebugToolEnabled` is used to enable debug tools (for example: the debug toolbar)
 * `isTestSite` is used to mark deployed test stagings (for example: the site banner)
 * `isLocalDev` is used to mark that we are in a local development server
 * `isProduction` is a guard in case we need to ensure something is only used in production
 * (for example: temporarily disable a feature which has a serious bug)
 * */
export function useEnvironment() {
  const environment = resolveEnvironment(
    useRuntimeConfig().public.testSiteBanner,
    import.meta.dev,
  );

  // environments which enables debugging tools
  const isDebugToolsEnabled =
    environment === "local" ||
    environment === "dev" ||
    environment === "preview";

  // environments which add a disclaimer banner
  const isTestSite =
    environment === "dev" || environment === "int" || environment === "preview";

  const isLocalDev = environment === "local";
  return {
    environment,
    isDebugToolsEnabled,
    isTestSite,
    isLocalDev,
    isProduction: environment === "prod",
  };
}
