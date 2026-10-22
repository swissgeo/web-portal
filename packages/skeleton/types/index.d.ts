export {};

declare global {
  // TODO there should be a better way than this, decoupling the package from the need for useRuntimeConfig
  // alltogether IMO
  const useRuntimeConfig: () => {
    what3wordsApiKey: string;
    geoadminApiBaseUrl: string;
    reportIssueServiceUrl: string;
    livingdocsApiEndpoint: string;
    public: {
      ogcApiEndpoint: string;
      cmsBaseUrl: string;
      iconServiceEndpoint: string;
      drawingServiceEndpoint: string;
      printServiceUrl: string;
      ogcCatalogCollection: string;
      shareServiceUrl: string;
      searchServiceUrl: string;
      thesaurusServiceUrl: string;
      wantedLogLevels: string;
      version: string;
      buildTime: string;
      maxFileSizeMB: number;
      drawingAllowedDomains: string[];
      testSiteBanner: string;
      featureFlags: {
        enableCmsSearch: boolean;
        enableMobileUi: boolean;
        enableFeatureInfo: boolean;
        enablePositionPopup: boolean;
        tools: {
          enableMeasure: boolean;
          enableCompare: boolean;
          enableDrawing: boolean;
          enableImport: boolean;
          enablePrint: boolean;
          enableShare: boolean;
        };
      };
    };
  };
}
