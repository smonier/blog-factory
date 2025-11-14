import { defineConfig, loadEnv } from "vite";
import jahia from "@jahia/vite-plugin";
import { spawnSync } from "node:child_process";

export default defineConfig(({ mode }) => {
  // Load .env file
  const env = loadEnv(mode, process.cwd(), "");

  return {
    // Expose csrfToken to the client
    define: {
      "import.meta.env.VITE_CSRF_TOKEN": JSON.stringify(env.csrfToken),
    },
    plugins: [
      jahia({
        // Default values:
        // inputDir: "src",
        // outputDir: "dist",
        // assetsDir: "assets",
        // client: {
        //   inputGlob: "**/*.client.{jsx,tsx}",
        //   outputDir: "client",
        // },
        // server: {
        //   inputGlob: "**/*.server.{jsx,tsx}",
        //   outputFile: "server/index.js",
        // },

        // This function is called every time a build succeeds in watch mode
        watchCallback() {
          spawnSync("yarn", ["watch:callback"], { stdio: "inherit", shell: true });
        },
      }),
    ],
  };
});
