import type { UserConfig } from 'vite'

export const getBaseBuildConfig = (mode: string): NonNullable<UserConfig['build']> => {
  const isDevelopment = mode === 'development'

  return {
    minify: !isDevelopment,
    sourcemap: isDevelopment,
  }
}
