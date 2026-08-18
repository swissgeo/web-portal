/* eslint-disable @typescript-eslint/no-explicit-any */

import type { SearchResult } from "@swissgeo/search";
import type { ComputedRef, DefineComponent } from "vue";

export enum SidebarType {
  LAYER_CART = "layerCart",
  GEOCATALOG_TREE = "geocatalogTree",
  CONTENT = "content",
}

export declare const useUiStore: () => {
  currentSidebar: SidebarType | null;
  helpOverlayContentId: number | null;
  isWelcomeOverlayVisible: boolean;
  isSidebarOpen: ComputedRef<boolean>;
  isLayerCartVisible: ComputedRef<boolean>;
  isContentSidebarVisible: ComputedRef<boolean>;
  setSidebar: (type: SidebarType) => void;
  closeSidebar: () => void;
};

export declare const useSearchStore: () => {
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  hasError: boolean;
  hasResults: ComputedRef<boolean>;
  locationResults: ComputedRef<SearchResult[]>;
  layerResults: ComputedRef<SearchResult[]>;
  featureResults: ComputedRef<SearchResult[]>;
  setSearchQuery: (newQuery: string, lang?: string) => Promise<void>;
  selectResult: (result: SearchResult) => SearchResult;
  clearSearch: () => void;
};

export declare const IconButton: DefineComponent<any, any, any>;
export declare const ContentButton: DefineComponent<any, any, any>;
export declare const SideBar: DefineComponent<any, any, any>;

declare global {
  // TODO there should be a better way than this, decoupling the package from the need for useRuntimeConfig
  // alltogether IMO
  const useRuntimeConfig: () => {
    what3wordsApiKey: string;
    geoadminApiBaseUrl: string;
    shareServiceUrl: string;
    public: {
      ogcApiEndpoint: string;
      printServiceUrl: string;
      ogcCatalogCollection: string;
      shareServiceUrl: string;
      wantedLogLevels: string;
      version: string;
      buildTime: string;
      maxFileSizeMB: number;
    };
  };
}
