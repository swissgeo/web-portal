export const useDatasetResource = createUseFetch({
  server: false,
  lazy: true,
  dedupe: "defer",
  retry: 0,
});
