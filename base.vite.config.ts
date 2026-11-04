import { join } from "path";

/**
 * Alias for unplugin-dts only (not for Vite): rewrites `#foo/bar` subpath
 * imports to relative paths in the emitted .d.ts files. Without it the shipped
 * types keep `#foo/bar`, which resolves through the package's `imports` field to
 * `src/*.ts`, so consumers would type-check the package source instead of dist.
 *
 * `$1` survives unplugin-dts' path.relative() as a plain path segment and is
 * then substituted by String.replace().
 *
 * Remove once packages are consumed as source and no longer emit types.
 */
export const subpathImportsDtsAlias = (srcDir: string) => ({
  find: /^#([^/]+)/,
  replacement: join(srcDir, "$1"),
});

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
