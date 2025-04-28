// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";

import { template } from "./src/settings";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    integrations: [react(), tailwind(), sitemap()],
    site: 'https://benjhardy.github.io/',
    //base: 'main',
    vite: {
        resolve: {
          alias: {
            'kleur/colors.js': 'kleur', // Redirect colors.js to main entry
            'kleur/colors.mjs': 'kleur' // Redirect colors.mjs to main entry
          }
        }
      }
});
