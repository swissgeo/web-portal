export {};

declare global {
  // TODO there should be a better way than this, decoupling the package from the need for useRuntimeConfig
  // alltogether IMO
  const useRuntimeConfig: () => {
    what3wordsApiKey: string;
    geoadminApiBaseUrl: string;
    reportIssueServiceUrl: string;
    public: {
      ogcApiEndpoint: string;
      cmsBaseUrl: string;
      iconServiceEndpoint: string;
      drawingServiceEndpoint: string;
      printServiceUrl: string;
      ogcCatalogCollection: string;
      shareServiceUrl: string;
      wantedLogLevels: string;
      version: string;
      buildTime: string;
      maxFileSizeMB: number;
      drawingAllowedDomains: string[];
      featureFlags: {
        enableCmsSearch: boolean;
      };
    };
  };
}
