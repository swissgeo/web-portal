import type { UserConfig } from "vite";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// Only used by the demo app (`pnpm demo`, see index.html and src/dev.ts) and by
// vitest.config.ts, which merges it. The package itself is consumed as source
// and isn't built.
const config: UserConfig = {
  plugins: [tailwindcss(), vue(), vueDevTools()],
};

export default config;
